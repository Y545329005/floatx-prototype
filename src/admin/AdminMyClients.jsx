import { useState, useEffect } from 'react';
import { Eye, X, Search, UserCheck, ShieldCheck, Wallet, History, Plus, Trash2, Calendar, HeartHandshake, CreditCard } from 'lucide-react';
import {
  getInvestorUsers, getClientTasks,
  kycSubmissions, testAccounts, subscriptions, eventRegistrationsList,
  exitEvents, depositRequests, withdrawRequests, holdings, bankCards,
  KYC_STATUS, PI_STATUS, formatCurrency, formatISODateTime,
  regLeadStatusLabels, updateClientLeadStatus, getLeadClients, addCompanion, removeCompanion,
  accountManagers,
} from '../mock/data';

/**
 * 我的客户（2026-08-15 · 专属顾问工作视图 · 方案 A）
 * 第一性原理：顾问的工作单元 = 客户（人），不是模块（数据）。
 *   - 客户从线索 → 申购 → 中标 → 签 SPV → 持仓 → 退出，分散在 6 个业务实体；
 *   - 此前顾问只能看「报名管理」（线索段），客户进入投前/投后阶段后顾问完全不可见 = 服务断点；
 *   - 本页 = 名下客户列表 + 顾问待办聚合（待跟进[待联系/跟进中] + 待签 SPV[含冻结到期提示]）+ 客户详情。
 *   - 任务列语义 = 顾问待办（2026-08-15 方案 A）：只列顾问要做的动作；资金/退出审批由运营/合规处理，非顾问任务（记录 tab 中性展示）。
 * 权限边界：数据范围天然限定 managerId === admin.managerId（单一真源 userAccountManagers），零越权。
 * 职责边界：只读档案 + 顾问可操作（跟进状态/陪同人）；审核类（获配/顺延/审批/禁用）保持运营/合规职责。
 * 脱敏策略（2026-08-15 方案 A）：本页 = 顾问联系工作台，列表**全量**展示（完整姓名/手机/邮箱）——
 *   顾问是客户已授权的专属服务人员，完整联系方式 = 履行职责必需数据（PDPO 数据最小化的正当理由）；
 *   泄密风险靠范围限定（managerId 零越权）+ 审计留痕防，不靠列表脱敏。
 *   对比 AdminUsers（用户管理，列表脱敏）：消费者不同——super/compliance 是管理/审计非联系客户。
 */
const kycMeta = {
  [KYC_STATUS.APPROVED]: { label: '已通过', cls: 'admin-status-approved' },
  [KYC_STATUS.PENDING_REVIEW]: { label: '待审核', cls: 'admin-status-pending' },
  [KYC_STATUS.REQUIRES_ACTION]: { label: '需补件', cls: 'admin-status-requires' },
  [KYC_STATUS.REJECTED]: { label: '已拒绝', cls: 'admin-status-rejected' },
  [KYC_STATUS.NOT_STARTED]: { label: '未开始', cls: 'admin-status-unallocated' },
  [KYC_STATUS.IN_PROGRESS]: { label: '进行中', cls: 'admin-status-unallocated' },
  [KYC_STATUS.EXPIRED]: { label: '已过期', cls: 'admin-status-unallocated' },
};
const piMeta = {
  [PI_STATUS.APPROVED]: { label: '已认证', cls: 'admin-status-approved' },
  [PI_STATUS.PENDING_REVIEW]: { label: '待审核', cls: 'admin-status-pending' },
  [PI_STATUS.REJECTED]: { label: '已拒绝', cls: 'admin-status-rejected' },
  [PI_STATUS.EXPIRED]: { label: '已过期', cls: 'admin-status-requires' },
  [PI_STATUS.NOT_SUBMITTED]: { label: '未申报', cls: 'admin-status-unallocated' },
};

// 跟进状态筛选（5 态 + 全部 + 有任务）——顾问日常：今天要处理什么（有任务优先）
const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'task', label: '有任务' },
  ...Object.entries(regLeadStatusLabels).map(([key, label]) => ({ key, label })),
];

// 每页条数 = 一屏放得下（动态计算，对齐 AdminRegistrations）
const PAGE_SIZE = Math.max(3, Math.floor(((typeof window !== 'undefined' ? window.innerHeight : 900) - 315) / 81));

// 任务徽章（彩色文字模式，对齐全后台状态徽章）
const TaskBadge = ({ text, kind }) => (
  <span className={`admin-task-badge admin-task-${kind}`}>{text}</span>
);

export default function AdminMyClients({ navigate, detailId, admin }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all'); // 管理角色归属筛选（advisor 无需，天然限定）
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('profile'); // profile 资料 | assets 资产 | records 记录 | followup 跟进
  const [opExpanded, setOpExpanded] = useState(false);
  const [companionDraft, setCompanionDraft] = useState({ name: '', phone: '', email: '' });

  // 角色视图（2026-08-15：super 最高权限开放「我的客户」——管理角色看全量 + 归属筛选，对齐报名管理模式）
  //   advisor（专属顾问）：只看归属自己的客户（managerId 天然限定，零越权）
  //   super（最高权限）：全量 + 归属顾问筛选（谁负责谁 / 未分配）
  const isAdvisor = admin?.role === 'advisor';
  const baseUsers = getInvestorUsers();
  const byManager = isAdvisor
    ? baseUsers.filter(u => u.managerId === admin?.managerId)
    : managerFilter === 'all' ? baseUsers
      : managerFilter === 'none' ? baseUsers.filter(u => !u.managerId)
        : baseUsers.filter(u => u.managerId === managerFilter);
  void refreshTick; // 跟进状态变更后触发重渲染（数据层直接 mutate，组件需 setState 刷新）

  const tasksOf = (u) => getClientTasks(u.userId);
  // 最近报名时间（CRM 兴趣信号；无报名 → null）
  const latestRegAtOf = (uid) => {
    const ts = eventRegistrationsList.filter(r => r.userId === uid).map(r => r.registeredAt);
    return ts.length ? ts.sort().pop() : null;
  };

  // 筛选：搜索（姓名/手机/邮箱/编号）+ 跟进状态 / 有任务
  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const matches = (u) =>
    (u.name || '').toLowerCase().includes(kw)
    || (u.phone || '').toLowerCase().includes(kw)
    || (u.email || '').toLowerCase().includes(kw)
    || (u.investorNo || '').toLowerCase().includes(kw);
  const filtered = byManager.filter(u => {
    if (isSearching) return matches(u);
    const t = tasksOf(u);
    if (statusFilter === 'task') return t.hasTask;
    if (statusFilter === 'all') return true;
    return (t.leadStatus || 'new') === statusFilter;
  });
  // 待办优先排序（2026-08-15 方案 A：顾问第一眼看到最紧急的）
  //   一级：任务紧迫度（待签 SPV > 待联系 > 跟进中 > 无任务）
  //   二级：最近报名时间降序（兴趣信号）
  const urgencyOf = (u) => {
    const t = tasksOf(u);
    if (t.pendingSign > 0) return 0;                      // 待签 SPV
    if (t.pendingLead > 0) return t.leadStatus === 'new' ? 1 : 2; // 待联系 / 跟进中
    return 3;                                             // 无任务
  };
  const sorted = [...filtered].sort((a, b) => {
    const ua = urgencyOf(a), ub = urgencyOf(b);
    if (ua !== ub) return ua - ub;
    return String(b.registeredAt || '').localeCompare(String(a.registeredAt || ''));
  });

  const totalClients = byManager.length;
  const totalPending = byManager.filter(u => tasksOf(u).pendingLead).length;
  const totalSign = byManager.filter(u => tasksOf(u).pendingSign).length;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const switchFilter = (key) => { setStatusFilter(key); setPage(1); };
  const switchManager = (key) => { setManagerFilter(key); setPage(1); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  // 抽屉 URL 化：selected 由 detailId（URL param2）驱动，刷新/分享保留
  const sel = detailId ? byManager.find(u => u.userId === detailId) : null;
  const drawerOpen = !!sel;
  const goList = () => { if (navigate) navigate('#admin/my-clients'); };
  const closeDrawer = () => { setOpExpanded(false); setCompanionDraft({ name: '', phone: '', email: '' }); goList(); };

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

  // 切换客户时重置操作区状态（防残留）
  useEffect(() => {
    setTab('profile'); setOpExpanded(false); setCompanionDraft({ name: '', phone: '', email: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId]);

  // 抽屉数据（复用 AdminUsers 账户全貌逻辑，只读展示）
  const selProfile = sel ? (() => {
    const k = kycSubmissions.find(x => x.userId === sel.userId);
    if (k && k.profile) return k.profile;
    const a = Object.values(testAccounts).find(x => x.id === sel.userId);
    return a?.kyc_profile || null;
  })() : null;
  const selSubs = sel ? subscriptions.filter(s => s.userId === sel.userId) : [];
  const selRegs = sel ? eventRegistrationsList.filter(r => r.userId === sel.userId) : [];
  const selFunds = sel ? [
    // 退出分配事件（SPV 级无 userId，mock 单客户视角全量展示，2026-08-21 重构）
    ...exitEvents.map(ev => ({ ...ev, kind: 'exit' })),
    ...depositRequests.filter(r => r.userId === sel.userId).map(r => ({ ...r, kind: 'deposit' })),
    ...withdrawRequests.filter(r => r.userId === sel.userId).map(r => ({ ...r, kind: 'withdraw' })),
  ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')) : [];
  const selKyc = sel ? kycSubmissions.find(x => x.userId === sel.userId) : null;
  const kycSubmittedAt = selKyc?.submittedAt || null;
  const kycHandledAt = (() => {
    const acted = [...(selKyc?.history || [])].reverse().find(x => x.action !== 'submitted');
    return acted ? acted.at : null;
  })();
  const selHeld = sel && sel.holdingCount > 0 ? holdings : [];
  const selBankCards = sel ? bankCards.filter(c => c.userId === sel.userId) : [];
  // 跟进：线索状态 + 记录时间轴（getLeadClients 派生）
  const selLead = sel ? getLeadClients().find(c => c.userId === sel.userId) : null;
  const selTasks = sel ? tasksOf(sel) : null;
  const selFollowups = selLead?.followups || [];
  const companions = selLead?.companions || [];
  const telHref = (phone) => phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '#';

  const fundLabel = (f) => {
    if (f.kind === 'exit') return `退出分配 ${f.projectName || ''}`;
    if (f.kind === 'deposit') return `入金 HK$ ${formatCurrency(f.amount)}`;
    return `提现 HK$ ${formatCurrency(f.amount)}`;
  };
  const fundStatus = (f) => {
    if (f.kind === 'exit') {
      // 退出分配状态机：announced/paying/completed（2026-08-21 重构）
      if (f.status === 'announced') return { text: '待确认', cls: 'admin-status-pending' };
      if (f.status === 'paying') return { text: '打款中', cls: 'admin-status-pending' };
      return { text: '已到账', cls: 'admin-status-approved' };
    }
    if (f.status === 'rejected') return { text: '已拒绝', cls: 'admin-status-rejected' };
    if (f.status === 'approved') {
      const t = f.kind === 'deposit' ? '已到账' : '已打款';
      return { text: t, cls: 'admin-status-approved' };
    }
    return { text: '待审核', cls: 'admin-status-pending' };
  };
  const fundMeta = (f) => {
    const parts = [f.createdAt];
    if (f.kind === 'exit' && f.netAmount != null) parts.push(`净回款 HK$ ${formatCurrency(f.netAmount)}`);
    else if (f.amount != null && f.kind !== 'exit') parts.push(`HK$ ${formatCurrency(f.amount)}`);
    if (f.handledBy) parts.push(f.handledBy);
    return parts.join(' · ');
  };

  // 跟进状态：本页全是顾问名下客户，直接改（无需 confirm——顾问本人维护自己的客户）
  const changeLeadStatus = (uid, status) => {
    updateClientLeadStatus(uid, status, '', admin?.name || '');
    setRefreshTick(t => t + 1);
  };
  const doAddCompanion = () => {
    if (!selLead || !companionDraft.name.trim()) return;
    const latestReg = [...(selLead?.regs || [])].sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))[0];
    if (!latestReg) return;
    addCompanion(latestReg.id, companionDraft);
    setCompanionDraft({ name: '', phone: '', email: '' });
    setRefreshTick(t => t + 1);
  };
  const doRemoveCompanion = (regId, index) => {
    removeCompanion(regId, index);
    setRefreshTick(t => t + 1);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>我的客户</h1>
        <span className="admin-header-summary">
          {isAdvisor ? `共 ${totalClients} 位客户 · ` : `全部客户 ${totalClients} 位 · `}待跟进 {totalPending} · 待签 SPV {totalSign}
        </span>
      </div>

      {/* 视图控制行：跟进状态筛选（左）+ 归属筛选（管理角色）+ 搜索（右） */}
      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${statusFilter === f.key && !isSearching ? 'active' : ''}`}
              onClick={() => switchFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          {/* 归属顾问筛选（管理角色专属：定位某顾问的客户 / 未分配客户；advisor 只看自己的无需筛选） */}
          {!isAdvisor && (
            <select
              className="form-input admin-reg-filter"
              value={managerFilter}
              onChange={e => switchManager(e.target.value)}
            >
              <option value="all">全部顾问</option>
              {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              <option value="none">未分配</option>
            </select>
          )}
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索姓名 / 手机 / 邮箱 / 编号"
            placeholder="搜索姓名 / 手机 / 邮箱 / 编号"
            value={keyword}
            onChange={e => onSearchChange(e.target.value)}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => onSearchChange('')}><X size={16} /></button>
          )}
        </div>
      </div>

      {/* 全宽列表（顾问名下客户；列表全量 = 联系工作台，范围已限定 managerId） */}
      <div className="admin-table admin-table--my-clients">
        <div className="admin-table-header">
          <span className="col-name">客户</span>
          <span className="col-cert">认证</span>
          <span className="col-tasks">任务</span>
          <span className="col-contact">联系方式</span>
          <span className="col-date">最近报名</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(u => {
          const km = kycMeta[u.kycStatus] || kycMeta[KYC_STATUS.NOT_STARTED];
          const pm = piMeta[u.piStatus] || piMeta[PI_STATUS.NOT_SUBMITTED];
          const t = tasksOf(u);
          return (
            <div key={u.userId} className="admin-table-row" role="button" tabIndex={0}
              onClick={() => { if (navigate) navigate(`#admin/my-clients/${u.userId}`); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (navigate) navigate(`#admin/my-clients/${u.userId}`); } }}>
              <span className="col-name">
                <strong>{u.name}</strong>
                <span className="col-name-sub">{u.investorNo}</span>
              </span>
              <span className="col-cert">
                <span className={`status-badge ${km.cls}`}>{km.label}</span>
                <span className={`status-badge ${pm.cls}`}>{pm.label}</span>
              </span>
              <span className="col-tasks">
                {t.pendingLead > 0 && <TaskBadge kind="lead" text={t.leadStatus === 'new' ? '待联系' : '跟进中'} />}
                {t.pendingSign > 0 && <TaskBadge kind="sign" text={`待签 SPV ${t.pendingSign}`} />}
              </span>
              <span className="col-contact">
                <span className="admin-lead-phone">{u.phone}</span>
                <span className="text-muted text-sm">{u.email}</span>
              </span>
              <span className="col-date">{(() => { const d = latestRegAtOf(u.userId); return d ? formatISODateTime(d).slice(0, 16) : '—'; })()}</span>
              <span className="col-actions">
                <button className="btn-icon" title="查看客户详情" onClick={(e) => { e.stopPropagation(); if (navigate) navigate(`#admin/my-clients/${u.userId}`); }}>
                  <Eye size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">{isSearching ? '未找到匹配客户' : (isAdvisor ? '名下暂无客户' : '暂无符合条件的客户')}</span></div>
        )}
      </div>

      {/* 分页（每页一屏） */}
      {sorted.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {sorted.length} 位客户</span>
          <button className="admin-page-btn" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页 ›</button>
        </div>
      )}

      {/* 右侧抽屉：客户详情（账户全貌 + 跟进操作；顾问授权查看全量） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && sel && (
        <div className="admin-drawer admin-drawer--my-client" role="dialog" aria-label={`客户 ${sel.name}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">
              <HeartHandshake size={15} /> {sel.name} <span className="text-muted">· {sel.investorNo}</span>
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-tabs admin-drawer-tabs">
            <button className={`admin-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>资料</button>
            <button className={`admin-tab ${tab === 'assets' ? 'active' : ''}`} onClick={() => setTab('assets')}>资产</button>
            <button className={`admin-tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>记录</button>
            <button className={`admin-tab ${tab === 'followup' ? 'active' : ''}`} onClick={() => setTab('followup')}>跟进</button>
          </div>
          <div className="admin-drawer-body">
            {/* Tab1 资料 */}
            {tab === 'profile' && (
              <>
                <div className="card kyc-review-block">
                  <h4 className="card-title"><UserCheck size={14} /> 账户信息</h4>
                  <div className="admin-user-info-grid">
                    <div className="admin-user-info-item"><span>姓名</span><strong>{sel.name}</strong></div>
                    <div className="admin-user-info-item"><span>英文名</span><strong>{selProfile?.fullNameEn || '—'}</strong></div>
                    <div className="admin-user-info-item"><span>性别</span><strong>{selProfile?.gender === 'M' ? '男' : selProfile?.gender === 'F' ? '女' : '—'}</strong></div>
                    <div className="admin-user-info-item"><span>出生日期</span><strong>{selProfile?.birthDate || '—'}</strong></div>
                    <div className="admin-user-info-item"><span>国籍</span><strong>{selProfile?.nationality || '—'}</strong></div>
                    <div className="admin-user-info-item"><span>手机号</span>{sel.phone ? <strong><a className="admin-user-link" href={telHref(sel.phone)} title="拨打电话">{sel.phone}</a></strong> : <strong>—</strong>}</div>
                    <div className="admin-user-info-item"><span>邮箱</span>{sel.email ? <strong><a className="admin-user-link admin-user-info-ellipsis" href={`mailto:${sel.email}`} title="发送邮件">{sel.email}</a></strong> : <strong>—</strong>}</div>
                    <div className="admin-user-info-item"><span>注册时间</span><strong>{sel.registeredAt || '—'}</strong></div>
                    <div className="admin-user-info-item"><span>账户状态</span><strong className={sel.disabled ? 'text-danger' : ''}>{sel.disabled ? '已禁用（风控冻结）' : '正常'}</strong></div>
                  </div>
                </div>
                <div className="card kyc-review-block">
                  <h4 className="card-title"><CreditCard size={14} /> 银行卡（{selBankCards.length}）</h4>
                  {selBankCards.length > 0 ? selBankCards.map(c => (
                    <div className="admin-bank-card-item" key={c.id}>
                      <div className="admin-bank-card-bank-row">
                        <span className="admin-bank-card-bank">{c.bank}</span>
                        {c.branch && <span className="admin-bank-card-branch">{c.branch}</span>}
                      </div>
                      <div className="admin-bank-card-no-row">
                        <span className="admin-bank-card-no" title={c.maskedNo}>{c.maskedNo}</span>
                        <span className="admin-bank-card-currency">{c.currency}</span>
                      </div>
                    </div>
                  )) : <div className="text-muted text-sm">暂未绑定银行卡</div>}
                </div>
                <div className="card kyc-review-block admin-kyc-review-tight">
                  <h4 className="card-title"><ShieldCheck size={14} /> 认证状态</h4>
                  <div className="kyc-review-double-row">
                    <div className="kyc-review-row"><span>KYC 认证</span><strong className="admin-status-text">{(kycMeta[sel.kycStatus] || kycMeta[KYC_STATUS.NOT_STARTED]).label}</strong></div>
                    <div className="kyc-review-row"><span>PI 专业投资者</span><strong className="admin-status-text">{(piMeta[sel.piStatus] || piMeta[PI_STATUS.NOT_SUBMITTED]).label}</strong></div>
                  </div>
                  <div className="kyc-review-row"><span>PI 有效期</span><strong>{sel.piExpiry || '—'}</strong></div>
                  {(kycSubmittedAt || kycHandledAt) && (
                    <div className="kyc-review-row">
                      <span>{kycSubmittedAt ? `提交于 ${kycSubmittedAt}` : '—'}</span>
                      <strong>{kycHandledAt ? `最近审核 ${kycHandledAt}` : '—'}</strong>
                    </div>
                  )}
                  {sel.rejectReason && <div className="kyc-review-reject">最近拒绝原因：{sel.rejectReason}</div>}
                </div>
              </>
            )}
            {/* Tab2 资产 */}
            {tab === 'assets' && (
              <div className="card kyc-review-block">
                <h4 className="card-title"><Wallet size={14} /> 资产与持仓</h4>
                {sel.account && (sel.account.hkd > 0 || sel.account.frozen > 0) && (
                  <>
                    <div className="kyc-review-row"><span>可用资金</span><strong>HK$ {formatCurrency(sel.account.hkd)}</strong></div>
                    <div className="kyc-review-row"><span>冻结资金</span><strong>HK$ {formatCurrency(sel.account.frozen)}</strong></div>
                  </>
                )}
                {selHeld.length > 0 ? (
                  <>
                    <div className="kyc-review-row"><span>持仓</span><strong>{selHeld.length} 项</strong></div>
                    {selHeld.map(h => (
                      <div className="admin-user-hold-row" key={h.id}>
                        <div className="admin-user-hold-head">
                          <strong>{h.projectName}</strong>
                          <span className="admin-user-hold-value">HK$ {formatCurrency(h.currentValue)}</span>
                        </div>
                        <div className="admin-user-hold-meta">{h.shares} 份 · 成本 HK$ {formatCurrency(h.costBasis)} · 估值变动 +{h.return}%</div>
                      </div>
                    ))}
                  </>
                ) : <div className="kyc-review-row"><span>持仓</span><strong>0 项</strong></div>}
              </div>
            )}
            {/* Tab3 记录 */}
            {tab === 'records' && (
              <>
                <div className="card kyc-review-block">
                  <h4 className="card-title"><Wallet size={14} /> 资金操作（{selFunds.length}）</h4>
                  {selFunds.length > 0 ? selFunds.map(f => {
                    const fs = fundStatus(f);
                    return (
                      <div className="admin-user-rec" key={f.id}>
                        <div className="admin-user-rec-head">
                          <strong>{fundLabel(f)}</strong>
                          <span className={`status-badge ${fs.cls}`}>{fs.text}</span>
                        </div>
                        <div className="admin-user-rec-meta">{fundMeta(f)}</div>
                      </div>
                    );
                  }) : <div className="text-muted text-sm">暂无资金操作</div>}
                </div>
                <div className="card kyc-review-block">
                  <h4 className="card-title">申购记录（{selSubs.length}）{selSubs.length > 0 && <span className="card-title-sub">累计 HK$ {formatCurrency(sel.subTotal)}</span>}</h4>
                  {selSubs.length > 0 ? selSubs.map(s => (
                    <div className="admin-user-rec" key={s.id}>
                      <div className="admin-user-rec-head">
                        <strong>{s.projectName}</strong>
                        <span className={`status-badge admin-status-${s.status}`}>{s.status === 'submitted' ? '意向已提交' : s.status === 'allocated' ? '已获配额' : s.status === 'signed' ? '已签 SPV' : '未获配额'}</span>
                      </div>
                      <div className="admin-user-rec-meta">HK$ {formatCurrency(s.amount || 0)} · {s.createdAt}</div>
                    </div>
                  )) : <div className="text-muted text-sm">暂无申购记录</div>}
                </div>
                <div className="card kyc-review-block">
                  <h4 className="card-title">报名记录（{selRegs.length}）</h4>
                  {selRegs.length > 0 ? selRegs.map(r => (
                    <div className="admin-user-rec" key={r.id}>
                      <div className="admin-user-rec-head">
                        <strong><Calendar size={14} /> {r.eventName}</strong>
                        <span className={`status-badge ${r.status === 'checked-in' ? 'admin-status-approved' : 'admin-status-pending'}`}>
                          {r.status === 'checked-in' ? '已签到' : '已报名'}
                        </span>
                      </div>
                      <div className="admin-user-rec-meta">{r.registeredAt}{r.accompanying ? ` · 陪同 ${r.accompanying} 人` : ''}</div>
                    </div>
                  )) : <div className="text-muted text-sm">暂无报名记录</div>}
                </div>
              </>
            )}
            {/* Tab4 跟进（顾问专属：任务聚合 + 状态机 + 留痕 + 陪同人） */}
            {tab === 'followup' && (
              <>
                {selTasks && selTasks.hasTask && (
                  <div className="card kyc-review-block">
                    <h4 className="card-title">顾问待办</h4>
                    <div className="admin-client-task-list">
                      {selTasks.pendingLead > 0 && <div className="kyc-review-row"><span>客户跟进</span><strong><TaskBadge kind="lead" text={selTasks.leadStatus === 'new' ? '待联系' : '跟进中'} /></strong></div>}
                      {selTasks.pendingSign > 0 && <div className="kyc-review-row"><span>SPV 签署</span><strong><TaskBadge kind="sign" text={`${selTasks.pendingSign} 笔待签`} /></strong></div>}
                    </div>
                    <p className="admin-form-hint">资金/SPV 审批由资金运营处理，顾问负责联系客户跟进签署。</p>
                  </div>
                )}

                {selLead ? (
                  <>
                    <div className="card kyc-review-block">
                      <h4 className="card-title">跟进状态</h4>
                      <div className="form-group">
                        <div className="admin-lead-status-actions">
                          {Object.entries(regLeadStatusLabels).map(([key, label]) => (
                            <button
                              key={key}
                              className={`admin-filter-btn ${(selLead?.leadStatus || 'new') === key ? 'active' : ''}`}
                              onClick={() => changeLeadStatus(sel.userId, key)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="admin-form-hint">已转化 = 客户已提交申购意向（与「申购记录」联动）。</p>
                      </div>
                    </div>

                    <div className="card kyc-review-block">
                      <h4 className="card-title">跟进记录（{selFollowups.length}）</h4>
                      {selFollowups.length > 0 ? (
                        <div className="admin-reg-history admin-followup-log">
                          {selFollowups.map(f => (
                            <div key={f.id} className="admin-reg-history-row">
                              <div>
                                <strong><History size={14} /> {regLeadStatusLabels[f.from] || f.from} → {regLeadStatusLabels[f.to] || f.to}</strong>
                                <span className="text-muted text-sm">{f.operator} · {formatISODateTime(f.at).slice(0, 16)}</span>
                                {f.note ? <span className="admin-followup-note">{f.note}</span> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="admin-form-hint">暂无跟进记录（改状态即自动留痕）。</p>}
                    </div>

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
                              {(() => {
                                const holder = selLead?.regs.find(r => (r.companions || []).some(x => x.name === c.name));
                                return holder ? (
                                  <button className="btn-icon" title="移除陪同人" onClick={() => doRemoveCompanion(holder.id, (holder.companions || []).findIndex(x => x.name === c.name))}>
                                    <Trash2 size={15} />
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          ))}
                        </div>
                      ) : <p className="admin-form-hint">无陪同人记录。</p>}
                      <div className="admin-companion-form">
                        <div className="admin-companion-add">
                          <input className="form-input" placeholder="陪同人姓名（必填）" value={companionDraft.name} onChange={e => setCompanionDraft(d => ({ ...d, name: e.target.value }))} />
                          <button className="btn btn-md btn-outline" onClick={doAddCompanion}><Plus size={15} /> 添加</button>
                        </div>
                        <div className="admin-companion-add">
                          <input className="form-input" placeholder="电话（可选）" value={companionDraft.phone} onChange={e => setCompanionDraft(d => ({ ...d, phone: e.target.value }))} />
                          <input className="form-input" placeholder="邮箱（可选）" value={companionDraft.email} onChange={e => setCompanionDraft(d => ({ ...d, email: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doAddCompanion(); } }} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card kyc-review-block">
                    <h4 className="card-title">跟进状态</h4>
                    <p className="admin-form-hint">该客户暂无报名记录，暂无线索跟进对象；客户报名路演后自动进入跟进流程。</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
