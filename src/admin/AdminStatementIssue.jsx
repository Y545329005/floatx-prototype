import { useEffect, useMemo, useState } from 'react';
import { X, Search, FileCheck } from 'lucide-react';
import {
  getStatementClients,
  buildPeriodStatement,
  monthRangeOf,
  getMonthlyStatementOf,
  issueMonthlyStatement,
  deliverStatement,
  voidStatement,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 结单出具（2026-11-25）
//
// 日结单改成「按结算日回算的视图」之后，全用户唯一可归档的凭证是月结单。
// 这个页面做的是「谁这个月已经有正式凭证、谁还没有」，以及把它出具出去（出具即冻结）。
//
// 一行 = 一个客户 × 一个期间，与委托月报同一个索引表语言：它回答「这个月谁还没出单」，
// 而不是「选一户看一份」。
//
// 月末之前出具的是暂定版（期间未结束，不能假装是期末凭证）；月末后再出正式版。

const thisMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminStatementIssue({ admin }) {
  const [tick, setTick] = useState(0);
  const [month, setMonth] = useState(thisMonth());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [drawerUser, setDrawerUser] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [msg, setMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const range = monthRangeOf(month);
  const provisional = range ? range.monthEnd > today() : false;
  const end = range ? (provisional ? today() : range.monthEnd) : '';

  const rows = useMemo(() => getStatementClients().map(c => {
    const live = range ? buildPeriodStatement({ from: range.from, to: end, userId: c.userId }) : null;
    const issued = range ? getMonthlyStatementOf(c.userId, month) : null;
    const view = issued ? issued.snapshot : live;
    const has = !!view && (Math.abs(view.closingHKD) > 0.005
      || Math.abs(view.openingHKD || 0) > 0.005
      || view.trades.length > 0
      || view.cash.length > 0
      || view.fundPositions.length > 0);
    return { ...c, live, issued, view, has };
  }), [tick, month, range, end]);

  const counts = {
    all: rows.length,
    issued: rows.filter(r => r.issued).length,
    ready: rows.filter(r => !r.issued && r.has).length,
    empty: rows.filter(r => !r.issued && !r.has).length,
  };
  const filtered = rows.filter(r => {
    if (filter === 'issued' && !r.issued) return false;
    if (filter === 'pending' && (r.issued || !r.has)) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [r.name, r.userId].filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const drawer = drawerUser ? rows.find(r => r.userId === drawerUser) : null;

  const handleDeliver = (channel) => {
    if (!drawer?.issued) return;
    const res = deliverStatement('monthly', drawer.issued.id, channel, operator);
    if (!res.ok) { setMsg(res.error); return; }
    setMsg(`已登记送达：${channel}`);
    setTick(t => t + 1);
  };

  // 作废并重出一步完成：原型里发现单据少了内容时，正确动作不是改旧版，而是作废旧版、立刻重出一份。
  const handleVoid = () => {
    if (!drawer?.issued) return;
    const docNo = drawer.issued.docNo;
    const res = voidStatement('monthly', drawer.issued.id, voidReason, operator);
    if (!res.ok) { setMsg(res.error); return; }
    const again = issueMonthlyStatement(drawer.userId, month, operator);
    setVoidReason('');
    setTick(t => t + 1);
    setMsg(again.ok
      ? `已作废 ${docNo} 并重出 ${again.record.docNo}；旧版保留在审计里。`
      : `已作废 ${docNo}；重出失败：${again.error}`);
  };
  const drawerOpen = !!drawer;
  const closeDrawer = () => { setDrawerUser(null); setMsg(''); setVoidReason(''); };
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  const handleIssue = () => {
    if (!drawer) return;
    const res = issueMonthlyStatement(drawer.userId, month, operator);
    if (!res.ok) { setMsg(res.error); return; }
    setMsg(`已出具 ${res.record.docNo}${res.record.provisional ? '（暂定，期间未结束）' : ''}；当期数据已冻结。`);
    setTick(t => t + 1);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>结单出具</h1>
        <span className="admin-header-summary">
          共 {counts.all} 户 · 已出具 {counts.issued} · 待出具 {counts.ready} · 无数据 {counts.empty}
        </span>
      </div>

      <p className="admin-form-hint">
        月结单是全账户凭证，出具即冻结：之后补录成交、改估值为不改写它。日结单不冻结，以本单为准。
      </p>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: 'issued', label: '已出具' },
            { key: 'pending', label: '待出具' },
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
            aria-label="结单期间"
            onChange={e => { setMonth(e.target.value); setPage(1); setMsg(''); }}
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

      {provisional && (
        <p className="admin-form-hint">
          {month} 尚未结束，本期出具的是暂定版（截至 {end}）；月末后可出具正式版，两者并存时以正式版为准。
        </p>
      )}

      <div className="admin-table admin-table--statement-issue">
        <div className="admin-table-header">
          <span className="col-name">客户</span>
          <span className="col-amount">期初 HKD</span>
          <span className="col-amount">期末 HKD</span>
          <span className="col-amount">期间变动</span>
          <span>状态</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(r => (
          <div
            key={r.userId}
            className="admin-table-row"
            role="button"
            tabIndex={0}
            onClick={() => { setMsg(''); setDrawerUser(r.userId); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMsg(''); setDrawerUser(r.userId); } }}
          >
            <span className="col-name">
              <strong>{r.name}</strong>
              <span className="mandate-subline">{r.userId}</span>
            </span>
            <span className="col-amount">{r.has || r.issued ? (r.view.openingHKD == null ? '—' : formatExactAmount(r.view.openingHKD)) : '—'}</span>
            <span className="col-amount">{r.has || r.issued ? formatExactAmount(r.view.closingHKD) : '—'}</span>
            <span className={`col-amount ${r.view && (r.view.closingHKD - (r.view.openingHKD || 0)) < 0 ? 'mandate-amount-out' : ''}`}>
              {r.has || r.issued ? formatExactAmount(r.view.closingHKD - (r.view.openingHKD || 0)) : '—'}
            </span>
            <span className="mandate-status-cell">
              {r.issued ? (
                <>
                  <span className={`status-badge ${r.issued.provisional ? 'admin-status-pending' : 'admin-status-approved'}`}>
                    {r.issued.provisional ? '已出具（暂定）' : '已出具'}
                  </span>
                  <span className="mandate-subline">{r.issued.docNo} · {r.issued.issuedBy}</span>
                </>
              ) : r.has ? (
                <span className="status-badge admin-status-pending">待出具</span>
              ) : (
                <span className="status-badge admin-status-pending">无数据</span>
              )}
            </span>
            <span className="col-actions">
              {!r.issued && r.has && (
                <button
                  className="btn-icon"
                  title="出具月结单"
                  aria-label={`出具 ${r.name} ${month} 月结单`}
                  onClick={e => { e.stopPropagation(); setMsg(''); setDrawerUser(r.userId); }}
                >
                  <FileCheck size={16} />
                </button>
              )}
            </span>
          </div>
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {keyword ? '没有匹配的客户' : (filter === 'issued' ? '该期间还没有出具记录' : '没有待出具的客户')}
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
      {drawerOpen && drawer && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`月结单 ${drawer.name} ${month}`}>
          <div className="admin-drawer-head">
            <h3>
              月结单 {drawer.name} · {month}
              {drawer.issued && (
                <span className={`status-badge ${drawer.issued.provisional ? 'admin-status-pending' : 'admin-status-approved'} fund-product-head-badge`}>
                  {drawer.issued.provisional ? '暂定' : '已出具'}
                </span>
              )}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {msg && <p className="admin-form-hint">{msg}</p>}

            {!drawer.issued && drawer.has && (
              <div className="mandate-drawer-issue">
                <p className="admin-form-hint">
                  {provisional
                    ? `期间未结束，将出具暂定版（截至 ${end}）。`
                    : '出具后当期数据冻结；之后补录成交或改估值不影响这份结单。'}
                </p>
                <button className="btn btn-md btn-primary" onClick={handleIssue}>
                  <FileCheck size={16} /> 确认出具
                </button>
              </div>
            )}

            {drawer.issued && (
              <>
                <div className="mandate-report-grid">
                  <div><span>编号</span><strong>{drawer.issued.docNo}</strong></div>
                  <div><span>出具</span><strong>{drawer.issued.issuedBy} · {String(drawer.issued.issuedAt).slice(0, 16)}</strong></div>
                  <div><span>期间</span><strong>{drawer.issued.from} ~ {drawer.issued.to}{drawer.issued.provisional ? '（暂定）' : ''}</strong></div>
                  <div><span>送达</span><strong>
                    {(drawer.issued.deliveries || []).length
                      ? drawer.issued.deliveries.map(d => `${d.channel} · ${String(d.at).slice(0, 16)}`).join('；')
                      : '未登记'}
                  </strong></div>
                </div>

                <div className="mandate-drawer-issue">
                  <p className="admin-form-hint">出具 ≠ 送达：APP 可查只证明「放在那里」，邮件/纸质要单独登记。</p>
                  <button className="btn btn-md btn-secondary" onClick={() => handleDeliver('邮件')}>登记邮件送达</button>
                </div>

                <div className="mandate-drawer-issue">
                  <input
                    className="form-input"
                    placeholder="作废原因（必填，旧版保留在审计里）"
                    value={voidReason}
                    onChange={e => setVoidReason(e.target.value)}
                    aria-label="作废原因"
                  />
                  <button className="btn btn-md btn-secondary" onClick={handleVoid} disabled={!voidReason.trim()}>作废并重出</button>
                </div>
              </>
            )}

            <div className="mandate-report-grid">
              <div><span>期初</span><strong>{!drawer.view || drawer.view.openingHKD == null ? '—' : `HK$ ${formatExactAmount(drawer.view.openingHKD)}`}</strong></div>
              <div><span>期末</span><strong>{!drawer.view ? '—' : `HK$ ${formatExactAmount(drawer.view.closingHKD)}`}</strong></div>
              <div><span>法币账户</span><strong>{!drawer.view ? '—' : drawer.view.balances.length}</strong></div>
              <div><span>基金持仓</span><strong>{!drawer.view ? '—' : drawer.view.fundPositions.length}</strong></div>
              <div><span>委托账户</span><strong>{!drawer.view ? '—' : (drawer.view.mandate ? drawer.view.mandate.accounts.length : 0)}</strong></div>
            </div>

            {!drawer.has && <p className="mandate-gate-warn">该期间没有可出具的资产与流水，不出具空结单。</p>}
            <p className="admin-form-hint">结单页脚声明「以本结单为准」；日结单不冻结，两者不一致时按本单。</p>
          </div>
        </div>
      )}
    </div>
  );
}
