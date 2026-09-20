import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { subscriptions, currentUser, getInvestorNo, formatCurrency, formatISODateTime, historyTypeLabels, actorLabels } from '../mock/data';
import SubscriptionMilestone from '../components/SubscriptionMilestone';
import { useLang } from '../i18n';

export default function Subscriptions({ navigate, goBack }) {
  const { t } = useLang();
  const [, setRefresh] = useState(0);
  // 多用户化（2026-08-13）：我的申购只显示当前用户的记录
  const mySubs = subscriptions.filter(s => s.investorNo === getInvestorNo(currentUser.id));
  useEffect(() => {
    const hasAllocated = subscriptions.some(s => s.status === 'allocated');
    if (!hasAllocated) return undefined;
    const timer = setInterval(() => setRefresh(v => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page subscriptions-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#assets')}><ArrowLeft size={20} /></button>
          <h1>{t('申购记录')}</h1>
        </div>
      </div>

      {mySubs.length === 0 ? (
        <div className="empty-state">{t('暂无申购记录')}</div>
      ) : (
        mySubs.map(s => (
          <div
            key={s.id}
            className="card subscription-card subscription-card-clickable"
            onClick={() => navigate(`#my-subscription/${s.id}`)}
          >
            <div className="subscription-card-top">
              <h4>{s.projectName}</h4>
              <span className={`subscription-status-dot status-${s.status}`} />
            </div>
            <div className="subscription-card-body">
              <div className="subscription-info-row">
                <span>{t('意向金额')}</span>
                <strong className="date-iso">HK$ {formatCurrency(s.amount || 0)}</strong>
              </div>
              <div className="subscription-info-row">
                <span>{t('提交时间')}</span>
                <span className="date-iso">{formatISODateTime(s.createdAt)}</span>
              </div>
              {s.frozenAmount > 0 && (
                <div className="subscription-info-row freeze-info-row">
                  <span>{t('已冻结')}</span>
                  <div className="freeze-info-right">
                    <strong className="date-iso">HK$ {formatCurrency(s.frozenAmount)}</strong>
                  </div>
                </div>
              )}
              {s.shares && (
                <div className="subscription-info-row">
                  <span>{t('获得份额')}</span>
                  <strong>{s.shares} {t('份')}</strong>
                </div>
              )}
              <SubscriptionMilestone status={s.status} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}