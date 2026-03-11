import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Unfonts from 'unplugin-fonts/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import vitePluginCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    Unfonts({
      fontsource: {
        families: [
          {
            name: 'Inter',
            weights: [400, 500, 600, 700],
            subset: 'latin',
          }
        ]
      }
    }),
    visualizer({ open: false, filename: "stats.html" }), // Do not open automatically in CLI environment
    // 输出 Gzip 压缩文件
    vitePluginCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 仅压缩大于 10KB 的文件
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // 输出 Brotli 压缩文件
    vitePluginCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'xloudmax Blog',
        short_name: 'C404 Blog',
        description: 'A personal blog and playground.',
        theme_color: '#000000',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    }) as any // Cast to any to bypass vite/rollup type mismatch
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@kit/utils': path.resolve(__dirname, 'src/utils/cn.ts'),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
    include: ['@apollo/client'],
  },
  build: {
    rollupOptions: {
      // Allow Rollup defaults to handle fine-grained chunking
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    'import.meta.env.VITE_STATIC_EXPORT': JSON.stringify('false'),
  },
})
