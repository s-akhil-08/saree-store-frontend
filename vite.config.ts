import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { defineConfig } from 'vite'

const compressionPlugin = (viteCompression as any).default || viteCompression
const imageOptimizerPlugin = (ViteImageOptimizer as any).default || ViteImageOptimizer

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    imageOptimizerPlugin({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 75 },
    }),
    compressionPlugin({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    compressionPlugin({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router-dom/')) {
            return 'react-router';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide-react';
          }
        },
      },
    },
  },
})