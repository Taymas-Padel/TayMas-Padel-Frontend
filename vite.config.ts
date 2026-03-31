import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['486b-2a03-32c0-3007-1ec-a4dd-84b2-a324-a644.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://213.155.23.227',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
