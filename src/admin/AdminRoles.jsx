import { useState } from 'react';
import { Lock, RotateCcw, Save, ShieldCheck, CircleAlert } from 'lucide-react';
import {
  ADMIN_ROLES, ADMIN_MENUS,
  getRoleMenuKeys, updateRoleMenus, resetRoleMenus, hasRoleMenuOverride,
} from '../mock/data';

// 角色权限管理（2026-08-24 · 预置角色可配置）：「角色→后台菜单」映射编辑器，仅 super 菜单可见。
// 设计取舍（第一性原理 + 对抗性审查定稿）：
// - 角色集合固定 6 个预置岗位，不开放自定义角色：行内逻辑绑定具体角色（advisor 需关联顾问、
//   compliance 有 PI 到期预警），自定义角色会产出"能配置但配不出正确行为"的假功能；
// - 本页可配的只有菜单可见性（原型阶段权限粒度），保存经 updateRoleMenus 数据层校验 + 审计留痕；
// - 保护规则防自锁：super 行只读 / 至少保留 1 个菜单 / advisor 的「我的客户」不可取消（唯一落地页）；
// - 「恢复默认」= 清 localStorage 覆盖的逃生舱，防代码更新默认值被旧快照屏蔽。

// 角色职责一句话说明（面板顶部展示，帮助演示时讲清楚每个角色的边界）
const ROLE_DESCS = {
  super: '最高权限，全部菜单且锁定不可修改。',
  ops: '项目/路演/报名/申购/资金/投后全流程运营与平台触达。',
  compliance: 'KYC 与 PI 认证审核、账户视图、审计合规。',
  service: '客户服务：申购进度、客户账户、通知触达。',
  finance: '资金进出专职：充值/提现/换汇审核与流水对账。',
  advisor: '名下客户的单一工作视图（需在账号管理中关联专属顾问身份）。',
};

const MENU_GROUPS = [...new Set(ADMIN_MENUS.map(m => m.group))];

export default function AdminRoles({ admin }) {
  const [selRole, setSelRole] = useState('ops');
  const [draft, setDraft] = useState(() => [...getRoleMenuKeys('ops')]);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }

  const isSuper = selRole === 'super';
  const effective = getRoleMenuKeys(selRole);
  const customized = hasRoleMenuOverride(selRole);
  // 脏检查：与生效配置比对（数量 + 集合），决定保存按钮可用态
  const dirty = draft.length !== effective.length || draft.some(k => !effective.includes(k));

  const selectRole = (key) => {
    setSelRole(key);
    setDraft([...getRoleMenuKeys(key)]);
    setMsg(null);
  };

  const toggleMenu = (key) => {
    if (isSuper) return;
    // advisor 的唯一落地页锁定（数据层 updateRoleMenus 同步校验，双层防护）
    if (selRole === 'advisor' && key === 'my-clients') return;
    setDraft(d => (d.includes(key) ? d.filter(k => k !== key) : [...d, key]));
    setMsg(null);
  };

  const doSave = () => {
    const res = updateRoleMenus(selRole, draft, admin?.name);
    if (!res.ok) { setMsg({ type: 'err', text: res.error }); return; }
    setMsg({ type: 'ok', text: '权限已保存并立即生效（操作已记入审计日志）' });
  };

  const doReset = () => {
    const res = resetRoleMenus(selRole, admin?.name);
    if (!res.ok) { setMsg({ type: 'err', text: res.error }); return; }
    setDraft([...getRoleMenuKeys(selRole)]);
    setMsg({ type: 'ok', text: '已恢复该角色的默认权限' });
  };

  const roleDef = ADMIN_ROLES.find(r => r.key === selRole);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>角色权限</h1>
        <span className="admin-header-summary">{ADMIN_ROLES.length} 个预置角色 · 权限粒度 = 后台菜单可见性</span>
      </div>

      <div className="admin-roles-layout">
        {/* 左：角色列表 */}
        <div className="admin-roles-list">
          {ADMIN_ROLES.map(r => {
            const count = getRoleMenuKeys(r.key).length;
            return (
              <button
                key={r.key}
                className={`admin-role-item ${selRole === r.key ? 'active' : ''}`}
                onClick={() => selectRole(r.key)}
              >
                <span className="admin-role-item-main">
                  <span className="admin-role-item-name">{r.label}</span>
                  <span className="admin-role-item-meta">
                    {count} 个菜单
                    {r.key !== 'super' && hasRoleMenuOverride(r.key) && <em className="admin-role-customized">已自定义</em>}
                    {r.key === 'super' && <Lock size={11} className="admin-role-super-lock" />}
                  </span>
                </span>
              </button>
            );
          })}
          <p className="admin-roles-list-note">角色集合为固定预置岗位；如需新增岗位角色请联系系统开发评估（部分功能与角色深度绑定）。</p>
        </div>

        {/* 右：权限面板 */}
        <div className="card admin-roles-panel">
          <div className="admin-roles-panel-head">
            <div>
              <h4 className="card-title">
                {roleDef?.label}
                {customized && <span className="admin-role-customized admin-role-customized--head">已自定义</span>}
              </h4>
              <p className="admin-roles-desc">{ROLE_DESCS[selRole]}</p>
            </div>
            {!isSuper && (
              <button className="btn btn-md btn-secondary" onClick={doReset} disabled={!customized}>
                <RotateCcw size={14} /> 恢复默认
              </button>
            )}
          </div>

          {isSuper ? (
            <div className="admin-roles-lock-banner">
              <ShieldCheck size={15} />
              超级管理员为最高权限，默认可见全部菜单且不可修改——防止误改后无人能管理账号与角色。
            </div>
          ) : (
            <>
              {MENU_GROUPS.map(group => {
                const menus = ADMIN_MENUS.filter(m => m.group === group);
                return (
                  <div key={group} className="admin-perm-group">
                    <div className="admin-perm-group-title">{group}</div>
                    <div className="admin-perm-grid">
                      {menus.map(m => {
                        const checked = draft.includes(m.key);
                        // advisor 唯一落地页锁定（取消后该角色登录无任何工作页）
                        const locked = selRole === 'advisor' && m.key === 'my-clients';
                        return (
                          <label
                            key={m.key}
                            className={`admin-perm-item ${checked ? 'checked' : ''} ${locked ? 'locked' : ''}`}
                            title={locked ? '「我的客户」是专属顾问唯一工作页，不可取消' : ''}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={locked}
                              onChange={() => toggleMenu(m.key)}
                            />
                            <span>{m.label}</span>
                            {locked && <Lock size={12} className="admin-perm-lock-icon" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {msg && (
                <p className={msg.type === 'ok' ? 'form-success' : 'form-error'}>
                  {msg.type === 'err' && <CircleAlert size={13} />} {msg.text}
                </p>
              )}
              <div className="admin-roles-actions">
                <span className="admin-roles-hint">
                  {draft.length === 0 ? '至少需保留一个可见菜单' : `已选 ${draft.length} 个菜单${dirty ? '（有未保存修改）' : ''}`}
                </span>
                <button className="btn btn-md btn-primary" onClick={doSave} disabled={!dirty}>
                  <Save size={14} /> 保存修改
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
