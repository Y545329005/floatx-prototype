import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, XCircle, Search } from 'lucide-react';
import {
  fundOrders,
  fundHoldings,
  funds,
  getInvestorUsers,
  confirmFundOrder,
  confirmRedemptionOrder,
  rejectFundOrder,
  latestNav,
  FUND_ORDER_STATUS,
  FUND_FEE_RATE,
  maskName,
  formatExactAmount,
  formatShares,
  formatListDateTime,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 基金交易（2026-10-28 基金一期闭环的后台确认台）
// 这是闭环里唯一把「申请」变成「持仓」的地方：确认即扣款 + 份额入账 + 出结单，
// 所以放在独立菜单而不是塞进「资金审核」——交易域（钱换份额）与资金域（银行 ↔ 平台）分属两件事。
const STATUS_META = {
  [FUND_ORDER_STATUS.PENDING]: { label: '待确认', cls: 'admin-status-pending' },
  [FUND_ORDER_STATUS.CONFIRMED]: { label: '已成交', cls: 'admin-status-approved' },
  [FUND_ORDER_STATUS.REJECTED]: { label: '已驳回', cls: 'admin-status-rejected' },
  [FUND_ORDER_STATUS.CANCELLED]: { label: '已撤销', cls: 'admin-status-rejected' },
};

const FILTERS = [
  { key: FUND_ORDER_STATUS.PENDING, label: '待确认' },
  { key: 'all', label: '全部' },
  { key: FUND_ORDER_STATUS.CONFIRMED, label: '已成交' },
  { key: FUND_ORDER_STATUS.REJECTED, label: '已驳回' },
];

export default function AdminFundTrades({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState(FUND_ORDER_STATUS.PENDING);
  // 类型分栏（2026-10-28 P2）：申购与赎回同属基金单据，但列语义不同
  // （申购看金额、赎回看份额×净值），混在一张表里同一列会有两种意思，所以分两栏、各自成表
  const [typeTab, setTypeTab] = useState('subscribe');
  const [keyword, setKeyword] = useState('');
  const [navInput, setNavInput] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const investors = useMemo(() => {
    const map = new Map();
    getInvestorUsers().forEach(u => map.set(u.userId, u));
    return map;
  }, [tick]);

  const list = useMemo(() => {
    const kw = keyword.trim();
    return fundOrders
      .filter(o => o.type === typeTab)
      .filter(o => (filter === 'all' ? true : o.status === filter))
      .filter(o => {
        if (!kw) return true;
        const inv = investors.get(o.userId);
        return (o.fundName || '').includes(kw)
          || (inv?.name || '').includes(kw)
          || String(o.amount).includes(kw);
      })
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [filter, keyword, investors, typeTab]);

  const selected = detailId ? fundOrders.find(o => o.id === detailId) : null;
  const drawerOpen = !!selected;
  const goList = () => { if (navigate) navigate('#admin/fund-trades'); };
  const drawerRef = useDrawerFocus(drawerOpen, goList);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  // 打开单据时清空表单（不预填净值：预填=无脑确认，架空人工复核点）
  useEffect(() => {
    if (!selected) return;
    setNavInput('');
    setRejectOpen(false);
    setReason('');
    setErrorMsg('');
  }, [detailId]);

  const pendingOf = (type) => fundOrders.filter(o => o.type === type && o.status === FUND_ORDER_STATUS.PENDING).length;
  const pendingCount = pendingOf(typeTab);
  const confirmedCount = fundOrders.filter(o => o.type === typeTab && o.status === FUND_ORDER_STATUS.CONFIRMED).length;
  const isRedeem = selected?.type === 'redeem';

  const fund = selected ? funds.find(f => f.id === selected.fundId) : null;
  const effectiveNav = Number(navInput) > 0 ? Number(navInput) : (fund ? latestNav(fund) : 0);
  const feeRate = selected?.feeRate ?? FUND_FEE_RATE.subscribe;
  const previewFee = selected
    ? (isRedeem ? Math.round(selected.shares * effectiveNav * feeRate) : Math.round(selected.amount * feeRate))
    : 0;
  const previewShares = selected && effectiveNav > 0 && !isRedeem ? (selected.amount - previewFee) / effectiveNav : 0;
  const previewNet = selected && isRedeem ? Math.round(selected.shares * effectiveNav) - previewFee : 0;

  const refresh = () => setTick(t => t + 1);

  const handleConfirm = () => {
    const res = (isRedeem ? confirmRedemptionOrder : confirmFundOrder)(
      selected.id, { nav: Number(navInput) > 0 ? Number(navInput) : null, operator },
    );
    if (!res.ok) { setErrorMsg(res.error); return; }
    setErrorMsg('');
    setTick(t => t + 1);
    goList();
  };

  const handleReject = () => {
    if (!reason.trim()) { setErrorMsg('请填写驳回原因'); return; }
    const res = rejectFundOrder(selected.id, reason.trim(), operator);
    if (!res.ok) { setErrorMsg(res.error); return; }
    setErrorMsg('');
    setTick(t => t + 1);
    goList();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>基金交易</h1>
        <span className="text-muted">
          申购待确认 {pendingOf('subscribe')} 笔 · 赎回待确认 {pendingOf('redeem')} 笔 · 本栏已成交 {confirmedCount} 笔
        </span>
      </div>

      <div className="admin-tabs">
        {[
          { key: 'subscribe', label: '申购' },
          { key: 'redeem', label: '赎回' },
        ].map(x => (
          <button
            key={x.key}
            className={`admin-tab ${typeTab === x.key ? 'active' : ''}`}
            onClick={() => { setTypeTab(x.key); setFilter(FUND_ORDER_STATUS.PENDING); }}
          >
            {x.label}
            {pendingOf(x.key) > 0 ? ` (${pendingOf(x.key)})` : ''}
          </button>
        ))}
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key && !keyword ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key === FUND_ORDER_STATUS.PENDING && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={14} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="按基金 / 投资人 / 金额搜索"
            placeholder="按基金 / 投资人 / 金额搜索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {keyword && <button className="btn-icon" title="清除搜索" onClick={() => setKeyword('')}><X size={14} /></button>}
        </div>
      </div>

      <div className="admin-table admin-table--deposits">
        <div className="admin-table-header">
          <span className="col-id">申请单号</span>
          <span className="col-name">投资人</span>
          <span className="col-id">基金</span>
          <span className="col-amount">{typeTab === 'redeem' ? '赎回份额' : '金额'}</span>
          <span className="col-date">提交时间</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
        {list.map(o => {
          const inv = investors.get(o.userId);
          const meta = STATUS_META[o.status];
          return (
            <div
              key={o.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/fund-trades/${o.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/fund-trades/${o.id}`); } }}
            >
              <span className="col-id">{o.id}</span>
              <span className="col-name"><strong>{maskName(inv?.name || o.userId)}</strong></span>
              <span className="col-id">{o.fundName}</span>
              <span className="col-amount">
                {typeTab === 'redeem' ? `${formatShares(o.shares)} 份` : `${o.currency} ${formatExactAmount(o.amount)}`}
              </span>
              <span className="col-date">{formatListDateTime(o.createdAt)}</span>
              <span className="col-status"><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
              <span className="col-actions">
                <button className="btn-icon" title="查看并处理" onClick={e => { e.stopPropagation(); navigate(`#admin/fund-trades/${o.id}`); }}>
                  <CheckCircle size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的申购单</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={goList} />}
      {drawerOpen && selected && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`申购单 ${selected.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">{isRedeem ? '赎回单' : '申购单'} {selected.id}</h3>
            <button className="btn-icon" title="关闭" onClick={goList}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            <div className="card">
              <div className="kyc-review-row"><span>基金</span><strong>{selected.fundName}</strong></div>
              <div className="kyc-review-row"><span>投资人</span><strong>{investors.get(selected.userId)?.name || selected.userId}</strong></div>
              {isRedeem ? (
                <>
                  <div className="kyc-review-row"><span>赎回份额</span><strong>{formatShares(selected.shares)} 份</strong></div>
                  <div className="kyc-review-row"><span>提交时参考净值</span><strong>{selected.nav}</strong></div>
                  <div className="kyc-review-row"><span>预估回款</span><strong>{selected.currency} {formatExactAmount(selected.amount)}</strong></div>
                  <div className="kyc-review-row"><span>持仓剩余</span><strong>{formatShares(Math.max(0, (fundHoldings.find(hh => hh.userId === selected.userId && hh.fundId === selected.fundId && hh.currency === selected.currency)?.shares || 0) - selected.shares))} 份</strong></div>
                </>
              ) : (
                <div className="kyc-review-row"><span>申购金额</span><strong>{selected.currency} {formatExactAmount(selected.amount)}</strong></div>
              )}
              <div className="kyc-review-row"><span>提交时间</span><strong>{selected.createdAt}</strong></div>
              <div className="kyc-review-row"><span>状态</span><strong>{STATUS_META[selected.status]?.label}</strong></div>
              {selected.status === FUND_ORDER_STATUS.CONFIRMED && (
                <>
                  <div className="kyc-review-row"><span>确认净值</span><strong>{selected.nav}（{selected.navDate}）</strong></div>
                  <div className="kyc-review-row"><span>确认份额</span><strong>{formatShares(selected.shares)} 份</strong></div>
                  <div className="kyc-review-row"><span>认购费</span><strong>{selected.currency} {formatExactAmount(selected.feeAmount || 0)}</strong></div>
                  <div className="kyc-review-row"><span>处理人</span><strong>{selected.confirmedBy || '—'}
                  </strong></div>
                </>
              )}
              {selected.status === FUND_ORDER_STATUS.REJECTED && (
                <div className="kyc-review-row"><span>驳回原因</span><strong>{selected.rejectReason || '—'}</strong></div>
              )}
            </div>

            {selected.status === FUND_ORDER_STATUS.PENDING && !rejectOpen && (
              <div className="card">
                <div className="card-title">确认成交</div>
                <div className="form-group">
                  <label>{isRedeem ? '确认净值（决定回款金额，默认取当前净值）' : '确认净值（默认取当前净值，可按确认日网价修改）'}</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    placeholder={fund ? String(latestNav(fund)) : ''}
                    value={navInput}
                    onChange={e => { setNavInput(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  />
                  <div className="admin-form-hint">
                  {isRedeem ? (
                    <>
                      费率 {(feeRate * 100).toFixed(2)}% · 赎回费 {selected.currency} {formatExactAmount(previewFee)} ·
                      预计回款 {selected.currency} {formatExactAmount(previewNet)}
                    </>
                  ) : (
                    <>
                      费率 {(feeRate * 100).toFixed(2)}% · 认购费 {selected.currency} {formatExactAmount(previewFee)} ·
                      预计入账 {formatShares(Number(previewShares.toFixed(4)))} 份
                    </>
                  )}
                </div>
                </div>
                <p className="text-muted text-sm">
                  {isRedeem
                    ? `确认后将扣减 ${formatShares(selected.shares)} 份持仓，回款 ${selected.currency} ${formatExactAmount(previewNet)} 进入投资人可用余额，并生成逐笔结单。`
                    : `确认后将从投资人可用余额扣款 ${selected.currency} ${formatExactAmount(selected.amount)}，并生成逐笔结单。`}
                </p>
              </div>
            )}

            {selected.status === FUND_ORDER_STATUS.PENDING && rejectOpen && (
              <div className="admin-reject-form">
                <div className="form-group">
                  <label>驳回原因</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="例如：未收到款项 / 金额与申请不符 / 客户要求取消"
                    value={reason}
                    onChange={e => { setReason(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  />
                </div>
              </div>
            )}

            {errorMsg && <p className="form-error">{errorMsg}</p>}
          </div>

          {selected.status === FUND_ORDER_STATUS.PENDING && (
            <div className="admin-drawer-actions">
              {rejectOpen ? (
                <>
                  <button className="btn btn-md btn-secondary" onClick={() => { setRejectOpen(false); setReason(''); setErrorMsg(''); }}>取消</button>
                  <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认驳回</button>
                </>
              ) : (
                <>
                  <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 驳回</button>
                  <button className="btn btn-md btn-primary" onClick={handleConfirm}><CheckCircle size={16} /> {isRedeem ? '确认赎回' : '确认成交'}</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
