import {
  mandateAccounts,
  mandateWithdrawals,
  mandateTrades,
  mandateAgreements,
  mandateFees,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_WITHDRAWAL_STATUS,
  MANDATE_TRADE_STATUS,
  getMandateValuationBoard,
  getMandateClients,
  getDailyStatements,
  buildMandateMonthlyReport,
} from '../mock/data';
import AdminMandateAccounts from './AdminMandateAccounts';
import AdminMandateTrades from './AdminMandateTrades';
import AdminMandateValuation from './AdminMandateValuation';
import AdminMandateDaily from './AdminMandateDaily';
import AdminMandateMonthly from './AdminMandateMonthly';
import MandateAgreementLedger from './AdminMandateAgreements';

// 委托业务（2026-11-19 二次收敛：一签一表）
//
// 第一性原理：后台页面 = 运营完成任务的工作台。委托业务与其余后台页共用同一套骨架：
// 页头统计（存量）→ 页签 → 视图控制行（筛选 + 搜索）→ 表格 → 分页 → 右侧抽屉。
// 队列数字只由侧边栏 badge 与页签 badge 承担（页头不再另设待办行）。
//
// 为什么是六签而不是四签（2026-11-19 用户质问「三个按钮的内容都进列表吗」「为什么一页两个列表」）：
//   · 估值是**标的**级事实（一只 AAPL 当日一个价，与几个账户持有无关），
//     按账户录会随户数翻倍且同一标的出现多个价；它天然是一张「标的 × 现价」表。
//   · 费用是**账户**级合同事实（费率/起算日/高水位按账户），跟着账户抽屉走。
//   · 日结（按客户、当日作业面）与月报（按账户 × 期间）粒度不同，一签放两张表 =
//     两个统计行 + 两套筛选 + 两套分页，数据一涨就互相干扰。
//
// 路由：#admin/mandate/{tab}/{id}，tab ∈ agreements|accounts|trades|valuation|daily|monthly。
// 缺省 accounts（主要工作面）。旧 reports 深链在渲染期归一为 daily（不改 hash、无导航副作用）。

const TABS = [
  { key: 'agreements', label: '协议' },
  { key: 'accounts', label: '账户' },
  { key: 'trades', label: '交易' },
  { key: 'valuation', label: '估值' },
  { key: 'daily', label: '日结' },
  { key: 'monthly', label: '月报' },
];

// 旧 URL 兼容：#admin/mandate/reports → daily（上一版把日结与月报放同一签）
const TAB_ALIAS = { reports: 'daily' };

const todayStr = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminMandate({ admin, tab, detailId, correctionOf, navigate }) {
  const wanted = TAB_ALIAS[tab] || tab;
  const active = TABS.some(t => t.key === wanted) ? wanted : 'accounts';
  const goTab = (key) => { if (navigate) navigate(key === 'accounts' ? '#admin/mandate' : `#admin/mandate/${key}`); };

  const today = todayStr();
  const month = thisMonth();

  const pendingAuth = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.PENDING).length;
  const pendingWd = mandateWithdrawals.filter(w => w.status === MANDATE_WITHDRAWAL_STATUS.PENDING || w.status === MANDATE_WITHDRAWAL_STATUS.IN_PROGRESS).length;
  const pendingFees = mandateFees.filter(f => f.status === 'pending').length;
  const pendingTrades = mandateTrades.filter(t => t.status === MANDATE_TRADE_STATUS.PENDING).length;
  const draftAgreements = mandateAgreements.filter(a => a.status === 'draft').length;
  const activeAccounts = mandateAccounts.filter(a => a.status === MANDATE_ACCOUNT_STATUS.ACTIVE).length;

  const unvalued = getMandateValuationBoard().filter(v => !v.valued).length;
  const dailyPending = getMandateClients()
    .filter(c => !getDailyStatements(c.userId).some(s => s.date === today)).length;
  const monthlyMissing = mandateAccounts
    .filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED)
    .filter(a => {
      const r = buildMandateMonthlyReport(a.id, month);
      return !r || r.days === 0;
    }).length;

  const badges = {
    agreements: draftAgreements,
    accounts: pendingAuth + pendingWd + pendingFees,
    trades: pendingTrades,
    valuation: unvalued,
    daily: dailyPending,
    monthly: monthlyMissing,
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
      {active === 'valuation' && <AdminMandateValuation admin={admin} />}
      {active === 'daily' && <AdminMandateDaily admin={admin} detailId={detailId} navigate={navigate} />}
      {active === 'monthly' && <AdminMandateMonthly admin={admin} navigate={navigate} />}
    </div>
  );
}
