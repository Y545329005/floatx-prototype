import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LanguageContext = createContext({ lang: 'zh-CN', setLang: () => {}, t: k => k });

export const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-HK', label: '繁體中文' },
  { code: 'en', label: 'English' },
];

// 字典动态加载（2026-09-24 主包瘦身 Phase 1）：
// zh-CN 的 key 即简体中文原文，零字典；zhHK / en 各 ~78KB 源码，
// 改为按需 import，未加载完成前 t() 回退返回 key（简体原文），字典到达后自动重渲染。
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('zhifu-lang') || 'zh-CN';
    } catch (e) {
      return 'zh-CN';
    }
  });
  const [dicts, setDicts] = useState({});

  useEffect(() => {
    if (lang === 'zh-CN' || dicts[lang]) return;
    let alive = true;
    const loader = lang === 'zh-HK' ? import('./zhHK') : import('./en');
    loader.then((m) => {
      if (!alive) return;
      const d = lang === 'zh-HK' ? m.zhHK : m.en;
      setDicts((prev) => (prev[lang] ? prev : { ...prev, [lang]: d }));
    });
    return () => { alive = false; };
  }, [lang, dicts]);

  const changeLang = useCallback((code) => {
    setLang(code);
    try {
      localStorage.setItem('zhifu-lang', code);
    } catch (e) { /* ignore */ }
  }, []);

  const dict = lang === 'zh-CN' ? {} : dicts[lang] || {};

  const t = useCallback((key) => {
    if (typeof key !== 'string' || !key) return key;
    return dict[key] || key;
  }, [dict]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
