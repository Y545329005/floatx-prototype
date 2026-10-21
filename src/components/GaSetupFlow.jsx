import { useState } from 'react';
import { Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { useLang } from '../i18n';
import { generateTotpSecret, verifyTotp, bindGa, confirmGaReset, GA_DEMO_MODE } from '../mock/data';

// GA 绑定/重置流程（2026-09-22 · 规格 5.3.2）
// 前置：调用方已完成安全验证（SecurityVerifySheet）；本组件负责 密钥展示 → GA 出码验证 → 落库。
// 单设备绑定路径（规格 3.2）：二维码为演示占位，密钥文本可复制，GA App「输入设置密钥」手动添加。
// 验证码框 48px（.ga-code · var(--min-touch-target)）：APP 手指触控 + 安全关键输入，
// 偏离 DESIGN_SYSTEM §三.3 的 44px 下限档，2026-09-23 用户拍板（文档不改）。
export default function GaSetupFlow({ mode = 'bind', onDone, onCancel }) {
  const { t } = useLang();
  const [secret] = useState(() => generateTotpSecret());
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const copySecret = async () => {
    try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) { /* 剪贴板不可用静默 */ }
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    const passed = await verifyTotp(secret, code);
    if (!passed) {
      setBusy(false);
      setError(t('验证码错误，请检查 GA App 与设备时间后重试'));
      return;
    }
    // 新密钥验证通过的瞬间生效（规格 5.3.2：重置期间旧密钥保持有效直到新密钥验证成功）
    const res = mode === 'reset' ? confirmGaReset(secret) : bindGa(secret);
    setBusy(false);
    if (!res.ok) { setError(t(res.message)); return; }
    onDone && onDone(res);
  };

  return (
    <div className="ga-flow">
      <div className="ga-flow-step">
        <Download size={16} />
        <p>{t('请在 App Store / Google Play 下载「Google Authenticator」')}</p>
      </div>

      <div className="ga-flow-qr">
        {/* 演示占位二维码（无 qrcode 依赖）：单设备用户复制密钥文本手动添加 */}
        <div className="ga-qr-grid" aria-hidden="true">
          {Array.from({ length: 81 }).map((_, i) => (
            <span key={i} className={((i * 7 + (i % 5) * 13) % 3 === 0 || i < 9 || (i >= 36 && i < 45) || i > 71) ? 'on' : ''} />
          ))}
        </div>
        <p className="text-muted text-sm">{t('请复制下方密钥，在 GA App 中选择「输入设置密钥」添加')}</p>
      </div>

      <div className="ga-flow-secret">
        <span className="ga-secret-text">{secret}</span>
        <button className="btn btn-secondary btn-sm" onClick={copySecret}>
          {copied ? <><Check size={13} /> {t('已复制')}</> : <><Copy size={13} /> {t('复制密钥')}</>}
        </button>
      </div>

      <div className="ga-flow-verify">
        <label className="form-label">{t('输入 GA App 中的 6 位验证码')}</label>
        {GA_DEMO_MODE && <p className="text-muted text-sm">{t('演示模式：验证码为 123456')}</p>}
        <input
          className={`form-input ga-code ${error ? 'error' : ''}`}
          inputMode="numeric"
          maxLength={6}
          placeholder={t('请输入6位验证码')}
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(null); }}
        />
        {error && <span className="error-text">{error}</span>}
        <div className="ga-flow-actions">
          {onCancel && <button className="btn btn-secondary" onClick={onCancel}>{t('取消')}</button>}
          <button className="btn btn-primary" disabled={code.length !== 6 || busy} onClick={handleVerify}>
            <ShieldCheck size={15} /> {mode === 'reset' ? t('确认重置') : t('完成绑定')}
          </button>
        </div>
      </div>
    </div>
  );
}
