import { useState } from "react";
import { ArrowLeft, Mail, Check, AlertCircle, Edit3 } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, sendEmailVerifyCode, verifyEmailCode } from "../mock/data";

// 独立「更换邮箱」功能：账号安全（邮箱是登录凭证）
// 入口：设置中心 → 登录安全 → 更换邮箱
export default function ChangeEmail({ goBack, setToast }) {
  const { t } = useLang();
  const [email, setEmail] = useState(currentUser.email || '');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const enterEditMode = () => {
    setEditing(true);
    setEmail('');
    setCode('');
    setCodeSent(false);
    setErrors({});
    setCountdown(0);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEmail(currentUser.email || '');
    setCode('');
    setCodeSent(false);
    setErrors({});
    setCountdown(0);
  };

  const handleSendCode = () => {
    if (!email || !isValidEmail(email)) {
      setErrors({ email: t('请输入有效的邮箱地址') });
      return;
    }
    if (email === currentUser.email) {
      setErrors({ email: t('新邮箱不能与当前邮箱相同') });
      return;
    }
    sendEmailVerifyCode();
    setCodeSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = () => {
    if (!code || code.length !== 6) {
      setErrors({ code: t('请输入6位验证码') });
      return;
    }
    const success = verifyEmailCode(code);
    if (success) {
      currentUser.email = email;
      currentUser.emailVerified = true;
      currentUser.emailVerifiedAt = new Date().toISOString();
      setEditing(false);
      if (setToast) setToast(t('邮箱换绑成功'));
      setTimeout(() => goBack('#settings'), 1000);
    } else {
      setErrors({ code: t('验证码错误，请重试') });
    }
  };

  const updateEmail = (v) => {
    setEmail(v);
    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
  };

  const updateCode = (v) => {
    setCode(v.replace(/\D/g, '').slice(0, 6));
    if (errors.code) setErrors(prev => ({ ...prev, code: null }));
  };

  const displayEmail = currentUser.email || email;
  const showBoundState = !editing;

  return (
    <div className="page change-email-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#settings')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('更换邮箱')}</h1>
        </div>
      </div>

      <div className="kyc-content">
        <div className="kyc-card">
          {showBoundState ? (
            <>
              <div className="kyc-card-desc">
                {t('当前已绑定邮箱，点击下方按钮更换为新邮箱。')}
              </div>
              <div className="kyc-account-bound">
                <div className="kyc-account-bound-icon">
                  <Mail size={28} />
                </div>
                <div className="kyc-account-bound-value">{displayEmail}</div>
                <div className="kyc-account-bound-badge">
                  <Check size={14} />
                  <span>{t('已验证')}</span>
                </div>
              </div>
              <button
                className="kyc-btn kyc-btn-secondary"
                onClick={enterEditMode}
              >
                <Edit3 size={16} />
                {t('更换邮箱')}
              </button>
            </>
          ) : (
            <>
              <div className="kyc-card-desc">
                {t('请输入您的新邮箱地址，我们将发送验证码邮件。')}
              </div>

              {/* 新邮箱输入 */}
              <div className="kyc-form-group">
                <label className="kyc-form-label">
                  <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {t('新邮箱地址')}
                </label>
                <div className="kyc-phone-input-group">
                  <input
                    type="email"
                    className={`kyc-form-input ${errors.email ? 'error' : ''}`}
                    placeholder={t('例如：name@example.com')}
                    value={email}
                    onChange={e => updateEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    className="kyc-phone-code-btn"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}s` : t('发送验证码')}
                  </button>
                </div>
                {errors.email && <span className="kyc-form-error">{errors.email}</span>}
              </div>

              {/* 验证码输入 */}
              {codeSent && (
                <div className="kyc-form-group">
                  <label className="kyc-form-label">{t('验证码')}</label>
                  <input
                    type="text"
                    className={`kyc-form-input ${errors.code ? 'error' : ''}`}
                    placeholder={t('请输入6位验证码')}
                    value={code}
                    onChange={e => updateCode(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {errors.code && <span className="kyc-form-error">{errors.code}</span>}
                  <div className="kyc-form-hint">
                    {t('验证码将在 5 分钟内有效')}
                  </div>
                </div>
              )}

              {/* Mock 测试提示 */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('演示模式：验证码为 123456（控制台输出）')}
                </div>
              </div>

              {/* 换绑时显示取消 */}
              <button
                type="button"
                className="kyc-btn-text"
                onClick={cancelEdit}
              >
                {t('取消更换')}
              </button>
            </>
          )}
        </div>
      </div>

      {!showBoundState && (
        <div className="kyc-actions">
          <button
            className="kyc-btn kyc-btn-primary"
            onClick={handleChange}
            disabled={!codeSent || code.length !== 6}
          >
            {t('确认更换')}
          </button>
        </div>
      )}
    </div>
  );
}
