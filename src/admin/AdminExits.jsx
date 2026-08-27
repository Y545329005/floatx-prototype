import { useState, useEffect } from 'react';
import { CheckCircle, TrendingDown, ClipboardCheck, Eye, X, Plus } from 'lucide-react';
import { exitEvents, holdings, spvs, createExitEvent, completeExitEvent, EXIT_TYPE_META, calcExitSplit, formatExactAmount } from '../mock/data';

const statusMeta = {
  announced: { label: '待投资人确认', cls: 'admin-status-pending' },
  paying: { label: '打款中', cls: 'admin-status-pending' },
  completed: { label: '已到账', cls: 'admin-status-approved' },
};

const EMPTY_FORM = { projectId: '', exitType: 'trade_sale', pricePerShare: '' };

export default function AdminExits({ navigate, detailId }) {
  const [items, setItems] = useState([...exitEvents]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');

  // 详情 URL 化（D1）：selected 由 URL param2 驱动；抽屉打开态 = selected 存在
  const selected = detailId || null;
  const refresh = () => setItems([...exitEvents]);
  const sel = selected ? items.find(r => r.id === selected) : null;
  const activeCount = items.filter(r => r.status === 'announced' || r.status === 'paying').length;
  const goList = () => { if (navigate) navigate('#admin/exits'); };
  const drawerOpen = !!selected;

  // 发起表单候选：有持仓且无进行中分配事件的项目
  const activeProjectIds = new Set(items.filter(ev => ev.status !== 'completed').map(ev => ev.projectId));
  const candidateProjects = [];
  const seen = new Set();
  holdings.forEach(h => {
    if (!activeProjectIds.has(h.projectId) && !seen.has(h.projectId)) {
      seen.add(h.projectId);
      candidateProjects.push({ id: h.projectId, name: h.projectName, shares: h.shares });
    }
  });

  // 实时预览（B2）：每份对价 × 份额 → 毛对价 / Carry / 净回款
  const preview = (() => {
    const cand = candidateProjects.find(p => p.id === form.projectId);
    const price = Number(form.pricePerShare);
    if (!cand || !Number.isFinite(price) || price <= 0) return null;
    const spv = spvs.find(s => s.projectId === cand.id && s.status !== 'liquidated');
    const carryRate = (spv && spv.carryRate) || '20%';
    return { ...calcExitSplit(price, cand.shares, carryRate), carryRate, shares: cand.shares };
  })();

  // 统一抽屉行为：滚动锁定 + Esc 关闭
  useEffect(() => {
    if (!drawerOpen && !formOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') { closeDrawer(); closeForm(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, formOpen]);

  const closeDrawer = () => goList();
  const closeForm = () => { setFormOpen(false); setForm({ ...EMPTY_FORM }); setFormError(''); };

  const handleCreate = () => {
    const res = createExitEvent({ projectId: form.projectId, exitType: form.exitType, pricePerShare: form.pricePerShare });
    if (!res.ok) { setFormError(res.error || '发起失败'); return; }
    refresh();
    closeForm();
  };

  const handleComplete = (id) => {
    completeExitEvent(id);
    refresh();
    closeDrawer();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>退出分配管理</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">进行中 {activeCount} 个</span>
          <button className="btn btn-md btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> 发起退出分配
          </button>
        </div>
      </div>

      {/* 全宽列表（行点击 → 弹抽屉详情） */}
      <div className="admin-table admin-table--exits">
        <div className="admin-table-header">
          <span className="col-id">分配单号</span>
          <span className="col-name">项目 / SPV</span>
          <span className="col-amount">净回款</span>
          <span className="col-date">发起时间</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
        {items.map(r => {
          const meta = statusMeta[r.status];
          return (
            <div
              key={r.id}
              className="admin-table-row"
              onClick={() => navigate(`#admin/exits/${r.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/exits/${r.id}`); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name">
                <strong>{r.projectName}</strong>
                <span className="text-muted text-sm">{EXIT_TYPE_META[r.exitType]?.label} · {r.spvName}</span>
              </span>
              <span className="col-amount">{r.currency} {formatExactAmount(r.netAmount)}</span>
              <span className="col-date">{r.createdAt}</span>
              <span className="col-status">
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
              </span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title={r.status === 'paying' ? '确认到账' : '查看分配明细'}
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/exits/${r.id}`); }}
                >
                  {r.status === 'paying' ? <ClipboardCheck size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </div>
          );
        })}
        {items.length === 0 && <div className="admin-table-row"><span className="admin-table-empty"><TrendingDown size={14} /> 暂无退出分配</span></div>}
      </div>

      {/* 发起退出分配抽屉 */}
      {formOpen && (
        <>
          <div className="admin-drawer-mask" onClick={closeForm} />
          <div className="admin-drawer" role="dialog" aria-label="发起退出分配">
            <div className="admin-drawer-head">
              <h3 className="admin-drawer-title">发起退出分配</h3>
              <button className="btn-icon" title="关闭" onClick={closeForm}><X size={18} /></button>
            </div>
            <div className="admin-drawer-body">
              <div className="card kyc-review-block">
                <h4 className="card-title">退出方案</h4>
                <div className="form-group">
                  <label>退出项目 *</label>
                  <select
                    className="form-input"
                    value={form.projectId}
                    onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  >
                    <option value="">请选择有持仓的项目</option>
                    {candidateProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}（{p.shares} 份）</option>
                    ))}
                  </select>
                  {candidateProjects.length === 0 && (
                    <p className="text-muted text-sm" style={{ marginTop: 'var(--space-1)' }}>暂无可发起项目：所有持仓项目均已有进行中的分配</p>
                  )}
                </div>
                <div className="form-group">
                  <label>退出方式 *</label>
                  <select
                    className="form-input"
                    value={form.exitType}
                    onChange={e => setForm(f => ({ ...f, exitType: e.target.value }))}
                  >
                    {Object.entries(EXIT_TYPE_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  {form.exitType === 'liquidation' && (
                    <p className="text-muted text-sm" style={{ marginTop: 'var(--space-1)' }}>清算分配完成后，SPV 档案将自动流转为「已清算」</p>
                  )}
                </div>
                <div className="form-group">
                  <label>每份退出对价（HKD）*</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="如 9600"
                    value={form.pricePerShare}
                    onChange={e => setForm(f => ({ ...f, pricePerShare: e.target.value }))}
                  />
                  <p className="text-muted text-sm" style={{ marginTop: 'var(--space-1)' }}>每份成本 HK$ 8,000，超出部分计为收益并按 SPV Carry 费率计提</p>
                </div>
              </div>
              {preview && (
                <div className="card kyc-review-block">
                  <h4 className="card-title">回款预览（实时）</h4>
                  <div className="kyc-review-row"><span>毛对价</span><strong>HK$ {formatExactAmount(preview.grossAmount)}</strong></div>
                  <div className="kyc-review-row"><span>其中收益</span><strong>HK$ {formatExactAmount(preview.gainAmount)}</strong></div>
                  <div className="kyc-review-row"><span>Carry 计提（{preview.carryRate}）</span><strong>-HK$ {formatExactAmount(preview.carryAmount)}</strong></div>
                  <div className="kyc-review-row"><span>净回款合计</span><strong className="admin-exit-amount">HK$ {formatExactAmount(preview.netAmount)}</strong></div>
                </div>
              )}
              {formError && <p className="admin-form-error">{formError}</p>}
            </div>
            <div className="admin-drawer-actions">
              <button className="btn btn-md btn-secondary" onClick={closeForm}>取消</button>
              <button className="btn btn-md btn-primary" disabled={!form.projectId || !form.pricePerShare} onClick={handleCreate}>
                <TrendingDown size={16} /> 公告并通知投资人
              </button>
            </div>
          </div>
        </>
      )}

      {/* 统一右侧抽屉：分配详情 + 到账操作 */}
      {drawerOpen && sel && (
        <>
          <div className="admin-drawer-mask" onClick={closeDrawer} />
          <div className="admin-drawer" role="dialog" aria-label={`退出分配 #${sel.id}`}>
            <div className="admin-drawer-head">
              <h3 className="admin-drawer-title">退出分配 #{sel.id} · {sel.projectName}</h3>
              <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
            </div>
            <div className="admin-drawer-body">
              <div className="card kyc-review-block">
                <h4 className="card-title">退出分配</h4>
                <div className="kyc-review-row"><span>分配单号</span><strong className="date-iso">{sel.orderNo}</strong></div>
                <div className="kyc-review-row"><span>退出方式</span><strong>{EXIT_TYPE_META[sel.exitType]?.label}</strong></div>
                <div className="kyc-review-row"><span>持有标的</span><strong>{sel.spvName}</strong></div>
                <div className="kyc-review-row"><span>退出份额</span><strong>{sel.totalShares} 份 × HK$ {formatExactAmount(sel.pricePerShare)}</strong></div>
                <div className="kyc-review-row"><span>毛对价</span><strong>HK$ {formatExactAmount(sel.grossAmount)}</strong></div>
                <div className="kyc-review-row"><span>Carry 计提（{sel.carryRate}）</span><strong>-HK$ {formatExactAmount(sel.carryAmount)}</strong></div>
                <div className="kyc-review-row"><span>净回款合计</span><strong className="admin-exit-amount">{sel.currency} {formatExactAmount(sel.netAmount)}</strong></div>
                <div className="kyc-review-row"><span>发起时间</span><strong>{sel.createdAt}</strong></div>
                {sel.confirmedAt && <div className="kyc-review-row"><span>投资人确认</span><strong>{sel.confirmedAt}</strong></div>}
                <div className="kyc-review-row"><span>状态</span><span className={`status-badge ${statusMeta[sel.status].cls}`}>{statusMeta[sel.status].label}</span></div>
                {sel.status === 'completed' && <div className="kyc-review-row"><span>到账时间</span><strong>{sel.completedAt} · {sel.handledBy}</strong></div>}
              </div>
              {sel.status === 'announced' && (
                <div className="card kyc-review-block">
                  <p className="text-muted text-sm">已公告并通知投资人，等待其在 APP 端确认收款明细。</p>
                </div>
              )}
            </div>
            {sel.status === 'paying' && (
              <div className="admin-drawer-actions">
                <button className="btn btn-md btn-primary" onClick={() => handleComplete(sel.id)}>
                  <CheckCircle size={16} /> 确认到账并完成分配
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
