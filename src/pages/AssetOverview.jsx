import { ArrowLeft, Upload, Download, ClipboardList, ChevronRight, FileText, PieChart } from 'lucide-react';
import { clickable } from '../lib';
import { getFundPortfolio, myFundOrders, formatCurrency, formatExact } from '../mock/data';
import { useLang } from '../i18n';

// 资产总览（2026-10-28 基金一期重写）
// 定位：只读聚合层——只回答「我有什么、值多少、赚多少」，不发起任何交易。
// 旧版是项目制 PE 持仓（projectId/costBasis），随项目申购链路下线一并作废；
// 现口径 = 现金（可用+冻结）+ 基金持仓市值，跨币种折合 HKD。
export default function AssetOverview({ navigate, goBack, embed = false }) {
  const { t } = useLang();
  const p = getFundPortfolio();
  const orders = myFundOrders().filter(o => o.status === 'pending_confirm');
  const holdingCount = p.rows.length;

  return (
    <div className="page asset-overview-page">
      {embed ? (
        <div className="market-sticky">
          <div className="market-header">
            <div className="market-header-title">
              <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#wealth')}>
                <ArrowLeft size={20} />
              </button>
              <h1>{t('资产')}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="subpage-sticky">
          <div className="page-header">
            <h1>{t('资产')}</h1>
          </div>
        </div>
      )}

      <div className="asset-hero-card">
        <div className="asset-hero-head">
          <span className="asset-hero-label">{t('总资产（折合 HKD）')}</span>
        </div>
        <div className="asset-hero-main">
          <div className="asset-hero-value">{formatExact(Math.round(p.totalHKD))}</div>
        </div>
        <div className="asset-hero-change">
          <span className={p.pnlHKD >= 0 ? 'up' : 'down'}>
            {t('持仓累计收益')} {p.pnlHKD >= 0 ? '+' : '-'}HK$ {formatExact(Math.abs(Math.round(p.pnlHKD)))}
            （{p.pnlHKD >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%）
          </span>
        </div>
        <div className="asset-hero-stats">
          <div>
            <span>{t('可用现金')}</span>
            <strong>{formatCurrency(p.availableHKD)}</strong>
          </div>
          <div>
            <span>{t('持仓市值')}</span>
            <strong>{formatCurrency(p.marketValueHKD)}</strong>
          </div>
          <div>
            <span>{t('冻结中')}</span>
            <strong>{formatCurrency(p.frozenHKD)}</strong>
          </div>
        </div>
      </div>

      <div className="asset-actions">
        <button className="asset-action" onClick={() => navigate('#fund-operation/deposit')}>
          <span className="asset-action-icon"><Upload size={18} /></span>
          <span>{t('入金')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#fund-operation/withdraw')}>
          <span className="asset-action-icon"><Download size={18} /></span>
          <span>{t('出金')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#fund-orders')}>
          <span className="asset-action-icon"><ClipboardList size={18} /></span>
          <span>{t('我的申购')}{orders.length > 0 ? `·${orders.length}` : ''}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title no-margin">{t('基金持仓')}</h3>
          <button className="text-btn link-btn" onClick={() => navigate('#funds')}>
            {t('去基金')} <ChevronRight size={14} />
          </button>
        </div>
        {holdingCount === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无持仓')}</p>
            <p className="text-muted text-sm">{t('完成一笔申购并经财务确认后，份额会显示在这里')}</p>
          </div>
        )}
        {holdingCount > 0 && (
          <div className="holding-preview-list">
            {p.rows.map(h => (
              <div key={h.id} className="holding-preview-row" {...clickable(() => navigate(`#fund/${h.fundId}`))}>
                <div className="holding-preview-name">
                  <span className="holding-preview-dot">{h.fundName[0]}</span>
                  <span>{t(h.fundName)}</span>
                  <span className="text-muted text-xs asset-holding-shares">
                    {formatExact(h.shares)} {t('份')} · {h.currency}
                  </span>
                </div>
                <div className="holding-preview-right">
                  <strong>{h.currency} {formatExact(Math.round(h.marketValue))}</strong>
                  <span className={h.pnl >= 0 ? 'up' : 'down'}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="position-summary">
          <div>
            <span>{t('持仓市值')}</span>
            <strong>{formatCurrency(p.marketValueHKD)}</strong>
          </div>
          <div>
            <span>{t('累计收益')}</span>
            <strong className={p.pnlHKD >= 0 ? 'up' : 'down'}>
              {p.pnlHKD >= 0 ? '+' : '-'}HK$ {formatExact(Math.abs(Math.round(p.pnlHKD)))}
            </strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title no-margin">{t('现金')}</h3>
          <button className="text-btn link-btn" onClick={() => navigate('#wallet')}>
            {t('币种明细')} <ChevronRight size={14} />
          </button>
        </div>
        {p.cash.map(c => (
          <div key={c.currency} className="asset-cash-row">
            <span className="asset-cash-label">{c.currency}</span>
            <span className="asset-cash-value">{c.symbol} {formatExact(c.available)}</span>
            {c.frozen > 0 && (
              <span className="text-muted text-xs">{t('冻结')} {c.symbol} {formatExact(c.frozen)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <button className="list-item" onClick={() => navigate('#fund-statements')}>
          <div className="list-item-icon"><FileText size={18} /></div>
          <div className="list-item-content">
            <div className="list-item-title">{t('基金结单')}</div>
            <div className="list-item-subtitle">{t('逐笔结单 · 账户月结单')}</div>
          </div>
          <ChevronRight size={18} />
        </button>
        <button className="list-item" onClick={() => navigate('#fund-orders')}>
          <div className="list-item-icon"><PieChart size={18} /></div>
          <div className="list-item-content">
            <div className="list-item-title">{t('我的申购')}</div>
            <div className="list-item-subtitle">{t('申请进度 · 份额确认')}</div>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
