import { useState, useEffect } from 'react';
import { Eye, X, Shield, Plus, Save, Trash2, RotateCcw, Ban, CheckCircle } from 'lucide-react';
import {
  getAdminUsers, addAdmin, updateAdmin, deleteAdmin, toggleAdminDisabled, resetAdminPassword,
  accountManagers, ADMIN_ROLES,
} from '../mock/data';

// 后台账号管理（2026-08-13 · 后台 P1；2026-08-14 命名整改"管理员管理"→"后台账号"）：系统级账号维护（仅 super 菜单可见）
// 本页管理的是全部后台登录账号（运营/合规/客服/财务/顾问/超级管理员）——用"管理员"命名是"用子集命名全集"（只有 super 叫管理员），故改"后台账号"。
// 角色集合 = data.js ADMIN_ROLES 单一真源（2026-08-24 角色权限管理落地，新增 finance；本页不再本地定义）。
// 保护规则：不能删除/禁用"当前登录账号"（自身）；至少保留一名启用状态的超级管理员。
// 所有变更经 logAudit（category: admin）落审计日志——老板"全流程留痕"。

// 角色筛选（同一实体状态过滤，filter-row 与 Projects/Events/KYC 一致）
const FILTERS = [{ key: 'all', label: '全部' }, ...ADMIN_ROLES];

const PAGE_SIZE = 10;

export default function AdminAdmins({ admin }) {
  const [admins, setAdmins] = useState(() => getAdminUsers());
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  // 抽屉多视图：form（新增/编辑）/ detail（详情+操作区）/ reset（重置密码）/ delete（删除确认）
  const [view, setView] = useState(null); // 'form' | 'detail' | 'reset' | 'delete'
  const [editingId, setEditingId] = useState(null); // form 编辑目标
  const [selId, setSelId] = useState(null); // detail 目标
  const [form, setForm] = useState({ username: '', name: '', role: 'ops', password: '', managerId: '', email: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [resetPwd, setResetPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [opMsg, setOpMsg] = useState(''); // 操作区成功反馈（如已禁用）

  const refresh = () => setAdmins([...getAdminUsers()]);

  const drawerOpen = !!view;
  const sel = selId ? admins.find(a => a.id === selId) : null;
  const isSelf = (a) => a.id === admin?.id;

  const matchFilter = (a) => filter === 'all' || a.role === filter;
  const filterCounts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? admins.length : admins.filter(a => a.role === f.key).length;
    return acc;
  }, {});
  const totalPages = Math.max(1, Math.ceil(admins.filter(matchFilter).length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = admins.filter(matchFilter).slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const closeDrawer = () => {
    setView(null); setEditingId(null); setSelId(null);
    setFormError(''); setResetPwd(''); setResetError(''); setOpMsg('');
  };

  // 抽屉统一行为：body 滚动锁定 + Esc 关闭（对齐全后台抽屉 Must，2026-08-14 补）
  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  // —— 表单 ——
  const openNew = () => {
    setForm({ username: '', name: '', role: 'ops', password: '', managerId: '', email: '', phone: '' });
    setIsNew(true); setEditingId(null); setFormError(''); setView('form');
  };
  const openEdit = (a) => {
    setForm({ username: a.username, name: a.name, role: a.role, password: '', managerId: a.managerId || '', email: a.email || '', phone: a.phone || '' });
    setIsNew(false); setEditingId(a.id); setFormError(''); setView('form');
  };
  const saveForm = () => {
    const payload = {
      username: form.username.trim(), name: form.name.trim(), role: form.role, password: form.password,
      managerId: form.managerId || undefined, email: form.email.trim(), phone: form.phone.trim() || undefined,
    };
    let res;
    if (isNew) {
      res = addAdmin(payload, admin?.name);
    } else {
      const patch = { username: payload.username, name: payload.name, role: payload.role, email: payload.email, phone: payload.phone || '' };
      if (form.role === 'advisor') patch.managerId = payload.managerId;
      if (form.password) patch.password = form.password; // 编辑时密码留空 = 不改
      res = updateAdmin(editingId, patch, admin?.name);
    }
    if (!res.ok) { setFormError(res.error); return; }
    refresh(); closeDrawer();
  };

  // —— 操作区 ——
  const doToggleDisabled = (a) => {
    const res = toggleAdminDisabled(a.id, admin?.name);
    if (!res.ok) { setOpMsg(res.error); return; }
    refresh(); setOpMsg(a.disabled ? '已启用' : '已禁用');
  };
  const openReset = (a) => { setResetPwd(''); setResetError(''); setView('reset'); };
  const doReset = () => {
    const res = resetAdminPassword(selId, resetPwd, admin?.name);
    if (!res.ok) { setResetError(res.error); return; }
    refresh(); setView('detail'); setResetError(''); setOpMsg('密码已重置');
  };
  const openDelete = (a) => setView('delete');
  const doDelete = () => {
    const res = deleteAdmin(selId, admin?.name);
    if (!res.ok) { setOpMsg(res.error); setView('detail'); return; }
    refresh(); closeDrawer();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>后台账号</h1>
        <span className="admin-header-summary">共 {admins.length} 个账号 · 启用 {admins.filter(a => !a.disabled).length}</span>
        <button className="btn btn-md btn-primary" onClick={openNew}><Plus size={15} /> 新增后台账号</button>
      </div>

      <div className="admin-filter-row">
        {FILTERS.map(f => (
          <button key={f.key} className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => { setFilter(f.key); setPage(1); }}>
            {f.label} {filterCounts[f.key]}
          </button>
        ))}
      </div>

      {/* 管理员列表（裸 table，对齐其他列表页——admin-table 自带卡片外观，去掉多余 card 包裹） */}
      <div className="admin-table admin-table--admins">
          <div className="admin-table-header">
            <span className="col-username">用户名</span>
            <span className="col-name">姓名</span>
            <span className="col-email">绑定邮箱</span>
            <span className="col-role">角色</span>
            <span className="col-status">状态</span>
            <span className="col-actions">操作</span>
          </div>
          {pageRows.length === 0 ? (
            <div className="admin-table-row"><div className="admin-table-empty">暂无符合条件的管理员</div></div>
          ) : pageRows.map(a => (
            <div key={a.id} className="admin-table-row" role="button" tabIndex={0}
              onClick={() => { setSelId(a.id); setOpMsg(''); setView('detail'); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(a.id); setOpMsg(''); setView('detail'); } }}>
              <span className="col-username">{a.username}</span>
              <span className="col-name"><strong title={a.name}>{a.name}</strong></span>
              <span className="col-email"><span className="text-secondary" title={a.email || ''}>{a.email || '—'}</span></span>
              <span className="col-role">{a.roleLabel}</span>
              <span className="col-status"><span className={`status-badge admin-status-${a.disabled ? 'disabled' : 'approved'}`}>{a.disabled ? '已禁用' : '正常'}</span></span>
              <span className="col-actions">
                <button className="btn-icon" title="查看详情" onClick={e => { e.stopPropagation(); setSelId(a.id); setOpMsg(''); setView('detail'); }}>
                  <Eye size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
            <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {admins.filter(matchFilter).length} 名</span>
            <button className="admin-page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
          </div>
        )}

      {/* —— 右侧抽屉 —— */}
      {drawerOpen && (
        <>
          <div className="admin-drawer-mask" onClick={closeDrawer} />
          <div className="admin-drawer">
            <div className="admin-drawer-head">
              <h3>{view === 'form' ? (isNew ? '新增后台账号' : '编辑后台账号') : view === 'reset' ? '重置密码' : view === 'delete' ? '删除后台账号' : (sel ? sel.name : '账号详情')}</h3>
              <button className="btn-icon" onClick={closeDrawer} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="admin-drawer-body">
              {view === 'form' && (
                <div className="admin-form-section">
                  <div className="admin-form-section-title">账号信息</div>
                  <div className="form-group">
                    <label className="form-label">用户名 <span className="required-mark">*</span></label>
                    <input className="form-input" placeholder="登录用户名" value={form.username} disabled={!isNew}
                      onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setFormError(''); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">姓名 <span className="required-mark">*</span></label>
                    <input className="form-input" placeholder="显示姓名" value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(''); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">角色 <span className="required-mark">*</span></label>
                    <select className="form-input" value={form.role}
                      onChange={e => { setForm(f => ({ ...f, role: e.target.value, managerId: e.target.value === 'advisor' ? f.managerId : '' })); setFormError(''); }}>
                      {ADMIN_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  {form.role === 'advisor' && (
                    <div className="form-group">
                      <label className="form-label">关联专属顾问 <span className="required-mark">*</span></label>
                      <select className="form-input" value={form.managerId}
                        onChange={e => { setForm(f => ({ ...f, managerId: e.target.value })); setFormError(''); }}>
                        <option value="">选择关联顾问</option>
                        {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">绑定邮箱 <span className="required-mark">*</span></label>
                    <input type="email" className="form-input" placeholder="用于找回密码 / 安全通知（如 ops@wealth-capital.hk）" value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormError(''); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">绑定手机（选填）</label>
                    <input className="form-input" placeholder="用于登录二次验证（2FA 预留）" value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormError(''); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isNew ? '初始密码' : '新密码（留空不改）'} <span className="required-mark">{isNew ? '*' : ''}</span></label>
                    <input type="password" className="form-input" placeholder={isNew ? '至少 6 位' : '留空则保持原密码'} value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setFormError(''); }} />
                  </div>
                  {formError && <p className="form-error">{formError}</p>}
                </div>
              )}

              {view === 'detail' && sel && (
                <>
                  <div className="card kyc-review-block">
                    <h4 className="card-title">账号信息</h4>
                    <div className="kyc-review-row"><span>用户名</span><strong>{sel.username}</strong></div>
                    <div className="kyc-review-row"><span>姓名</span><strong>{sel.name}</strong></div>
                    <div className="kyc-review-row"><span>角色</span><strong>{sel.roleLabel}</strong></div>
                    <div className="kyc-review-row"><span>状态</span><span className={`status-badge admin-status-${sel.disabled ? 'disabled' : 'approved'}`}>{sel.disabled ? '已禁用' : '正常'}</span></div>
                    {sel.role === 'advisor' && (
                      <div className="kyc-review-row"><span>关联顾问</span><strong>{accountManagers.find(m => m.id === sel.managerId)?.name || '—'}</strong></div>
                    )}
                  </div>
                  <div className="card kyc-review-block">
                    <h4 className="card-title">联系方式</h4>
                    <div className="kyc-review-row"><span>绑定邮箱</span><strong>{sel.email || '—'}</strong></div>
                    <div className="kyc-review-row"><span>绑定手机</span><strong>{sel.phone || '—'}</strong></div>
                    <div className="kyc-review-row"><span>说明</span><strong className="text-secondary">禁用后该账号无法登录后台；密码重置后原密码立即失效。绑定邮箱用于找回密码与安全通知。</strong></div>
                  </div>
                  {opMsg && <p className="form-success">{opMsg}</p>}
                  <div className="admin-drawer-action-zone">
                    <div className="admin-drawer-action-title"><Shield size={14} /> 操作</div>
                    <div className="admin-drawer-actions-inline">
                      <button className="btn btn-md btn-secondary" onClick={() => openEdit(sel)}>编辑</button>
                      <button className="btn btn-md btn-secondary" onClick={() => openReset(sel)}><RotateCcw size={14} /> 重置密码</button>
                      <button className="btn btn-md btn-outline" disabled={isSelf(sel)} title={isSelf(sel) ? '不能禁用当前登录账号' : ''}
                        onClick={() => doToggleDisabled(sel)}>{sel.disabled ? <><CheckCircle size={14} /> 启用</> : <><Ban size={14} /> 禁用</>}</button>
                      <button className="btn btn-md btn-danger" disabled={isSelf(sel)} title={isSelf(sel) ? '不能删除当前登录账号' : ''}
                        onClick={() => openDelete(sel)}><Trash2 size={14} /> 删除</button>
                    </div>
                  </div>
                </>
              )}

              {view === 'reset' && sel && (
                <div className="admin-form-section">
                  <div className="admin-form-section-title">重置密码 · {sel.name}</div>
                  <div className="form-group">
                    <label className="form-label">新密码 <span className="required-mark">*</span></label>
                    <input type="password" className="form-input" placeholder="至少 6 位" value={resetPwd} onChange={e => { setResetPwd(e.target.value); setResetError(''); }} />
                  </div>
                  {resetError && <p className="form-error">{resetError}</p>}
                </div>
              )}

              {view === 'delete' && sel && (
                <div className="admin-form-section">
                  <p className="form-error">确定删除后台账号「{sel.name}（{sel.username}）」？删除后无法恢复，该账号将立即无法登录。</p>
                </div>
              )}
            </div>
            <div className="admin-drawer-actions">
              {view === 'form' && (
                <>
                  <button className="btn btn-md btn-secondary" onClick={closeDrawer}>取消</button>
                  <button className="btn btn-md btn-primary" onClick={saveForm}><Save size={15} /> 保存</button>
                </>
              )}
              {view === 'reset' && (
                <>
                  <button className="btn btn-md btn-secondary" onClick={() => setView('detail')}>取消</button>
                  <button className="btn btn-md btn-primary" onClick={doReset}>确认重置</button>
                </>
              )}
              {view === 'delete' && (
                <>
                  <button className="btn btn-md btn-secondary" onClick={() => setView('detail')}>取消</button>
                  <button className="btn btn-md btn-danger" onClick={doDelete}>确认删除</button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
