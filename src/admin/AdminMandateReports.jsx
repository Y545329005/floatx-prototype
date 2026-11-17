import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import {
  dailyStatements,
  mandateAccounts,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_VALUATION_METHODS,
  generateDailyStatement,
  getDailyStatements,
  buildMandateMonthlyReport,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 日结单与月报（2026-11-13 批 1b · RO 补充会议 + 协议 11.3）
//
// 两个单据不是上下级关系：
//   日结单 = 每日快照，覆盖 A/B/C 三类账户，回答「今天有多少钱、比昨天多了什么」；
//   月报 = 协议义务（期末 15 个营业日内出具），由当月日结单汇总，回答「这个月发生了什么」。
// 因此月报不另录数据；日结单缺失时，月报只报已有天数，不编造缺失日。

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminMandateReports({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [accountId, setAccountId] = useState('');
  const [month, setMonth] = useState(thisMonth());
  const operator = admin?.name || '运营后台';

  const accounts = mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED);
  // 原型只演示当前演示账户 u1 的日结单与月报（与钱包归属护栏同一口径）；
  // 接后端后按账户/客户查询，不在前端拼全量。
  const statements = useMemo(() => getDailyStatements('u1'), [tick]);
  const selected = detailId ? dailyStatements.find(s => s.id === detailId) : null;
  const drawerOpen = !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate/reports');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  useEffect(() => {
    if (!accountId && accounts.length) setAccountId(accounts[0].id);
  }, [accounts.length]);

  const refresh = () => setTick(t => t + 1);

  const handleGenerate = () => {
    const res = generateDailyStatement({ userId: 'u1', date }, operator);
    if (!res.ok) { setError(res.error); setDoneMsg(''); return; }
    setError('');
    setDoneMsg(`已生成 ${date} 日结单：总资产 HK$${formatExactAmount(res.statement.totalHKD)}`);
    refresh();
  };

  const report = accountId ? buildMandateMonthlyReport(accountId, month) : null;
  const expectedDays = (() => {
    const [y, m] = String(month).split('-').map(Number);
    if (!y || !m) return 0;
    const now = new Date();
    const isCurrent = now.getFullYear() === y && now.getMonth() + 1 === m;
    return isCurrent ? now.getDate() : new Date(y, m, 0).getDate();
  })();

  return (
    <div className="mandate-panel mandate-panel--reports">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          日结单 {statements.length} 份 · 覆盖现金 / 委托 / 基金三类账户 ·
          日结单是每日快照，月报由它汇总
        </span>
        <div className="mandate-report-generate">
          <input className="form-input date-iso" type="date" value={date} onChange={e => { setDate(e.target.value); setError(''); setDoneMsg(''); }} aria-label="日结单日期" />
          <button className="btn btn-md btn-primary" onClick={handleGenerate}><Plus size={16} /> 生成日结单</button>
        </div>
      </div>

      {(error || doneMsg) && (
        <p className={error ? 'form-error' : 'admin-form-hint'}>{error || doneMsg}</p>
      )}

      <div className="admin-table admin-table--daily-statements">
        <div className="admin-table-header">
          <span>日期</span>
          <span className="col-amount">总资产 HKD</span>
          <span className="col-amount">较前一交易日</span>
          <span>在途 / 锁定</span>
          <span>生成</span>
        </div>
        {statements.map(s => {
          const diff = s.prevTotalHKD != null ? s.totalHKD - s.prevTotalHKD : null;
          return (
            <div
              key={s.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`#admin/mandate/reports/${s.id}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/mandate/reports/${s.id}`); } }}
            >
              <span>{s.date}</span>
              <span className="col-amount">{formatExactAmount(s.totalHKD)}</span>
              <span className={`col-amount ${diff == null ? '' : diff >= 0 ? 'mandate-amount-in' : 'mandate-amount-out'}`}>
                {diff == null ? '—' : `${diff >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(diff))}`}
              </span>
              <span>{s.pending?.length || 0} 笔在途 · {s.locked?.length || 0} 项锁定</span>
              <span>{s.generatedBy || '—'}</span>
            </div>
          );
        })}
        {statements.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无日结单，选择日期后点击「生成日结单」</span></div>
        )}
      </div>

      <div className="card mandate-monthly-card">
        <div className="card-title">委托账户月报（协议 11.3 · 由日结单汇总）</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">账户</label>
            <select className="form-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.no} · {a.userName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">期间（YYYY-MM）</label>
            <input className="form-input" value={month} onChange={e => setMonth(e.target.value)} placeholder="2026-11" />
          </div>
        </div>

        {!report ? (
          <p className="text-muted text-sm">请选择委托账户</p>
        ) : (
          <>
            <div className="mandate-report-grid">
              <div><span>汇总天数</span><strong>{report.days} 天</strong></div>
              <div><span>期初</span><strong>{report.openingHKD == null ? '—' : `HK$ ${formatExactAmount(report.openingHKD)}`}</strong></div>
              <div><span>期末</span><strong>HK$ {formatExactAmount(report.closingHKD)}</strong></div>
              <div><span>期间变动</span><strong>{report.changeHKD == null ? '—' : `${report.changeHKD >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(report.changeHKD))}`}</strong></div>
              <div><span>费用（费前收益口径）</span><strong>HK$ {formatExactAmount(report.feeHKD)}</strong></div>
            </div>

            <div className="admin-table admin-table--mandate-report-positions">
              <div className="admin-table-header">
                <span>持仓</span>
                <span className="col-amount">数量</span>
                <span className="col-amount">估值价</span>
                <span>估值方法</span>
                <span className="col-amount">市值 HKD</span>
              </div>
              {report.positions.map(p => (
                <div key={p.symbol} className="admin-table-row">
                  <span>{p.symbol} · {p.name}</span>
                  <span className="col-amount">{p.quantity}</span>
                  <span className="col-amount">{p.price || '—'} <span className="mandate-subline">{p.priceAt || '未标记'}</span></span>
                  <span>{MANDATE_VALUATION_METHODS[p.method] || p.method || '—'}</span>
                  <span className="col-amount">{p.price ? formatExactAmount(p.marketValueHKD) : '—'}</span>
                </div>
              ))}
            </div>

            <div className="mandate-report-grid">
              <div><span>现金余额</span><strong>{report.cash.map(c => `${c.currency} ${formatExactAmount(c.balance)}`).join(' · ')}</strong></div>
              <div><span>当月费用行</span><strong>{report.fees.length} 条</strong></div>
            </div>

            {report.days === 0 && (
              <p className="mandate-gate-warn">当月尚无日结单。协议 11.3 要求按月出具，请先生成日结单再出月报——月报不编造缺失日的数据。</p>
            )}
            {report.days > 0 && expectedDays > 0 && report.days < expectedDays && (
              <p className="admin-form-hint">本月只汇总了 {report.days} 天日结单；缺失日不计入，期末取最后一份日结单。</p>
            )}
            <p className="admin-form-hint">收益一律费前，费用在结单单列——否则客户会把费用当成亏损。月报的 15 个营业日送达义务由单据中心提醒。</p>
          </>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && selected && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`日结单 ${selected.date}`}>
          <div className="admin-drawer-head">
            <h3>日结单 {selected.date}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="card">
              <div className="card-title">现金账户（A 号）</div>
              {selected.cashA.map(c => (
                <div key={c.currency} className="kyc-review-row"><span>{c.currency}</span><strong>余额 {formatExactAmount(c.balance)} · 可用 {formatExactAmount(c.available)}</strong></div>
              ))}
            </div>

            {selected.mandate && (
              <div className="card">
                <div className="card-title">委托账户（{selected.mandate.accountNo}）</div>
                {selected.mandate.cash.map(c => (
                  <div key={c.currency} className="kyc-review-row"><span>{c.currency} 现金</span><strong>{formatExactAmount(c.balance)}</strong></div>
                ))}
                {selected.mandate.positions.map(p => (
                  <div key={p.symbol} className="kyc-review-row"><span>{p.symbol} × {p.quantity}</span><strong>{formatExactAmount(p.marketValueHKD)} <span className="mandate-subline">{p.method} · {p.priceAt}</span></strong></div>
                ))}
                <div className="kyc-review-row"><span>小计</span><strong>HK$ {formatExactAmount(selected.mandate.totalHKD)}</strong></div>
              </div>
            )}

            <div className="card">
              <div className="card-title">基金账户（C 号，按最新净值）</div>
              {selected.fund.positions.length === 0 && <p className="text-muted text-sm">无基金持仓</p>}
              {selected.fund.positions.map(p => (
                <div key={p.fundId} className="kyc-review-row">
                  <span>{p.fundName}</span>
                  <strong>{formatExactAmount(p.marketValue)} {p.currency}{p.staleNav ? ' · 未估值日沿用' : ''}</strong>
                </div>
              ))}
              <div className="kyc-review-row"><span>小计</span><strong>HK$ {formatExactAmount(selected.fund.marketValueHKD)}</strong></div>
            </div>

            <div className="card">
              <div className="card-title">在途与锁定</div>
              {selected.pending.length === 0 && selected.locked.length === 0 && <p className="text-muted text-sm">无</p>}
              {selected.pending.map((p, i) => <div key={i} className="kyc-review-row"><span>在途</span><strong>{p.label}</strong></div>)}
              {selected.locked.map((l, i) => <div key={i} className="kyc-review-row"><span>锁定</span><strong>{l.currency} {formatExactAmount(l.amount)} · {l.note}</strong></div>)}
            </div>

            <div className="card">
              <div className="card-title">合计</div>
              <div className="kyc-review-row"><span>总资产（折合 HKD）</span><strong>{formatExactAmount(selected.totalHKD)}</strong></div>
              <div className="kyc-review-row"><span>前一交易日</span><strong>{selected.prevTotalHKD == null ? '—' : formatExactAmount(selected.prevTotalHKD)}</strong></div>
              <div className="kyc-review-row"><span>生成</span><strong>{selected.generatedBy} · {String(selected.generatedAt || '').slice(0, 16)}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
