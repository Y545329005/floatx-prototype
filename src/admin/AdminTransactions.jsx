import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { transactions, formatExactAmount } from '../mock/data';

const typeLabels = { deposit: '充值', withdraw: '提现', subscription: '申购', exchange: '换汇', exit: '退出' };

// 资金流水查询（2026-08-14 用户拍板 A，同日拆独立菜单 C）：类型筛选 + 时间范围 + 搜索 + 分页——流水未来很长需快速定位
// （对账按期间 / 审计按条件 / 客服按单号查单）
const TX_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'deposit', label: '充值' },
  { key: 'withdraw', label: '提现' },
  { key: 'subscription', label: '申购' },
  { key: 'exchange', label: '换汇' },
  { key: 'exit', label: '退出' },
];
const TX_RANGES = [
  { key: 'all', label: '全部时间' },
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: '90d', label: '近 90 天' },
];

export default function AdminTransactions() {
  const [txType, setTxType] = useState('all');    // 类型筛选（默认全部）
  const [txRange, setTxRange] = useState('all');  // 时间范围（全部/近7/30/90 天）
  const [txKeyword, setTxKeyword] = useState(''); // 搜索（单号/关联/金额，跨类型全局）
  const [txPage, setTxPage] = useState(1);        // 分页

  // 搜索有词 → 跨类型/时间全局检索（客服按单号查单，记不清类型/时间）；无词 → 按类型 + 时间范围筛选
  const txKw = txKeyword.trim().toLowerCase();
  const txSearching = txKw.length > 0;
  const txMatch = (t) => (t.orderNo || '').toLowerCase().includes(txKw)
    || (t.projectName || t.method || '').toLowerCase().includes(txKw)
    || String(t.amount).includes(txKw);
  const txInRange = (t) => {
    if (txRange === 'all') return true;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[txRange];
    const d = new Date(t.createdAt.slice(0, 10));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  };
  const txFiltered = transactions.filter(t => {
    if (txSearching) return txMatch(t);
    if (txType !== 'all' && t.type !== txType) return false;
    return txInRange(t);
  });
  const TX_PAGE = 15;
  const txTotalPages = Math.max(1, Math.ceil(txFiltered.length / TX_PAGE));
  const safeTxPage = Math.min(txPage, txTotalPages);
  const txRows = txFiltered.slice((safeTxPage - 1) * TX_PAGE, safeTxPage * TX_PAGE);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>资金流水</h1>
        <span className="text-muted">平台资金账目 · 共 {transactions.length} 条</span>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {TX_FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${txType === f.key && !txSearching ? 'active' : ''}`}
              onClick={() => { setTxType(f.key); setTxPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-view-row">
        <select className="form-input admin-tx-range" value={txRange} onChange={e => { setTxRange(e.target.value); setTxPage(1); }}>
          {TX_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="admin-search-wrap">
          <Search size={14} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="按单号 / 关联 / 金额搜索"
            placeholder="按单号 / 关联 / 金额搜索"
            value={txKeyword}
            onChange={e => { setTxKeyword(e.target.value); setTxPage(1); }}
          />
          {txKeyword && <button className="btn-icon" title="清除搜索" onClick={() => setTxKeyword('')}><X size={14} /></button>}
        </div>
      </div>

      <div className="admin-table admin-table--tx">
        <div className="admin-table-header">
          <span className="col-id">流水单号</span>
          <span className="col-type">类型</span>
          <span className="col-amount">金额</span>
          <span className="col-date">时间</span>
          <span className="col-project">关联</span>
        </div>
        {txRows.map(t => (
          <div key={t.id} className="admin-table-row">
            <span className="col-id">{t.orderNo}</span>
            <span className="col-type">{typeLabels[t.type] || t.type}</span>
            <span className="col-amount">
              <strong>{t.type === 'deposit' || t.type === 'exit' ? '+' : '-'}{t.currency} {formatExactAmount(t.amount)}</strong>
            </span>
            <span className="col-date">{t.createdAt}</span>
            <span className="col-project">{t.projectName || t.method || '—'}</span>
          </div>
        ))}
        {txRows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的资金流水</span></div>
        )}
      </div>
      {txFiltered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safeTxPage === 1} onClick={() => setTxPage(safeTxPage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safeTxPage}/{txTotalPages} 页 · 共 {txFiltered.length} 条</span>
          <button className="admin-page-btn" disabled={safeTxPage === txTotalPages} onClick={() => setTxPage(safeTxPage + 1)}>下一页 ›</button>
        </div>
      )}
    </div>
  );
}
