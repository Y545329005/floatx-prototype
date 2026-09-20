import { useState } from 'react';
import { ArrowLeft, ClipboardList, Calendar, Wallet, Headphones, CheckCheck, Trash2, X } from 'lucide-react';
import { notifications, currentUser, markNotificationRead, removeNotification, clearNotifications } from '../mock/data';
import { useLang } from '../i18n';

const typeMeta = {
  subscription: { labelKey: '申购', icon: ClipboardList, cls: 'sub' },
  event: { labelKey: '活动', icon: Calendar, cls: 'event' },
  wallet: { labelKey: '资金', icon: Wallet, cls: 'wallet' },
  service: { labelKey: '服务', icon: Headphones, cls: 'service' },
};

const tabs = [
  { key: 'all', labelKey: '全部' },
  { key: 'subscription', labelKey: '申购' },
  { key: 'event', labelKey: '活动' },
  { key: 'wallet', labelKey: '资金' },
  { key: 'service', labelKey: '服务' },
];

export default function Notifications({ navigate, goBack }) {
  const { t } = useLang();
  const [tab, setTab] = useState('all');
  // refresh hack：依赖 mock 数据修改后强制组件重渲染（unread 状态变化、markNotificationRead 后 UI 同步）
  const [, setRefresh] = useState(0);

  // 2026-09-11 定向通知后：收件箱 = 全员通知（无 toUserId）+ 发给当前用户的通知
  const myNotifications = notifications.filter(n => !n.toUserId || n.toUserId === currentUser.id);

  const list = myNotifications
    .filter(n => tab === 'all' || n.type === tab)
    .map(n => ({ ...n }));

  const handleRead = (n) => {
    if (!n.read) {
      markNotificationRead(n.id);
      setRefresh(r => r + 1);
    }
  };

  const handleRemove = (n) => {
    removeNotification(n.id);
    setRefresh(r => r + 1);
  };

  const markAllRead = () => {
    myNotifications.forEach(n => markNotificationRead(n.id));
    setRefresh(r => r + 1);
  };

  const handleClearAll = () => {
    if (myNotifications.length === 0) return;
    if (window.confirm(t('清空全部通知？此操作不可恢复。'))) {
      clearNotifications(currentUser.id);
      setRefresh(r => r + 1);
    }
  };

  const unreadCount = myNotifications.filter(n => !n.read).length;
  // 各分类未读数（#25 收口）：tabs 徽章，全部 = 总未读，分类 = 该分类未读
  const unreadByType = (key) =>
    key === 'all'
      ? myNotifications.filter(n => !n.read).length
      : myNotifications.filter(n => n.type === key && !n.read).length;

  return (
    <div className="page notifications-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#profile')}><ArrowLeft size={20} /></button>
          <h1>{t('消息通知')}</h1>
          {myNotifications.length > 0 && (
            <div className="notifications-actions">
              {unreadCount > 0 && (
                <button className="notifications-all-read" onClick={markAllRead}>
                  <CheckCheck size={14} /> {t('全部已读')}
                </button>
              )}
              <button className="notifications-clear" onClick={handleClearAll}>
                <Trash2 size={14} /> {t('清空')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="segmented-control notification-tabs">
        {tabs.map(tb => {
          const cnt = unreadByType(tb.key);
          return (
            <button
              key={tb.key}
              className={tab === tb.key ? 'active' : ''}
              onClick={() => setTab(tb.key)}
            >
              {t(tb.labelKey)}
              {cnt > 0 && <span className="notification-tab-count">{cnt > 99 ? '99+' : cnt}</span>}
            </button>
          );
        })}
      </div>

      <div className="notification-list">
        {list.length === 0 && (
          <div className="notification-empty">
            <p className="text-muted">{t('暂无相关通知')}</p>
          </div>
        )}
        {list.map(n => {
          const meta = typeMeta[n.type] || typeMeta.service;
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              className={`notification-item ${n.read ? '' : 'unread'}`}
              onClick={() => handleRead(n)}
            >
              <div className={`notification-icon ${meta.cls}`}>
                <Icon size={16} />
              </div>
              <div className="notification-body">
                <div className="notification-title-row">
                  <strong>{n.title}</strong>
                  {!n.read && <span className="unread-dot" />}
                </div>
                <p className="notification-text">{n.body}</p>
                <span className="notification-time">{n.createdAt}</span>
              </div>
              <button className="notification-delete" title={t('删除')} onClick={e => { e.stopPropagation(); handleRemove(n); }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
