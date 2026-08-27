import { useState, useEffect } from 'react';
import { X, Phone, Mail, Plus, Trash2, Calendar, History, Wrench, Eye } from 'lucide-react';
import {
  events, eventRegistrationsList,
  regLeadStatusLabels,
  updateClientLeadStatus,
  addCompanion, removeCompanion, maskName, maskPhone, maskEmail, getManagerForUser, accountManagers,
  getLeadClients, formatISODateTime,
} from '../mock/data';

/**
 * 活动报名 · 客户线索（2026-08-12 CRM 客户级最终版）
 * 数据模型：**客户是实体，报名是事件**——线索 = 客户（按账户 userId 聚合去重），
 *           每个客户一份跟进状态 + N 条报名明细；列表一行一个客户，抽屉看全部报名。
 * 长远设计：可扩展（活动下拉）/ 双主体（报名人 + 账户人）/ 专属顾问派生 / PDPO 全脱敏 /
 *           陪同人结构化（仅后台维护）/ 跟进 5 态（converted = 已提交申购意向）。
 */
export default function AdminRegistrations({ admin }) {
  const [regs, setRegs] = useState(eventRegistrationsList); // 本地刷新（驱动 getLeadClients 重新派生）
  const [selEvent, setSelEvent] = useState(''); // '' = 全部活动
  const [statusFilter, setStatusFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all'); // 管理角色归属筛选（顾问无此筛选用）
  const [selectedId, setSelectedId] = useState(null); // 选中客户 userId
  const [companionDraft, setCompanionDraft] = useState({ name: '', phone: '', email: '' });
  const [opExpanded, setOpExpanded] = useState(false); // 操作区折叠（2026-08-12 审查：低频操作不常驻 612px）
  const [page, setPage] = useState(1); // 分页
  // 分页每页条数 = 一屏放得下的最大值（2026-08-13 动态计算：任何视口恰好一屏，
  // 固定开销 315px = 页头 74 + 筛选行 68 + 表头 47 + 分页 78 + 底部余量 ~48，行高 81；
  // 固定值只服务单一视口——矮视口溢出、高视口浪费，动态计算与"列宽弹性"同理）
  const PAGE_SIZE = Math.max(3, Math.floor(((typeof window !== 'undefined' ? window.innerHeight : 900) - 315) / 81));

  const refresh = () => setRegs([...eventRegistrationsList]);
  const allClients = getLeadClients(); // 按 userId 聚合的客户线索（客户 = 实体）

  const leadStatusOf = c => c.leadStatus || 'new';
  const isPendingLead = c => !['converted', 'paused'].includes(leadStatusOf(c));

  /* ---- 角色视图（2026-08-13 第一性原理：客户分散给各顾问跟进）----
     advisor（专属顾问）：只看归属自己的客户（工作台语义，隐私 + 聚焦 + 防抢单）
     super/ops（管理）：全量 + 归属筛选（谁负责谁 + 未分配） */
  const isAdvisor = admin?.role === 'advisor';
  const myManagerId = isAdvisor ? admin.managerId : null;
  const clients = isAdvisor
    ? allClients.filter(c => getManagerForUser(c.userId)?.id === myManagerId)
    : allClients;

  /* ---- 活动选择：默认全部活动；optgroup 进行中 / 往期 ---- */
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'past');

  /* ---- 客户过滤：报名了所选活动 + 归属顾问 + 跟进状态；待跟进优先排序 ---- */
  const clientList = selEvent ? clients.filter(c => c.regs.some(r => r.eventId === selEvent)) : clients;
  const byManager = managerFilter === 'all'
    ? clientList
    : managerFilter === 'none'
      ? clientList.filter(c => !getManagerForUser(c.userId))
      : clientList.filter(c => getManagerForUser(c.userId)?.id === managerFilter);
  const filtered = statusFilter === 'all'
    ? byManager
    : byManager.filter(c => leadStatusOf(c) === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    const pa = isPendingLead(a) ? 0 : 1;
    const pb = isPendingLead(b) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return String(b.latestAt || '').localeCompare(String(a.latestAt || ''));
  });

  const totalClients = clients.length;
  const totalPending = clients.filter(isPendingLead).length;
  /* 分页切片：每页 10 条；页码越界兜底（筛选后行数变化时 page 可能超界） */
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selected = sorted.find(c => c.userId === selectedId) || clients.find(c => c.userId === selectedId) || null;
  const companions = selected ? selected.companions : [];

  const closeDrawer = () => { setSelectedId(null); setCompanionDraft({ name: '', phone: '', email: '' }); setOpExpanded(false); };

  /* 抽屉打开：锁定背景滚动 + Esc 关闭（AntD Drawer 惯例，对齐 Projects/Events 抽屉） */
  const drawerOpen = !!selected;
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
  }, [drawerOpen]);

  const doAddCompanion = () => {
    if (!selected || !companionDraft.name.trim()) return;
    // 追加到该客户最近一条报名（陪同人关联报名记录）
    const latestReg = [...selected.regs].sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))[0];
    if (!latestReg) return;
    addCompanion(latestReg.id, companionDraft);
    setCompanionDraft({ name: '', phone: '', email: '' });
    refresh();
  };
  const doRemoveCompanion = (regId, index) => {
    removeCompanion(regId, index);
    refresh();
  };

  // 跟进状态权限：客户专属顾问或超级管理员可直接改；其他操作人需确认（CRM 语义：跟进是专属顾问的工作）
  const canChangeLead = (c) => {
    if (!admin) return false;
    if (admin.role === 'super') return true; // 管理者可改全部
    const m = getManagerForUser(c.userId);
    if (isAdvisor && m && m.id === myManagerId) return true; // 专属顾问本人可直接改自己的客户
    return !!m && m.name === admin.name; // 其他角色：归属顾问本人（名字匹配兜底）
  };
  const changeLeadStatus = (c, status) => {
    if (leadStatusOf(c) === status) return;
    if (canChangeLead(c)) {
      updateClientLeadStatus(c.userId, status, '', admin?.name || '');
      refresh();
      return;
    }
    const m = getManagerForUser(c.userId);
    const owner = m ? `（专属顾问：${m.name}）` : '（未分配专属顾问）';
    if (window.confirm(`该客户跟进状态由专属顾问维护，您不是其专属顾问${owner}，确认更改？`)) {
      updateClientLeadStatus(c.userId, status, '', admin?.name || '');
      refresh();
    }
  };

  const statusBadge = (s) => (
    <span className={`status-badge admin-lead-${s}`}>{regLeadStatusLabels[s] || s}</span>
  );

  // 报名明细按时间倒序
  const regsDesc = selected
    ? [...selected.regs].sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
    : [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>活动报名 · 客户线索</h1>
        <span className="text-muted admin-header-summary">
          {isAdvisor ? `我的客户 ${totalClients} · 待跟进 ${totalPending}` : `共 ${totalClients} 个客户 · 待跟进 ${totalPending}`}
        </span>
      </div>

      {/* 筛选工具条：跟进（左·高频主筛选）+ 活动/归属（右·低频辅助维度）——2026-08-13 第一性原理：
          3 行垂直堆叠占 ~200px 首屏、列表每页 5 条被推挤，合并一行回收纵向空间；
          按筛选频率分层：高频跟进在左（阅读起点），低频下拉 margin-left:auto 右对齐成组；
          无 label——选项文案自解释维度；flex-wrap 兜底窄屏自动降行 */}
      <div className="admin-filter-row">
        {/* 跟进状态筛选（5 态 · 销售漏斗，客户级）——左 · 高频主筛选 */}
        <div className="admin-filter-group">
          <button className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => { setStatusFilter('all'); setPage(1); }}>全部</button>
        {Object.entries(regLeadStatusLabels).map(([key, label]) => (
          <button key={key} className={`admin-filter-btn ${statusFilter === key ? 'active' : ''}`} onClick={() => { setStatusFilter(key); setPage(1); }}>
            {label}
          </button>
          ))}
        </div>

        {/* 活动 + 归属（右 · 低频辅助维度，margin-left:auto 右对齐成组） */}
        <div className="admin-filter-group admin-filter-group--right">
          <select className="form-input admin-reg-filter" value={selEvent} onChange={e => { setSelEvent(e.target.value); setSelectedId(null); setPage(1); }}>
          <option value="">全部活动</option>
          {upcomingEvents.length > 0 && (
            <optgroup label="进行中路演">
              {upcomingEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </optgroup>
          )}
          {pastEvents.length > 0 && (
            <optgroup label="往期路演">
              {pastEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </optgroup>
          )}
        </select>
        </div>

        {/* 归属顾问筛选（管理角色专属：定位某顾问的客户 / 未分配客户；顾问只看自己的无需筛选） */}
        {!isAdvisor && (
          <div className="admin-filter-group">
            <select className="form-input admin-reg-filter" value={managerFilter} onChange={e => { setManagerFilter(e.target.value); setPage(1); }}>
            <option value="all">全部顾问</option>
            {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="none">未分配</option>
            </select>
          </div>
        )}

      </div>

      {/* 客户名单表格（按账户去重 · 姓名/手机/邮箱全脱敏 PDPO） */}
      <div className="admin-table admin-table--leads">
        <div className="admin-table-header">
          <span className="col-name">客户</span>
          <span className="col-contact">联系方式</span>
          <span className="col-count">报名</span>
          <span className="col-date">最近报名</span>
          <span className="col-manager">专属顾问</span>
          <span className="col-status">跟进</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(c => {
          const m = getManagerForUser(c.userId);
          return (
            <div key={c.userId} className="admin-table-row" role="button" tabIndex={0}
              onClick={() => setSelectedId(c.userId)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(c.userId); } }}>
              <span className="col-name">
                <strong>{maskName(c.name)}</strong>
                <span className="text-muted text-sm">{c.investorNo}</span>
              </span>
              <span className="col-contact">
                <span className="admin-lead-phone">{maskPhone(c.phone)}</span>
                <span className="text-muted text-sm">{maskEmail(c.email)}</span>
              </span>
              <span className="col-count">{c.eventCount} 场</span>
              <span className="col-date">{c.latestAt ? formatISODateTime(c.latestAt).slice(0, 16) : '—'}</span>
              <span className="col-manager">{m ? m.name : <span className="text-muted">—</span>}</span>
              <span className="col-status">{statusBadge(leadStatusOf(c))}</span>
              <span className="col-actions">
                {/* 操作列统一 btn-icon + tooltip（规范 §四 4.3） */}
                <button className="btn-icon" title="查看客户线索详情" onClick={() => setSelectedId(c.userId)}>
                  <Eye size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无报名客户</span></div>
        )}
      </div>

      {/* 分页：每页 10 条，页码 + 上下页（保证顶部筛选/表头随时可见） */}
      {sorted.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage} / {totalPages} 页 · 共 {sorted.length} 个客户</span>
          <button className="admin-page-btn" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页 ›</button>
        </div>
      )}

      {/* 右侧抽屉：客户线索详情（授权查看全量联系方式 + 全部报名明细） */}
      {selected && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {selected && (
        <div className="admin-drawer admin-drawer--lead" role="dialog" aria-label="客户线索详情">
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">{selected.name} · {selected.investorNo}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {/* ═══ 信息区（纯只读：身份 / 价值 / 历史）═══ */}
            {/* 身份与联系（最新报名为准） */}
            <div className="card kyc-review-block">
              <h4 className="card-title">身份与联系</h4>
              <div className="admin-reg-contact">
                <span className="admin-reg-contact-item"><Phone size={15} /><strong className="date-iso">{selected.phone}</strong></span>
                <span className="admin-reg-contact-item"><Mail size={15} /><span>{selected.email}</span></span>
              </div>
              <div className="kyc-review-row"><span>账户人（KYC）</span><strong className="date-iso">{selected.investorNo}</strong></div>
            </div>

            {/* 全部报名明细（客户是实体，报名是事件）——兴趣信号 */}
            <div className="card kyc-review-block">
              <h4 className="card-title">报名明细（{selected.eventCount}）</h4>
              <div className="admin-reg-history">
                {regsDesc.map(r => (
                  <div key={r.id} className="admin-reg-history-row">
                    <div>
                      <strong><Calendar size={14} /> {r.eventName}</strong>
                      <span className="text-muted text-sm">{formatISODateTime(r.registeredAt)} · {1 + (r.accompanying || 0)} 人</span>
                    </div>
                    <span className="text-muted text-sm">{events.find(e => e.id === r.eventId)?.type === 'offline' ? (r.status === 'checked-in' ? '已签到' : '未签到') : '线上'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 跟进记录（CRM 留痕：谁、何时、通过什么方式、聊了什么——状态是快照，动作是历史） */}
            <div className="card kyc-review-block">
              <h4 className="card-title">跟进记录（{selected.followups.length}）</h4>
              {selected.followups.length > 0 ? (
                <div className="admin-reg-history admin-followup-log">
                  {selected.followups.map(f => (
                    <div key={f.id} className="admin-reg-history-row">
                      <div>
                        <strong><History size={14} /> {regLeadStatusLabels[f.from] || f.from} → {regLeadStatusLabels[f.to] || f.to}</strong>
                        <span className="text-muted text-sm">
                          {f.operator} · {formatISODateTime(f.at).slice(0, 16)}
                        </span>
                        {f.note ? <span className="admin-followup-note">{f.note}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-form-hint">暂无跟进记录（改状态即自动留痕）。</p>
              )}
            </div>

            {/* ═══ 操作区（可编辑：跟进 + 陪同人；默认折叠，低频操作不常驻空间）═══ */}
            <div className="admin-drawer-action-zone">
              <button className="admin-drawer-action-toggle" onClick={() => setOpExpanded(o => !o)} aria-expanded={opExpanded}>
                <Wrench size={13} /> 跟进操作
                <span className={`admin-drawer-action-chevron ${opExpanded ? 'open' : ''}`}>›</span>
              </button>
              {opExpanded && (
                <>
                  {/* 跟进操作：客户级状态机（改一次联动该客户全部报名，自动写入跟进日志） */}
                  <div className="card kyc-review-block">
                    <h4 className="card-title">跟进状态</h4>
                    <div className="form-group">
                      <div className="admin-lead-status-actions">
                        {Object.entries(regLeadStatusLabels).map(([key, label]) => (
                          <button
                            key={key}
                            className={`admin-filter-btn ${leadStatusOf(selected) === key ? 'active' : ''}`}
                            onClick={() => changeLeadStatus(selected, key)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="admin-form-hint">已转化 = 客户已提交申购意向（与「申购记录」联动）。</p>
                    </div>
                  </div>

                  {/* 陪同人（仅后台维护：姓名 + 可选联系方式；陪同人也是潜在客户） */}
                  <div className="card kyc-review-block">
                    <h4 className="card-title">陪同人（{companions.length}）</h4>
                    {companions.length > 0 ? (
                      <div className="admin-reg-history">
                        {companions.map((c, i) => (
                          <div key={i} className="admin-reg-history-row">
                            <div>
                              <strong>{c.name}</strong>
                              <span className="text-muted text-sm">{c.phone || '未填电话'}{c.email ? ` · ${c.email}` : ''}</span>
                            </div>
                            {/* 定位所在报名记录以移除（同客户可能有多个报名各带陪同人） */}
                            {(() => {
                              const holder = selected.regs.find(r => (r.companions || []).some(x => x.name === c.name));
                              return holder ? (
                                <button className="btn-icon" title="移除陪同人" onClick={() => doRemoveCompanion(holder.id, (holder.companions || []).findIndex(x => x.name === c.name))}>
                                  <Trash2 size={15} />
                                </button>
                              ) : null;
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-form-hint">无陪同人记录。</p>
                    )}
                    <div className="admin-companion-form">
                      <div className="admin-companion-add">
                        <input
                          className="form-input"
                          placeholder="陪同人姓名（必填）"
                          value={companionDraft.name}
                          onChange={e => setCompanionDraft(d => ({ ...d, name: e.target.value }))}
                        />
                        <button className="btn btn-md btn-outline" onClick={doAddCompanion}><Plus size={15} /> 添加</button>
                      </div>
                      <div className="admin-companion-add">
                        <input
                          className="form-input"
                          placeholder="电话（可选）"
                          value={companionDraft.phone}
                          onChange={e => setCompanionDraft(d => ({ ...d, phone: e.target.value }))}
                        />
                        <input
                          className="form-input"
                          placeholder="邮箱（可选）"
                          value={companionDraft.email}
                          onChange={e => setCompanionDraft(d => ({ ...d, email: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doAddCompanion(); } }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
