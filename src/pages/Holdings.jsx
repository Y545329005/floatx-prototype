import { useState } from 'react';
import { ArrowLeft, X, BadgeCheck } from 'lucide-react';
import { holdings, exitEvents, confirmExitEvent, EXIT_TYPE_META, getProjectById, getProjectHeroGradient, getProjectHeroEmoji, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

export default function Holdings({ navigate, goBack }) {
  const { t } = useLang();
  const [items, setItems] = useState(holdings.map(h => ({ ...h })));
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmDone, setConfirmDone] = useState(false);

  // 事件驱动退出（2026-08-21 重构）：LP 不再主动申请，只确认 GP 发起的退出分配
  // 每个持仓项目至多关联一个进行中的分配事件（announced 待确认 / paying 打款中）
  const activeExitByProject = exitEvents
    .filter(ev => ev.status === 'announced' || ev.status === 'paying')
    .reduce((m, ev) => { m[ev.projectId] = ev; return m; }, {});

  const totalValue = items.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = items.reduce((s, h) => s + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost * 100).toFixed(1) : '0.0';

  const handleConfirm = () => {
    if (!confirmTarget) return;
    confirmExitEvent(confirmTarget.id);
    setConfirmTarget(null);
    setConfirmDone(true);
    setTimeout(() => setConfirmDone(false), 2500);
    setItems(holdings.map(h => ({ ...h })));
  };

  return (
    <div className="page holdings-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#assets')}><ArrowLeft size={20} /></button>
          <h1>{t('我的持仓')}</h1>
        </div>
      </div>

      {items.length > 0 && (
        <div className="holdings-summary-card">
          <div className="holdings-summary-label">{t('持仓市值')}</div>
          <div className="holdings-summary-value">HK$ {formatCurrency(totalValue)}</div>
          <div className="holdings-summary-pnl">
            <span>{t('估值变动（按最新轮）')}</span>
            <strong className={totalPnl >= 0 ? 'up' : 'down'}>
              {totalPnl >= 0 ? '+' : '-'}HK$ {formatCurrency(Math.abs(totalPnl))}（{pnlPct}%）
            </strong>
          </div>
          <div className="holdings-summary-meta">
            <span>{t('共')} {items.length} {t('项持仓')}</span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">{t('暂无持仓')}</div>
      ) : (
        items.map(h => {
          const project = getProjectById(h.projectId);
          const bg = project ? getProjectHeroGradient(project.sector) : 'var(--primary-light)';
          const emoji = project ? getProjectHeroEmoji(project.sector) : '◆';
          const ev = activeExitByProject[h.projectId];
          return (
            <div key={h.id} className="card holding-card">
              <div className="holding-card-hero" style={{ background: bg }} onClick={() => navigate(`#project/${h.projectId}`)}>
                {project && project.coverImage ? (
                  <img src={project.coverImage} alt={h.projectName} />
                ) : (
                  <span className="holding-card-hero-emoji">{emoji}</span>
                )}
                <div className="holding-card-hero-top">
                  <h4>{h.projectName}</h4>
                  {h.return >= 0 ? (
                    <span className="holding-return positive">+{h.return}%</span>
                  ) : (
                    <span className="holding-return negative">{h.return}%</span>
                  )}
                </div>
              </div>
              <div className="holding-card-body">
                <div className="holding-row">
                  <span>{t('持有标的')}</span>
                  <span>{h.spvName}</span>
                </div>
                <div className="holding-row">
                  <span>{t('持有份额')}</span>
                  <span>{h.shares} {t('份')}</span>
                </div>
                <div className="holding-row">
                  <span>{t('成本价')}</span>
                  <span>HK$ {formatCurrency(h.costBasis)}</span>
                </div>
                {!ev && (
                  <div className="holding-row">
                    <span>{t('当前估值')}</span>
                    <strong>HK$ {formatCurrency(h.currentValue)}</strong>
                  </div>
                )}
                {h.dividendReceived > 0 && (
                  <div className="holding-row holding-dividend-row">
                    <span>{t('累计分红')}</span>
                    <strong className="up">HK$ {formatCurrency(h.dividendReceived)}</strong>
                  </div>
                )}

                {/* 退出分配状态区（事件驱动：GP 发起 → LP 确认 → 打款中 → 到账） */}
                {ev && (
                  <div className="exit-event-block">
                    <div className="exit-event-head">
                      <span className="tag tag-warning">{EXIT_TYPE_META[ev.exitType]?.label || t('退出分配')}</span>
                      <span className="text-muted text-sm">{ev.orderNo}</span>
                    </div>
                    <div className="holding-row">
                      <span>{t('每份对价')}</span>
                      <span>HK$ {formatCurrency(ev.pricePerShare)} × {ev.totalShares} {t('份')}</span>
                    </div>
                    <div className="exit-split">
                      <div className="exit-split-row"><span>{t('本金')}</span><span>HK$ {formatCurrency(ev.costAmount)}</span></div>
                      <div className="exit-split-row"><span>{t('收益')}</span><span className="up">+HK$ {formatCurrency(ev.gainAmount)}</span></div>
                      <div className="exit-split-row"><span>{t('Carry')}（{ev.carryRate}）</span><span>-HK$ {formatCurrency(ev.carryAmount)}</span></div>
                      <div className="exit-split-row exit-split-net"><span>{t('预计净回款')}</span><strong>HK$ {formatCurrency(ev.netAmount)}</strong></div>
                    </div>
                    {ev.status === 'paying' && (
                      <div className="exit-paying-note">{t('打款已发起，预计 5-10 个工作日到账')}</div>
                    )}
                  </div>
                )}

                <div className="holding-spv-note">
                  {t('该 SPV 持有目标公司股份，本持仓为投资者持有的 SPV 份额。')}
                </div>
              </div>
              <div className="holding-card-footer">
                <span className="text-muted text-sm">{t('最近更新')}: {h.lastUpdated}</span>
                {ev && ev.status === 'announced' && (
                  <button className="btn btn-primary btn-sm" onClick={() => setConfirmTarget(ev)}>
                    <BadgeCheck size={14} /> {t('确认收款明细')}
                  </button>
                )}
                {ev && ev.status === 'paying' && (
                  <span className="tag tag-warning">{t('打款中')}</span>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* 确认收款明细弹层 */}
      {confirmTarget && (
        <>
          <div className="sheet-mask" onClick={() => setConfirmTarget(null)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('确认收款明细')}</h3>
              <button className="btn-icon" onClick={() => setConfirmTarget(null)}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {confirmTarget.projectName} · {EXIT_TYPE_META[confirmTarget.exitType]?.label}
            </p>
            <div className="fund-exit-note">
              <div className="exit-split-row"><span>{t('每份对价')}</span><span>HK$ {formatCurrency(confirmTarget.pricePerShare)} × {confirmTarget.totalShares} {t('份')}</span></div>
              <div className="exit-split-row"><span>{t('毛对价')}</span><span>HK$ {formatCurrency(confirmTarget.grossAmount)}</span></div>
              <div className="exit-split-row"><span>{t('Carry 计提')}（{confirmTarget.carryRate}）</span><span>-HK$ {formatCurrency(confirmTarget.carryAmount)}</span></div>
              <div className="exit-split-row exit-split-net"><span>{t('净回款')}</span><strong>HK$ {formatCurrency(confirmTarget.netAmount)}</strong></div>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {t('确认后平台将发起打款，资金到账可用余额，预计 5-10 个工作日。最终金额以实际分配为准。')}
            </p>
            <button className="btn btn-primary btn-full" onClick={handleConfirm}>{t('确认无误，等待打款')}</button>
          </div>
        </>
      )}

      {confirmDone && (
        <div className="toast toast-success">{t('已确认收款明细，平台将发起打款')}</div>
      )}
    </div>
  );
}
