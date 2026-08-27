import { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext({ lang: 'zh-CN', setLang: () => {}, t: k => k });

export const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-HK', label: '繁體中文' },
  { code: 'en', label: 'English' },
];

import { zhHK } from './zhHK';
import { en } from './en';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('zhifu-lang') || 'zh-CN';
    } catch (e) {
      return 'zh-CN';
    }
  });

  const changeLang = useCallback((code) => {
    setLang(code);
    try {
      localStorage.setItem('zhifu-lang', code);
    } catch (e) { /* ignore */ }
  }, []);

  const dict = lang === 'zh-CN' ? {} : lang === 'zh-HK' ? zhHK : en;

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
