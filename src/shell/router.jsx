// 共享路由表（2026-10-09 嵌入集团 APP 方案 · 方案A）：APP 端页面组件的 lazy 清单与
// path→页面渲染映射。独立原型壳（App.jsx）与嵌入壳（embed/EmbedApp.jsx）共用——
// 新增页面只改这里，双壳自动同步（原 App.jsx renderPage switch 等价搬入，props 逐项未动）。

import { lazy } from 'react';
import ScreenGuard from '../components/ScreenGuard';

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
// 个人信息收集清单（2026-11-24）：法务 Final 定稿对客展示，我的页关于下一栏进入
const PrivacyList = lazy(() => import('../pages/PrivacyList'));
const ChangeEmail = lazy(() => import('../pages/ChangeEmail'));
const KYCStart = lazy(() => import('../pages/KYCStart'));
const KYCIdUpload = lazy(() => import('../pages/KYCIdUpload'));
const KYCAddressProof = lazy(() => import('../pages/KYCAddressProof'));
const KYCBankTransfer = lazy(() => import('../pages/KYCBankTransfer'));
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
const FundStatementExports = lazy(() => import('../pages/FundStatementExports'));
const FundPeriodStatement = lazy(() => import('../pages/FundPeriodStatement'));
const Receipt = lazy(() => import('../pages/Receipt'));
const MailPreview = lazy(() => import('../pages/MailPreview'));
const FundOrders = lazy(() => import('../pages/FundOrders'));
// 委托账户（2026-11-13）：只读展示 + 成交通知单 + 日结单；2026-11-16 增提取申请页（协议 10）
const MandateDetail = lazy(() => import('../pages/MandateDetail'));
const MandateWithdraw = lazy(() => import('../pages/MandateWithdraw'));
const MandateTrades = lazy(() => import('../pages/MandateTrades'));
const MandateAdvice = lazy(() => import('../pages/MandateAdvice'));
// 委托域凭证（2026-11-16）：单据页只放委托自己的月报 + 成交通知单；合约事实进独立页
const MandateStatements = lazy(() => import('../pages/MandateStatements'));
// 委托月报详情（2026-11-20）：只读已出具快照，版式与账户结单同（单纸 + DocViewport）
const MandateReport = lazy(() => import('../pages/MandateReport'));
const MandateAgreement = lazy(() => import('../pages/MandateAgreement'));
// 全部持仓（2026-11-16）：详情页卡内只放前 5 只，全量走这一页
const MandateHoldings = lazy(() => import('../pages/MandateHoldings'));
// 资金记录（2026-11-16）：B 户现金流水（结果旁边的过程入口）
const MandateCash = lazy(() => import('../pages/MandateCash'));
const DailyStatement = lazy(() => import('../pages/DailyStatement'));
// 资产 / 资金（2026-10-28 一期闭环恢复：资产只读聚合 + 资金公共模块最小 4 条路由）
// 2026-11-02 资金审查收尾：#wallet 摘除——资金域归属地为 #asset，#wallet 全仓无正向入口
// （仅子页返回兜底引用，正常点击路径到不了），Wallet.jsx 文件保留不删，二期随资金域重估再定
const AssetOverview = lazy(() => import('../pages/AssetOverview'));
// 资产走势（2026-11-02 接回）：文件与样式一直在，首期裁剪只摘了入口；
// hero 迷你走势是它的唯一入口，点进去不能落回资讯页。
const AssetTrend = lazy(() => import('../pages/AssetTrend'));
const BankCards = lazy(() => import('../pages/BankCards'));
const BankCardAdd = lazy(() => import('../pages/BankCardAdd'));
const Transactions = lazy(() => import('../pages/Transactions'));
const FundOperation = lazy(() => import('../pages/FundOperation'));
const FundRequestDetail = lazy(() => import('../pages/FundRequestDetail'));
const TransactionDetail = lazy(() => import('../pages/TransactionDetail'));
// 数字资产（2026-11-04）：托管钱包对客页面由基金 APP 承担，模块可整体摘除
const CryptoWallet = lazy(() => import('../pages/CryptoWallet'));
const CryptoDeposit = lazy(() => import('../pages/CryptoDeposit'));
const CryptoWithdraw = lazy(() => import('../pages/CryptoWithdraw'));
const CryptoAddresses = lazy(() => import('../pages/CryptoAddresses'));
const CryptoRecords = lazy(() => import('../pages/CryptoRecords'));

// 渲染 APP 端页面（门控放行后调用）。
// ctx: { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn, embed }
// 基金域 + 结单类路由（2026-11-13 防截屏演示）：切离页面时全白遮罩，见 components/ScreenGuard.jsx。
// 结单导出/期间结单/回单/邮件校样（11-12 线）与结单详情同属敏感数据页，一并纳入——
// 防详情页不防导出页等于保护不全。范围超出会议字面（基金详情页），属「基金域全部页面」拍板的自然延伸。
const SCREEN_GUARD_PATHS = new Set([
  'funds', 'fund', 'fund-subscribe', 'fund-redeem', 'fund-orders',
  'fund-statements', 'fund-statement', 'fund-statement-exports',
  'fund-period-statement', 'receipt', 'mail-preview',
  // 委托账户与日结单同属「持仓/资产类敏感页」，一并纳入防切离展示；
  // 提取申请页（2026-11-16）是委托域资金动作页，同口径纳入
  'mandate-detail', 'mandate-withdraw', 'mandate-trades', 'mandate-advice', 'daily-statement',
  // 委托月报（2026-11-20）与日结单同属敏感单据页
  'mandate-report',
  // 委托域新增两页（2026-11-16）：委托单据 / 委托协议同属持仓与条款类敏感页
  'mandate-statements', 'mandate-agreement', 'mandate-holdings', 'mandate-cash',
]);

export function renderAppPage(path, param, ctx) {
  const page = renderAppPageInner(path, param, ctx);
  if (!SCREEN_GUARD_PATHS.has(path)) return page;
  return (
    <>
      <ScreenGuard />
      {page}
    </>
  );
}

function renderAppPageInner(path, param, ctx) {
  const { navigate, goBack, setToast, isLoggedIn, setIsLoggedIn, embed, param2, param3 } = ctx;
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
    // 导出记录（2026-11-12）：结单导出的申请/生成/下载状态都在这里，不挂在结单页里做二级 tab
    case 'fund-statement-exports':
      return <FundStatementExports navigate={navigate} goBack={goBack} />;
    // 期间结单预览（2026-11-12）：param=起始日、param2=截止日，直接决定聚合区间
    case 'fund-period-statement':
      return <FundPeriodStatement from={param} to={param2} goBack={goBack} setToast={setToast} />;
    // 单次资金变动回单：param=单据类型、param2=单据 id
    case 'receipt':
      return <Receipt type={param} id={param2} goBack={goBack} setToast={setToast} />;
    // 邮件校样页（不挂入口）：param=类型、param2=id、param3=期间结单截止日
    case 'mail-preview':
      return <MailPreview type={param} id={param2} to={param3} goBack={goBack} />;
    case 'fund-orders':
      return <FundOrders navigate={navigate} goBack={goBack} setToast={setToast} />;
    // 委托账户（2026-11-13）：只读页面。param = 账户 id / 交易 id / 日结单 id
    case 'mandate-detail':
      return <MandateDetail id={param} navigate={navigate} goBack={goBack} />;
    // 提取申请（2026-11-16 · 协议 10）：委托 B → 现金 A 的第一段；无参读当前用户唯一委托户
    case 'mandate-withdraw':
      return <MandateWithdraw navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'mandate-trades':
      return <MandateTrades navigate={navigate} goBack={goBack} />;
    case 'mandate-advice':
      return <MandateAdvice id={param} goBack={goBack} />;
    // 委托单据（2026-11-16）：月报 + 成交通知单；不接基金账户结单/交易确认单
    case 'mandate-statements':
      return <MandateStatements navigate={navigate} goBack={goBack} />;
    case 'mandate-report':
      return <MandateReport id={param} goBack={goBack} />;
    case 'mandate-agreement':
      return <MandateAgreement goBack={goBack} />;
    // 全部委托持仓（2026-11-16）：详情页卡内预览 5 条，全量在此
    case 'mandate-holdings':
      return <MandateHoldings goBack={goBack} />;
    // 资金记录（2026-11-16）：现金的过程；买入行可点进成交通知单
    case 'mandate-cash':
      return <MandateCash goBack={goBack} navigate={navigate} />;
    case 'daily-statement':
      return <DailyStatement id={param} goBack={goBack} />;
    // 资产 / 资金公共模块（2026-10-28 恢复；app/withdraw/bank-cards/transactions 资金路由全量接线——
    // 下方 bank-cards/transactions 两个 case 即当日补齐；#wallet 已于 2026-11-02 摘除，见上方注释）
    // 2026-11-02 资金审查口径 A：换汇收口——#exchange 路由与 lazy 引入摘除（Exchange.jsx 文件保留，
    // Wallet 入口同步摘除，数据层 submitExchangeRequest 兜底拦截；二期接回恢复三处即可）
    case 'asset':
      return <AssetOverview navigate={navigate} goBack={goBack} />;
    case 'asset-trend':
      return <AssetTrend navigate={navigate} goBack={goBack} />;
    // case 'wallet' 2026-11-02 摘除（死页：全仓无正向入口，仅子页返回兜底引用——兜底已改 #asset），
    // #wallet 深链落 default 资讯页。二期恢复 = lazy 清单 + 本 case + Wallet.jsx 头注释三处同步
    // 2026-10-28：APP 侧收口——银行卡（白名单验证 + eDDA 授权）、交易流水接回。
    // 这两页文件一直在，只是首期裁剪时摘了入口；eDDA 的「模拟授权」按钮已改为跳本页授权。
    // 换汇 2026-11-02 口径收口：入口/路由/数据层三层拦截（见上方 case 区注释）
    case 'bank-cards':
      return <BankCards navigate={navigate} goBack={goBack} setToast={setToast} />;
    // 添加银行卡（2026-11-04）：由底部弹层改为独立页；param 传当前选中币种，如 #bank-card-add/USD
    case 'bank-card-add':
      return <BankCardAdd navigate={navigate} goBack={goBack} setToast={setToast} currency={param} />;
    case 'transactions':
      return <Transactions navigate={navigate} goBack={goBack} />;
    case 'fund-operation':
      return <FundOperation mode={param || 'deposit'} navigate={navigate} goBack={goBack} />;
    // 数字资产（2026-11-04）：全部挂在 #crypto/* 命名空间，入口在资产页；
    // 将来收敛成外链时，删掉本组 case + Crypto* 六个文件 + 入口卡即可，不动核心页面。
    case 'crypto':
      return <CryptoWallet navigate={navigate} goBack={goBack} />;
    case 'crypto-deposit':
      return <CryptoDeposit param={param} navigate={navigate} goBack={goBack} />;
    case 'crypto-withdraw':
      return <CryptoWithdraw navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'crypto-addresses':
      return <CryptoAddresses navigate={navigate} goBack={goBack} setToast={setToast} />;
    case 'crypto-records':
      return <CryptoRecords navigate={navigate} goBack={goBack} />;
    // CryptoMap 内部演示页已移出投资人路由（2026-11-13 阶段 2，文件保留）：
    // 旧深链按 fund-requests 的先例重定向到数字资产记录，不落 404
    case 'crypto-map':
      return <CryptoRecords navigate={navigate} goBack={goBack} />;
    case 'fund-requests':
      // 2026-10-29：资金申请页已并入「资金明细」，旧深链落到同一页（默认筛「全部状态」即可看到在途单）
      return <Transactions navigate={navigate} goBack={goBack} />;
    case 'fund-request':
      return <FundRequestDetail id={param} navigate={navigate} goBack={goBack} />;
    // 交易详情（2026-11-02）：无申请单的历史导入流水详情出口，资金明细行统一跳详情的落点
    case 'transaction':
      return <TransactionDetail id={param} goBack={goBack} />;
    // 2026-10-16 首期裁剪：资产树 13 路由摘除（wallet/transactions/fund-requests/fund-request/
    // fund-operation/holdings/assets/asset-trend/exchange/bank-cards/funds/reports/spv-sign）——
    // 命中即落 default 分支（资讯页）。
    // 2026-11-02：asset-trend 已接回（hero 迷你走势的落地页）；其余状态见各 case 注释。
    // 2026-10-19：#subscriptions 汇总页摘除（双壳均无活入口的死页；深链直入后列表⇄详情
    // 双返回键成死循环）。问卷进度以项目为粒度：项目详情 CTA 直达 #my-subscription/:id。
    // 2026-10-22 RO 整改：#project-heat（申购热度页）与 #reports（合规报告）随页面下线一并摘除；
    // SPV 签署与资金全部线下，APP 只做问卷收集与进度查看
    case 'about':
      return <About navigate={navigate} goBack={goBack} setToast={setToast} />;
    // 2026-11-24：个人信息收集清单（法务定稿披露页；COMPLIANCE_PATHS 白名单放行，见 guard.js）
    case 'privacy-list':
      return <PrivacyList goBack={goBack} />;
    case 'notifications':
      return <Notifications navigate={navigate} goBack={goBack} />;
    case 'support':
      return <Support navigate={navigate} goBack={goBack} />;
    case 'settings':
      return <Settings navigate={navigate} goBack={goBack} setToast={setToast} setIsLoggedIn={setIsLoggedIn} />;
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
    // KYC 第 4 步（2026-11-04）：银行转账认证 → 首卡创建 + 首充登记 + 提交 KYC
    case 'kyc-bank-transfer':
      return <KYCBankTransfer navigate={navigate} goBack={goBack} />;
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
