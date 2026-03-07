// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@kit/utils': path.resolve(__dirname, 'src/utils/cn.ts'),
    },
  },
  optimizeDeps: {
    include: ['@apollo/client'],
  },
})
