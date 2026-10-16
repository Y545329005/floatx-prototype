// 共享内核（2026-10-09 嵌入集团 APP 方案 · 方案A）：独立原型壳（App.jsx）与嵌入壳（embed/EmbedApp.jsx）
// 共用的路由解析与合规门控决策。单一事实源——改 KYC 规则只改这里，双壳自动同步。
// 注意：本模块只做「决策」，导航副作用（navigate/渲染 LoginPage）由调用方执行。

import { KYC_STATUS, PI_STATUS, getPiStatusForUser } from '../mock/data';

// hash 解析：#path/param/param2/param3?query（与 App.jsx 原实现逐字等价）
export function parseHash(hash) {
  // hash 里可能带 query string（如 #project/p3?reset=1），先剥离 ? 及后面的内容
  const h = (hash.replace(/^#/, '').split('?')[0]) || 'events';
  const parts = h.split('/');
  const path = parts[0];
  const param = parts[1] || null;
  // param2：二级参数（后台详情 URL 化 #admin/{module}/{id}，ADMIN_DESIGN_SYSTEM §六 D1）
  const param2 = parts[2] || null;
  // param3：三级参数（后台 tabs+详情 URL 化 #admin/{module}/{tab}/{id}，资金运营 2026-08-14）
  const param3 = parts[3] || null;
  return { path, param, param2, param3, full: h };
}

// KYC 流程路由（已通过用户重访时重定向走，#kyc-submitted 状态页例外）
export const KYC_PATHS = new Set([
  'kyc-start', 'kyc-id-upload', 'kyc-address-proof', 'kyc-submitted',
]);

// 合规门槛期白名单（2026-10-16 拍板「PI 认证通过才能浏览资讯」）：
// KYC 未过 / PI 未过的用户仅可访问认证流程页与个人页（退出登录用）
export const COMPLIANCE_PATHS = new Set([
  'kyc-start', 'kyc-id-upload', 'kyc-address-proof', 'kyc-submitted',
  'kyc-pi', 'pi-submitted',
  'login', 'register', 'forgot-password', 'reset-password',
  'profile',
]);

// 门控决策（纯函数）——四层判定（2026-10-16 首期裁剪拍板）：
// ① 全站登录墙：游客一律 → LoginPage（2026-10-16 修复：不能放行 auth 页——renderAppPage
//    无 login case，放行会落 default 渲染资讯页打穿登录墙；register/forgot/reset 三页
//    由 App.jsx 在 renderPage 之前的早退分支承接，不经过本函数）
// ② KYC 层：未通过只能访问合规流程白名单（已提交过→状态页；未提交过→kyc-start，2026-09-18 分桶保留）
// ③ PI 层（新增，2026-10-16 拍板）：KYC 通过但 PI 非「已认证且未过期」→ 引导认证；
//    判定与 Profile badge 同源（getPiStatusForUser 含过期派生），审核中→pi-submitted 看状态，
//    未申报/被拒/过期→kyc-pi（REJECTED/EXPIRED 可重新提交，幂等检查在 data 层）
// ④ KYC 已通过重访 KYC 流程页 → 落 #events（2026-10-16：#assets 已随资产 Tab 摘除；
//    #kyc-submitted 例外，允许重访查看「认证已通过」结果）
// 返回：{ type:'login' } | { type:'redirect', to } | null（放行）
// user 必须传 data.js 模块级 currentUser（submitKyc 直接 mutate 它，永远是最新值，2026-09-18）
export function resolveGate({ path, isLoggedIn, user }) {
  if (!isLoggedIn) {
    return { type: 'login' };
  }
  const isKycApproved = user.kyc_status === KYC_STATUS.APPROVED;
  if (isLoggedIn && !isKycApproved) {
    if (COMPLIANCE_PATHS.has(path)) return null;
    const submittedStatuses = [
      KYC_STATUS.PENDING_REVIEW,
      KYC_STATUS.REJECTED,
      KYC_STATUS.REQUIRES_ACTION,
    ];
    return {
      type: 'redirect',
      to: submittedStatuses.includes(user.kyc_status) ? 'kyc-submitted' : 'kyc-start',
    };
  }
  if (isLoggedIn && !COMPLIANCE_PATHS.has(path)) {
    const pi = getPiStatusForUser(user.id);
    if (pi === PI_STATUS.APPROVED) return null;
    return {
      type: 'redirect',
      to: pi === PI_STATUS.PENDING_REVIEW ? 'pi-submitted' : 'kyc-pi',
    };
  }
  if (isLoggedIn && KYC_PATHS.has(path) && path !== 'kyc-submitted') {
    return { type: 'redirect', to: 'events' };
  }
  return null;
}
