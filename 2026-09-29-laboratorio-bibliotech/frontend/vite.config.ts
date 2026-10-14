import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sin @types/node a proposito (frontend liviano): solo API_PROXY para compose dev.
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true, proxy: { '/api': { target: process.env['API_PROXY'] ?? 'http://localhost:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') } } },
  test: { environment: 'node' },
});
