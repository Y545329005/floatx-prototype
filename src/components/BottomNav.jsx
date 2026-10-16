import { Briefcase, Calendar, User } from 'lucide-react';
import { useLang } from '../i18n';

// 顺序：前期主打路演，路演在前（2026-08-06 调整）
// 2026-10-16 首期裁剪：「我的资产」Tab 摘除（基金无线上账户+暂无项目，资产树整树下线，二期恢复）
const tabs = [
  { key: 'events', label: '路演活动', icon: Calendar },
  { key: 'projects', label: '项目市场', icon: Briefcase },
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
