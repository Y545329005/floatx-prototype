import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ⚠️ 导入顺序即 CSS 注入顺序（ES 模块按声明顺序求值，CSS 副作用随所属模块注入）：
// styles.css 必须在 EmbedApp（其导入 embed.css）之前——embed.css 里对 .card 等
// 基础类的同优先级覆盖（如 .wealth-cal-card { padding: 0 }）只有在之后注入才生效。
// 曾因 EmbedApp 先被求值导致 embed.css 先注入、覆盖全部失效（卡片内出现 18px 白边）。
import '../styles.css';
import EmbedApp from './EmbedApp.jsx';
import { LanguageProvider } from '../i18n';
// 嵌入形态入口（2026-10-09 嵌入集团 APP 方案·方案A）：
// 与独立原型（src/main.jsx）完全分离的启动文件——无 AccessGate 口令层（宿主环境已过鉴权）、
// 无 admin 代码（后台保持独立 Web）。身份由宿主 SSO 注入（EmbedApp 内 ?uid= 模拟）。
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <EmbedApp />
    </LanguageProvider>
  </StrictMode>
);
