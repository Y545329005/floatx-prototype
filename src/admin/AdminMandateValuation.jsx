import { useMemo, useState } from 'react';
import { X, Save, Search, Pencil, Plus } from 'lucide-react';
import {
  MANDATE_VALUATION_METHODS,
  getMandateValuationBoard,
  updateMandatePrice,
  formatShares,
} from '../mock/data';

// 估值签（2026-11-19 从交易签拆出）
//
// 口径：价格是**标的**属性，不是账户属性。一只 AAPL 当日只有一个价，被几个账户持有不影响它。
// 所以这里一行 = 一只标的，「覆盖账户」列回答「改这一次影响谁」。
//
// 为什么不放主按钮：动作是行级的（每只标的填自己的价），没有「新建一只标的」这回事。
// 行尾铅笔 → 行内展开表单，填完收起。收盘后连续填十几只，比反复开关抽屉少一半点击，
// 且表格始终在视线内（费用复核的行内展开同款语言）。
//
// 「未估值」的标的必须留在表内：运营要看到「哪只还没标价」，而不是它消失。
export default function AdminMandateValuation({ admin, navigate }) {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // { symbol, price, fxRate, priceAt, method }
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const operator = admin?.name || '财务后台';

  const board = useMemo(() => getMandateValuationBoard(), [tick]);
  const counts = {
    all: board.length,
    valued: board.filter(v => v.valued).length,
    unvalued: board.filter(v => !v.valued).length,
  };
  const filtered = board.filter(v => {
    if (filter === 'valued' && !v.valued) return false;
    if (filter === 'unvalued' && v.valued) return false;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return [v.symbol, v.name, v.currency].filter(Boolean).some(x => String(x).toLowerCase().includes(kw));
  });
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const startEdit = (v) => {
    setMsg('');
    setError('');
    setEditing({
      symbol: v.symbol,
      price: v.valued ? String(v.price) : '',
      fxRate: v.valued ? String(v.fxRate) : '',
      priceAt: v.priceAt || new Date().toISOString().slice(0, 10),
      method: v.method || 'listed',
    });
  };

  const save = () => {
    if (!editing) return;
    const res = updateMandatePrice({
      symbol: editing.symbol,
      price: Number(editing.price),
      fxRate: Number(editing.fxRate),
      priceAt: editing.priceAt,
      method: editing.method,
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    const hit = board.find(v => v.symbol === editing.symbol);
    setMsg(`${editing.symbol} 已更新为 ${editing.price}，覆盖 ${hit ? hit.accounts.join(' / ') : '—'}`);
    setError('');
    setEditing(null);
    setTick(t => t + 1);
  };

  return (
    <div className="mandate-panel mandate-panel--valuation">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          共 {counts.all} 只标的 · 已估值 {counts.valued} · 未估值 {counts.unvalued}
        </span>
        <button className="btn btn-md btn-outline" onClick={() => navigate && navigate('#admin/mandate/trades/new')}>
          <Plus size={16} /> 录入交易
        </button>
      </div>

      <p className="admin-form-hint">
        标的来自委托持仓：新增标的请先在「交易」录入买入并复核，复核生效后才会出现在这里。
      </p>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {[
            { key: 'all', label: '全部' },
            { key: 'valued', label: '已估值' },
            { key: 'unvalued', label: '未估值' },
          ].map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); setEditing(null); }}
            >
              {f.label} {counts[f.key]}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索标的代码 / 名称"
            placeholder="搜索标的代码 / 名称"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => { setKeyword(''); setPage(1); }}><X size={16} /></button>
          )}
        </div>
      </div>

      {msg && <p className="admin-form-hint mandate-valuation-msg">{msg}</p>}

      <div className="admin-table admin-table--mandate-valuation">
        <div className="admin-table-header">
          <span className="col-name">标的 / 名称</span>
          <span className="col-amount">现价</span>
          <span className="col-amount">汇率</span>
          <span>估值日</span>
          <span>方法</span>
          <span>覆盖账户</span>
          <span className="col-actions">操作</span>
        </div>
        {pageRows.map(v => (
          <div key={v.symbol} className="mandate-valuation-item">
            <div className="admin-table-row">
              <span className="col-name">
                <strong>{v.symbol}</strong>
                <span className="mandate-subline">{v.name} · {v.currency} · {formatShares(v.totalQty)} 股</span>
              </span>
              <span className="col-amount">{v.valued ? v.price : <span className="mandate-unvalued">未估值</span>}</span>
              <span className="col-amount">{v.valued ? v.fxRate : '—'}</span>
              <span>{v.priceAt || '—'}</span>
              <span>{v.valued ? (MANDATE_VALUATION_METHODS[v.method] || v.method) : '—'}</span>
              <span className="mandate-subline mandate-coverage">{v.accounts.join(' · ')}</span>
              <span className="col-actions">
                {v.valued ? (
                  <button
                    className="btn-icon"
                    title="标记估值"
                    aria-label={`标记 ${v.symbol} 估值`}
                    onClick={() => startEdit(v)}
                  >
                    <Pencil size={16} />
                  </button>
                ) : (
                  <button className="btn-link" title="填写估值" onClick={() => startEdit(v)}>填价</button>
                )}
              </span>
            </div>

            {editing && editing.symbol === v.symbol && (
              <div className="mandate-valuation-edit">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">最新价（{v.currency}）</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={editing.price}
                      onChange={e => setEditing(p => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">汇率（折 HKD）</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={editing.fxRate}
                      onChange={e => setEditing(p => ({ ...p, fxRate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">估值日</label>
                    <input
                      className="form-input"
                      type="date"
                      value={editing.priceAt}
                      onChange={e => setEditing(p => ({ ...p, priceAt: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">估值方法</label>
                    <select
                      className="form-input"
                      value={editing.method}
                      onChange={e => setEditing(p => ({ ...p, method: e.target.value }))}
                    >
                      {Object.entries(MANDATE_VALUATION_METHODS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && <p className="form-error">{error}</p>}
                <div className="admin-form-actions">
                  <button className="btn btn-md btn-primary" onClick={save}><Save size={16} /> 保存</button>
                  <button className="btn btn-md btn-outline" onClick={() => { setEditing(null); setError(''); }}>取消</button>
                </div>
                <p className="admin-form-hint">
                  保存后 {v.accounts.join(' · ')} 的持仓市值同时更新；历史日结单不回算（快照已固化当日价格）。
                </p>
              </div>
            )}
          </div>
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">
              {keyword ? '没有匹配的标的' : (filter === 'unvalued' ? '所有标的都已估值' : '暂无持仓标的')}
            </span>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 只标的</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}
    </div>
  );
}
