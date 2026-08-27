import { useState } from "react";
import { ArrowLeft, Smartphone, Check, AlertCircle, Edit3 } from "lucide-react";
import { useLang } from "../i18n";
import { currentUser, sendPhoneVerifyCode, verifyPhoneCode } from "../mock/data";

// 独立「绑定手机」功能：从 KYC 流程剥离的账户安全功能
// 入口：设置中心 → 登录安全 → 绑定手机
export default function BindPhone({ goBack, setToast }) {
  const { t } = useLang();
  const profile = currentUser.kyc_profile || {};

  const [phone, setPhone] = useState(profile.phone || '');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});
  const [verified, setVerified] = useState(!!profile.phoneVerified);
  const [editing, setEditing] = useState(false);

  const isValidPhone = (p) => /^(\+?852)?[569]\d{7}$/.test(p.replace(/[\s-]/g, ''));

  const enterEditMode = () => {
    setEditing(true);
    setCode('');
    setCodeSent(false);
    setErrors({});
    setCountdown(0);
  };

  const cancelEdit = () => {
    setEditing(false);
    setPhone(profile.phone || '');
    setCode('');
    setCodeSent(false);
    setErrors({});
    setCountdown(0);
  };

  const handleSendCode = () => {
    if (!phone || !isValidPhone(phone)) {
      setErrors({ phone: t('请输入有效的香港手机号码') });
      return;
    }
    sendPhoneVerifyCode();
    setCodeSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (!code || code.length !== 6) {
      setErrors({ code: t('请输入6位验证码') });
      return;
    }
    const success = verifyPhoneCode(code);
    if (success) {
      const wasAlreadyBound = verified;
      setVerified(true);
      setEditing(false);
      // 统一数据层：phone 始终为字符串，phoneVerified 为 boolean
      currentUser.kyc_profile.phone = phone;
      currentUser.kyc_profile.phoneVerified = true;
      currentUser.kyc_profile.phoneVerifiedAt = new Date().toISOString();
      const toastMsg = wasAlreadyBound ? t('手机号换绑成功') : t('手机号绑定成功');
      if (setToast) setToast(toastMsg);
      setTimeout(() => goBack('#settings'), 1000);
    } else {
      setErrors({ code: t('验证码错误，请重试') });
    }
  };

  const updatePhone = (v) => {
    setPhone(v);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const updateCode = (v) => {
    setCode(v.replace(/\D/g, '').slice(0, 6));
    if (errors.code) setErrors(prev => ({ ...prev, code: null }));
  };

  const displayPhone = profile.phone || phone;
  const showBoundState = verified && !editing;

  return (
    <div className="page bind-phone-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#settings')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('绑定手机')}</h1>
        </div>
      </div>

      <div className="kyc-content">
        <div className="kyc-card">
          {showBoundState ? (
            <>
              <div className="kyc-card-desc">
                {t('当前已绑定手机号，可点击下方按钮更换新手机号。')}
              </div>
              <div className="kyc-account-bound">
                <div className="kyc-account-bound-icon">
                  <Smartphone size={28} />
                </div>
                <div className="kyc-account-bound-value">{displayPhone}</div>
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
                {t('更换手机号')}
              </button>
            </>
          ) : (
            <>
              <div className="kyc-card-desc">
                {editing
                  ? t('请输入您的新香港手机号码，我们将发送验证码短信。')
                  : t('请验证您本人名下的香港手机号码，我们将发送验证码短信。')}
              </div>

              {/* 手机号输入 */}
              <div className="kyc-form-group">
                <label className="kyc-form-label">
                  <Smartphone size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {t('香港手机号码')}
                </label>
                <div className="kyc-phone-input-group">
                  <input
                    type="tel"
                    className={`kyc-form-input ${errors.phone ? 'error' : ''}`}
                    placeholder={t('例如：51234567')}
                    value={phone}
                    onChange={e => updatePhone(e.target.value)}
                  />
                  <button
                    type="button"
                    className="kyc-phone-code-btn"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}s` : t('获取验证码')}
                  </button>
                </div>
                {errors.phone && <span className="kyc-form-error">{errors.phone}</span>}
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
              {editing && (
                <button
                  type="button"
                  className="kyc-btn-text"
                  onClick={cancelEdit}
                >
                  {t('取消更换')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!showBoundState && (
        <div className="kyc-actions">
          <button
            className="kyc-btn kyc-btn-primary"
            onClick={handleVerify}
            disabled={!codeSent || code.length !== 6}
          >
            {t('验证手机号')}
          </button>
        </div>
      )}
    </div>
  );
}
