import { Briefcase, Calendar, Wallet, User } from 'lucide-react';
import { useLang } from '../i18n';

// 顺序：前期主打路演，路演在前（2026-08-06 调整）
const tabs = [
  { key: 'events', label: '路演活动', icon: Calendar },
  { key: 'projects', label: '项目市场', icon: Briefcase },
  { key: 'assets', label: '我的资产', icon: Wallet },
  { key: 'profile', label: '我的', icon: User },
];

export default function BottomNav({ current, onNavigate }) {
  const { t } = useLang();
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = current === tab.key;
        return (
          <button
            key={tab.key}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => onNavigate(`#${tab.key}`)}
          >
            <Icon size={22} />
            <span>{t(tab.label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
