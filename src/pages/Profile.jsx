import { useState } from 'react';
import { Shield, ChevronRight, LogOut, FileText, Bell, Settings, HelpCircle, BadgeCheck, Info, Award, Palette } from 'lucide-react';
import { currentUser, notifications, KYC_STATUS } from '../mock/data';
import AccountManager from '../components/AccountManager';
import { useLang } from '../i18n';
import { getTheme, setTheme } from '../theme';

// 主题选项（2026-09-14 双皮肤）：切换即时生效，localStorage 记忆，刷新保持
const THEME_OPTIONS = [
  { value: '', label: '经典', desc: '默认金融蓝主题' },
  { value: 'hkbtc', label: 'HKBTC 2.0', desc: '公司设计 UIkit 换肤' },
];

export default function Profile({ navigate, setIsLoggedIn }) {
  const { t } = useLang();
  const [theme, setThemeState] = useState(getTheme);
  const handleTheme = (v) => { setTheme(v); setThemeState(v); };
  // 2026-09-11 定向通知后：未读计数只统计当前用户可见通知（全员 + 发给当前用户）
  const unreadCount = notifications.filter(n => !n.toUserId || n.toUserId === currentUser.id).filter(n => !n.read).length;
  const menuItems = [
    { icon: FileText, label: t('合规报告'), sub: t('资产报告 · 合规披露'), hash: '#reports' },
    { icon: Bell, label: t('消息通知'), sub: t('申购 · 路演 · 资金动态'), hash: '#notifications', badge: unreadCount },
    { icon: Settings, label: t('账户设置'), sub: t('个人信息 · 认证 · 安全'), hash: '#settings' },
    { icon: HelpCircle, label: t('帮助中心'), sub: t('常见问题 · 客服支持'), hash: '#help' },
    { icon: Info, label: t('关于'), sub: t('公司信息 · 政策文件'), hash: '#about' },
  ];

  // 2026-08-14：PI 独立审核流——PI 状态由 currentUser.pi.status 驱动（不再与 piCertified 捆绑）
  // 2026-09-20：PI 状态入口统一由下方 piMeta badge 承担（全状态可点击直达，原 piEntry 引导卡
  // 在所有态与 badge 跳转目标重复，整块删除节省页面空间、保持信息单一承载）
  const piStatus = currentUser.pi?.status || 'none';
  const piExpiresAt = currentUser.pi?.expiresAt;
  const piExpired = !!(piExpiresAt && new Date(piExpiresAt.replace(' ', 'T')).getTime() < Date.now());

  // 2026-09-11（会议纪要「我的模块：KYC 认证状态」）：KYC 状态 badge 直达展示 + 非已认证点击引导。
  // EXPIRED 不在 submitKyc 允许集合（IN_PROGRESS/REJECTED/REQUIRES_ACTION 才能重提），引导至客服而非 kyc-start
  // 2026-09-18：已提交过的状态（待审核/被拒/补件）统一跳 kyc-submitted——用户第一需求是查看审核结果/被拒原因，
  // 而非重填表单；结果页内已提供"重新提交"按钮指向 kyc-start。未提交过的状态（未开始/进行中）才直接进流程。
  const kycMeta = {
    [KYC_STATUS.APPROVED]: { label: 'KYC 已认证', cls: 'kyc-approved', target: null },
    [KYC_STATUS.PENDING_REVIEW]: { label: 'KYC 审核中', cls: 'kyc-pending', target: '#kyc-submitted' },
    [KYC_STATUS.REQUIRES_ACTION]: { label: 'KYC 待补件', cls: 'kyc-error', target: '#kyc-submitted' },
    [KYC_STATUS.REJECTED]: { label: 'KYC 未通过', cls: 'kyc-error', target: '#kyc-submitted' },
    [KYC_STATUS.EXPIRED]: { label: 'KYC 已过期', cls: 'kyc-error', target: '#support' },
    [KYC_STATUS.NOT_STARTED]: { label: 'KYC 未认证', cls: 'kyc-muted', target: '#kyc-start' },
    [KYC_STATUS.IN_PROGRESS]: { label: 'KYC 未认证', cls: 'kyc-muted', target: '#kyc-start' },
  };
  const kycBadge = kycMeta[currentUser.kyc_status] || kycMeta[KYC_STATUS.NOT_STARTED];

  // 2026-09-20：PI badge 全状态映射（对称 kycMeta）——此前 pending 无 badge，提交后「我的」页无任何 PI 状态提示；
  // rejected/expired 同步补齐（KYC badge 即全状态直达）。expired 为派生态（verified 但超 expiresAt）。
  const piMeta = {
    pending:  { label: 'PI 审核中',     cls: 'pi-pending',  target: '#pi-submitted' },
    rejected: { label: 'PI 未通过',     cls: 'pi-error',    target: '#kyc-pi' },
    expired:  { label: 'PI 已过期',     cls: 'pi-error',    target: '#kyc-pi' },
    verified: { label: 'PI 认证投资者', cls: 'pi-verified', target: null },
    none:     { label: 'PI 未认证',     cls: 'pi-muted',    target: '#kyc-pi' },
  };
  const piState = piStatus === 'verified' && piExpired ? 'expired' : piStatus;
  const piBadge = piMeta[piState] || piMeta.none;

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('#login');
  };

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {currentUser.name[0]}
        </div>
        <div className="profile-info">
          <h2>{currentUser.name}</h2>
          <p className="text-muted">{currentUser.email}</p>
          <div className="profile-badges">
            <span
              className={`pi-badge ${piBadge.cls}${piBadge.target ? ' clickable' : ''}`}
              role={piBadge.target ? 'button' : undefined}
              onClick={() => piBadge.target && navigate(piBadge.target)}
            >
              {piState === 'verified' ? <BadgeCheck size={12} /> : piState === 'none' ? <Award size={12} /> : <Shield size={12} />}
              {t(piBadge.label)}
            </span>
            {piState === 'verified' && currentUser.pi?.investorNo && (
              <span className="investor-no">{currentUser.pi.investorNo}</span>
            )}
            {kycBadge && (
              <span
                className={`kyc-badge ${kycBadge.cls}${kycBadge.target ? ' clickable' : ''}`}
                role={kycBadge.target ? 'button' : undefined}
                onClick={() => kycBadge.target && navigate(kycBadge.target)}
              >
                <Shield size={12} />
                {t(kycBadge.label)}
              </span>
            )}
          </div>
        </div>
      </div>

      <AccountManager onEscalate={() => navigate('#support')} compact />

      <div className="menu-list">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="menu-item"
              onClick={() => item.hash && navigate(item.hash)}
            >
              <Icon size={18} />
              <span className="menu-item-label">
                <span className="menu-item-title">{item.label}</span>
                <span className="menu-item-sub">{item.sub}</span>
              </span>
              {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
              <ChevronRight size={16} className="text-muted" />
            </div>
          );
        })}
      </div>

      {/* 设计主题（2026-09-14 双皮肤切换：经典 / HKBTC 2.0 kit） */}
      <div className="theme-switch">
        <div className="theme-switch-head">
          <Palette size={18} />
          <span className="menu-item-title">{t('设计主题')}</span>
        </div>
        <div className="theme-switch-options">
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`theme-option${theme === opt.value ? ' selected' : ''}`}
              onClick={() => handleTheme(opt.value)}
            >
              <span className="theme-option-swatch" data-theme-preview={opt.value} />
              <span className="theme-option-label">
                <span className="theme-option-name">{t(opt.label)}</span>
                <span className="theme-option-desc">{t(opt.desc)}</span>
              </span>
              <span className="theme-option-check" />
            </button>
          ))}
        </div>
      </div>

      <div className="profile-footer">
        <button className="menu-item" onClick={handleLogout}>
          <LogOut size={18} />
          <span className="menu-item-label">
            <span className="menu-item-title">{t('退出登录')}</span>
          </span>
          <ChevronRight size={16} className="text-muted" />
        </button>
      </div>
    </div>
  );
}
