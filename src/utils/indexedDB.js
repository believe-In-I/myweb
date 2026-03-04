/**
 * IndexedDB 封装工具类，使用方式类似于 localStorage
 */
class IndexedDBWrapper {
  constructor(dbName = 'localStorageDB', storeName = 'keyValueStore') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.readyPromise = this.init();
  }

  /**
   * 初始化数据库连接
   * @returns {Promise}
   */
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('打开数据库失败'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * 确保数据库连接已就绪
   * @returns {Promise}
   */
  async ensureReady() {
    await this.readyPromise;
    return this.db;
  }

  /**
   * 存储数据
   * @param {string} key - 键名
   * @param {any} value - 要存储的值
   * @returns {Promise}
   */
  async setItem(key, value) {
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
   * @returns {Promise<any>}
   */
  async getItem(key) {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject(new Error('获取数据失败'));
      };
    });
  }

  /**
   * 删除数据
   * @param {string} key - 键名
   * @returns {Promise}
   */
  async removeItem(key) {
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
   * @returns {Promise}
   */
  async clear() {
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
   * @returns {Promise<Array<string>>}
   */
  async getAllKeys() {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject(new Error('获取所有键名失败'));
      };
    });
  }

  /**
   * 获取所有数据
   * @returns {Promise<Array<{key: string, value: any}>>}
   */
  async getAll() {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        const values = event.target.result;
        const keys = [];
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (cursorEvent) => {
          const cursor = cursorEvent.target.result;
          if (cursor) {
            keys.push(cursor.key);
            cursor.continue();
          } else {
            const result = keys.map((key, index) => ({
              key,
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
   * @param {Object} conditions - 查询条件
   * @param {Array} conditions.types - 文件类型数组 ['image/', 'application/pdf']
   * @param {number} conditions.minSize - 最小大小
   * @param {number} conditions.maxSize - 最大大小
   * @param {number} conditions.startDate - 开始日期
   * @param {number} conditions.endDate - 结束日期
   * @param {string} conditions.nameKeyword - 文件名关键词
   * @param {boolean} conditions.exactMatch - 是否精确匹配
   * @returns {Promise<Array<{key: string, value: any, metadata: Object}>>}
   */
  async query(conditions = {}) {
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
      const results = [];

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (cursorEvent) => {
        const cursor = cursorEvent.target.result;
        if (cursor) {
          const key = cursor.key.toString();
          const value = cursor.value;
          
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
              if (!types.some(type => metadata.type.startsWith(type))) {
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
export default {
  setItem: async (key, value) => {
    await idbStorage.setItem(key, value);
  },
  getItem: async (key) => {
    return await idbStorage.getItem(key);
  },
  removeItem: async (key) => {
    await idbStorage.removeItem(key);
  },
  clear: async () => {
    await idbStorage.clear();
  },
  getAllKeys: async () => {
    return await idbStorage.getAllKeys();
  },
  getAll: async () => {
    return await idbStorage.getAll();
  },
  query: async (conditions) => {
    return await idbStorage.query(conditions);
  }
};

// 导出类，方便自定义配置
export { IndexedDBWrapper };