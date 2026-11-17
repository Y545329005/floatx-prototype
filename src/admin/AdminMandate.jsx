import { mandateAccounts, mandateWithdrawals, mandateTrades, mandateAgreements, MANDATE_ACCOUNT_STATUS, MANDATE_WITHDRAWAL_STATUS, MANDATE_TRADE_STATUS } from '../mock/data';
import AdminMandateAccounts from './AdminMandateAccounts';
import AdminMandateTrades from './AdminMandateTrades';
import AdminMandateReports from './AdminMandateReports';

// 委托业务（2026-11-17 IA 收敛 · 方案 A）
//
// 第一性原理：后台菜单是运营任务的入口，不是数据表的目录。委托业务是同一条任务流
// （签协议 → 开户+授权 → 交易/估值 → 日结月报），原先 4 张表切 4 个一级菜单，
// 用户验收原话「随便点开几个都已经觉得很混乱」。收成一页三签，协议台账并入账户签
//（协议是开户流程第一步）。
//
// 路由：#admin/mandate/{tab}/{id}，tab ∈ accounts|trades|reports（缺省 accounts）。
// 抽屉仍走 URL param3（深链可达），tab 切换写 URL（刷新/返回保留位置，与 #admin/funds 同模式）。
// 旧深链（#admin/mandate-accounts/{id} 等）由 App.jsx 的 ADMIN_ROUTE_ALIAS 渲染期归一，无副作用导航。

const TABS = [
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
  const pendingTotal = pendingAuth + pendingWd + pendingTrades;

  return (
    <div className="admin-page admin-page--mandate">
      <div className="admin-page-header">
        <h1>委托业务</h1>
        <span className="admin-header-summary">
          {mandateAccounts.length} 个账户 · {mandateAgreements.length} 份协议 · 待办 {pendingTotal}
          （授权 {pendingAuth} · 提取 {pendingWd} · 交易复核 {pendingTrades}）·
          协议 → 开户 → 交易 → 报告在同一条流程上，按签操作
        </span>
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
            {x.key === 'accounts' && (pendingAuth + pendingWd) > 0 && <span className="fund-tab-count">{pendingAuth + pendingWd}</span>}
            {x.key === 'trades' && pendingTrades > 0 && <span className="fund-tab-count">{pendingTrades}</span>}
          </button>
        ))}
      </div>

      {active === 'accounts' && <AdminMandateAccounts admin={admin} detailId={detailId} navigate={navigate} />}
      {active === 'trades' && <AdminMandateTrades admin={admin} detailId={detailId} correctionOf={correctionOf} navigate={navigate} />}
      {active === 'reports' && <AdminMandateReports admin={admin} detailId={detailId} navigate={navigate} />}
    </div>
  );
}
