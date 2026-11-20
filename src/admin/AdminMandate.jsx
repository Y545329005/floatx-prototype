import {
  mandateAccounts,
  mandateWithdrawals,
  mandateTrades,
  mandateFees,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_WITHDRAWAL_STATUS,
  MANDATE_TRADE_STATUS,
  getMandateValuationBoard,
} from '../mock/data';
import AdminMandateAccounts from './AdminMandateAccounts';
import AdminMandateTrades from './AdminMandateTrades';
import AdminMandateValuation from './AdminMandateValuation';
import MandateAgreementLedger from './AdminMandateAgreements';

// 委托业务（2026-11-19 一签一表；2026-11-20 日结/月报拆成独立菜单）
//
// 第一性原理：后台页面 = 运营完成任务的工作台。委托业务与其余后台页共用同一套骨架：
// 页头统计（存量）→ 页签 → 视图控制行（筛选 + 搜索）→ 表格 → 分页 → 右侧抽屉。
// 队列数字只由侧边栏 badge 与页签 badge 承担（页头不再另设待办行）。
//
// 为什么日结/月报不在这四签里：它们是周期性文档（一个按天批量出单、一个按月末出具），
// 不是日常台账。塞进同一页会变成六签，且两套统计/筛选/分页互相干扰。
//
// 路由：#admin/mandate/{tab}/{id}，tab ∈ agreements|accounts|trades|valuation。
// 缺省 accounts（主要工作面）。旧 #admin/mandate/reports|daily|monthly 深链在 App.jsx 渲染期归一到新菜单。

const TABS = [
  { key: 'agreements', label: '协议' },
  { key: 'accounts', label: '账户' },
  { key: 'trades', label: '交易' },
  { key: 'valuation', label: '估值' },
];

export default function AdminMandate({ admin, tab, detailId, correctionOf, navigate }) {
  const active = TABS.some(t => t.key === tab) ? tab : 'accounts';
  const goTab = (key) => { if (navigate) navigate(key === 'accounts' ? '#admin/mandate' : `#admin/mandate/${key}`); };

  const pendingAuth = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.PENDING).length;
  const pendingWd = mandateWithdrawals.filter(w => w.status === MANDATE_WITHDRAWAL_STATUS.PENDING || w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS).length;
  const pendingFees = mandateFees.filter(f => f.status === 'pending').length;
  const pendingTrades = mandateTrades.filter(t => t.status === MANDATE_TRADE_STATUS.PENDING).length;
  const activeAccounts = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.ACTIVE).length;
  const unvalued = getMandateValuationBoard().filter(v => !v.valued).length;

  const badges = {
    accounts: pendingAuth + pendingWd + pendingFees,
    trades: pendingTrades,
    valuation: unvalued,
  };

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
            {badges[x.key] > 0 && <span className="fund-tab-count">{badges[x.key]}</span>}
          </button>
        ))}
      </div>

      {active === 'agreements' && <MandateAgreementLedger admin={admin} />}
      {active === 'accounts' && <AdminMandateAccounts admin={admin} detailId={detailId} navigate={navigate} />}
      {active === 'trades' && <AdminMandateTrades admin={admin} detailId={detailId} correctionOf={correctionOf} navigate={navigate} />}
      {active === 'valuation' && <AdminMandateValuation admin={admin} navigate={navigate} />}
    </div>
  );
}
