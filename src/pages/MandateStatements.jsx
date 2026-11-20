import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import {
  getMandateSummaryForUser,
  getMandateReports,
  mandateTrades,
  MANDATE_TRADE_STATUS,
  formatExactAmount,
  formatShares,
} from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   委托单据（2026-11-16）：委托域凭证的唯一入口。
   只放委托域自己的两类单据——
   · 月报：协议 11.3 合同义务，由当月日结单汇总，期末后 15 个营业日内出具；
   · 成交通知单：协议 11.2 义务，交易复核生效后才生成。
   基金账户结单 / 交易确认单属全账户凭证，留在资产页「结单」，两边不交叉
   （2026-11-16 标注：委托账户的单据不得融合非委托数据）。

   月报只列后台「已出具」的记录（mandateReports 快照）；不按日期在客户端推算
   「应已出具」——月初把上一月误判成已出具，客户会拿着一张不存在的单据来问。
   ───────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'report', label: '月报' },
  { key: 'advice', label: '成交通知单' },
];

// 页签记忆：从成交通知单返回会重挂本页，useState 默认值会把用户甩回「月报」。
// 模块级变量在 SPA 会话内保留，不写 localStorage（单据页签不属于需要持久化的业务状态）。
let lastTab = 'report';

export default function MandateStatements({ navigate, goBack }) {
  const { t } = useLang();
  const [tab, setTabState] = useState(lastTab);
  const setTab = (key) => { lastTab = key; setTabState(key); };
  const summary = getMandateSummaryForUser();
  const accountId = summary.account?.id || '';

  // 成交通知单只列复核生效的交易：录入值可能被驳回，提前出单就是通知一个不存在的事实。
  const advices = useMemo(() => mandateTrades
    .filter(x => x.accountId === accountId && x.status === MANDATE_TRADE_STATUS.ACTIVE)
    .slice()
    .sort((a, b) => String(b.tradeDate).localeCompare(String(a.tradeDate))), [accountId]);

  // 月报只列「已出具」：出具时冻结快照，客户端读的是客户当时收到的那一版。
  const reports = useMemo(() => getMandateReports(accountId), [accountId]);

  if (summary.state !== 'active') {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('委托单据')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${accountId}`)}><ArrowLeft size={20} /></button>
          <h1>{t('委托单据')}</h1>
        </div>
        <div className="segmented-control">
          {TABS.map(item => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? 'active' : ''}
              onClick={() => setTab(item.key)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'report' && (reports.length === 0 ? (
        <div className="p-statements-empty">
          <FileText size={22} />
          <p className="p-statements-empty-title">{t('暂无已出具月报')}</p>
          <p className="p-statements-empty-hint">{t('月报于每个结算期末后 15 个营业日内提供。')}</p>
        </div>
      ) : (
        <section className="p-statements-group">
          <div className="p-statements-card">
            {reports.map(r => (
              <button
                key={r.id}
                type="button"
                className="p-statements-row"
                onClick={() => navigate(`#mandate-report/${r.id}`)}
              >
                <span className="p-statements-main">
                  <span className="p-statements-fund">{r.period} {t('月报')}</span>
                  <span className="p-statements-line2">
                    <span className="p-statements-when">
                      <span className="p-statements-date">{String(r.issuedAt).slice(0, 10)}</span>
                      <span className="p-statements-dot">·</span>
                      <span className="p-statements-kind">{t('已出具')}</span>
                    </span>
                    <span className="p-statements-amount">
                      <em>HKD</em>
                      <b>{formatExactAmount(r.snapshot.closingHKD)}</b>
                    </span>
                  </span>
                </span>
                <ChevronRight size={18} className="p-statements-go" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {tab === 'advice' && (advices.length === 0 ? (
        <div className="p-statements-empty">
          <FileText size={22} />
          <p className="p-statements-empty-title">{t('暂无成交通知单')}</p>
          <p className="p-statements-empty-hint">{t('交易确认后，成交通知单会出现在这里。')}</p>
        </div>
      ) : (
        <section className="p-statements-group">
          <div className="p-statements-card">
            {advices.map(tr => (
              <button
                key={tr.id}
                type="button"
                className="p-statements-row"
                onClick={() => navigate(`#mandate-advice/${tr.id}`)}
              >
                <span className="p-statements-main">
                  <span className="p-statements-fund">{tr.symbol} {tr.side === 'buy' ? t('买入') : t('卖出')}</span>
                  <span className="p-statements-line2">
                    <span className="p-statements-when">
                      <span className="p-statements-date">{tr.tradeDate}</span>
                      <span className="p-statements-dot">·</span>
                      <span className="p-statements-kind">{formatShares(tr.quantity)} {t('股')}</span>
                    </span>
                    <span className="p-statements-amount">
                      <em>HKD</em>
                      <b>{formatExactAmount(tr.quantity * tr.price * tr.fxRate)}</b>
                    </span>
                  </span>
                </span>
                <ChevronRight size={18} className="p-statements-go" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
