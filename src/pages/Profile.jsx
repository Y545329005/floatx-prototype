import { Shield, ChevronRight, LogOut, FileText, Bell, Settings, HelpCircle, BadgeCheck, Info, Award } from 'lucide-react';
import { currentUser, notifications, KYC_STATUS } from '../mock/data';
import AccountManager from '../components/AccountManager';
import { useLang } from '../i18n';

export default function Profile({ navigate, setIsLoggedIn }) {
  const { t } = useLang();
  const unreadCount = notifications.filter(n => !n.read).length;
  const menuItems = [
    { icon: FileText, label: t('合规报告'), sub: t('资产报告 · 合规披露'), hash: '#reports' },
    { icon: Bell, label: t('消息通知'), sub: t('申购 · 路演 · 资金动态'), hash: '#notifications', badge: unreadCount },
    { icon: Settings, label: t('账户设置'), sub: t('个人信息 · 认证 · 安全'), hash: '#settings' },
    { icon: HelpCircle, label: t('帮助中心'), sub: t('常见问题 · 客服支持'), hash: '#help' },
    { icon: Info, label: t('关于'), sub: t('公司信息 · 政策文件'), hash: '#about' },
  ];

  // 2026-08-14：PI 独立审核流——PI 入口由 currentUser.pi.status 驱动（不再与 piCertified 捆绑）
  // verified=已认证（badge 已显示，无入口）；pending=待审核（看状态页）；rejected/expired=重新认证；其余=申报
  const piStatus = currentUser.pi?.status || 'none';
  let piEntry = null;
  if (currentUser.kyc_status === KYC_STATUS.APPROVED) {
    if (piStatus === 'pending') {
      piEntry = { target: '#pi-submitted', title: t('PI 认证审核中'), sub: t('已提交申请，1-3 个工作日内完成审核') };
    } else if (piStatus === 'rejected') {
      piEntry = { target: '#kyc-pi', title: t('重新提交 PI 认证'), sub: t('上次申请未通过，点击重新提交') };
    } else if (piStatus === 'verified') {
      // 已认证——检查是否过期（派生 EXPIRED）
      const expiresAt = currentUser.pi?.expiresAt;
      if (expiresAt && new Date(expiresAt.replace(' ', 'T')).getTime() < Date.now()) {
        piEntry = { target: '#kyc-pi', title: t('PI 认证已过期'), sub: t('重新认证以恢复参与资格') };
      }
    } else {
      piEntry = { target: '#kyc-pi', title: t('成为专业投资者'), sub: t('解锁优先认购权，享稀缺份额优先配置') };
    }
  }

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
            <span className="pi-badge">
              <BadgeCheck size={12} />
              {t('PI 认证投资者')}
            </span>
            {currentUser.pi && (
              <span className="investor-no">{currentUser.pi.investorNo}</span>
            )}
          </div>
        </div>
      </div>

      <AccountManager onEscalate={() => navigate('#support')} compact />

      {/* PI 入口（KYC 已通过，按 PI 独立状态显示：申报/审核中/重提/过期） */}
      {piEntry && (
        <div className="kyc-pi-entry">
          <div className="menu-item" onClick={() => navigate(piEntry.target)}>
            <div className="kyc-pi-entry-icon">
              <Award size={20} />
            </div>
            <span className="menu-item-label" style={{ flex: 1 }}>
              <span className="menu-item-title">{piEntry.title}</span>
              <span className="menu-item-sub">{piEntry.sub}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </div>
        </div>
      )}

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
