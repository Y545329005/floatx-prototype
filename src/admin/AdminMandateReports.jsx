import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Search, Save } from 'lucide-react';
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
  // 多客户/多账户：日结单按客户查，月报按账户逐行——不假设演示里只有 u1 一户
  const [stmtUser, setStmtUser] = useState('u1');
  const [stmtKeyword, setStmtKeyword] = useState('');
  const [stmtPage, setStmtPage] = useState(1);
  const [reportKeyword, setReportKeyword] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const operator = admin?.name || '运营后台';

  const accounts = mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED);
  const stmtUsers = useMemo(() => {
    const map = new Map();
    mandateAccounts.forEach(a => {
      if (a.userId && !map.has(a.userId)) map.set(a.userId, { userId: a.userId, name: a.userName || a.userId });
    });
    return Array.from(map.values());
  }, []);
  const statements = useMemo(() => getDailyStatements(stmtUser), [tick, stmtUser]);
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

  // 视图控制行 + 分页（与 AdminUsers 同款）：日结按日期检索，月报按账户/客户检索
  const filteredStatements = statements.filter(s => !stmtKeyword.trim() || String(s.date).includes(stmtKeyword.trim()));
  const STMT_PAGE_SIZE = 8;
  const stmtTotalPages = Math.max(1, Math.ceil(filteredStatements.length / STMT_PAGE_SIZE));
  const stmtSafePage = Math.min(stmtPage, stmtTotalPages);
  const stmtRows = filteredStatements.slice((stmtSafePage - 1) * STMT_PAGE_SIZE, stmtSafePage * STMT_PAGE_SIZE);

  const reportRows = accounts.filter(a => {
    const kw = reportKeyword.trim().toLowerCase();
    if (!kw) return true;
    return [a.no, a.userName, a.userId].filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const REPORT_PAGE_SIZE = 8;
  const reportTotalPages = Math.max(1, Math.ceil(reportRows.length / REPORT_PAGE_SIZE));
  const reportSafePage = Math.min(reportPage, reportTotalPages);
  const reportPageRows = reportRows.slice((reportSafePage - 1) * REPORT_PAGE_SIZE, reportSafePage * REPORT_PAGE_SIZE);
  const issuedCount = accounts.filter(a => {
    const r = buildMandateMonthlyReport(a.id, month);
    return r && r.days > 0;
  }).length;

  const handleGenerate = () => {
    const res = generateDailyStatement({ userId: stmtUser, date }, operator);
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
      {/* 日结单：存量统计 + 生成抽屉入口；客户筛选在视图控制行（多客户/多账户） */}
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">共 {statements.length} 份 · 最新 {statements[0]?.date || '—'}</span>
        <button className="btn btn-md btn-primary" onClick={() => { setGenOpen(true); setError(''); setDoneMsg(''); }}>
          <Plus size={16} /> 生成日结单
        </button>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          <select
            className="form-input mandate-select"
            aria-label="按客户筛选日结单"
            value={stmtUser}
            onChange={e => { setStmtUser(e.target.value); setStmtPage(1); }}
          >
            {stmtUsers.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
          </select>
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索日期"
            placeholder="搜索日期"
            value={stmtKeyword}
            onChange={e => { setStmtKeyword(e.target.value); setStmtPage(1); }}
          />
          {stmtKeyword && (
            <button className="btn-icon" title="清除" onClick={() => { setStmtKeyword(''); setStmtPage(1); }}><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="admin-table admin-table--daily-statements">
        <div className="admin-table-header">
          <span>日期</span>
          <span className="col-amount">总资产 HKD</span>
          <span className="col-amount">较前一交易日</span>
          <span>在途 / 锁定</span>
          <span>生成</span>
        </div>
        {stmtRows.map(s => {
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
        {stmtRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">{stmtKeyword ? '没有匹配的日结单' : '该客户暂无日结单，点右上角生成'}</span></div>
        )}
      </div>

      {filteredStatements.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={stmtSafePage === 1} onClick={() => setStmtPage(stmtSafePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {stmtSafePage}/{stmtTotalPages} 页 · 共 {filteredStatements.length} 份</span>
          <button className="admin-page-btn" disabled={stmtSafePage === stmtTotalPages} onClick={() => setStmtPage(stmtSafePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 月报索引：每账户当期一行（未出具标出），期间与检索在视图控制行 */}
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">共 {accounts.length} 户 · 已出具 {issuedCount} · 未出具 {accounts.length - issuedCount}</span>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          <input
            className="form-input admin-tx-range"
            type="month"
            value={month}
            onChange={e => { setMonth(e.target.value); setReportPage(1); }}
            aria-label="月报期间"
          />
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索账户号 / 客户"
            placeholder="搜索账户号 / 客户"
            value={reportKeyword}
            onChange={e => { setReportKeyword(e.target.value); setReportPage(1); }}
          />
          {reportKeyword && (
            <button className="btn-icon" title="清除" onClick={() => { setReportKeyword(''); setReportPage(1); }}><X size={16} /></button>
          )}
        </div>
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
        {reportPageRows.map(a => {
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
        {reportPageRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">没有匹配的委托账户</span></div>
        )}
      </div>

      {reportRows.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={reportSafePage === 1} onClick={() => setReportPage(reportSafePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {reportSafePage}/{reportTotalPages} 页 · 共 {reportRows.length} 户</span>
          <button className="admin-page-btn" disabled={reportSafePage === reportTotalPages} onClick={() => setReportPage(reportSafePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 生成日结单：统一右侧抽屉（低频动作不占常驻行） */}
      {genOpen && <div className="admin-drawer-mask" onClick={() => setGenOpen(false)} />}
      {genOpen && (
        <div className="admin-drawer" role="dialog" aria-modal="true" aria-label="生成日结单">
          <div className="admin-drawer-head">
            <h3>生成日结单</h3>
            <button className="btn-icon" title="关闭" onClick={() => setGenOpen(false)}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="card">
              <div className="card-title">日结单（现金 / 委托 / 基金三类账户快照）</div>
              <div className="form-group">
                <label className="form-label">客户</label>
                <select className="form-input" value={stmtUser} onChange={e => { setStmtUser(e.target.value); setError(''); setDoneMsg(''); }}>
                  {stmtUsers.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">结算日期</label>
                <input className="form-input" type="date" value={date} onChange={e => { setDate(e.target.value); setError(''); setDoneMsg(''); }} />
              </div>
              {error && <p className="form-error">{error}</p>}
              {doneMsg && <p className="admin-form-hint">{doneMsg}</p>}
              <div className="admin-form-actions">
                <button className="btn btn-md btn-primary" onClick={handleGenerate}><Save size={16} /> 生成 {date}</button>
                <button className="btn btn-md btn-outline" onClick={() => setGenOpen(false)}>关闭</button>
              </div>
              <p className="admin-form-hint">有待复核交易时不能生成（会被拒绝）：待复核交易不进账，带着它们出单，第二天无法解释差额。</p>
            </div>
          </div>
        </div>
      )}

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
