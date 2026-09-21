import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AccessGate from './components/AccessGate.jsx';
import { LanguageProvider } from './i18n';
import './styles.css';
import './admin/admin.css';

// LanguageProvider 提升到最外层：AccessGate 在 App 之前渲染，需要它才能读取语言（2026-09-21 品牌多语言适配）
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AccessGate>
        <App />
      </AccessGate>
    </LanguageProvider>
  </StrictMode>
);
