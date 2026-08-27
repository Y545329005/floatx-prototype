import { useState, useEffect } from 'react';
import { X, FileText, ClipboardCheck, Building2 } from 'lucide-react';
import {
  projects,
  subscriptions,
  spvs,
  getProjectById,
  getProjectStageSlug,
  formatCurrency,
  formatListDateTime,
  getCurrencySymbol,
  markSubscriptionAllocated,
  markSubscriptionSigned,
  markSubscriptionUnallocated,
  markSubscriptionForfeit,
  maskName,
  getManagerForUser,
  spvStatusLabels,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 申购状态 → 后台状态徽章修饰类（token 语义色）
const byTime = (a, b) => (a.createdAt || '').localeCompare(b.createdAt || '');

export default function AdminSubscriptions({ navigate, detailId, admin }) {
  const [items, setItems] = useState(subscriptions);
  const [confirm, setConfirm] = useState(null); // { projectId, subId?, action }
  const [filter, setFilter] = useState('all'); // all | pending | done
  const [errorMsg, setErrorMsg] = useState(''); // 操作错误提示（签 SPV 校验失败等）
  // 确认签署证据表单（2026-08-15 方案 B · 香港合规留痕）：回执编号 + 实际签署时间必填，签署人预填投资人
  const [evForm, setEvForm] = useState({ envelopeId: '', signedAt: '', signerName: '' });
  // 获配实际配额（2026-08-21）：默认预填意向全额，超募时可削减；冻结/宽限期/签署扣款均按此金额执行
  const [allocQuota, setAllocQuota] = useState('');
  const operator = admin?.name || '运营后台';
  const refresh = () => setItems([...subscriptions]);
  const goList = () => { if (navigate) navigate('#admin/subscriptions'); };

  const selected = detailId || null;
  const drawerOpen = !!selected;
  const selectedProject = selected ? getProjectById(selected) : null;
  const projSubs = (selectedProject ? subscriptions.filter(s => s.projectId === selectedProject.id) : []).sort(byTime);
  const waiting = projSubs.filter(s => s.status === 'submitted');
  const allocatedCount = projSubs.filter(s => s.status === 'allocated').length;
  const confirmMode = !!confirm;
  const confirmSub = confirm && confirm.subId ? subscriptions.find(s => s.id === confirm.subId) : null;

  // 统一抽屉行为：滚动锁定（Esc 分层退出 / Tab 圈闭 / 焦点还原由 useDrawerFocus 接管）
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  // 分层退出：confirm 态先取消确认，否则关抽屉（与遮罩点击同构）
  const exitLayer = () => { if (confirmMode) setConfirm(null); else goList(); };
  const drawerRef = useDrawerFocus(drawerOpen, exitLayer);

  // ---- 项目维度列表统计（钱以项目汇总） ----
  // 待处理 = 待协调（submitted）+ 待签（allocated）——运营执行台核心：还有多少笔要我处理
  const projectRows = projects
    .filter(p => subscriptions.some(s => s.projectId === p.id))
    .map(p => {
      const subs = subscriptions.filter(s => s.projectId === p.id);
      const total = subs.reduce((s, x) => s + (x.amount || 0), 0);
      const pendingAlloc = subs.filter(s => s.status === 'submitted').length;
      const pendingSign = subs.filter(s => s.status === 'allocated').length;
      const spv = spvs.find(s => s.projectId === p.id);
      return { project: p, subs, total, pendingAlloc, pendingSign, pendingTotal: pendingAlloc + pendingSign, spv };
    });
  const visibleRows = filter === 'pending'
    ? projectRows.filter(r => r.pendingTotal > 0)
    : filter === 'done'
      ? projectRows.filter(r => r.pendingTotal === 0)
      : projectRows;

  // 页头统计（全平台口径）
  const pendingAllocCount = subscriptions.filter(s => s.status === 'submitted').length;
  const pendingSignCount = subscriptions.filter(s => s.status === 'allocated').length;
  const frozenTotal = subscriptions
    .filter(s => s.status === 'allocated')
    .reduce((s, x) => s + (x.frozenAmount || 0), 0);

  // ---- 操作执行（确认态 → 执行 → 退出确认 + 刷新） ----
  // 签 SPV 校验失败时不下推 confirm（保持抽屉打开显示错误）
  const handleConfirm = () => {
    if (!confirm) return;
    const { subId, action } = confirm;
    let res = null;
    if (action === 'allocate') res = markSubscriptionAllocated(subId, operator, allocQuota);
    else if (action === 'unallocate') res = markSubscriptionUnallocated(subId, '本轮份额稀缺，未获配额', operator);
    else if (action === 'sign') res = markSubscriptionSigned(subId, null, operator, { envelopeId: evForm.envelopeId, signedAt: evForm.signedAt, signerName: evForm.signerName });
    else if (action === 'forfeit') res = markSubscriptionForfeit(subId, undefined, operator);
    // 签 SPV 返回 { ok, error }，校验失败停留在确认视图 + 显示错误
    if (res && res.ok === false) {
      setErrorMsg(res.error);
      return;
    }
    setErrorMsg('');
    setConfirm(null);
    setEvForm({ envelopeId: '', signedAt: '', signerName: '' });
    setAllocQuota('');
    refresh();
  };

  // 确认视图文案（资金动作全加确认，2026-08-13）
  const confirmText = confirm ? (() => {
    switch (confirm.action) {
      case 'allocate':
        return { title: '标记已获配额', desc: `将标记 ${maskName(confirmSub?.investorName)} 已获配额，并冻结实际配额金额（进入签署宽限期）。默认按意向全额获配；超募时可在下方削减实际配额。确认执行？` };
      case 'unallocate':
        return { title: '标记未获配额', desc: `将标记 ${maskName(confirmSub?.investorName)} 本轮未获配额（客户可关注后续轮次重新提交）。确认执行？` };
      case 'sign':
        return { title: '确认签署完成', desc: `${maskName(confirmSub?.investorName)} 已在第三方电子签署平台完成 SPV 签署。平台确认签署回执后，将从冻结金额完成扣款、生成持仓。确认执行？` };
      case 'forfeit':
        return { title: '标记未签 · 手动顺延', desc: `将解冻 ${maskName(confirmSub?.investorName)} 的冻结金额并标记未获配额，waitlist 下一位自动上位。确认执行？` };
      default: return { title: '确认操作', desc: '' };
    }
  })() : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>申购记录</h1>
        <span className="text-muted admin-header-summary">
          共 {projectRows.length} 个项目 · 待协调 {pendingAllocCount} 笔 · 待签 {pendingSignCount} 笔 · 冻结 HK$ {formatCurrency(frozenTotal)}
        </span>
      </div>

      {/* 筛选行：运营执行台 = 先看"今天要处理哪些项目"（筛的是待处理状态，label 与 Projects/Events 一致用"状态"） */}
      <div className="admin-filter-row">
        <button className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部</button>
        <button className={`admin-filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>待处理</button>
        <button className={`admin-filter-btn ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>已处理完</button>
      </div>

      {/* 项目维度全宽列表（点击行/操作"处理" → 抽屉查看该项目全部申购） */}
      <div className="admin-table admin-table--subs">
        <div className="admin-table-header">
          <span className="col-name">项目</span>
          <span className="col-amount">累计意向金额</span>
          <span className="col-count">申购笔数</span>
          <span className="col-pending">待处理</span>
          <span className="col-spv">SPV</span>
          <span className="col-date">意向截止</span>
          <span className="col-actions">操作</span>
        </div>
        {visibleRows.map(r => {
          const cur = getCurrencySymbol(r.project.currency);
          return (
            <div
              key={r.project.id}
              className="admin-table-row"
              onClick={() => { if (navigate) navigate(`#admin/subscriptions/${r.project.id}`); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (navigate) navigate(`#admin/subscriptions/${r.project.id}`); } }}
            >
              <span className="col-name">
                <strong title={r.project.title}>{r.project.title}</strong>
                <span className="text-muted text-sm">{getProjectStageSlug(r.project.stage)} · {r.project.sector}</span>
              </span>
              <span className="col-amount">{cur} {formatCurrency(r.total || 0)}</span>
              <span className="col-count">{r.subs.length}</span>
              <span className="col-pending">
                {r.pendingTotal > 0 ? (
                  <span className="admin-pending-badge">
                    {r.pendingAlloc > 0 && `待协调 ${r.pendingAlloc}`}
                    {r.pendingAlloc > 0 && r.pendingSign > 0 && ' · '}
                    {r.pendingSign > 0 && `待签 ${r.pendingSign}`}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
              <span className="col-spv">
                {r.spv ? (
                  <span className={`admin-status-spv ${r.spv.status === 'operating' ? 'ok' : r.spv.status === 'establishing' ? 'pending' : 'closed'}`}>
                    {spvStatusLabels[r.spv.status] || r.spv.status}
                  </span>
                ) : r.pendingAlloc > 0 ? (
                  <span className="admin-status-spv pending">待设立</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
              <span className="col-date">{r.project.intentDeadline || '—'}</span>
              <span className="col-actions">
                {/* 操作列统一 btn-icon + tooltip（规范 §四 4.3） */}
                <button
                  className="btn-icon"
                  title={r.spv ? `查看 SPV 档案 · ${r.spv.spvName}` : '进入该项目处理申购'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (r.spv && navigate) navigate(`#admin/spvs/${r.spv.id}`);
                    else if (navigate) navigate(`#admin/subscriptions/${r.project.id}`);
                  }}
                >
                  {r.spv ? <Building2 size={16} /> : <ClipboardCheck size={16} />}
                </button>
              </span>
            </div>
          );
        })}
        {visibleRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的项目</span></div>
        )}
      </div>

      {/* 右侧抽屉：项目申购详情（项目汇总 + 申购明细行内操作 + waitlist 队列） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={exitLayer} />}
      {drawerOpen && selectedProject && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`项目申购 #${selectedProject.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">项目申购 #{selectedProject.id} · {selectedProject.title}</h3>
            <button className="btn-icon" title="关闭" onClick={goList}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {confirmMode ? (
              /* ---- 确认视图（资金动作二次确认） ---- */
              <div className="admin-confirm-view">
                <div className="admin-confirm-title">{confirmText?.title}</div>
                <p className="admin-confirm-desc">{confirmText?.desc}</p>
                {confirmSub && (
                  <div className="admin-confirm-row">
                    <span>意向金额</span>
                    <strong>{getCurrencySymbol(selectedProject.currency)} {formatCurrency(confirmSub.amount || 0)}</strong>
                  </div>
                )}
                {confirmSub && confirm.action === 'allocate' && (
                  <div className="admin-ev-form">
                    <div className="form-group">
                      <label className="form-label">实际配额金额（HKD）</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={allocQuota}
                        onChange={e => { setAllocQuota(e.target.value); setErrorMsg(''); }}
                      />
                      <p className="admin-form-hint">
                        默认按意向全额获配；超募时可削减（不可高于意向金额）。冻结、签署宽限期、扣款与份额换算均按此金额执行。
                      </p>
                    </div>
                    {Number(allocQuota) > 0 && Number(allocQuota) < (confirmSub.amount || 0) && (
                      <div className="admin-confirm-row admin-confirm-delta">
                        <span>超募削额</span>
                        <strong>
                          意向 HK$ {formatCurrency(confirmSub.amount || 0)} → 配额 HK$ {formatCurrency(Number(allocQuota))}
                          （削额 {Math.round((1 - Number(allocQuota) / (confirmSub.amount || 0)) * 100)}%）
                        </strong>
                      </div>
                    )}
                  </div>
                )}
                {confirmSub && confirm.action === 'forfeit' && (
                  <div className="admin-confirm-row">
                    <span>将解冻</span>
                    <strong>{getCurrencySymbol(selectedProject.currency)} {formatCurrency(confirmSub.frozenAmount || 0)}</strong>
                  </div>
                )}
                {confirmSub && confirm.action === 'sign' && (
                  <div className="admin-ev-form">
                    <div className="form-group">
                      <label className="form-label">第三方回执编号 <span className="required-mark">*</span></label>
                      <input
                        className="form-input"
                        placeholder="如 ENV-20260813-0001（第三方签署平台审计报告索引）"
                        value={evForm.envelopeId}
                        onChange={e => setEvForm(f => ({ ...f, envelopeId: e.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">实际签署时间 <span className="required-mark">*</span></label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={evForm.signedAt}
                          onChange={e => setEvForm(f => ({ ...f, signedAt: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">签署人</label>
                        <input
                          className="form-input"
                          value={evForm.signerName}
                          onChange={e => setEvForm(f => ({ ...f, signerName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <p className="admin-form-hint">协议版本/哈希由 SPV 档案锁定（签署时固化）；回执编号 = 第三方审计报告索引，监管质询可凭此调取完整证据链。</p>
                  </div>
                )}
                {errorMsg && <p className="form-error">{errorMsg}</p>}
              </div>
            ) : (
              <>
                {/* 项目汇总卡（待处理口径与列表一致，去完整状态分布） */}
                <div className="card admin-sub-summary">
                  <div className="admin-sub-summary-main">
                    <span className="text-muted text-sm">累计意向金额</span>
                    <strong className="admin-sub-summary-value">
                      {getCurrencySymbol(selectedProject.currency)} {formatCurrency(projSubs.reduce((s, x) => s + (x.amount || 0), 0) || 0)}
                    </strong>
                  </div>
                  <div className="admin-sub-summary-stats">
                    <span>共 {projSubs.length} 笔 · 已签 {projSubs.filter(s => s.status === 'signed').length}</span>
                    <span>
                      待处理：
                      <strong className="admin-sub-summary-pending">
                        {waiting.length > 0 && `待协调 ${waiting.length}`}
                        {waiting.length > 0 && allocatedCount > 0 && ' · '}
                        {allocatedCount > 0 && `待签 ${allocatedCount}`}
                        {waiting.length === 0 && allocatedCount === 0 && '—'}
                      </strong>
                    </span>
                  </div>
                  {/* SPV 状态（业务时序：先建档后签 SPV，签 SPV 必先有 SPV 档案） */}
                  <div className="admin-sub-summary-spv">
                    {(() => {
                      const projectSpv = spvs.find(s => s.projectId === selectedProject.id);
                      if (projectSpv) {
                        return (
                          <button
                            className="admin-sub-spv-link"
                            onClick={() => navigate(`#admin/spvs/${projectSpv.id}`)}
                            title="查看 SPV 档案"
                          >
                            <Building2 size={14} />
                            <span>SPV：{projectSpv.spvName}</span>
                            <span className={`admin-status-spv ${projectSpv.status === 'operating' ? 'ok' : projectSpv.status === 'establishing' ? 'pending' : 'closed'}`}>
                              {spvStatusLabels[projectSpv.status]}
                            </span>
                          </button>
                        );
                      }
                      if (allocatedCount > 0) {
                        return (
                          <button
                            className="admin-sub-spv-link pending"
                            onClick={() => navigate(`#admin/spvs`)}
                            title="前往 SPV 管理设立档案"
                          >
                            <Building2 size={14} />
                            <span>该项目尚未设立 SPV</span>
                            <span className="admin-status-spv pending">待设立</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {selectedProject.intentDeadline && (
                    <p className="text-muted text-sm admin-sub-deadline">意向截止 {selectedProject.intentDeadline}</p>
                  )}
                </div>

                {/* 申购明细（行内操作 + 确认态；submitted 行显示 FIFO 排队位次，替代独立 Waitlist 卡） */}
                <div className="card admin-sub-detail-list">
                  <div className="admin-sub-detail-head">
                    <span className="card-title no-margin admin-sub-detail-title">申购明细（{projSubs.length}）</span>
                    {waiting.length > 0 && <span className="admin-sub-detail-note">排队 {waiting.length} 位</span>}
                  </div>
                  {projSubs.map(s => {
                    const cur = getCurrencySymbol(selectedProject.currency);
                    const queuePos = waiting.findIndex(w => w.id === s.id);
                    const subSpv = spvs.find(x => x.projectId === s.projectId); // SPV 档案（协议引用收敛：一份协议对应整个 SPV）
                    return (
                      <div className="admin-sub-row" key={s.id}>
                        <div className="admin-sub-investor">
                          <strong>{maskName(s.investorName || s.investorNo)}</strong>
                          <span className="admin-sub-meta">
                            {s.investorNo}
                            {queuePos >= 0 && <em className="admin-sub-queue-tag">排队 #{queuePos + 1}</em>}
                          </span>
                          <span className="admin-sub-meta">单号 {s.orderNo}</span>
                          <span className="admin-sub-meta">顾问：{getManagerForUser(s.userId)?.name || '未分配'}</span>
                          <span className="admin-sub-meta">{formatListDateTime(s.createdAt)}</span>
                        </div>
                        <span className="admin-sub-amount">{cur} {formatCurrency(s.amount || 0)}</span>
                        <div className="admin-sub-actions">
                          {s.status === 'submitted' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                title="标记已获配额（自动冻结，进入签署宽限期；可调整实际配额）"
                                onClick={() => {
                                  setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'allocate' });
                                  setAllocQuota(String(s.amount || '')); // 预填意向全额，不想削额直接确认
                                  setErrorMsg('');
                                }}
                              >
                                获配
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                title="标记未获配额"
                                onClick={() => setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'unallocate' })}
                              >
                                未获
                              </button>
                            </>
                          )}
                          {s.status === 'allocated' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                title="用户已在第三方平台完成签署，录入回执并确认扣款生成持仓"
                                onClick={() => {
                                  setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'sign' });
                                  setEvForm({ envelopeId: '', signedAt: '', signerName: s.investorName || '' });
                                  setErrorMsg('');
                                }}
                              >
                                确认签署
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                title="标记未签 · 手动顺延（解冻 + waitlist 上位）"
                                onClick={() => setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'forfeit' })}
                              >
                                顺延
                              </button>
                            </>
                          )}
                          {s.status === 'signed' && (
                            <span className="admin-sub-shares">
                              {s.shares ? `${s.shares} 份` : '已签'}
                              {(subSpv?.agreementDocUrl || s.spvDocumentUrl) && (
                                <a
                                  className="admin-sub-doc"
                                  href={subSpv?.agreementDocUrl || s.spvDocumentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="SPV 签署凭证"
                                >
                                  <FileText size={13} />
                                </a>
                              )}
                            </span>
                          )}
                          {s.status === 'unallocated' && (
                            <span className="text-muted text-sm">本轮未获配额</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 确认态底部操作区（资金动作全加二次确认） */}
          {confirmMode && (
            <div className="admin-drawer-actions">
              <button className="btn btn-md btn-outline" onClick={() => setConfirm(null)}>取消</button>
              <button className="btn btn-md btn-primary" onClick={handleConfirm}>确认执行</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
