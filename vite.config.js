import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // 相对 base：兼容 GitHub Pages 子路径部署（如 /<repo>/），同时不破坏本地 dev 直接访问
  base: './',
  server: { host: '127.0.0.1' },
  // MPA 多入口（2026-10-09 嵌入集团 APP 方案·方案A）：
  //   index.html → 独立原型（不变）；embed.html → 集团 APP 嵌入形态（独立入口，物理隔离，回滚只删文件）
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        embed: resolve(__dirname, 'embed.html'),
      },
    },
  },
});
