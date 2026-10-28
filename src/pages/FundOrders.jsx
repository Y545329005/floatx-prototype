import { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { myFundOrders, cancelFundOrder, FUND_ORDER_STATUS, formatExact } from '../mock/data';
import { useLang } from '../i18n';

// 我的申购（2026-10-28 基金一期）：申购单据的进度查询 + 待确认撤销
// 只消费 fundOrders（交易单据），与资金申请（deposit/withdraw）分属两域，不混列表。
const statusMeta = {
  [FUND_ORDER_STATUS.PENDING]: { key: '待确认', cls: 'tag-warning' },
  [FUND_ORDER_STATUS.CONFIRMED]: { key: '已成交', cls: 'tag-success' },
  [FUND_ORDER_STATUS.REJECTED]: { key: '已驳回', cls: 'tag-danger' },
  [FUND_ORDER_STATUS.CANCELLED]: { key: '已撤销', cls: 'tag-neutral' },
};

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: FUND_ORDER_STATUS.PENDING, label: '待确认' },
  { key: FUND_ORDER_STATUS.CONFIRMED, label: '已成交' },
];

export default function FundOrders({ navigate, goBack, setToast }) {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const [, force] = useState(0); // mock 数组变更不触发 React，撤销后强制重渲染

  const all = myFundOrders();
  const list = filter === 'all' ? all : all.filter(o => o.status === filter);

  const handleCancel = (order) => {
    const res = cancelFundOrder(order.id);
    if (!res.ok) {
      setToast && setToast(res.error || t('操作失败'));
      return;
    }
    setToast && setToast(t('申请已撤销'));
    force(n => n + 1);
  };

  return (
    <div className="page fund-orders-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('我的申购')}</h1>
        </div>
        <div className="segmented-control">
          {FILTERS.map(f => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p className="text-muted">{t('暂无申购记录')}</p>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('#funds')}>{t('去看看基金')}</button>
          </div>
        </div>
      )}

      {list.map(o => {
        const meta = statusMeta[o.status] || statusMeta[FUND_ORDER_STATUS.PENDING];
        return (
          <div key={o.id} className="card fund-order-card">
            <div className="fund-order-head">
              <div>
                <div className="fund-order-name">{t(o.fundName)}</div>
                <div className="text-muted text-sm">
                  <Clock size={10} /> {o.createdAt}
                </div>
              </div>
              <span className={`tag ${meta.cls}`}>{t(meta.key)}</span>
            </div>

            <div className="fund-order-rows">
              <div className="fund-order-row">
                <span>{t('申购金额')}</span>
                <strong>{o.currency} {formatExact(o.amount)}</strong>
              </div>
              {o.status === FUND_ORDER_STATUS.CONFIRMED && (
                <>
                  <div className="fund-order-row">
                    <span>{t('确认净值')}</span>
                    <strong>{o.nav} <span className="text-muted text-xs">({o.navDate})</span></strong>
                  </div>
                  <div className="fund-order-row">
                    <span>{t('确认份额')}</span>
                    <strong>{formatExact(o.shares)} {t('份')}</strong>
                  </div>
                  <div className="fund-order-row">
                    <span>{t('认购费')}</span>
                    <strong>{o.currency} {formatExact(o.feeAmount || 0)}</strong>
                  </div>
                </>
              )}
              {o.status === FUND_ORDER_STATUS.REJECTED && o.rejectReason && (
                <div className="fund-order-row">
                  <span>{t('驳回原因')}</span>
                  <strong>{o.rejectReason}</strong>
                </div>
              )}
            </div>

            {o.status === FUND_ORDER_STATUS.PENDING && (
              <div className="fund-order-actions">
                <span className="text-muted text-sm">{t('资金已冻结，财务确认后成交')}</span>
                <button className="btn btn-outline btn-sm" onClick={() => handleCancel(o)}>{t('撤销申请')}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
