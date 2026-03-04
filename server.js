const express = require('express');
const compression = require('compression');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 启用 gzip/Brotli 压缩
app.use(compression({
  level: 6, // 压缩级别 (0-9)
  threshold: 1024, // 超过 1KB 的文件才压缩
  filter: (req, res) => {
    // 只压缩静态文件
    const contentType = res.getHeader('Content-Type');
    return /^(text|application)/.test(contentType);
  }
}));

// 启用 CORS
app.use(cors());

// 设置静态文件服务和缓存策略
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // 静态资源缓存 1 年
  etag: true, // 启用 ETag
  lastModified: true, // 启用 Last-Modified
  setHeaders: (res, path) => {
    // 对不同类型的文件设置不同的缓存策略
    const ext = path.extname(path);
    
    // 对于 HTML 文件，设置较短的缓存时间
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // 对于 CSS、JS、图片等静态资源，设置较长的缓存时间
    else if (['.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// 处理所有请求，返回 index.html（用于单页应用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${path.join(__dirname, 'dist')}`);
  console.log(`⚡ 已启用 gzip/Brotli 压缩`);
  console.log(`💾 已设置浏览器缓存策略`);
  console.log(`\nPress Ctrl+C to stop the server`);
});