// 共享路由表（2026-10-09 嵌入集团 APP 方案 · 方案A）：APP 端页面组件的 lazy 清单与
// path→页面渲染映射。独立原型壳（App.jsx）与嵌入壳（embed/EmbedApp.jsx）共用——
// 新增页面只改这里，双壳自动同步（原 App.jsx renderPage switch 等价搬入，props 逐项未动）。

import { lazy } from 'react';

// APP 端页面按需加载（2026-09-24 主包瘦身 Phase 1 模式延续：36 页全部 lazy）
// 2026-10-16 首期裁剪：资产树 13 页路由摘除（钱包/出入金/换汇/银行卡/持仓/报告等线上账本页，
// 文件保留不删，二期按「线下转账+凭证登记」新形态恢复）；
// 2026-10-19：#subscriptions 汇总页摘除（无入口死页 + 死循环，见下方 case 区注释），
// my-subscription 保留（项目详情内直达），spv-sign 保持摘除
const ProjectMarket = lazy(() => import('../pages/ProjectMarket'));
const Wealth = lazy(() => import('../pages/Wealth'));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail'));
const SearchPage = lazy(() => import('../pages/Search'));
const Events = lazy(() => import('../pages/Events'));
const EventDetail = lazy(() => import('../pages/EventDetail'));
const MySubscription = lazy(() => import('../pages/MySubscription'));
const Profile = lazy(() => import('../pages/Profile'));
const Notifications = lazy(() => import('../pages/Notifications'));
const Support = lazy(() => import('../pages/Support'));
const Settings = lazy(() => import('../pages/Settings'));
const SecurityCenter = lazy(() => import('../pages/SecurityCenter'));
const Help = lazy(() => import('../pages/Help'));
const About = lazy(() => import('../pages/About'));
const ChangeEmail = lazy(() => import('../pages/ChangeEmail'));
const KYCStart = lazy(() => import('../pages/KYCStart'));
const KYCIdUpload = lazy(() => import('../pages/KYCIdUpload'));
const KYCAddressProof = lazy(() => import('../pages/KYCAddressProof'));
const KYCSubmitted = lazy(() => import('../pages/KYCSubmitted'));
const KYCPI = lazy(() => import('../pages/KYCPI'));
const PISubmitted = lazy(() => import('../pages/PISubmitted'));
// 一期基金（线下收款 + 人工确认 + 结单）
const Funds = lazy(() => import('../pages/Funds'));
const FundDetail = lazy(() => import('../pages/FundDetail'));
const FundSubscribe = lazy(() => import('../pages/FundSubscribe'));
const FundRedeem = lazy(() => import('../pages/FundRedeem'));
const FundStatements = lazy(() => import('../pages/FundStatements'));
const FundStatementDetail = lazy(() => import('../pages/FundStatementDetail'));
const FundOrders = lazy(() => import('../pages/FundOrders'));
// 资产 / 资金（2026-10-28 一期闭环恢复：资产只读聚合 + 资金公共模块最小 4 条路由）
const AssetOverview = lazy(() => import('../pages/AssetOverview'));
const Wallet = lazy(() => import('../pages/Wallet'));
const BankCards = lazy(() => import('../pages/BankCards'));
const Exchange = lazy(() => import('../pages/Exchange'));
const Transactions = lazy(() => import('../pages/Transactions'));
const FundOperation = lazy(() => import('../pages/FundOperation'));
const FundRequests = lazy(() => import('../pages/FundRequests'));
const FundRequestDetail = lazy(() => import('../pages/FundRequestDetail'));

// 渲染 APP 端页面（门控放行后调用）。
// ctx: { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn, embed }
export function renderAppPage(path, param, ctx) {
  const { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn, embed, param2 } = ctx;
  switch (path) {
    case 'search':
      return <SearchPage navigate={navigate} goBack={goBack} isLoggedIn={isLoggedIn} />;
    case 'projects':
      return <ProjectMarket navigate={navigate} embed={embed} goBack={goBack} />;
    case 'wealth':
      // 财富聚合页（2026-10-13 嵌入形态双 Tab 改版）：路演+项目+资产一级整合
      return <Wealth navigate={navigate} />;
    case 'project':
      return <ProjectDetail id={param} navigate={navigate} goBack={goBack} />;
    case 'events':
      return <Events navigate={navigate} setToast={setToast} isLoggedIn={isLoggedIn} embed={embed} goBack={goBack} />;
    case 'event':
      return <EventDetail id={param} navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'my-subscription':
      return <MySubscription id={param} navigate={navigate} goBack={goBack} />;
    // 一期基金
    case 'funds':
      return <Funds navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'fund':
      return <FundDetail id={param} navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'fund-subscribe':
      return <FundSubscribe id={param} navigate={navigate} goBack={goBack} setToast={setToast} />;
    // 赎回申请（2026-10-28 P2）：param = holdingId，不是 fundId——
    // 同一只基金可能多币种持仓，赎回对象必须是"那一笔持仓"
    case 'fund-redeem':
      // param2 = 入口来源：asset 表示从资产页持仓行进来，返回要回资产页（2026-10-28 双入口）
      return <FundRedeem id={param} from={param2} navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'fund-statements':
      return <FundStatements navigate={navigate} goBack={goBack} />;
    case 'fund-statement':
      return <FundStatementDetail id={param} navigate={navigate} goBack={goBack} />;
    case 'fund-orders':
      return <FundOrders navigate={navigate} goBack={goBack} setToast={setToast} />;
    // 资产 / 资金公共模块（2026-10-28 恢复；只接最小 4 条资金路由，
    // 换汇 exchange / 银行卡 bank-cards / 交易流水 transactions 仍未接线——
    // Wallet 页已同步摘除这三个入口，避免命中 default 静默渲染资讯页）
    case 'asset':
      return <AssetOverview navigate={navigate} goBack={goBack} />;
    case 'wallet':
      return <Wallet navigate={navigate} goBack={goBack} />;
    // 2026-10-28：APP 侧收口——银行卡（白名单验证 + eDDA 授权）、换汇、交易流水接回。
    // 这三页文件一直在，只是首期裁剪时摘了入口；eDDA 的「模拟授权」按钮已改为跳本页授权。
    case 'bank-cards':
      return <BankCards navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'exchange':
      return <Exchange navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'transactions':
      return <Transactions navigate={navigate} goBack={goBack} />;
    case 'fund-operation':
      return <FundOperation mode={param || 'deposit'} navigate={navigate} goBack={goBack} />;
    case 'fund-requests':
      return <FundRequests navigate={navigate} goBack={goBack} />;
    case 'fund-request':
      return <FundRequestDetail id={param} navigate={navigate} goBack={goBack} />;
    // 2026-10-16 首期裁剪：资产树 13 路由摘除（wallet/transactions/fund-requests/fund-request/
    // fund-operation/holdings/assets/asset-trend/exchange/bank-cards/funds/reports/spv-sign）——
    // 命中即落 default 分支（资讯页）。
    // 2026-10-19：#subscriptions 汇总页摘除（双壳均无活入口的死页；深链直入后列表⇄详情
    // 双返回键成死循环）。问卷进度以项目为粒度：项目详情 CTA 直达 #my-subscription/:id。
    // 2026-10-22 RO 整改：#project-heat（申购热度页）与 #reports（合规报告）随页面下线一并摘除；
    // SPV 签署与资金全部线下，APP 只做问卷收集与进度查看
    case 'about':
      return <About navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'notifications':
      return <Notifications navigate={navigate} goBack={goBack} />;
    case 'support':
      return <Support navigate={navigate} goBack={goBack} />;
    case 'settings':
      return <Settings navigate={navigate} goBack={goBack} />;
    case 'security-center':
      return <SecurityCenter navigate={navigate} goBack={goBack} setToast={setToast} setIsLoggedIn={setIsLoggedIn} />;
    case 'change-email':
      return <ChangeEmail navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'help':
      return <Help navigate={navigate} goBack={goBack} />;
    case 'profile':
      return <Profile navigate={navigate} setIsLoggedIn={setIsLoggedIn} />;
    // KYC 流程页面（3 步：基本信息 → 证件上传 → 地址证明 + 提交后等待审核）
    case 'kyc-start':
      return <KYCStart navigate={navigate} goBack={goBack} setIsLoggedIn={setIsLoggedIn} />;
    case 'kyc-id-upload':
      return <KYCIdUpload navigate={navigate} goBack={goBack} setIsLoggedIn={setIsLoggedIn} />;
    case 'kyc-address-proof':
      return <KYCAddressProof navigate={navigate} goBack={goBack} setIsLoggedIn={setIsLoggedIn} />;
    case 'kyc-submitted':
      return <KYCSubmitted navigate={navigate} goBack={goBack} />;
    case 'kyc-pi':
      return <KYCPI navigate={navigate} goBack={goBack} />;
    case 'pi-submitted':
      return <PISubmitted navigate={navigate} goBack={goBack} />;
    default:
      return <Events navigate={navigate} setToast={setToast} isLoggedIn={isLoggedIn} embed={embed} goBack={goBack} />;
  }
}
