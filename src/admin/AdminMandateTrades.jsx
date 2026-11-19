import { useEffect, useMemo, useState } from 'react';
import { X, Plus, CheckCircle, XCircle, AlertTriangle, Ban, Save, Search } from 'lucide-react';
import {
  mandateAccounts,
  mandateTrades,
  mandateConfig,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_TRADE_STATUS,
  createMandateTrade,
  reviewMandateTrade,
  voidMandateTrade,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 委托交易（2026-11-13 批 1b；2026-11-19 拆出估值与费用）
//
// 本页的三条硬约束都在数据层，UI 只负责把话说清楚：
//   ① 交易录入即 pending —— 不进持仓、不进日结单、APP 看不到；
//   ② 复核人 ≠ 录入人；
//   ③ 作废不是删除：保留原记录 + 一条反向资金流水，审计要看到「发生过什么」。
//
// 本签只做一件事：交易台账 + 录入/复核/作废。
// 估值是标的级批量作业（独立「估值」签），费用是账户级合同事实（账户抽屉），
// 都不在这里——一个签只放一张表、一个主动作（2026-11-19 用户质问三按钮后的修正）。
// 投资限制：超限黄字提示 + 审计留痕，不拦保存——估值波动导致的超限不该把正常交易卡死。

const TRADE_STATUS = {
  [MANDATE_TRADE_STATUS.PENDING]: { label: '待复核', cls: 'admin-status-pending' },
  [MANDATE_TRADE_STATUS.ACTIVE]: { label: '已生效', cls: 'admin-status-approved' },
  [MANDATE_TRADE_STATUS.REJECTED]: { label: '已驳回', cls: 'admin-status-rejected' },
  [MANDATE_TRADE_STATUS.VOID]: { label: '已作废', cls: 'admin-status-closed' },
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminMandateTrades({ admin, detailId, correctionOf, navigate }) {
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [form, setForm] = useState(null);
  // 视图控制行（与 AdminUsers/AdminProjects 同款）：状态筛选 + 账户筛选 + 检索 + 分页
  const [filter, setFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const operator = admin?.name || '运营后台';

  const accounts = mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED);
  const isNew = detailId === 'new';
  const selected = detailId && !isNew ? mandateTrades.find(t => t.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate/trades');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  useEffect(() => {
    if (isNew) {
      setForm({
        accountId: accounts[0]?.id || '',
        side: 'buy',
        assetClass: 'us-equity',
        symbol: '',
        name: '',
        currency: 'USD',
        quantity: '',
        price: '',
        fee: '',
        fxRate: '7.8',
        tradeDate: today(),
        settleDate: '',
        note: '',
        correctionOf: correctionOf || '',
      });
    } else {
      setForm(null);
    }
    setReviewer('');
    setReason('');
    setRejectOpen(false);
    setVoidOpen(false);
    setVoidReason('');
    setError('');
    setDoneMsg('');
  }, [detailId, correctionOf]);

  const refresh = () => setTick(t => t + 1);
  const pendingCount = mandateTrades.filter(t => t.status === MANDATE_TRADE_STATUS.PENDING).length;
  const tradeRows = useMemo(() => mandateTrades
    .slice()
    .sort((a, b) => String(b.tradeDate).localeCompare(String(a.tradeDate))), [tick]);

  const accountOf = (id) => mandateAccounts.find(a => a.id === id);
  const statusCounts = {
    all: tradeRows.length,
    [MANDATE_TRADE_STATUS.PENDING]: tradeRows.filter(t => t.status === MANDATE_TRADE_STATUS.PENDING).length,
    [MANDATE_TRADE_STATUS.ACTIVE]: tradeRows.filter(t => t.status === MANDATE_TRADE_STATUS.ACTIVE).length,
    [MANDATE_TRADE_STATUS.REJECTED]: tradeRows.filter(t => t.status === MANDATE_TRADE_STATUS.REJECTED).length,
    [MANDATE_TRADE_STATUS.VOID]: tradeRows.filter(t => t.status === MANDATE_TRADE_STATUS.VOID).length,
  };
  const filteredTrades = tradeRows.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (accountFilter && t.accountId !== accountFilter) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    const acc = accountOf(t.accountId);
    return [t.symbol, t.name, t.no, acc?.userName, t.adviceNo]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCreate = () => {
    if (!form) return;
    const res = createMandateTrade({
      ...form,
      quantity: Number(form.quantity),
      price: Number(form.price),
      fee: Number(form.fee || 0),
      fxRate: Number(form.fxRate),
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    refresh();
    navigate(`#admin/mandate/trades/${res.trade.id}`);
  };

  const handleReview = (decision) => {
    if (!selected) return;
    const res = reviewMandateTrade(selected.id, {
      decision,
      reviewer,
      reason,
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setDoneMsg(decision === 'approve'
      ? `已生效：${selected.symbol} ${selected.quantity} 股，资金流水已生成${selected.adviceMail ? '，成交通知邮件已排队' : ''}。`
      : `已驳回：${reason.trim() || '未说明原因'}`);
    setRejectOpen(false);
    refresh();
  };

  const handleVoid = () => {
    if (!selected) return;
    if (!reviewer.trim()) { setError('请填写复核人'); return; }
    const res = voidMandateTrade(selected.id, { reason: voidReason, reviewer: reviewer.trim() }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setDoneMsg('已作废并生成反向资金流水，持仓已回退。');
    setVoidOpen(false);
    refresh();
  };

  return (
    <div className="mandate-panel mandate-panel--trades">
      {/* 工具栏 = 存量统计 + 一个主动作。估值与费用已移出本签：
          估值是标的级批量作业（独立签），费用是账户级合同事实（账户抽屉）。 */}
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">共 {tradeRows.length} 笔 · 待复核 {pendingCount}</span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/mandate/trades/new')}>
          <Plus size={16} /> 录入交易
        </button>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: MANDATE_TRADE_STATUS.PENDING, label: '待复核' },
            { key: MANDATE_TRADE_STATUS.ACTIVE, label: '已生效' },
            { key: MANDATE_TRADE_STATUS.REJECTED, label: '已驳回' },
            { key: MANDATE_TRADE_STATUS.VOID, label: '已作废' },
          ].map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label} {statusCounts[f.key]}
            </button>
          ))}
        </div>
        <div className="admin-view-row-right">
          <select
            className="form-input admin-tx-range"
            aria-label="按账户筛选交易"
            value={accountFilter}
            onChange={e => { setAccountFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部账户</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.no} · {a.userName}</option>)}
          </select>
          <div className="admin-search-wrap">
            <Search size={16} className="admin-search-icon" />
            <input
              className="admin-search-input"
              aria-label="搜索证券 / 账户号 / 客户"
              placeholder="搜索证券 / 账户号 / 客户"
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
            />
            {keyword && (
              <button className="btn-icon" title="清除" onClick={() => { setKeyword(''); setPage(1); }}><X size={16} /></button>
            )}
          </div>
        </div>
      </div>

      <div className="admin-table admin-table--mandate-trades">
          <div className="admin-table-header">
            <span>交易日</span>
            <span className="col-name">证券</span>
            <span>账户</span>
            <span>方向</span>
            <span className="col-amount">数量 × 价格</span>
            <span className="col-amount">金额 HKD</span>
            <span>状态</span>
            <span className="col-actions">操作</span>
          </div>
          {pageRows.map(t => {
            const meta = TRADE_STATUS[t.status] || TRADE_STATUS[MANDATE_TRADE_STATUS.PENDING];
            const amountHKD = t.quantity * t.price * t.fxRate;
            const acc = accountOf(t.accountId);
            return (
              <div
                key={t.id}
                className="admin-table-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`#admin/mandate/trades/${t.id}`)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/mandate/trades/${t.id}`); } }}
              >
                <span>{t.tradeDate}</span>
                <span className="col-name">
                  <strong>{t.symbol}</strong>
                  <span className="mandate-subline">{t.name}{t.correctionOf ? ' · 更正重录' : ''}</span>
                </span>
                <span>
                  {t.no}
                  <span className="mandate-subline">{acc?.userName || '—'}</span>
                </span>
                <span className={t.side === 'buy' ? 'mandate-side-buy' : 'mandate-side-sell'}>{t.side === 'buy' ? '买入' : '卖出'}</span>
                <span className="col-amount">{formatShares(t.quantity)} × {t.price}</span>
                <span className="col-amount">{formatExactAmount(amountHKD)}</span>
                <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
                <span className="col-actions">
                  {t.status === MANDATE_TRADE_STATUS.PENDING
                    ? (
                      <button className="btn-icon" title="复核" aria-label="复核（打开交易抽屉）" onClick={e => { e.stopPropagation(); navigate(`#admin/mandate/trades/${t.id}`); }}>
                        <CheckCircle size={16} />
                      </button>
                    )
                    : <span className="mandate-reviewer">{t.reviewedBy || '—'}</span>}
                </span>
              </div>
            );
          })}
          {pageRows.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">{keyword ? '没有匹配的交易' : '暂无交易'}</span></div>
          )}
      </div>

      {filteredTrades.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filteredTrades.length} 笔</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && (form || selected) && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '录入委托交易' : `委托交易 ${selected?.id}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '录入委托交易' : `${selected.symbol} ${selected.side === 'buy' ? '买入' : '卖出'}`}
              {!isNew && <span className={`status-badge ${TRADE_STATUS[selected.status]?.cls} fund-product-head-badge`}>{TRADE_STATUS[selected.status]?.label}</span>}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {doneMsg && <div className="fund-trade-done">{doneMsg}</div>}

            {isNew && form && (
              <>
                <div className="card">
                  <div className="card-title">交易信息</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">账户</label>
                      <select className="form-input" value={form.accountId} onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.no} · {a.userName}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">方向</label>
                      <select className="form-input" value={form.side} onChange={e => setForm(p => ({ ...p, side: e.target.value }))}>
                        <option value="buy">买入</option>
                        <option value="sell">卖出</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">证券代码</label>
                      <input className="form-input" value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="如 AAPL" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">证券名称</label>
                      <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="如 Apple Inc." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">数量</label>
                      <input className="form-input" type="number" step="any" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">成交价（原币）</label>
                      <input className="form-input" type="number" step="any" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">币种</label>
                      <select className="form-input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                        <option value="USD">USD</option>
                        <option value="HKD">HKD</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">费用（原币）</label>
                      <input className="form-input" type="number" step="any" value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">成交日汇率（折 HKD）</label>
                      <input className="form-input" type="number" step="any" value={form.fxRate} onChange={e => setForm(p => ({ ...p, fxRate: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">交易日</label>
                      <input className="form-input" type="date" value={form.tradeDate} onChange={e => setForm(p => ({ ...p, tradeDate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">交收日</label>
                      <input className="form-input" type="date" value={form.settleDate} onChange={e => setForm(p => ({ ...p, settleDate: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">备注</label>
                      <input className="form-input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
                    </div>
                  </div>
                  <div className="admin-form-hint">汇率是收益折算的唯一依据：不记汇率，成本与市值就永远对不上。录入后为「待复核」，不进持仓、不进日结单。</div>
                  {form.correctionOf && <div className="mandate-gate-warn"><AlertTriangle size={15} /> 本笔为更正重录：原交易 {form.correctionOf} 已作废，成交通知单会标注「更正」。</div>}
                  {error && <p className="form-error">{error}</p>}
                  <div className="admin-form-actions">
                    <button className="btn btn-md btn-primary" onClick={handleCreate}><Save size={16} /> 保存为待复核</button>
                  </div>
                </div>
              </>
            )}

            {!isNew && selected && (
              <>
                {/* pending 时复核是唯一的下一步动作，置顶；交易信息 KV 随后作核对底稿 */}
                {selected.status === MANDATE_TRADE_STATUS.PENDING && (
                  <div className="card">
                    <div className="card-title">复核（Maker-Checker）</div>
                    <div className="form-group">
                      <label className="form-label">复核人（不得与录入人相同）</label>
                      <input className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="合规人员姓名" />
                    </div>
                    {rejectOpen && (
                      <div className="form-group">
                        <label className="form-label">驳回原因</label>
                        <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} />
                      </div>
                    )}
                    {error && <p className="form-error">{error}</p>}
                    <div className="admin-form-actions">
                      {!rejectOpen && <button className="btn btn-md btn-secondary" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 驳回</button>}
                      {rejectOpen && <button className="btn btn-md btn-secondary" onClick={() => handleReview('reject')}><XCircle size={16} /> 确认驳回</button>}
                      <button className="btn btn-md btn-primary" onClick={() => handleReview('approve')}><CheckCircle size={16} /> 生效</button>
                    </div>
                    <p className="admin-form-hint">生效时自动写一条交易流水（买入减、卖出增）并发送成交通知邮件{mandateConfig.adviceEmail ? '' : '（当前邮件开关关闭，仅 APP 可查）'}。</p>
                  </div>
                )}

                <div className="card">
                  <div className="card-title">交易信息</div>
                  <div className="kyc-review-row"><span>账户</span><strong>{selected.no} · {selected.userId}</strong></div>
                  <div className="kyc-review-row"><span>证券</span><strong>{selected.name}（{selected.symbol}）</strong></div>
                  <div className="kyc-review-row"><span>方向 / 数量</span><strong>{selected.side === 'buy' ? '买入' : '卖出'} {formatShares(selected.quantity)} 股</strong></div>
                  <div className="kyc-review-row"><span>成交价 / 汇率</span><strong>{selected.price} {selected.currency} × {selected.fxRate}</strong></div>
                  <div className="kyc-review-row"><span>金额（折 HKD）</span><strong>{formatExactAmount(selected.quantity * selected.price * selected.fxRate)}</strong></div>
                  <div className="kyc-review-row"><span>交易日 / 交收日</span><strong>{selected.tradeDate} → {selected.settleDate || '—'}</strong></div>
                  <div className="kyc-review-row"><span>录入 / 复核</span><strong>{selected.createdBy} / {selected.reviewedBy || '—'}</strong></div>
                  {selected.rejectReason && <div className="kyc-review-row"><span>驳回原因</span><strong>{selected.rejectReason}</strong></div>}
                  {selected.voidReason && <div className="kyc-review-row"><span>作废原因</span><strong>{selected.voidReason}</strong></div>}
                  {selected.adviceMail && <div className="kyc-review-row"><span>成交通知</span><strong>{selected.adviceMail.status === 'queued' ? '邮件已排队' : selected.adviceMail.status} · {String(selected.adviceMail.at || '').slice(0, 16)}</strong></div>}
                </div>

                {selected.limitWarnings?.length > 0 && (
                  <div className="mandate-gate-warn">
                    <AlertTriangle size={15} />
                    <span>{selected.limitWarnings.join('；')}<br />软提示不阻断——超限已留痕，合规可事后审计。</span>
                  </div>
                )}

                {selected.status === MANDATE_TRADE_STATUS.VOID && (
                  <div className="card">
                    <div className="card-title">更正重录</div>
                    <p className="admin-form-hint">原交易已作废并冲正。重录时保留更正来源，成交通知单会标注「更正」，客户能分清哪张有效。</p>
                    <div className="admin-form-actions">
                      <button className="btn btn-md btn-primary" onClick={() => navigate(`#admin/mandate/trades/new/${selected.id}`)}>
                        <Plus size={16} /> 更正重录
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === MANDATE_TRADE_STATUS.ACTIVE && (
                  <div className="card">
                    <div className="card-title">作废（保留记录 + 反向流水）</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">复核人</label>
                        <input className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">作废原因</label>
                        <input className="form-input" value={voidReason} onChange={e => setVoidReason(e.target.value)} />
                      </div>
                    </div>
                    {voidOpen && <p className="admin-form-hint">确认后持仓立即回退、资金流水冲正。记录不删除。</p>}
                    {error && <p className="form-error">{error}</p>}
                    <div className="admin-form-actions">
                      {!voidOpen
                        ? <button className="btn btn-md btn-secondary" onClick={() => setVoidOpen(true)}><Ban size={16} /> 作废该笔</button>
                        : <button className="btn btn-md btn-secondary" onClick={handleVoid}><Ban size={16} /> 确认作废并冲正</button>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
