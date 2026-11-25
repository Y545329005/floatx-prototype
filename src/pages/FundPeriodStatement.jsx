import { useMemo, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import DocViewport from '../components/DocViewport';
import {
  buildPeriodStatement, formatExactAmount, formatShares, platformBrand,
  requestStatementExport, advanceStatementExport,
  currentUser, getMonthlyStatementOf, monthRangeOf, formatCryptoQty,
} from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   账户结单（期间）
   2026-11-20：取消「屏幕卡片流 + A4 打印版」双排版，只保留一种排版。
   原因：屏幕版是同一份数据的第二次手写，它丢掉了期初列、汇率与净值日——
   对账所需的字段恰恰被「为手机重排」这件事吃掉了。单据只有一种排版，
   就不存在重排丢字段与两份实现漂移。
   手机上的阅读问题交给查看态（DocViewport：100% / 适应宽度），不改纸面。
   ───────────────────────────────────────────────────────────── */

export default function FundPeriodStatement({ from, to, goBack }) {
  const { t, lang } = useLang();
  const [printNote, setPrintNote] = useState('');

  // 该月已出具 → 显示冻结版；未出具 → 按需计算（并提示会随后续补录变化）。
  // 月结单是唯一可归档的全账户凭证，日结单不冻结，两者不一致时以这里为准。
  const issuedRec = useMemo(() => {
    const period = String(from || '').slice(0, 7);
    const range = monthRangeOf(period);
    if (!range || range.from !== from) return null;
    const rec = getMonthlyStatementOf(currentUser.id, period);
    if (!rec) return null;
    return (to === range.to || to === rec.to) ? rec : null;
  }, [from, to]);
  const stmt = useMemo(
    () => (issuedRec ? issuedRec.snapshot : buildPeriodStatement({ from, to })),
    [from, to, issuedRec],
  );

  // 委托现金变动的文案由页面拼（数据层只给 kind，不拼中文，否则英文界面永远是中文）。
  const flowLabel = (f) => {
    if (f.kind === 'trade-buy') return `${t('买入')} ${f.symbol} ${formatShares(f.quantity)} ${t('股')}`;
    if (f.kind === 'trade-sell') return `${t('卖出')} ${f.symbol} ${formatShares(f.quantity)} ${t('股')}`;
    if (f.kind === 'fee') return `${t('费用')}${f.feePeriod ? ` · ${f.feePeriod}` : ''}`;
    if (f.kind === 'transfer-in') return t('从现金账户划入');
    if (f.kind === 'transfer-out') return t('划出至现金账户');
    if (f.kind === 'deposit') return t('入金');
    if (f.kind === 'withdraw') return t('出金');
    if (f.kind === 'dividend') return t('股息');
    if (f.kind === 'subscription_out') return t('申购打款');
    if (f.kind === 'subscription_refund') return t('申购退款');
    return t('其他');
  };
  const signed = v => `${v >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(v))}`;

  // 期间资金往来汇总（2026-11-25）：明细之上先给「按币种 × 方向的进出总量」。
  // 结单只有期末余额时，「这个月进出多少」得让客户自己翻三页明细加。
  const cashSummary = useMemo(() => {
    const rows = new Map();
    (stmt.cash || []).forEach(c => {
      const key = `${c.currency}|${c.direction}`;
      const row = rows.get(key) || { currency: c.currency, direction: c.direction, count: 0, amount: 0 };
      row.count += 1;
      row.amount += Number(c.amount) || 0;
      rows.set(key, row);
    });
    const rateOf = (code) => {
      const hit = (stmt.fx || []).find(f => f.currency === code);
      return hit ? Number(hit.rate) || 1 : 1;
    };
    return Array.from(rows.values())
      .map(r => ({ ...r, amountHKD: Math.round(r.amount * rateOf(r.currency) * 100) / 100 }))
      .sort((a, b) => String(a.currency).localeCompare(String(b.currency)) || String(a.direction).localeCompare(String(b.direction)));
  }, [stmt]);
  const cashNetHKD = useMemo(() => Math.round(cashSummary
    .reduce((sum, r) => sum + (r.direction === 'in' ? r.amountHKD : -r.amountHKD), 0) * 100) / 100, [cashSummary]);

  // 下载落一条「申请成功」的导出记录：动作出生即 ready，
  // 不走「processing → 导出记录页 2 秒后推进」——用户刚点完下载却看到「申请中」是假延迟。
  // 下载是本地动作，不要求收件邮箱；手动「发送到邮箱」已下线（2026-11-13，
  // 结单按 SFC 口径自动送达，手动补发与自动送达重复）
  const logExport = () => {
    const res = requestStatementExport({
      kind: 'period',
      rangeFrom: stmt.from,
      rangeTo: stmt.to,
      targetHref: `#fund-period-statement/${stmt.from}/${stmt.to}`,
      requireMailbox: false,
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
    logExport();
    window.print();
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


      {/* A4 单一排版：屏上与打印是同一份，只由查看态承担阅读（缩放/横向拖动） */}
      <DocViewport>
      <article className="doc-sheet">
        <header className="doc-head">
          <div>
            <div className="doc-brand">{platformBrand.nameZh}</div>
            <div className="doc-title">{t('账户结单')}</div>
          </div>
          <div className="doc-meta">
            <span>{t('编号')} {issuedRec ? issuedRec.docNo : `HS-STM-${stmt.from.slice(0, 7).replace('-', '')}`}</span>
            <span>{t('结单期间')} {stmt.from} – {stmt.to}</span>
            <span>{t('列印日期')} {stmt.printedAt.slice(0, 10)}</span>
            {issuedRec && <span>{t('出具日')} {String(issuedRec.issuedAt).slice(0, 10)}{issuedRec.provisional ? ` · ${t('暂定')}` : ''}</span>}
          </div>
        </header>

        {!issuedRec && (
          <p className="doc-note">{t('本期间尚未出具月结单；当前内容按需计算，后续补录会改变数字。')}</p>
        )}
        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(stmt.clientName)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{stmt.clientUid}</b></div>
          <div><span>{t('折算币种')}</span><b>HKD</b></div>
        </div>

        <h2 className="doc-section-title">{t('一、账户总览')}</h2>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>{t('币种')}</th>
                {/* RO 会议（2026-11-25）：期初/期末下面必须给出是哪一天的资金状况 */}
                <th className="num">
                  {t('期初')}
                  {stmt.openingDate && <span className="doc-th-sub">{stmt.openingDate}</span>}
                </th>
                <th className="num">
                  {t('期末')}
                  {stmt.closingDate && <span className="doc-th-sub">{stmt.closingDate}</span>}
                </th>
                <th className="num">{t('HKD 估值')}</th>
              </tr>
            </thead>
            {[['fiat', '法币账户（自行操作）'], ['crypto', '数字资产（自行操作）']].map(([group, groupLabel]) => {
              const rows = stmt.balances.filter(b => b.account === group);
              if (!rows.length) return null;
              return (
                <tbody key={group}>
                  <tr className="doc-group">
                    <td colSpan={4}>{t(groupLabel)}</td>
                  </tr>
                  {rows.map(b => (
                    <tr key={`${b.account}-${b.currency}`}>
                      <td>
                        {b.currency}
                        {/* RO 会议：数字资产要明确标注所用汇率，否则折合数无法验算 */}
                        {b.account === 'crypto' && (() => {
                          const rate = (stmt.fx || []).find(f => f.currency === b.currency);
                          if (!rate) return null;
                          return (
                            <span className="doc-sub">
                              1 {b.currency} = {formatExactAmount(rate.rate)} HKD{rate.updatedAt ? ` · ${String(rate.updatedAt).slice(0, 10)}` : ''}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="num">
                        {b.opening == null
                          ? '—'
                          : (b.account === 'crypto' ? formatCryptoQty(b.currency, b.opening) : formatExactAmount(b.opening))}
                      </td>
                      <td className="num">{b.account === 'crypto' ? formatCryptoQty(b.currency, b.closing) : formatExactAmount(b.closing)}</td>
                      <td className="num">{formatExactAmount(b.closingHKD)}</td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
            {stmt.fundPositions.length > 0 && (
              <tbody>
                <tr className="doc-group">
                  <td colSpan={4}>{t('基金持仓（自行操作）')}</td>
                </tr>
                {stmt.fundPositions.map(p => (
                  <tr key={p.fundId}>
                    <td className="wrap">{t(p.fundName)}</td>
                    <td className="num">{formatShares(p.opening)}</td>
                    <td className="num">{formatShares(p.closing)}</td>
                    <td className="num">{formatExactAmount(p.closingHKD)}</td>
                  </tr>
                ))}
              </tbody>
            )}
            {stmt.mandate && (
              <tbody>
                <tr>
                  <td colSpan={3}>{t('其中：委托账户（委托管理）')}</td>
                  <td className="num">{formatExactAmount(stmt.mandate.closingHKD)}</td>
                </tr>
              </tbody>
            )}
            <tbody>
              {stmt.openingHKD != null && (
                <tr>
                  <td colSpan={3}>{t('期初资产总估值')}</td>
                  <td className="num">{formatExactAmount(stmt.openingHKD)}</td>
                </tr>
              )}
              <tr className="doc-total">
                <td colSpan={3}>{t('期末资产总估值')}</td>
                <td className="num">{formatExactAmount(stmt.closingHKD)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {!stmt.openingKnown && (
          <p className="doc-note">{t('期初余额自逐笔流水起算日起记录；此前月份不列期初，以免给出不实的数字。')}</p>
        )}

        {/* 折算汇率：折合数必须能由读者自己乘出来。位置在「用汇率」之前，顺序即逻辑。 */}
        <h2 className="doc-section-title">{t('折算汇率')}</h2>
        <div className="doc-table-wrap">
          <table className="doc-table doc-table--fx">
            <thead>
              <tr>
                <th>{t('币种')}</th>
                <th className="num">{t('折合 HKD')}</th>
                <th>{t('汇率日期')}</th>
              </tr>
            </thead>
            <tbody>
              {stmt.fx.map(row => (
                <tr key={row.currency}>
                  <td>{row.currency}</td>
                  <td className="num">{row.rate}</td>
                  <td>{row.updatedAt ? String(row.updatedAt).slice(0, 10) : '—'}</td>
                </tr>
              ))}
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
                    <td className="num">{s.shares ? formatShares(s.shares) : '—'}</td>
                    <td className="num">{s.currency} {formatExactAmount(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stmt.mandate && (
          <>
            <h2 className="doc-section-title">{t('三、委托账户明细')}</h2>
            {stmt.mandate.accounts.map(a => (
              <div key={a.id}>
                <h3 className="doc-subtitle">{t('委托账户')} {a.no}</h3>
                {a.positions.length > 0 && (
                  <div className="doc-table-wrap">
                    <table className="doc-table">
                      <thead>
                        <tr>
                          <th>{t('持仓')}</th>
                          <th className="num">{t('数量')}</th>
                          {/* RO 会议（2026-11-25）：持仓要能看到平均买入价，与券商回单对得上 */}
                          <th className="num">{t('平均成本')}</th>
                          <th className="num">{t('估值价')}</th>
                          <th className="num">{t('市值（HKD）')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.positions.map(p => (
                          <tr key={p.symbol}>
                            <td className="wrap">{p.symbol} · {p.name}</td>
                            <td className="num">{formatShares(p.quantity)}</td>
                            <td className="num">{p.avgCost > 0 ? `${p.currency} ${formatExactAmount(p.avgCost)}` : '—'}</td>
                            <td className="num">
                              {p.valued ? `${p.currency} ${p.price}` : t('按成本')}
                              {p.priceAt ? <span className="doc-sub">{p.priceAt}</span> : null}
                            </td>
                            <td className="num">{formatExactAmount(p.marketValueHKD)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {a.flows.length > 0 && (
                  <div className="doc-table-wrap">
                    <table className="doc-table">
                      <thead>
                        <tr>
                          <th>{t('日期')}</th>
                          <th>{t('事项')}</th>
                          <th className="num">{t('金额（HKD）')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.flows.map(f => (
                          <tr key={f.id}>
                            <td>{String(f.at).slice(0, 10)}</td>
                            <td className="wrap">{flowLabel(f)}</td>
                            <td className={`num ${f.amount >= 0 ? 'in' : 'out'}`}>
                              {f.amount >= 0 ? '+' : '−'}{formatExactAmount(Math.abs(f.amountHKD))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="doc-table-wrap">
                  <table className="doc-table doc-table--fit">
                    <tbody>
                      <tr>
                        <td>{t('期初市值')}</td>
                        <td className="num">{formatExactAmount(a.openingHKD)}</td>
                      </tr>
                      <tr>
                        <td>{t('期间资金变动')}</td>
                        <td className={`num ${a.netFlowHKD >= 0 ? 'in' : 'out'}`}>{signed(a.netFlowHKD)}</td>
                      </tr>
                      <tr>
                        <td>{t('市值变动')}</td>
                        <td className={`num ${a.marketDeltaHKD >= 0 ? 'in' : 'out'}`}>{signed(a.marketDeltaHKD)}</td>
                      </tr>
                      <tr className="doc-total">
                        <td>{t('期末合计')}</td>
                        <td className="num">{formatExactAmount(a.closingHKD)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {stmt.mandate.accounts.length > 1 && (
              <p className="doc-note">
                {t('委托合计')}：{t('期初市值')} {formatExactAmount(stmt.mandate.openingHKD)} · {t('期间资金变动')} {signed(stmt.mandate.netFlowHKD)} · {t('市值变动')} {signed(stmt.mandate.marketDeltaHKD)} · {t('期末合计')} {formatExactAmount(stmt.mandate.closingHKD)}
              </p>
            )}
          </>
        )}

        <h2 className="doc-section-title">{t('四、资金往来汇总')}</h2>
        {cashSummary.length === 0 ? (
          <p className="doc-empty">{t('本期无资金往来')}</p>
        ) : (
          <div className="doc-table-wrap">
            <table className="doc-table doc-table--fit">
              <thead>
                <tr>
                  <th>{t('币种')}</th>
                  <th>{t('方向')}</th>
                  <th className="num">{t('笔数')}</th>
                  <th className="num">{t('金额')}</th>
                  <th className="num">{t('折合 HKD')}</th>
                </tr>
              </thead>
              <tbody>
                {cashSummary.map(r => (
                  <tr key={`${r.currency}-${r.direction}`}>
                    <td>{r.currency}</td>
                    <td>{t(r.direction === 'in' ? '入' : '出')}</td>
                    <td className="num">{r.count}</td>
                    <td className="num">
                      {/* 数字资产按数量、法币按金额：同一列两种量纲会把 0.15 印成 0.15 元 */}
                      {['HKD', 'USD', 'CNH'].includes(r.currency) ? formatExactAmount(r.amount) : formatCryptoQty(r.currency, r.amount)}
                    </td>
                    <td className="num">{formatExactAmount(r.amountHKD)}</td>
                  </tr>
                ))}
                <tr className="doc-total">
                  <td colSpan={4}>{t('资金往来净额（折合 HKD）')}</td>
                  <td className="num">{signed(cashNetHKD)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <h2 className="doc-section-title">{t('五、资金往来明细')}</h2>
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
                    <td>{t({ deposit: '充值', withdraw: '提现', 'crypto-deposit': '充币', 'crypto-withdraw': '提币', 'fund-subscribe': '申购', 'fund-redeem': '赎回' }[c.kind])}</td>
                    <td className="num">
                      {c.direction === 'in' ? '+' : '−'}{c.currency} {
                        c.kind.startsWith('crypto') ? formatCryptoQty(c.currency, c.amount) : formatExactAmount(c.amount)
                      }
                    </td>
                    <td className="wrap">{c.channel || '—'}</td>
                    <td className="ref">{c.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="doc-legal">
          {t('本结单仅列示已完成记账的记录；处理中、待补凭证与失败的记录不列入，以免与期末余额不一致。数字资产数量按表内汇率折算为港元估值，仅供参考。基金交易金额为含费净额，费用明细见各笔交易确认单。基金投资涉及风险，过往业绩不代表未来表现。本结单由电脑系统自动生成，无需签署。')}
        </p>
        <p className="doc-legal">{t('本账户结单为期末对账凭证；与日结单不一致时，以本结单为准。')}</p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
        </footer>
      </article>
      </DocViewport>

      {printNote && <p className="statement-print-note">{printNote}</p>}

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={download}>
          <Download size={16} /> {t('下载')}
        </button>
      </div>
    </div>
  );
}
