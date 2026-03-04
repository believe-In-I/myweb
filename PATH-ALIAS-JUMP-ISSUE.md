# 路径别名跳转问题解决方案

## 问题描述
用户使用 `import aa from '@/components/DatabaseSchemaComponent'` 时，鼠标点击 `Ctrl+左键` 无法跳转到目标文件。

## 问题原因
现代 IDE 和编辑器在处理路径别名时，需要明确的文件扩展名才能正确支持跳转功能。

## 解决方案

### 1. 添加文件扩展名
将导入语句修改为包含明确的文件扩展名：

**修改前（可能无法跳转）:**
```javascript
import aa from '@/components/DatabaseSchemaComponent'
```

**修改后（支持跳转）:**
```javascript
import aa from '@/components/DatabaseSchemaComponent.jsx'
```

### 2. 已修复的文件
- `src/DatabaseSchemaPage.jsx` - 已添加 `.jsx` 扩展名

### 3. 路径别名配置确认

#### Vite 配置 (vite.config.mjs)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

#### TypeScript 配置 (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### 类型声明 (src/vite-env.d.ts)
已创建类型声明文件支持 TypeScript 识别路径别名。

## 正确的导入方式

### ✅ 支持跳转的导入方式
```javascript
// 明确指定文件扩展名
import Component from '@/components/DatabaseSchemaComponent.jsx'
import utils from '@/utils/helpers.js'
import data from '@/data.js'
import styles from '@/styles/global.css'
```

### ❌ 可能无法跳转的导入方式
```javascript
// 缺少文件扩展名
import Component from '@/components/DatabaseSchemaComponent'
import utils from '@/utils/helpers'
```

## 编辑器/IDE 配置建议

### VS Code
确保安装并启用以下扩展：
- TypeScript and JavaScript Language Features
- Auto Rename Tag
- Prettier - Code formatter

### WebStorm/IntelliJ
路径别名通常开箱即用，但确保：
- File > Settings > Editor > Code Style > JavaScript
- 启用 "ES6" 模块系统

## 常见问题排查

1. **构建失败**
   - 确保所有文件路径正确
   - 检查文件扩展名是否匹配实际文件

2. **TypeScript 报错**
   - 确认 `tsconfig.json` 中路径映射配置正确
   - 检查 `src/vite-env.d.ts` 类型声明

3. **路径别名不生效**
   - 重启开发服务器
   - 重新加载编辑器/IDE

## 验证方法

1. 运行 `npm run build` 确保构建成功
2. 在编辑器中使用 `Ctrl+左键` 点击导入的路径
3. 确认能正确跳转到目标文件

## 示例使用

现在所有路径别名导入都支持编辑器跳转：

```javascript
// 在 DatabaseSchemaPage.jsx 中
import React from 'react';
import DatabaseSchemaComponent from './components/DatabaseSchemaComponent';
import aa from '@/components/DatabaseSchemaComponent.jsx' // ✅ 支持跳转

export default function DatabaseSchemaPage() {
  return (
    <div>
      <aa />
    </div>
  );
}
```

构建测试已通过，路径别名配置完全正常工作！