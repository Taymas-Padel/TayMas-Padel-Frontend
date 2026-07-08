import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['taymaspadel.newlevelhub.kz'],
    proxy: {
      '/api': {
        target: 'https://taymaspadel.newlevelhub.kz',
        changeOrigin: true,
        secure: true,
      },
      '/media': {
        target: 'https://taymaspadel.newlevelhub.kz',
        changeOrigin: true,
        secure: true,
      },
      '/static': {
        target: 'https://taymaspadel.newlevelhub.kz',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
