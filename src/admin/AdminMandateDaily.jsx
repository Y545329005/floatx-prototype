import { useEffect, useMemo, useState } from 'react';
import { X, Search, AlertTriangle } from 'lucide-react';
import {
  getStatementClients,
  getMandateValuationBoard,
  buildDailyStatement,
  getDailyStatementById,
  mandateTrades,
  MANDATE_TRADE_STATUS,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 委托日结（2026-11-19 独立菜单；2026-11-25 改为只读核对）
//
// 日结单从「预生成快照」改成「按结算日回算的视图」之后，这个页面不再有「生成」这个动作：
// 单据随查随算，运营点按钮把快照写死反而制造第二份真相。
// 它现在回答的是另一个问题——**出单前该看的那些东西清干净了没有**：
// 待复核的委托成交、没填价的标的。带着它们出单，客户第二天会发现单上少了一笔。
//
// 一行 = 一个客户 × 一个结算日，行可点开该日单据的核对抽屉。

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminMandateDaily({ detailId, navigate }) {
  const [date, setDate] = useState(today());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const unvalued = getMandateValuationBoard().filter(v => !v.valued).map(v => v.symbol);
    return getStatementClients().map(c => {
      const stmt = buildDailyStatement(c.userId, date);
      const pendingTrades = mandateTrades.filter(t => t.userId === c.userId
        && t.status === MANDATE_TRADE_STATUS.PENDING
        && String(t.tradeDate || '') <= date).length;
      const holdsMandate = !!stmt.mandate;
      return {
        ...c,
        stmt,
        pendingTrades,
        unvalued: holdsMandate ? unvalued : [],
        issues: (pendingTrades > 0 ? 1 : 0) + (holdsMandate && unvalued.length > 0 ? 1 : 0),
      };
    }).filter(r => r.stmt.totalHKD > 0.005 || r.stmt.movements.length > 0);
  }, [date]);

  const counts = {
    all: rows.length,
    issue: rows.filter(r => r.issues > 0).length,
    clear: rows.filter(r => r.issues === 0).length,
  };
  const filtered = rows.filter(r => {
    if (filter === 'issue' && r.issues === 0) return false;
    if (filter === 'clear' && r.issues > 0) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [r.name, r.userId].filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selected = detailId ? getDailyStatementById(detailId) : null;
  const drawerOpen = !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate-daily');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  const openRow = (r) => navigate && navigate(`#admin/mandate-daily/${r.stmt.id}`);

  return (
    <div className="admin-page admin-page--mandate">
      <div className="admin-page-header">
        <h1>委托日结</h1>
        <span className="admin-header-summary">
          共 {counts.all} 户 · 有待办 {counts.issue} · 可出单 {counts.clear}
        </span>
      </div>

      <p className="admin-form-hint">
        日结单随查随算，不再需要逐户生成；这里核对的是「出单前还有什么没清」——待复核成交与未填价标的。
      </p>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: 'issue', label: '有待办' },
            { key: 'clear', label: '可出单' },
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
            type="date"
            value={date}
            max={today()}
            aria-label="结算日期"
            onChange={e => { setDate(e.target.value); setPage(1); }}
          />
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索客户"
            placeholder="搜索客户"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => { setKeyword(''); setPage(1); }}><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="admin-table admin-table--mandate-daily">
        <div className="admin-table-header">
          <span className="col-name">客户</span>
          <span className="col-amount">当日总资产 HKD</span>
          <span className="col-amount">现金</span>
          <span className="col-amount">委托</span>
          <span className="col-amount">基金</span>
          <span>出单前核对</span>
        </div>
        {pageRows.map(r => (
          <div
            key={r.userId}
            className="admin-table-row"
            role="button"
            tabIndex={0}
            onClick={() => openRow(r)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRow(r); } }}
          >
            <span className="col-name">
              <strong>{r.name}</strong>
              <span className="mandate-subline">{r.userId} · {date}</span>
            </span>
            <span className="col-amount">{formatExactAmount(r.stmt.totalHKD)}</span>
            <span className="col-amount">{formatExactAmount(r.stmt.cashAHKD)}</span>
            <span className="col-amount">{r.stmt.mandate ? formatExactAmount(r.stmt.mandate.totalHKD) : '—'}</span>
            <span className="col-amount">{formatExactAmount(r.stmt.fund.marketValueHKD)}</span>
            <span className="mandate-status-cell">
              {r.issues === 0 ? (
                <span className="status-badge admin-status-approved">可出单</span>
              ) : (
                <>
                  <span className="status-badge admin-status-pending">
                    <AlertTriangle size={12} /> {r.issues} 项待办
                  </span>
                  <span className="mandate-subline">
                    {[
                      r.pendingTrades > 0 ? `${r.pendingTrades} 笔成交待复核` : '',
                      r.unvalued.length > 0 ? `${r.unvalued.join('、')} 未填价` : '',
                    ].filter(Boolean).join(' · ')}
                  </span>
                </>
              )}
            </span>
          </div>
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {keyword ? '没有匹配的客户' : (filter === 'issue' ? '没有客户存在出单前待办' : '没有可出单的客户')}
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
                  <div key={p.symbol} className="kyc-review-row"><span>{p.symbol} × {p.quantity}</span><strong>{formatExactAmount(p.marketValueHKD)} <span className="mandate-subline">{p.method} · {p.priceAt || '按成本'}</span></strong></div>
                ))}
                {selected.mandate.accounts && selected.mandate.accounts.length > 1 && selected.mandate.accounts.map(a => (
                  <div key={`acct-${a.id}`} className="kyc-review-row"><span>分户小计 · {a.no}</span><strong>HK$ {formatExactAmount(a.totalHKD)}</strong></div>
                ))}
                <div className="kyc-review-row"><span>小计</span><strong>HK$ {formatExactAmount(selected.mandate.totalHKD)}</strong></div>
              </div>
            )}

            <div className="card">
              <div className="card-title">基金账户（C 号，按当日已公布净值）</div>
              {selected.fund.positions.length === 0 && <p className="text-muted text-sm">无基金持仓</p>}
              {selected.fund.positions.map(p => (
                <div key={p.fundId} className="kyc-review-row">
                  <span>{p.fundName}</span>
                  <strong>{formatExactAmount(p.marketValue)} {p.currency}{p.staleNav ? ' · 沿用上一公布净值' : ''}</strong>
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
              <div className="kyc-review-row"><span>前一自然日</span><strong>{selected.prevTotalHKD == null ? '—' : formatExactAmount(selected.prevTotalHKD)}</strong></div>
              <p className="admin-form-hint">按结算日回算，不生成快照；历史日与今天的口径相同。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
