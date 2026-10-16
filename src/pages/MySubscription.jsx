import { useState } from 'react';
import { ArrowLeft, User, Building2, Zap, PenLine, RefreshCcw } from 'lucide-react';
import { getProjectById, getInvestorRoster, currentUser, getInvestorNo, formatCurrency, formatISODateTime, historyTypeLabels, actorLabels, subscriptionStatusLabels, subscriptions, getSigningEvidenceBySub, formatListDateTime, resetSubscriptionForDemo } from '../mock/data';
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
  const [, setRefresh] = useState(0);
  const subRecord = subscriptions.find(s => s.id === id);

  if (!subRecord) {
    return (
      <div className="page my-subscription-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#subscriptions')}><ArrowLeft size={20} /></button>
            <h1>{t('我的申购')}</h1>
          </div>
        </div>
        <div className="empty-state">{t('未找到该申购记录')}</div>
      </div>
    );
  }

  const project = getProjectById(subRecord.projectId);
  const investorRoster = getInvestorRoster(project);
  const myInvestorNo = getInvestorNo(currentUser.id);
  const myIndex = investorRoster.findIndex(r => r.investorNo === myInvestorNo);
  const myRank = myIndex >= 0 ? myIndex + 1 : investorRoster.length;

  return (
    <div className="page my-subscription-page">
      <div className="subpage-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack('#subscriptions')}><ArrowLeft size={20} /></button>
          <h1>{subRecord.projectName}</h1>
          <StatusBadge status={subRecord.status} />
        </div>
      </div>

      {/* 资金状态卡 */}
      <div className="card my-sub-status-card">
        <div className="subscription-info-row">
          <span>{t('意向金额')}</span>
          <strong className="date-iso">HK$ {formatCurrency(subRecord.amount || 0)}</strong>
        </div>
        {/* 2026-10-16 口径修订：资金与 SPV 签署全线下——原「冻结宽限期/冻结语义说明」
            （钱包语义）摘除，allocated 改为线下打款与签署指引 */}
        {subRecord.status === 'allocated' && (
          <p className="freeze-note">{t('已获配额：请按客户经理指引完成线下打款；SPV 协议将在线下签署，专人协助安排')}</p>
        )}
        {subRecord.shares && (
          <div className="subscription-info-row">
            <span>{t('获得份额')}</span>
            <strong>{subRecord.shares} {t('份')}</strong>
          </div>
        )}
        <div className="subscription-info-row">
          <span>{t('提交时间')}</span>
          <span className="date-iso">{formatISODateTime(subRecord.createdAt)}</span>
        </div>
        <SubscriptionMilestone status={subRecord.status} />
      </div>

      {/* 线下打款与签署指引（仅 allocated 显示）。2026-10-16 口径修订：原「APP 内电子签署」
          指引卡（含 #spv-sign 跳转）摘除——大额资金交易签署全线下，APP 只做意向收集与进度查看 */}
      {subRecord.status === 'allocated' && (
        <div className="card card-secondary sign-guide-card">
          <div className="card-title">{t('线下打款与签署')}</div>
          <p className="sign-guide-desc">{t('本基金为线下认购：获配后请按客户经理指引完成线下资金交割，SPV 协议将在线下完成签署，专属客户经理将全程协助安排。')}</p>
        </div>
      )}

      {/* 签署凭证（signed 后展示：APP 内电子签署 / 线下登记的证据摘要，2026-09-15） */}
      {subRecord.status === 'signed' && (() => {
        const ev = getSigningEvidenceBySub(subRecord.id);
        if (!ev) return null;
        return (
          <div className="card card-secondary sign-evidence-card">
            <div className="card-title"><PenLine size={14} className="inline-icon" /> {t('签署凭证')}</div>
            <div className="subscription-info-row"><span>{t('签署编号')}</span><strong className="date-iso">{ev.signedRef}</strong></div>
            <div className="subscription-info-row"><span>{t('协议版本')}</span><strong className="date-iso">{ev.agreementVersion}{ev.agreementHash ? ` · ${t('哈希已固化')}` : ''}</strong></div>
            <div className="subscription-info-row"><span>{t('签署方式')}</span><strong>{ev.source === 'app' ? t('APP 内电子签署') : t('线下签署登记')}</strong></div>
            <div className="subscription-info-row"><span>{t('签署时间')}</span><strong className="date-iso">{formatListDateTime(ev.signedAt)}</strong></div>
            {ev.signatureImage && (
              <div className="sign-evidence-signature">
                <img src={ev.signatureImage} alt={t('电子签名')} loading="lazy" decoding="async" />
              </div>
            )}
          </div>
        );
      })()}

      {/* 重新演示签署流程（仅 signed 状态显示，重置为 allocated 后可重新体验） */}
      {subRecord.status === 'signed' && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => {
            resetSubscriptionForDemo(subRecord.id);
            setRefresh(v => v + 1);
          }}
        >
          <RefreshCcw size={13} /> {t('重新演示签署流程')}
        </button>
      )}

      {/* 我的位次 */}
      {project && (
        <div className="card card-secondary">
          <div className="card-title">{t('我的位次')}</div>
          {subRecord.status !== 'unallocated' && (
            <div className="heat-my-rank">
              <div className="heat-my-rank-left">
                <strong>{t('我的意向提交次序')}</strong>
                <span className="text-muted text-sm">{t('提交于 {}').replace('{}', formatISODateTime(subRecord.createdAt))}</span>
              </div>
              <div className="heat-my-rank-right">
                <span className="heat-my-rank-label">{t('当前排位')}</span>
                <strong>{t('第 {} 位').replace('{}', myRank)}</strong>
              </div>
            </div>
          )}
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