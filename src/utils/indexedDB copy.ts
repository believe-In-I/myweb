/**
 * IndexedDB 封装工具类，使用方式类似于 localStorage
 */
interface Metadata {
  type?: string;
  size?: number;
  date?: number;
  [key: string]: any; // 允许自定义元数据字段
}

interface StoredValue {
  metadata?: Metadata;
  [key: string]: any; // 允许值包含其他自定义字段
}

interface QueryConditions {
  types?: string[];
  minSize?: number;
  maxSize?: number;
  startDate?: number;
  endDate?: number;
  nameKeyword?: string;
  exactMatch?: boolean;
}

type IDBValidKey = string | number | Date | ArrayBuffer | ArrayBufferView | any[] | any;

interface QueryResult {
  key: IDBValidKey;
  value: StoredValue;
}

interface GetAllResult {
  key: string;
  value: StoredValue;
}

class IndexedDBWrapper {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null;
  private readyPromise: Promise<IDBDatabase>;

  constructor(dbName: string = 'localStorageDB', storeName: string = 'keyValueStore') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.readyPromise = this.init();
  }

  /**
   * 初始化数据库连接
   * @returns {Promise<IDBDatabase>}
   */
  private init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('打开数据库失败'));
      };

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBOpenDBRequest;
        this.db = target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * 确保数据库连接已就绪
   * @returns {Promise<IDBDatabase>}
   */
  private async ensureReady(): Promise<IDBDatabase> {
    await this.readyPromise;
    if (!this.db) {
      throw new Error('数据库连接未初始化');
    }
    return this.db;
  }

  /**
   * 存储数据
   * @param {string} key - 键名
   * @param {StoredValue} value - 要存储的值
   * @returns {Promise<void>}
   */
  async setItem(key: string, value: StoredValue): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('存储数据失败'));
      };
    });
  }

  /**
   * 获取数据
   * @param {string} key - 键名
   * @returns {Promise<StoredValue | undefined>}
   */
  async getItem(key: string): Promise<StoredValue | undefined> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBRequest<StoredValue>;
        resolve(target.result);
      };

      request.onerror = () => {
        reject(new Error('获取数据失败'));
      };
    });
  }

  /**
   * 删除数据
   * @param {string} key - 键名
   * @returns {Promise<void>}
   */
  async removeItem(key: string): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('删除数据失败'));
      };
    });
  }

  /**
   * 清空所有数据
   * @returns {Promise<void>}
   */
  async clear(): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('清空数据失败'));
      };
    });
  }

  /**
   * 获取所有键名
   * @returns {Promise<string[]>}
   */
  async getAllKeys(): Promise<string[]> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBRequest<IDBValidKey[]>;
        resolve(target.result.map(key => key.toString()));
      };

      request.onerror = () => {
        reject(new Error('获取所有键名失败'));
      };
    });
  }

  /**
   * 获取所有数据
   * @returns {Promise<GetAllResult[]>}
   */
  async getAll(): Promise<GetAllResult[]> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBRequest<StoredValue[]>;
        const values = target.result;
        const keys: IDBValidKey[] = [];
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (cursorEvent: Event) => {
          const cursorTarget = cursorEvent.target as IDBRequest<IDBCursorWithValue | null>;
          const cursor = cursorTarget.result;
          if (cursor) {
            keys.push(cursor.key);
            cursor.continue();
          } else {
            const result = keys.map((key, index) => ({
              key: key.toString(),
              value: values[index]
            }));
            resolve(result);
          }
        };

        cursorRequest.onerror = () => {
          reject(new Error('获取所有数据失败'));
        };
      };

      request.onerror = () => {
        reject(new Error('获取所有数据失败'));
      };
    });
  }

  /**
   * 复杂条件查询数据
   * @param {QueryConditions} conditions - 查询条件
   * @returns {Promise<QueryResult[]>}
   */
  async query(conditions: QueryConditions = {}): Promise<QueryResult[]> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const {
        types = [],
        minSize = 0,
        maxSize = Infinity,
        startDate = 0,
        endDate = Infinity,
        nameKeyword = '',
        exactMatch = false
      } = conditions;

      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results: QueryResult[] = [];

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (cursorEvent: Event) => {
        const cursorTarget = cursorEvent.target as IDBRequest<IDBCursorWithValue | null>;
        const cursor = cursorTarget.result;
        if (cursor) {
          const key = cursor.key.toString();
          const value = cursor.value as StoredValue;

          // 检查是否满足所有条件
          let match = true;

          // 检查文件名关键词
          if (nameKeyword) {
            if (exactMatch) {
              if (key !== nameKeyword) {
                match = false;
              }
            } else {
              if (!key.includes(nameKeyword)) {
                match = false;
              }
            }
          }

          // 检查其他条件（需要数据中包含相应的metadata）
          if (match && typeof value === 'object' && value.metadata) {
            const metadata = value.metadata;

            // 检查文件类型
            if (types.length > 0 && metadata.type) {
              if (!types.some(type => metadata?.type?.startsWith(type))) {
                match = false;
              }
            }

            // 检查文件大小
            if (metadata.size) {
              if (metadata.size < minSize || metadata.size > maxSize) {
                match = false;
              }
            }

            // 检查日期
            if (metadata.date) {
              if (metadata.date < startDate || metadata.date > endDate) {
                match = false;
              }
            }
          }

          if (match) {
            results.push({ key: cursor.key, value: cursor.value });
          }

          cursor.continue();
        } else {
          resolve(results);
        }
      };

      cursorRequest.onerror = () => {
        reject(new Error('查询数据失败'));
      };
    });
  }
}

// 导出默认实例，使用方式类似于 localStorage
const idbStorage = new IndexedDBWrapper();

// 兼容 localStorage 的 API
const indexedDBStorage = {
  setItem: async (key: string, value: StoredValue): Promise<void> => {
    await idbStorage.setItem(key, value);
  },
  getItem: async (key: string): Promise<StoredValue | undefined> => {
    return await idbStorage.getItem(key);
  },
  removeItem: async (key: string): Promise<void> => {
    await idbStorage.removeItem(key);
  },
  clear: async (): Promise<void> => {
    await idbStorage.clear();
  },
  getAllKeys: async (): Promise<string[]> => {
    return await idbStorage.getAllKeys();
  },
  getAll: async (): Promise<GetAllResult[]> => {
    return await idbStorage.getAll();
  },
  query: async (conditions: QueryConditions): Promise<QueryResult[]> => {
    return await idbStorage.query(conditions);
  }
};

export default indexedDBStorage;

// 导出类和类型，方便自定义配置
export { IndexedDBWrapper };
export type { Metadata, StoredValue, QueryConditions, QueryResult, GetAllResult };