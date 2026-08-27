import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  anomalyDetectionLogs,
  ANOMALY_RULES,
  updateAnomalyDetectionLog,
  createStrReport,
  RISK_LEVEL,
  COMPLIANCE_STATUS,
  formatListDateTime,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

const RISK_META = {
  [RISK_LEVEL.LOW]: { label: '低风险', className: 'admin-status-approved' },
  [RISK_LEVEL.MEDIUM]: { label: '中风险', className: 'admin-status-pending' },
  [RISK_LEVEL.HIGH]: { label: '高风险', className: 'admin-status-rejected' },
};

const STATUS_META = {
  [COMPLIANCE_STATUS.PENDING]: { label: '待处理', className: 'admin-status-pending' },
  [COMPLIANCE_STATUS.APPROVED]: { label: '已排除', className: 'admin-status-approved' },
  [COMPLIANCE_STATUS.REJECTED]: { label: '已上报', className: 'admin-status-rejected' },
};

const RISK_TABS = [
  { key: 'all', label: '全部风险' },
  { key: RISK_LEVEL.LOW, label: '低风险' },
  { key: RISK_LEVEL.MEDIUM, label: '中风险' },
  { key: RISK_LEVEL.HIGH, label: '高风险' },
];

const STATUS_TABS = [
  { key: COMPLIANCE_STATUS.PENDING, label: '待处理' },
  { key: COMPLIANCE_STATUS.APPROVED, label: '已排除' },
  { key: COMPLIANCE_STATUS.REJECTED, label: '已上报' },
];

const PAGE_SIZE = 8;

// 处理动作（PRD 04 §3.9 异常交易检测：排除/上报）
const ACTIONS = [
  { key: 'exclude', label: '排除', desc: '判定为误报/正常，记录理由后关闭', toStatus: COMPLIANCE_STATUS.APPROVED },
  { key: 'escalate', label: '上报 STR', desc: '转入 STR 流程（自动创建 STR 报告记录），进入评估 → MLRO 审批 → 提交 JFIU', toStatus: COMPLIANCE_STATUS.REJECTED },
];

/**
 * 异常检测日志工作台（T5 · PRD 04 §3.9 异常交易检测制度）
 * 7条核心规则检测结果 + 风险等级 + 处理流程（排除/上报）
 */
export default function AdminAnomaly({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...anomalyDetectionLogs]);
  const [riskTab, setRiskTab] = useState('all');
  const [statusTab, setStatusTab] = useState(COMPLIANCE_STATUS.PENDING);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null); // null | 'exclude' | 'escalate'
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const noteFormRef = useRef(null);

  const operator = admin?.name || '合规专员';
  const selected = detailId || null;
  const refresh = () => setItems([...anomalyDetectionLogs]);
  const goList = () => { if (navigate) navigate('#admin/anomaly'); };
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
    else goList();
  }, [action, goList]);
  const drawerRef = useDrawerFocus(drawerOpen, exitLayer);

  const kw = keyword.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter(r => {
      if (riskTab !== 'all' && r.riskLevel !== riskTab) return false;
      if (r.status !== statusTab) return false;
      if (kw) {
        const hay = `${r.id} ${r.ruleName || ''} ${r.ruleId || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, riskTab, statusTab, kw]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCounts = useMemo(() => {
    const c = {};
    Object.values(RISK_LEVEL).forEach(lv => {
      c[lv] = items.filter(r => r.riskLevel === lv && r.status === COMPLIANCE_STATUS.PENDING).length;
    });
    return c;
  }, [items]);

  const switchRisk = (k) => { setRiskTab(k); setPage(1); };
  const switchStatus = (k) => { setStatusTab(k); setPage(1); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  const openAction = (key) => {
    setAction(key);
    setNote('');
    setNoteError(false);
  };

  const submitAction = () => {
    if (!sel) return;
    if (!note.trim()) {
      setNoteError(true);
      noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const act = ACTIONS.find(a => a.key === action);
    if (!act) return;
    // 上报 STR = 真实闭环：创建 STR 报告记录（STR 工作台可见，继续评估→MLRO→JFIU 全流程）
    // severity 对齐 AdminSTR 值域（urgent/standard）：高风险 → 紧急，其余 → 标准
    let strRecord = null;
    if (act.key === 'escalate') {
      strRecord = createStrReport({
        userId: sel.userId,
        triggerSource: 'anomaly',
        severity: sel.riskLevel === RISK_LEVEL.HIGH ? 'urgent' : 'standard',
      });
    }
    updateAnomalyDetectionLog(sel.id, act.toStatus, operator, note.trim(), strRecord?.id || null);
    refresh();
    setAction(null);
    setNote('');
    goList();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>异常检测日志</h1>
        <span className="admin-header-summary">7 条核心检测规则 · 事件触发 + 日终批量扫描 · 误报可排除</span>
      </div>

      {/* 风险等级 Tab */}
      <div className="admin-tabs">
        {RISK_TABS.map(tab => (
          <button key={tab.key} className={`admin-tab ${riskTab === tab.key ? 'active' : ''}`} onClick={() => switchRisk(tab.key)}>
            {tab.label}
            {tab.key !== 'all' && pendingCounts[tab.key] > 0 && <span className="admin-tab-badge">{pendingCounts[tab.key]}</span>}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div className="admin-search-wrap">
            <span className="admin-search-icon"><Search size={14} /></span>
            <input className="admin-search-input" placeholder="搜索日志 / 规则" aria-label="搜索日志 / 规则" value={keyword} onChange={e => onSearchChange(e.target.value)} />
            {keyword && <button className="btn-icon" onClick={() => onSearchChange('')} aria-label="清除"><X size={14} /></button>}
          </div>
        </div>
      </div>

      {/* 状态 Tab */}
      <div className="admin-tabs" style={{ marginTop: 0 }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.key} className={`admin-tab ${statusTab === tab.key ? 'active' : ''}`} onClick={() => switchStatus(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="admin-table admin-table--anomaly">
        <div className="admin-table-header">
          <span className="col-id">日志编号</span>
          <span className="col-project">检测规则</span>
          <span className="col-type">风险等级</span>
          <span className="col-date">检测时间</span>
          <span className="col-status">状态</span>
        </div>
        {pageRows.map(r => {
          const rm = RISK_META[r.riskLevel] || {};
          const sm = STATUS_META[r.status] || {};
          return (
            <div key={r.id} className="admin-table-row" onClick={() => navigate(`#admin/anomaly/${r.id}`)}>
              <span className="col-id">{r.id}</span>
              <span className="col-project">
                <strong>{r.ruleName}</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', display: 'block' }}>{r.ruleId} · 用户 {r.userId}</span>
              </span>
              <span className="col-type"><span className={`status-badge ${rm.className || ''}`}>{rm.label || r.riskLevel}</span></span>
              <span className="col-date">{formatListDateTime(r.detectionTime || r.createdAt)}</span>
              <span className="col-status"><span className={`status-badge ${sm.className || ''}`}>{sm.label || r.status}</span></span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的异常检测记录</span></div>
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
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`异常检测日志 ${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">异常检测日志 · {sel.id}</h3>
            <button className="btn-icon" title="关闭" onClick={exitLayer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
              <div className="detail-section">
                <h4><ShieldAlert size={14} /> 检测信息</h4>
                <div className="detail-row"><span className="detail-label">触发规则</span><span className="detail-value">{sel.ruleName}（{sel.ruleId}）</span></div>
                <div className="detail-row"><span className="detail-label">规则说明</span><span className="detail-value">{ANOMALY_RULES[sel.ruleId]?.description || '—'}</span></div>
                <div className="detail-row">
                  <span className="detail-label">风险等级</span>
                  <span className="detail-value"><span className={`status-badge ${(RISK_META[sel.riskLevel] || {}).className || ''}`}>{RISK_META[sel.riskLevel]?.label || sel.riskLevel}</span></span>
                </div>
                <div className="detail-row"><span className="detail-label">关联用户</span><span className="detail-value">{sel.userId}</span></div>
                <div className="detail-row"><span className="detail-label">检测时间</span><span className="detail-value">{formatListDateTime(sel.detectionTime || sel.createdAt)}</span></div>
                <div className="detail-row">
                  <span className="detail-label">当前状态</span>
                  <span className="detail-value"><span className={`status-badge ${(STATUS_META[sel.status] || {}).className || ''}`}>{STATUS_META[sel.status]?.label || sel.status}</span></span>
                </div>
                {sel.resolvedBy && <div className="detail-row"><span className="detail-label">处理人</span><span className="detail-value">{sel.resolvedBy}</span></div>}
                {sel.resolvedAt && <div className="detail-row"><span className="detail-label">处理时间</span><span className="detail-value">{formatListDateTime(sel.resolvedAt)}</span></div>}
                {sel.resolutionNotes && <div className="detail-row"><span className="detail-label">处理备注</span><span className="detail-value">{sel.resolutionNotes}</span></div>}
                {sel.strReportId && (
                  <div className="detail-row">
                    <span className="detail-label">关联 STR 报告</span>
                    <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {sel.strReportId}
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`#admin/str/${sel.strReportId}`)}>查看 STR 流程</button>
                    </span>
                  </div>
                )}
              </div>

              {/* 处理操作 */}
              {sel.status === COMPLIANCE_STATUS.PENDING && (
                <div className="detail-section detail-section--action">
                  <h4><AlertTriangle size={14} /> 处理操作</h4>
                  {!action ? (
                    <div className="approval-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {ACTIONS.map(a => (
                        <button key={a.key} className={`btn btn-sm ${a.key === 'escalate' ? 'btn-danger' : 'btn-outline'}`} onClick={() => openAction(a.key)}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mark-form" ref={noteFormRef}>
                      <div className="form-label">{ACTIONS.find(a => a.key === action)?.desc}</div>
                      <textarea
                        className={`form-input ${noteError ? 'error' : ''}`}
                        placeholder="请填写处理理由..."
                        value={note}
                        onChange={e => { setNote(e.target.value); if (noteError) setNoteError(false); }}
                        rows={3}
                      />
                      {noteError && <p className="form-error">请填写处理理由</p>}
                      <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setAction(null)}>取消</button>
                        <button className="btn btn-primary btn-sm" onClick={submitAction} disabled={!note.trim()}>确认处理</button>
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
