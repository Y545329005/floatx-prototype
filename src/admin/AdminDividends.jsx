import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ClipboardCheck, Plus, X } from 'lucide-react';
import {
  dividendRequests, holdings, submitDividendRequest, approveDividendRequest, rejectDividendRequest,
  getDividendTotal, formatExactAmount,
} from '../mock/data';

const statusMeta = {
  pending: { label: '待发放', cls: 'admin-status-pending' },
  approved: { label: '已发放', cls: 'admin-status-approved' },
  rejected: { label: '已拒绝', cls: 'admin-status-rejected' },
};

// 有持仓的 SPV 选项（发起分红 = 按 SPV 分配，只列出持有人存在的 SPV）
function getSpvOptions() {
  const seen = new Set();
  return holdings
    .filter(h => { if (seen.has(h.projectId)) return false; seen.add(h.projectId); return true; })
    .map(h => ({ projectId: h.projectId, projectName: h.projectName, spvName: h.spvName }));
}

export default function AdminDividends({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...dividendRequests]);
  const [formOpen, setFormOpen] = useState(false);       // 发起分红抽屉（state 驱动，无 URL——低频动作）
  const [form, setForm] = useState({ projectId: '', perShare: '' });
  const [formError, setFormError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const operator = admin?.name || '运营后台';
  const spvOptions = getSpvOptions();

  // 详情 URL 化：selected 由 URL param2 驱动（#admin/dividends/{id}）
  const selected = detailId || null;
  const refresh = () => setItems([...dividendRequests]);
  const sel = selected ? items.find(r => r.id === selected) : null;
  const pendingCount = items.filter(r => r.status === 'pending').length;
  const goList = () => { if (navigate) navigate('#admin/dividends'); };
  const drawerOpen = !!selected || formOpen;

  // 统一抽屉行为：滚动锁定 + Esc 关闭
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') { setFormOpen(false); if (selected) goList(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, selected]);

  const closeDrawer = () => { setFormOpen(false); setRejectOpen(false); setRejectReason(''); goList(); };

  const selectedSpv = spvOptions.find(s => s.projectId === form.projectId) || null;
  const formTotal = selectedSpv ? getDividendTotal({ projectId: form.projectId, perShare: Number(form.perShare) || 0 }) : 0;

  const handleSubmit = () => {
    if (!form.projectId || !Number(form.perShare) || Number(form.perShare) <= 0) {
      setFormError('请选择 SPV 并填写每份分红金额');
      return;
    }
    submitDividendRequest({
      projectId: form.projectId,
      spvName: selectedSpv.spvName,
      perShare: Number(form.perShare),
    }, operator);
    setFormOpen(false);
    setForm({ projectId: '', perShare: '' });
    setFormError('');
    refresh();
  };

  const handleApprove = (id) => {
    approveDividendRequest(id, operator);
    refresh();
    closeDrawer();
  };

  const handleReject = () => {
    if (!selected || !rejectReason.trim()) return;
    rejectDividendRequest(selected, rejectReason.trim(), operator);
    setRejectOpen(false);
    setRejectReason('');
    refresh();
    closeDrawer();
  };

  // 发放对象（详情抽屉）：该 SPV 的全部持仓人（mock 单用户；接后端按真实持仓逐投资人入账）
  const holders = sel ? holdings.filter(h => h.projectId === sel.projectId) : [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>投后分红</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">待发放 {pendingCount} 单</span>
          <button className="btn btn-md btn-primary" onClick={() => { setFormOpen(true); setFormError(''); }}>
            <Plus size={16} /> 发起分红
          </button>
        </div>
      </div>

      {/* 全宽待办列表（行点击 → 弹抽屉详情） */}
      <div className="admin-table admin-table--dividends">
        <div className="admin-table-header">
          <span className="col-id">单号</span>
          <span className="col-name">SPV</span>
          <span className="col-amount">分红总额</span>
          <span className="col-per">每份金额</span>
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
              onClick={() => { if (navigate) navigate(`#admin/dividends/${r.id}`); setRejectOpen(false); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (navigate) navigate(`#admin/dividends/${r.id}`); setRejectOpen(false); } }}
            >
              <span className="col-id">{r.orderNo}</span>
              <span className="col-name">
                <strong>{r.spvName}</strong>
                <span className="text-muted text-sm">{r.projectName}</span>
              </span>
              <span className="col-amount">{r.currency} {formatExactAmount(getDividendTotal(r))}</span>
              <span className="col-per">{r.currency} {formatExactAmount(r.perShare)}</span>
              <span className="col-date">{r.createdAt}</span>
              <span className="col-status">
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
              </span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title={r.status === 'pending' ? '审核分红发放' : '查看分红'}
                  onClick={(e) => { e.stopPropagation(); if (navigate) navigate(`#admin/dividends/${r.id}`); }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无分红记录</span></div>
        )}
      </div>

      {/* 发起分红抽屉（form 模式，state 驱动） */}
      {formOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {formOpen && (
        <div className="admin-drawer" role="dialog" aria-label="发起分红">
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">发起分红</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="form-group">
              <label className="form-label">SPV（有持仓）</label>
              <select
                className="form-input"
                value={form.projectId}
                onChange={e => { setForm(f => ({ ...f, projectId: e.target.value })); setFormError(''); }}
              >
                <option value="">选择 SPV</option>
                {spvOptions.map(s => (
                  <option key={s.projectId} value={s.projectId}>{s.projectName} · {s.spvName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">每份分红金额（HKD）</label>
              <input
                type="number"
                className="form-input"
                placeholder="按份额分配，如 1000"
                value={form.perShare}
                onChange={e => { setForm(f => ({ ...f, perShare: e.target.value })); setFormError(''); }}
              />
            </div>
            {selectedSpv && Number(form.perShare) > 0 && (
              <p className="form-success">分红总额 = {selectedSpv.spvName} 全部持有份额 × {formatExactAmount(Number(form.perShare))} = <strong>HKD {formatExactAmount(formTotal)}</strong></p>
            )}
            {formError && <p className="form-error">{formError}</p>}
            <div className="admin-form-hint">
              分红按持有份额自动分配，发放审批通过后资金将按份额回流持有人资金账户。
            </div>
          </div>
          <div className="admin-drawer-actions">
            <button className="btn btn-md btn-secondary" onClick={closeDrawer}>取消</button>
            <button className="btn btn-md btn-primary" onClick={handleSubmit}><Plus size={16} /> 提交分红</button>
          </div>
        </div>
      )}

      {/* 详情抽屉：资金/单据/发放对象/状态 四卡 + 确认发放/拒绝 */}
      {selected && sel && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {selected && sel && (
        <div className="admin-drawer" role="dialog" aria-label={`分红 #${sel.id} · ${sel.spvName}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">分红 #{sel.id} · {sel.spvName}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">资金</div>
              <div className="kyc-review-row"><span>分红总额</span><strong className="admin-fund-amount">{formatExactAmount(getDividendTotal(sel))}</strong></div>
              <div className="kyc-review-row"><span>每份金额</span><strong>{sel.currency} {formatExactAmount(sel.perShare)}</strong></div>
              <div className="kyc-review-row"><span>币种</span><strong>{sel.currency}</strong></div>
            </div>
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">单据</div>
              <div className="kyc-review-row"><span>分红单号</span><strong className="date-iso">{sel.orderNo}</strong></div>
              {sel.bankRef && <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{sel.bankRef}</strong></div>}
            </div>
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">发放对象（按份额）</div>
              {holders.length === 0 && <div className="kyc-review-row"><span>持有人</span><strong>—</strong></div>}
              {holders.map(h => (
                <div key={h.id} className="kyc-review-row">
                  <span>{h.projectName} · {h.shares} 份</span>
                  <strong>{sel.currency} {formatExactAmount(h.shares * sel.perShare)}</strong>
                </div>
              ))}
            </div>
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">状态</div>
              <div className="kyc-review-row"><span>发起时间</span><strong>{sel.createdAt}</strong></div>
              <div className="kyc-review-row"><span>状态</span>
                <span className={`status-badge ${statusMeta[sel.status].cls}`}>{statusMeta[sel.status].label}</span>
              </div>
              {sel.status === 'rejected' && <div className="kyc-review-row"><span>拒绝原因</span><strong>{sel.rejectReason}</strong></div>}
              {sel.status === 'approved' && <div className="kyc-review-row"><span>处理时间</span><strong>{sel.handledAt} · {sel.handledBy}</strong></div>}
            </div>
            {sel.status === 'pending' && rejectOpen && (
              <div className="admin-reject-form">
                <div className="form-group">
                  <label className="form-label">拒绝原因</label>
                  <textarea className="form-input" rows={2} placeholder="例如：本轮盈利未达分配标准 / 数据待核" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          {sel.status === 'pending' && (
            <div className="admin-drawer-actions">
              {rejectOpen ? (
                <>
                  <button className="btn btn-md btn-secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }}>取消</button>
                  <button className="btn btn-md btn-outline" onClick={handleReject}><XCircle size={16} /> 确认拒绝</button>
                </>
              ) : (
                <button className="btn btn-md btn-outline" onClick={() => setRejectOpen(true)}><XCircle size={16} /> 拒绝</button>
              )}
              <button className="btn btn-md btn-primary" onClick={() => handleApprove(sel.id)}>
                <CheckCircle size={16} /> 确认发放
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
