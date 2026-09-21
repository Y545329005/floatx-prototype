import { useState, useEffect, useRef } from 'react';
import { useLang } from '../i18n';

// 云端演示环境访问口令（2026-08-27）
// 定位：GitHub Pages 公开托管时为「防君子不防小人」的一层入口保护，防止匿名访问直接看到私募/合规业务界面。
// 前端校验，无后端鉴权；如需强口令保护，请走 OSS CDN 鉴权或加 Basic Auth。
const ACCESS_PASSWORD = 'floatx2026';
const STORAGE_KEY = 'floatx-access-granted';

function loadGranted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function AccessGate({ children }) {
  const { t } = useLang();
  const [granted, setGranted] = useState(loadGranted);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!granted) inputRef.current?.focus();
  }, [granted]);

  // 浏览器标题随语言切换（2026-09-21 品牌多语言适配）。
  // AccessGate 常驻挂载（授权后 return children 仍保留本组件），故标题同步集中在此：
  // 口令层阶段 App 尚未挂载也能正确显示，授权后语言切换同样生效。
  useEffect(() => {
    document.title = t('财富平台');
  }, [t]);

  if (granted) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() === ACCESS_PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* 隐私模式等场景忽略，本次会话内生效 */
      }
      setGranted(true);
    } else {
      setError('口令不正确，请重试');
      setValue('');
    }
  };

  return (
    <div className="access-gate">
      <form className="access-gate-card" onSubmit={handleSubmit}>
        <div className="access-gate-brand">{t('财富平台')}</div>
        <div className="access-gate-title">{t('内部演示环境')}</div>
        <p className="access-gate-desc">{t('私募股权信息平台原型 · 凭口令访问')}</p>
        <input
          ref={inputRef}
          className="access-gate-input"
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('请输入访问口令')}
          autoComplete="off"
        />
        {error && <div className="access-gate-error">{t(error)}</div>}
        <button className="access-gate-btn" type="submit">{t('进入')}</button>
        <div className="access-gate-hint">{t('本原型仅供内部演示，请勿对外转发链接')}</div>
      </form>
    </div>
  );
}
