import React, { useState, useEffect } from "react";
import { Smartphone, Lock, User, ShieldCheck, Globe, Check, X } from "lucide-react";
import { useLang, LANGUAGES } from "../i18n";
import BusinessContact from "./BusinessContact";
import { platformBrand, sendResetCode, verifyResetCode, resetPassword } from "../mock/data";

// 账号校验：邮箱 或 香港手机号（+852 可选，8 位，首位 5/6/9）
const isValidAccount = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
  /^(\+?852)?[569]\d{7}$/.test(v.replace(/[\s-]/g, ''));

/* ===== 共享：品牌标识（白底圆章"致"字标 + 金色细描边 + 平台名） ===== */
function AuthBrand({ compact }) {
  return (
    <div className={`auth-brand${compact ? ' auth-brand-compact' : ''}`}>
      <div className="auth-brand-logo">
        <span className="auth-brand-mark">致</span>
      </div>
      <div className="auth-brand-text">
        <strong className="auth-brand-name">{platformBrand.nameZh}</strong>
        {!compact && <span className="auth-brand-en">{platformBrand.nameEn}</span>}
      </div>
    </div>
  );
}

/* ===== 共享：品牌区（深蓝 hero · 持牌背书 + 欢迎语） ===== */
function AuthHero({ title, subtitle, compact }) {
  const { lang, setLang, t } = useLang();
  const [showLang, setShowLang] = useState(false);
  return (
    <div className={`auth-hero${compact ? ' auth-hero-compact' : ''}`}>
      {/* 语言切换收敛为右上角角落入口（Globe icon，弱化） */}
      <div className="auth-hero-top">
        <button
          className="auth-lang-btn"
          aria-label={t('选择语言')}
          onClick={() => setShowLang(true)}
        >
          <Globe size={18} />
        </button>
      </div>

      <AuthBrand compact={compact} />
      <div className="auth-license">
        <ShieldCheck size={14} />
        <span>{t('香港证监会持牌机构')} · CE No. {platformBrand.licenseNo}</span>
      </div>
      <div className="auth-hero-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {/* 语言选择 sheet（底部弹层） */}
      {showLang && (
        <>
          <div className="sheet-mask" onClick={() => setShowLang(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('选择语言')}</h3>
              <button className="btn-icon" onClick={() => setShowLang(false)}>
                <X size={18} />
              </button>
            </div>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`lang-option${lang === l.code ? ' active' : ''}`}
                onClick={() => { setLang(l.code); setShowLang(false); }}
              >
                <span>{l.label}</span>
                {lang === l.code && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== 共享：底部合规 footer（帮助链接 + 可选 BD banner + legal） ===== */
function AuthFooter({ children, setToast, banner = false }) {
  const { t } = useLang();
  return (
    <div className="auth-footer">
      {children && <div className="auth-footer-help">{children}</div>}
      {banner && <BusinessContact setToast={setToast} />}
      <p className="auth-footer-legal">{t('本平台由香港证监会持牌机构运营，仅面向专业投资者')}</p>
    </div>
  );
}

/* ================= 登录 ================= */
export function LoginPage({ navigate, setIsLoggedIn, setUser, setToast }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLang();

  // 记住账号：登录页初始化时预填已保存的账号（邮箱/手机号）
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zhifu-remember-email');
      if (saved) setAccount(saved);
    } catch (e) { /* SSR / 隐私模式 */ }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!account) {
      newErrors.account = t("请输入邮箱或手机号");
    } else if (!isValidAccount(account)) {
      newErrors.account = t("请输入有效的邮箱或手机号");
    }

    if (!password) {
      newErrors.password = t("请输入密码");
    } else if (password.length < 6) {
      newErrors.password = t("密码至少需要 6 个字符");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // 模拟登录请求（测试账号：邮箱 demo@example.com / 手机号 51234567）
    setTimeout(() => {
      const isDemo = (account === "demo@example.com" || account === "51234567") && password === "password123";
      if (isDemo) {
        try {
          if (remember) localStorage.setItem('zhifu-remember-email', account);
          else localStorage.removeItem('zhifu-remember-email');
        } catch (e) {}
        const userData = {
          id: "user-1",
          email: account,
          name: "演示用户",
        };
        setIsLoggedIn(true);
        setUser(userData);
        setToast(t("登录成功"));
        navigate("events");
      } else {
        setErrors({ form: t("邮箱或密码错误，请重试") });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-page">
      <AuthHero
        title={t('登录您的财富账户')}
      />

      <div className="auth-body">
        <div className="auth-card">
          {errors.form && <div className="error-text auth-form-error">{errors.form}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('邮箱 / 手机号')}</label>
              <div className="auth-input-wrap">
                <Smartphone size={16} />
                <input
                  type="text"
                  inputMode="email"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱或手机号')}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
              {errors.account && <span className="error-text">{errors.account}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('密码')}</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder={t('请输入密码')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="auth-options">
              <label className="auth-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>{t('记住账号')}</span>
              </label>
              <a href="#forgot-password" className="auth-forgot">{t('忘记密码？')}</a>
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? t('登录中...') : t('登录')}
            </button>
          </form>

          {/* 测试账号快捷登录（Mock KYC 测试用） */}
          <div className="demo-test-accounts">
            <p className="demo-test-label">{t('测试账号')}</p>
            <div className="demo-test-btns">
              <button
                type="button"
                className="btn-demo btn-demo-approved"
                onClick={() => window.__loginWithTestAccount && window.__loginWithTestAccount('approved')}
              >
                {t('账号 A：已通过 KYC')}
              </button>
              <button
                type="button"
                className="btn-demo btn-demo-pending"
                onClick={() => window.__loginWithTestAccount && window.__loginWithTestAccount('pending')}
              >
                {t('账号 B：待完成 KYC')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthFooter setToast={setToast} banner>
        <span>{t('还没有账号？')}</span>
        <a href="#register" className="auth-footer-link">{t('立即注册')}</a>
      </AuthFooter>
    </div>
  );
}

/* ================= 注册 ================= */
export function RegisterPage({ navigate, setIsLoggedIn, setUser, setToast }) {
  const { t } = useLang();
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    name: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account) {
      newErrors.account = t("请输入邮箱或手机号");
    } else if (!isValidAccount(formData.account)) {
      newErrors.account = t("请输入有效的邮箱或手机号");
    }

    if (!formData.password) {
      newErrors.password = t("请输入密码");
    } else if (formData.password.length < 8) {
      newErrors.password = t("密码至少需要 8 个字符");
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t("密码需同时包含字母和数字");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("两次输入的密码不一致");
    }

    if (!formData.name) {
      newErrors.name = t("请输入姓名");
    }

    if (!formData.terms) {
      newErrors.terms = t("请先阅读并同意服务条款");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // 模拟注册请求
    setTimeout(() => {
      const userData = {
        id: `user-${Date.now()}`,
        email: formData.account,
        name: formData.name,
      };
      setIsLoggedIn(true);
      setUser(userData);
      setToast(t("注册成功"));
      navigate("events");
      setIsLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="auth-page">
      <AuthHero compact title={t('注册')} subtitle={t('创建您的财富账号')} />

      <div className="auth-body">
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('邮箱 / 手机号')}</label>
              <div className="auth-input-wrap">
                <Smartphone size={16} />
                <input
                  type="text"
                  inputMode="email"
                  name="account"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱或手机号')}
                  value={formData.account}
                  onChange={handleChange}
                />
              </div>
              {errors.account && <span className="error-text">{errors.account}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('姓名')}</label>
              <div className="auth-input-wrap">
                <User size={16} />
                <input
                  type="text"
                  name="name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder={t('请输入姓名')}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('密码')}</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder={t('请设置密码')}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <span className="form-hint">{t('至少 8 位，含字母和数字')}</span>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('确认密码')}</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder={t('请再次输入密码')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <p className="auth-pi-note">{t('您确认本人为香港《证券及期货条例》定义的专业投资者')}</p>

            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
              />
              <label htmlFor="terms">
                {t('我已阅读并同意')} <a href="#terms">{t('服务条款')}</a> {t('和')} <a href="#privacy">{t('隐私政策')}</a>
              </label>
            </div>
            {errors.terms && <span className="error-text">{errors.terms}</span>}

            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? t('注册中...') : t('注册')}
            </button>
          </form>
        </div>
      </div>

      <AuthFooter>
        <span>{t('已有账号？')}</span>
        <a href="#login" className="auth-footer-link">{t('立即登录')}</a>
      </AuthFooter>
    </div>
  );
}

/* ================= 忘记密码（2026-08-26 重写：APP内验证码流程） ================= */
export function ForgotPasswordPage({ navigate, setToast }) {
  const { t } = useLang();
  
  // 步骤状态：'input' → 'verify' → 'reset' → 'success'
  const [step, setStep] = useState('input');
  const [account, setAccount] = useState('');
  const [accountType, setAccountType] = useState(''); // 'phone' | 'email'
  const [verifyCode, setVerifyCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sentCode, setSentCode] = useState(''); // Mock模式下显示验证码
  const [resendCountdown, setResendCountdown] = useState(0);

  // 倒计时（1分钟重发限制）
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // 判断输入类型
  const detectAccountType = (value) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    return 'phone';
  };

  // 步骤1：发送验证码
  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!account.trim()) {
      setErrors({ account: t('请输入邮箱或手机号') });
      return;
    }
    
    const type = detectAccountType(account);
    setAccountType(type);
    setIsLoading(true);
    
    // 调用 mock 函数
    const result = sendResetCode(account);
    
    setTimeout(() => {
      setIsLoading(false);
      if (result.success) {
        setSentCode(result.code); // Mock模式显示验证码
        setStep('verify');
        setResendCountdown(60);
        setToast(t('验证码已发送'));
      } else {
        setErrors({ account: t(result.message) });
      }
    }, 500);
  };

  // 步骤2：验证验证码
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!verifyCode.trim()) {
      setErrors({ verifyCode: t('请输入验证码') });
      return;
    }
    if (verifyCode.length !== 6) {
      setErrors({ verifyCode: t('验证码为6位数字') });
      return;
    }
    
    setIsLoading(true);
    
    const result = verifyResetCode(account, verifyCode);
    
    setTimeout(() => {
      setIsLoading(false);
      if (result.success) {
        setStep('reset');
        setToast(t('验证成功'));
      } else {
        setErrors({ verifyCode: t(result.message) });
      }
    }, 300);
  };

  // 步骤2：重新发送验证码
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    
    const result = sendResetCode(account);
    
    if (result.success) {
      setSentCode(result.code);
      setResendCountdown(60);
      setToast(t('验证码已重新发送'));
    }
  };

  // 步骤3：重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // 密码校验
    if (!newPassword) {
      setErrors({ newPassword: t('请输入新密码') });
      return;
    }
    if (newPassword.length < 6) {
      setErrors({ newPassword: t('密码至少需要6位') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: t('两次密码输入不一致') });
      return;
    }
    
    setIsLoading(true);
    
    const result = resetPassword(account, newPassword);
    
    setTimeout(() => {
      setIsLoading(false);
      if (result.success) {
        setStep('success');
        setToast(t('密码重置成功'));
      } else {
        setErrors({ newPassword: t(result.message) });
      }
    }, 500);
  };

  // 步骤4：成功页面
  if (step === 'success') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('密码重置成功')} subtitle={t('您的密码已成功重置')} />
        <div className="auth-body">
          <div className="auth-card">
            <div className="auth-success-icon">✓</div>
            <button
              className="auth-button primary"
              onClick={() => navigate('login')}
            >
              {t('返回登录')}
            </button>
          </div>
        </div>
        <AuthFooter>
          <a href="#login" className="auth-footer-link">{t('返回登录')}</a>
        </AuthFooter>
      </div>
    );
  }

  // 步骤3：重置密码页面
  if (step === 'reset') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('设置新密码')} subtitle={t('请输入您的新密码')} />
        <div className="auth-body">
          <div className="auth-card">
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">{t('新密码')}</label>
                <div className="auth-input-wrap">
                  <Lock size={16} />
                  <input
                    type="password"
                    className={`form-input ${errors.newPassword ? 'error' : ''}`}
                    placeholder={t('请输入新密码（至少6位）')}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors({}); }}
                  />
                </div>
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('确认新密码')}</label>
                <div className="auth-input-wrap">
                  <Lock size={16} />
                  <input
                    type="password"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder={t('请再次输入新密码')}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({}); }}
                  />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className="auth-button primary"
                disabled={isLoading}
              >
                {isLoading ? t('重置中...') : t('重置密码')}
              </button>
            </form>
          </div>
        </div>
        <AuthFooter>
          <a href="#login" className="auth-footer-link">{t('返回登录')}</a>
        </AuthFooter>
      </div>
    );
  }

  // 步骤2：验证码输入页面
  if (step === 'verify') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('输入验证码')} subtitle={t('验证码已发送至 {}').replace('{}', account)} />
        <div className="auth-body">
          <div className="auth-card">
            {/* Mock模式提示：显示验证码 */}
            {sentCode && (
              <div className="auth-mock-hint">
                {t('演示模式验证码')}: <strong>{sentCode}</strong>
              </div>
            )}
            
            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label className="form-label">{t('6位验证码')}</label>
                <div className="auth-input-wrap">
                  <ShieldCheck size={16} />
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`form-input auth-code-input ${errors.verifyCode ? 'error' : ''}`}
                    placeholder={t('请输入6位验证码')}
                    value={verifyCode}
                    onChange={(e) => { 
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerifyCode(v); 
                      if (errors.verifyCode) setErrors({}); 
                    }}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {errors.verifyCode && <span className="error-text">{errors.verifyCode}</span>}
              </div>

              <button
                type="submit"
                className="auth-button primary"
                disabled={isLoading || verifyCode.length !== 6}
              >
                {isLoading ? t('验证中...') : t('验证')}
              </button>
            </form>
            
            <div className="auth-resend-row">
              {resendCountdown > 0 ? (
                <span className="auth-resend-text">{t('{}秒后可重发').replace('{}', resendCountdown)}</span>
              ) : (
                <button 
                  className="auth-resend-btn"
                  onClick={handleResendCode}
                >
                  {t('重新发送验证码')}
                </button>
              )}
            </div>
          </div>
        </div>
        <AuthFooter>
          <a href="#login" className="auth-footer-link">{t('返回登录')}</a>
        </AuthFooter>
      </div>
    );
  }

  // 步骤1：输入账号页面（默认）
  return (
    <div className="auth-page">
      <AuthHero compact title={t('忘记密码')} subtitle={t('输入您的邮箱或手机号，我们将发送验证码')} />
      <div className="auth-body">
        <div className="auth-card">
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label className="form-label">{t('邮箱 / 手机号')}</label>
              <div className="auth-input-wrap">
                <Smartphone size={16} />
                <input
                  type="text"
                  inputMode="email"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱或手机号')}
                  value={account}
                  onChange={(e) => { setAccount(e.target.value); if (errors.account) setErrors({}); }}
                />
              </div>
              {errors.account && <span className="error-text">{errors.account}</span>}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? t('发送中...') : t('发送验证码')}
            </button>
          </form>
        </div>
      </div>
      <AuthFooter>
        <a href="#login" className="auth-footer-link">{t('返回登录')}</a>
      </AuthFooter>
    </div>
  );
}

/* ================= 重置密码 ================= */
export function ResetPasswordPage({ navigate, setToast }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = t("请输入新密码");
    } else if (password.length < 8) {
      newErrors.password = t("密码至少需要 8 个字符");
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      newErrors.password = t("密码需同时包含字母和数字");
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t("两次输入的密码不一致");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // 模拟重置密码
    setTimeout(() => {
      setToast(t("密码重置成功，请重新登录"));
      navigate("login");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-page">
      <AuthHero compact title={t('重置密码')} subtitle={t('请输入您的新密码')} />

      <div className="auth-body">
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('新密码')}</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder={t('请设置新密码')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <span className="form-hint">{t('至少 8 位，含字母和数字')}</span>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('确认新密码')}</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder={t('请再次输入新密码')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? t('重置中...') : t('重置密码')}
            </button>
          </form>
        </div>
      </div>

      <AuthFooter>
        <a href="#login" className="auth-footer-link">{t('返回登录')}</a>
      </AuthFooter>
    </div>
  );
}
