import { ChevronRight } from 'lucide-react';
import { MANDATE_TRADE_STATUS, formatExactAmount, formatShares } from '../mock/data';
import { useLang } from '../i18n';

/* 委托交易行（2026-11-17）：与持仓同构的两行行式——
   左 = 标的/方向 + 日期·股数@单价，右 = 成交金额（折合 HKD）/ 状态。
   详情页「近期交易」与「交易流水」共用此组件：同一笔交易在两页的字号、列宽、状态色必须一致。
   金额是成交额（不含费），与成交通知单的「成交金额」同口径；含费的实际扣款在资金记录里。
   状态用词统一「待成交」（此前交易流水页叫「处理中」，与详情页两套说法）。 */

export const TRADE_STATUS_LABEL = {
  [MANDATE_TRADE_STATUS.PENDING]: '待成交',
  [MANDATE_TRADE_STATUS.ACTIVE]: '已成交',
  [MANDATE_TRADE_STATUS.REJECTED]: '未成交',
  [MANDATE_TRADE_STATUS.VOID]: '已作废',
};

export default function MandateTradeRow({ trade, onOpen }) {
  const { t } = useLang();
  const active = trade.status === MANDATE_TRADE_STATUS.ACTIVE;
  const amount = Number(trade.quantity || 0) * Number(trade.price || 0) * Number(trade.fxRate || 0);

  return (
    <button
      type="button"
      className="mandate-trade-row"
      onClick={() => active && onOpen && onOpen(trade)}
      disabled={!active}
    >
      <span className="mandate-trade-main">
        <strong>
          {trade.symbol} {trade.side === 'buy' ? t('买入') : t('卖出')}
          {trade.correctionOf ? <em className="mandate-correct-tag">{t('更正')}</em> : null}
        </strong>
        <span>{trade.tradeDate} · {formatShares(trade.quantity)} {t('股')} @ {trade.price} {trade.currency}</span>
      </span>
      <span className="mandate-trade-right">
        <strong>{formatExactAmount(amount)}</strong>
        <span className={`mandate-trade-status is-${trade.status}`}>
          {t(TRADE_STATUS_LABEL[trade.status] || trade.status)}
        </span>
      </span>
      {/* 箭头位常驻：没有箭头的行也占 16px，右侧数字列才不会在行间左右跳 */}
      <span className="mandate-trade-chev">{active && <ChevronRight size={16} aria-hidden="true" />}</span>
    </button>
  );
}
