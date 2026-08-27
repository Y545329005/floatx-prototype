import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, ShieldAlert, DollarSign, FileText } from 'lucide-react';
import {
  largeTransactionReviews,
  subscriptions,
  updateLargeTransactionReview,
  COMPLIANCE_STATUS,
  REVIEW_LEVEL,
  formatExactAmount,
  formatListDateTime,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 审查层级元数据（PRD 04 §3.8 大额交易审查制度：300万/500万/800万三级）
const LEVEL_META = {
  [REVIEW_LEVEL.LEVEL_1]: { label: '一级审查', threshold: 'HK$300万 - 500万', className: 'aml-flag-primary', role: 'compliance 专员' },
  [REVIEW_LEVEL.LEVEL_2]: { label: '二级审查', threshold: 'HK$500万 - 800万', className: 'aml-flag-warning', role: 'compliance 主管' },
  [REVIEW_LEVEL.LEVEL_3]: { label: '三级审查', threshold: '≥ HK$800万', className: 'aml-flag-danger', role: 'super（MLRO）终审' },
};

// 2026-08-27 审计修复：此前误用 status-pending/approved/rejected（无定义，白字透明底不可见）→ 对齐全后台 admin-status-* 语义色文字
const STATUS_META = {
  [COMPLIANCE_STATUS.PENDING]: { label: '待审查', className: 'admin-status-pending' },
  [COMPLIANCE_STATUS.APPROVED]: { label: '已通过', className: 'admin-status-approved' },
  [COMPLIANCE_STATUS.REJECTED]: { label: '已拒绝', className: 'admin-status-rejected' },
};

const LEVEL_TABS = [
  { key: 'all', label: '全部层级' },
  { key: REVIEW_LEVEL.LEVEL_1, label: '一级 (300万-500万)' },
  { key: REVIEW_LEVEL.LEVEL_2, label: '二级 (500万-800万)' },
  { key: REVIEW_LEVEL.LEVEL_3, label: '三级 (≥800万)' },
];

const STATUS_TABS = [
  { key: COMPLIANCE_STATUS.PENDING, label: '待审查' },
  { key: COMPLIANCE_STATUS.APPROVED, label: '已通过' },
  { key: COMPLIANCE_STATUS.REJECTED, label: '已拒绝' },
];

const PAGE_SIZE = 8;

/**
 * 大额交易审查工作台（T4 · PRD 04 §3.8 大额交易审查制度）
 * 三级阈值队列 + 审批操作 + amlFlags 拦截状态展示
 * 职责：compliance 专员（一级）→ compliance 主管（二级）→ super/MLRO（三级）
 */
export default function AdminLargeTx({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...largeTransactionReviews]);
  const [levelTab, setLevelTab] = useState('all');
  const [statusTab, setStatusTab] = useState(COMPLIANCE_STATUS.PENDING);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 审批表单：null | { action: 'approve' | 'reject' }
  const [approval, setApproval] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const noteFormRef = useRef(null);

  const operator = admin?.name || '合规专员';
  const selected = detailId || null;
  const refresh = () => setItems([...largeTransactionReviews]);
  const goList = () => { if (navigate) navigate('#admin/large-tx'); };
  const sel = selected ? items.find(r => r.id === selected) : null;
  const drawerOpen = !!selected;

  // 关联申购信息（投资人姓名 / 项目名）
  const getSubInfo = (subscriptionId) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    return sub ? { investorName: sub.investorName, projectName: sub.projectName, status: sub.status } : null;
  };

  // 抽屉焦点管理 + 滚动锁定（对齐其他 admin 页面）
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [drawerOpen]);

  const exitLayer = useCallback(() => {
    if (approval) setApproval(null);
    else goList();
  }, [approval, goList]);
  const drawerRef = useDrawerFocus(drawerOpen, exitLayer);

  // 筛选
  const kw = keyword.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter(r => {
      if (levelTab !== 'all' && r.reviewLevel !== levelTab) return false;
      if (r.status !== statusTab) return false;
      if (kw) {
        const sub = getSubInfo(r.subscriptionId);
        const hay = `${r.id} ${sub?.investorName || ''} ${sub?.projectName || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, levelTab, statusTab, kw]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 各层级计数（菜单徽章）
  const levelCounts = useMemo(() => ({
    [REVIEW_LEVEL.LEVEL_1]: items.filter(r => r.reviewLevel === REVIEW_LEVEL.LEVEL_1 && r.status === COMPLIANCE_STATUS.PENDING).length,
    [REVIEW_LEVEL.LEVEL_2]: items.filter(r => r.reviewLevel === REVIEW_LEVEL.LEVEL_2 && r.status === COMPLIANCE_STATUS.PENDING).length,
    [REVIEW_LEVEL.LEVEL_3]: items.filter(r => r.reviewLevel === REVIEW_LEVEL.LEVEL_3 && r.status === COMPLIANCE_STATUS.PENDING).length,
  }), [items]);

  const switchLevel = (k) => { setLevelTab(k); setPage(1); };
  const switchStatus = (k) => { setStatusTab(k); setPage(1); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  const openApproval = (action) => {
    setApproval(action);
    setNote('');
    setNoteError(false);
  };

  const submitApproval = () => {
    if (!sel) return;
    if (!note.trim()) {
      setNoteError(true);
      noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const newStatus = approval === 'approve' ? COMPLIANCE_STATUS.APPROVED : COMPLIANCE_STATUS.REJECTED;
    updateLargeTransactionReview(sel.id, newStatus, operator, note.trim());
    refresh();
    setApproval(null);
    setNote('');
    // 审批通过后同步 subscription 的 amlFlags 状态（标记已解决）
    const sub = subscriptions.find(s => s.id === sel.subscriptionId);
    if (sub && Array.isArray(sub.amlFlags)) {
      sub.amlFlags.forEach(flag => {
        if (flag.reviewId === sel.id && flag.status === COMPLIANCE_STATUS.PENDING) {
          flag.status = newStatus;
          if (newStatus === COMPLIANCE_STATUS.APPROVED) {
            flag.resolvedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
            flag.resolvedBy = operator;
            flag.resolutionNote = note.trim();
          }
        }
      });
    }
    goList();
  };

  const closeApproval = () => setApproval(null);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>大额交易审查</h1>
        <span className="admin-header-summary">三级阈值队列（300万 / 500万 / 800万港币）· 配额分配/扣款前需解除 amlFlags</span>
      </div>

      {/* 层级 Tab */}
      <div className="admin-filter-row">
        {LEVEL_TABS.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${levelTab === tab.key ? 'active' : ''}`}
            onClick={() => switchLevel(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && levelCounts[tab.key] > 0 && (
              <span className="admin-tab-badge">{levelCounts[tab.key]}</span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div className="admin-search-wrap">
            <span className="admin-search-icon"><Search size={14} /></span>
            <input
              className="admin-search-input"
              placeholder="搜索单号 / 投资人 / 项目"
              aria-label="搜索单号 / 投资人 / 项目"
              value={keyword}
              onChange={e => onSearchChange(e.target.value)}
            />
            {keyword && <button className="btn-icon" onClick={() => onSearchChange('')} aria-label="清除搜索"><X size={14} /></button>}
          </div>
        </div>
      </div>

      {/* 状态 Tab */}
      <div className="admin-filter-row">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${statusTab === tab.key ? 'active' : ''}`}
            onClick={() => switchStatus(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="admin-table admin-table--large-tx">
        <div className="admin-table-header">
          <span className="col-id">审查单号</span>
          <span className="col-project">投资人 / 项目</span>
          <span className="col-amount">金额</span>
          <span className="col-type">层级</span>
          <span className="col-date">提交时间</span>
          <span className="col-status">状态</span>
        </div>
        {pageRows.map(r => {
          const sub = getSubInfo(r.subscriptionId);
          const lm = LEVEL_META[r.reviewLevel] || {};
          const sm = STATUS_META[r.status] || {};
          return (
            <div key={r.id} className="admin-table-row" onClick={() => navigate(`#admin/large-tx/${r.id}`)}>
              <span className="col-id">{r.id}</span>
              <span className="col-project">
                <strong>{sub?.investorName || '未知投资人'}</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', display: 'block' }}>{sub?.projectName || '—'}</span>
              </span>
              <span className="col-amount"><strong>HK$ {formatExactAmount(r.amount)}</strong></span>
              <span className="col-type">
                <span className={`aml-flag-badge ${lm.className || 'aml-flag-default'}`}>{lm.label || r.reviewLevel}</span>
              </span>
              <span className="col-date">{formatListDateTime(r.createdAt)}</span>
              <span className="col-status">
                <span className={`status-badge ${sm.className || ''}`}>{sm.label || r.status}</span>
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的大额交易审查记录</span></div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 条</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 详情抽屉（2026-08-27 审计修复：移动端 .sheet → 后台统一 .admin-drawer + dialog 语义） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={exitLayer} />}
      {drawerOpen && sel && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`大额交易审查 ${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">大额交易审查 · {sel.id}</h3>
            <button className="btn-icon" title="关闭" onClick={exitLayer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
              {/* 审查信息 */}
              <div className="detail-section">
                <h4><ShieldAlert size={14} /> 审查信息</h4>
                {(() => { const sub = getSubInfo(sel.subscriptionId); return (
                  <>
                    <div className="detail-row"><span className="detail-label">投资人</span><span className="detail-value">{sub?.investorName || '—'}</span></div>
                    <div className="detail-row"><span className="detail-label">关联项目</span><span className="detail-value">{sub?.projectName || '—'}</span></div>
                    <div className="detail-row"><span className="detail-label">申购状态</span><span className="detail-value">{sub ? ({ submitted: '意向已登记', allocated: '已获配额', signed: '已签署', settled: '已完成' })[sub.status] || sub.status : '—'}</span></div>
                  </>
                ); })()}
                <div className="detail-row"><span className="detail-label">交易金额</span><span className="detail-value"><strong>HK$ {formatExactAmount(sel.amount)}</strong></span></div>
                <div className="detail-row">
                  <span className="detail-label">审查层级</span>
                  <span className="detail-value">
                    <span className={`aml-flag-badge ${(LEVEL_META[sel.reviewLevel] || {}).className || ''}`}>{LEVEL_META[sel.reviewLevel]?.label || sel.reviewLevel}</span>
                    <span className="aml-note" style={{ marginLeft: 8 }}>{LEVEL_META[sel.reviewLevel]?.threshold} · 责任人 {LEVEL_META[sel.reviewLevel]?.role}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">当前状态</span>
                  <span className="detail-value">
                    <span className={`status-badge ${(STATUS_META[sel.status] || {}).className || ''}`}>{STATUS_META[sel.status]?.label || sel.status}</span>
                  </span>
                </div>
                <div className="detail-row"><span className="detail-label">提交时间</span><span className="detail-value">{formatListDateTime(sel.createdAt)}</span></div>
                {sel.reviewerId && (
                  <div className="detail-row"><span className="detail-label">审查人</span><span className="detail-value">{sel.reviewerId}</span></div>
                )}
                {sel.reviewTime && (
                  <div className="detail-row"><span className="detail-label">审查时间</span><span className="detail-value">{formatListDateTime(sel.reviewTime)}</span></div>
                )}
                {sel.reviewNotes && (
                  <div className="detail-row"><span className="detail-label">审查意见</span><span className="detail-value">{sel.reviewNotes}</span></div>
                )}
              </div>

              {/* amlFlags 拦截状态 */}
              <div className="detail-section">
                <h4><DollarSign size={14} /> amlFlags 关联</h4>
                {(() => {
                  const sub = subscriptions.find(s => s.id === sel.subscriptionId);
                  const flag = sub?.amlFlags?.find(f => f.reviewId === sel.id);
                  return flag ? (
                    <>
                      <div className="detail-row"><span className="detail-label">标记类型</span><span className="detail-value">{flag.type === 'large_transaction' ? '大额交易' : flag.type}</span></div>
                      <div className="detail-row"><span className="detail-label">标记状态</span><span className="detail-value">{flag.status === COMPLIANCE_STATUS.PENDING ? '待解除（配额分配/扣款将被拦截）' : flag.status === COMPLIANCE_STATUS.APPROVED ? '已解除（可正常分配/扣款）' : '已拒绝'}</span></div>
                      {flag.resolvedAt && <div className="detail-row"><span className="detail-label">解除时间</span><span className="detail-value">{flag.resolvedAt}</span></div>}
                    </>
                  ) : (
                    <div className="detail-row"><span className="detail-label">关联标记</span><span className="detail-value">未关联 amlFlags</span></div>
                  );
                })()}
              </div>

              {/* 审批操作（仅待审查 + 有权限角色） */}
              {sel.status === COMPLIANCE_STATUS.PENDING && (
                <div className="detail-section detail-section--action">
                  <h4><FileText size={14} /> 审查操作</h4>
                  {!approval ? (
                    <div className="approval-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => openApproval('approve')}>审查通过</button>
                      <button className="btn btn-outline btn-sm" onClick={() => openApproval('reject')}>审查拒绝</button>
                    </div>
                  ) : (
                    <div className="mark-form" ref={noteFormRef}>
                      <div className="form-label">
                        {approval === 'approve' ? `审批意见（通过后将解除 amlFlags，允许配额分配/扣款）` : `拒绝原因（必填）`}
                      </div>
                      <textarea
                        className={`form-input ${noteError ? 'error' : ''}`}
                        placeholder={approval === 'approve' ? '请输入审查依据，如资金来源核实结果...' : '请输入拒绝原因...'}
                        value={note}
                        onChange={e => { setNote(e.target.value); if (noteError) setNoteError(false); }}
                        rows={3}
                      />
                      {noteError && <p className="form-error">请填写审查意见</p>}
                      <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <button className="btn btn-outline btn-sm" onClick={closeApproval}>取消</button>
                        <button
                          className={`btn btn-sm ${approval === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                          onClick={submitApproval}
                          disabled={!note.trim()}
                        >
                          {approval === 'approve' ? '确认通过' : '确认拒绝'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
