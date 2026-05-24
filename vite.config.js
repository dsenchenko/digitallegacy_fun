import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Use 127.0.0.1 — on macOS "localhost" often resolves to ::1 first,
        // but the API server listens on IPv4 only, which breaks auth cookies.
        target: 'http://127.0.0.1:3456',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3456',
        changeOrigin: true,
        ws: true,
      },
      '/digitallegacyua': {
        target: 'http://127.0.0.1:3456',
        changeOrigin: true,
      },
    },
  },
});
