import { ArrowLeft, ClipboardList, ChevronRight, Download, FileText, Upload } from 'lucide-react';
import { keyed } from '../lib';
import {
  getFundPortfolio, myFundOrders, formatExactAmount, formatShares, CURRENCY_META,
} from '../mock/data';
import { useLang } from '../i18n';

// 资产总览（2026-10-28 结构重做 + 标注反馈）
// 定位：只读聚合层——只回答「我有多少钱 / 钱在哪 / 赚了多少 / 要做什么」，自己不发起交易。
//
// 本轮修的结构病：
//   ① 持仓市值与累计收益曾在 hero、持仓行、卡尾三处各出现一次 → 卡尾整块删除，收益的「含已实现」并入 hero；
//   ② 同一页并存 20,590,317 / 1948万 / HK$ 12,500,000 三套数字格式 → 全页统一「两位小数」；
//   ③ 份额 2 位档与赎回页 4 位口径对不上 → 统一 formatShares；
//   ④ 「我的交易」两个入口 → 只留动作瓦片，并挂待确认计数。
//
// 标注反馈（同日第二轮）：
//   ⑤ 币种在 hero 标签里声明过一次就够，金额不再重复带 HK$；
//   ⑥ 赎回不在资产页直接发起——整行进基金详情，操作在详情的固定底栏里；
//   ⑦ 首期不做多币种：现金卡删除，演示钱包的 USD/CNH 余额一并清零。

const money = (currency, value) => {
  const symbol = CURRENCY_META[String(currency || '').toUpperCase()]?.symbol || '';
  return `${symbol} ${formatExactAmount(value)}`;
};

export default function AssetOverview({ navigate, goBack, embed = false }) {
  const { t } = useLang();
  const p = getFundPortfolio();
  const pendingCount = myFundOrders().filter(o => o.status === 'pending_confirm').length;
  const holdingCount = p.rows.length;

  const total = p.totalHKD > 0 ? p.totalHKD : 0;
  const share = v => (total > 0 ? (v / total) * 100 : 0);

  // 三行 = 总资产的恒等式分解（可用现金 + 持仓市值 + 冻结 = 总资产），百分比是「各占总额多少」。
  // 冻结为 0 时不占一行：一行既没有金额也没有百分比，读起来像漏了一项。
  const parts = [
    { key: '可用现金', value: p.availableHKD },
    { key: '持仓市值', value: p.marketValueHKD },
    { key: '冻结中', value: p.frozenHKD },
  ].filter(part => part.key !== '冻结中' || part.value > 0);

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
        <span className="asset-hero-label">{t('总资产（折合 HKD）')}</span>
        <div className="asset-hero-value">{formatExactAmount(p.totalHKD)}</div>
        {/* 只放金额：收益率是「持仓」层面的指标，放这里会和含已实现的累计收益互相矛盾 */}
        <div className="asset-hero-change">
          <span className={p.pnlHKD >= 0 ? 'up' : 'down'}>
            {t('累计收益')} {p.pnlHKD >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(p.pnlHKD))}
          </span>
          {p.realizedHKD !== 0 && (
            <span className="asset-hero-realized">
              {t('含已实现')} {p.realizedHKD >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(p.realizedHKD))}
            </span>
          )}
        </div>
        {/* 占比跟在标签后面，而不是占着最右一列：它一占位，金额就被挤离卡片右边缘，
            hero 大数字、明细金额、百分比就成了三条参差的右边缘（标注反馈 2026-10-28）。
            现在所有金额共用卡片右边缘这一条轴。 */}
        <div className="asset-hero-parts">
          <p className="asset-hero-parts-note">{t('占总资产')}</p>
          {parts.map(part => (
            <div key={part.key} className="asset-hero-part">
              <span className="asset-hero-part-k">{t(part.key)}</span>
              {part.value > 0 && <em className="asset-hero-part-pct">{share(part.value).toFixed(1)}%</em>}
              <strong className="asset-hero-part-v">{formatExactAmount(part.value)}</strong>
            </div>
          ))}
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
          <span className="asset-action-icon">
            <ClipboardList size={18} />
            {pendingCount > 0 && <i className="asset-action-dot" aria-hidden="true">{pendingCount}</i>}
          </span>
          <span>{t('我的交易')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#fund-statements')}>
          <span className="asset-action-icon"><FileText size={18} /></span>
          <span>{t('基金结单')}</span>
        </button>
      </div>

      <div className="card">
        {/* 不再给「去基金」：底部 tab 就是基金入口，页面内的第二个跳转是重复 */}
        <div className="card-header">
          <h3 className="card-title no-margin">{t('基金持仓')}</h3>
        </div>
        {holdingCount === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无持仓')}</p>
            <p className="text-muted text-sm">{t('完成一笔申购并经财务确认后，份额会显示在这里')}</p>
          </div>
        )}
        {holdingCount > 0 && (
          <div className="asset-hold-list">
            {p.rows.map(h => {
              const info = h.redeemInfo || {};
              const bits = [`${formatShares(h.shares)} ${t('份')}`];
              if (info.redeemable >= h.shares) bits.push(t('全部可赎回'));
              else if (info.redeemable > 0) bits.push(`${t('可赎回')} ${formatShares(info.redeemable)} ${t('份')}`);
              else if (info.earliestUnlock) bits.push(`${t('锁定期至')} ${info.earliestUnlock}`);
              else bits.push(t('暂无可赎回份额'));
              if (h.frozenShares > 0) bits.push(`${t('赎回处理中')} ${formatShares(h.frozenShares)} ${t('份')}`);

              return (
                /* 整行进基金详情：资产页不再放「赎回」按钮（标注反馈 2026-10-28），
                   处置操作只在详情的固定底栏里，一处口径。 */
                <div
                  key={h.id}
                  className="asset-hold-row"
                  {...keyed(() => navigate(`#fund/${h.fundId}`))}
                  onClick={() => navigate(`#fund/${h.fundId}`)}
                  aria-label={`${t(h.fundName)} · ${t('查看详情')}`}
                >
                  <div className="asset-hold-head">
                    <div className="asset-hold-title">
                      <span>{t(h.fundName)}</span>
                    </div>
                    <div className="asset-hold-value">
                      <strong>{money(h.currency, h.marketValue)}</strong>
                      <span className="asset-hold-pct">
                        {t('收益率')}
                        <b className={h.pnl >= 0 ? 'up' : 'down'}>
                          {h.pnl >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                        </b>
                      </span>
                    </div>
                  </div>
                  <p className="asset-hold-meta">
                    <span>{bits.join(' · ')}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
