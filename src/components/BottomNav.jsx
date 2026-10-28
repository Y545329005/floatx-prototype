import { Briefcase, Calendar, Coins, PieChart, User } from 'lucide-react';
import { useLang } from '../i18n';

// 2026-10-27：新增「基金」Tab（一期：线下收款 + 人工确认 + 结单）
// 2026-10-28：新增「资产」Tab（只读聚合：现金 + 持仓 + 收益），5 Tab
// 顺序：路演 / 项目市场 / 基金 / 资产 / 我的
const tabs = [
  { key: 'events', label: '路演活动', icon: Calendar },
  { key: 'projects', label: '项目市场', icon: Briefcase },
  { key: 'funds', label: '基金', icon: Coins },
  { key: 'asset', label: '资产', icon: PieChart },
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
