import { useEffect, useMemo, useState } from 'react';
import { X, Search, FileCheck } from 'lucide-react';
import {
  mandateAccounts,
  MANDATE_ACCOUNT_STATUS,
  MANDATE_VALUATION_METHODS,
  buildMandateMonthlyReport,
  getMandateReportOf,
  issueMandateMonthlyReport,
  deliverStatement,
  voidStatement,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 月报签（2026-11-19 从「日结与月报」拆出；2026-11-20 补出具）
//
// 一行 = 一个账户 × 一个期间。协议 11.3 的合同义务是「每户每月一份」，
// 所以索引表要能回答「这个月谁还没出报告」，而不是下拉选一户看一份。
//
// 月报数据是日结单的汇总，但「出具」是独立动作：出具时把当期结果冻结成快照。
// 因此没有「生成月报」按钮（数据不用生成），只有「出具」（确认这一版并归档）。
// 出具后抽屉读快照，日结单重生成也不会改写客户已收到的那一版。

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminMandateMonthly({ admin }) {
  const [tick, setTick] = useState(0);
  const [month, setMonth] = useState(thisMonth());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [drawerAccountId, setDrawerAccountId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [msg, setMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const accounts = useMemo(
    () => mandateAccounts.filter(a => a.status !== MANDATE_ACCOUNT_STATUS.CLOSED
      && a.status !== MANDATE_ACCOUNT_STATUS.PENDING),
    []
  );

  const rows = useMemo(() => accounts.map(a => {
    const report = buildMandateMonthlyReport(a.id, month);
    const issued = getMandateReportOf(a.id, month);
    // 「有数据」= 期初/期末有资产，或有流水/费用。日结单改为回算视图后 days 恒为当月天数，
    // 拿它判断会让零资产账户也显示「待出具」——出具一份全 0 的月报没有意义。
    const has = !!report && (Math.abs(report.closingHKD) > 0.005 || Math.abs(report.openingHKD) > 0.005
      || report.flows.length > 0 || report.fees.length > 0);
    return { account: a, report, issued, has, view: issued ? issued.snapshot : report };
  }), [tick, month, accounts]);

  const counts = {
    all: rows.length,
    issued: rows.filter(r => r.issued).length,
    missing: rows.filter(r => !r.issued).length,
    ready: rows.filter(r => r.has && !r.issued).length,
  };
  const filtered = rows.filter(r => {
    if (filter === 'issued' && !r.issued) return false;
    if (filter === 'missing' && r.issued) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [r.account.no, r.account.userName, r.account.userId]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const drawerAccount = drawerAccountId ? accounts.find(a => a.id === drawerAccountId) : null;
  const live = drawerAccountId ? buildMandateMonthlyReport(drawerAccountId, month) : null;
  const issuedRecord = drawerAccountId ? getMandateReportOf(drawerAccountId, month) : null;
  const view = issuedRecord ? issuedRecord.snapshot : live;
  const drawerOpen = !!drawerAccountId;
  const closeDrawer = () => { setDrawerAccountId(null); setMsg(''); setVoidReason(''); };
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

  const handleIssue = () => {
    if (!drawerAccountId) return;
    const res = issueMandateMonthlyReport(drawerAccountId, month, operator);
    if (!res.ok) { setMsg(res.error); return; }
    setMsg(`已出具 ${res.report.docNo}；当期数据已冻结，之后重生成日结不影响这份月报。`);
    setTick(t => t + 1);
  };

  const handleDeliver = (channel) => {
    if (!issuedRecord) return;
    const res = deliverStatement('mandate', issuedRecord.id, channel, operator);
    if (!res.ok) { setMsg(res.error); return; }
    setMsg(`已登记送达：${channel}`);
    setTick(t => t + 1);
  };

  // 作废并重出一步完成（同上：原型里补内容的正解是重出一版，不是改旧版）
  const handleVoid = () => {
    if (!issuedRecord) return;
    const docNo = issuedRecord.docNo;
    const accountId = issuedRecord.accountId;
    const res = voidStatement('mandate', issuedRecord.id, voidReason, operator);
    if (!res.ok) { setMsg(res.error); return; }
    const again = issueMandateMonthlyReport(accountId, month, operator);
    setVoidReason('');
    setTick(t => t + 1);
    setMsg(again.ok
      ? `已作废 ${docNo} 并重出 ${again.report.docNo}；旧版保留在审计里。`
      : `已作废 ${docNo}；重出失败：${again.error}`);
  };

  const signed = (v) => `${v >= 0 ? '+' : '−'}${formatExactAmount(Math.abs(v))}`;

  return (
    <div className="admin-page admin-page--mandate">
      <div className="admin-page-header">
        <h1>委托月报</h1>
        <span className="admin-header-summary">
          共 {counts.all} 户 · 已出具 {counts.issued} · 待出具 {counts.ready} · 无数据 {counts.all - counts.issued - counts.ready}
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
            onChange={e => { setMonth(e.target.value); setPage(1); setMsg(''); }}
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
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(({ account: a, report: r, issued, has, view: v }) => (
          <div
            key={a.id}
            className="admin-table-row"
            role="button"
            tabIndex={0}
            onClick={() => { setMsg(''); setDrawerAccountId(a.id); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMsg(''); setDrawerAccountId(a.id); } }}
          >
            <span className="col-name">
              <strong>{a.no}</strong>
              <span className="mandate-subline">{a.userName}</span>
            </span>
            <span className="col-amount">{has || issued ? formatExactAmount(v.openingHKD ?? 0) : '—'}</span>
            <span className="col-amount">{has || issued ? formatExactAmount(v.closingHKD) : '—'}</span>
            <span className={`col-amount ${v && v.changeHKD != null ? (v.changeHKD >= 0 ? 'mandate-amount-in' : 'mandate-amount-out') : ''}`}>
              {v && v.changeHKD != null ? signed(v.changeHKD) : '—'}
            </span>
            <span className="col-amount">{has || issued ? formatExactAmount(v.feeHKD) : '—'}</span>
            <span className="mandate-status-cell">
              {issued ? (
                <>
                  <span className="status-badge admin-status-approved">已出具</span>
                  <span className="mandate-subline">{issued.docNo} · {issued.issuedBy}</span>
                </>
              ) : has ? (
                <>
                  <span className="status-badge admin-status-pending">待出具</span>
                  <span className="mandate-subline">覆盖 {r.days} 天</span>
                </>
              ) : (
                <>
                  <span className="status-badge admin-status-pending">无数据</span>
                  <span className="mandate-subline">该月无资产与流水</span>
                </>
              )}
            </span>
            <span className="col-actions">
              {has && !issued && (
                <button
                  className="btn-icon"
                  title="出具月报"
                  aria-label={`出具 ${a.no} ${month} 月报`}
                  onClick={e => { e.stopPropagation(); setMsg(''); setDrawerAccountId(a.id); }}
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
      {drawerOpen && drawerAccount && view && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`月报 ${drawerAccount.no} ${month}`}>
          <div className="admin-drawer-head">
            <h3>
              月报 {drawerAccount.no} · {month}
              {issuedRecord && <span className="status-badge admin-status-approved fund-product-head-badge">已出具</span>}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {msg && <p className="admin-form-hint">{msg}</p>}

            {!issuedRecord && view.days > 0 && (
              <div className="mandate-drawer-issue">
                <p className="admin-form-hint">出具后当期数据冻结；之后重生成日结单不影响这份月报。</p>
                <button className="btn btn-md btn-primary" onClick={handleIssue}>
                  <FileCheck size={16} /> 确认出具
                </button>
              </div>
            )}

            {issuedRecord && (
              <>
                <div className="mandate-report-grid">
                  <div><span>编号</span><strong>{issuedRecord.docNo}</strong></div>
                  <div><span>出具</span><strong>{issuedRecord.issuedBy} · {String(issuedRecord.issuedAt).slice(0, 16)}</strong></div>
                  <div><span>送达</span><strong>
                    {(issuedRecord.deliveries || []).length
                      ? issuedRecord.deliveries.map(d => `${d.channel} · ${String(d.at).slice(0, 16)}`).join('；')
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
              <div><span>覆盖天数</span><strong>{view.days} 天</strong></div>
              <div><span>期初</span><strong>{view.openingHKD == null ? '—' : `HK$ ${formatExactAmount(view.openingHKD)}`}</strong></div>
              <div><span>期末</span><strong>HK$ {formatExactAmount(view.closingHKD)}</strong></div>
              <div><span>期间资金变动</span><strong>{view.netFlowHKD == null ? '—' : signed(view.netFlowHKD)}</strong></div>
              <div><span>市值变动</span><strong>{view.marketDeltaHKD == null ? '—' : signed(view.marketDeltaHKD)}</strong></div>
              <div><span>期间变动</span><strong>{view.changeHKD == null ? '—' : signed(view.changeHKD)}</strong></div>
              <div><span>费用（费前收益口径）</span><strong>HK$ {formatExactAmount(view.feeHKD)}</strong></div>
            </div>

            <div className="admin-table admin-table--mandate-report-positions">
              <div className="admin-table-header">
                <span>持仓</span>
                <span className="col-amount">数量</span>
                <span className="col-amount">估值价</span>
                <span>估值方法</span>
                <span className="col-amount">市值 HKD</span>
              </div>
              {view.positions.map(p => (
                <div key={p.symbol} className="admin-table-row">
                  <span>{p.symbol} · {p.name}</span>
                  <span className="col-amount">{p.quantity}</span>
                  <span className="col-amount">{p.price || '—'} <span className="mandate-subline">{p.priceAt || '未标记'}</span></span>
                  <span>{MANDATE_VALUATION_METHODS[p.method] || p.method || '—'}</span>
                  <span className="col-amount">{p.price ? formatExactAmount(p.marketValueHKD) : '—'}</span>
                </div>
              ))}
              {view.positions.length === 0 && (
                <div className="admin-table-row"><span className="admin-table-empty">无持仓</span></div>
              )}
            </div>

            <div className="mandate-report-grid">
              <div><span>现金余额</span><strong>{view.cash.length ? view.cash.map(c => `${c.currency} ${formatExactAmount(c.balance)}`).join(' · ') : '—'}</strong></div>
              <div><span>当月费用行</span><strong>{view.fees.length} 条</strong></div>
            </div>

            {view.days === 0 && (
              <p className="mandate-gate-warn">该期间没有可出具的资产与流水。协议 11.3 要求按月出具，零资产账户不出具空报告。</p>
            )}
            {view.days > 0 && expectedDays > 0 && view.days < expectedDays && (
              <p className="admin-form-hint">期末取期间末（月中出具则截至今日）；已出具的版本冻结，之后补录不改写它。</p>
            )}
            <p className="admin-form-hint">收益一律费前，费用在结单单列——否则客户会把费用当成亏损。月报的 15 个营业日送达义务由单据中心提醒。</p>
          </div>
        </div>
      )}
    </div>
  );
}
