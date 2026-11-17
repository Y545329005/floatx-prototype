import { ArrowLeft, ChevronRight } from 'lucide-react';
import {
  getMandateSummaryForUser,
  getMandateCashLedger,
  getMandateWithdrawFrozen,
  mandateTrades,
  mandateFees,
  MANDATE_LEDGER_TYPES,
  MANDATE_TRADE_STATUS,
  MANDATE_FEE_TYPES,
  convertToHKD,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   资金记录（2026-11-16）：B 户现金的过程。
   为什么必须有这一页：详情页的「现金」是流水算出来的结果，客户看不到过程就无法核对
   ——入金 30 万、管理费 1,200、三笔买入、提取划出 10 万，此前客户侧一条都看不到，
   wallet「资金流水」只有提取的去向那一腿（委托账户划入）。结果与过程必须相邻可及。

   口径：余额由流水派生（与 hero 同一个函数），因此「最新一行的余额」恒等于 hero 的现金；
   同一笔资金动作只记一条（买入记 −成交额含费），不拆成成交 + 费两行。
   文案纪律（2026-11-17）：不直接展示后台 note——那是运营备注，含内部单号
   （MW2026…）、流程状态（已审核通过并完成划转）、记账方式（手录/凭证核销），
   对客户都是噪声。说明文字按类型 + 关联单据现拼：入金 / 买入 标的·股数@价 /
   费用 期间·费种 / 提取 至现金账户。
   ───────────────────────────────────────────────────────────── */

export default function MandateCash({ goBack, navigate }) {
  const { t } = useLang();
  const summary = getMandateSummaryForUser();

  if (summary.state !== 'active') {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('资金记录')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
        </div>
      </div>
    );
  }

  const { account, portfolio } = summary;
  const rows = getMandateCashLedger(account.id);
  // 折合口径与可用口径分开（2026-11-17）：顶部大数是折合 HKD（与 hero 同源），
  // 一旦出现第二种币种，补一行分币种余额——否则顶部折合数跟任何一行余额都对不上。
  const cashByCur = (portfolio.cash || []).filter(c => Math.abs(Number(c.balance) || 0) > 0.0001);
  const pendingHKD = portfolio.cash.reduce(
    (s, c) => s + convertToHKD(getMandateWithdrawFrozen(account.id, c.currency), c.currency),
    0,
  );

  const labelOf = (e) => {
    if (e.type === MANDATE_LEDGER_TYPES.TRADE) return t(e.amount < 0 ? '买入' : '卖出');
    const map = {
      [MANDATE_LEDGER_TYPES.DEPOSIT]: '入金',
      [MANDATE_LEDGER_TYPES.TRANSFER_IN]: '现金账户划入',
      [MANDATE_LEDGER_TYPES.TRANSFER_OUT]: '提取',
      [MANDATE_LEDGER_TYPES.WITHDRAW]: '出金',
      [MANDATE_LEDGER_TYPES.FEE]: '费用',
      [MANDATE_LEDGER_TYPES.DIVIDEND]: '股息',
    };
    return t(map[e.type] || e.type);
  };

  // 说明只回答「这笔是什么」：从关联单据现拼，不读后台备注
  const descOf = (e) => {
    if (e.type === MANDATE_LEDGER_TYPES.TRADE) {
      const tr = mandateTrades.find(x => x.id === e.refId);
      return tr ? `${tr.symbol} · ${formatShares(tr.quantity)} ${t('股')} @ ${tr.price} ${tr.currency}` : '';
    }
    if (e.type === MANDATE_LEDGER_TYPES.FEE) {
      const fee = mandateFees.find(f => f.id === e.refId);
      return fee ? `${fee.period} ${t(MANDATE_FEE_TYPES[fee.type] || fee.type)}` : '';
    }
    if (e.type === MANDATE_LEDGER_TYPES.DEPOSIT) return t('银行转账');
    if (e.type === MANDATE_LEDGER_TYPES.TRANSFER_OUT) return t('至现金账户');
    if (e.type === MANDATE_LEDGER_TYPES.TRANSFER_IN) return t('自现金账户');
    return '';
  };

  // 日期独立成列：同年只写 MM-DD（跨年才写全），列宽才不会随年份忽宽忽窄
  const years = new Set(rows.map(r => String(r.at).slice(0, 4)));
  const dateOf = (at) => (years.size > 1 ? String(at).slice(0, 10) : String(at).slice(5, 10));

  // 只有「有凭证可看」的行才可点：买入 → 成交通知单（仅已生效交易才有单）
  const adviceOf = (e) => {
    if (e.refType !== 'trade' || !e.refId) return '';
    const tr = mandateTrades.find(x => x.id === e.refId);
    return tr && tr.status === MANDATE_TRADE_STATUS.ACTIVE ? `#mandate-advice/${tr.id}` : '';
  };

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${account.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('资金记录')}</h1>
        </div>
      </div>

      {/* 余额不再单独占一张卡（2026-11-17）：它与列表首行的「余额」是同一个数，
          占一张卡既重复又把列表往下压。收成页头下的一行，滚动时吸顶头仍在。 */}
      <p className="mandate-doc-meta">
        {t('余额（折合 HKD）')} {formatExactAmount(portfolio.cashHKD)}
        {cashByCur.length > 1 ? ` · ${cashByCur.map(c => `${c.currency} ${formatExactAmount(c.balance)}`).join(' · ')}` : ''}
        {pendingHKD > 0 ? ` · ${t('提取处理中')} ${formatExactAmount(pendingHKD)}` : ''}
      </p>

      {/* 卡内不再重复页标题「资金记录」（2026-11-17）：顶部余额卡撤掉后，两个同名标题只隔 12px */}
      <div className="card">
        {rows.length === 0 && <p className="text-muted text-sm">{t('暂无资金记录')}</p>}
        {rows.map(e => {
          const href = adviceOf(e);
          const desc = descOf(e);
          const body = (
            <>
              <span className="mandate-list-date">{dateOf(e.at)}</span>
              <span className="mandate-trade-main">
                <span className="mandate-cash-head">
                  <strong>{labelOf(e)}</strong>
                  {/* 「凭证」标记贴类型放（2026-11-17）：放行尾会挤掉摘要的宽度；
                      只有附单据的行才有，等于告诉客户"这行有单据可看"。 */}
                  {href ? <span className="mandate-cash-doc">{t('凭证')}<ChevronRight size={11} aria-hidden="true" /></span> : null}
                </span>
                {desc ? <span className="mandate-cash-meta">{desc}</span> : null}
              </span>
              <span className="mandate-cash-amt">
                <strong className={e.amount >= 0 ? 'up' : ''}>
                  {e.amount >= 0 ? '+' : '-'}{formatExactAmount(Math.abs(e.amount))}
                  {String(e.currency || 'HKD').toUpperCase() === 'HKD' ? '' : ` ${e.currency}`}
                </strong>
                <span>{t('余额')} {formatExactAmount(e.balance)}{String(e.currency || 'HKD').toUpperCase() === 'HKD' ? '' : ` ${e.currency}`}</span>
              </span>
            </>
          );
          return href ? (
            <button key={e.id} type="button" className="mandate-trade-row" onClick={() => navigate(href)} aria-label={`${labelOf(e)} · ${t('查看详情')}`}>
              {body}
            </button>
          ) : (
            <div key={e.id} className="mandate-trade-row is-static">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
