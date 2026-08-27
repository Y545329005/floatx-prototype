import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, Clock, CheckCircle, ShieldAlert, FileText, Send, AlertTriangle, ScrollText } from 'lucide-react';
import {
  strReports,
  STR_ASSESSMENT_STATUS,
  STR_REPORT_STATUS,
  updateStrAssessment,
  updateStrReport,
  createStrReport,
  formatListDateTime,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// STR 触发来源（PRD 01 §3.16.1）
const TRIGGER_LABELS = {
  sanctions: '制裁名单命中',
  aml_review: 'AML 复核发现',
  anomaly_detection: '异常检测触发',
  employee_report: '员工举报',
  ed_failure: 'EDD 失败',
  pep: 'PEP 相关',
  anomaly: '异常交易',
  manual: '人工发现',
};

const SEVERITY_META = {
  standard: { label: '标准', className: 'admin-status-pending' },
  urgent: { label: '紧急', className: 'admin-status-rejected' },
};

const ASSESS_META = {
  [STR_ASSESSMENT_STATUS.PENDING]: { label: '待评估', className: 'admin-status-pending' },
  [STR_ASSESSMENT_STATUS.IN_PROGRESS]: { label: '评估中', className: 'admin-status-pending' },
  [STR_ASSESSMENT_STATUS.SUSPICIOUS]: { label: '判定可疑', className: 'admin-status-rejected' },
  [STR_ASSESSMENT_STATUS.NOT_SUSPICIOUS]: { label: '已排除', className: 'admin-status-approved' },
};

const REPORT_META = {
  [STR_REPORT_STATUS.DRAFT]: { label: '草稿', className: 'admin-status-pending' },
  [STR_REPORT_STATUS.PENDING_APPROVAL]: { label: '待 MLRO 审批', className: 'admin-status-pending' },
  [STR_REPORT_STATUS.APPROVED]: { label: '已批准', className: 'admin-status-approved' },
  [STR_REPORT_STATUS.SUBMITTED]: { label: '已提交 JFIU', className: 'admin-status-approved' },
};

// 7 个工作日时限（PRD 01 §3.16.3）：发现→评估 2 工作日 →草案 3 →MLRO审批 1 →提交JFIU 1
// mock 用毫秒折算（1 工作日 ≈ 1 天简化演示）；实际生产中由后端定时任务跟踪
const STAGE_DEADLINES = [
  { stage: '评估', dueDays: 2, desc: '发现 → 初步评估完成' },
  { stage: '草案', dueDays: 5, desc: '评估确认 → STR 草案完成（累计 5 日）' },
  { stage: '审批', dueDays: 6, desc: '草案 → MLRO 审批（累计 6 日）' },
  { stage: '提交', dueDays: 7, desc: '审批 → 提交 JFIU（累计 7 个工作日）' },
];

const PAGE_SIZE = 8;

/**
 * STR 可疑交易报告工作台（T6 · PRD 01 §3.16 STR 流程）
 * 完整 4 阶段：发现 → 评估 → 报告（草案/审批） → 提交 JFIU
 * 含 7 个工作日时限展示 + 不打草惊蛇提示
 */
export default function AdminSTR({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...strReports]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 当前操作阶段（抽屉内推进流程）
  const [assessNote, setAssessNote] = useState('');
  const [assessNoteError, setAssessNoteError] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportContentError, setReportContentError] = useState(false);
  const formRef = useRef(null);

  const operator = admin?.name || '合规专员';
  const selected = detailId || null;
  const refresh = () => setItems([...strReports]);
  const goList = () => { if (navigate) navigate('#admin/str'); };
  const sel = selected ? items.find(r => r.id === selected) : null;
  const drawerOpen = !!selected;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [drawerOpen]);

  const exitLayer = useCallback(() => {
    setAssessNote(''); setAssessNoteError(false);
    setReportContent(''); setReportContentError(false);
    goList();
  }, [goList]);
  const drawerRef = useDrawerFocus(drawerOpen, exitLayer);

  // 各阶段计数（待评估/待审批/已提交）
  const pendingAssess = items.filter(r => r.assessmentStatus === STR_ASSESSMENT_STATUS.PENDING || r.assessmentStatus === STR_ASSESSMENT_STATUS.IN_PROGRESS).length;
  const pendingApproval = items.filter(r => r.reportStatus === STR_REPORT_STATUS.PENDING_APPROVAL).length;
  const submittedCount = items.filter(r => r.reportStatus === STR_REPORT_STATUS.SUBMITTED).length;

  // 7 天时限进度：从 createdAt 起算，mock 简化展示剩余百分比（生产由后端跟踪）
  const getDeadlineProgress = (createdAt) => {
    if (!createdAt) return { pct: 0, urgent: false };
    const start = new Date(createdAt.replace(' ', 'T')).getTime();
    const now = Date.now();
    const total = 7 * 24 * 3600 * 1000; // 7 工作日 mock 折算
    const elapsed = Math.max(0, now - start);
    const pct = Math.min(100, Math.round((elapsed / total) * 100));
    return { pct, urgent: pct >= 70 };
  };

  const kw = keyword.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter(r => {
      if (kw) {
        const hay = `${r.id} ${r.userId} ${TRIGGER_LABELS[r.triggerSource] || r.triggerSource}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, kw]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  // 阶段操作
  const runAssessment = (result) => {
    if (!sel) return;
    if (!assessNote.trim()) {
      setAssessNoteError(true);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    updateStrAssessment(sel.id, result, assessNote.trim());
    if (result === STR_ASSESSMENT_STATUS.NOT_SUSPICIOUS) {
      // 排除：报告状态置为已关闭（复用 DRAFT 表示无后续）
      updateStrReport(sel.id, STR_REPORT_STATUS.DRAFT, '已排除可疑，流程关闭');
    }
    refresh();
    setAssessNote(''); setAssessNoteError(false);
    goList();
  };

  const submitDraft = () => {
    if (!sel) return;
    if (!reportContent.trim()) {
      setReportContentError(true);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    updateStrReport(sel.id, STR_REPORT_STATUS.PENDING_APPROVAL, reportContent.trim());
    refresh();
    setReportContent(''); setReportContentError(false);
    goList();
  };

  const approveReport = () => {
    if (!sel) return;
    updateStrReport(sel.id, STR_REPORT_STATUS.APPROVED, sel.reportContent);
    refresh();
    goList();
  };

  const submitToJfiu = () => {
    if (!sel) return;
    updateStrReport(sel.id, STR_REPORT_STATUS.SUBMITTED, sel.reportContent);
    refresh();
    goList();
  };

  // 当前流程阶段判定
  // assess(评估) → draft(起草) → approval(待MLRO审批) → approved(已批准待提交) → submitted(已提交JFIU)
  const getStage = (r) => {
    if (r.reportStatus === STR_REPORT_STATUS.SUBMITTED) return 'submitted';
    if (r.reportStatus === STR_REPORT_STATUS.APPROVED) return 'approved';
    if (r.reportStatus === STR_REPORT_STATUS.PENDING_APPROVAL) return 'approval';
    if (r.assessmentStatus === STR_ASSESSMENT_STATUS.SUSPICIOUS) return 'draft';
    if (r.assessmentStatus === STR_ASSESSMENT_STATUS.NOT_SUSPICIOUS) return 'closed';
    return 'assess';
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>STR 可疑交易报告</h1>
        <span className="admin-header-summary">发现 → 评估 → 报告 → MLRO 审批 → 提交 JFIU（7 个工作日）</span>
        <div className="admin-page-header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span className="admin-stat-chip">待评估 {pendingAssess}</span>
          <span className="admin-stat-chip">待审批 {pendingApproval}</span>
          <span className="admin-stat-chip">已提交 {submittedCount}</span>
        </div>
      </div>

      {/* 不打草惊蛇提示 */}
      <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)', background: 'var(--warning-light)', border: '1px solid var(--warning-border)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>不打草惊蛇原则：</strong>禁止通知客户其正在被调查 / 已提交 STR / 调查进度；不得以调查为由询问敏感信息；限制账户时不说明真实原因。STR 信息仅限最小知悉范围。
          </div>
        </div>
      </div>

      {/* 搜索 */}
      <div className="admin-search-wrap" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="admin-search-icon"><Search size={14} /></span>
        <input className="admin-search-input" placeholder="搜索 STR 编号 / 用户 / 触发来源" aria-label="搜索 STR 编号 / 用户 / 触发来源" value={keyword} onChange={e => onSearchChange(e.target.value)} />
        {keyword && <button className="btn-icon" onClick={() => onSearchChange('')} aria-label="清除"><X size={14} /></button>}
      </div>

      {/* 列表 */}
      <div className="admin-table admin-table--str">
        <div className="admin-table-header">
          <span className="col-id">STR 编号</span>
          <span className="col-project">触发来源</span>
          <span className="col-type">严重程度</span>
          <span className="col-date">发现时间</span>
          <span className="col-status">流程阶段</span>
        </div>
        {pageRows.map(r => {
          const prog = getDeadlineProgress(r.createdAt);
          const stage = getStage(r);
          return (
            <div key={r.id} className="admin-table-row" onClick={() => navigate(`#admin/str/${r.id}`)}>
              <span className="col-id">
                {r.id}
                {prog.urgent && stage !== 'submitted' && stage !== 'closed' && (
                  <span className="status-badge admin-status-rejected">时限紧张</span>
                )}
              </span>
              <span className="col-project">
                <strong>{TRIGGER_LABELS[r.triggerSource] || r.triggerSource}</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', display: 'block' }}>用户 {r.userId}</span>
              </span>
              <span className="col-type">
                <span className={`status-badge ${(SEVERITY_META[r.severity] || {}).className || ''}`}>{SEVERITY_META[r.severity]?.label || r.severity}</span>
              </span>
              <span className="col-date">{formatListDateTime(r.createdAt)}</span>
              <span className="col-status">
                {stage === 'submitted' && <span className="status-badge admin-status-approved">已提交 JFIU</span>}
                {stage === 'approved' && <span className="status-badge admin-status-approved">已批准</span>}
                {stage === 'approval' && <span className="status-badge admin-status-pending">待 MLRO 审批</span>}
                {stage === 'draft' && <span className="status-badge admin-status-pending">报告阶段</span>}
                {stage === 'assess' && <span className="status-badge admin-status-pending">评估中</span>}
                {stage === 'closed' && <span className="status-badge admin-status-approved">已排除</span>}
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无 STR 记录</span></div>
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
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`STR 报告 ${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">STR 报告 · {sel.id}</h3>
            <button className="btn-icon" title="关闭" onClick={exitLayer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
              {/* 基本信息 */}
              <div className="detail-section">
                <h4><ShieldAlert size={14} /> 报告信息</h4>
                <div className="detail-row"><span className="detail-label">触发来源</span><span className="detail-value">{TRIGGER_LABELS[sel.triggerSource] || sel.triggerSource}</span></div>
                <div className="detail-row"><span className="detail-label">严重程度</span><span className="detail-value"><span className={`status-badge ${(SEVERITY_META[sel.severity] || {}).className || ''}`}>{SEVERITY_META[sel.severity]?.label || sel.severity}</span></span></div>
                <div className="detail-row"><span className="detail-label">关联用户</span><span className="detail-value">{sel.userId}</span></div>
                <div className="detail-row"><span className="detail-label">发现时间</span><span className="detail-value">{formatListDateTime(sel.createdAt)}</span></div>
                {sel.submittedAt && <div className="detail-row"><span className="detail-label">提交时间</span><span className="detail-value">{formatListDateTime(sel.submittedAt)}</span></div>}
                {sel.jfiuReference && <div className="detail-row"><span className="detail-label">JFIU 回执号</span><span className="detail-value">{sel.jfiuReference}</span></div>}
                {sel.assessmentNotes && <div className="detail-row"><span className="detail-label">评估备注</span><span className="detail-value">{sel.assessmentNotes}</span></div>}
              </div>

              {/* 7 天时限进度 */}
              {getStage(sel) !== 'submitted' && getStage(sel) !== 'closed' && (
                <div className="detail-section">
                  <h4><Clock size={14} /> 时限进度（7 个工作日）</h4>
                  <div className="detail-row">
                    <span className="detail-label">当前阶段</span>
                    <span className="detail-value">
                      {(() => {
                        // 2026-08-27 审计修复：原逻辑只在 assess/draft 阶段把「评估」标完成，approval/approved
                        // 阶段时评估/草案全部半透明。改为按阶段序号：已过阶段一律标完成。
                        const stageIdx = { assess: 0, draft: 1, approval: 2, approved: 3, submitted: 4 }[getStage(sel)] ?? 0;
                        return STAGE_DEADLINES.map((d, i) => (
                          <span key={d.stage} style={{ display: 'inline-block', marginRight: 'var(--space-2)', opacity: i < stageIdx ? 1 : 0.5 }}>
                            {i < stageIdx && <CheckCircle size={12} style={{ color: 'var(--success)', verticalAlign: 'middle', marginRight: 2 }} />}
                            {d.stage}（{d.dueDays}日）
                          </span>
                        ));
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* 流程操作 */}
              {getStage(sel) === 'assess' && (
                <div className="detail-section detail-section--action">
                  <h4><FileText size={14} /> 初步评估（2 个工作日内）</h4>
                  <div className="mark-form" ref={formRef}>
                    <div className="form-label">评估结论备注（必填）：交叉比对 KYC/EDD 档案、回溯交易历史</div>
                    <textarea
                      className={`form-input ${assessNoteError ? 'error' : ''}`}
                      placeholder="请输入评估结论..."
                      value={assessNote}
                      onChange={e => { setAssessNote(e.target.value); if (assessNoteError) setAssessNoteError(false); }}
                      rows={3}
                    />
                    {assessNoteError && <p className="form-error">请填写评估备注</p>}
                    <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => runAssessment(STR_ASSESSMENT_STATUS.NOT_SUSPICIOUS)}>排除可疑</button>
                      <button className="btn btn-primary btn-sm" onClick={() => runAssessment(STR_ASSESSMENT_STATUS.SUSPICIOUS)}>判定可疑 → 起草报告</button>
                    </div>
                  </div>
                </div>
              )}

              {getStage(sel) === 'draft' && (
                <div className="detail-section detail-section--action">
                  <h4><ScrollText size={14} /> STR 草案（3 个工作日内）</h4>
                  <div className="mark-form" ref={formRef}>
                    <div className="form-label">填写 STR 报告内容（可疑人员 / 交易描述 / 相关账户 / 已采取措施）</div>
                    <textarea
                      className={`form-input ${reportContentError ? 'error' : ''}`}
                      placeholder="可疑交易描述：时间线、金额、交易类型、为何可疑..."
                      value={reportContent}
                      onChange={e => { setReportContent(e.target.value); if (reportContentError) setReportContentError(false); }}
                      rows={6}
                    />
                    {reportContentError && <p className="form-error">请填写 STR 报告内容</p>}
                    {sel.reportContent && (
                      <div className="detail-section" style={{ marginTop: 'var(--space-3)' }}>
                        <div className="detail-label">已填写内容</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginTop: 4 }}>{sel.reportContent}</div>
                      </div>
                    )}
                    <div className="mark-form-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`#admin/str`)}>取消</button>
                      <button className="btn btn-primary btn-sm" onClick={submitDraft} disabled={!reportContent.trim()}>提交 MLRO 审批</button>
                    </div>
                  </div>
                </div>
              )}

              {getStage(sel) === 'approval' && (
                <div className="detail-section detail-section--action">
                  <h4><Send size={14} /> MLRO 审批（1 个工作日内）</h4>
                  <div className="detail-row"><span className="detail-label">报告内容</span><span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{sel.reportContent}</span></div>
                  <div className="approval-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                    <button className="btn btn-primary btn-sm" onClick={approveReport}>批准</button>
                  </div>
                </div>
              )}

              {getStage(sel) === 'approved' && (
                <div className="detail-section detail-section--action">
                  <h4><Send size={14} /> MLRO 已批准 · 提交 JFIU（1 个工作日内）</h4>
                  <div className="detail-row"><span className="detail-label">报告内容</span><span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{sel.reportContent}</span></div>
                  <div className="approval-actions" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                    <button className="btn btn-primary btn-sm" onClick={submitToJfiu}>提交 JFIU</button>
                  </div>
                </div>
              )}

              {getStage(sel) === 'submitted' && (
                <div className="detail-section detail-section--action">
                  <h4><CheckCircle size={14} /> 已提交 JFIU</h4>
                  <div className="detail-row"><span className="detail-label">JFIU 回执号</span><span className="detail-value">{sel.jfiuReference}</span></div>
                  <div className="detail-row"><span className="detail-label">提交时间</span><span className="detail-value">{formatListDateTime(sel.submittedAt)}</span></div>
                  <div className="detail-section" style={{ marginTop: 'var(--space-3)' }}>
                    <div className="form-label">后续跟踪（不打草惊蛇，配合 JFIU 询问）</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>本记录将归档保存 ≥5 年，仅供合规与监管查询</div>
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
