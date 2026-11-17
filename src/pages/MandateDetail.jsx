import {
  ArrowLeft, ArrowUpRight, ChevronRight, FileText, Lock, ShieldCheck, Wallet,
} from 'lucide-react';
import {
  getMandateSummaryForUser,
  getMandateWithdrawFrozen,
  hasMandateTransferAuth,
  mandateTrades,
  MANDATE_TRADE_STATUS,
  convertToHKD,
  formatExactAmount,
} from '../mock/data';
import { useLang } from '../i18n';
import MandateHoldingsList from '../components/MandateHoldingsList';
import MandateTradeRow from '../components/MandateTradeRow';

// 委托详情（2026-11-13 批 2；2026-11-16 三轮）
// 只读：持仓与余额由后台复核后的交易/流水派生，APP 不发起任何委托操作（RO 补充会议「委托账户只读」）。
// 阅读顺序 = 有多少钱（hero）→ 能做什么（hero 卡尾的提取）→ 钱放在哪（持仓）→ 发生了什么（交易）→ 合约约定。
// 结构纪律（2026-11-16 修订）：动作可以进**概览卡**（hero 是账户概览，银行 App 惯例），
//   但不得进**明细列表**（估值/交易列表里插 CTA 会让人以为是行操作）。
// 现金旁边的「资金记录」是下钻不是动作：现金是结果，记录是过程，二者必须相邻可及。
// 币种纪律：hero 全部裸数字（标签已写「折合 HKD」），持仓卡用列头兜底；
//           原币种只出现在报价（185.5 USD），折算币种不重复标注。

// 卡内持仓预览条数：超出后由「查看全部持仓」接管（2026-11-16 拍板）
const POSITION_PREVIEW = 5;

// 近期交易排序（2026-11-16 定稿语义）：待成交优先（最新动作在前），同级内按日期倒序
function compareTrades(a, b) {
  const pa = a.status === MANDATE_TRADE_STATUS.PENDING ? 0 : 1;
  const pb = b.status === MANDATE_TRADE_STATUS.PENDING ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return String(b.tradeDate).localeCompare(String(a.tradeDate));
}

export default function MandateDetail({ id, navigate, goBack }) {
  const { t, lang } = useLang();
  const summary = getMandateSummaryForUser();

  if (summary.state !== 'active' || !summary.account || (id && summary.account.id !== id)) {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('委托账户')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#asset')}>{t('返回资产')}</button>
        </div>
      </div>
    );
  }

  const { account, portfolio } = summary;
  const recentTrades = mandateTrades
    .filter(x => x.accountId === account.id)
    .slice()
    .sort(compareTrades)
    .slice(0, 5);
  const hasCash = portfolio.cash.some(c => c.balance > 0);
  const canWithdraw = hasMandateTransferAuth(account.id) && hasCash;
  const pnlPositive = portfolio.pnlHKD >= 0;
  // 在途提取（折合 HKD）：hero 现金是余额口径（事实），在途只标注不剔除，
  // 否则「现金 + 持仓市值 = 委托资产」在提交瞬间对不上。
  const pendingHKD = portfolio.cash.reduce(
    (s, c) => s + convertToHKD(getMandateWithdrawFrozen(account.id, c.currency), c.currency),
    0,
  );

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('委托账户')}</h1>
          <div className="page-header-actions">
            {/* 委托域凭证只放委托域：月报（协议 11.3）+ 成交通知单（协议 11.2）。
                基金账户结单 / 交易确认单属全账户凭证，留在资产页「结单」，两边不交叉。 */}
            <button className="btn-icon" aria-label={t('委托单据')} onClick={() => navigate('#mandate-statements')}><FileText size={19} /></button>
          </div>
        </div>
      </div>

      {/* hero：总量 → 构成（现金 / 持仓市值）→ 表现（累计收益，独立 KV 行）。
          收益不属于资产构成，因此与构成之间用一条分隔线隔开；数值右对齐只是行内对齐，不改变主值左对齐。 */}
      <div className="mandate-hero">
        <span className="mandate-hero-k">{t('委托资产（折合 HKD）')}</span>
        <strong className="mandate-hero-v">{formatExactAmount(portfolio.totalHKD)}</strong>

        <div className="mandate-hero-split">
          <div>
            <span>{t('现金')}</span>
            <strong>{formatExactAmount(portfolio.cashHKD)}</strong>
            {pendingHKD > 0 && <em>{t('提取处理中')} {formatExactAmount(pendingHKD)}</em>}
          </div>
          <div>
            <span>{t('持仓市值')}</span>
            <strong>{formatExactAmount(portfolio.marketValueHKD)}</strong>
          </div>
        </div>

        <div className="mandate-hero-pnl">
          <span>{t('累计收益（费前 · 开户至今）')}</span>
          <strong className={pnlPositive ? 'up' : 'down'}>
            {pnlPositive ? '+' : '-'}{formatExactAmount(Math.abs(portfolio.pnlHKD))}
            <em>{lang === 'en' ? '(' : '（'}{portfolio.pnlPct >= 0 ? '+' : ''}{portfolio.pnlPct.toFixed(2)}%{lang === 'en' ? ')' : '）'}</em>
          </strong>
        </div>

        {/* 现金的两个出口（2026-11-16 四轮）：提取（写）与资金记录（读）并列成两枚按钮。
            等宽、同高，主次只靠底色区分（不靠尺寸差）；缺 transfer 常设授权时提取置灰、
            原因落按钮下一行（协议 14.2 四层拦截之②），资金记录仍可点；无现金时只剩资金记录。 */}
        <div className="mandate-hero-actions">
          {hasCash && (canWithdraw ? (
            <button type="button" className="mandate-hero-btn is-primary" onClick={() => navigate('#mandate-withdraw')}>
              <ArrowUpRight size={16} aria-hidden="true" />
              <span>{t('提取至现金账户')}</span>
            </button>
          ) : (
            <button type="button" className="mandate-hero-btn is-primary" disabled>
              <Lock size={15} aria-hidden="true" />
              <span>{t('提取至现金账户')}</span>
            </button>
          ))}
          <button type="button" className="mandate-hero-btn" onClick={() => navigate('#mandate-cash')}>
            <Wallet size={15} aria-hidden="true" />
            <span>{t('资金记录')}</span>
          </button>
          {hasCash && !canWithdraw && (
            <p className="mandate-hero-gate">{t('缺少资金划转常设授权')}</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title no-margin">{t('持仓')}</h3>
        </div>
        {portfolio.positions.length === 0
          ? <p className="text-muted text-sm">{t('暂无委托持仓')}</p>
          : <MandateHoldingsList positions={portfolio.positions} limit={POSITION_PREVIEW} />}
        {portfolio.positions.length > POSITION_PREVIEW && (
          <button type="button" className="mandate-more" onClick={() => navigate('#mandate-holdings')}>
            {t('查看全部持仓')}<ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-title">{t('近期交易')}</div>
        {recentTrades.length === 0 && <p className="text-muted text-sm">{t('暂无交易记录')}</p>}
        {recentTrades.length > 0 && (
          <div className="asset-hold-colhead">
            <span>{t('交易')}</span>
            <span>{t('成交金额 / 状态（HKD）')}</span>
          </div>
        )}
        {recentTrades.map(tr => (
          <MandateTradeRow key={tr.id} trade={tr} onOpen={x => navigate(`#mandate-advice/${x.id}`)} />
        ))}
        <button type="button" className="mandate-more" onClick={() => navigate('#mandate-trades')}>{t('查看全部交易')}<ChevronRight size={14} /></button>
      </div>

      {/* 合约：低频事实（条款 / 费率 / 限制 / 常设授权）整体进独立页；
          入口用全 APP 同一套导航行（.menu-list > .menu-item），不再自造卡片形态。
          编号与授权在协议页，入口不做凭据。 */}
      <div className="menu-list">
        <button type="button" className="menu-item" onClick={() => navigate('#mandate-agreement')}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span className="menu-item-label">
            <span className="menu-item-title">{t('全权委托协议')}</span>
            <span className="menu-item-sub">{t('基金经理')} {account.managerName || '—'}</span>
          </span>
          <ChevronRight size={16} className="text-muted" aria-hidden="true" />
        </button>
      </div>

      {/* 合规声明：只留与「展示收益」直接捆绑的两句（收益不保证 / 费前口径），
          账户结构那句（托管归属、谁来执行）在合约页，不再重复。
          协议管权利义务，页面声明管展示行为——两者不能互相替代，所以不能整段删。 */}
      {/* 合规声明：只留与「展示收益」直接捆绑的两句，一句带过；
          账户结构（托管归属、谁来执行）在合约页，不在本页重复。 */}
      <p className="mandate-footnote">{t('投资收益不作保证；收益为费前，费用从组合扣除（详见结单）。')}</p>
    </div>
  );
}
