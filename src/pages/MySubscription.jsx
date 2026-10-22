import { ArrowLeft, User, Building2, Zap } from 'lucide-react';
import { getProjectById, formatCurrency, formatISODateTime, historyTypeLabels, actorLabels, subscriptionStatusLabels, subscriptions } from '../mock/data';
import SubscriptionMilestone from '../components/SubscriptionMilestone';
import { useLang } from '../i18n';

// 操作执行方图标（审计凭证：谁执行了该动作）
const actorIcons = { user: User, platform: Building2, system: Zap };

function StatusBadge({ status }) {
  const { t } = useLang();
  const label = t(subscriptionStatusLabels[status] || subscriptionStatusLabels.submitted);
  return (
    <span className={`detail-header-badge status-${status}`}>
      {label}
    </span>
  );
}

export default function MySubscription({ id, navigate, goBack }) {
  const { t } = useLang();
  const subRecord = subscriptions.find(s => s.id === id);

  if (!subRecord) {
    return (
      <div className="page my-subscription-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#projects')}><ArrowLeft size={20} /></button>
            <h1>{t('我的问卷')}</h1>
          </div>
        </div>
        <div className="empty-state">{t('未找到该问卷记录')}</div>
      </div>
    );
  }

  const project = getProjectById(subRecord.projectId);
  // 2026-10-22 RO 整改：移除「我的位次」（排位属竞争性招揽语义，与热度页同批下线）

  return (
    <div className="page my-subscription-page">
      <div className="subpage-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack(`#project/${subRecord.projectId}`)}><ArrowLeft size={20} /></button>
          <h1>{subRecord.projectName}</h1>
          <StatusBadge status={subRecord.status} />
        </div>
      </div>

      {/* 问卷状态卡 */}
      <div className="card my-sub-status-card">
        <div className="subscription-info-row">
          <span>{t('意向档位')}</span>
          <strong className="date-iso">{(subRecord.amount || 0) > 0 ? `HK$ ${formatCurrency(subRecord.amount || 0)}` : t('无意向')}</strong>
        </div>
        <div className="subscription-info-row">
          <span>{t('提交时间')}</span>
          <span className="date-iso">{formatISODateTime(subRecord.createdAt)}</span>
        </div>
        <SubscriptionMilestone status={subRecord.status} />
      </div>

      {/* 后续安排（2026-10-22 RO 整改：去 SPV 措辞——平台不设立/签署任何特殊目的载体，
          后续安排由客户经理线下与投资人协调） */}
      {subRecord.status === 'allocated' && (
        <div className="card card-secondary sign-guide-card">
          <div className="card-title">{t('后续安排')}</div>
          <p className="sign-guide-desc">{t('如需进一步了解或推进后续安排，专属客户经理将全程协助并线下与您联系。')}</p>
        </div>
      )}

      {/* 操作历史（独立卡） */}
      {subRecord.history && subRecord.history.length > 0 && (
        <div className="card card-secondary history-card">
          <div className="card-title">{t('操作历史')}</div>
          <ol className="history-list">
            {subRecord.history.map((h, i) => (
              <li key={i} className={`history-item actor-${h.actor}`}>
                <span className="history-dot" />
                <div className="history-content">
                  <div className="history-row1">
                    <span className={`history-title actor-${h.actor}`}>
                      {(() => { const Icon = actorIcons[h.actor] || Zap; return <Icon size={13} />; })()}
                      <span>
                        {t(actorLabels[h.actor]) || h.actor} · {t(historyTypeLabels[h.type]) || h.type}
                      </span>
                    </span>
                    <span className="history-time date-iso">{formatISODateTime(h.timestamp)}</span>
                  </div>
                  <div className="history-row2">
                    <span className="history-note">{h.note}</span>
                    {h.amount !== undefined && h.amount !== 0 && (
                      <strong className={`history-amount ${h.amount > 0 ? 'positive' : 'negative'}`}>
                        {h.amount > 0 ? '+' : ''}HK$ {formatCurrency(Math.abs(h.amount || 0))}
                      </strong>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 回项目详情（对称项目详情页 text-btn-cta） */}
      {project && (
        <button className="text-btn-cta" onClick={() => navigate(`#project/${project.id}`)}>
          {t('查看项目详情')} ›
        </button>
      )}
    </div>
  );
}