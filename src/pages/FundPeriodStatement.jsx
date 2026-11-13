import { useMemo, useState } from 'react';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import {
  buildPeriodStatement, formatExactAmount, platformBrand, statementMailboxOf,
  requestStatementExport, advanceStatementExport,
} from '../mock/data';
import { useLang } from '../i18n';
import StatementMailboxSheet from '../components/StatementMailboxSheet';
import { periodEmailDoc } from '../mock/emailDocs';
import { renderEmailHtml, sendMockEmail } from '../mock/emailTemplates';

/* ─────────────────────────────────────────────────────────────
   账户结单（期间） · 2026-11-12 · 双排版分离（2026-11-13）
   同一份数据两套排版（buildPeriodStatement 单一事实源）：
   · 屏幕版 .doc-screen —— App 原生卡片流：合计大数置顶、余额/交易/流水
     列表行（与「我的交易」/钱包流水同构），纸面专属要素（编号小节、
     列印日期、法律声明全文、页脚牌照）屏上不渲染；
   · 打印版 .doc-print —— A4 凭证原样保留，window.print 只打这一份
     （@media print 切换，见 styles.css）。
   纸面版回答「这个月账上有多少钱、钱从哪来、进了哪」；
   屏幕版回答同一问题，以 App 语法呈现，要纸面凭证走下载/邮箱。
   ───────────────────────────────────────────────────────────── */

const fmtQty = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

export default function FundPeriodStatement({ from, to, goBack, setToast }) {
  const { t, lang } = useLang();
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [printNote, setPrintNote] = useState('');
  const [sendNote, setSendNote] = useState('');

  const stmt = useMemo(() => buildPeriodStatement({ from, to }), [from, to]);

  // 下载/发送都落一条「申请成功」的导出记录：动作出生即 ready，
  // 不走「processing → 导出记录页 2 秒后推进」——用户刚点完下载却看到「申请中」是假延迟。
  // 下载是本地动作，不要求收件邮箱；发送才要求。
  const logExport = (requireMailbox = true) => {
    const res = requestStatementExport({
      kind: 'period',
      rangeFrom: stmt.from,
      rangeTo: stmt.to,
      targetHref: `#fund-period-statement/${stmt.from}/${stmt.to}`,
      requireMailbox,
    });
    if (res.ok) advanceStatementExport(res.record.id);
  };

  const download = () => {
    if (typeof window === 'undefined') return;
    if (window.parent !== window) {
      setPrintNote(t('请在独立浏览器中打开后下载'));
      return;
    }
    setPrintNote('');
    // 记录写死在 print 之前：浏览器无法感知用户在打印对话框点了取消还是打印，
    // 记录只能算「发起过」（已知取舍，2026-11-13）
    logExport(false);
    window.print();
  };

  const sendNow = () => {
    const to0 = statementMailboxOf();
    if (!to0) {
      setMailboxOpen(true);
      return;
    }
    const doc = periodEmailDoc(stmt, t);
    sendMockEmail({
      to: to0,
      subject: doc.subject,
      html: renderEmailHtml(doc),
      label: '账户结单',
    });
    logExport();
    setSendNote(t('已发送至 {email}').replace('{email}', to0));
    if (setToast) setToast(t('结单已发送至邮箱'));
  };

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('账户结单')}</h1>
        </div>
      </div>

      {/* ── 屏幕版：App 卡片流（2026-11-13 双排版分离；语法对齐资产页 hero 与「我的交易」行） ── */}
      <div className="doc-screen">
        <section className="doc-screen-hero">
          <span className="doc-screen-hero-label">{t('期末资产总估值')}</span>
          <b className="doc-screen-hero-amt">HKD {formatExactAmount(stmt.closingHKD)}</b>
          <span className="doc-screen-hero-sub">{stmt.from} – {stmt.to} · {t(stmt.clientName)}</span>
        </section>

        {[['fiat', '法币账户'], ['crypto', '数字资产']].map(([group, groupLabel]) => {
          const rows = stmt.balances.filter(b => b.account === group);
          if (!rows.length) return null;
          return (
            <section key={group}>
              <h2 className="doc-screen-group">{t(groupLabel)}</h2>
              <div className="doc-screen-card">
                {rows.map(b => (
                  <div key={`${b.account}-${b.currency}`} className="doc-screen-row">
                    <span className="doc-screen-row-title">{b.currency}</span>
                    <span className="doc-screen-row-right">
                      <b className="doc-screen-amt">{b.account === 'crypto' ? fmtQty(b.closing) : formatExactAmount(b.closing)}</b>
                      {b.currency !== 'HKD' && (
                        <span className="doc-screen-amt-sub">HKD {formatExactAmount(b.closingHKD)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="doc-screen-group">{t('基金交易')}</h2>
          {stmt.trades.length === 0 ? (
            <div className="doc-screen-card">
              <p className="doc-screen-empty">{t('本期无基金交易')}</p>
            </div>
          ) : (
            <div className="doc-screen-card">
              {stmt.trades.map(s => (
                <div key={s.id} className="doc-screen-row">
                  <span className="doc-screen-row-main">
                    <span className="doc-screen-row-title">{t(s.fundName)}</span>
                    <span className="doc-screen-row-sub">
                      {String(s.date || s.confirmedAt || '').slice(5, 10)} · {t(s.tradeType || '认购')}
                    </span>
                  </span>
                  <span className="doc-screen-row-right">
                    <b className="doc-screen-amt">{s.currency} {formatExactAmount(s.amount)}</b>
                    {s.shares ? <span className="doc-screen-amt-sub">{fmtQty(s.shares)} {t('份')}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="doc-screen-group">{t('资金往来')}</h2>
          {stmt.cash.length === 0 ? (
            <div className="doc-screen-card">
              <p className="doc-screen-empty">{t('本期无资金往来')}</p>
            </div>
          ) : (
            <div className="doc-screen-card">
              {stmt.cash.map(c => (
                <div key={`${c.kind}-${c.id}`} className="doc-screen-row">
                  <span className="doc-screen-row-main">
                    <span className="doc-screen-row-title">
                      {t({ deposit: '充值', withdraw: '提现', 'crypto-deposit': '充币', 'crypto-withdraw': '提币' }[c.kind])}
                    </span>
                    <span className="doc-screen-row-sub">
                      {String(c.time).slice(0, 10)}{c.channel ? ` · ${c.channel}` : ''}
                    </span>
                  </span>
                  <b className={`doc-screen-amt ${c.direction === 'in' ? 'in' : 'out'}`}>
                    {c.direction === 'in' ? '+' : '−'}{c.currency} {
                      c.kind.startsWith('crypto') ? fmtQty(c.amount) : formatExactAmount(c.amount)
                    }
                  </b>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── 打印版：A4 凭证原样（window.print 只打这一份） ── */}
      <article className="doc-sheet doc-print">
        <header className="doc-head">
          <div>
            <div className="doc-brand">{platformBrand.nameZh}</div>
            <div className="doc-title">{t('账户结单')}</div>
          </div>
          <div className="doc-meta">
            <span>{t('编号')} HS-STM-{stmt.from.slice(0, 7).replace('-', '')}</span>
            <span>{t('结单期间')} {stmt.from} – {stmt.to}</span>
            <span>{t('列印日期')} {stmt.printedAt.slice(0, 10)}</span>
          </div>
        </header>

        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(stmt.clientName)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{stmt.clientUid}</b></div>
          <div><span>{t('结单期间')}</span><b>{stmt.from} – {stmt.to}</b></div>
          <div><span>{t('折算币种')}</span><b>HKD</b></div>
        </div>

        <h2 className="doc-section-title">{t('一、账户总览')}</h2>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>{t('币种')}</th>
                <th className="num">{t('期初')}</th>
                <th className="num">{t('期末')}</th>
                <th className="num">{t('HKD 估值')}</th>
              </tr>
            </thead>
            {[['fiat', '法币账户'], ['crypto', '数字资产']].map(([group, groupLabel]) => {
              const rows = stmt.balances.filter(b => b.account === group);
              if (!rows.length) return null;
              return (
                <tbody key={group}>
                  <tr className="doc-group">
                    <td colSpan={4}>{t(groupLabel)}</td>
                  </tr>
                  {rows.map(b => (
                    <tr key={`${b.account}-${b.currency}`}>
                      <td>{b.currency}</td>
                      <td className="num">{b.account === 'crypto' ? fmtQty(b.opening) : formatExactAmount(b.opening)}</td>
                      <td className="num">{b.account === 'crypto' ? fmtQty(b.closing) : formatExactAmount(b.closing)}</td>
                      <td className="num">{formatExactAmount(b.closingHKD)}</td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
            <tbody>
              <tr className="doc-total">
                <td colSpan={3}>{t('期末资产总估值')}</td>
                <td className="num">{formatExactAmount(stmt.closingHKD)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="doc-section-title">{t('二、基金交易明细')}</h2>
        {stmt.trades.length === 0 ? (
          <p className="doc-empty">{t('本期无基金交易')}</p>
        ) : (
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>{t('确认日')}</th>
                  <th>{t('基金')}</th>
                  <th>{t('类型')}</th>
                  <th className="num">{t('份额')}</th>
                  <th className="num">{t('金额')}</th>
                </tr>
              </thead>
              <tbody>
                {stmt.trades.map(s => (
                  <tr key={s.id}>
                    <td>{String(s.date || s.confirmedAt || '').slice(5, 10)}</td>
                    <td className="wrap">{t(s.fundName)}</td>
                    <td>{t(s.tradeType || '认购')}</td>
                    <td className="num">{s.shares ? fmtQty(s.shares) : '—'}</td>
                    <td className="num">{s.currency} {formatExactAmount(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="doc-section-title">{t('三、资金往来明细')}</h2>
        {stmt.cash.length === 0 ? (
          <p className="doc-empty">{t('本期无资金往来')}</p>
        ) : (
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>{t('日期')}</th>
                  <th>{t('方向')}</th>
                  <th>{t('类型')}</th>
                  <th className="num">{t('金额')}</th>
                  <th>{t('渠道 / 地址')}</th>
                  <th>{t('参考号')}</th>
                </tr>
              </thead>
              <tbody>
                {stmt.cash.map(c => (
                  <tr key={`${c.kind}-${c.id}`}>
                    <td>{String(c.time).slice(0, 10)}</td>
                    <td className={c.direction === 'in' ? 'in' : 'out'}>
                      {t(c.direction === 'in' ? '入金' : '出金')}
                    </td>
                    <td>{t({ deposit: '充值', withdraw: '提现', 'crypto-deposit': '充币', 'crypto-withdraw': '提币' }[c.kind])}</td>
                    <td className="num">
                      {c.direction === 'in' ? '+' : '−'}{c.currency} {
                        c.kind.startsWith('crypto') ? fmtQty(c.amount) : formatExactAmount(c.amount)
                      }
                    </td>
                    <td className="wrap">{c.channel}</td>
                    <td className="ref">{c.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="doc-legal">
          {t('本结单仅列示已完成记账的记录；处理中、待补凭证与失败的记录不列入，以免与期末余额不一致。数字资产数量按表内汇率折算为港元估值，仅供参考。本结单由电脑系统自动生成，无需签署。')}
        </p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
        </footer>
      </article>

      {printNote && <p className="statement-print-note">{printNote}</p>}
      {sendNote && <p className="doc-send-note">{sendNote}</p>}

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-outline" onClick={sendNow}>
          <Mail size={16} /> {t('发送到邮箱')}
        </button>
        <button className="btn btn-primary" onClick={download}>
          <Download size={16} /> {t('下载')}
        </button>
      </div>

      <StatementMailboxSheet
        open={mailboxOpen}
        onClose={() => setMailboxOpen(false)}
        onSaved={() => sendNow()}
      />
    </div>
  );
}
