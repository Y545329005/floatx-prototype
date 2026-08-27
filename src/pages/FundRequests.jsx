import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { depositRequests, withdrawRequests, exchangeRequests, currentUser, wallet, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

// 投资人资金申请页（2026-08-18：充值/提现申请独立成页，对齐交易记录页心智）
// 钱包页只保留最近 3 条摘要 + 「查看全部」入口 → 此页承担完整查询：类型筛选 + 状态筛选
// 状态是资金申请的核心关切（钱到没到/为什么被拒），时间范围收益有限故不做（数据量小）
// 2026-08-19：类型筛选增加「换汇」（人工换汇并入资金申请统一心智）；状态增加「待补凭证」（线下充值异常态）
const REQ_TYPE_FILTERS = [
  { key: 'all', labelKey: '全部' },
  { key: 'deposit', labelKey: '充值' },
  { key: 'withdraw', labelKey: '提现' },
  { key: 'exchange', labelKey: '换汇' },
];

const REQ_STATUS_FILTERS = [
  { key: 'all', labelKey: '全部状态' },
  { key: 'pending', labelKey: '处理中' },
  { key: 'requires_evidence', labelKey: '待补凭证' },
  { key: 'approved', labelKey: '已完成' },
  { key: 'rejected', labelKey: '已拒绝' },
];

const reqStatusLabels = { pending: '处理中', requires_evidence: '待补凭证', approved: '已完成', rejected: '已拒绝' };

const reqStatusTagClass = r =>
  r.status === 'approved' ? 'tag-success' : r.status === 'rejected' ? 'tag-danger' : 'tag-warning';

export default function FundRequests({ navigate, goBack }) {
  const { t } = useLang();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef(null);

  // 点击外部关闭下拉（对齐 Events.jsx 先例）
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  // 我的资金申请（充值/提现/换汇，与钱包页同源过滤）
  const myDeposits = depositRequests.filter(r => r.userId === currentUser.id);
  const myWithdraws = withdrawRequests.filter(r => r.userId === currentUser.id);
  const myExchanges = exchangeRequests.filter(r => r.userId === currentUser.id);
  const myRequests = [
    ...myDeposits.map(r => ({ ...r, kind: 'deposit' })),
    ...myWithdraws.map(r => ({ ...r, kind: 'withdraw' })),
    ...myExchanges.map(r => ({ ...r, kind: 'exchange' })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const filtered = myRequests.filter(r => {
    if (typeFilter !== 'all' && r.kind !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const currentStatusLabel = (REQ_STATUS_FILTERS.find(f => f.key === statusFilter) || REQ_STATUS_FILTERS[0]).labelKey;

  return (
    <div className="page fund-requests-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#wallet')}><ArrowLeft size={20} /></button>
          <h1>{t('资金申请')}</h1>
        </div>
      </div>

      {/* 主维度：类型（segmented-control） */}
      <div className="segmented-control transaction-tabs">
        {REQ_TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            className={typeFilter === f.key ? 'active' : ''}
            onClick={() => setTypeFilter(f.key)}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* 辅维度：状态（紧凑 dropdown）+ 总条数 */}
      <div className="transaction-toolbar">
        <div className="type-dropdown" ref={statusRef}>
          <button
            className={`type-dropdown-btn${statusOpen ? ' open' : ''}`}
            onClick={() => setStatusOpen(o => !o)}
            aria-haspopup="listbox"
            aria-expanded={statusOpen}
          >
            <span className="type-dropdown-label">{t(currentStatusLabel)}</span>
            <ChevronDown size={14} className="type-dropdown-chevron" />
          </button>
          {statusOpen && (
            <div className="type-dropdown-menu" role="listbox">
              {REQ_STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`type-dropdown-menu-item${statusFilter === f.key ? ' selected' : ''}`}
                  onClick={() => { setStatusFilter(f.key); setStatusOpen(false); }}
                  role="option"
                  aria-selected={statusFilter === f.key}
                >
                  <span>{t(f.labelKey)}</span>
                  {statusFilter === f.key && <Check size={14} className="check" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="transaction-count text-muted text-sm">{t('共 {} 条').replace('{}', filtered.length)}</span>
      </div>

      <div className="card">
        {filtered.length === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无资金申请')}</p>
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="fund-request-row clickable" onClick={() => navigate(`#fund-request/${r.id}`)}>
            <div className="fund-request-info">
              <div className="fund-request-line">
                <span className={`transaction-type ${r.kind}`}>
                  {r.kind === 'deposit' ? t('充值') : r.kind === 'withdraw' ? t('提现') : t('换汇')}
                </span>
                <span className={`tag ${reqStatusTagClass(r)}`}>{t(reqStatusLabels[r.status] || r.status)}</span>
              </div>
              <span className="text-muted text-sm"><Clock size={10} /> {r.createdAt}</span>
            </div>
            <div className="fund-request-right">
              {r.kind === 'exchange' ? (
                <span className="fund-request-amount">
                  {r.fromCurrency} {formatCurrency(r.amount)} → {r.toCurrency}
                </span>
              ) : (
                <span className="fund-request-amount">
                  {r.kind === 'deposit' ? '+' : '-'}
                  {wallet[String(r.currency || '').toLowerCase()]?.symbol || ''}{formatCurrency(r.amount)}
                </span>
              )}
              <ChevronRight size={16} className="wallet-request-chevron" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
