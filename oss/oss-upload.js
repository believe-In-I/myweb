/**
 * OSS上传功能
 * 需要安装依赖：npm install ali-oss
 */

const OSS = require('ali-oss');

/**
 * OSS配置参数
 * 需要在环境变量或配置文件中设置以下值：
 */
const ossConfig = {
  // 必填：从控制台获取的访问密钥ID
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'your_access_key_id',
  
  // 必填：从控制台获取的访问密钥Secret
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'your_access_key_secret',
  
  // 必填：OSS Bucket名称
  bucket: process.env.OSS_BUCKET || 'your_bucket_name',
  
  // 必填：OSS服务器地址（Endpoint）
  // 格式：https://oss-{region}.aliyuncs.com
  // region如：oss-cn-hangzhou, oss-cn-beijing, oss-cn-shanghai等
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
  
  // 可选：自定义域名（如果使用了自定义域名） 
  cname: false,
  
  // 可选：区域标识
  region: process.env.OSS_REGION || 'oss-cn-hangzhou'
};

/**
 * 初始化OSS客户端
 */
function initOSSClient() {
  try {
    const client = new OSS(ossConfig);
    return client;
  } catch (error) {
    console.error('OSS客户端初始化失败:', error);
    throw error;
  }
}

/**
 * 上传单个文件到OSS
 * @param {string} localFilePath - 本地文件路径
 * @param {string} ossKey - OSS上的存储路径/文件名
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 上传结果
 */
async function uploadFile(localFilePath, ossKey, options = {}) {
  const client = initOSSClient();
  
  try {
    const result = await client.put(ossKey, localFilePath, {
      // 可选：设置文件访问权限
      // 'public-read'：公共读
      // 'private'：私有（默认）
      // 'public-read-write'：公共读写
     acl: options.acl || 'private',
      
      // 可选：设置Content-Type
      contentType: options.contentType || 'application/octet-stream',
      
      // 可选：设置元数据
      meta: options.meta || {},
      
      // 可选：设置自定义请求头
      headers: options.headers || {}
    });
    
    console.log('文件上传成功:', {
      name: result.name,
      url: result.url,
      size: result.size,
      status: result.status
    });
    
    return result;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
}

/**
 * 上传Buffer数据到OSS
 * @param {Buffer} buffer - Buffer数据
 * @param {string} ossKey - OSS上的存储路径/文件名
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 上传结果
 */
async function uploadBuffer(buffer, ossKey, options = {}) {
  const client = initOSSClient();
  
  try {
    const result = await client.put(ossKey, buffer, {
      acl: options.acl || 'private',
      contentType: options.contentType || 'application/octet-stream',
      meta: options.meta || {},
      headers: options.headers || {}
    });
    
    console.log('Buffer上传成功:', result);
    return result;
  } catch (error) {
    console.error('Buffer上传失败:', error);
    throw error;
  }
}

/**
 * 上传字符串内容到OSS
 * @param {string} content - 字符串内容
 * @param {string} ossKey - OSS上的存储路径/文件名
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 上传结果
 */
async function uploadString(content, ossKey, options = {}) {
  const buffer = Buffer.from(content, 'utf8');
  return await uploadBuffer(buffer, ossKey, {
    ...options,
    contentType: options.contentType || 'text/plain; charset=utf-8'
  });
}

/**
 * 批量上传文件
 * @param {Array} fileList - 文件列表 [{localPath, ossKey, options}]
 * @param {Object} globalOptions - 全局可选配置
 * @returns {Promise<Array>} 上传结果数组
 */
async function batchUpload(fileList, globalOptions = {}) {
  const client = initOSSClient();
  const results = [];
  
  for (const fileInfo of fileList) {
    try {
      const result = await client.put(fileInfo.ossKey, fileInfo.localPath, {
        ...globalOptions,
        ...fileInfo.options
      });
      results.push({ success: true, data: result, file: fileInfo });
    } catch (error) {
      results.push({ success: false, error: error.message, file: fileInfo });
    }
  }
  
  return results;
}

/**
 * 下载文件
 * @param {string} ossKey - OSS上的文件路径
 * @param {string} localPath - 本地保存路径
 * @returns {Promise<Object>} 下载结果
 */
async function downloadFile(ossKey, localPath) {
  const client = initOSSClient();
  
  try {
    const result = await client.get(ossKey, localPath);
    console.log('文件下载成功:', result);
    return result;
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
}

/**
 * 获取文件信息
 * @param {string} ossKey - OSS上的文件路径
 * @returns {Promise<Object>} 文件信息
 */
async function getFileInfo(ossKey) {
  const client = initOSSClient();
  
  try {
    const result = await client.head(ossKey);
    console.log('文件信息:', result);
    return result;
  } catch (error) {
    console.error('获取文件信息失败:', error);
    throw error;
  }
}

/**
 * 删除文件
 * @param {string} ossKey - OSS上的文件路径
 * @returns {Promise<Object>} 删除结果
 */
async function deleteFile(ossKey) {
  const client = initOSSClient();
  
  try {
    const result = await client.delete(ossKey);
    console.log('文件删除成功:', result);
    return result;
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
}

/**
 * 列出目录下的文件
 * @param {string} prefix - 文件前缀/目录路径
 * @param {Object} options - 可选配置
 * @returns {Promise<Array>} 文件列表
 */
async function listFiles(prefix = '', options = {}) {
  const client = initOSSClient();
  
  try {
    const result = await client.list({
      prefix: prefix,
      'max-keys': options.maxKeys || 1000,
      marker: options.marker || ''
    });
    
    console.log('文件列表获取成功:', result.objects);
    return result.objects || [];
  } catch (error) {
    console.error('获取文件列表失败:', error);
    throw error;
  }
}

/**
 * 生成分享链接（临时访问URL）
 * @param {string} ossKey - OSS上的文件路径
 * @param {number} expires - 过期时间（秒），默认3600秒（1小时）
 * @returns {string} 临时访问URL
 */
function generateSignedUrl(ossKey, expires = 3600) {
  const client = initOSSClient();
  
  try {
    const url = client.signatureUrl(ossKey, { expires });
    console.log('生成分享链接成功:', url);
    return url;
  } catch (error) {
    console.error('生成分享链接失败:', error);
    throw error;
  }
}

// 导出所有函数
module.exports = {
  initOSSClient,
  uploadFile,
  uploadBuffer,
  uploadString,
  batchUpload,
  downloadFile,
  getFileInfo,
  deleteFile,
  listFiles,
  generateSignedUrl,
  ossConfig
};

// 使用示例
if (require.main === module) {
  // 示例：上传单个文件
  async function example() {
    try {
      // 上传文件
      const result = await uploadFile('./local-file.txt', 'uploads/example.txt', {
        acl: 'public-read',
        contentType: 'text/plain'
      });
      
      // 生成分享链接
      const shareUrl = generateSignedUrl('uploads/example.txt', 7200);
      console.log('分享链接:', shareUrl);
      
      // 获取文件信息
      const fileInfo = await getFileInfo('uploads/example.txt');
      console.log('文件信息:', fileInfo);
      
    } catch (error) {
      console.error('操作失败:', error);
    }
  }
  
  example();
}