import { Inbox } from 'lucide-react';

/**
 * 后台首页（2026-08-20：独立欢迎页）
 * 定位：登录后的首屏落地页——纯欢迎空白页，仅欢迎 + 角色；
 * 待办信号由侧边栏菜单角标承担（2026-08-20 二轮：移除待办合计卡片——待办都有角标显示）；
 * 业务入口由左侧菜单承担，侧边栏标题「财富后台」点击可回首页。
 */
export default function AdminHome({ admin }) {
  return (
    <div className="admin-home">
      <div className="admin-home-inner">
        <div className="admin-home-icon"><Inbox size={28} strokeWidth={1.8} /></div>
        <h1 className="admin-home-title">欢迎回来，{admin?.name}</h1>
        <p className="admin-home-sub">{admin?.roleLabel} · 从左侧菜单进入对应模块开始工作</p>
      </div>
    </div>
  );
}