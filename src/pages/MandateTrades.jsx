import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  getMandateSummaryForUser,
  mandateTrades,
  MANDATE_TRADE_STATUS,
} from '../mock/data';
import { useLang } from '../i18n';
import MandateTradeRow from '../components/MandateTradeRow';

// 交易流水（2026-11-13 批 2）
// 客户看到的每一行都必须能回答「这笔钱去了哪」：待复核不进持仓、不进日结单，所以在这里标注「待成交」，
// 避免客户以为成交了却看不到持仓。
// 行式与详情页「近期交易」共用 MandateTradeRow（2026-11-17）：金额成列、状态用词统一，
// 同一笔交易在两页不会出现两种叫法（此前这里是「处理中」）。
// 成交通知单入口只挂在「已成交」行：未生效的交易没有通知单可看（协议 11.2 的通知对象是成交）。

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: MANDATE_TRADE_STATUS.ACTIVE, label: '已成交' },
  { key: MANDATE_TRADE_STATUS.PENDING, label: '待成交' },
];

export default function MandateTrades({ navigate, goBack }) {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const summary = getMandateSummaryForUser();
  const accountId = summary.account?.id || '';

  const rows = useMemo(() => mandateTrades
    .filter(x => x.accountId === accountId)
    .filter(x => filter === 'all' || x.status === filter)
    .slice()
    .sort((a, b) => String(b.tradeDate).localeCompare(String(a.tradeDate))), [accountId, filter]);

  if (summary.state !== 'active') {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('交易流水')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${accountId}`)}><ArrowLeft size={20} /></button>
          <h1>{t('交易流水')}</h1>
        </div>
        <div className="segmented-control">
          {FILTERS.map(f => (
            <button key={f.key} type="button" className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="card mandate-trades-card">
        {rows.length > 0 && (
          <div className="asset-hold-colhead">
            <span>{t('交易')}</span>
            <span>{t('成交金额 / 状态（HKD）')}</span>
          </div>
        )}
        {rows.length === 0 && <p className="text-muted text-sm">{t('暂无交易记录')}</p>}
        {rows.map(tr => (
          <MandateTradeRow key={tr.id} trade={tr} onOpen={x => navigate(`#mandate-advice/${x.id}`)} />
        ))}
      </div>

      <p className="mandate-disclaimer">{t('交易由持牌基金经理执行，本平台按成交结果记录。点开已成交记录可查看成交通知单。')}</p>
    </div>
  );
}
