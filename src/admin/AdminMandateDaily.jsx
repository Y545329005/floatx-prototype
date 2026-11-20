import { useEffect, useMemo, useState } from 'react';
import { X, Search, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getMandateClients,
  getDailyStatements,
  getDailyStatementById,
  generateDailyStatementsForDate,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 日结签（2026-11-19 从「日结与月报」拆出）
//
// 一行 = 一个客户，不是一份历史单据。运营每天收盘后的真实问题是
// 「今天谁还没出单」，而不是「翻某个客户的单据列表」——后者只能一次看一户。
//
// 主动作是批量：「生成当日日结」一次处理全部客户，逐户返回结果。
// 一户因待复核交易失败，其他户照常出单（不整批回滚），失败原因落在该行状态里。
//
// 历史日不可补生成：buildDailyStatement 读的是此刻的持仓与标记价，
// 补出来的历史单据其实是今天的仓位。选历史日期只用于查看当天已生成的单据。

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminMandateDaily({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [date, setDate] = useState(today());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({}); // userId → { ok, error }
  const [msg, setMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const rows = useMemo(() => getMandateClients().map(c => {
    const stmts = getDailyStatements(c.userId);
    return {
      ...c,
      latest: stmts[0] || null,
      todayStmt: stmts.find(s => s.date === date) || null,
      generatedBy: stmts.find(s => s.date === date)?.generatedBy || '',
    };
  }), [tick, date]);

  const statusOf = (r) => {
    if (r.todayStmt) return { key: 'done', label: '已生成', cls: 'admin-status-approved' };
    const fail = results[r.userId];
    if (fail && !fail.ok) return { key: 'failed', label: '生成失败', cls: 'admin-status-rejected' };
    return { key: 'pending', label: '未生成', cls: 'admin-status-pending' };
  };

  const counts = {
    all: rows.length,
    done: rows.filter(r => r.todayStmt).length,
    pending: rows.filter(r => !r.todayStmt).length,
  };
  const filtered = rows.filter(r => {
    const st = statusOf(r);
    if (filter === 'done' && st.key !== 'done') return false;
    if (filter === 'pending' && st.key === 'done') return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [r.name, r.userId].filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isToday = date === today();

  const handleGenerate = () => {
    const res = generateDailyStatementsForDate(date, operator);
    const map = {};
    res.forEach(r => { map[r.userId] = r; });
    setResults(map);
    const ok = res.filter(r => r.ok).length;
    const failed = res.filter(r => !r.ok);
    setMsg(failed.length
      ? `已生成 ${ok} 户；${failed.length} 户失败：${failed.map(f => `${f.name}（${f.error}）`).join('、')}`
      : `已生成 ${ok} 户 ${date} 日结单`);
    setTick(t => t + 1);
  };

  const selected = detailId ? getDailyStatementById(detailId) : null;
  const drawerOpen = !!selected;
  const closeDrawer = () => navigate && navigate('#admin/mandate/daily');
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  return (
    <div className="mandate-panel mandate-panel--daily">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          共 {counts.all} 户 · 已生成 {counts.done} · 未生成 {counts.pending}
        </span>
        <button
          className="btn btn-md btn-primary"
          onClick={handleGenerate}
          disabled={!isToday}
          title={isToday ? `生成 ${date} 全部客户日结单` : '历史日不可补生成'}
        >
          <Play size={16} /> 生成日结
        </button>
      </div>

      {msg && (
        <p className={`mandate-daily-msg ${msg.includes('失败') ? 'mandate-daily-msg--warn' : ''}`}>
          {msg.includes('失败') ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} {msg}
        </p>
      )}

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '未生成' },
            { key: 'done', label: '已生成' },
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
            onChange={e => { setDate(e.target.value); setResults({}); setMsg(''); setPage(1); }}
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

      {!isToday && (
        <p className="admin-form-hint">正在查看 {date} 的生成情况；历史日只能查看，不能补生成。</p>
      )}

      <div className="admin-table admin-table--mandate-daily">
        <div className="admin-table-header">
          <span className="col-name">客户</span>
          <span>最新日结日</span>
          <span className="col-amount">最新总资产 HKD</span>
          <span>当日状态</span>
          <span>生成</span>
        </div>
        {pageRows.map(r => {
          const st = statusOf(r);
          const fail = results[r.userId];
          return (
            <div
              key={r.userId}
              className="admin-table-row"
              role={r.todayStmt ? 'button' : undefined}
              tabIndex={r.todayStmt ? 0 : undefined}
              onClick={r.todayStmt ? () => navigate(`#admin/mandate/daily/${r.todayStmt.id}`) : undefined}
              onKeyDown={r.todayStmt ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/mandate/daily/${r.todayStmt.id}`); } }) : undefined}
            >
              <span className="col-name">
                <strong>{r.name}</strong>
                <span className="mandate-subline">{r.userId}</span>
              </span>
              <span>{r.latest ? r.latest.date : '—'}</span>
              <span className="col-amount">{r.latest ? formatExactAmount(r.latest.totalHKD) : '—'}</span>
              <span className="mandate-status-cell">
                <span className={`status-badge ${st.cls}`}>{st.label}</span>
                {fail && !fail.ok && <span className="mandate-subline mandate-subline--warn">待复核交易未清</span>}
              </span>
              <span>{st.key === 'done' ? (r.generatedBy || '—') : '—'}</span>
            </div>
          );
        })}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {keyword ? '没有匹配的客户' : (filter === 'done' ? '当日还没有客户生成日结单' : '所有客户都已生成当日日结单')}
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
                  <div key={p.symbol} className="kyc-review-row"><span>{p.symbol} × {p.quantity}</span><strong>{formatExactAmount(p.marketValueHKD)} <span className="mandate-subline">{p.method} · {p.priceAt}</span></strong></div>
                ))}
                {selected.mandate.accounts && selected.mandate.accounts.length > 1 && selected.mandate.accounts.map(a => (
                  <div key={`acct-${a.id}`} className="kyc-review-row"><span>分户小计 · {a.no}</span><strong>HK$ {formatExactAmount(a.totalHKD)}</strong></div>
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
