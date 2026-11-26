import { Fragment, useState } from 'react';
import { FileCheck, FolderKanban, CalendarCheck, CalendarClock, FileText, ClipboardList, ClipboardCheck, UserCheck, PackageOpen, Users, Landmark, Coins, Bell, ScrollText, Shield, Settings, LogOut, ChevronDown, KeyRound, X, BadgeCheck, HeartHandshake, LockKeyhole, Headphones, CircleDollarSign, Send } from 'lucide-react';
import { ADMIN_MENUS, getRoleMenuKeys, changeAdminPassword, getMenuBadges } from '../mock/data';

// 菜单排序与分组（2026-11-24 重构，现行 7 组）：
// 用户（KYC→PI→用户→我的客户，认证到账户）→ 资讯业务（路演→报名→项目→问卷→发布审批：
// 活动/标的 → 用户参与/意向 → 外发审批，资讯·咨询业务域一条线）→ 基金（产品→交易）
// → 委托（业务→日结→月报，9 号牌全权委托一本账）→ 资金（审核，资金域单模块）
// → 运营（通知触达+客户消息，主动/响应式触达成对）→ 系统（审计→角色→账号→配置）。
// 历史口径（2026-08-12，已推翻）：曾按「路演/项目 2+2 平行」分组，论据是用户侧 BottomNav 两者并列
// 一级 Tab、前后台心智一致；2026-11-24 用户拍板合并——后台分组按运营工作域切（发布审批本就是
// 项目+路演共用审批域，报名/问卷是同类意向记录），用户侧双 Tab 是访客内容频道，与后台工作面不同构。
// 视觉分组：Section Title 分组（AntD Sider 惯例——11px uppercase letter-spacing 0.5px 半透明白）；
// 单击直达不增加层级（vs 合并父菜单）；按角色过滤后空组自动跳过。
// 待办 Badge（2026-08-14 三轮）：工作台移除（信息被各模块页头计数完全承接），待办信号下沉到菜单角标——
// 每个菜单项 label 后显示该模块待处理数（getMenuBadges 单一真源，>0 才渲染；角色过滤天然只显示可见菜单）。
// 分区折叠（2026-08-14）：
// 组标题本身可点击折叠/展开该组菜单项（不改变页面跳转，只是节省纵向空间）；
// 折叠状态持久化到 localStorage（zhifu-admin-sidebar-groups，键 = 组名；组改名后旧键自然失效，默认展开）；
// 折叠态只显示组标题（chevron 旋转 -90°），不渲染该组菜单项。
// 菜单数据真源 = data.js ADMIN_MENUS（key/label/hash/group，与角色权限页共用单一真源）；
// icon 属 UI 层关注点，在此映射（新增菜单需同步补 icon）。
const MENU_ICONS = {
  kyc: UserCheck,
  pi: BadgeCheck,
  users: Users,
  'my-clients': HeartHandshake,
  events: CalendarCheck,
  registrations: ClipboardCheck,
  projects: FolderKanban,
  subscriptions: ClipboardList,
  publish: Send, // 发布审批进度中心（2026-11-20 BPM 会签主审）
  'fund-products': PackageOpen, // 基金产品维护（条款/文件/净值）
  'fund-trades': Coins,   // 基金交易确认（2026-10-28 一期闭环；2026-11-17 特殊申购并入为第 3 签）
  'mandate': CircleDollarSign, // 委托业务：协议/账户/交易/估值四签（2026-11-20 日结与月报拆出）
  'mandate-daily': CalendarClock, // 委托日结：当日批量出单
  'mandate-monthly': FileText,    // 委托月报：按账户×期间出具
  'statement-issue': FileCheck,   // 结单出具：全用户月结（2026-11-25）
  funds: Landmark,
  broadcast: Bell,
  messages: Headphones,
  audit: ScrollText,
  roles: LockKeyhole,
  admins: Shield,
  config: Settings,
};
const menuItems = ADMIN_MENUS.map(m => ({ ...m, icon: MENU_ICONS[m.key] }));

// 分区折叠状态持久化（每个角色独立保存）
const GROUPS_KEY = 'zhifu-admin-sidebar-groups';
function getCollapsedGroups() {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}'); } catch { return {}; }
}
function persistCollapsedGroups(map) {
  try { localStorage.setItem(GROUPS_KEY, JSON.stringify(map)); } catch { /* 隐私模式等静默 */ }
}

export default function AdminSidebar({ current, onNavigate, admin, onLogout }) {
  const allowed = getRoleMenuKeys(admin?.role);
  const visible = menuItems.filter(item => allowed.includes(item.key));

  // 待办 Badge：渲染时计算（工作台移除后待办信号下沉到菜单角标——单一真源 getMenuBadges）
  const badges = getMenuBadges(admin?.role || 'super', admin);

  // 分区折叠状态：{ [role]: { [group]: true } }，默认全部展开
  const [collapsedAll, setCollapsedAll] = useState(getCollapsedGroups);
  const role = admin?.role || 'super';
  const collapsed = collapsedAll[role] || {};
  const toggleGroup = (group) => {
    const nextRole = { ...collapsed, [group]: !collapsed[group] };
    const nextAll = { ...collapsedAll, [role]: nextRole };
    setCollapsedAll(nextAll);
    persistCollapsedGroups(nextAll);
  };

  // 账户入口下拉 + 修改密码 sheet（2026-08-12 方案 A：账户信息 = 常驻入口）
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdDone, setPwdDone] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const openPwdSheet = () => {
    closeMenu();
    setPwdForm({ old: '', next: '', confirm: '' });
    setPwdError('');
    setPwdDone(false);
    setShowPwd(true);
  };

  const submitPwd = () => {
    const { old: oldPwd, next, confirm } = pwdForm;
    if (!oldPwd || !next) { setPwdError('请填写原密码和新密码'); return; }
    if (next !== confirm) { setPwdError('两次输入的新密码不一致'); return; }
    const res = changeAdminPassword(admin?.username, oldPwd, next);
    if (!res.ok) { setPwdError(res.error || '修改失败'); return; }
    setPwdDone(true);
  };

  const closePwdSheet = () => setShowPwd(false);

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2 className="admin-sidebar-brand" onClick={() => onNavigate('#admin/home')} title="回到首页">HighBlock 后台</h2>
      </div>
      <nav className="admin-sidebar-nav">
        {visible.map((item, idx) => {
          const Icon = item.icon;
          const active = current === item.key;
          const prev = visible[idx - 1];
          // 工作台独立（无 group），其他项：新组第一项前插 Section Title（prev.group 不同才显示）
          const showGroupTitle = item.group && prev?.group !== item.group;
          // 折叠判断：对组内**每一项**都生效（item.group 存在且在折叠表中 → 隐藏）；工作台无 group 自动跳过（collapsed[undefined] = undefined）
          const isCollapsed = !!collapsed[item.group];
          return (
            <Fragment key={item.key}>
              {showGroupTitle && (
                <button
                  type="button"
                  className={`admin-nav-group-title ${isCollapsed ? 'collapsed' : ''}`}
                  onClick={() => toggleGroup(item.group)}
                  aria-expanded={!isCollapsed}
                  title={isCollapsed ? `展开 ${item.group} 组` : `折叠 ${item.group} 组`}
                >
                  <span>{item.group}</span>
                  <ChevronDown size={12} className="admin-nav-group-chevron" />
                </button>
              )}
              {!isCollapsed && (
                <button
                  className={`admin-nav-item ${active ? 'active' : ''}`}
                  onClick={() => onNavigate(item.hash)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {badges[item.key] > 0 && <span className="admin-nav-badge">{badges[item.key]}</span>}
                </button>
              )}
            </Fragment>
          );
        })}
      </nav>
      {/* 账户信息 = 常驻入口（AntD 布局：品牌顶部 + 导航中部 + 用户区底部） */}
      <div className="admin-sidebar-footer">
        <button className={`admin-sidebar-user ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen}>
          <span className="admin-sidebar-user-main">
            <span className="admin-sidebar-user-name">{admin?.name}</span>
            <span className="admin-sidebar-user-role">{admin?.roleLabel}</span>
          </span>
          <ChevronDown size={14} className="admin-sidebar-user-chevron" />
        </button>
        {menuOpen && (
          <div className="admin-user-menu">
            <button className="admin-user-menu-item" onClick={openPwdSheet}>
              <KeyRound size={14} /> 修改密码
            </button>
            <button className="admin-user-menu-item" onClick={() => { closeMenu(); onLogout(); }}>
              <LogOut size={14} /> 退出登录
            </button>
          </div>
        )}
      </div>

      {/* 修改密码 sheet（复用全局 .sheet-mask / .sheet） */}
      {showPwd && (
        <div className="sheet-mask" onClick={closePwdSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>{pwdDone ? '密码已修改' : '修改密码'}</h3>
              <button className="btn-icon" onClick={closePwdSheet} aria-label="关闭"><X size={16} /></button>
            </div>
            {pwdDone ? (
              <div className="sheet-body">
                <p className="form-success">密码修改成功，下次登录请使用新密码。</p>
                <button className="btn btn-primary btn-full" onClick={() => setShowPwd(false)}>完成</button>
              </div>
            ) : (
              <div className="sheet-body">
                <div className="form-group">
                  <label className="form-label">原密码</label>
                  <input type="password" className="form-input" placeholder="请输入原密码" value={pwdForm.old} onChange={e => { setPwdForm(f => ({ ...f, old: e.target.value })); setPwdError(''); }} />
                </div>
                <div className="form-group">
                  <label className="form-label">新密码</label>
                  <input type="password" className="form-input" placeholder="至少 6 位" value={pwdForm.next} onChange={e => { setPwdForm(f => ({ ...f, next: e.target.value })); setPwdError(''); }} />
                </div>
                <div className="form-group">
                  <label className="form-label">确认新密码</label>
                  <input type="password" className="form-input" placeholder="再次输入新密码" value={pwdForm.confirm} onChange={e => { setPwdForm(f => ({ ...f, confirm: e.target.value })); setPwdError(''); }} />
                </div>
                {pwdError && <p className="form-error">{pwdError}</p>}
                <button className="btn btn-primary btn-full" onClick={submitPwd}>确认修改</button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
