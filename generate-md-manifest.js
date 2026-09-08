const fs = require('fs');
const path = require('path');

// 扫描目录：public/data
const DATA_DIR = path.join(__dirname, '../public/data');
// 输出清单到 public/md-manifest.json
const OUTPUT_PATH = path.join(__dirname, '../public/md-manifest.json');

// 读取所有 .md 文件
const files = fs.readdirSync(DATA_DIR).filter(name => name.endsWith('.md'));

const manifest = files.map(filename => {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const firstLine = content.split(/\r?\n/)[0] || '';
  // 提取 # 标题
  const titleMatch = firstLine.match(/^#\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  return {
    name: filename,
    path: `/data/${filename}`,
    title: title,
  };
});

// 写入 JSON
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✅ 生成成功：共 ${manifest.length} 个 MD 文件`);