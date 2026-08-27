import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, ShieldAlert, FileText, User, Upload } from 'lucide-react';
import {
  enhancedDueDiligence,
  updateEnhancedDueDiligence,
  COMPLIANCE_STATUS,
  RISK_LEVEL,
  formatListDateTime,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// EDD 触发类型（PRD 01 §3.15.3 / 08 数据字典 §3.1.1）
const TRIGGER_LABELS = {
  pep: 'PEP 识别',
  sanctions: '制裁命中',
  high_risk: '高风险客户',
  large_transaction: '大额交易',
  anomaly: '异常检测',
  new_client_large: '新客户大额',
  pep_adjacent: 'PEP 关联方',
};

const STATUS_META = {
  [COMPLIANCE_STATUS.PENDING]: { label: '待审查', className: 'admin-status-pending' },
  [COMPLIANCE_STATUS.IN_PROGRESS]: { label: '审查中', className: 'admin-status-pending' },
  [COMPLIANCE_STATUS.APPROVED]: { label: '已通过', className: 'admin-status-approved' },
  [COMPLIANCE_STATUS.REJECTED]: { label: '已拒绝', className: 'admin-status-rejected' },
};

// 标准 EDD 审查项（所有 PEP 客户，PRD 01 §3.15.3）
const STANDARD_EDD_ITEMS = [
  { key: 'identity', label: '身份核实', desc: '护照/身份证复印件（近 6 个月内）' },
  { key: 'position', label: '职务核实', desc: '官方任命文件/工作证明（近 12 个月内）' },
  { key: 'funds', label: '资金来源证明', desc: '银行月结单/资产证明（近 3 个月内）' },
  { key: 'wealth', label: '财富来源说明', desc: '财富积累过程说明（当前有效）' },
  { key: 'purpose', label: '交易目的说明', desc: '投资目的与合理性说明' },
];

// 增强 EDD 额外审查项（高风险 PEP，需高管审批）
const ENHANCED_EDD_ITEMS = [
  { key: 'asset', label: '资产证明', desc: '投资组合报表/房产证明（近 3 个月内）' },
  { key: 'tax', label: '税务申报', desc: '税务评税通知书（近 12 个月内）' },
  { key: 'bank_ref', label: '银行推荐信', desc: '来自知名银行的推荐信（近 6 个月内）' },
];

const PAGE_SIZE = 8;

/**
 * EDD 增强尽调审核工作台（T7 · PRD 01 §3.15 PEP 识别与审查）
 * PEP/大额/高风险触发的增强尽调 + 文件收集清单 + 审查操作 + 高管审批
 */
export default function AdminEDD({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...enhancedDueDiligence]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 审查操作：null | 'approve' | 'reject'；高管审批独立弹层
  const [action, setAction] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [showSenior, setShowSenior] = useState(false);
  const [seniorNote, setSeniorNote] = useState('');
  const formRef = useRef(null);

  const operator = admin?.name || '合规专员';
  const selected = detailId || null;
  const refresh = () => setItems([...enhancedDueDiligence]);
  const goList = () => { if (navigate) navigate('#admin/edd'); };
  const sel = selected ? items.find(r => r.id === selected) : null;
  const drawerOpen = !!selected;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [drawerOpen]);

  const exitLayer = useCallback(() => {
    if (action) setAction(null);
    else if (showSenior) setShowSenior(false);
    else goList();
  }, [action, showSenior, goList]);
  const drawerRef = useDrawerFocus(drawerOpen, exitLayer);

  // 是否为增强 EDD（高风险 PEP / 大额交易触发）
  const isEnhanced = (r) => {
    return r.triggerType === 'large_transaction' || r.triggerType === 'high_risk' || r.triggerType === 'sanctions';
  };

  const kw = keyword.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter(r => {
      if (kw) {
        const hay = `${r.id} ${r.userId} ${TRIGGER_LABELS[r.triggerType] || r.triggerType}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, kw]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCount = items.filter(r => r.status === COMPLIANCE_STATUS.PENDING).length;

  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  const openAction = (key) => { setAction(key); setNote(''); setNoteError(false); };

  const submitReview = () => {
    if (!sel) return;
    if (!note.trim()) {
      setNoteError(true);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // 增强 EDD 通过需高管审批
    if (action === 'approve' && isEnhanced(sel)) {
      setShowSenior(true);
      return;
    }
    finishReview(action === 'approve' ? COMPLIANCE_STATUS.APPROVED : COMPLIANCE_STATUS.REJECTED);
  };

  const finishReview = (status) => {
    if (!sel) return;
    updateEnhancedDueDiligence(sel.id, status, operator, note.trim());
    refresh();
    setAction(null); setNote(''); setNoteError(false);
    setShowSenior(false); setSeniorNote('');
    goList();
  };

  const submitSenior = () => {
    if (!seniorNote.trim()) return;
    // 高管审批通过 → 最终通过（留痕备注含高管审批信息）
    updateEnhancedDueDiligence(sel.id, COMPLIANCE_STATUS.APPROVED, operator, `${note.trim()}｜高管审批：${seniorNote.trim()}`);
    refresh();
    setAction(null); setNote(''); setNoteError(false);
    setShowSenior(false); setSeniorNote('');
    goList();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>EDD 增强尽调</h1>
        <span className="admin-header-summary">PEP / 大额 / 高风险触发 · 标准 EDD + 增强 EDD · 高风险需高管审批</span>
        <div className="admin-page-header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span className="admin-stat-chip">待审查 {pendingCount}</span>
        </div>
      </div>

      <div className="admin-search-wrap" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="admin-search-icon"><Search size={14} /></span>
        <input className="admin-search-input" placeholder="搜索 EDD 编号 / 用户 / 触发类型" aria-label="搜索 EDD 编号 / 用户 / 触发类型" value={keyword} onChange={e => onSearchChange(e.target.value)} />
        {keyword && <button className="btn-icon" onClick={() => onSearchChange('')} aria-label="清除"><X size={14} /></button>}
      </div>

      {/* 列表 */}
      <div className="admin-table admin-table--edd">
        <div className="admin-table-header">
          <span className="col-id">EDD 编号</span>
          <span className="col-project">触发类型</span>
          <span className="col-type">尽调类型</span>
          <span className="col-date">触发时间</span>
          <span className="col-status">状态</span>
        </div>
        {pageRows.map(r => {
          const sm = STATUS_META[r.status] || {};
          return (
            <div key={r.id} className="admin-table-row" onClick={() => navigate(`#admin/edd/${r.id}`)}>
              <span className="col-id">{r.id}</span>
              <span className="col-project">
                <strong>{TRIGGER_LABELS[r.triggerType] || r.triggerType}</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', display: 'block' }}>用户 {r.userId}</span>
              </span>
              <span className="col-type">
                <span className={`aml-flag-badge ${isEnhanced(r) ? 'aml-flag-danger' : 'aml-flag-warning'}`}>
                  {isEnhanced(r) ? '增强 EDD' : '标准 EDD'}
                </span>
              </span>
              <span className="col-date">{formatListDateTime(r.createdAt)}</span>
              <span className="col-status"><span className={`status-badge ${sm.className || ''}`}>{sm.label || r.status}</span></span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无 EDD 记录</span></div>
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
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`EDD 记录 ${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">EDD 记录 · {sel.id}</h3>
            <button className="btn-icon" title="关闭" onClick={exitLayer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
              {/* 基本信息 */}
              <div className="detail-section">
                <h4><ShieldAlert size={14} /> 尽调信息</h4>
                <div className="detail-row"><span className="detail-label">触发类型</span><span className="detail-value">{TRIGGER_LABELS[sel.triggerType] || sel.triggerType}</span></div>
                <div className="detail-row"><span className="detail-label">关联用户</span><span className="detail-value">{sel.userId}</span></div>
                {sel.triggerAmount > 0 && (
                  <div className="detail-row"><span className="detail-label">触发金额</span><span className="detail-value">HK$ {Number(sel.triggerAmount).toLocaleString()}</span></div>
                )}
                <div className="detail-row">
                  <span className="detail-label">尽调类型</span>
                  <span className="detail-value">
                    <span className={`aml-flag-badge ${isEnhanced(sel) ? 'aml-flag-danger' : 'aml-flag-warning'}`}>{isEnhanced(sel) ? '增强 EDD（需高管审批）' : '标准 EDD'}</span>
                  </span>
                </div>
                <div className="detail-row"><span className="detail-label">触发时间</span><span className="detail-value">{formatListDateTime(sel.createdAt)}</span></div>
                <div className="detail-row">
                  <span className="detail-label">当前状态</span>
                  <span className="detail-value"><span className={`status-badge ${(STATUS_META[sel.status] || {}).className || ''}`}>{STATUS_META[sel.status]?.label || sel.status}</span></span>
                </div>
                {sel.reviewerId && <div className="detail-row"><span className="detail-label">审查人</span><span className="detail-value">{sel.reviewerId}</span></div>}
                {sel.reviewNotes && <div className="detail-row"><span className="detail-label">审查备注</span><span className="detail-value">{sel.reviewNotes}</span></div>}
              </div>

              {/* 文件收集清单 */}
              <div className="detail-section">
                <h4><FileText size={14} /> 文件收集清单</h4>
                <div className="form-label">{isEnhanced(sel) ? '增强 EDD 文件要求（高风险 PEP）' : '标准 EDD 文件要求'}</div>
                {[...STANDARD_EDD_ITEMS, ...(isEnhanced(sel) ? ENHANCED_EDD_ITEMS : [])].map(item => {
                  const hasFile = (sel.proofFiles || []).some(f => f.fileType === item.key);
                  return (
                    <div key={item.key} className="detail-row">
                      <span className="detail-label">
                        <span className={`status-badge ${hasFile ? 'admin-status-approved' : 'admin-status-pending'}`} style={{ marginRight: 6 }}>
                          {hasFile ? '已提供' : '待提供'}
                        </span>
                        {item.label}
                      </span>
                      <span className="detail-value" style={{ fontSize: 'var(--text-xs)' }}>{item.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* 已上传文件 */}
              {(sel.proofFiles || []).length > 0 && (
                <div className="detail-section">
                  <h4><Upload size={14} /> 已上传文件</h4>
                  {sel.proofFiles.map((f, i) => (
                    <div className="detail-row" key={i}>
                      <span className="detail-label">文件 {i + 1}</span>
                      <span className="detail-value">
                        {f.fileName}
                        <span className="status-badge" style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>{f.uploadedAt}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 审查操作（高管审批期间隐藏，返回可回到已填写的审查意见） */}
              {sel.status === COMPLIANCE_STATUS.PENDING && !showSenior && (
                <div className="detail-section detail-section--action">
                  <h4><User size={14} /> 审查操作</h4>
                  {!action ? (
                    <div className="approval-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => openAction('approve')}>
                        {isEnhanced(sel) ? '通过（需高管审批）' : '审查通过'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openAction('reject')}>审查拒绝</button>
                    </div>
                  ) : (
                    <div className="mark-form" ref={formRef}>
                      <div className="form-label">
                        {action === 'approve'
                          ? `审查意见（${isEnhanced(sel) ? '通过后需 super/MLRO 高管审批' : '通过后将解除相关标记'}）`
                          : '拒绝原因（必填）'}
                      </div>
                      <textarea
                        className={`form-input ${noteError ? 'error' : ''}`}
                        placeholder="请输入审查意见..."
                        value={note}
                        onChange={e => { setNote(e.target.value); if (noteError) setNoteError(false); }}
                        rows={3}
                      />
                      {noteError && <p className="form-error">请填写审查意见</p>}
                      <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setAction(null)}>取消</button>
                        <button className={`btn btn-sm ${action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={submitReview} disabled={!note.trim()}>
                          {action === 'approve' ? '提交审查' : '确认拒绝'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 高管审批（2026-08-27 审计修复：嵌套 sheet 弹层 → 抽屉内联审批视图，对齐 admin-confirm-view 范式；
                  焦点陷阱/ESC 分层退出由 useDrawerFocus 统一承担，不再有嵌套弹层焦点问题） */}
              {showSenior && (
                <div className="detail-section detail-section--action">
                  <h4><User size={14} /> 高管审批（super / MLRO）</h4>
                  <div className="mark-form">
                    <div className="form-label">增强尽调通过需高级管理层审批（高风险 PEP / 大额交易）</div>
                    <div className="detail-row" style={{ marginBottom: 'var(--space-2)' }}>
                      <span className="detail-label">审查意见</span>
                      <span className="detail-value">{note.trim() || '—'}</span>
                    </div>
                    <textarea
                      className="form-input"
                      placeholder="请输入高管审批意见..."
                      value={seniorNote}
                      onChange={e => setSeniorNote(e.target.value)}
                      rows={3}
                    />
                    <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowSenior(false)}>← 返回审查意见</button>
                      <button className="btn btn-primary btn-sm" onClick={submitSenior} disabled={!seniorNote.trim()}>确认审批通过</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
