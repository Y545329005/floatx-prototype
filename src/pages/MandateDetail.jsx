import { useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, ChevronDown, ChevronRight, FileText, Lock, ShieldCheck,
} from 'lucide-react';
import {
  getMandateSummaryForUser,
  getStandingAuthOf,
  getMandateWithdrawFrozen,
  hasMandateTransferAuth,
  mandateTrades,
  MANDATE_TRADE_STATUS,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useLang } from '../i18n';

// 委托详情（2026-11-13 批 2；2026-11-16 重排：对抗性审查定稿）
// 只读：持仓与余额由后台复核后的交易/流水派生，APP 不发起任何委托操作（RO 补充会议「委托账户只读」）。
// 页面承担两个「说清楚」义务：资产在托管人处、平台只记录；全权委托的收益不保证。
// 结构 = 回答顺序：①收益与总量（hero）②资产（持仓/现金）③经理动态（交易）④合约（协议摘要+详情折叠）。
// 「资产 / 合约」两个眉标是分区锚点；交易卡自带「近期交易」语义，不设眉标。

const TRADE_STATUS_LABEL = {
  [MANDATE_TRADE_STATUS.PENDING]: '处理中',
  [MANDATE_TRADE_STATUS.ACTIVE]: '已成交',
  [MANDATE_TRADE_STATUS.REJECTED]: '未成交',
  [MANDATE_TRADE_STATUS.VOID]: '已作废',
};

// 持仓次行的估值口径短词（与估值价同源配对，一句话讲清「这个价怎么来的」，不做折叠交互）
const VALUATION_SHORT = {
  listed: '收盘价估值',
  'unlisted-cost': '成本估值',
  cis: '公布价估值',
  accrued: '费用按已收',
};

// 近期交易排序（2026-11-16 定稿语义）：处理中优先（最新动作在前），同级内按日期倒序
function compareTrades(a, b) {
  const pa = a.status === MANDATE_TRADE_STATUS.PENDING ? 0 : 1;
  const pb = b.status === MANDATE_TRADE_STATUS.PENDING ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return String(b.tradeDate).localeCompare(String(a.tradeDate));
}

export default function MandateDetail({ id, navigate, goBack }) {
  const { t, lang } = useLang();
  const summary = getMandateSummaryForUser();
  const [agreeDetailOpen, setAgreeDetailOpen] = useState(false);

  if (summary.state !== 'active' || !summary.account || (id && summary.account.id !== id)) {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('委托账户')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#asset')}>{t('返回资产')}</button>
        </div>
      </div>
    );
  }

  const { account, agreement, portfolio } = summary;
  const auths = getStandingAuthOf(account.id);
  const authsText = auths.length
    ? auths.map(a => t(a.scope.map(s => ({ transfer: '资金划转', repledge: '再质押', lending: '借出' }[s] || s)).join(' · '))).join('；')
    : t('无');
  const recentTrades = mandateTrades
    .filter(x => x.accountId === account.id)
    .slice()
    .sort(compareTrades)
    .slice(0, 5);
  const money = (v) => `HK$ ${formatExactAmount(v)}`;
  const fees = agreement?.fees || {};
  const limits = agreement?.strategy?.limits || {};
  const hasCash = portfolio.cash.some(c => c.balance > 0);
  const canWithdraw = hasMandateTransferAuth(account.id) && hasCash;
  const pnlPositive = portfolio.pnlHKD >= 0;

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('委托账户')}</h1>
          <div className="page-header-actions">
            <button className="btn-icon" aria-label={t('单据')} onClick={() => navigate('#fund-statements')}><FileText size={19} /></button>
          </div>
        </div>
      </div>

      {/* hero：收益徽章（保留正负色）→ 总资产 → 拆分 → 经理/托管人 */}
      <div className="mandate-hero">
        <span className={`mandate-hero-badge ${pnlPositive ? 'up' : 'down'}`}>
          {t('累计收益（费前）')} {pnlPositive ? '+' : '-'}{formatExactAmount(Math.abs(portfolio.pnlHKD))}
          <em>{lang === 'en' ? '(' : '（'}{portfolio.pnlPct >= 0 ? '+' : ''}{portfolio.pnlPct.toFixed(2)}%{lang === 'en' ? ')' : '）'}</em>
        </span>
        <span className="mandate-hero-k">{t('委托资产（折合 HKD）')}</span>
        <strong className="mandate-hero-v">{money(portfolio.totalHKD)}</strong>
        <div className="mandate-hero-sub">
          <span>{t('现金')} {money(portfolio.cashHKD)}</span>
          <span>{t('持仓市值')} {money(portfolio.marketValueHKD)}</span>
        </div>
        <div className="mandate-hero-mgr">
          <span>{t('负责基金经理')} {account.managerName || '—'}</span>
          <span>{t('托管人')} {account.custodian || '—'}</span>
        </div>
      </div>

      <div className="mandate-section-label">{t('资产')}</div>

      <div className="card">
        <div className="card-title">{t('持仓')}</div>
        {portfolio.positions.length === 0 && <p className="text-muted text-sm">{t('暂无委托持仓')}</p>}
        {portfolio.positions.map(pos => (
          <div key={pos.symbol} className="mandate-pos-row">
            <div className="mandate-pos-main">
              <strong>{pos.name || pos.symbol}</strong>
              <span>
                {pos.symbol} · {formatShares(pos.quantity)} {t('股')}
                {' · '}{pos.valued ? `${t(VALUATION_SHORT[pos.valuationMethod] || pos.valuationMethod)} ${pos.price} ${pos.currency}` : t('待估值')}
                {pos.priceAt ? ` · ${pos.priceAt}` : ''}
              </span>
            </div>
            <div className="mandate-pos-right">
              <strong>{money(pos.marketValueHKD)}</strong>
              <span className={pos.unrealizedHKD >= 0 ? 'up' : 'down'}>
                {pos.unrealizedHKD >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(pos.unrealizedHKD))}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">{t('现金余额')}</div>
        {portfolio.cash.length === 0 && <p className="text-muted text-sm">{t('暂无现金余额')}</p>}
        {portfolio.cash.map(c => (
          <div key={c.currency} className="mandate-row">
            <span>
              {c.currency}
              {/* 提取处理中辅行（2026-11-16）：主值 = 流水派生余额（事实），在途只标注不剔除——
                  剔除会让总资产在提交瞬间掉一块，破坏恒等式①（申请页主值才是「可用」口径）。 */}
              {getMandateWithdrawFrozen(account.id, c.currency) > 0 && (
                <span className="mandate-row-sub">
                  {t('提取处理中')} {c.currency} {formatExactAmount(getMandateWithdrawFrozen(account.id, c.currency))}
                </span>
              )}
            </span>
            <strong>{formatExactAmount(c.balance)}</strong>
          </div>
        ))}
        {/* 提取入口（协议 10）：仅「有 transfer 常设授权且有余额」可点；
            无授权时整行禁用并提示补签（14.2 四层拦截之②），零余额不渲染入口。 */}
        {hasCash && (canWithdraw ? (
          <button type="button" className="mandate-withdraw-action" onClick={() => navigate('#mandate-withdraw')}>
            <span><ArrowUpRight size={16} /> {t('提取至现金账户')}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <div className="mandate-withdraw-action is-gated" title={t('缺少资金划转常设授权（协议 14.2）')}>
            <span><Lock size={15} /> {t('提取至现金账户')}</span>
            <span className="mandate-withdraw-gate-tip">{t('缺少资金划转常设授权（协议 14.2）')}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">{t('近期交易')}</div>
        {recentTrades.length === 0 && <p className="text-muted text-sm">{t('暂无交易记录')}</p>}
        {recentTrades.map(tr => {
          const active = tr.status === MANDATE_TRADE_STATUS.ACTIVE;
          return (
            <button
              key={tr.id}
              type="button"
              className="mandate-trade-row"
              onClick={() => active && navigate(`#mandate-advice/${tr.id}`)}
              disabled={!active}
            >
              <span className="mandate-trade-main">
                <strong>{tr.symbol} {tr.side === 'buy' ? t('买入') : t('卖出')}</strong>
                <span>{tr.tradeDate} · {formatShares(tr.quantity)} {t('股')} @ {tr.price} {tr.currency}</span>
              </span>
              <span className={`mandate-trade-status is-${tr.status}`}>{t(TRADE_STATUS_LABEL[tr.status] || tr.status)}</span>
              {active && <ChevronRight size={16} aria-hidden="true" />}
            </button>
          );
        })}
        <button type="button" className="mandate-more" onClick={() => navigate('#mandate-trades')}>{t('查看全部交易')}<ChevronRight size={14} /></button>
      </div>

      <div className="mandate-section-label">{t('合约')}</div>

      <div className="card">
        {/* 摘要：高频事实（编号 / 托管人 / 常设授权）；低频事实（签署/生效日期、费率、投资限制）折叠 */}
        <div className="mandate-agree-head">
          <ShieldCheck size={16} aria-hidden="true" />
          <div className="mandate-agree-main">
            <strong>{t('全权委托协议')} {agreement?.no || '—'}</strong>
            <span>{t('常设授权')}：{authsText}</span>
          </div>
        </div>

        {agreeDetailOpen && (
          <div className="mandate-agree-detail">
            <div className="mandate-row"><span>{t('签署日期')}</span><strong>{String(agreement?.signedAt || '').slice(0, 10) || '—'}</strong></div>
            <div className="mandate-row"><span>{t('生效日期')}</span><strong>{String(agreement?.effectiveAt || '').slice(0, 10) || '—'}</strong></div>
            <div className="mandate-row"><span>{t('管理费')}</span><strong>{fees.managementPct ?? '—'}%</strong></div>
            <div className="mandate-row"><span>{t('设立费')}</span><strong>{fees.inceptionPct ?? '—'}%</strong></div>
            <div className="mandate-row">
              <span>{t('表现费')}</span>
              <strong>{fees.performancePct ?? '—'}%{Number(fees.hurdlePct) > 0 ? `（${t('门槛')} ${fees.hurdlePct}%）` : ''}</strong>
            </div>
            <div className="mandate-row mandate-row--wrap">
              <span>{t('投资限制')}</span>
              <strong>
                {t('单一公司')} ≤{limits.singleCompanyPct ?? 0}% · {t('单一发行人')} ≤{limits.singleIssuerPct ?? 0}% · {Number(limits.borrowingPct) > 0 ? `${t('借贷')} ≤${limits.borrowingPct}%` : t('不使用借贷')}
              </strong>
            </div>
          </div>
        )}
        <button
          type="button"
          className="mandate-agree-toggle"
          onClick={() => setAgreeDetailOpen(v => !v)}
          aria-expanded={agreeDetailOpen}
        >
          {t('协议详情、费率与投资限制')}
          <ChevronDown size={16} className={agreeDetailOpen ? 'flip' : ''} aria-hidden="true" />
        </button>

        {/* 结单入口（原独立卡并入合约区尾行；头部「单据」icon 同目标保留） */}
        <button type="button" className="mandate-agree-toggle" onClick={() => navigate('#fund-statements')}>
          {t('日结单与月报')}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* 合规声明（两句独立 key，容器合并；「收益不作保证」「费前口径」均为合规义务，不得删减） */}
      <div className="mandate-legal">
        <p>{t('委托资产由托管人持有，本平台仅作记录与展示，不代客户保管资产。全权委托由持牌基金经理按协议约定的策略与限制执行，投资收益不作保证。')}</p>
        <p>{t('收益口径为费前；费用（管理费 / 设立费 / 表现费）在结单中单列并从组合扣减。')}</p>
      </div>
    </div>
  );
}
