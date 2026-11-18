import { ArrowLeft, Download } from 'lucide-react';
import { getDailyStatementById, currentUser, platformBrand, formatExactAmount, formatShares, MANDATE_VALUATION_METHODS } from '../mock/data';
import { useLang } from '../i18n';

// 日结单详情（2026-11-13 批 3）
// 三类账户分开列：现金 A / 委托 B / 基金 C。三类不能合并成一行——钱的归属不同、可否动用不同。
// 基金按最新净值；未估值日沿用上一净值，表内只标「估值日」，解释归脚注（2026-11-18：
// 单元格放事实，说明性文字挪进脚注——「未估值日沿用」这类短语在窄列里既折行又不像字段）。
// 信头只留结算日期：这是一张按日快照，快照日即出具日；生成时间与快照日分属两件事，
// 并排出现反而让人怀疑单据延迟（2026-11-18）。

const fillTpl = (tpl, v) => String(tpl).split('{}').join(v);

// 在途指令行：左侧事由、右侧数量/金额（两端口径），金额靠右成列。
// 金额不在这里汇总——「冻结」列已经是同一个数的汇总，本节只回答「为什么被占用」。
function pendingRow(p, t) {
  if (p.kind === 'fund-order' && p.side) {
    const subscribe = p.side === 'subscribe';
    return {
      text: fillTpl(t(subscribe ? '申购 {}（待确认）' : '赎回 {}（处理中）'), t(p.fundName)),
      amount: subscribe
        ? `${p.currency} ${formatExactAmount(p.amount)}`
        : `${formatShares(p.shares)} ${t('份')}`,
    };
  }
  if (p.kind === 'mandate-trade' && p.side) {
    return {
      text: fillTpl(t(p.side === 'buy' ? '委托买入 {}（待复核）' : '委托卖出 {}（待复核）'), p.symbol),
      amount: `${formatShares(p.quantity)} ${t('股')}`,
    };
  }
  if (p.kind === 'withdraw') {
    return { text: t('提现（处理中）'), amount: `${p.currency} ${formatExactAmount(p.amount)}` };
  }
  // 旧快照兜底：早期版本只存了拼好的 label
  return { text: p.label || '', amount: '' };
}

export default function DailyStatement({ id, goBack }) {
  const { t } = useLang();
  const stmt = getDailyStatementById(id);

  if (!stmt) {
    return (
      <div className="page doc-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t('日结单')}</h1>
          </div>
        </div>
        <div className="card"><p className="text-muted">{t('单据不存在')}</p></div>
      </div>
    );
  }

  const diff = stmt.prevTotalHKD == null ? null : stmt.totalHKD - stmt.prevTotalHKD;

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('日结单')}</h1>
        </div>
      </div>

      <article className="doc-sheet">
        <header className="doc-head">
          <div className="doc-head-title">
            <span className="doc-brand">{platformBrand.nameZh}</span>
            <span className="doc-title">{t('日结单')}</span>
          </div>
          <div className="doc-meta">
            <span>{t('结算日期')} {stmt.date}</span>
          </div>
        </header>

        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(currentUser.name)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{String(currentUser.id).toUpperCase()}</b></div>
        </div>

        <div className="doc-amount">
          <span>{t('总资产（折合 HKD）')}</span>
          <b>{formatExactAmount(stmt.totalHKD)}</b>
        </div>

        <section className="doc-section">
          <h3>{t('现金账户')}</h3>
          <div className="doc-table-wrap">
            <table className="doc-table">
              <colgroup><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '22%' }} /><col style={{ width: '28%' }} /></colgroup>
              <thead><tr><th>{t('币种')}</th><th className="is-num">{t('余额')}</th><th className="is-num">{t('冻结')}</th><th className="is-num">{t('可用')}</th></tr></thead>
              <tbody>
                {stmt.cashA.map(c => (
                  <tr key={c.currency}>
                    <td>{c.currency}</td>
                    <td className="is-num">{formatExactAmount(c.balance)}</td>
                    <td className="is-num">{formatExactAmount(c.frozen)}</td>
                    <td className="is-num">{formatExactAmount(c.available)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {stmt.mandate && (
          <section className="doc-section">
            <h3>{t('委托账户')}<span className="doc-h3-meta">{stmt.mandate.accountNo}</span></h3>
            <div className="doc-table-wrap">
              <table className="doc-table doc-table--fit">
                <colgroup><col style={{ width: '40%' }} /><col style={{ width: '16%' }} /><col style={{ width: '20%' }} /><col style={{ width: '24%' }} /></colgroup>
                <thead><tr><th>{t('持仓')}</th><th className="is-num">{t('数量')}</th><th className="is-num">{t('估值价')}</th><th className="is-num">{t('市值（HKD）')}</th></tr></thead>
                <tbody>
                  {stmt.mandate.positions.map(p => (
                    <tr key={p.symbol}>
                      <td className="doc-cell-wrap">
                        {p.symbol} · {p.name}
                        <span className="doc-sub">{t(MANDATE_VALUATION_METHODS[p.method] || p.method || '—')}</span>
                      </td>
                      <td className="is-num">{formatShares(p.quantity)}</td>
                      <td className="is-num">
                        {p.price ? p.price : t('待估值')}
                        {p.priceAt && p.priceAt !== stmt.date ? <span className="doc-sub">{p.priceAt}</span> : null}
                      </td>
                      <td className="is-num">{p.price ? formatExactAmount(p.marketValueHKD) : '—'}</td>
                    </tr>
                  ))}
                  {stmt.mandate.cash.map(c => (
                    <tr key={c.currency}>
                      <td className="doc-cell-wrap">{t('未投资现金')} · {c.currency}</td>
                      <td className="is-num">—</td>
                      <td className="is-num">—</td>
                      <td className="is-num">{formatExactAmount(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="doc-section-total">{t('小计')} {formatExactAmount(stmt.mandate.totalHKD)}</p>
          </section>
        )}

        <section className="doc-section">
          <h3>{t('基金账户（按最新净值）')}</h3>
          <div className="doc-table-wrap">
            <table className="doc-table doc-table--fit">
              <colgroup><col style={{ width: '25%' }} /><col style={{ width: '30%' }} /><col style={{ width: '21%' }} /><col style={{ width: '24%' }} /></colgroup>
              <thead><tr><th>{t('基金')}</th><th className="is-num">{t('份额')}</th><th className="is-num">{t('净值')}</th><th className="is-num">{t('市值（HKD）')}</th></tr></thead>
              <tbody>
                {stmt.fund.positions.length === 0 && <tr><td colSpan={4}>{t('暂无基金持仓')}</td></tr>}
                {stmt.fund.positions.map(p => (
                  <tr key={p.fundId}>
                    <td className="doc-cell-wrap">{t(p.fundName)}</td>
                    <td className="is-num">{formatShares(p.shares)}</td>
                    <td className="is-num">
                      {p.nav}
                      {p.staleNav && p.navDate ? <span className="doc-sub">{p.navDate}</span> : null}
                    </td>
                    <td className="is-num">{formatExactAmount(p.marketValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="doc-section-total">{t('小计')} {formatExactAmount(stmt.fund.marketValueHKD)}</p>
        </section>

        <section className="doc-section">
          <h3>{t('在途指令')}</h3>
          {stmt.pending.length === 0 && (stmt.locked || []).length === 0 && <p className="doc-muted">{t('无')}</p>}
          {stmt.pending.map((p, i) => {
            const row = pendingRow(p, t);
            return (
              <p key={p.id || i} className="doc-line">
                <span>{row.text}</span>
                <span className="doc-line-amt">{row.amount}</span>
              </p>
            );
          })}
          {/* 旧快照兜底：早期日结单没有结构化在途项，只有「冻结来源」行。
              不能让「无在途指令」与现金表「冻结 120,000」同屏互相打脸。 */}
          {stmt.pending.length === 0 && (stmt.locked || []).map((l, i) => (
            <p key={`l${i}`} className="doc-line">
              <span>{t(l.note)}</span>
              <span className="doc-line-amt">{l.currency} {formatExactAmount(l.amount)}</span>
            </p>
          ))}
        </section>

        <div className="doc-section-total">
          {t('较前一交易日')}：
          {diff == null ? t('首份日结单') : `${diff >= 0 ? '+' : '−'}HKD ${formatExactAmount(Math.abs(diff))}`}
        </div>

        <p className="doc-legal">
          {t('本日结单为当日资产快照，由电脑系统生成，无需签署。基金份额按最新公布净值估值，未公布净值的日期沿用上一净值。如对记录有疑问，请于收到后 7 天内联系客户经理。')}
        </p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
          <span>1 / 1</span>
        </footer>
      </article>

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={() => { if (window.parent === window) window.print(); }}>
          <Download size={16} /> {t('导出')}
        </button>
      </div>
    </div>
  );
}
