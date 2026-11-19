import { mandateAccounts, mandateWithdrawals, mandateTrades, mandateAgreements, MANDATE_ACCOUNT_STATUS, MANDATE_WITHDRAWAL_STATUS, MANDATE_TRADE_STATUS } from '../mock/data';
import AdminMandateAccounts from './AdminMandateAccounts';
import AdminMandateTrades from './AdminMandateTrades';
import AdminMandateReports from './AdminMandateReports';
import MandateAgreementLedger from './AdminMandateAgreements';

// 委托业务（2026-11-17 IA 收敛 · 方案 A；同日工作台化重排）
//
// 第一性原理：后台页面 = 运营完成任务的工作台。委托业务与其余 23 个后台页共用同一套骨架：
// 页头统计（存量）→ 视图控制行（筛选 + 搜索）→ 表格 → 分页 → 右侧抽屉；
// 队列数字只由页签 badge 与侧边栏 badge 承担（2026-11-19 已删页头待办行）。
//
// IA（2026-11-17 二次拍板）：一页四签，签序 = 流程序——
// 协议（签协议）→ 账户（开户+授权）→ 交易与估值 → 日结与月报，与页头流程线一一对应。
// 协议台账独立成签（用户标注质疑「同一页面两张列表」成立：两表各有主按钮与表头，
// 数据增长后台账会把账户表挤出首屏）；开户与协议的联动靠数据层闸门与账户抽屉里的协议号，不靠同屏。
//
// 路由：#admin/mandate/{tab}/{id}，tab ∈ agreements|accounts|trades|reports（缺省 accounts，
// 账户是主要工作面）。抽屉仍走 URL param3（深链可达），tab 切换写 URL（刷新/返回保留位置）。
// 旧深链（#admin/mandate-accounts/{id} 等）由 App.jsx 的 ADMIN_ROUTE_ALIAS 渲染期归一，无副作用导航。
//
// 路由：#admin/mandate/{tab}/{id}，tab ∈ agreements|accounts|trades|reports（缺省 accounts，
// 账户是主要工作面）。抽屉仍走 URL param3（深链可达），tab 切换写 URL（刷新/返回保留位置）。
// 旧深链（#admin/mandate-accounts/{id} 等）由 App.jsx 的 ADMIN_ROUTE_ALIAS 渲染期归一，无副作用导航。

const TABS = [
  { key: 'agreements', label: '协议' },
  { key: 'accounts', label: '账户' },
  { key: 'trades', label: '交易与估值' },
  { key: 'reports', label: '日结与月报' },
];

export default function AdminMandate({ admin, tab, detailId, correctionOf, navigate }) {
  const active = TABS.some(t => t.key === tab) ? tab : 'accounts';
  const goTab = (key) => { if (navigate) navigate(key === 'accounts' ? '#admin/mandate' : `#admin/mandate/${key}`); };

  const pendingAuth = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.PENDING).length;
  const pendingWd = mandateWithdrawals.filter(w => w.status === MANDATE_WITHDRAWAL_STATUS.PENDING || w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS).length;
  const pendingTrades = mandateTrades.filter(t => t.status === MANDATE_TRADE_STATUS.PENDING).length;
  const draftAgreements = mandateAgreements.filter(a => a.status === 'draft').length;
  const activeAccounts = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.ACTIVE).length;

  return (
    <div className="admin-page admin-page--mandate">
      <div className="admin-page-header">
        <h1>委托业务</h1>
        <span className="admin-header-summary">共 {mandateAccounts.length} 户 · 已生效 {activeAccounts} · 待授权 {pendingAuth}</span>
      </div>

      <div className="fund-tabs" role="tablist" aria-label="委托业务分栏">
        {TABS.map(x => (
          <button
            key={x.key}
            role="tab"
            aria-selected={active === x.key}
            className={`fund-tab ${active === x.key ? 'active' : ''}`}
            onClick={() => goTab(x.key)}
          >
            {x.label}
            {x.key === 'agreements' && draftAgreements > 0 && <span className="fund-tab-count">{draftAgreements}</span>}
            {x.key === 'accounts' && (pendingAuth + pendingWd) > 0 && <span className="fund-tab-count">{pendingAuth + pendingWd}</span>}
            {x.key === 'trades' && pendingTrades > 0 && <span className="fund-tab-count">{pendingTrades}</span>}
          </button>
        ))}
      </div>

      {active === 'agreements' && <MandateAgreementLedger admin={admin} />}
      {active === 'accounts' && <AdminMandateAccounts admin={admin} detailId={detailId} navigate={navigate} />}
      {active === 'trades' && <AdminMandateTrades admin={admin} detailId={detailId} correctionOf={correctionOf} navigate={navigate} />}
      {active === 'reports' && <AdminMandateReports admin={admin} detailId={detailId} navigate={navigate} />}
    </div>
  );
}
