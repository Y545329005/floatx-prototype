import { useEffect, useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import {
  mandateAccounts,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_VALUATION_METHODS,
  buildMandateMonthlyReport,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 月报签（2026-11-19 从「日结与月报」拆出）
//
// 一行 = 一个账户 × 一个期间。协议 11.3 的合同义务是「每户每月一份」，
// 所以索引表要能回答「这个月谁还没出报告」，而不是下拉选一户看一份。
//
// 没有主按钮：月报是当月日结单的汇总，不是独立实体，没有「新建一份月报」这回事。
// 硬加一个「生成」按钮等于凭空造一个动作——它要么什么也不做，要么把日结重算一遍。
// 期初/期末/变动全部来自已固化的日结快照，缺日不编造。

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminMandateMonthly({ admin, navigate }) {
  const [tick] = useState(0);
  const [month, setMonth] = useState(thisMonth());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [drawerAccountId, setDrawerAccountId] = useState(null);

  const accounts = useMemo(
    () => mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED),
    []
  );

  const rows = useMemo(() => accounts.map(a => {
    const report = buildMandateMonthlyReport(a.id, month);
    const has = !!report && report.days > 0;
    return { account: a, report, has };
  }), [tick, month, accounts]);

  const counts = {
    all: rows.length,
    issued: rows.filter(r => r.has).length,
    missing: rows.filter(r => !r.has).length,
  };
  const filtered = rows.filter(r => {
    if (filter === 'issued' && !r.has) return false;
    if (filter === 'missing' && r.has) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [r.account.no, r.account.userName, r.account.userId]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const report = drawerAccountId ? buildMandateMonthlyReport(drawerAccountId, month) : null;
  const drawerOpen = !!report;
  const closeDrawer = () => setDrawerAccountId(null);
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  const expectedDays = (() => {
    const [y, m] = String(month).split('-').map(Number);
    if (!y || !m) return 0;
    const now = new Date();
    const isCurrent = now.getFullYear() === y && now.getMonth() + 1 === m;
    return isCurrent ? now.getDate() : new Date(y, m, 0).getDate();
  })();

  return (
    <div className="mandate-panel mandate-panel--monthly">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          共 {counts.all} 户 · 已出具 {counts.issued} · 未出具 {counts.missing}
        </span>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: 'issued', label: '已出具' },
            { key: 'missing', label: '未出具' },
          ].map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label} {counts[f.key]}
            </button>
          ))}
          <input
            className="form-input admin-tx-range"
            type="month"
            value={month}
            aria-label="月报期间"
            onChange={e => { setMonth(e.target.value); setPage(1); }}
          />
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索账户号 / 客户"
            placeholder="搜索账户号 / 客户"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => { setKeyword(''); setPage(1); }}><X size={16} /></button>
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
        {pageRows.map(({ account: a, report: r, has }) => (
          <div
            key={a.id}
            className="admin-table-row"
            role="button"
            tabIndex={0}
            onClick={() => setDrawerAccountId(a.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerAccountId(a.id); } }}
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
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {keyword ? '没有匹配的委托账户' : (filter === 'missing' ? '所有账户都已出具当月月报' : '没有已出具的月报')}
            </span>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 户</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && report && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`月报 ${report.accountNo} ${report.month}`}>
          <div className="admin-drawer-head">
            <h3>月报 {report.accountNo} · {report.month}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
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
              <p className="mandate-gate-warn">当月尚无日结单。协议 11.3 要求按月出具，请先在「日结」签生成日结单——月报不编造缺失日的数据。</p>
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
