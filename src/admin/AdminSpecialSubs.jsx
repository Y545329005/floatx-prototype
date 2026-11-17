import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Save, CheckCircle, XCircle, ClipboardCheck, Eye, FilePlus } from 'lucide-react';
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
//
// IA 收敛（2026-11-17 方案 A）：异常通道与常规交易同域——本组件降级为「基金交易」第 3 个
// 页签的面板（#admin/fund-trades/special/{id}），不再占一级菜单。深链与抽屉语义不变。

const STATUS_META = {
  [SPECIAL_SUB_STATUS.PENDING]: { label: '待复核', cls: 'admin-status-pending' },
  [SPECIAL_SUB_STATUS.APPROVED]: { label: '已批准', cls: 'admin-status-approved' },
  [SPECIAL_SUB_STATUS.REJECTED]: { label: '已驳回', cls: 'admin-status-rejected' },
  [SPECIAL_SUB_STATUS.USED]: { label: '已生成申购单', cls: 'admin-status-closed' },
};

// 状态次行 = 徽章之外的一个关联事实（2026-11-17 拍板③）：登记人 / 复核人 / 驳回原因 / 单号，
// 不重复徽章文字。单号只在这里出现一处（原「申购单」列已并入）。
const statusFact = (r) => {
  switch (r.status) {
    case SPECIAL_SUB_STATUS.PENDING: return `登记 ${r.createdBy}`;
    case SPECIAL_SUB_STATUS.APPROVED: return `复核 ${r.reviewedBy || '—'}`;
    case SPECIAL_SUB_STATUS.REJECTED: return r.rejectReason || '未说明原因';
    case SPECIAL_SUB_STATUS.USED: return `申购单 ${r.orderId || '—'}`;
    default: return '';
  }
};

// 行内操作按钮（对齐 KYC 列表惯例：btn-icon + 动词 tooltip）。点击落抽屉，动作卡在抽屉内。
const SUB_ACTION = {
  [SPECIAL_SUB_STATUS.PENDING]: { title: '复核', Icon: ClipboardCheck },
  [SPECIAL_SUB_STATUS.APPROVED]: { title: '生成申购单', Icon: FilePlus },
};

// 三步流水线（2026-11-17 拍板④）：登记 → 合规复核 → 生成申购单。三步不可跳过（数据层保证），进度在此可见。
function SpecialSteps({ rec }) {
  const rejected = rec.status === SPECIAL_SUB_STATUS.REJECTED;
  const used = rec.status === SPECIAL_SUB_STATUS.USED;
  const nodeState = used
    ? ['done', 'done', 'done']
    : rejected
      ? ['done', 'error', 'todo']
      : rec.status === SPECIAL_SUB_STATUS.APPROVED
        ? ['done', 'done', 'current']
        : ['done', 'current', 'todo'];
  const nodes = [
    { label: '登记', meta: rec.createdBy ? `${rec.createdBy} · ${(rec.createdAt || '').slice(5, 10)}` : '' },
    { label: '合规复核', meta: rec.reviewedBy ? `${rec.reviewedBy} · ${(rec.reviewedAt || '').slice(5, 10)}` : (rejected ? '已驳回' : '待复核') },
    { label: '生成申购单', meta: used ? `申购单 ${rec.orderId || '—'}` : '一批一单' },
  ];
  return (
    <div className="special-steps" aria-label="审批进度">
      {nodes.map((n, i) => (
        <div key={n.label} style={{ display: 'contents' }}>
          <div className={`special-step special-step--${nodeState[i]}`}>
            <span className="special-step-dot" />
            <span>
              <span className="special-step-label">{n.label}</span>
              <span className="special-step-meta">{n.meta}</span>
            </span>
          </div>
          {i < nodes.length - 1 && <span className={`special-step-line${nodeState[i] === 'done' ? ' special-step-line--done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

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
  // 实时对照用：当前表单选中的基金（拍板⑥）
  const selFund = form ? funds.find(f => f.id === form.fundId) : null;
  const isNew = detailId === 'new';
  const selected = detailId && !isNew ? specialSubscriptionApprovals.find(r => r.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
  const closeDrawer = () => navigate && navigate('#admin/fund-trades/special');
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
    navigate(`#admin/fund-trades/special/${res.approval.id}`);
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
    setDoneMsg(`已生成申购单 ${res.order.id}，请到「申购」签确认成交。`);
    refresh();
  };

  return (
    <div className="mandate-panel mandate-panel--special">
      {/* 顶行（2026-11-17 拍板②）：删「N 份批准 · 待复核 M」统计（与页签角标同数字重复），定位声明左置 */}
      <div className="mandate-panel-bar special-bar">
        <span className="admin-header-summary">
          客户前端不开放降档，例外只在此留痕并代下单
        </span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/fund-trades/special/new')}>
          <Plus size={16} /> 登记批准
        </button>
      </div>

      <div className="admin-table admin-table--special-subs">
        <div className="admin-table-header">
          <span className="col-name">客户 / 基金</span>
          <span className="col-amount">批准金额</span>
          <span>董事 / 文件</span>
          <span>状态</span>
          <span className="col-actions">操作</span>
        </div>
        {specialSubscriptionApprovals.map(r => {
          const meta = STATUS_META[r.status] || STATUS_META[SPECIAL_SUB_STATUS.PENDING];
          const act = SUB_ACTION[r.status] || { title: '查看详情', Icon: Eye };
          return (
            <div
              key={r.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/fund-trades/special/${r.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/fund-trades/special/${r.id}`); } }}
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
              <span className="special-status-cell">
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
                <span className="mandate-subline">{statusFact(r)}</span>
              </span>
              <span className="col-actions">
                <button className="btn-icon" title={act.title} aria-label={act.title} onClick={e => { e.stopPropagation(); navigate(`#admin/fund-trades/special/${r.id}`); }}>
                  <act.Icon size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {specialSubscriptionApprovals.length === 0 && (
          <div className="special-empty">
            <p>
              低于起投额的例外申购不开放给客户前端。须先取得董事签字批准，在此登记并经合规复核（复核人不得与登记人相同）后，由平台按批准额度代客下单。
            </p>
            <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/fund-trades/special/new')}>
              <Plus size={16} /> 登记批准
            </button>
          </div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && (form || selected) && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '登记批准' : `特殊申购 ${selected?.id}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '登记批准' : selected.fundName}
              {!isNew && <span className={`status-badge ${STATUS_META[selected.status]?.cls} fund-product-head-badge`}>{STATUS_META[selected.status]?.label}</span>}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {doneMsg && <div className="fund-trade-done">{doneMsg}</div>}

            {!isNew && selected && <SpecialSteps rec={selected} />}

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
                    <label className="form-label">批准金额</label>
                    <input className="form-input" type="number" step="any" value={form.approvedAmount} onChange={e => setForm(p => ({ ...p, approvedAmount: e.target.value }))} />
                    {/* 实时对照（2026-11-17 拍板⑥）：选基金即显示起投额；达到起投额当场提示，不等提交报错 */}
                    {selFund && form.approvedAmount !== '' && Number(form.approvedAmount) >= Number(selFund.minInvestment) && (
                      <div className="special-amt-hint is-over">
                        批准金额已达到起投额（{selFund.currency?.[0]} {selFund.minInvestment.toLocaleString()}），走常规申购即可，无需特殊审批
                      </div>
                    )}
                    {selFund && !(form.approvedAmount !== '' && Number(form.approvedAmount) >= Number(selFund.minInvestment)) && (
                      <div className="special-amt-hint">
                        该基金起投额 {selFund.currency?.[0]} {selFund.minInvestment.toLocaleString()} · 批准金额须低于此值
                      </div>
                    )}
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
                <div className="admin-form-hint">登记后需合规复核（Maker-Checker）：复核人不得与登记人相同。</div>
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
                  {selected.note && <div className="kyc-review-row"><span>备注</span><strong>{selected.note}</strong></div>}
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
