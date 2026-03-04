# myweb

示例 React + ECharts 项目（最小演示），并包含生成 npm 依赖关系图的脚本。

快速开始：

```powershell
cd c:\Users\Lenovo\Desktop\myweb
npm install
# 导出依赖树
npm ls --all --json > deps.json
# 生成 DOT 图
node .\scripts\generate-deps.js deps.json deps.dot
# (可选) 使用 Graphviz 将 deps.dot 转为图片
dot -Tpng deps.dot -o deps.png
```

输出文件：
- `deps.json` - `npm ls` 导出的原始依赖树 JSON
- `deps.dot` - Graphviz DOT 格式的依赖关系图

如果你想运行开发服务器：

```powershell
npm run start
```

（需要 `vite` 已安装）
