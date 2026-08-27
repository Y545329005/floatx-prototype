import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对 base：兼容 GitHub Pages 子路径部署（如 /<repo>/），同时不破坏本地 dev 直接访问
  base: './',
  server: { host: '127.0.0.1' },
});
