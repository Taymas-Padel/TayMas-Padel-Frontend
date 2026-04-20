import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['3ea1-37-151-151-73.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'https://213.155.23.227',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'https://213.155.23.227',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'https://213.155.23.227',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
