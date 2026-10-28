import { useState } from 'react';
import { Shield, ChevronRight, LogOut, Bell, Settings, HelpCircle, BadgeCheck, Info, Award } from 'lucide-react';
import { currentUser, notifications, KYC_STATUS, PI_STATUS, getPiStatusForUser } from '../mock/data';
import AccountManager from '../components/AccountManager';
import { useLang } from '../i18n';

export default function Profile({ navigate, setIsLoggedIn }) {
  const { t } = useLang();
  // 2026-09-11 定向通知后：未读计数只统计当前用户可见通知（全员 + 发给当前用户）
  const unreadCount = notifications.filter(n => !n.toUserId || n.toUserId === currentUser.id).filter(n => !n.read).length;
  // 2026-10-16 首期裁剪：合规报告入口摘除（#reports 随资产树下线）；消息通知副标题去申购/资金口径
  // 2026-10-28：基金结单入口迁至「资产」Tab（钱的事在资产，人的事在我的——避免两处入口分叉）
  const menuItems = [
    { icon: Bell, label: t('消息通知'), sub: t('问卷 · 路演动态'), hash: '#notifications', badge: unreadCount },
    { icon: Settings, label: t('账户设置'), sub: t('个人信息 · 认证 · 安全'), hash: '#settings' },
    { icon: HelpCircle, label: t('帮助中心'), sub: t('常见问题 · 客服支持'), hash: '#help' },
    { icon: Info, label: t('关于'), sub: t('公司信息 · 政策文件'), hash: '#about' },
  ];

  // 2026-08-14：PI 独立审核流——PI 状态由 currentUser.pi.status 驱动（不再与 piCertified 捆绑）
  // 2026-09-20：PI 状态入口统一由下方 piMeta badge 承担（全状态可点击直达，原 piEntry 引导卡
  // 在所有态与 badge 跳转目标重复，整块删除节省页面空间、保持信息单一承载）
  // 2026-10-16：PI 状态判定移至下方与门控同源（getPiStatusForUser），原三行 expiresAt 手工计算删除

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
  // rejected/expired 同步补齐（KYC badge 即全状态直达）。
  // 2026-10-16：状态判定与门控同源——getPiStatusForUser 含「verified 且过期 → EXPIRED」派生，
  // 门控与 badge 不再各自计算 expiresAt（防两处口径漂移）
  const piMeta = {
    pending:  { label: 'PI 审核中',     cls: 'pi-pending',  target: '#pi-submitted' },
    rejected: { label: 'PI 未通过',     cls: 'pi-error',    target: '#kyc-pi' },
    expired:  { label: 'PI 已过期',     cls: 'pi-error',    target: '#kyc-pi' },
    verified: { label: 'PI 认证投资者', cls: 'pi-verified', target: null },
    none:     { label: 'PI 未认证',     cls: 'pi-muted',    target: '#kyc-pi' },
  };
  const piStateMap = {
    [PI_STATUS.APPROVED]: 'verified',
    [PI_STATUS.EXPIRED]: 'expired',
    [PI_STATUS.PENDING_REVIEW]: 'pending',
    [PI_STATUS.REJECTED]: 'rejected',
  };
  const piState = piStateMap[getPiStatusForUser(currentUser.id)] || 'none';
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
