import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://api-gateway:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://tictac-game:3030',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/socket.io': {
        target: 'http://api-gateway:8080',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
