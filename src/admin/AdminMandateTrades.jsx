import { useEffect, useMemo, useState } from 'react';
import { X, Plus, CheckCircle, XCircle, AlertTriangle, Ban, Save } from 'lucide-react';
import {
  mandateAccounts,
  mandateTrades,
  mandatePriceMarks,
  mandateFees,
  mandateConfig,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_TRADE_STATUS,
  MANDATE_FEE_TYPES,
  MANDATE_VALUATION_METHODS,
  createMandateTrade,
  reviewMandateTrade,
  voidMandateTrade,
  getMandateHoldings,
  updateMandatePrice,
  createMandateFee,
  reviewMandateFee,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 委托交易与估值（2026-11-13 批 1b）
//
// 本页的三条硬约束都在数据层，UI 只负责把话说清楚：
//   ① 交易录入即 pending —— 不进持仓、不进日结单、APP 看不到；
//   ② 复核人 ≠ 录入人；
//   ③ 作废不是删除：保留原记录 + 一条反向资金流水，审计要看到「发生过什么」。
//
// 估值单独一栏：价格天天变，逐笔复核会把运营淹掉，所以估值只留痕不阻断。
// 投资限制同理：超限黄字提示 + 审计留痕，不拦保存——估值波动导致的超限不该把正常交易卡死。

const TRADE_STATUS = {
  [MANDATE_TRADE_STATUS.PENDING]: { label: '待复核', cls: 'admin-status-pending' },
  [MANDATE_TRADE_STATUS.ACTIVE]: { label: '已生效', cls: 'admin-status-approved' },
  [MANDATE_TRADE_STATUS.REJECTED]: { label: '已驳回', cls: 'admin-status-rejected' },
  [MANDATE_TRADE_STATUS.VOID]: { label: '已作废', cls: 'admin-status-closed' },
};

const TABS = [
  { key: 'trades', label: '交易' },
  { key: 'prices', label: '估值' },
  { key: 'fees', label: '费用' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminMandateTrades({ admin, detailId, correctionOf, navigate }) {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState('trades');
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [form, setForm] = useState(null);
  const [priceForm, setPriceForm] = useState({ symbol: '', price: '', fxRate: '', priceAt: today(), method: 'listed' });
  const [priceMsg, setPriceMsg] = useState('');
  const [feeForm, setFeeForm] = useState({ accountId: '', period: new Date().toISOString().slice(0, 7), type: 'management', amount: '', currency: 'HKD', note: '' });
  const [feeMsg, setFeeMsg] = useState('');
  const [feeReview, setFeeReview] = useState({ id: '', reviewer: '' });
  const [priceAccount, setPriceAccount] = useState('');
  const operator = admin?.name || '运营后台';

  const accounts = mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED);
  const selectedAccount = () => priceAccount || accounts[0]?.id || '';
  const isNew = detailId === 'new';
  const selected = detailId && !isNew ? mandateTrades.find(t => t.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate-trades');
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
    navigate(`#admin/mandate-trades/${res.trade.id}`);
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

  const handlePrice = () => {
    if (!selectedAccount()) { setPriceMsg('请选择账户'); return; }
    const res = updateMandatePrice({
      accountId: selectedAccount(),
      symbol: priceForm.symbol,
      price: Number(priceForm.price),
      fxRate: Number(priceForm.fxRate),
      priceAt: priceForm.priceAt,
      method: priceForm.method,
    }, operator);
    if (!res.ok) { setPriceMsg(res.error); return; }
    setPriceMsg(`已更新 ${priceForm.symbol} 至 ${priceForm.price}（留痕，不阻断交易）`);
    refresh();
  };

  const priceHoldings = selectedAccount() ? getMandateHoldings(selectedAccount()) : [];

  const handleFeeCreate = () => {
    const res = createMandateFee({ ...feeForm, amount: Number(feeForm.amount) }, operator);
    if (!res.ok) { setFeeMsg(res.error); return; }
    setFeeMsg('费用行已录入，待合规复核后从组合扣减。');
    setFeeForm(prev => ({ ...prev, amount: '', note: '' }));
    refresh();
  };

  const handleFeeReview = (id) => {
    const res = reviewMandateFee(id, { reviewer: feeReview.reviewer }, operator);
    if (!res.ok) { setFeeMsg(res.error); return; }
    setFeeMsg('费用已生效并从组合扣减。');
    setFeeReview({ id: '', reviewer: '' });
    refresh();
  };

  return (
    <div className="admin-page admin-page--mandate-trades">
      <div className="admin-page-header">
        <h1>委托交易与估值</h1>
        <span className="admin-header-summary">
          {mandateTrades.length} 笔交易 · 待复核 {pendingCount} 笔 ·
          持仓由交易派生，作废即回退
        </span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/mandate-trades/new')}>
          <Plus size={16} /> 录入交易
        </button>
      </div>

      <div className="fund-tabs" role="tablist" aria-label="委托交易分区">
        {TABS.map(x => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === x.key}
            className={`fund-tab ${tab === x.key ? 'active' : ''}`}
            onClick={() => setTab(x.key)}
          >
            {x.label}
            {x.key === 'trades' && pendingCount > 0 && <span className="fund-tab-count">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {tab === 'trades' && (
        <div className="admin-table admin-table--mandate-trades">
          <div className="admin-table-header">
            <span>交易日</span>
            <span className="col-name">证券</span>
            <span>方向</span>
            <span className="col-amount">数量 × 价格</span>
            <span className="col-amount">金额 HKD</span>
            <span>状态</span>
            <span className="col-actions">复核</span>
          </div>
          {tradeRows.map(t => {
            const meta = TRADE_STATUS[t.status] || TRADE_STATUS[MANDATE_TRADE_STATUS.PENDING];
            const amountHKD = t.quantity * t.price * t.fxRate;
            return (
              <div
                key={t.id}
                className="admin-table-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`#admin/mandate-trades/${t.id}`)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/mandate-trades/${t.id}`); } }}
              >
                <span>
                  {t.tradeDate}
                  <span className="mandate-subline">{t.no}</span>
                </span>
                <span className="col-name">
                  <strong>{t.symbol}</strong>
                  <span className="mandate-subline">{t.name}{t.correctionOf ? ' · 更正重录' : ''}</span>
                </span>
                <span className={t.side === 'buy' ? 'mandate-side-buy' : 'mandate-side-sell'}>{t.side === 'buy' ? '买入' : '卖出'}</span>
                <span className="col-amount">{formatShares(t.quantity)} × {t.price}</span>
                <span className="col-amount">{formatExactAmount(amountHKD)}</span>
                <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
                <span className="col-actions">
                  {t.status === MANDATE_TRADE_STATUS.PENDING
                    ? <CheckCircle size={16} />
                    : <span className="mandate-reviewer">{t.reviewedBy || '—'}</span>}
                </span>
              </div>
            );
          })}
          {tradeRows.length === 0 && (
            <div className="admin-table-row"><span className="admin-table-empty">暂无交易</span></div>
          )}
        </div>
      )}

      {tab === 'prices' && (
        <>
          <div className="card">
            <div className="card-title">更新估值（只留痕，不阻断交易）</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">账户</label>
                <select className="form-input" value={selectedAccount()} onChange={e => { setPriceAccount(e.target.value); setPriceMsg(''); setPriceForm(p => ({ ...p, symbol: '' })); }}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.no} · {a.userName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">持仓</label>
                <select className="form-input" value={priceForm.symbol} onChange={e => setPriceForm(p => ({ ...p, symbol: e.target.value }))}>
                  <option value="">请选择</option>
                  {priceHoldings.map(h => <option key={h.symbol} value={h.symbol}>{h.symbol} · 现价 {h.price || '未标记'}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">最新价（原币）</label>
                <input className="form-input" type="number" step="any" value={priceForm.price} onChange={e => setPriceForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">汇率（折 HKD）</label>
                <input className="form-input" type="number" step="any" value={priceForm.fxRate} onChange={e => setPriceForm(p => ({ ...p, fxRate: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">估值日</label>
                <input className="form-input" type="date" value={priceForm.priceAt} onChange={e => setPriceForm(p => ({ ...p, priceAt: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">估值方法</label>
                <select className="form-input" value={priceForm.method} onChange={e => setPriceForm(p => ({ ...p, method: e.target.value }))}>
                  {Object.entries(MANDATE_VALUATION_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            {priceMsg && <p className="admin-form-hint">{priceMsg}</p>}
            <div className="admin-form-actions">
              <button className="btn btn-md btn-outline" onClick={handlePrice}><Save size={16} /> 更新估值</button>
            </div>
            <p className="admin-form-hint">价格天天变，逐笔复核会把运营淹掉：这里只记录 before/after 与操作人，合规事后审计。日结单取「当日或之前最新一条」标记价。</p>
          </div>

          <div className="admin-table admin-table--mandate-prices">
            <div className="admin-table-header">
              <span>估值日</span>
              <span>证券</span>
              <span className="col-amount">价格</span>
              <span className="col-amount">汇率</span>
              <span>方法</span>
              <span>操作人</span>
            </div>
            {mandatePriceMarks.slice(0, 30).map(m => (
              <div key={m.id} className="admin-table-row">
                <span>{m.priceAt}</span>
                <span>{m.symbol}</span>
                <span className="col-amount">{m.price}</span>
                <span className="col-amount">{m.fxRate}</span>
                <span>{MANDATE_VALUATION_METHODS[m.method] || m.method}</span>
                <span>{m.updatedBy}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'fees' && (
        <>
          <div className="card">
            <div className="card-title">录入费用（协议 12，从组合扣减）</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">账户</label>
                <select className="form-input" value={feeForm.accountId} onChange={e => setFeeForm(p => ({ ...p, accountId: e.target.value }))}>
                  <option value="">请选择</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.no} · {a.userName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">期间（YYYY-MM）</label>
                <input className="form-input" value={feeForm.period} onChange={e => setFeeForm(p => ({ ...p, period: e.target.value }))} placeholder="2026-11" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">费用类型</label>
                <select className="form-input" value={feeForm.type} onChange={e => setFeeForm(p => ({ ...p, type: e.target.value }))}>
                  {Object.entries(MANDATE_FEE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">金额</label>
                <input className="form-input" type="number" step="any" value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <input className="form-input" value={feeForm.note} onChange={e => setFeeForm(p => ({ ...p, note: e.target.value }))} />
            </div>
            {feeMsg && <p className="admin-form-hint">{feeMsg}</p>}
            <div className="admin-form-actions">
              <button className="btn btn-md btn-outline" onClick={handleFeeCreate}><Plus size={16} /> 录入费用</button>
            </div>
            <p className="admin-form-hint">收益一律费前，费用在结单单列——把费用混进收益会让客户把费用当成亏损。</p>
          </div>

          <div className="admin-table admin-table--mandate-fees">
            <div className="admin-table-header">
              <span>期间</span>
              <span>类型</span>
              <span className="col-amount">金额</span>
              <span>状态</span>
              <span>录入 / 复核</span>
              <span className="col-actions">操作</span>
            </div>
            {mandateFees.map(f => (
              <div key={f.id} className="admin-table-row">
                <span>{f.period}</span>
                <span>{MANDATE_FEE_TYPES[f.type] || f.type}</span>
                <span className="col-amount">{f.currency} {formatExactAmount(f.amount)}</span>
                <span><span className={`status-badge ${f.status === 'approved' ? 'admin-status-approved' : f.status === 'rejected' ? 'admin-status-rejected' : 'admin-status-pending'}`}>
                  {f.status === 'approved' ? '已生效' : f.status === 'rejected' ? '已驳回' : '待复核'}
                </span></span>
                <span>{f.createdBy} / {f.reviewedBy || '—'}</span>
                <span className="col-actions">
                  {f.status === 'pending' && (
                    <span className="mandate-fee-review">
                      <input
                        className="form-input"
                        placeholder="复核人"
                        value={feeReview.id === f.id ? feeReview.reviewer : ''}
                        onChange={e => setFeeReview({ id: f.id, reviewer: e.target.value })}
                      />
                      <button className="btn btn-md btn-outline" onClick={() => handleFeeReview(f.id)}>通过</button>
                    </span>
                  )}
                </span>
              </div>
            ))}
            {mandateFees.length === 0 && (
              <div className="admin-table-row"><span className="admin-table-empty">暂无费用行</span></div>
            )}
          </div>
        </>
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

                {selected.status === MANDATE_TRADE_STATUS.VOID && (
                  <div className="card">
                    <div className="card-title">更正重录</div>
                    <p className="admin-form-hint">原交易已作废并冲正。重录时保留更正来源，成交通知单会标注「更正」，客户能分清哪张有效。</p>
                    <div className="admin-form-actions">
                      <button className="btn btn-md btn-primary" onClick={() => navigate(`#admin/mandate-trades/new/${selected.id}`)}>
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
