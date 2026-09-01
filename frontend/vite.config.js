import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // 端口被占时直接报错，而不是静默漂到 5174/5175。
    // 前端只认 5173 一个地址，被占用说明应用已经在跑了（多半是 Docker 那份）。
    strictPort: true,
    proxy: {
      '/api/python': {
        target: process.env.VITE_PYTHON_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/python/, '')
      }
    }
  }
})
