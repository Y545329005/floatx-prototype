import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { TrendingUp, UserRound } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import TermsUpdateGate from '../components/TermsUpdateGate';
// 共享内核：门控决策与 APP 端路由表与独立原型壳（App.jsx）同源（2026-10-09 嵌入方案·方案A）
import { parseHash, resolveGate } from '../shell/guard';
import { renderAppPage } from '../shell/router';
import { testAccounts, setMockCurrentUser, restoreKycStatus, currentUser as currentUserData, initState, resetSubscriptionForDemo, termsState } from '../mock/data';
import './embed.css';

// ── 身份注入（模拟宿主 SSO）───────────────────────────────────────────
// 嵌入形态下登录由集团 APP 承担，本模块通过 ?uid= 接收宿主注入的身份：
//   ?uid=u1（默认）= approved · KYC 已通过  → 全功能体验
//   ?uid=u2          = pending  · 手机 KYC0  → 未提交，触发 KYC 流程门控
//   ?uid=u3          = pep      · 手机 KYC1  → 已提交待审核（REQUIRES_ACTION 桶）
// 真实接入时此函数替换为宿主 token → 会话接口（见 docs/嵌入集团APP集成方案.md §身份契约）
function getUidAccount() {
  const uid = new URLSearchParams(window.location.search).get('uid');
  const type = uid === 'u2' ? 'pending' : uid === 'u3' ? 'pep' : 'approved';
  return testAccounts[type];
}

// ── 双 Tab 导航（2026-10-13 改版）────────────────────────────────────
// 基金业务以「独立一级业务 Tab」形态设计：底栏常驻（模拟宿主原生 tabbar，
// 真实接入时由集团原生渲染，WebView 在其上方），Tab 间互切取代旧的
// 「顶栏页签 + ‹ 集团首页返回」体系（#host 宿主模拟页已随之删除）。
// 路由归属：命中 MINE_TAB_PATHS 的二级页高亮「我的」，其余（含未知路径）归「财富」。
const WEALTH_TAB = { key: 'wealth', label: '财富', icon: TrendingUp };
const MINE_TAB = { key: 'profile', label: '我的', icon: UserRound };
const MINE_TAB_PATHS = new Set([
  'profile',
  'kyc-start', 'kyc-id-upload', 'kyc-address-proof', 'kyc-submitted', 'kyc-pi', 'pi-submitted',
  'security-center', 'notifications', 'support', 'settings', 'help', 'about',
  'bind-phone', 'change-email',
]);

export default function EmbedApp() {
  // ?reset= 检测（同步，渲染前执行）：跳过 localStorage 恢复指定 subscription（演示签署流程用，与 App.jsx 同款）
  const _url = new URL(window.location.href);
  const _resetTarget = _url.searchParams.has('reset') ? (_url.searchParams.get('reset') || 's2') : null;

  // 宿主 SSO 注入的身份（?uid= → 测试账号）
  const [account] = useState(getUidAccount);

  // 嵌入形态恒已登录（身份由宿主 SSO 注入，无独立登录页；登录四页归宿主）
  const isLoggedIn = true;

  // 首次渲染前的一次性初始化：持久化状态恢复 + SSO 身份落库**都**必须在此同步完成
  // （2026-08-10 / 2026-10-12）
  const _initDone = useRef(false);
  if (!_initDone.current) {
    initState(_resetTarget);
    // SSO 身份落库：合规门控读 data.js 模块级 currentUser（2026-09-18 约定）。
    // 放到 mount 后的 effect 里执行、又没有后续 re-render 时，首帧会以默认账号 u1 判定 →
    // 深链 ?uid=u2#wallet 不被门控拦截，且渲染出 u1 的数据（2026-10-12 修复）。
    // restoreKycStatus 依赖 initState 恢复的 kycSubmissions 快照，故必须置于 initState 之后。
    setMockCurrentUser(account);
    // 从提交记录回读 KYC 状态（与 App.jsx __loginWithTestAccount 同逻辑：approved 不回读）
    if (account.id !== 'u1') restoreKycStatus(account.id);
    _initDone.current = true;
  }

  // 首屏 hash：深链直入先过一次门控，命中重定向则**在渲染前**用 replaceState 落地。
  // 不能在渲染期改 hash——首帧渲染早于下面注册 hashchange 监听器的 effect，那个 hashchange
  // 会在监听器就位前发出而丢失，页面就卡在空白内容页（2026-10-12 修复）。
  // 用 replaceState 不产生历史条目：宿主深链被拦时，返回手势应退出模块而不是回到被拦页。
  const [hash, setHash] = useState(() => {
    let initial = parseHash(window.location.hash);
    // #host 宿主模拟页已删除（2026-10-13 双 Tab 改版）：旧演示链接 fallback 到财富页
    if (initial.path === 'host') {
      window.history.replaceState(null, '', '#wealth');
      initial = parseHash('#wealth');
    }
    const g = resolveGate({ path: initial.path, isLoggedIn, user: currentUserData });
    if (g?.type !== 'redirect') return initial;
    window.history.replaceState(null, '', `#${g.to}`);
    return parseHash(`#${g.to}`);
  });
  const [toast, setToast] = useState(null);
  // 条款重同意闸门确认后触发整树刷新（与 App.jsx 同款）
  const [, setTermsTick] = useState(0);

  // ?reset= 演示重置（与 App.jsx 同款）
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('reset')) {
      const id = url.searchParams.get('reset') || 's2';
      resetSubscriptionForDemo(id);
      setToast('演示状态已重置，您可以重新体验签署流程');
      url.searchParams.delete('reset');
      history.replaceState(null, '', url.pathname + url.hash);
    }
  }, []);

  // 导航栈：记录「已离开的页面」（不含当前页），与浏览器历史自动同步（与 App.jsx 同款：
  // 新 hash == 栈顶 → 弹栈；否则压入上一页。navigate 不手动压栈，全靠 hashchange 校正。
  // WebView 侧滑/物理返回手势 → hash 历史 → 本栈自动同步，天然兼容宿主返回。）
  const navStackRef = useRef([]);
  const lastHashRef = useRef(hash.full || 'wealth');
  // goBack 走 fallback（栈空）时的「返回语义」标记：hashchange 消费后即清。
  // fallback 跳转若被按前进压栈，深链直入详情→返回列表后子页残留在栈里，
  // 下次返回时「栈顶优先」弹回子页——列表⇄详情双返回键页成死循环（与 App.jsx 同修）。
  const goBackFallbackRef = useRef(false);

  useEffect(() => {
    const onHashChange = () => {
      const newHash = parseHash(window.location.hash);
      const newFull = newHash.full || 'wealth';
      const prevFull = lastHashRef.current;
      setHash(newHash);
      if (newFull !== prevFull) {
        const stack = navStackRef.current;
        if (stack[stack.length - 1] === newFull) {
          navStackRef.current = stack.slice(0, -1);
        } else if (goBackFallbackRef.current) {
          // goBack fallback（返回语义）：不压栈，消费标记
          goBackFallbackRef.current = false;
        } else {
          navStackRef.current = [...stack, prevFull];
        }
        lastHashRef.current = newFull;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'wealth';  // 嵌入形态默认落地：财富聚合页（基金业务一级 Tab）
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
    window.location.hash = h.startsWith('#') ? h : `#${h}`;
  }, []);

  // 返回上一页（原路径返回）。fallback = 栈空（宿主深链直入/刷新）时的默认目标。
  const goBack = useCallback((fallback) => {
    const stack = navStackRef.current;
    const target = stack[stack.length - 1] || fallback || 'wealth';
    const current = parseHash(window.location.hash).full || 'wealth';
    if (target !== current) {
      goBackFallbackRef.current = stack.length === 0;
      window.location.hash = target;
    }
  }, []);

  // 合规门控裁定：与独立原型同源（shell/guard.js）；嵌入形态恒已登录，login 分支不触发。
  // 裁定必须在渲染内容之前完成——否则「重定向帧」（hash.path 仍是原值）会先闪出被拦页面。
  const gate = resolveGate({ path: hash.path, isLoggedIn, user: currentUserData });
  const redirectTo = gate?.type === 'redirect' ? gate.to : null;
  if (redirectTo) navigate(redirectTo);   // 运行时导航的重定向（首屏直入已在 hash 初始化器里落地）
  const pagePath = redirectTo || hash.path;

  // 底栏高亮归属：我的域二级页 →「我的」，其余（财富域/未知路径）→「财富」
  const activeTab = MINE_TAB_PATHS.has(pagePath) ? MINE_TAB : WEALTH_TAB;

  // 门控与渲染同源；setIsLoggedIn 传 noop：退出登录归宿主（集团「我的」承接），本模块无登录页。
  const renderEmbed = () => {
    if (redirectTo) return null;
    return renderAppPage(hash.path, hash.param, { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn: () => {}, embed: true });
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-lazy-loading">加载中…</div>}>
            {renderEmbed()}
          </Suspense>
        </ErrorBoundary>
      </div>
      {/* 双 Tab 底栏：模拟宿主原生 tabbar（真实接入时由集团 APP 渲染，WebView 在其上方）。
          样式复用 styles.css 的 .bottom-nav 体系（与独立原型同规格）。 */}
      <nav className="bottom-nav">
        {[WEALTH_TAB, MINE_TAB].map(tab => {
          const Icon = tab.icon;
          const active = activeTab.key === tab.key;
          return (
            <button
              key={tab.key}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(`#${tab.key}`)}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {toast && <div className="toast toast-success">{toast}</div>}
      {/* 条款更新重同意闸门：合规能力，嵌入形态保留（与 App.jsx 同款） */}
      {isLoggedIn && termsState.agreedVersion !== termsState.currentVersion && (
        <TermsUpdateGate onAgreed={() => setTermsTick(t => t + 1)} />
      )}
    </div>
  );
}
