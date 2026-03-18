import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',              // 打包后的文件输出到 dist 文件夹
    emptyOutDir: true,           // 每次打包前自动清空 dist 文件夹，避免残留旧文件
    rollupOptions: {              // 暴露 Rollup 的配置选项
      output: {                   // 控制输出文件的命名规则
        entryFileNames: 'assets/[name]-[hash].js',     // 入口 JS 文件命名
        chunkFileNames: 'assets/[name]-[hash].js',     // 异步加载的 JS 文件命名
        assetFileNames: 'assets/[name]-[hash].[ext]'   // 其他资源（CSS、图片等）命名
      }
    }
  },
})
