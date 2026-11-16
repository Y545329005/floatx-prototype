import { ArrowLeft, Download } from 'lucide-react';
import { getDailyStatementById, currentUser, platformBrand, formatExactAmount, formatShares, MANDATE_VALUATION_METHODS } from '../mock/data';
import { useLang } from '../i18n';

// 日结单详情（2026-11-13 批 3）
// 三类账户分开列：现金 A / 委托 B / 基金 C。三类不能合并成一行——钱的归属不同、可否动用不同。
// 基金按最新净值；未估值日沿用上一净值并在行内标注（私募周/月频，日结单不能凭空造日波动）。

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
          <div>
            <div className="doc-brand">{platformBrand.nameZh}</div>
            <div className="doc-title">{t('日结单')}</div>
          </div>
          <div className="doc-meta">
            <span>{t('结算日期')} {stmt.date}</span>
            <span>{t('发出时间')} {String(stmt.generatedAt || '').slice(0, 16)}</span>
          </div>
        </header>

        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(currentUser.name)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{String(currentUser.id).toUpperCase()}</b></div>
        </div>

        <div className="doc-amount">
          <span>{t('总资产（折合 HKD）')}</span>
          <b>HK$ {formatExactAmount(stmt.totalHKD)}</b>
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
            <h3>{t('委托账户')} · {stmt.mandate.accountNo}</h3>
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
                        <span className="doc-sub">{p.priceAt || '—'}</span>
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
            <p className="doc-section-total">{t('小计')} HK$ {formatExactAmount(stmt.mandate.totalHKD)}</p>
          </section>
        )}

        <section className="doc-section">
          <h3>{t('基金账户（按最新净值）')}</h3>
          <div className="doc-table-wrap">
            <table className="doc-table doc-table--fit">
              <colgroup><col style={{ width: '28%' }} /><col style={{ width: '32%' }} /><col style={{ width: '16%' }} /><col style={{ width: '24%' }} /></colgroup>
              <thead><tr><th>{t('基金')}</th><th className="is-num">{t('份额')}</th><th className="is-num">{t('净值')}</th><th className="is-num">{t('市值')}</th></tr></thead>
              <tbody>
                {stmt.fund.positions.length === 0 && <tr><td colSpan={4}>{t('暂无基金持仓')}</td></tr>}
                {stmt.fund.positions.map(p => (
                  <tr key={p.fundId}>
                    <td className="doc-cell-wrap">{t(p.fundName)}</td>
                    <td className="is-num">{formatShares(p.shares)}</td>
                    <td className="is-num">{p.nav}{p.staleNav ? <span className="doc-sub">{t('未估值日沿用')}</span> : null}</td>
                    <td className="is-num">{formatExactAmount(p.marketValue)}<span className="doc-sub">{p.currency}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="doc-section-total">{t('小计')} HK$ {formatExactAmount(stmt.fund.marketValueHKD)}</p>
        </section>

        <section className="doc-section">
          <h3>{t('在途指令与锁定资金')}</h3>
          {stmt.pending.length === 0 && stmt.locked.length === 0 && <p className="doc-muted">{t('无')}</p>}
          {stmt.pending.map((p, i) => <p key={i} className="doc-line">{p.label}</p>)}
          {stmt.locked.map((l, i) => (
            <p key={`l${i}`} className="doc-line">{t('锁定')} {l.currency} {formatExactAmount(l.amount)} · {t(l.note)}</p>
          ))}
        </section>

        <div className="doc-section-total">
          {t('较前一交易日')}：
          {diff == null ? t('首份日结单') : `${diff >= 0 ? '+' : '−'}HK$ ${formatExactAmount(Math.abs(diff))}`}
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
