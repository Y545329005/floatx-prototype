import { useState } from 'react';
import { ArrowLeft, Bitcoin, ClipboardList, ChevronRight, CreditCard, Download, Eye, EyeOff, History, Upload } from 'lucide-react';
import { keyed } from '../lib';
import {
  getFundPortfolio, myFundOrders, formatExactAmount, formatShares, CURRENCY_META, cryptoModuleEnabled,
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
//
// 标注反馈（2026-11-02 第三轮，减密度）：
//   ⑧ hero 收益行只留「累计收益」一个字段，「含已实现」细分挪去基金结单；
//   ⑨ 分解行删「占总资产」标题与百分比——标签自解释，占比无决策价值；
//   ⑩ 持仓行 meta 一行只给一个状态线索，总份额/在途明细归基金详情。
//
// 富途对照（2026-11-02 第四轮）：
//   ⑪ hero 右上加 12 个月迷你走势，点击进 #asset-trend——该页此前全站无入口；
//   ⑫ 总资产标签旁加隐藏金额开关（演示 / 投屏场景遮全卡金额）。
//
// 用户定版（2026-11-02 第六轮）：
//   ⑬ 持仓卡 = 表头在顶（名称/份额 · 金额/收益），行内只放数值，
//      标签不再逐行重复；状态线索（可赎回/锁定期/在途）在基金详情；
//   ⑭ 收益率替代「较上周/昨日」：私募净值周频或月频、更新时间不稳定，
//      百分比（累计收益/成本）任意时点都成立；
//   ⑮ hero 累计收益合并一行 + 括号收益率；移除迷你走势（盈亏分析前期不做，不提供跳转）。

const money = (currency, value) => {
  const symbol = CURRENCY_META[String(currency || '').toUpperCase()]?.symbol || '';
  return `${symbol} ${formatExactAmount(value)}`;
};

export default function AssetOverview({ navigate, goBack, embed = false }) {
  const { t, lang } = useLang();
  const [hidden, setHidden] = useState(false);
  const p = getFundPortfolio();
  const pendingCount = myFundOrders().filter(o => o.status === 'pending_confirm').length;
  const holdingCount = p.rows.length;
  // 现金构成（2026-11-03 多币种）：只列「可用 > 0」的币种，且至少两种才显示。
  // 不显示的话，美元余额会变成总资产里一块「看不到的折合金额」（10-28 踩过）。
  const cashSplit = p.cash.filter(c => c.available > 0);
  const mask = '••••';
  // 累计收益率 = 累计收益（含已实现）/ 成本；与显示金额同一口径，
  // 不能沿用 p.pnlPct（那只是未实现/成本，会出现金额与括号百分比对不上）。
  const heroPct = p.costHKD > 0 ? (p.pnlHKD / p.costHKD) * 100 : 0;

  // 分解行 = 总资产的恒等式（可用现金 + 持仓市值 + 冻结 = 总资产）。
  // 冻结为 0 时不占一行：一行没有金额，读起来像漏了一项。
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
        <span className="asset-hero-label">
          {t('总资产（折合 HKD）')}
          {/* 隐藏金额开关（2026-11-02，对照富途）：演示 / 投屏场景一键遮住整卡金额，
              遮一半不如遮全套——大数字、累计收益、分解行一起遮。 */}
          <button
            type="button"
            className="asset-hero-eye"
            aria-label={hidden ? t('显示金额') : t('隐藏金额')}
            aria-pressed={hidden}
            onClick={() => setHidden(v => !v)}
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </span>
        <div className="asset-hero-value">{hidden ? `${mask}${mask}` : formatExactAmount(p.totalHKD)}</div>
        {/* 累计收益合并一行 + 括号收益率（2026-11-02 用户定版）：这一项只有一个事实，
            拆两行是机械执行「统一上下」；收益率给金额一个量级参照。 */}
        <div className="asset-hero-change">
          <span className="asset-hero-change-k">{t('累计收益')}</span>
          {hidden ? (
            <strong className="is-masked">{mask}</strong>
          ) : (
            <span className={`asset-hero-change-v ${p.pnlHKD >= 0 ? 'up' : 'down'}`}>
              <b>
                {p.pnlHKD >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(p.pnlHKD))}
              </b>
              <em className="asset-hero-change-pct">
                {lang === 'en' ? '(' : '（'}{heroPct >= 0 ? '+' : ''}{heroPct.toFixed(2)}%{lang === 'en' ? ')' : '）'}
              </em>
            </span>
          )}
        </div>
        {/* 分解行 = 总资产的恒等式（可用现金 + 持仓市值 + 冻结），同样标签在上、数值在下 */}
        <div className="asset-hero-parts">
          {parts.map(part => (
            <div key={part.key} className="asset-hero-part">
              <span className="asset-hero-part-k">{t(part.key)}</span>
              <strong className="asset-hero-part-v">{hidden ? mask : formatExactAmount(part.value)}</strong>
            </div>
          ))}
        </div>
        {cashSplit.length > 1 && (
          <p className="asset-cash-split">
            <span className="asset-cash-split-k">{t('现金构成')}</span>
            {cashSplit.map(c => (
              <span key={c.currency}>{c.symbol} {hidden ? mask : formatExactAmount(c.available)}</span>
            ))}
          </p>
        )}
      </div>

      {/* 操作：入金 / 出金 / 资金明细 / 银行卡 / 我的交易 / 基金结单（2026-10-29 3×2）
          资金域的归属地就是这里：#wallet 全仓无链接（死页）。
          资金申请页已并入「资金明细」（同一笔钱只出一次），空出的格子给银行卡管理。 */}
      <div className="asset-actions">
        <button className="asset-action" onClick={() => navigate('#fund-operation/deposit')}>
          <span className="asset-action-icon"><Download size={18} /></span>
          <span>{t('入金')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#fund-operation/withdraw')}>
          <span className="asset-action-icon"><Upload size={18} /></span>
          <span>{t('出金')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#transactions')}>
          <span className="asset-action-icon"><History size={18} /></span>
          <span>{t('资金明细')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#bank-cards')}>
          <span className="asset-action-icon"><CreditCard size={18} /></span>
          <span>{t('银行卡')}</span>
        </button>
        <button className="asset-action" onClick={() => navigate('#fund-orders')}>
          <span className="asset-action-icon">
            <ClipboardList size={18} />
            {pendingCount > 0 && <i className="asset-action-dot" aria-hidden="true">{pendingCount}</i>}
          </span>
          <span>{t('我的交易')}</span>
        </button>
        {/* 数字资产替代原「基金结单」格位（2026-11-05 标注）：结单入口移到基金页右上角，
            资产页这一格给集团钱包入口；未开放时该格不渲染。 */}
        {cryptoModuleEnabled && (
          <button className="asset-action" onClick={() => navigate('#crypto')}>
            <span className="asset-action-icon"><Bitcoin size={18} /></span>
            <span>{t('数字资产')}</span>
          </button>
        )}
      </div>

      <div className="card">
        {/* 不再给「去基金」：底部 tab 就是基金入口，页面内的第二个跳转是重复 */}        <div className="card-header">
          <h3 className="card-title no-margin">{t('基金持仓')}</h3>
        </div>
        {holdingCount === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无持仓')}</p>
            <p className="text-muted text-sm">{t('完成一笔申购并经财务确认后，份额会显示在这里')}</p>
          </div>
        )}
        {holdingCount > 0 && (
          <>
            {/* 表头提到卡片顶部（2026-11-02 用户定版）：标签只出现一次，行内只放数值，
                每只基金不再重复「持仓金额 / 累计收益」；左列名称+份额，右列金额+收益（收益率）。 */}
            <div className="asset-hold-colhead">
              <span>{t('名称 / 份额')}</span>
              <span>{t('金额 / 收益')}</span>
            </div>
            <div className="asset-hold-list">
              {p.rows.map(h => {
                // 行内收益与金额、百分比同币种（2026-11-03）：此前折 HKD 后不带符号，
                // 美元持仓会出现「$1,000 金额 + 假设是港币的收益」——同一行两种币种。
                const totalPnl = h.pnl;
                // 括号里的百分比与金额同口径：累计收益（含已实现）/ 成本
                const pct = h.costAmount > 0 ? (h.pnl / h.costAmount) * 100 : 0;
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
                    <span className="asset-hold-left">
                      <span className="asset-hold-name">{t(h.fundName)}</span>
                      <span className="asset-hold-shares">{formatShares(h.shares)} {t('份')}</span>
                    </span>
                    <span className="asset-hold-right">
                      <strong className="asset-hold-amount">{money(h.currency, h.marketValue)}</strong>
                      <span className={`asset-hold-pnl ${totalPnl >= 0 ? 'up' : 'down'}`}>
                        <b>
                          {totalPnl >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(totalPnl))}
                        </b>
                        <em className="asset-hold-pct">
                          {lang === 'en' ? '(' : '（'}{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%{lang === 'en' ? ')' : '）'}
                        </em>
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
