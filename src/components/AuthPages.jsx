import React, { useState, useEffect } from "react";
import { Mail, Lock, ShieldCheck, Globe, Check, X, AlertTriangle, Fingerprint } from "lucide-react";
import { useLang, LANGUAGES } from "../i18n";
import BusinessContact from "./BusinessContact";
import SecurityVerifySheet from "./SecurityVerifySheet";
import GaSetupFlow from "./GaSetupFlow";
import {
  platformBrand, sendResetCode, verifyResetCode, resetPassword,
  testAccounts, createFreshUser, setMockCurrentUser, restoreKycStatus, getUserPasswordOverride, currentUser as currentUserData,
  resolveLoginFactors, isKyc1,
  startEmergencyLogin, completeEmergencyUnbind, finishEmergencyRebind, getEmergencyState,
  addPasskey,
  sendRegisterCode, verifyRegisterCode, registerAccount, findRegisteredAccount, isAccountRegistered,
} from "../mock/data";

// 账号校验：仅邮箱（邮箱单通道）
const isValidAccount = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

// 测试账号邮箱 → 账号键（demo@example.com 为 u1 演示别名）
function matchTestAccount(input) {
  const v = String(input || '').trim().toLowerCase();
  if (v === 'demo@example.com') return { key: 'approved', account: testAccounts.approved };
  const hit = Object.entries(testAccounts).find(([, u]) => String(u.email || '').toLowerCase() === v);
  return hit ? { key: hit[0], account: hit[1] } : null;
}

/* ===== 共享：品牌标识（白底圆章品牌首字标 + 金色细描边 + 平台名；首字走配置防换主体残留） ===== */
function AuthBrand({ compact }) {
  return (
    <div className={`auth-brand${compact ? ' auth-brand-compact' : ''}`}>
      <div className="auth-brand-logo">
        <span className="auth-brand-mark">{(platformBrand.nameZh || '').charAt(0)}</span>
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
        <span>{t('香港证监会持牌机构')} · SFC NO: {platformBrand.licenseNo}</span>
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
      <p className="auth-footer-legal">{t('仅供专业投资者使用，内容不构成投资建议或要约')}</p>
    </div>
  );
}

/* ================= 登录 ================= */
// 2026-09-22 2FA 改造（复刻规格 5.1/5.5）：
// - 密码验证后进入安全验证阶段，因子按绑定态自动选路（Passkey→GA→注册邮箱验证码±人脸，INV-3 降级链）
// - 2026-10-15 UC 对齐（§9.4）：注册邮箱即强制因子，不存在免验证登录——GA/Passkey 可延迟绑定，
//   但无强因子时必走注册邮箱验证码兜底；「延迟绑定」语义仅指 GA/Passkey 绑定时机
// - 「无法获取验证码」→ 紧急登录（规格 5.5）：KYC1 先风险确认 → 邮箱验证码+人脸 → 全部通过瞬间强制解绑 GA/Passkey + 动态冻结 → 阻断式重绑
//   （email 因子项不提供紧急入口，转客服引导）
// - 中断回溯：重绑前刷新（Kill App 等价），下次登录检测 rebind-required 中间态 → 强制邮箱+人脸全套复核后才能进绑定页
// - 演示约定（非规格）：快捷登录按钮豁免 2FA
export function LoginPage({ navigate, setIsLoggedIn, setUser, setToast }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // 2FA 阶段机：form 表单 → twofactor 登录验证 → emergency-confirm 风险确认 → emergency-verify 紧急验证 → rebind 阻断重绑 → rebind-resume 中断回溯复核
  const [stage, setStage] = useState('form');
  const [pendingFactors, setPendingFactors] = useState(null); // 登录 2FA 因子
  const [emergencyFactors, setEmergencyFactors] = useState(null); // 紧急登录验证因子
  const [rebindDone, setRebindDone] = useState(false); // 重绑完成，提示重新登录
  const { t } = useLang();

  // 中断回溯检测：存在「已解绑未重绑」中间态 → 强制复核（规格 5.5 第 5 条）
  useEffect(() => {
    const em = getEmergencyState();
    if (em && em.stage === 'rebind-required') {
      setStage('rebind-resume');
    }
  }, []);

  // 记住账号：登录页初始化时预填已保存的邮箱
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zhifu-remember-email');
      if (saved && saved.includes('@')) setAccount(saved);
      else if (saved) localStorage.removeItem('zhifu-remember-email');
    } catch (e) { /* SSR / 隐私模式 */ }
  }, []);

  const finishLogin = () => {
    setIsLoggedIn(true);
    setUser({ id: currentUserData.id, email: currentUserData.email || account, name: currentUserData.name });
    setToast(t("登录成功"));
    navigate("events");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!account) {
      newErrors.account = t("请输入邮箱");
    } else if (!isValidAccount(account)) {
      newErrors.account = t("请输入有效的邮箱地址");
    }

    if (!password) {
      newErrors.password = t("请输入密码");
    } else if (password.length < 8) {
      newErrors.password = t("密码至少需要 8 个字符");
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

    // 模拟登录请求：demo@example.com 与账号 A/B/C 邮箱均可登录；密码覆盖 = 安全中心修改后的密码；
    // 本轮注册账号走 mock 注册账号表 registerAccount 校验，支持「注册成功 → 去登录」链路
    setTimeout(() => {
      const expectedPwd = getUserPasswordOverride()?.password || "password123";
      const testHit = matchTestAccount(account);
      const isDemo = !!testHit && password === expectedPwd;
      // 本轮注册账号（UC 对齐）：注册时密码已记入 mock 注册账号表
      const reg = findRegisteredAccount(account);
      const isRegistered = !!reg && reg.password === password;
      if (isDemo || isRegistered) {
        try {
          if (remember) localStorage.setItem('zhifu-remember-email', testHit ? testHit.account.email : account);
          else localStorage.removeItem('zhifu-remember-email');
        } catch (e) {}
        // 桥梁同步：手动登录必须切到对应演示账号，否则 2FA/KYC 门控仍读 u1
        if (isDemo) {
          setMockCurrentUser(testHit.account);
          if (testHit.account.id !== 'u1') restoreKycStatus(testHit.account.id);
        }
        // 2FA 自动选路（UC §9.4 判级对齐）：系统按绑定态选因子，用户不手挑；
        // 注册邮箱为强制因子兜底——不存在免验证登录（UC 裁决，原「延迟绑定免 2FA」已废除）
        const factors = resolveLoginFactors();
        if (factors.length === 0) {
          // 异常态兜底：无任何可达验证通道（不应出现），阻断并联系客服，不建立会话
          setErrors({ form: t("账户未绑定可验证通道，请联系客服") });
        } else {
          setPendingFactors(factors);
          setStage('twofactor');
        }
      } else {
        setErrors({ form: t("邮箱或密码错误，请重试") });
      }
      setIsLoading(false);
    }, 1000);
  };

  // 紧急登录入口（GA 项「无法获取验证码」）：KYC1 先风险确认，KYC0 直接验证
  const startEmergency = () => {
    const factors = ['email', ...(isKyc1() ? ['face'] : [])];
    setEmergencyFactors(factors);
    if (isKyc1()) {
      setStage('emergency-confirm');
    } else {
      startEmergencyLogin();
      setStage('emergency-verify');
    }
  };

  const confirmEmergency = () => {
    startEmergencyLogin();
    setStage('emergency-verify');
  };

  // 紧急验证全部通过瞬间：强制解绑 GA/Passkey + 动态冻结 + 进入阻断式重绑（规格 5.5 第 2 条）
  const onEmergencyVerified = () => {
    completeEmergencyUnbind();
    setStage('rebind');
  };

  const backToForm = () => { setStage('form'); setPendingFactors(null); setEmergencyFactors(null); };

  /* ---------- 阶段渲染：2FA 相关各阶段盖在表单上 ---------- */

  // 阻断式重绑页（死胡同：无返回/跳过，规格 5.5 第 4 条）
  // UC §4.4：Passkey 绑定前置 KYC——KYC0 用户仅提供 GA 重绑路径（无 KYC 绑 Passkey 会死锁）
  if (stage === 'rebind') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('绑定新安全项')} subtitle={t('您的 GA 与通行密钥已在紧急登录中解绑，必须绑定新安全项后才能重新登录')} />
        <div className="auth-body">
          <div className="auth-card">
            <div className="rebind-options">
              <GaSetupFlow mode="bind" onDone={() => { finishEmergencyRebind(); setRebindDone(true); setStage('form'); setToast(t('绑定成功，请重新登录')); }} />
            </div>
            {isKyc1() && (
              <>
                <div className="rebind-divider"><span>{t('或')}</span></div>
                <RebindPasskey onDone={() => { finishEmergencyRebind(); setRebindDone(true); setStage('form'); setToast(t('绑定成功，请重新登录')); }} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 中断回溯复核（规格 5.5 第 5 条：防黑客利用无锁空窗期抢绑）
  if (stage === 'rebind-resume') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('安全复核')} subtitle={t('检测到未完成的安全项重绑，请先完成身份复核')} />
        <div className="auth-body">
          <div className="auth-card">
            <SecurityVerifySheet
              open
              factors={['email', ...(isKyc1() ? ['face'] : [])]}
              onVerified={() => setStage('rebind')}
              onClose={backToForm}
              subtitle={t('完成以下验证后继续重绑')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthHero
        title={t('登录账户')}
      />

      <div className="auth-body">
        <div className="auth-card">
          {rebindDone && <div className="svs-msg info">{t('安全项已重绑完成，请使用新安全项重新登录')}</div>}
          {errors.form && <div className="error-text auth-form-error">{errors.form}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('邮箱')}</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="text"
                  inputMode="email"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱')}
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

          {/* 测试账号快捷登录（Mock KYC 测试用）——演示通道，豁免 2FA（非规格行为） */}
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
              <button
                type="button"
                className="btn-demo btn-demo-approved"
                onClick={() => window.__loginWithTestAccount && window.__loginWithTestAccount('pep')}
              >
                {t('账号 C：PEP（邮箱+人脸）')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthFooter setToast={setToast} banner>
        <span>{t('还没有账号？')}</span>
        <a href="#register" className="auth-footer-link">{t('立即注册')}</a>
      </AuthFooter>

      {/* 登录 2FA（规格 5.1 矩阵） */}
      {stage === 'twofactor' && (
        <SecurityVerifySheet
          open
          factors={pendingFactors}
          onVerified={finishLogin}
          onClose={backToForm}
          onUnavailable={startEmergency}
        />
      )}

      {/* 紧急登录风险确认（KYC1 专属，规格 5.5 第 1 条，强制手动确认） */}
      {stage === 'emergency-confirm' && (
        <>
          <div className="sheet-mask" />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('紧急登录确认')}</h3>
            </div>
            <div className="emergency-risk">
              <AlertTriangle size={28} />
              <p>{t('验证通过后，将强制解绑您当前的谷歌验证器（GA）和 Passkey，且提现功能将冻结 24-48 小时（根据设备安全评估）。')}</p>
              <p className="text-muted text-sm">{t('此操作不可撤销，确定继续吗？')}</p>
            </div>
            <div className="emergency-risk-actions">
              <button className="btn btn-secondary" onClick={backToForm}>{t('取消')}</button>
              <button className="btn btn-danger" onClick={confirmEmergency}>{t('我已了解，继续')}</button>
            </div>
          </div>
        </>
      )}

      {/* 紧急登录验证（邮箱+人脸，规格 5.5） */}
      {stage === 'emergency-verify' && (
        <SecurityVerifySheet
          open
          factors={emergencyFactors}
          onVerified={onEmergencyVerified}
          onClose={backToForm}
          subtitle={t('紧急登录：完成以下验证以重置安全项')}
        />
      )}
    </div>
  );
}

// 阻断式重绑：绑定新 Passkey（模拟系统面板；与 GaSetupFlow 二选一）
function RebindPasskey({ onDone }) {
  const { t } = useLang();
  const [simulating, setSimulating] = useState(false);

  const handleBind = () => {
    setSimulating(true);
    setTimeout(() => {
      const res = addPasskey();
      setSimulating(false);
      if (res.ok) onDone && onDone(res);
    }, 1600);
  };

  return (
    <div className="rebind-passkey">
      {simulating ? (
        <div className="svs-sim">
          <div className="svs-sim-ring">
            <Fingerprint size={34} />
            <div className="svs-sim-scan" />
          </div>
          <p className="text-sm">{t('正在创建通行密钥…')}</p>
          <p className="text-muted text-sm">{t('演示模式：模拟系统生物识别面板')}</p>
        </div>
      ) : (
        <button className="btn btn-secondary btn-full" onClick={handleBind}>
          <Fingerprint size={15} /> {t('绑定新 Passkey')}
        </button>
      )}
    </div>
  );
}

/* ================= 注册 ================= */
// 2026-10-15 UC §9.2 对齐：
// - 验证码必经：6位/5min/60s重发/24h上限10条；验证通过才建号（C14：未通过不建号、无残留——协议留痕在验证后）
// - 全局判重（R3）：命中仅提示「已注册」，不披露任何关联账号
// - 注册≠登录（UC 语义）：成功后进确认页，主动线「开始身份认证」免登进 KYC（向集团报备口径），
//   次链接「去登录」严格走 UC 两段语义
// - 注册账号落库为登录强制因子通道（P0）：仅邮箱注册 → currentUser.email
export function RegisterPage({ navigate, setIsLoggedIn, setUser, setToast }) {
  const { t } = useLang();
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    verifyCode: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // 验证码（UC §9.2）与注册结果确认页
  const [sentCode, setSentCode] = useState(""); // Mock 模式显示验证码
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [stage, setStage] = useState('form');   // 'form' → 'success'

  // 验证码 60s 重发倒计时
  React.useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  const handleSendCode = () => {
    // 每次点击重新校验并清除上一次的错误（防残留提示与成功提示并存）
    setErrors({});
    if (!formData.account) {
      setErrors({ account: t("请输入邮箱") });
      return;
    }
    if (!isValidAccount(formData.account)) {
      setErrors({ account: t("请输入有效的邮箱地址") });
      return;
    }
    // 全局判重前置：已注册账号不发码（R3）
    if (isAccountRegistered(formData.account)) {
      setErrors({ account: t("该邮箱已注册") });
      return;
    }
    const r = sendRegisterCode(formData.account);
    if (r.success) {
      setSentCode(r.code); // Mock 模式显示验证码
      setCodeCountdown(60);
      setToast(t("验证码已发送"));
    } else {
      setErrors({ verifyCode: t(r.message) });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account) {
      newErrors.account = t("请输入邮箱");
    } else if (!isValidAccount(formData.account)) {
      newErrors.account = t("请输入有效的邮箱地址");
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

    if (!formData.verifyCode) {
      newErrors.verifyCode = t("请输入验证码");
    } else if (formData.verifyCode.length !== 6) {
      newErrors.verifyCode = t("验证码为6位数字");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 全局判重（UC §9.2/R3）：命中仅提示「已注册」，不披露任何关联账号、不建号
    if (isAccountRegistered(formData.account)) {
      setErrors({ account: t("该邮箱已注册") });
      return;
    }

    // 验证码校验（UC C14：验证未通过不建号、无任何残留——判重/建号/协议留痕均不发生）
    const vr = verifyRegisterCode(formData.account, formData.verifyCode);
    if (!vr.success) {
      setErrors({ verifyCode: t(vr.message) });
      return;
    }

    setIsLoading(true);

    // 模拟注册请求：全部校验通过 → 建号并置「正常」（已激活）
    setTimeout(() => {
      const account = formData.account;
      const userData = createFreshUser({ id: `user-${Date.now()}`, email: account });
      // P0（UC §9.4 前置）：注册账号落库为登录强制因子通道——仅邮箱
      // 协议签署（2026-10-15 · UC 对齐）：注册=集团 UC 身份层开户，基金业务协议（三件套）
      // 后置到 KYC 通过后首次进 APP 的开户协议闸门签署（type:'onboarding'），注册环节零协议勾选
      // mock 注册账号表：支持「注册成功 → 去登录」链路（内存态，见 data.js registerAccount 注释）
      registerAccount(account, formData.password);
      // 桥梁同步（2026-10-12 约定）：注册即把 data.js 单例切成新用户，确认页「开始身份认证」的
      // 门控与 KYC 流程读的就是这个新账号
      setMockCurrentUser(userData);
      setIsLoading(false);
      setStage('success');
    }, 800);
  };

  // 主动线（报备口径）：免登进入 KYC 合规流
  const finishRegistration = () => {
    setIsLoggedIn(true);
    setUser({ id: currentUserData.id, email: currentUserData.email, name: currentUserData.name });
    setToast(t("注册成功"));
    navigate("kyc-start");  // 合规要求：注册后直接进入 KYC 流程
  };

  // 注册成功确认页（UC §9.2 regok 对应：注册≠登录，状态显式表达）
  if (stage === 'success') {
    return (
      <div className="auth-page">
        <AuthHero compact title={t('注册成功，账号已激活')} subtitle={t('验证码校验通过，账号已创建并激活')} />
        <div className="auth-body">
          <div className="auth-card">
            <div className="auth-success-icon">✓</div>
            <button
              className="auth-button primary"
              onClick={finishRegistration}
            >
              {t('开始身份认证')}
            </button>
            <p className="auth-terms-hint text-muted">
              {t('已有账号？')}
              <a href="#login" className="auth-footer-link">{t('去登录')}</a>
            </p>
          </div>
        </div>
        <AuthFooter>
          <span>{t('已有账号？')}</span>
          <a href="#login" className="auth-footer-link">{t('立即登录')}</a>
        </AuthFooter>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="auth-page">
      <AuthHero compact title={t('注册')} subtitle={t('创建您的平台账号')} />

      <div className="auth-body">
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('邮箱')}</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="text"
                  inputMode="email"
                  name="account"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱')}
                  value={formData.account}
                  onChange={handleChange}
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

            {/* 验证码（UC §9.2：验证通过才建号 C14） */}
            <div className="form-group">
              <label className="form-label">{t('验证码')}</label>
              <div className="code-input-group">
                <input
                  type="text"
                  inputMode="numeric"
                  name="verifyCode"
                  maxLength={6}
                  className={`form-input ${errors.verifyCode ? 'error' : ''}`}
                  placeholder={t('请输入6位验证码')}
                  value={formData.verifyCode}
                  onChange={(e) => setFormData(f => ({ ...f, verifyCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                />
                <button
                  type="button"
                  className="code-send-btn"
                  onClick={handleSendCode}
                  disabled={codeCountdown > 0}
                >
                  {codeCountdown > 0 ? `${codeCountdown}s` : t('获取验证码')}
                </button>
              </div>
              {errors.verifyCode && <span className="error-text">{errors.verifyCode}</span>}
              {sentCode && (
                <span className="form-hint">{t('演示模式验证码')}: <strong>{sentCode}</strong></span>
              )}
            </div>

            <p className="auth-pi-note">{t('您确认本人为香港《证券及期货条例》定义的专业投资者')}</p>

            {/* 协议勾选区已后置（2026-10-15 · UC 对齐）：注册=身份层开户，基金协议在 KYC 通过后开户闸门签署 */}
            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading}
              style={isLoading ? undefined : { opacity: 1 }}
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

  // 步骤1：发送验证码
  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!account.trim()) {
      setErrors({ account: t('请输入邮箱') });
      return;
    }
    if (!isValidAccount(account)) {
      setErrors({ account: t('请输入有效的邮箱地址') });
      return;
    }
    
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
    if (newPassword.length < 8) {
      setErrors({ newPassword: t('密码至少需要 8 个字符') });
      return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setErrors({ newPassword: t('密码需同时包含字母和数字') });
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
                    placeholder={t('请输入新密码（至少8位，含字母和数字）')}
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
      <AuthHero compact title={t('忘记密码')} subtitle={t('输入您的注册邮箱，我们将发送验证码')} />
      <div className="auth-body">
        <div className="auth-card">
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label className="form-label">{t('邮箱')}</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="text"
                  inputMode="email"
                  className={`form-input ${errors.account ? 'error' : ''}`}
                  placeholder={t('请输入邮箱')}
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
