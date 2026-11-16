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
      output: {
        // 正式法务文本（约 76KB）单独成块：不挤占 router 主块（2026-10-22）
        // 数据层（2026-11-13）：委托账户体系把 data.js 撑过 500KB 阈值，拆独立块——
        // 它被所有懒加载页面共享，单独成块既消警告又提高缓存命中（改页面不必重下整包）。
        manualChunks(id) {
          if (id.includes('mock/legalTexts')) return 'legal';
          if (id.includes('mock/data')) return 'data';
        },
      },
    },
  },
});
