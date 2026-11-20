import { ArrowLeft, Download } from 'lucide-react';
import DocViewport from '../components/DocViewport';
import { getDailyStatementById, currentUser, platformBrand, formatExactAmount, formatShares, convertToHKD, MANDATE_VALUATION_METHODS, MANDATE_LEDGER_LABELS } from '../mock/data';
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

// 当日变动：左事由、右带方向金额（+ 收 / − 付），与在途指令同一套两端行式。
// 现金账户用「充值 / 提现」，委托账户用其台账口径（入金/出金/交易结算…），
// 两个账户各自沿用自己页面的词，靠前缀区分归属。
function movementRow(m, t) {
  const sign = m.amount < 0 ? '−' : '+';
  const amount = `${sign}${m.currency} ${formatExactAmount(Math.abs(m.amount))}`;
  if (m.kind === 'fund-subscribe') return { text: `${t('申购')} ${t(m.fundName)}`, amount };
  if (m.kind === 'fund-redeem') return { text: `${t('赎回')} ${t(m.fundName)}`, amount };
  if (m.kind === 'mandate-transfer-in') return { text: t('由委托账户划入'), amount };
  if (m.kind === 'mandate-cash') {
    return { text: `${t('委托账户')} · ${t(MANDATE_LEDGER_LABELS[m.ledgerType] || m.ledgerType)}`, amount };
  }
  return { text: t(m.kind === 'withdraw' ? '提现' : '充值'), amount };
}

export default function DailyStatement({ id, goBack }) {
  const { t, lang } = useLang();
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
  // 差额行必须说清「跟谁比」：日结单可能隔几天才出一份，
  // 连续性缺失时不能仍写「较前一交易日」——那是在暗示两个相邻的时点。
  const diffLabel = diff == null
    ? t('首份日结单')
    : (stmt.openingKnown ? t('较前一交易日') : `${t('较上一份结单')} ${stmt.prevDate || ''}`.trim());

  // 差额必须能拆：资金净流入是账上真动过的钱（可列），剩下的是市值与汇率（只能作残差）。
  // 没有日终估值序列，拆不出「股票涨了多少、基金涨了多少」——硬拆就是编。
  const netFlowHKD = Math.round((stmt.movements || []).reduce((s, m) => {
    const v = convertToHKD(Math.abs(Number(m.amount) || 0), m.currency || 'HKD');
    return s + (Number(m.amount) < 0 ? -v : v);
  }, 0) * 100) / 100;
  const marketDeltaHKD = diff == null ? null : Math.round((diff - netFlowHKD) * 100) / 100;
  const signed = (v) => `${v >= 0 ? '+' : '−'}HKD ${formatExactAmount(Math.abs(v))}`;

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('日结单')}</h1>
        </div>
      </div>

      <DocViewport>
      <article className="doc-sheet">
        <header className="doc-head">
          <div className="doc-head-title">
            <span className="doc-brand">{platformBrand.nameZh}</span>
            <span className="doc-title">{t('日结单')}</span>
          </div>
          <div className="doc-meta">
            <span>{t('编号')} {stmt.docNo || '—'}</span>
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
              <colgroup>
                <col style={{ width: '14%' }} />
                {stmt.openingKnown && <col style={{ width: '17%' }} />}
                <col style={{ width: '20%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '17%' }} />
              </colgroup>
              <thead><tr>
                <th>{t('币种')}</th>
                {stmt.openingKnown && <th className="is-num">{t('期初')}</th>}
                <th className="is-num">{t('余额')}</th>
                <th className="is-num">{t('冻结')}</th>
                <th className="is-num">{t('可用')}</th>
                <th className="is-num">{t('折合 HKD')}</th>
              </tr></thead>
              <tbody>
                {stmt.cashA.map(c => (
                  <tr key={c.currency}>
                    <td>{c.currency}</td>
                    {stmt.openingKnown && <td className="is-num">{formatExactAmount(c.opening)}</td>}
                    <td className="is-num">{formatExactAmount(c.balance)}</td>
                    <td className="is-num">{formatExactAmount(c.frozen)}</td>
                    <td className="is-num">{formatExactAmount(c.available)}</td>
                    <td className="is-num">{formatExactAmount(c.balanceHKD)}</td>
                  </tr>
                ))}
              </tbody>
              {/* 小计让纸面上的总资产可以自己加出来：现金折合 + 委托 + 基金 = 顶部总资产 */}
              <tfoot>
                <tr className="doc-total">
                  <td colSpan={stmt.openingKnown ? 5 : 4}>{t('现金小计（折合 HKD）')}</td>
                  <td className="is-num">{formatExactAmount(stmt.cashAHKD)}</td>
                </tr>
              </tfoot>
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
                  {/* 多委托账户：合并表之后补分户小计，客户能对到自己每个账户 */}
                  {stmt.mandate.accounts && stmt.mandate.accounts.length > 1 && stmt.mandate.accounts.map(a => (
                    <tr key={`acct-${a.id}`}>
                      <td className="doc-cell-wrap">{t('分户小计')} · {a.no}</td>
                      <td className="is-num">—</td>
                      <td className="is-num">—</td>
                      <td className="is-num">{formatExactAmount(a.totalHKD)}</td>
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

        <section className="doc-section">
          <h3>{t('当日变动')}</h3>
          {(stmt.movements || []).length === 0 && <p className="doc-muted">{t('无')}</p>}
          {(stmt.movements || []).map((m, i) => {
            const row = movementRow(m, t);
            return (
              <p key={m.id || i} className="doc-line">
                <span>{row.text}</span>
                <span className="doc-line-amt">{row.amount}</span>
              </p>
            );
          })}
        </section>

        <div className="doc-section-total">
          {diffLabel}{lang === 'en' ? ': ' : '：'}
          {diff == null ? '' : signed(diff)}
        </div>
        {diff != null && (
          <div className="doc-attrib">
            <p className="doc-line">
              <span>{t('资金净流入')}</span>
              <span className="doc-line-amt">{signed(netFlowHKD)}</span>
            </p>
            <p className="doc-line">
              <span>{t('市值与汇率变动')}<span className="doc-total-note">{t('（残差）')}</span></span>
              <span className="doc-line-amt">{signed(marketDeltaHKD)}</span>
            </p>
          </div>
        )}

        <p className="doc-legal">
          {t('本日结单为当日资产快照，由电脑系统生成，无需签署。基金份额按最新公布净值估值，未公布净值的日期沿用上一净值。如对记录有疑问，请于收到后 7 天内联系客户经理。')}
        </p>
        <p className="doc-legal">{t('日结单为过程快照；如与账户结单不一致，以账户结单为准。')}</p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
        </footer>
      </article>
      </DocViewport>

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={() => { if (window.parent === window) window.print(); }}>
          <Download size={16} /> {t('导出')}
        </button>
      </div>
    </div>
  );
}
