import { useState, useEffect } from 'react';
import { X, ClipboardCheck } from 'lucide-react';
import {
  projects,
  subscriptions,
  getProjectById,
  getProjectStageSlug,
  formatCurrency,
  formatListDateTime,
  getCurrencySymbol,
  markSubscriptionAllocated,
  markSubscriptionCompleted,
  markSubscriptionUnallocated,
  markSubscriptionForfeit,
  maskName,
  getManagerForUser,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 问卷状态 → 后台状态徽章修饰类（token 语义色）
const byTime = (a, b) => (a.createdAt || '').localeCompare(b.createdAt || '');

// 2026-10-22 RO 整改：后台「申购记录」→「问卷记录」——
//  · 去 SPV 概念（列、状态块、签署证据台账、SPV 档案跳转全部下线）
//  · 去卖方语义（获配/削额/冻结/待签/份额 → 转跟进/暂不推进/标记完成）
//  · 金额仅作客户经理沟通参考，不做额度分配
export default function AdminSubscriptions({ navigate, detailId, admin }) {
  const [items, setItems] = useState(subscriptions);
  const [confirm, setConfirm] = useState(null); // { projectId, subId?, action }
  const [filter, setFilter] = useState('all'); // all | pending | done
  const [errorMsg, setErrorMsg] = useState('');
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

  // ---- 项目维度列表统计 ----
  // 待处理 = 待跟进（submitted）+ 跟进中（allocated）——运营执行台核心：还有多少笔要我处理
  const projectRows = projects
    .filter(p => subscriptions.some(s => s.projectId === p.id))
    .map(p => {
      const subs = subscriptions.filter(s => s.projectId === p.id);
      const total = subs.reduce((s, x) => s + (x.amount || 0), 0);
      const pendingFollow = subs.filter(s => s.status === 'submitted').length;
      const following = subs.filter(s => s.status === 'allocated').length;
      return { project: p, subs, total, pendingFollow, following, pendingTotal: pendingFollow + following };
    });
  const visibleRows = filter === 'pending'
    ? projectRows.filter(r => r.pendingTotal > 0)
    : filter === 'done'
      ? projectRows.filter(r => r.pendingTotal === 0)
      : projectRows;

  // 页头统计（全平台口径）
  const pendingFollowCount = subscriptions.filter(s => s.status === 'submitted').length;
  const followingCount = subscriptions.filter(s => s.status === 'allocated').length;

  // ---- 操作执行（确认态 → 执行 → 退出确认 + 刷新） ----
  const handleConfirm = () => {
    if (!confirm) return;
    const { subId, action } = confirm;
    let res = null;
    if (action === 'allocate') res = markSubscriptionAllocated(subId, operator);
    else if (action === 'unallocate') res = markSubscriptionUnallocated(subId, '本次提交暂无进一步安排', operator);
    else if (action === 'complete') res = markSubscriptionCompleted(subId, null, operator);
    else if (action === 'forfeit') res = markSubscriptionForfeit(subId, undefined, operator);
    // 部分操作返回 { ok, error }，校验失败停留在确认视图 + 显示错误
    if (res && res.ok === false) {
      setErrorMsg(res.error);
      return;
    }
    setErrorMsg('');
    setConfirm(null);
    refresh();
  };

  // 确认视图文案（2026-10-22 RO 整改：去配额/签署/冻结语义）
  const confirmText = confirm ? (() => {
    switch (confirm.action) {
      case 'allocate':
        return { title: '转客户经理跟进', desc: `将 ${maskName(confirmSub?.investorName)} 的问卷转交客户经理跟进，意向金额仅作沟通参考，不做额度分配。确认执行？` };
      case 'unallocate':
        return { title: '标记暂无需推进', desc: `将标记 ${maskName(confirmSub?.investorName)} 本次提交暂无进一步安排（如后续有进一步意向可重新填写问卷）。确认执行？` };
      case 'complete':
        return { title: '标记完成', desc: `${maskName(confirmSub?.investorName)} 的相关事项已线下办结，标记为已完成。确认执行？` };
      case 'forfeit':
        return { title: '暂缓跟进', desc: `将 ${maskName(confirmSub?.investorName)} 的跟进暂缓，后续队列自动上位。确认执行？` };
      default: return { title: '确认操作', desc: '' };
    }
  })() : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>问卷记录</h1>
        <span className="text-muted admin-header-summary">
          共 {projectRows.length} 个项目 · 待跟进 {pendingFollowCount} 笔 · 跟进中 {followingCount} 笔
        </span>
      </div>

      {/* 筛选行：运营执行台 = 先看"今天要处理哪些项目" */}
      <div className="admin-filter-row">
        <button className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部</button>
        <button className={`admin-filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>待处理</button>
        <button className={`admin-filter-btn ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>已处理完</button>
      </div>

      {/* 项目维度全宽列表（点击行/操作"处理" → 抽屉查看该项目全部问卷） */}
      <div className="admin-table admin-table--subs">
        <div className="admin-table-header">
          <span className="col-name">项目</span>
          <span className="col-amount">累计意向档位</span>
          <span className="col-count">问卷笔数</span>
          <span className="col-pending">待处理</span>
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
                    {r.pendingFollow > 0 && `待跟进 ${r.pendingFollow}`}
                    {r.pendingFollow > 0 && r.following > 0 && ' · '}
                    {r.following > 0 && `跟进中 ${r.following}`}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
              <span className="col-date">{r.project.intentDeadline || '—'}</span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="进入该项目处理问卷"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigate) navigate(`#admin/subscriptions/${r.project.id}`);
                  }}
                >
                  <ClipboardCheck size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {visibleRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的项目</span></div>
        )}
      </div>

      {/* 右侧抽屉：项目问卷详情（项目汇总 + 问卷明细行内操作） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={exitLayer} />}
      {drawerOpen && selectedProject && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`项目问卷 #${selectedProject.id}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">项目问卷 #{selectedProject.id} · {selectedProject.title}</h3>
            <button className="btn-icon" title="关闭" onClick={goList}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {confirmMode ? (
              /* ---- 确认视图 ---- */
              <div className="admin-confirm-view">
                <div className="admin-confirm-title">{confirmText?.title}</div>
                <p className="admin-confirm-desc">{confirmText?.desc}</p>
                {confirmSub && (
                  <div className="admin-confirm-row">
                    <span>意向档位</span>
                    <strong>{(confirmSub.amount || 0) > 0 ? `${getCurrencySymbol(selectedProject.currency)} ${formatCurrency(confirmSub.amount || 0)}` : '无意向'}</strong>
                  </div>
                )}
                {errorMsg && <p className="form-error">{errorMsg}</p>}
              </div>
            ) : (
              <>
                {/* 项目汇总卡（待处理口径与列表一致） */}
                <div className="card admin-sub-summary">
                  <div className="admin-sub-summary-main">
                    <span className="text-muted text-sm">累计意向档位</span>
                    <strong className="admin-sub-summary-value">
                      {getCurrencySymbol(selectedProject.currency)} {formatCurrency(projSubs.reduce((s, x) => s + (x.amount || 0), 0) || 0)}
                    </strong>
                  </div>
                  <div className="admin-sub-summary-stats">
                    <span>共 {projSubs.length} 笔 · 已完成 {projSubs.filter(s => s.status === 'signed').length}</span>
                    <span>
                      待处理：
                      <strong className="admin-sub-summary-pending">
                        {waiting.length > 0 && `待跟进 ${waiting.length}`}
                        {waiting.length > 0 && allocatedCount > 0 && ' · '}
                        {allocatedCount > 0 && `跟进中 ${allocatedCount}`}
                        {waiting.length === 0 && allocatedCount === 0 && '—'}
                      </strong>
                    </span>
                  </div>
                  {selectedProject.intentDeadline && (
                    <p className="text-muted text-sm admin-sub-deadline">意向截止 {selectedProject.intentDeadline}</p>
                  )}
                </div>

                {/* 问卷明细（行内操作 + 确认态） */}
                <div className="card admin-sub-detail-list">
                  <div className="admin-sub-detail-head">
                    <span className="card-title no-margin admin-sub-detail-title">问卷明细（{projSubs.length}）</span>
                    {waiting.length > 0 && <span className="admin-sub-detail-note">待跟进 {waiting.length} 位</span>}
                  </div>
                  {projSubs.map(s => {
                    const cur = getCurrencySymbol(selectedProject.currency);
                    return (
                      <div className="admin-sub-row" key={s.id}>
                        <div className="admin-sub-investor">
                          <strong>{maskName(s.investorName || s.investorNo)}</strong>
                          <span className="admin-sub-meta">{s.investorNo}</span>
                          <span className="admin-sub-meta">单号 {s.orderNo}</span>
                          <span className="admin-sub-meta">顾问：{getManagerForUser(s.userId)?.name || '未分配'}</span>
                          <span className="admin-sub-meta">{formatListDateTime(s.createdAt)}</span>
                        </div>
                        <span className="admin-sub-amount">{(s.amount || 0) > 0 ? `${cur} ${formatCurrency(s.amount || 0)}` : '无意向'}</span>
                        <div className="admin-sub-actions">
                          {s.status === 'submitted' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                title="转客户经理跟进（意向金额仅作沟通参考，不做额度分配）"
                                onClick={() => {
                                  setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'allocate' });
                                  setErrorMsg('');
                                }}
                              >
                                转跟进
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                title="标记暂无需推进"
                                onClick={() => setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'unallocate' })}
                              >
                                暂不推进
                              </button>
                            </>
                          )}
                          {s.status === 'allocated' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                title="标记完成（线下事项已办结）"
                                onClick={() => {
                                  setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'complete' });
                                  setErrorMsg('');
                                }}
                              >
                                标记完成
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                title="暂缓跟进（后续队列自动上位）"
                                onClick={() => setConfirm({ projectId: selectedProject.id, subId: s.id, action: 'forfeit' })}
                              >
                                暂缓
                              </button>
                            </>
                          )}
                          {s.status === 'signed' && (
                            <span className="text-muted text-sm">已完成</span>
                          )}
                          {s.status === 'unallocated' && (
                            <span className="text-muted text-sm">暂无需推进</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 确认态底部操作区 */}
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
