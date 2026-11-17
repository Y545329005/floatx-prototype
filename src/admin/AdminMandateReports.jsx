import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
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

// 日结单与月报（2026-11-13 批 1b · RO 补充会议 + 协议 11.3；2026-11-17 月报改索引表 + 抽屉）
//
// 两个单据不是上下级关系：
//   日结单 = 每日快照，覆盖 A/B/C 三类账户，回答「今天有多少钱、比昨天多了什么」；
//   月报 = 协议义务（期末 15 个营业日内出具），由当月日结单汇总，回答「这个月发生了什么」。
// 因此月报不另录数据；日结单缺失时，月报只报已有天数，不编造缺失日。
//
// 月报是「每账户 × 每月」一份的文档：索引表逐账户一行（未出具的标出），点行进抽屉看全文。
// 原「下拉选一个账户看一份」没有跨账户视角——运营答不了「这个月谁还没出报告」。
// 抽屉走组件内 state（低频查看，不占 URL；日结单抽屉仍走 URL 深链）。

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminMandateReports({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [month, setMonth] = useState(thisMonth());
  const [reportDrawer, setReportDrawer] = useState(null); // accountId，组件内 state
  const [genOpen, setGenOpen] = useState(false);
  const operator = admin?.name || '运营后台';

  const accounts = mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED);
  // 原型只演示当前演示账户 u1 的日结单与月报（与钱包归属护栏同一口径）；
  // 接后端后按账户/客户查询，不在前端拼全量。
  const statements = useMemo(() => getDailyStatements('u1'), [tick]);
  const selected = detailId ? dailyStatements.find(s => s.id === detailId) : null;
  const drawerOpen = !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate/reports');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  const report = reportDrawer ? buildMandateMonthlyReport(reportDrawer, month) : null;
  const reportDrawerOpen = !!reportDrawer && !!report;
  const closeReportDrawer = () => setReportDrawer(null);
  const reportDrawerRef = useDrawerFocus(reportDrawerOpen, closeReportDrawer);

  useEffect(() => {
    if (!drawerOpen && !reportDrawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen, reportDrawerOpen]);

  const refresh = () => setTick(t => t + 1);

  const handleGenerate = () => {
    const res = generateDailyStatement({ userId: 'u1', date }, operator);
    if (!res.ok) { setError(res.error); setDoneMsg(''); return; }
    setError('');
    setDoneMsg(`已生成 ${date} 日结单：总资产 HK$${formatExactAmount(res.statement.totalHKD)}`);
    refresh();
  };

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
        <span className="admin-header-summary">日结单是每日快照（现金 / 委托 / 基金三类账户），月报由它汇总</span>
        <button
          className="btn btn-md btn-primary"
          onClick={() => { setGenOpen(v => !v); setError(''); setDoneMsg(''); }}
        >
          <Plus size={16} /> {genOpen ? '收起' : '生成日结单'}
        </button>
      </div>

      {genOpen && (
        <div className="mandate-gen-row">
          <input className="form-input date-iso" type="date" value={date} onChange={e => { setDate(e.target.value); setError(''); setDoneMsg(''); }} aria-label="日结单日期" />
          <button className="btn btn-md btn-primary" onClick={handleGenerate}>生成 {date}</button>
        </div>
      )}

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
          <div className="admin-table-row"><span className="admin-table-empty">暂无日结单，点右上角「生成日结单」</span></div>
        )}
      </div>

      {/* 月报索引（2026-11-17 二次拍板）：每账户当期一行，未出具的标出——跨账户回答「谁还没出报告」。
          点行进抽屉看全文；期间筛选只此一处，同一数字不在行与抽屉重复第二遍。 */}
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">月报由当月日结单汇总，每账户每月一份（协议 11.3 · 期末 15 个营业日内出具）</span>
        <input
          className="form-input date-iso mandate-month-input"
          value={month}
          onChange={e => setMonth(e.target.value)}
          placeholder="2026-11"
          aria-label="月报期间"
        />
      </div>

      <div className="admin-table admin-table--mandate-monthly">
        <div className="admin-table-header">
          <span className="col-name">账户 / 客户</span>
          <span className="col-amount">期初 HKD</span>
          <span className="col-amount">期末 HKD</span>
          <span className="col-amount">期间变动</span>
          <span className="col-amount">费用 HKD</span>
          <span>状态</span>
        </div>
        {accounts.map(a => {
          const r = buildMandateMonthlyReport(a.id, month);
          const has = r && r.days > 0;
          return (
            <div
              key={a.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => setReportDrawer(a.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReportDrawer(a.id); } }}
            >
              <span className="col-name">
                <strong>{a.no}</strong>
                <span className="mandate-subline">{a.userName}</span>
              </span>
              <span className="col-amount">{has ? formatExactAmount(r.openingHKD ?? 0) : '—'}</span>
              <span className="col-amount">{has ? formatExactAmount(r.closingHKD) : '—'}</span>
              <span className={`col-amount ${has && r.changeHKD != null ? (r.changeHKD >= 0 ? 'mandate-amount-in' : 'mandate-amount-out') : ''}`}>
                {has && r.changeHKD != null ? `${r.changeHKD >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(r.changeHKD))}` : '—'}
              </span>
              <span className="col-amount">{has ? formatExactAmount(r.feeHKD) : '—'}</span>
              <span className="mandate-status-cell">
                <span className={`status-badge ${has ? 'admin-status-approved' : 'admin-status-pending'}`}>{has ? '已汇总' : '未出具'}</span>
                <span className="mandate-subline">{has ? `${r.days} 天日结单` : '该月无日结单'}</span>
              </span>
            </div>
          );
        })}
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

      {reportDrawerOpen && report && (
        <div className="admin-drawer-mask" onClick={closeReportDrawer} />
      )}
      {reportDrawerOpen && report && (
        <div className="admin-drawer admin-drawer--wide" ref={reportDrawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`月报 ${report.accountNo} ${report.month}`}>
          <div className="admin-drawer-head">
            <h3>月报 {report.accountNo} · {report.month}</h3>
            <button className="btn-icon" title="关闭" onClick={closeReportDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
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
              {report.positions.length === 0 && (
                <div className="admin-table-row"><span className="admin-table-empty">无持仓</span></div>
              )}
            </div>

            <div className="mandate-report-grid">
              <div><span>现金余额</span><strong>{report.cash.length ? report.cash.map(c => `${c.currency} ${formatExactAmount(c.balance)}`).join(' · ') : '—'}</strong></div>
              <div><span>当月费用行</span><strong>{report.fees.length} 条</strong></div>
            </div>

            {report.days === 0 && (
              <p className="mandate-gate-warn">当月尚无日结单。协议 11.3 要求按月出具，请先生成日结单再出月报——月报不编造缺失日的数据。</p>
            )}
            {report.days > 0 && expectedDays > 0 && report.days < expectedDays && (
              <p className="admin-form-hint">本月只汇总了 {report.days} 天日结单；缺失日不计入，期末取最后一份日结单。</p>
            )}
            <p className="admin-form-hint">收益一律费前，费用在结单单列——否则客户会把费用当成亏损。月报的 15 个营业日送达义务由单据中心提醒。</p>
          </div>
        </div>
      )}
    </div>
  );
}
