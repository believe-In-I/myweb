const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OSS = require('ali-oss');
const multer = require('multer');
const path = require('path');

// 加载环境变量
const envPath = path.join(__dirname, 'oss-config.env');
const fs = require('fs');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化OSS客户端（仅当配置完整时）
let ossClient = null;
let isOssConfigured = false;
console.log(process.env.OSS_ACCESS_KEY_ID,'process.env');

if (process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET && 
    process.env.OSS_BUCKET && process.env.OSS_ENDPOINT) {
  try {
    ossClient = new OSS({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      endpoint: process.env.OSS_ENDPOINT,
      region: process.env.OSS_REGION,
      cname: !!process.env.OSS_CNAME
    });
    isOssConfigured = true;
    console.log('✅ OSS客户端初始化成功');
  } catch (error) {
    console.error('❌ OSS客户端初始化失败:', error.message);
  }
} else {
  console.warn('⚠️  OSS配置不完整，OSS功能将不可用');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 文件上传中间件
const upload = multer({ storage: multer.memoryStorage() });

// 仅保留OSS上传相关的API端点

// 1. 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'OSS上传服务运行中',
    timestamp: new Date().toISOString(),
    ossConfigured: isOssConfigured
  });
});

// 2. 文件上传到OSS
app.post('/api/oss/upload', upload.single('file'), async (req, res) => {
  if (!isOssConfigured) {
    return res.status(500).json({ status: 'error', message: 'OSS未配置，无法上传文件' });
  }
  
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: '请选择要上传的文件' });
    }

    const file = req.file;
    const ossKey = req.body.key || `uploads/${Date.now()}-${file.originalname}`;
    const acl = req.body.acl || 'public-read';
    const contentType = req.body.contentType || file.mimetype;

    const result = await ossClient.put(ossKey, file.buffer, {
      acl,
      contentType
    });

    res.json({
      status: 'success',
      message: '文件上传成功',
      data: {
        key: result.name,
        url: result.url,
        size: file.size,
        contentType: contentType,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '文件上传失败',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 OSS上传服务运行在 http://localhost:${PORT}`);
  console.log(`📡 文件上传API: POST http://localhost:${PORT}/api/oss/upload`);
  console.log(`📡 健康检查API: GET http://localhost:${PORT}/api/health`);
  console.log(`\nPress Ctrl+C to stop the server`);
});
