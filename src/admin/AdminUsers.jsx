import { useState, useEffect } from 'react';
import { Eye, X, Search, ShieldCheck, Ban, CheckCircle, Users, UserCheck, Wallet, ChevronRight, CreditCard, Settings } from 'lucide-react';
import {
  getInvestorUsers, assignAccountManager, toggleUserDisabled,
  accountManagers, kycSubmissions, testAccounts, subscriptions, eventRegistrationsList,
  exitEvents, depositRequests, withdrawRequests, holdings, notifications, currentUser,
  bankCards, KYC_STATUS, PI_STATUS, maskName, maskPhone, formatCurrency,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 用户管理（2026-08-13 · 后台 P0）：投资人账户统一视图（账户全貌视角）
// 与现有模块分工：用户管理 = 账户视图（人的全生命周期）；KYC 审核 = 认证动作；
// 报名管理 = 获客视图（客户线索）；申购记录 = 项目视图。四者互补不重叠。

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

// 状态筛选（同一实体状态过滤，与 Projects/Events/KYC filter-row 一致；默认全部 = 账户浏览心智）
const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'approved', label: 'KYC 已通过' },
  { key: 'pending', label: '待审核' },
  { key: 'unauth', label: '未认证' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'disabled', label: '已禁用' },
];

const PAGE_SIZE = 8;

export default function AdminUsers({ navigate, detailId, admin }) {
  const [users, setUsers] = useState(() => getInvestorUsers());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 抽屉操作区
  const [mgrSelect, setMgrSelect] = useState('');
  const [mgrSaved, setMgrSaved] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  // 抽屉内 tabs（2026-08-14 用户管理：档案分 tab 免长滚动；操作区作为第 4 个 tab 与档案同级）
  const [tab, setTab] = useState('profile'); // profile 资料 | assets 资产 | records 记录 | actions 操作

  const refresh = () => setUsers([...getInvestorUsers()]);

  // 详情 URL 化（D1）：selected 由 URL param2 驱动，刷新/分享保留；抽屉打开态 = selected 存在
  const selected = detailId || null;
  const sel = selected ? users.find(u => u.userId === selected) : null;
  const drawerOpen = !!selected;
  const goList = () => { if (navigate) navigate('#admin/users'); };

  // 过滤器计数（按 f.key 独立匹配，非当前 filter）
  const matchFilterByKey = (u, key) => {
    switch (key) {
      case 'approved': return u.kycStatus === KYC_STATUS.APPROVED;
      case 'pending': return u.kycStatus === KYC_STATUS.PENDING_REVIEW;
      case 'unauth': return !u.kycStatus || u.kycStatus === KYC_STATUS.NOT_STARTED || u.kycStatus === KYC_STATUS.IN_PROGRESS;
      case 'rejected': return u.kycStatus === KYC_STATUS.REJECTED;
      case 'disabled': return u.disabled;
      default: return true;
    }
  };
  const matchFilter = (u) => matchFilterByKey(u, filter);
  const filterCounts = FILTERS.reduce((acc, f) => {
    acc[f.key] = users.filter(u => matchFilterByKey(u, f.key)).length;
    return acc;
  }, {});

  // 跨状态搜索（姓名/手机/邮箱/investorNo 原文匹配，脱敏不影响搜索）
  const kw = keyword.trim().toLowerCase();
  const isSearching = kw.length > 0;
  const matches = (u) =>
    (u.name || '').toLowerCase().includes(kw)
    || (u.phone || '').toLowerCase().includes(kw)
    || (u.email || '').toLowerCase().includes(kw)
    || (u.investorNo || '').toLowerCase().includes(kw);
  const filtered = isSearching ? users.filter(matches) : users.filter(matchFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const switchFilter = (key) => { setFilter(key); setPage(1); };
  const onSearchChange = (v) => { setKeyword(v); setPage(1); };

  // 统一抽屉行为：滚动锁定（Esc / Tab 圈闭 / 焦点还原由 useDrawerFocus 接管）
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  // B-1 修复：切换用户（页面内 hash 导航不经 closeDrawer）时重置操作区状态，防 mgrSelect 残留
  useEffect(() => {
    setMgrSelect('');
    setMgrSaved(false);
    setConfirmDisable(false);
    setTab('profile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const closeDrawer = () => { setMgrSelect(''); setMgrSaved(false); setConfirmDisable(false); goList(); };

  // 抽屉数据：KYC 档案（kycSubmissions 优先，testAccounts 兜底）+ 业务记录
  const selProfile = sel ? (() => {
    const k = kycSubmissions.find(x => x.userId === sel.userId);
    if (k && k.profile) return k.profile;
    const a = Object.values(testAccounts).find(x => x.id === sel.userId);
    return a?.kyc_profile || null;
  })() : null;
  const selSubs = sel ? subscriptions.filter(s => s.userId === sel.userId) : [];
  const selRegs = sel ? eventRegistrationsList.filter(r => r.userId === sel.userId) : [];

  // I-2 资金操作（退出分配事件 + 入金/提现按 userId 合并，最新在前）
  const selFunds = sel ? [
    // 退出分配事件（SPV 级无 userId，mock 单客户视角全量展示，2026-08-21 重构）
    ...exitEvents.map(ev => ({ ...ev, kind: 'exit' })),
    ...depositRequests.filter(r => r.userId === sel.userId).map(r => ({ ...r, kind: 'deposit' })),
    ...withdrawRequests.filter(r => r.userId === sel.userId).map(r => ({ ...r, kind: 'withdraw' })),
  ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')) : [];

  // I-4 KYC 提交/最近审核时间（kycSubmissions 完整档案）
  const selKyc = sel ? kycSubmissions.find(x => x.userId === sel.userId) : null;
  const kycSubmittedAt = selKyc?.submittedAt || null;
  const kycHandledAt = (() => {
    const acted = [...(selKyc?.history || [])].reverse().find(x => x.action !== 'submitted');
    return acted ? acted.at : null;
  })();

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

  // P-3 持仓明细（mock：holdings 无 userId，仅当前投资人 u1 有值；接后端按 userId 过滤）
  const selHeld = sel && sel.holdingCount > 0 ? holdings : [];
  // P-4 通知触达历史（mock：notifications 无 userId，属当前投资人；接后端按 userId 过滤）
  const selNotif = sel && sel.userId === currentUser.id ? notifications : [];
  // 2026-08-15 银行卡（mock：bankCards 加 userId，按 sel.userId 过滤；u1 有 2 张卡）
  const selBankCards = sel ? bankCards.filter(c => c.userId === sel.userId) : [];
  // P-5 联系方式可点击（tel 去空格横线）
  const telHref = (phone) => phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '#';

  const handleAssign = () => {
    if (!sel || !mgrSelect) return;
    assignAccountManager(sel.userId, mgrSelect, admin?.name || '系统');
    setMgrSaved(true);
    refresh();
  };
  const handleToggleDisable = () => {
    if (!sel) return;
    toggleUserDisabled(sel.userId, admin?.name || '系统');
    setConfirmDisable(false);
    refresh();
  };

  const approvedCount = users.filter(u => u.kycStatus === KYC_STATUS.APPROVED).length;
  const disabledCount = users.filter(u => u.disabled).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>用户管理</h1>
        <span className="admin-header-summary">共 {users.length} 个投资人 · 已认证 {approvedCount} · 已禁用 {disabledCount}</span>
      </div>

      {/* 视图控制行：左状态筛选 + 右搜索（账户浏览/检索，对齐 KYC） */}
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

      {/* 全宽列表（行点击 → 弹抽屉账户全貌；列表脱敏 PDPO，抽屉授权全量） */}
      <div className="admin-table admin-table--users">
        <div className="admin-table-header">
          <span className="col-name">投资人</span>
          <span className="col-phone">联系方式</span>
          <span className="col-kyc">KYC 状态</span>
          <span className="col-pi">PI 认证</span>
          <span className="col-mgr">专属顾问</span>
          <span className="col-biz">业务</span>
          <span className="col-state">账户</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(u => {
          const km = kycMeta[u.kycStatus] || kycMeta[KYC_STATUS.NOT_STARTED];
          const pm = piMeta[u.piStatus] || piMeta[PI_STATUS.NOT_SUBMITTED];
          return (
            <div
              key={u.userId}
              className={`admin-table-row${u.disabled ? ' admin-user-disabled-row' : ''}`}
              onClick={() => { navigate(`#admin/users/${u.userId}`); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/users/${u.userId}`); } }}
            >
              <span className="col-name">
                <strong>{maskName(u.name)}</strong>
                <span className="col-name-sub">{u.investorNo}</span>
              </span>
              <span className="col-phone">{maskPhone(u.phone)}</span>
              <span className="col-kyc">
                <span className={`status-badge ${km.cls}`}>{km.label}</span>
              </span>
              <span className="col-pi">
                <span className={`status-badge ${pm.cls}`}>{pm.label}</span>
              </span>
              <span className="col-mgr">{u.managerName}</span>
              <span className="col-biz">报名 {u.regCount} · 申购 {u.subCount}</span>
              <span className="col-state">
                <span className={u.disabled ? 'text-danger' : 'text-muted'}>{u.disabled ? '已禁用' : '正常'}</span>
              </span>
              <span className="col-actions">
                <button
                  className="btn-icon"
                  title="查看账户详情"
                  onClick={(e) => { e.stopPropagation(); navigate(`#admin/users/${u.userId}`); }}
                >
                  <Eye size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">{isSearching ? '未找到匹配用户' : '暂无符合条件的用户'}</span>
          </div>
        )}
      </div>

      {/* 分页（每页一屏） */}
      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 个投资人</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 统一右侧抽屉：账户全貌（授权查看全量 + 账户操作） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && sel && (
        <div className="admin-drawer admin-drawer--user" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`账户 ${maskName(sel.name)}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">
              <Users size={15} /> {sel.name} <span className="text-muted">· {sel.investorNo}</span>
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          {/* 抽屉内 tabs（2026-08-14 用户管理：档案分 tab 免长滚动；操作区作为第 4 个 tab 与档案同级） */}
          <div className="admin-tabs admin-drawer-tabs">
            <button className={`admin-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>资料</button>
            <button className={`admin-tab ${tab === 'assets' ? 'active' : ''}`} onClick={() => setTab('assets')}>资产</button>
            <button className={`admin-tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>记录</button>
            <button className={`admin-tab ${tab === 'actions' ? 'active' : ''}`} onClick={() => setTab('actions')}>操作</button>
          </div>
          <div className="admin-drawer-body">
            {tab === 'profile' && (
            <>
            {/* 账户信息卡（I-5 2 列网格） */}
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

            {/* 2026-08-15 银行卡卡（mock 单用户场景下展示 u1 的 2 张；其他用户空态）
               2026-08-16 重设计：分行布局（银行分行 / maskedNo · 币种），币种改中性色 */}
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

            {/* 认证卡（2026-08-14：去胶囊改主色 600 文字 + 2026-08-15 3 字段双排，KYC/PI 同行 + PI 有效期独行） */}
            <div className="card kyc-review-block admin-kyc-review-tight">
              <h4 className="card-title"><ShieldCheck size={14} /> 认证状态</h4>
              <div className="kyc-review-double-row">
                <div className="kyc-review-row">
                  <span>KYC 认证</span>
                  <strong className="admin-status-text">
                    {(kycMeta[sel.kycStatus] || kycMeta[KYC_STATUS.NOT_STARTED]).label}
                  </strong>
                </div>
                <div className="kyc-review-row">
                  <span>PI 专业投资者</span>
                  <strong className="admin-status-text">
                    {(piMeta[sel.piStatus] || piMeta[PI_STATUS.NOT_SUBMITTED]).label}
                  </strong>
                </div>
              </div>
              <div className="kyc-review-row"><span>PI 有效期</span><strong>{sel.piExpiry || '—'}</strong></div>
              {(kycSubmittedAt || kycHandledAt) && (
                <div className="kyc-review-row">
                  <span>{kycSubmittedAt ? `提交于 ${kycSubmittedAt}` : '—'}</span>
                  <strong>{kycHandledAt ? `最近审核 ${kycHandledAt}` : '—'}</strong>
                </div>
              )}
              {sel.rejectReason && (
                <div className="kyc-review-reject">最近拒绝原因：{sel.rejectReason}</div>
              )}
            </div>
            </>
            )}
            {/* Tab2 资产：资产与持仓 */}
            {tab === 'assets' && (
            <>
            {/* 资产卡（P-1 纯净：只放钱——可用/冻结/持仓；申购汇总已移入申购记录卡） */}
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
              ) : (
                <div className="kyc-review-row"><span>持仓</span><strong>0 项</strong></div>
              )}
            </div>
            </>
            )}
            {/* Tab3 记录（2026-08-16 改名：往来 → 记录）：资金操作 + 申购 + 报名 */}
            {tab === 'records' && (
            <>
            {/* I-2 资金操作记录（退出/出入金申请，pending 橙突出） */}
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

            {/* 业务记录：申购明细（2026-08-15：纯展示，去跳转 + 去 chevron；档案 = 看，业务处理去独立菜单） */}
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

            {/* 业务记录：报名明细（2026-08-15：纯展示，去跳转 + 去 chevron） */}
            <div className="card kyc-review-block">
              <h4 className="card-title">报名记录（{selRegs.length}）</h4>
              {selRegs.length > 0 ? selRegs.map(r => (
                <div className="admin-user-rec" key={r.id}>
                  <div className="admin-user-rec-head">
                    <strong>{r.eventName}</strong>
                    <span className={`status-badge ${r.status === 'checked-in' ? 'admin-status-approved' : 'admin-status-pending'}`}>
                      {r.status === 'checked-in' ? '已签到' : '已报名'}
                    </span>
                  </div>
                  <div className="admin-user-rec-meta">{r.registeredAt}{r.accompanying ? ` · 陪同 ${r.accompanying} 人` : ''}</div>
                </div>
              )) : <div className="text-muted text-sm">暂无报名记录</div>}
            </div>

            {/* 2026-08-15 去通知触达卡：未来推送多易信息爆炸，全量查看走 AdminNotifications 菜单 */}
            </>
            )}
            {/* Tab4 操作：账户级操作（顾问分配 + 风控禁用）—— 2026-08-14 操作区从底部折叠改为 tab 化
               2026-08-15 重设计：浅橙背景操作区 + 顶部「操作区」提示，与上方资料卡群视觉区分 */}
            {tab === 'actions' && (
              <div className="admin-action-panel">
                <div className="admin-action-panel-head">
                  <Settings size={14} />
                  <span className="admin-action-panel-tip">账户级变更，操作即时生效</span>
                </div>
                <div className="admin-action-panel-body">
                  <div className="admin-action-block">
                    <h5 className="admin-action-block-title">专属顾问</h5>
                    <div className="form-group">
                      <label className="form-label">归属顾问（报名/申购记录自动跟随）</label>
                      <select
                        className="form-input"
                        value={mgrSelect || sel.managerId || ''}
                        onChange={e => { setMgrSelect(e.target.value); setMgrSaved(false); }}
                      >
                        <option value="">未分配</option>
                        {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}（{m.role}）</option>)}
                      </select>
                    </div>
                    {mgrSaved && <p className="form-success">专属顾问已更新</p>}
                    <button className="btn btn-md btn-primary" onClick={handleAssign}>保存分配</button>
                  </div>
                  <div className="admin-action-block">
                    <h5 className="admin-action-block-title">风控</h5>
                    {confirmDisable ? (
                      <div>
                        <p className="text-muted text-sm">
                          {sel.disabled
                            ? `确认恢复启用「${sel.name}」的账户？恢复后可正常登录与操作。`
                            : `确认禁用「${sel.name}」的账户？禁用后该投资人将无法登录与参与申购（风控冻结）。`}
                        </p>
                        <div className="admin-drawer-actions-inline">
                          <button className="btn btn-md btn-secondary" onClick={() => setConfirmDisable(false)}>取消</button>
                          <button className="btn btn-md btn-danger" onClick={handleToggleDisable}>
                            {sel.disabled ? <><CheckCircle size={16} /> 确认启用</> : <><Ban size={16} /> 确认禁用</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={`btn btn-md ${sel.disabled ? 'btn-outline' : 'btn-danger'}`}
                        onClick={() => setConfirmDisable(true)}
                      >
                        <Ban size={16} /> {sel.disabled ? '恢复启用账户' : '禁用账户'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* 操作区已迁至 tab='actions'（2026-08-14），底部 footer 移除 */}
        </div>
      )}
    </div>
  );
}
