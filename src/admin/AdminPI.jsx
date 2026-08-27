import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ImageIcon, X, Search, History, Eye, ClipboardCheck, Award, FileText } from 'lucide-react';
import {
  piSubmissions, approvePiSubmission, rejectPiSubmission, PI_STATUS,
  maskName, maskPhone,
} from '../mock/data';

// PI 认证审核（2026-08-14 · 独立 PI 审核流）：KYC=实名认证（AdminKYC），PI=资格认证（本页）。
// 审核员核验：asset 类型资产证明预览 + 逐项三态判定（符合 ✓ / 不符合 ✗ / 未判定）；
// professional 类型持牌资质判定。全部符合才可通过；含不符合项只能拒绝（自动带出原因）。
// 判定结果写入 history/审计留痕，已通过记录回显只读。（2026-08-14 方案 A，历经 B→A 修正）
const statusMeta = {
  [PI_STATUS.PENDING_REVIEW]: { label: '待审核', cls: 'admin-status-pending' },
  [PI_STATUS.APPROVED]: { label: '已认证', cls: 'admin-status-approved' },
  [PI_STATUS.REJECTED]: { label: '已拒绝', cls: 'admin-status-rejected' },
  [PI_STATUS.EXPIRED]: { label: '已过期', cls: 'admin-status-requires' },
};

const actionMeta = {
  submitted: { label: '提交申请', cls: 'submitted' },
  approved: { label: '审核通过', cls: 'approved' },
  rejected: { label: '审核拒绝', cls: 'rejected' },
};

// asset 类型核验清单（2026-08-14 方案 A：逐项判定符合/不符合，全部符合才通过；结果留痕）
const ASSET_CHECKLIST = [
  '资产证明文件真实有效（银行月结单 / 投资组合账单）',
  '投资组合 ≥ HK$8,000,000（专业投资者门槛）',
  '文件日期为近 3 个月内（非过期账单）',
  '文件持有人姓名与申请人一致',
];
// professional 类型核验清单（持牌资质，同上判定语义）
const PROF_CHECKLIST = [
  '申请人身份为香港证监会持牌人士或注册机构',
  '持牌/注册资格在有效期内（CE No. 可查询）',
];

// 图片源：base64 对象或字符串路径
const imgSrc = (v) => (typeof v === 'string' ? v : (v && v.dataUrl ? v.dataUrl : ''));

const FILTERS = [
  { key: PI_STATUS.PENDING_REVIEW, label: '待审核' },
  { key: PI_STATUS.APPROVED, label: '已认证' },
  { key: PI_STATUS.REJECTED, label: '已拒绝' },
  { key: PI_STATUS.EXPIRED, label: '已过期' },
];

const PAGE_SIZE = 5;

export default function AdminPI({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...piSubmissions]);
  const [action, setAction] = useState(null); // null | 'reject'
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const reasonFormRef = useRef(null);
  const [checks, setChecks] = useState({});
  const [filter, setFilter] = useState(PI_STATUS.PENDING_REVIEW);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const selected = detailId || null;
  const refresh = () => setItems([...piSubmissions]);
  const sel = selected ? items.find(k => k.id === selected) : null;
  const goList = () => { if (navigate) navigate('#admin/pi'); };
  const drawerOpen = !!selected;

  // 2026-08-14 方案 A（逐项三态判定）：打开已审核记录时回显 history 里 approved 动作的核验判定
  useEffect(() => {
    if (!sel) return;
    if (sel.status === PI_STATUS.PENDING_REVIEW) { setChecks({}); return; }
    const approvedEntry = (sel.history || []).slice().reverse().find(h => h.action === 'approved');
    setChecks(approvedEntry?.checks || {});
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterCounts = FILTERS.reduce((acc, f) => {
    acc[f.key] = items.filter(k => k.status === f.key).length;
    return acc;
  }, {});

  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const matches = (k) =>
    (k.name || '').toLowerCase().includes(kw)
    || (k.phone || '').toLowerCase().includes(kw)
    || (k.email || '').toLowerCase().includes(kw);
  const filtered = isSearching ? items.filter(matches) : items.filter(k => k.status === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const switchFilter = (key) => { setFilter(key); setPage(1); setChecks({}); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const closeDrawer = () => { setAction(null); setReason(''); setReasonError(false); setChecks({}); goList(); };

  // 当前核验 checklist（asset / professional）
  const checklist = sel?.piType === 'asset' ? ASSET_CHECKLIST : PROF_CHECKLIST;

  // 方案 A 决策派生：判定结果 → 通过/拒绝联动
  const isReadonly = sel?.status !== PI_STATUS.PENDING_REVIEW; // 已审核记录只读回显
  const judged = checklist.filter(c => checks[c] === 'pass' || checks[c] === 'fail');
  const hasFail = judged.some(c => checks[c] === 'fail');
  const hasUndecided = checklist.length > judged.length; // 有未判定项
  const canApprove = !hasFail && !hasUndecided; // 全判定且全 pass 才可通过

  const handleApprove = (pid) => {
    if (!canApprove) { setReasonError(true); return; } // 未全判定或含不符合 → 拦截（方案 A 决策联动）
    approvePiSubmission(pid, admin?.name || '系统', checks);
    refresh();
    closeDrawer();
  };

  const handleActionConfirm = () => {
    if (!selected) return;
    if (!reason.trim()) {
      setReasonError(true);
      setTimeout(() => {
        const body = reasonFormRef.current?.closest('.admin-drawer-body');
        const form = reasonFormRef.current;
        if (body && form) {
          const bodyRect = body.getBoundingClientRect();
          const formRect = form.getBoundingClientRect();
          const target = Math.max(0, body.scrollTop + (formRect.bottom - bodyRect.bottom));
          body.scrollTo({ top: target, behavior: 'smooth' });
        }
      }, 60);
      return;
    }
    if (action === 'reject') rejectPiSubmission(selected, reason.trim(), admin?.name || '系统');
    setAction(null);
    setReason('');
    setReasonError(false);
    refresh();
    closeDrawer();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>PI 认证审核</h1>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key && !isSearching ? 'active' : ''}`}
              onClick={() => switchFilter(f.key)}
            >
              {f.label} {filterCounts[f.key]}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索姓名 / 手机 / 邮箱"
            placeholder="搜索姓名 / 手机 / 邮箱"
            value={keyword}
            onChange={e => onSearchChange(e.target.value)}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => onSearchChange('')}><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="admin-table admin-table--pi">
        <div className="admin-table-header">
          <span className="col-name">申请人</span>
          <span className="col-type">资格类型</span>
          <span className="col-phone">联系方式</span>
          <span className="col-date">提交时间</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(k => {
          const meta = statusMeta[k.status];
          const openDrawer = () => { navigate(`#admin/pi/${k.id}`); };
          return (
            <div
              key={k.id}
              className="admin-table-row"
              onClick={openDrawer}
            >
              <span className="col-name">
                <strong>{maskName(k.name)}</strong>
              </span>
              <span className="col-type">{k.piType === 'asset' ? '资产达标' : '专业投资人'}</span>
              <span className="col-phone">{maskPhone(k.phone)}</span>
              <span className="col-date">{k.submittedAt}</span>
              <span className="col-status">
                <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
              </span>
              <span className="col-actions">
                {k.status === PI_STATUS.PENDING_REVIEW ? (
                  <button className="btn-icon" title="审核 PI 认证" onClick={(e) => { e.stopPropagation(); openDrawer(); }}>
                    <ClipboardCheck size={16} />
                  </button>
                ) : (
                  <button className="btn-icon" title="查看认证资料" onClick={(e) => { e.stopPropagation(); openDrawer(); }}>
                    <Eye size={16} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {isSearching ? '未找到匹配用户' : `暂无${FILTERS.find(f => f.key === filter)?.label || ''}申请`}
            </span>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 条</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && sel && (
        <div className="admin-drawer" role="dialog" aria-label={`PI 认证 #${sel.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">PI 认证 #{sel.id} · {sel.name}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="kyc-review-grid">
              <div className="card kyc-review-block">
                <h4 className="card-title"><Award size={14} /> PI 资格声明</h4>
                <div className="kyc-review-row"><span>资格类型</span><strong>{sel.piType === 'asset' ? '资产达标（≥HK$800 万）' : '专业投资人（持牌人士）'}</strong></div>
                <div className="kyc-review-row"><span>声明签署</span><strong>{sel.piCertified ? '已签署' : '未签署'}</strong></div>
                <div className="kyc-review-row"><span>提交时间</span><strong>{sel.submittedAt}</strong></div>
                {sel.piType === 'asset' && (
                  <div className="kyc-review-doc">
                    <div className="kyc-review-img">
                      {imgSrc(sel.piProof) ? <img src={imgSrc(sel.piProof)} alt="资产证明" /> : <><ImageIcon size={18} /><span>无文件</span></>}
                      <span className="kyc-review-img-label">资产证明</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="card kyc-review-block">
                <h4 className="card-title"><FileText size={14} /> 资格核验</h4>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                  {sel.piType === 'asset' ? '逐项核验资产证明文件，判定「符合 / 不符合」；全部符合方可通过' : '逐项核验持牌资质，判定「符合 / 不符合」；全部符合方可通过'}
                </div>
                {checklist.map(c => (
                  <div key={c} className="admin-pi-check" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', fontSize: 'var(--text-sm)' }}>
                    <span style={{ flex: 1, lineHeight: 1.5 }}>{c}</span>
                    {/* 三态判定：符合 ✓ / 不符合 ✗ / 未判定（默认，两按钮都不激活）；已审核记录只读回显 */}
                    <span className="admin-pi-check-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        disabled={isReadonly}
                        className={`admin-pi-judge ${checks[c] === 'pass' ? 'pass active' : ''}`}
                        title="核验符合"
                        onClick={() => setChecks(p => ({ ...p, [c]: checks[c] === 'pass' ? undefined : 'pass' }))}
                      >
                        ✓ 符合
                      </button>
                      <button
                        type="button"
                        disabled={isReadonly}
                        className={`admin-pi-judge ${checks[c] === 'fail' ? 'fail active' : ''}`}
                        title="核验不符合"
                        onClick={() => setChecks(p => ({ ...p, [c]: checks[c] === 'fail' ? undefined : 'fail' }))}
                      >
                        ✗ 不符合
                      </button>
                    </span>
                  </div>
                ))}
                {/* 方案 A 决策联动提示：未判定 / 含不符合项 → 明确当前能否通过 */}
                {!isReadonly && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: hasFail ? 'var(--compliance)' : (hasUndecided ? 'var(--warning)' : 'var(--success)' ), fontWeight: 600 }}>
                    {hasFail
                      ? '存在核验不符合项，不能通过——请点「拒绝」，将自动带出不符合原因'
                      : hasUndecided
                        ? '还有未判定的核验项，请逐项判定「符合 / 不符合」'
                        : '全部核验符合，可以「通过认证」'}
                  </div>
                )}
              </div>
              <div className="card kyc-review-block">
                <h4 className="card-title">联系与提交</h4>
                <div className="kyc-review-row"><span>手机</span><strong>{sel.phone}</strong></div>
                <div className="kyc-review-row"><span>邮箱</span><strong>{sel.email}</strong></div>
                {sel.status === PI_STATUS.REJECTED && (
                  <div className="kyc-review-reject">拒绝原因：{sel.rejectReason}</div>
                )}
              </div>
            </div>

            <div className="card kyc-review-block kyc-history-card">
              <h4 className="card-title"><History size={14} /> 审核记录</h4>
              {sel.history && sel.history.length > 0 ? (
                sel.history.slice().reverse().map((h, i) => (
                  <div className="kyc-history-item" key={i}>
                    <span className={`kyc-history-dot ${actionMeta[h.action]?.cls || ''}`} />
                    <div className="kyc-history-body">
                      <div className="kyc-history-head">
                        <strong>{actionMeta[h.action]?.label || h.action}</strong>
                        <span className="kyc-history-operator">{h.operator}</span>
                      </div>
                      {h.note && <div className="kyc-history-note">{h.note}</div>}
                      {/* 2026-08-14 方案 A：approved 动作回显核验判定（✓ 符合 / ✗ 不符合），审计凭证 */}
                      {h.checks && typeof h.checks === 'object' && Object.keys(h.checks).length > 0 && (
                        <div className="admin-pi-checks-record">
                          {Object.entries(h.checks).map(([k, v]) => (
                            <span key={k} className={`admin-pi-check-tag ${v === 'pass' ? 'pass' : 'miss'}`}>{v === 'pass' ? '✓' : '✗'} {k.split('（')[0].trim()}</span>
                          ))}
                        </div>
                      )}
                      <div className="kyc-history-time">{h.at}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted text-sm">暂无审核记录</div>
              )}
            </div>

            {sel.status === PI_STATUS.PENDING_REVIEW && action === 'reject' && (
              <div className="admin-reject-form" ref={reasonFormRef}>
                <div className="form-group">
                  <label>拒绝原因（必填，将通知申请人）</label>
                  <textarea
                    className={`form-input${reasonError ? ' field-error' : ''}`}
                    rows={3}
                    placeholder="例如：资产证明不达标，未能达到 HK$800 万门槛"
                    value={reason}
                    onChange={e => { setReason(e.target.value); if (reasonError) setReasonError(false); }}
                  />
                  {reasonError && <span className="form-error">请填写原因</span>}
                </div>
              </div>
            )}
          </div>
          {sel.status === PI_STATUS.PENDING_REVIEW && (
            <div className="admin-drawer-actions">
              {action === 'reject' ? (
                <>
                  <button className="btn btn-md btn-secondary" onClick={() => { setAction(null); setReason(''); setReasonError(false); }}>取消</button>
                  <button className="btn btn-md btn-outline" onClick={handleActionConfirm}>
                    <XCircle size={16} /> 确认拒绝
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-md btn-outline"
                    onClick={() => {
                      // 方案 A：含不符合项 → 拒绝时自动带出原因（列出不符合的核验项）
                      const failItems = checklist.filter(c => checks[c] === 'fail');
                      setAction('reject');
                      setReason(failItems.length > 0 ? `以下核验项不符合要求：${failItems.map(c => c.split('（')[0].trim()).join('；')}` : '');
                    }}
                  >
                    <XCircle size={16} /> 拒绝
                  </button>
                </>
              )}
              <button
                className="btn btn-md btn-primary"
                disabled={!canApprove}
                title={hasFail ? '存在核验不符合项，不能通过' : (hasUndecided ? '还有未判定的核验项' : '')}
                onClick={() => handleApprove(sel.id)}
              >
                <CheckCircle size={16} /> 通过认证
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
