import { Wallet, ClipboardList, PieChart, ChevronRight } from 'lucide-react';
import { assetHistory, holdings, currentUser, exchangeRates, transactions, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

const SPARK_W = 340;
const SPARK_H = 38;
const SPARK_PAD = 4;

export default function AssetOverview({ navigate }) {
  const { t } = useLang();
  const latestTotal = assetHistory[assetHistory.length - 1].total;

  const usdToHkd = exchangeRates['usd-hkd'].rate;
  const monthInflow = transactions
    .filter(t => t.createdAt.startsWith('2026-07'))
    .reduce((s, t) => {
      if (t.type === 'deposit') return s + t.amount * (t.currency === 'USD' ? usdToHkd : 1);
      if (t.type === 'withdraw') return s - t.amount * (t.currency === 'USD' ? usdToHkd : 1);
      return s;
    }, 0);

  const sparkMax = Math.max(...assetHistory.map(a => a.total));
  const sparkMin = Math.min(...assetHistory.map(a => a.total));
  const sparkSpan = sparkMax - sparkMin || 1;
  const sparkPts = assetHistory.map((a, i) => {
    const x = (SPARK_W - SPARK_PAD * 2) * (i / (assetHistory.length - 1)) + SPARK_PAD;
    const y = SPARK_H - SPARK_PAD - ((a.total - sparkMin) / sparkSpan) * (SPARK_H - SPARK_PAD * 2);
    return { x, y };
  });
  const sparkStr = sparkPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const sparkArea = `${sparkPts[0].x.toFixed(1)},${SPARK_H} ${sparkStr} ${sparkPts[sparkPts.length - 1].x.toFixed(1)},${SPARK_H}`;

  const hkd = currentUser.account.hkd;
  const frozen = currentUser.account.frozen;
  const holdingsValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const holdingsCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalPnl = holdingsValue - holdingsCost;
  const pnlPct = holdingsCost > 0 ? (totalPnl / holdingsCost * 100).toFixed(1) : '0.0';

  const sign = up => (up ? '+' : '-');

  return (
    <div className="page asset-overview-page">
      <div className="asset-hero-card">
        <div className="asset-hero-head">
          <span className="asset-hero-label">{t('总资产（折合 HKD）')}</span>
          <button className="asset-hero-more" onClick={() => navigate('#asset-trend')}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="asset-hero-main">
          <div className="asset-hero-value">{formatCurrency(latestTotal)}</div>
          <div className="asset-hero-spark" onClick={() => navigate('#asset-trend')}>
            <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="assetSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={sparkArea} fill="url(#assetSparkFill)" />
              <polyline points={sparkStr} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="asset-hero-change">
          <span className={monthInflow >= 0 ? 'up' : 'down'}>
            {t('本月净入金')} {formatCurrency(Math.abs(monthInflow))}
          </span>
        </div>

        <div className="asset-hero-stats">
          <div>
            <span>{t('可用资金')}</span>
            <strong>{formatCurrency(hkd)}</strong>
          </div>
          <div>
            <span>{t('持仓市值')}</span>
            <strong>{formatCurrency(holdingsValue)}</strong>
          </div>
          <div>
            <span>{t('冻结资金')}</span>
            <strong>{formatCurrency(frozen)}</strong>
          </div>
        </div>
      </div>

      <div className="asset-actions">
        <button className="asset-action" onClick={() => navigate('#wallet')}>
          <span className="asset-action-icon"><Wallet size={18} /></span>
          <span>{t('钱包')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#subscriptions')}>
          <span className="asset-action-icon"><ClipboardList size={18} /></span>
          <span>{t('申购记录')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#funds')}>
          <span className="asset-action-icon"><PieChart size={18} /></span>
          <span>{t('基金')}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title no-margin">{t('持仓概览')}</h3>
          <button className="text-btn link-btn" onClick={() => navigate('#holdings')}>
            {t('查看全部')} <ChevronRight size={14} />
          </button>
        </div>
        {holdings.length === 0 ? (
          <p className="text-muted text-sm">暂无持仓</p>
        ) : (
          <>
            <div className="position-summary">
              <div>
                <span>{t('持仓市值')}</span>
                <strong>HK$ {formatCurrency(holdingsValue)}</strong>
              </div>
              <div>
                <span>{t('估值变动（按最新轮）')}</span>
                <strong className={totalPnl >= 0 ? 'up' : 'down'}>
                  {sign(totalPnl >= 0)}HK$ {formatCurrency(Math.abs(totalPnl))}（{sign(totalPnl >= 0)}{pnlPct}%）
                </strong>
              </div>
            </div>
            <div className="holding-preview-list">
              {holdings.map(h => (
                <div key={h.id} className="holding-preview-row" onClick={() => navigate(`#project/${h.projectId}`)}>
                  <div className="holding-preview-name">
                    <span className="holding-preview-dot">{h.projectName[0]}</span>
                    <span>{h.projectName}</span>
                  </div>
                  <div className="holding-preview-right">
                    <strong>HK$ {formatCurrency(h.currentValue)}</strong>
                    <span className={h.return >= 0 ? 'up' : 'down'}>{h.return >= 0 ? '+' : ''}{h.return}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
