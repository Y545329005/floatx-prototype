import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, XCircle, Search, Clock, Eye } from 'lucide-react';
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

// 基金交易（2026-10-28 基金一期闭环的后台确认台；2026-10-29 重构）
// 这是闭环里唯一把「申请」变成「持仓」的地方：确认即扣款 + 份额入账 + 出结单，
// 所以放在独立菜单而不是塞进「资金审核」——交易域（钱换份额）与资金域（银行 ↔ 平台）分属两件事。
//
// 2026-10-29 重构的第一性原理：本页不是「列表页」，是每天要清空的决策队列。
//   1) 列表的主角是「待确认」：页头只放一个主数字（待确认总笔数），行内给等待时长信号；
//   2) 抽屉按运营的决策顺序排列：申请信息（谁/什么/多少）→ 成交预览（净值 → 费/份额/回款）→ 操作；
//   3) 已成交/已驳回单据回答的是另一个问题（发生了什么），所以给「成交结果 + 处理轨迹」，
//      与待确认的「预览 + 决策」不混用同一套行样式。
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

// 等待时长 = 决策紧迫度信号。只对「待确认」有意义：成交/驳回后等待已结束。
const waitLabel = (createdAt) => {
  const t = new Date(String(createdAt || '').replace(' ', 'T')).getTime();
  if (!Number.isFinite(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 60) return `已等待 ${mins} 分钟`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `已等待 ${hrs} 小时`;
  return `已等待 ${Math.floor(hrs / 24)} 天`;
};

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
  // 处理完成回执：确认/驳回后不立刻关抽屉，先把结果留在眼前（结单已生成 / 已驳回）
  const [doneMsg, setDoneMsg] = useState('');
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
      // 决策队列按等待时长排序：待确认 = 最久等待在前（先处理快超时的）；
      // 其他视图看的是历史，最新在前更自然。
      .sort((a, b) => (filter === FUND_ORDER_STATUS.PENDING
        ? (a.createdAt < b.createdAt ? -1 : 1)
        : (a.createdAt < b.createdAt ? 1 : -1)));
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
    setDoneMsg('');
  }, [detailId]);

  const pendingOf = (type) => fundOrders.filter(o => o.type === type && o.status === FUND_ORDER_STATUS.PENDING).length;
  const pendingTotal = pendingOf('subscribe') + pendingOf('redeem');
  const pendingCount = pendingOf(typeTab);
  const confirmedCount = fundOrders.filter(o => o.type === typeTab && o.status === FUND_ORDER_STATUS.CONFIRMED).length;
  const isRedeem = selected?.type === 'redeem';
  const statusMeta = selected ? STATUS_META[selected.status] : null;
  // 队列的第二个数字：谁等最久。等待时长只有落在「最久」上才构成行动信号。
  const oldestPendingAt = fundOrders
    .filter(o => o.status === FUND_ORDER_STATUS.PENDING)
    .reduce((min, o) => (!min || o.createdAt < min ? o.createdAt : min), '');

  const fund = selected ? funds.find(f => f.id === selected.fundId) : null;
  const effectiveNav = Number(navInput) > 0 ? Number(navInput) : (fund ? latestNav(fund) : 0);
  const feeRate = selected?.feeRate ?? FUND_FEE_RATE.subscribe;
  const previewFee = selected
    ? (isRedeem ? Math.round(selected.shares * effectiveNav * feeRate) : Math.round(selected.amount * feeRate))
    : 0;
  const previewShares = selected && effectiveNav > 0 && !isRedeem ? (selected.amount - previewFee) / effectiveNav : 0;
  const previewNet = selected && isRedeem ? Math.round(selected.shares * effectiveNav) - previewFee : 0;

  // 赎回单：确认后持仓剩余（持仓 shares 未扣减，赎回只冻结）
  const holdingForOrder = selected && isRedeem
    ? fundHoldings.find(hh => hh.userId === selected.userId && hh.fundId === selected.fundId && hh.currency === selected.currency)
    : null;
  const holdingLeft = holdingForOrder ? Math.max(0, (holdingForOrder.shares || 0) - selected.shares) : 0;

  const refresh = () => setTick(t => t + 1);

  const handleConfirm = () => {
    const res = (isRedeem ? confirmRedemptionOrder : confirmFundOrder)(
      selected.id, { nav: Number(navInput) > 0 ? Number(navInput) : null, operator },
    );
    if (!res.ok) { setErrorMsg(res.error); return; }
    setErrorMsg('');
    // 不立刻关抽屉：确认是不可逆的金钱动作，先把结果（份额/净值/结单）留在眼前当回执
    setDoneMsg(isRedeem
      ? `已确认赎回：${formatShares(selected.shares)} 份 · 净值 ${selected.nav} · 回款 ${selected.currency} ${formatExactAmount(selected.netAmount || 0)}，结单已生成。`
      : `已确认成交：${formatShares(selected.shares)} 份 · 净值 ${selected.nav} · 认购费 ${selected.currency} ${formatExactAmount(selected.feeAmount || 0)}，结单已生成。`);
    refresh();
  };

  const handleReject = () => {
    if (!reason.trim()) { setErrorMsg('请填写驳回原因'); return; }
    const res = rejectFundOrder(selected.id, reason.trim(), operator);
    if (!res.ok) { setErrorMsg(res.error); return; }
    setErrorMsg('');
    setDoneMsg(`已驳回：${reason.trim()}`);
    refresh();
  };

  const typeLabel = typeTab === 'redeem' ? '赎回' : '申购';
  const filterLabel = filter === 'all' ? '' : (FILTERS.find(f => f.key === filter)?.label || '');
  const emptyText = `暂无${filterLabel ? `${filterLabel}的` : ''}${typeLabel}单`;

  return (
    <div className="admin-page admin-page--fund-trades">
      <div className="admin-page-header">
        <h1>基金交易</h1>
        <div className="fund-trade-queue" title="待确认 = 需要财务人工处理的申购/赎回申请">
          <strong className="fund-trade-queue-num">{pendingTotal}</strong>
          <span className="fund-trade-queue-text">
            笔待确认 · 申购 {pendingOf('subscribe')} · 赎回 {pendingOf('redeem')} · 本栏已成交 {confirmedCount} 笔
          </span>
          {pendingTotal > 0 && oldestPendingAt && (
            <span className="fund-trade-queue-oldest">最久等待 {waitLabel(oldestPendingAt).replace('已等待 ', '')}</span>
          )}
        </div>
      </div>

      <div className="fund-tabs" role="tablist" aria-label="交易类型">
        {[
          { key: 'subscribe', label: '申购' },
          { key: 'redeem', label: '赎回' },
        ].map(x => (
          <button
            key={x.key}
            role="tab"
            aria-selected={typeTab === x.key}
            className={`fund-tab ${typeTab === x.key ? 'active' : ''}`}
            onClick={() => { setTypeTab(x.key); setFilter(FUND_ORDER_STATUS.PENDING); }}
          >
            {x.label}
            {pendingOf(x.key) > 0 && <span className="fund-tab-count">{pendingOf(x.key)}</span>}
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

      <div className="admin-table admin-table--fund-trades">
        <div className="admin-table-header">
          <span className="col-id">申请单号</span>
          <span className="col-name">投资人</span>
          <span>基金</span>
          <span className="col-amount">{typeTab === 'redeem' ? '赎回份额' : '金额'}</span>
          <span className="col-date">提交时间</span>
          <span>状态</span>
          <span className="col-actions">操作</span>
        </div>
        {list.map(o => {
          const inv = investors.get(o.userId);
          const meta = STATUS_META[o.status];
          const isPending = o.status === FUND_ORDER_STATUS.PENDING;
          return (
            <div
              key={o.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/fund-trades/${o.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/fund-trades/${o.id}`); } }}
            >
              <span className="col-id"><span className="fund-trade-id">{o.id}</span></span>
              <span className="col-name"><strong>{maskName(inv?.name || o.userId)}</strong></span>
              <span>{o.fundName}</span>
              <span className="col-amount">
                {typeTab === 'redeem' ? `${formatShares(o.shares)} 份` : `${o.currency} ${formatExactAmount(o.amount)}`}
              </span>
              <span className="col-date">
                <span className="fund-trade-time">{formatListDateTime(o.createdAt)}</span>
                {isPending && <span className="fund-trade-wait"><Clock size={11} /> {waitLabel(o.createdAt)}</span>}
              </span>
              <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
              <span className="col-actions">
                <button className="btn-icon" title={isPending ? '查看并处理' : '查看详情'} onClick={e => { e.stopPropagation(); navigate(`#admin/fund-trades/${o.id}`); }}>
                  {isPending ? <CheckCircle size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">{emptyText}</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={goList} />}
      {drawerOpen && selected && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${isRedeem ? '赎回单' : '申购单'} ${selected.id}`}>
          <div className="admin-drawer-head">
            <h3>
              {isRedeem ? '赎回单' : '申购单'} <span className="fund-trade-id">{selected.id}</span>
              <span className={`status-badge ${statusMeta.cls} fund-trade-head-badge`}>{statusMeta.label}</span>
            </h3>
            <button className="btn-icon" title="关闭" onClick={goList}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {doneMsg && <div className="fund-trade-done">{doneMsg}</div>}
            {/* ① 申请信息：谁、什么、多少、何时——决策的事实面 */}
            <div className="card">
              <div className="card-title">申请信息</div>
              <div className="kyc-review-row"><span>基金</span><strong>{selected.fundName}</strong></div>
              <div className="kyc-review-row"><span>投资人</span><strong>{investors.get(selected.userId)?.name || selected.userId}</strong></div>
              {isRedeem ? (
                <>
                  <div className="kyc-review-row"><span>赎回份额</span><strong>{formatShares(selected.shares)} 份</strong></div>
                  <div className="kyc-review-row"><span>提交时参考净值</span><strong>{selected.nav}</strong></div>
                  <div className="kyc-review-row"><span>持仓剩余（确认后）</span><strong>{formatShares(holdingLeft)} 份</strong></div>
                </>
              ) : (
                <div className="kyc-review-row"><span>申购金额</span><strong>{selected.currency} {formatExactAmount(selected.amount)}</strong></div>
              )}
              <div className="kyc-review-row"><span>提交时间</span><strong>{selected.createdAt}</strong></div>
              {selected.status === FUND_ORDER_STATUS.PENDING && (
                <div className="kyc-review-row"><span>已等待</span><strong>{waitLabel(selected.createdAt).replace('已等待 ', '')}</strong></div>
              )}
              {selected.status === FUND_ORDER_STATUS.REJECTED && (
                <div className="kyc-review-row"><span>驳回原因</span><strong>{selected.rejectReason || '—'}</strong></div>
              )}
            </div>

            {/* ② 成交预览：决策变量（净值）→ 后果（费/份额/回款）实时联动 */}
            {selected.status === FUND_ORDER_STATUS.PENDING && !rejectOpen && (
              <div className="card">
                <div className="card-title">成交预览</div>
                <div className="form-group">
                  <label htmlFor="fund-trade-nav">{isRedeem ? '确认净值（决定回款金额）' : '确认净值（决定入账份额）'}</label>
                  <div className="fund-trade-nav-row">
                    <input
                      id="fund-trade-nav"
                      className="form-input"
                      type="number"
                      step="any"
                      placeholder={fund ? String(latestNav(fund)) : ''}
                      value={navInput}
                      onChange={e => { setNavInput(e.target.value); if (errorMsg) setErrorMsg(''); }}
                    />
                    <span className="fund-trade-nav-hint">当前净值 {fund ? latestNav(fund).toFixed(3) : '—'} · 留空按当前净值确认</span>
                  </div>
                </div>
                <div className="fund-trade-consequence">
                  <div className="fund-trade-consequence-row">
                    <span>确认净值</span>
                    <strong>{effectiveNav > 0 ? Number(effectiveNav).toFixed(3) : '—'}</strong>
                  </div>
                  <div className="fund-trade-consequence-row">
                    <span>费率</span>
                    <strong>{(feeRate * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="fund-trade-consequence-row">
                    <span>{isRedeem ? '赎回费' : '认购费'}</span>
                    <strong>{selected.currency} {formatExactAmount(previewFee)}</strong>
                  </div>
                  <div className="fund-trade-consequence-row fund-trade-consequence-row--total">
                    <span>{isRedeem ? '预计回款' : '预计入账份额'}</span>
                    <strong>
                      {isRedeem
                        ? `${selected.currency} ${formatExactAmount(previewNet)}`
                        : `${formatShares(Number(previewShares.toFixed(4)))} 份`}
                    </strong>
                  </div>
                </div>
                <p className="fund-trade-impact">
                  {isRedeem
                    ? `确认后将扣减 ${formatShares(selected.shares)} 份持仓，回款 ${selected.currency} ${formatExactAmount(previewNet)} 进入投资人可用余额，并生成逐笔结单。`
                    : `确认后将从投资人可用余额扣款 ${selected.currency} ${formatExactAmount(selected.amount)}，并生成逐笔结单。`}
                </p>
              </div>
            )}

            {selected.status === FUND_ORDER_STATUS.PENDING && rejectOpen && (
              <div className="admin-reject-form">
                <div className="form-group">
                  <label htmlFor="fund-trade-reason">驳回原因（投资人可见）</label>
                  <textarea
                    id="fund-trade-reason"
                    className="form-input"
                    rows={2}
                    placeholder="例如：未收到款项 / 金额与申请不符 / 客户要求取消"
                    value={reason}
                    onChange={e => { setReason(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  />
                </div>
              </div>
            )}

            {/* ③ 已成交/已驳回：成交结果（发生了什么） + 处理轨迹（谁在何时做的） */}
            {selected.status === FUND_ORDER_STATUS.CONFIRMED && (
              <div className="card">
                <div className="card-title">成交结果</div>
                <div className="kyc-review-row"><span>确认净值</span><strong>{selected.nav}（{selected.navDate}）</strong></div>
                <div className="kyc-review-row"><span>确认份额</span><strong>{formatShares(selected.shares)} 份</strong></div>
                {isRedeem && (
                  <div className="kyc-review-row"><span>回款净额</span><strong>{selected.currency} {formatExactAmount(selected.netAmount || 0)}</strong></div>
                )}
                <div className="kyc-review-row"><span>{isRedeem ? '赎回费' : '认购费'}</span><strong>{selected.currency} {formatExactAmount(selected.feeAmount || 0)}</strong></div>
                <div className="kyc-review-row"><span>处理人</span><strong>{selected.confirmedBy || '—'}</strong></div>
                <div className="kyc-review-row"><span>确认时间</span><strong>{selected.confirmedAt || '—'}</strong></div>
              </div>
            )}

            {selected.status !== FUND_ORDER_STATUS.PENDING && Array.isArray(selected.history) && selected.history.length > 0 && (
              <div className="card">
                <div className="card-title">处理轨迹</div>
                <div className="fund-trade-history">
                  {selected.history.map((h, i) => (
                    <div className="fund-trade-history-row" key={i}>
                      <span className="fund-trade-history-time">{h.timestamp}</span>
                      <span className="fund-trade-history-note">{h.note || h.type}</span>
                    </div>
                  ))}
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
                  <button className="btn btn-md btn-danger" onClick={handleReject}><XCircle size={16} /> 确认驳回</button>
                </>
              ) : (
                <>
                  <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 驳回</button>
                  <button className="btn btn-md btn-primary" onClick={handleConfirm}>
                    <CheckCircle size={16} />
                    {isRedeem
                      ? `确认赎回 · 回款 ${selected.currency} ${formatExactAmount(previewNet)}`
                      : `确认成交 · 扣款 ${selected.currency} ${formatExactAmount(selected.amount)}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
