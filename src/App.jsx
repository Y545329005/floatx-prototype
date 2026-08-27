import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './components/AuthPages';
import BottomNav from './components/BottomNav';
import AdminSidebar from './components/AdminSidebar';
import { LanguageProvider } from './i18n';

import ProjectMarket from './pages/ProjectMarket';
import ProjectDetail from './pages/ProjectDetail';
import ProjectHeat from './pages/ProjectHeat';
import SearchPage from './pages/Search';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Subscriptions from './pages/Subscriptions';
import MySubscription from './pages/MySubscription';
import Wallet from './pages/Wallet';
import Transactions from './pages/Transactions';
import FundRequests from './pages/FundRequests';
import FundRequestDetail from './pages/FundRequestDetail';
import FundOperation from './pages/FundOperation';
import Holdings from './pages/Holdings';
import AssetOverview from './pages/AssetOverview';
import AssetTrend from './pages/AssetTrend';
import Exchange from './pages/Exchange';
import Funds from './pages/Funds';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Help from './pages/Help';
import BankCards from './pages/BankCards';
import About from './pages/About';
import BindPhone from './pages/BindPhone';
import ChangeEmail from './pages/ChangeEmail';
import KYCStart from './pages/KYCStart';
import KYCIdUpload from './pages/KYCIdUpload';
import KYCAddressProof from './pages/KYCAddressProof';
import KYCSubmitted from './pages/KYCSubmitted';
import KYCPI from './pages/KYCPI';
import PISubmitted from './pages/PISubmitted';

import AdminProjects from './admin/AdminProjects';
import AdminEvents from './admin/AdminEvents';
import AdminRegistrations from './admin/AdminRegistrations';
import AdminMyClients from './admin/AdminMyClients';
import AdminSubscriptions from './admin/AdminSubscriptions';
import AdminLogin from './admin/AdminLogin';
import AdminKYC from './admin/AdminKYC';
import AdminPI from './admin/AdminPI';
import AdminFunds from './admin/AdminFunds';
import AdminTransactions from './admin/AdminTransactions';
import AdminTransactionMonitor from './admin/AdminTransactionMonitor';
import AdminLargeTx from './admin/AdminLargeTx';
import AdminAnomaly from './admin/AdminAnomaly';
import AdminSTR from './admin/AdminSTR';
import AdminEDD from './admin/AdminEDD';
import AdminDividends from './admin/AdminDividends';
import AdminSpvs from './admin/AdminSpvs';
import AdminExits from './admin/AdminExits';
import AdminUsers from './admin/AdminUsers';
import AdminAuditLogs from './admin/AdminAuditLogs';
import AdminAdmins from './admin/AdminAdmins';
import AdminRoles from './admin/AdminRoles';
import AdminNotifications from './admin/AdminNotifications';
import AdminSupport from './admin/AdminSupport';
import AdminConfig from './admin/AdminConfig';
import AdminHome from './admin/AdminHome';

import { KYC_STATUS, testAccounts, approveKyc, setMockCurrentUser, initState, resetSubscriptionForDemo, getRoleMenuKeys } from './mock/data';

function parseHash(hash) {
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
    };
    // 测试账号登录函数
    window.__loginWithTestAccount = (type) => {
      const account = type === 'approved' ? testAccounts.approved : testAccounts.pending;
      setCurrentUser(account);
      setMockCurrentUser(account);
      setIsLoggedIn(true);
      if (account.kyc_status === KYC_STATUS.APPROVED) {
        navigate('assets');
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
    return () => {
      delete window.__setMockLoggedIn;
      delete window.__resetMockLogin;
      delete window.__loginWithTestAccount;
      delete window.__approveKyc;
      delete window.__resetSubscription;
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
      <LanguageProvider>
        <div className="app-container">
          {authPage}
          {toast && <div className="toast toast-success">{toast}</div>}
        </div>
      </LanguageProvider>
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
        <LanguageProvider>
          <AdminLogin onLogin={handleAdminLogin} onBack={() => navigate('#projects')} />
        </LanguageProvider>
      );
    }
    // 路由守卫（2026-08-24 · 角色权限管理配套）：此前权限只挡侧边栏菜单不挡 URL，直敲 hash 可越权进无权模块。
    // 与 getRoleMenuKeys 同源校验；越权/未知路由（含已登录访问 #admin/login 的历史空白页问题）一律渲染欢迎首页，
    // 不做副作用重定向（与上方未登录处理同款模式）。
    const allowedMenus = getRoleMenuKeys(adminUser.role);
    const subAllowed = subPath === 'home' || allowedMenus.includes(subPath);
    const effectiveSub = subAllowed ? subPath : ADMIN_HOME;
    return (
      <LanguageProvider>
        <div className="admin-layout">
          <AdminSidebar current={effectiveSub} onNavigate={navigate} admin={adminUser} onLogout={handleAdminLogout} />
          <main className="admin-content">
            <ErrorBoundary>
              {effectiveSub === 'home' && <AdminHome admin={adminUser} />}
              {effectiveSub === 'projects' && <AdminProjects navigate={navigate} admin={adminUser} />}
              {effectiveSub === 'events' && <AdminEvents navigate={navigate} admin={adminUser} />}
              {effectiveSub === 'registrations' && <AdminRegistrations admin={adminUser} />}
              {effectiveSub === 'my-clients' && <AdminMyClients navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'subscriptions' && <AdminSubscriptions navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'kyc' && <AdminKYC navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'pi' && <AdminPI navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'funds' && <AdminFunds navigate={navigate} tab={hash.param2} detailId={hash.param3} admin={adminUser} />}
              {effectiveSub === 'transactions' && <AdminTransactions />}
              {effectiveSub === 'transaction-monitor' && <AdminTransactionMonitor admin={adminUser} />}
              {effectiveSub === 'large-tx' && <AdminLargeTx navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'anomaly' && <AdminAnomaly navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'str' && <AdminSTR navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'edd' && <AdminEDD navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'dividends' && <AdminDividends navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'spvs' && <AdminSpvs navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'exits' && <AdminExits navigate={navigate} detailId={hash.param2} />}
              {effectiveSub === 'users' && <AdminUsers navigate={navigate} detailId={hash.param2} admin={adminUser} />}
              {effectiveSub === 'audit' && <AdminAuditLogs />}
              {effectiveSub === 'roles' && <AdminRoles admin={adminUser} />}
              {effectiveSub === 'admins' && <AdminAdmins admin={adminUser} />}
              {effectiveSub === 'broadcast' && <AdminNotifications admin={adminUser} />}
              {effectiveSub === 'messages' && <AdminSupport admin={adminUser} detailId={hash.param2} navigate={navigate} />}
              {effectiveSub === 'config' && <AdminConfig admin={adminUser} />}
            </ErrorBoundary>
          </main>
        </div>
      </LanguageProvider>
    );
  }

  // KYC 相关路由（登录前后都可访问，KYC APPROVED 后不能访问）
  const KYC_PATHS = new Set([
    'kyc-start', 'kyc-id-upload', 'kyc-address-proof', 'kyc-submitted',
  ]);

  // 游客态拦截：详情/私密/我的资产相关路由 → 跳 LoginPage（PI 合规 + 漏斗转化）
  const PRIVATE_PATHS = new Set([
    'login', 'project', 'event', 'project-heat', 'my-subscription',
    'subscriptions', 'wallet', 'transactions', 'fund-requests', 'fund-request', 'fund-operation', 'holdings', 'assets', 'asset-trend', 'exchange', 'bank-cards',
    'funds', 'reports', 'notifications', 'support', 'settings', 'help', 'profile',
    'bind-phone', 'change-email',
    'kyc-start', 'kyc-id-upload', 'kyc-address-proof', 'kyc-pi', 'pi-submitted',
  ]);

  const isKycApproved = currentUser.kyc_status === KYC_STATUS.APPROVED;

  const renderPage = () => {
    // 未登录 + 访问需要登录的页面 → LoginPage
    if (!isLoggedIn && PRIVATE_PATHS.has(hash.path)) {
      return <LoginPage navigate={navigate} setIsLoggedIn={setIsLoggedIn} setUser={setUser} setToast={setToast} />;
    }
    // KYC 已通过但访问 KYC 流程 → 重定向到 assets
    // 例外：#kyc-submitted（认证状态页）允许已通过用户重访查看"认证已通过"结果
    if (isLoggedIn && isKycApproved && KYC_PATHS.has(hash.path) && hash.path !== 'kyc-submitted') {
      navigate('assets');
      return null;
    }
    switch (hash.path) {
      case 'search':
        return <SearchPage navigate={navigate} goBack={goBack} isLoggedIn={isLoggedIn} />;
      case 'projects':
        return <ProjectMarket navigate={navigate} />;
      case 'project':
        return <ProjectDetail id={hash.param} navigate={navigate} goBack={goBack} />;
      case 'project-heat':
        return <ProjectHeat id={hash.param} navigate={navigate} goBack={goBack} />;
      case 'events':
        return <Events navigate={navigate} setToast={setToast} isLoggedIn={isLoggedIn} />;
      case 'event':
        return <EventDetail id={hash.param} navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'subscriptions':
        return <Subscriptions navigate={navigate} goBack={goBack} />;
      case 'my-subscription':
        return <MySubscription id={hash.param} navigate={navigate} goBack={goBack} />;
      case 'wallet':
        return <Wallet navigate={navigate} goBack={goBack} />;
      case 'transactions':
        return <Transactions navigate={navigate} goBack={goBack} />;
      case 'fund-requests':
        return <FundRequests navigate={navigate} goBack={goBack} />;
      case 'fund-request':
        return <FundRequestDetail id={hash.param} navigate={navigate} goBack={goBack} />;
      case 'fund-operation':
        return <FundOperation mode={hash.param} navigate={navigate} goBack={goBack} />;
      case 'holdings':
        return <Holdings navigate={navigate} goBack={goBack} />;
      case 'assets':
        return <AssetOverview navigate={navigate} />;
      case 'asset-trend':
        return <AssetTrend navigate={navigate} goBack={goBack} />;
      case 'exchange':
        return <Exchange navigate={navigate} goBack={goBack} />;
      case 'bank-cards':
        return <BankCards navigate={navigate} goBack={goBack} />;
      case 'about':
        return <About navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'funds':
        return <Funds navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'reports':
        return <Reports navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'notifications':
        return <Notifications navigate={navigate} goBack={goBack} />;
      case 'support':
        return <Support navigate={navigate} goBack={goBack} />;
      case 'settings':
        return <Settings navigate={navigate} goBack={goBack} />;
      case 'bind-phone':
        return <BindPhone navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'change-email':
        return <ChangeEmail navigate={navigate} goBack={goBack} setToast={setToast} />;
      case 'help':
        return <Help navigate={navigate} goBack={goBack} />;
      case 'profile':
        return <Profile navigate={navigate} setIsLoggedIn={setIsLoggedIn} />;
      // KYC 流程页面（3 步：基本信息 → 证件上传 → 地址证明 + 提交后等待审核）
      case 'kyc-start':
        return <KYCStart navigate={navigate} goBack={goBack} />;
      case 'kyc-id-upload':
        return <KYCIdUpload navigate={navigate} goBack={goBack} />;
      case 'kyc-address-proof':
        return <KYCAddressProof navigate={navigate} goBack={goBack} />;
      case 'kyc-submitted':
        return <KYCSubmitted navigate={navigate} goBack={goBack} />;
      case 'kyc-pi':
        return <KYCPI navigate={navigate} goBack={goBack} />;
      case 'pi-submitted':
        return <PISubmitted navigate={navigate} goBack={goBack} />;
      default:
        return <Events navigate={navigate} setToast={setToast} isLoggedIn={isLoggedIn} />;
    }
  };

  const TOP_LEVEL_PAGES = ['events', 'projects', 'assets', 'profile'];
  const isTopLevel = TOP_LEVEL_PAGES.includes(hash.path);
  // 联动决定 BottomNav 显示 + .app-content 72px 留白（避免游客态 TopLevel 出现死间距）
  const showBottomNav = isTopLevel && isLoggedIn;

  return (
    <LanguageProvider>
      <div className="app-container">
        <div className={`app-content${showBottomNav ? '' : ' no-bottom-pad'}`}>
          <ErrorBoundary>{renderPage()}</ErrorBoundary>
        </div>
        {showBottomNav && <BottomNav current={hash.path} onNavigate={navigate} />}
        {toast && <div className="toast toast-success">{toast}</div>}
      </div>
    </LanguageProvider>
  );
}
