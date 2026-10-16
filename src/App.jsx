import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
// 登录四页为 AuthPages 具名导出，lazy 需转 default（未登录首帧才需要）
const LoginPage = lazy(() => import('./components/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./components/AuthPages').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./components/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./components/AuthPages').then(m => ({ default: m.ResetPasswordPage })));
import BottomNav from './components/BottomNav';
import AdminSidebar from './components/AdminSidebar';

import TermsUpdateGate from './components/TermsUpdateGate';
import OnboardingGate from './components/OnboardingGate';
import AdminLogin from './admin/AdminLogin';
// 共享内核（2026-10-09 嵌入方案·方案A）：路由解析/合规门控决策/APP 端路由表提取至 shell/，
// 与嵌入壳（embed/EmbedApp.jsx）共用单一事实源；本文件仅保留独立原型壳职责（登录四页/admin/测试钩子）。
import { parseHash, resolveGate } from './shell/guard';
import { renderAppPage } from './shell/router';

// 后台页面按需加载（2026-09-24 audit P2：后台 25 页拆出主包，首屏不下载后台代码）
// AdminLogin 保持静态引入：它是登录门（未登录首帧即渲染，不能等 chunk）
// 2026-10-16 首期裁剪：资金/交易/申购/投后 11 个后台页 lazy 与渲染分支摘除（文件保留）
const AdminHome = lazy(() => import('./admin/AdminHome'));
const AdminProjects = lazy(() => import('./admin/AdminProjects'));
const AdminEvents = lazy(() => import('./admin/AdminEvents'));
const AdminRegistrations = lazy(() => import('./admin/AdminRegistrations'));
const AdminMyClients = lazy(() => import('./admin/AdminMyClients'));
const AdminSubscriptions = lazy(() => import('./admin/AdminSubscriptions'));
const AdminKYC = lazy(() => import('./admin/AdminKYC'));
const AdminPI = lazy(() => import('./admin/AdminPI'));
const AdminUsers = lazy(() => import('./admin/AdminUsers'));
const AdminAuditLogs = lazy(() => import('./admin/AdminAuditLogs'));
const AdminAdmins = lazy(() => import('./admin/AdminAdmins'));
const AdminRoles = lazy(() => import('./admin/AdminRoles'));
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'));
const AdminSupport = lazy(() => import('./admin/AdminSupport'));
const AdminConfig = lazy(() => import('./admin/AdminConfig'));

import { KYC_STATUS, PI_STATUS, getPiStatusForUser, testAccounts, approveKyc, setMockCurrentUser, restoreKycStatus, currentUser as currentUserData, initState, resetSubscriptionForDemo, getRoleMenuKeys, termsState, resetUserSecurityDemo, hasAgreedOnboarding } from './mock/data';

// 管理员登录落地（2026-08-20：独立欢迎首页；无 param 的 #admin 与旧链接 #admin/dashboard 均落 #admin/home）
const ADMIN_HOME = 'home';

// 调试用：URL 参数 ?visitor=1 或 hash 含 visitor 强制游客态
// localStorage 'mock-logged-in' 持久化 mock 状态
function getInitialLoggedIn() {
  const search = window.location.search;
  const hashStr = window.location.hash;
  if (search.includes('visitor=1') || hashStr.includes('visitor')) return false;
  try {
    const stored = localStorage.getItem('mock-logged-in');
    if (stored !== null) return stored === 'true';
  } catch (e) { /* SSR / 隐私模式 */ }
  return true;
}

export default function App() {
  // ?reset= 检测（同步，App 渲染前执行）：跳过 localStorage 恢复指定 subscription
  const _url = new URL(window.location.href);
  const _resetTarget = _url.searchParams.has('reset') ? (_url.searchParams.get('reset') || 's2') : null;

  // 持久化状态恢复：仅在首次渲染前执行一次（2026-08-10）
  const _initDone = useRef(false);
  if (!_initDone.current) {
    initState(_resetTarget);
    _initDone.current = true;
  }

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialLoggedIn);
  const [hash, setHash] = useState(() => parseHash(window.location.hash));
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(testAccounts.approved);
  // ?reset= 触发后需要强制刷新页面树，ProjectDetail 等组件直接读 data.js 数组，mutate 后不会自动 re-render
  const [dataRefresh, setDataRefresh] = useState(0);
  // 条款重同意闸门确认后触发整树刷新（termsState.agreedVersion 已更新，闸门随之消失）
  const [, setTermsTick] = useState(0);

  // ?reset= 参数：演示专用，自动重置签署状态（2026-08-11）
  // 访问 #project/p3?reset=1 后自动将 s2 恢复为 allocated，URL 参数自动清理
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('reset')) {
      const id = url.searchParams.get('reset') || 's2';
      resetSubscriptionForDemo(id);
      // 触发一次 dataRefresh 刷新，ProjectDetail 等直接读 data.js 的组件会 re-render
      setDataRefresh(r => r + 1);
      setTimeout(() => setToast('演示状态已重置，您可以重新体验签署流程'), 100);
      // 清理 URL 参数（replaceState 不产生历史记录）
      url.searchParams.delete('reset');
      history.replaceState(null, '', url.pathname + url.hash);
    }
  }, []);

  // 导航栈：记录「已离开的页面」（不含当前页），与浏览器历史自动同步（2026-08-07）
  // 用 ref 存储避免 React state 异步；逻辑由下方 hashchange effect 统一接管——
  // 新 hash == 栈顶 → 弹栈（页面内 goBack / 浏览器 back / 浏览器 forward 的统一入口）；
  // 否则 → 压入上一页（前进导航）。navigate 本身不手动压栈，全靠 hashchange 校正。
  const navStackRef = useRef([]);
  const lastHashRef = useRef(hash.full || 'events');

  useEffect(() => {
    const onHashChange = () => {
      const newHash = parseHash(window.location.hash);
      const newFull = newHash.full || 'events';
      const prevFull = lastHashRef.current;
      setHash(newHash);
      if (newFull !== prevFull) {
        const stack = navStackRef.current;
        if (stack[stack.length - 1] === newFull) {
          // 返回：新 hash 是栈顶 → 弹栈
          navStackRef.current = stack.slice(0, -1);
        } else {
          // 前进：新导航 → 压入上一页
          navStackRef.current = [...stack, prevFull];
        }
        lastHashRef.current = newFull;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'events';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const navigate = useCallback((h) => {
    window.location.hash = h;
  }, []);

  // 返回上一页（原路径返回）。fallback = 栈空（深链直入/刷新）时的默认目标，
  // 即各页面原有的写死返回目标。栈非空时优先回栈顶（hashchange 自动弹栈）。
  const goBack = useCallback((fallback) => {
    const stack = navStackRef.current;
    const target = stack[stack.length - 1] || fallback || 'events';
    const current = parseHash(window.location.hash).full || 'events';
    if (target !== current) {
      window.location.hash = target;
    }
  }, []);

  const isAdmin = hash.path === 'admin';
  const isInIframe = window.parent !== window;

  // hook 9 提前到此：所有 hooks 必须在任何条件返回之前调用
  useEffect(() => {
    if (isInIframe) {
      import('./demo-mode');
    }
  }, [isInIframe]);

  // hook 10：暴露控制台调试函数（mock 阶段专用，不动产品逻辑）
  useEffect(() => {
    window.__setMockLoggedIn = (v) => {
      const next = !!v;
      setIsLoggedIn(next);
      try { localStorage.setItem('mock-logged-in', String(next)); } catch (e) {}
    };
    window.__resetMockLogin = () => {
      try { localStorage.removeItem('mock-logged-in'); } catch (e) {}
      setIsLoggedIn(true);
      setCurrentUser(testAccounts.approved);
      setMockCurrentUser(testAccounts.approved);  // 桥梁同步（此前缺失：data.js currentUser 残留上一账号）
    };
    // 测试账号登录函数（演示通道：豁免 2FA。approved=u1 有 GA+Passkey / pending=u2 仅手机 KYC0 / pep=u3 仅手机 KYC1）
    window.__loginWithTestAccount = (type) => {
      const account = type === 'approved' ? testAccounts.approved : type === 'pep' ? testAccounts.pep : testAccounts.pending;
      setCurrentUser(account);
      setMockCurrentUser(account);
      // 2026-09-20：从提交记录回读 KYC 状态（testAccounts 预设刷新即重置，与 kycSubmissions 快照脱节）
      if (type !== 'approved') restoreKycStatus(account.id);
      setIsLoggedIn(true);
      // 落地页按恢复后的状态分桶（与门控 L394 逻辑一致）：已提交三态 → 状态页，未提交 → 流程入口
      const submittedStatuses = [
        KYC_STATUS.PENDING_REVIEW,
        KYC_STATUS.REJECTED,
        KYC_STATUS.REQUIRES_ACTION,
      ];
      if (account.kyc_status === KYC_STATUS.APPROVED) {
        // 2026-10-16 首期裁剪：#assets 摘除,落地改 #events;PI 认证通过才能浏览资讯,
        // 种子 PI 非 verified 时与门控 redirect 语义一致落 kyc-pi
        const piOk = getPiStatusForUser(account.id) === PI_STATUS.APPROVED;
        navigate(piOk ? 'events' : 'kyc-pi');
      } else if (submittedStatuses.includes(account.kyc_status)) {
        navigate('kyc-submitted');
      } else {
        navigate('kyc-start');
      }
    };
    // 管理员审批 KYC（Mock 测试用）
    window.__approveKyc = () => {
      approveKyc();
      setCurrentUser({ ...currentUser });
    };
    // 重置订阅到 allocated 状态（演示签署流程用，刷新后可重新体验）
    window.__resetSubscription = (id) => {
      resetSubscriptionForDemo(id || 's2');
    };
    // 2FA 演示重置：恢复被紧急登录/测试改动的安全档案（解绑的 GA/Passkey、冻结、中间态）
    window.__reset2faDemo = (userId) => {
      const res = resetUserSecurityDemo(userId);
      setCurrentUser(u => ({ ...u }));
      return res;
    };
    return () => {
      delete window.__setMockLoggedIn;
      delete window.__resetMockLogin;
      delete window.__loginWithTestAccount;
      delete window.__approveKyc;
      delete window.__resetSubscription;
      delete window.__reset2faDemo;
    };
  }, []);

  // 管理员登录状态（localStorage 持久化，mock 阶段）
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const raw = localStorage.getItem('zhifu-admin-login');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });

  // 管理员子路径（顶层计算供 admin 分支使用）：
  // 独立欢迎首页后无 param 的 #admin 落 #admin/home；旧链接 #admin/dashboard 兼容跳首页
  const adminSubPath = hash.path === 'admin'
    ? (!hash.param || hash.param === 'dashboard' ? ADMIN_HOME : hash.param)
    : null;

  if (!isLoggedIn && ['register', 'forgot-password', 'reset-password'].includes(hash.path)) {
    const authProps = { navigate, setIsLoggedIn, setUser, setToast };
    const authPage = (() => {
      switch (hash.path) {
        case 'register': return <RegisterPage {...authProps} />;
        case 'forgot-password': return <ForgotPasswordPage {...authProps} />;
        case 'reset-password': return <ResetPasswordPage {...authProps} />;
        default: return null;
      }
    })();
    return (
      <div className="app-container">
        {authPage}
        {toast && <div className="toast toast-success">{toast}</div>}
      </div>
    );
  }

  const handleAdminLogin = (admin) => {
    setAdminUser(admin);
    try { localStorage.setItem('zhifu-admin-login', JSON.stringify(admin)); } catch (e) {}
    // 登录直达独立欢迎首页（2026-08-20），业务模块从左侧菜单进入
    window.location.hash = `#admin/${ADMIN_HOME}`;
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try { localStorage.removeItem('zhifu-admin-login'); } catch (e) {}
    window.location.hash = '#admin/login';
  };

  if (isAdmin) {
    // 独立欢迎首页 2026-08-20：无 param 的 #admin 落 #admin/home；旧链接 #admin/dashboard 兼容跳首页
    const subPath = adminSubPath;
    // 未登录管理员访问后台 → 强制到登录页
    if (!adminUser) {
      if (subPath !== 'login') {
        // 直接渲染登录页（避免副作用循环）
      }
      return (
        <AdminLogin onLogin={handleAdminLogin} onBack={() => navigate('#projects')} />
      );
    }
    // 路由守卫（2026-08-24 · 角色权限管理配套）：此前权限只挡侧边栏菜单不挡 URL，直敲 hash 可越权进无权模块。
    // 与 getRoleMenuKeys 同源校验；越权/未知路由（含已登录访问 #admin/login 的历史空白页问题）一律渲染欢迎首页，
    // 不做副作用重定向（与上方未登录处理同款模式）。
    const allowedMenus = getRoleMenuKeys(adminUser.role);
    const subAllowed = subPath === 'home' || allowedMenus.includes(subPath);
    const effectiveSub = subAllowed ? subPath : ADMIN_HOME;
    return (
      <div className="admin-layout">
        <AdminSidebar current={effectiveSub} onNavigate={navigate} admin={adminUser} onLogout={handleAdminLogout} />
        <main className="admin-content">
          <ErrorBoundary>
            <Suspense fallback={<div className="admin-lazy-loading">加载中…</div>}>
            {effectiveSub === 'home' && <AdminHome admin={adminUser} />}
            {effectiveSub === 'projects' && <AdminProjects navigate={navigate} admin={adminUser} />}
            {effectiveSub === 'events' && <AdminEvents navigate={navigate} admin={adminUser} />}
            {effectiveSub === 'registrations' && <AdminRegistrations admin={adminUser} />}
            {effectiveSub === 'my-clients' && <AdminMyClients navigate={navigate} detailId={hash.param2} admin={adminUser} />}
            {effectiveSub === 'subscriptions' && <AdminSubscriptions navigate={navigate} detailId={hash.param2} admin={adminUser} />}
            {effectiveSub === 'kyc' && <AdminKYC navigate={navigate} detailId={hash.param2} admin={adminUser} />}
            {effectiveSub === 'pi' && <AdminPI navigate={navigate} detailId={hash.param2} admin={adminUser} />}
            {/* 2026-10-16 口径修订：申购记录恢复（意向收集链）；funds/transactions/transaction-monitor/
                large-tx/anomaly/str/edd/dividends/spvs/exits 10 个资金/投后渲染分支保持摘除——越权直敲
                由 getRoleMenuKeys 过滤（VALID_MENU_KEYS）落欢迎首页兜底 */}
            {effectiveSub === 'users' && <AdminUsers navigate={navigate} detailId={hash.param2} admin={adminUser} />}
            {effectiveSub === 'audit' && <AdminAuditLogs />}
            {effectiveSub === 'roles' && <AdminRoles admin={adminUser} />}
            {effectiveSub === 'admins' && <AdminAdmins admin={adminUser} />}
            {effectiveSub === 'broadcast' && <AdminNotifications admin={adminUser} />}
            {effectiveSub === 'messages' && <AdminSupport admin={adminUser} detailId={hash.param2} navigate={navigate} />}
            {effectiveSub === 'config' && <AdminConfig admin={adminUser} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  // 门控决策与 APP 端路由表已提取至 shell/guard.js + shell/router.jsx（2026-10-09 嵌入方案·方案A），
  // 与嵌入壳共用单一事实源；此处仅执行决策结果（渲染 LoginPage / 执行导航副作用）。
  const renderPage = () => {
    const gate = resolveGate({ path: hash.path, isLoggedIn, user: currentUserData });
    if (gate?.type === 'login') {
      return <LoginPage navigate={navigate} setIsLoggedIn={setIsLoggedIn} setUser={setUser} setToast={setToast} />;
    }
    if (gate?.type === 'redirect') {
      navigate(gate.to);
      return null;
    }
    return renderAppPage(hash.path, hash.param, { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn });
  };

  const TOP_LEVEL_PAGES = ['events', 'projects', 'profile'];
  const isTopLevel = TOP_LEVEL_PAGES.includes(hash.path);
  // 联动决定 BottomNav 显示 + .app-content 72px 留白（避免游客态 TopLevel 出现死间距）
  const showBottomNav = isTopLevel && isLoggedIn;

  return (
    <div className="app-container">
      <div className={`app-content${showBottomNav ? '' : ' no-bottom-pad'}`}>
        <ErrorBoundary>
          <Suspense fallback={<div className="p-lazy-loading">加载中…</div>}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </div>
      {showBottomNav && <BottomNav current={hash.path} onNavigate={navigate} />}
      {toast && <div className="toast toast-success">{toast}</div>}
      {/* 条款更新重同意闸门（2026-09-15 · 对齐公司实践：版本升级后登录弹窗，重新勾选后方可继续） */}
      {isLoggedIn && termsState.agreedVersion !== termsState.currentVersion && (
        <TermsUpdateGate onAgreed={() => setTermsTick(t => t + 1)} />
      )}
      {/* 开户协议闸门（2026-10-15 · UC 对齐）：KYC 通过后首次进 APP 签署基金业务协议（三件套），
          注册环节已零协议勾选；判定读 data.js 单例，签署后 agreementRecords 持久化，闸门随之消失 */}
      {isLoggedIn
        && currentUserData.kyc_status === KYC_STATUS.APPROVED
        && !hasAgreedOnboarding() && (
        <OnboardingGate
          onAgreed={() => setTermsTick(t => t + 1)}
          onDecline={() => { setIsLoggedIn(false); navigate('#login'); }}
        />
      )}
    </div>
  );
}
