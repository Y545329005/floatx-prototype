import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Save, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import {
  specialSubscriptionApprovals,
  SPECIAL_SUB_STATUS,
  funds,
  getInvestorUsers,
  createSpecialSubscriptionApproval,
  reviewSpecialSubscriptionApproval,
  createOrderFromSpecialApproval,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 特殊申购（降档）后台审批（2026-11-13 · 会议 §3）
//
// 这是「前端不做」的那一半：客户在 APP 里永远走 100 万起投，例外只在这里留痕并代下单。
// 三步不可跳过：登记董事签字 → 合规复核 → 按批准额度生成申购单（一张批准只能用一次）。
// 这样做的原因：特殊申购一旦能让前端自选金额，「首笔 100 万」就名存实亡，也没有人能说清谁批的。

const STATUS_META = {
  [SPECIAL_SUB_STATUS.PENDING]: { label: '待复核', cls: 'admin-status-pending' },
  [SPECIAL_SUB_STATUS.APPROVED]: { label: '已批准', cls: 'admin-status-approved' },
  [SPECIAL_SUB_STATUS.REJECTED]: { label: '已驳回', cls: 'admin-status-rejected' },
  [SPECIAL_SUB_STATUS.USED]: { label: '已生成申购单', cls: 'admin-status-closed' },
};

const emptyForm = () => ({
  userId: '',
  fundId: '',
  approvedAmount: '',
  currency: 'HKD',
  directorName: '',
  approvalRef: '',
  evidenceName: '',
  note: '',
});

export default function AdminSpecialSubs({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(null);
  const [reviewer, setReviewer] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const investors = useMemo(() => getInvestorUsers(), [tick]);
  const isNew = detailId === 'new';
  const selected = detailId && !isNew ? specialSubscriptionApprovals.find(r => r.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
  const closeDrawer = () => navigate && navigate('#admin/special-subs');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  useEffect(() => {
    setForm(isNew ? emptyForm() : null);
    setReviewer('');
    setReason('');
    setRejectOpen(false);
    setError('');
    setDoneMsg('');
  }, [detailId]);

  const refresh = () => setTick(t => t + 1);

  const handleCreate = () => {
    const res = createSpecialSubscriptionApproval({
      ...form,
      approvedAmount: Number(form.approvedAmount),
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    refresh();
    navigate(`#admin/special-subs/${res.approval.id}`);
  };

  const handleReview = (decision) => {
    if (!selected) return;
    const res = reviewSpecialSubscriptionApproval(selected.id, { decision, reviewer, reason }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setDoneMsg(decision === 'approve' ? '已批准，可按批准额度生成申购单。' : '已驳回。');
    setRejectOpen(false);
    refresh();
  };

  const handleOrder = () => {
    if (!selected) return;
    const res = createOrderFromSpecialApproval(selected.id, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setDoneMsg(`已生成申购单 ${res.order.id}，请到「基金交易」确认成交。`);
    refresh();
  };

  const pendingCount = specialSubscriptionApprovals.filter(r => r.status === SPECIAL_SUB_STATUS.PENDING).length;

  return (
    <div className="admin-page admin-page--special-subs">
      <div className="admin-page-header">
        <h1>特殊申购</h1>
        <span className="admin-header-summary">
          {specialSubscriptionApprovals.length} 份批准 · 待复核 {pendingCount} ·
          客户前端不开放降档，例外只在此留痕并代下单
        </span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/special-subs/new')}>
          <Plus size={16} /> 登记特殊申购批准
        </button>
      </div>

      <div className="admin-table admin-table--special-subs">
        <div className="admin-table-header">
          <span className="col-name">客户 / 基金</span>
          <span className="col-amount">批准金额</span>
          <span>董事 / 文件</span>
          <span>状态</span>
          <span>复核</span>
          <span className="col-actions">申购单</span>
        </div>
        {specialSubscriptionApprovals.map(r => {
          const meta = STATUS_META[r.status] || STATUS_META[SPECIAL_SUB_STATUS.PENDING];
          return (
            <div
              key={r.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/special-subs/${r.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/special-subs/${r.id}`); } }}
            >
              <span className="col-name">
                <strong>{r.userName}</strong>
                <span className="mandate-subline">{r.fundName}</span>
              </span>
              <span className="col-amount">{r.currency} {formatExactAmount(r.approvedAmount)}</span>
              <span>
                {r.directorName}
                <span className="mandate-subline">{r.approvalRef}</span>
              </span>
              <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
              <span>{r.reviewedBy || '—'}</span>
              <span className="col-actions">{r.orderId || '—'}</span>
            </div>
          );
        })}
        {specialSubscriptionApprovals.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无特殊申购批准</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && (form || selected) && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '登记特殊申购批准' : `特殊申购 ${selected?.id}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '登记特殊申购批准' : selected.fundName}
              {!isNew && <span className={`status-badge ${STATUS_META[selected.status]?.cls} fund-product-head-badge`}>{STATUS_META[selected.status]?.label}</span>}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {doneMsg && <div className="fund-trade-done">{doneMsg}</div>}

            {isNew && form && (
              <div className="card">
                <div className="card-title">批准信息（须有董事签字文件）</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">客户</label>
                    <select className="form-input" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}>
                      <option value="">请选择客户</option>
                      {investors.map(u => <option key={u.userId} value={u.userId}>{u.name}（{u.investorNo || u.userId}）</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">基金</label>
                    <select className="form-input" value={form.fundId} onChange={e => {
                      const f = funds.find(x => x.id === e.target.value);
                      setForm(p => ({ ...p, fundId: e.target.value, currency: f?.currency?.[0] || p.currency }));
                    }}>
                      <option value="">请选择基金</option>
                      {funds.filter(f => f.status === 'open').map(f => (
                        <option key={f.id} value={f.id}>{f.name}（起投 {f.minInvestment.toLocaleString()}）</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">批准金额（须低于起投额）</label>
                    <input className="form-input" type="number" step="any" value={form.approvedAmount} onChange={e => setForm(p => ({ ...p, approvedAmount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">币种</label>
                    <select className="form-input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                      <option value="HKD">HKD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">批准董事姓名</label>
                    <input className="form-input" value={form.directorName} onChange={e => setForm(p => ({ ...p, directorName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">签字文件编号</label>
                    <input className="form-input" value={form.approvalRef} onChange={e => setForm(p => ({ ...p, approvalRef: e.target.value }))} placeholder="如 DIR-2026-1113-01" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">签字文件名称（可留空）</label>
                    <input className="form-input" value={form.evidenceName} onChange={e => setForm(p => ({ ...p, evidenceName: e.target.value }))} placeholder="如 董事批准函.pdf" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">备注</label>
                    <input className="form-input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-form-hint">批准金额必须低于该基金起投额；达到起投额不需要特殊审批。登记后需合规复核。</div>
                {error && <p className="form-error">{error}</p>}
                <div className="admin-form-actions">
                  <button className="btn btn-md btn-primary" onClick={handleCreate}><Save size={16} /> 登记批准</button>
                </div>
              </div>
            )}

            {!isNew && selected && (
              <>
                <div className="card">
                  <div className="card-title">批准信息</div>
                  <div className="kyc-review-row"><span>客户</span><strong>{selected.userName}</strong></div>
                  <div className="kyc-review-row"><span>基金</span><strong>{selected.fundName}</strong></div>
                  <div className="kyc-review-row"><span>批准金额</span><strong>{selected.currency} {formatExactAmount(selected.approvedAmount)}</strong></div>
                  <div className="kyc-review-row"><span>董事 / 文件</span><strong>{selected.directorName} · {selected.approvalRef}</strong></div>
                  {selected.evidenceName && <div className="kyc-review-row"><span>签字文件</span><strong>{selected.evidenceName}</strong></div>}
                  <div className="kyc-review-row"><span>登记 / 复核</span><strong>{selected.createdBy} / {selected.reviewedBy || '—'}</strong></div>
                  {selected.rejectReason && <div className="kyc-review-row"><span>驳回原因</span><strong>{selected.rejectReason}</strong></div>}
                  {selected.orderId && <div className="kyc-review-row"><span>申购单</span><strong>{selected.orderId}</strong></div>}
                </div>

                {selected.status === SPECIAL_SUB_STATUS.PENDING && (
                  <div className="card">
                    <div className="card-title">复核（Maker-Checker）</div>
                    <div className="form-group">
                      <label className="form-label">复核人（不得与登记人相同）</label>
                      <input className="form-input" value={reviewer} onChange={e => setReviewer(e.target.value)} />
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
                      <button className="btn btn-md btn-primary" onClick={() => handleReview('approve')}><CheckCircle size={16} /> 批准</button>
                    </div>
                  </div>
                )}

                {selected.status === SPECIAL_SUB_STATUS.APPROVED && (
                  <div className="card">
                    <div className="card-title">按批准额度生成申购单</div>
                    <p className="admin-form-hint">
                      生成一张普通待确认申购单，随后到「基金交易」确认净值与份额。一张批准只能使用一次；
                      客户前端仍然看不到降档选项。
                    </p>
                    {error && <p className="form-error">{error}</p>}
                    <div className="admin-form-actions">
                      <button className="btn btn-md btn-primary" onClick={handleOrder}><ClipboardCheck size={16} /> 生成申购单</button>
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
