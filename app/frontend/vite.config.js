import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Allow network access
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://api-gateway:8080',
                changeOrigin: true
            },
            '/ws': {
                target: 'ws://tictac-game:3030',
                ws: true
            },
            '/socket.io': {
                target: 'http://api-gateway:8080',
                changeOrigin: true,
                ws: true
            }
        }
    }
});
