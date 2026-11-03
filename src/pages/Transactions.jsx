import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import { clickable } from '../lib';
import {
  transactions, depositRequests, withdrawRequests, walletAccountOf, formatExactAmount, currentUser,
} from '../mock/data';
import { useLang } from '../i18n';

// 资金明细（2026-10-29 二轮：由「资金记录」+「资金申请」归并而成）
//
// 为什么归并：同一笔钱此前存了两份——申请单（depositRequests / withdrawRequests）
// 与核准后写入的流水（transactions）。两个页面各取一份，打开来当然长得一样。
//
// 归并规则是互斥的，不需要 id 关联字段：
//   申请单只取「未成功」的（处理中 / 待补凭证 / 未通过）——过程
//   流水只取「已记账」的（completed）——结果
//   一笔钱要么还在过程里，要么已经记进结果，不可能同时在两边，天然零重复。
//
// 一条筛选 + 一套日期分组 + 一套无限滚动（沿用 2026-08-19 的滚动机制），
// 不再有两套列表各自的筛选器与重置逻辑。

const KIND_FILTERS = [
  { key: 'all', labelKey: '全部' },
  { key: 'deposit', labelKey: '充值' },
  { key: 'withdraw', labelKey: '提现' },
];

const STATUS_FILTERS = [
  { key: 'all', labelKey: '全部状态' },
  { key: 'pending', labelKey: '处理中' },
  { key: 'requires_evidence', labelKey: '待补凭证' },
  { key: 'rejected', labelKey: '未通过' },
  { key: 'cancelled', labelKey: '已撤销' },
  { key: 'completed', labelKey: '已完成' },
];

const RANGES = [
  { key: 'all', labelKey: '全部时间' },
  { key: '7d', labelKey: '近 7 天' },
  { key: '30d', labelKey: '近 30 天' },
  { key: '90d', labelKey: '近 90 天' },
];

// 分组加载：初始 2 个日期组，触底每次追加 2 组
const INITIAL_GROUPS = 2;
const STEP_GROUPS = 2;

// 申请单的 time 到秒、流水只到日；统一裁到分钟（对投资人而言秒没有决策价值）
const fmtTime = s => (String(s || '').length > 10 ? String(s).slice(0, 16) : String(s || ''));

// 状态徽标：已完成为默认终态，不挂徽标（每行都挂「已完成」等于噪音）
const STATUS_META = {
  pending: { labelKey: '处理中', cls: 'tag-warning' },
  requires_evidence: { labelKey: '待补凭证', cls: 'tag-danger' },
  rejected: { labelKey: '未通过', cls: 'tag-neutral' },
  cancelled: { labelKey: '已撤销', cls: 'tag-neutral' },
};

export default function Transactions({ navigate, goBack }) {
  const { t } = useLang();
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('all');
  const [shownGroups, setShownGroups] = useState(INITIAL_GROUPS);

  const resetPaging = () => setShownGroups(INITIAL_GROUPS);

  // 只取未成功的申请单（过程）；approved 的钱已经由流水承担，不重复出列
  const toReqRow = (r, kind) => ({
    key: `req-${r.id}`,
    kind,
    status: r.status,
    amount: r.amount,
    currency: r.currency,
    time: r.createdAt,
    extra: r.bank || '',
    reqId: r.id,
  });
  // 申请单只取「本人」且未成功的（2026-11-02 修复：此前无归属过滤，u1 能看到并打开其他客户的在途/被拒单）
  const reqRows = [
    ...depositRequests.filter(r => r.userId === currentUser.id && r.status !== 'approved').map(r => toReqRow(r, 'deposit')),
    ...withdrawRequests.filter(r => r.userId === currentUser.id && r.status !== 'approved').map(r => toReqRow(r, 'withdraw')),
  ];

  // 只取已记账的资金流水
  const txRows = transactions
    .filter(tx => (tx.type === 'deposit' || tx.type === 'withdraw') && tx.status === 'completed')
    .map(tx => ({
      key: `tx-${tx.id}`,
      id: tx.id,
      kind: tx.type,
      status: 'completed',
      amount: tx.amount,
      currency: tx.currency,
      time: tx.createdAt,
      extra: tx.method || '',
      // 统一详情出口（2026-11-02 定稿）：审批流水带 reqId → 申请详情；历史导入流水无申请单 → 交易详情页
      reqId: tx.reqId || null,
    }));

  const inRange = (row) => {
    if (range === 'all') return true;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
    const d = new Date(String(row.time).slice(0, 10));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  };

  const rows = [...reqRows, ...txRows]
    .filter(row => (kind === 'all' || row.kind === kind))
    .filter(row => (status === 'all' || row.status === status))
    .filter(inRange)
    .sort((a, b) => (String(a.time) < String(b.time) ? 1 : -1));

  // 按日期分组（保证每组完整渲染，不被分页截断）
  const groups = [];
  rows.forEach(row => {
    const date = String(row.time).slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(row);
    else groups.push({ date, items: [row] });
  });
  const visibleGroups = groups.slice(0, shownGroups);
  const hasMore = visibleGroups.length < groups.length;

  // 无限滚动：触底（提前 160px）追加下一批日期组；rAF 兜底覆盖无滚动事件的场景
  useEffect(() => {
    if (!hasMore) return undefined;
    let raf = 0;
    const check = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 160) {
        setShownGroups(s => Math.min(s + STEP_GROUPS, groups.length));
        return;
      }
      raf = requestAnimationFrame(check);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      check();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [hasMore, groups.length, shownGroups]);

  return (
    <div className="page transactions-page">
      <div className="subpage-sticky transactions-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('资金明细')}</h1>
        </div>

        <div className="segmented-control transaction-tabs">
          {KIND_FILTERS.map(f => (
            <button
              key={f.key}
              className={kind === f.key ? 'active' : ''}
              onClick={() => { setKind(f.key); resetPaging(); }}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div className="transaction-toolbar">
          <select
            className="form-input transaction-range"
            value={status}
            onChange={e => { setStatus(e.target.value); resetPaging(); }}
            aria-label={t('状态')}
          >
            {STATUS_FILTERS.map(s => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
          </select>
          <select
            className="form-input transaction-range"
            value={range}
            onChange={e => { setRange(e.target.value); resetPaging(); }}
            aria-label={t('时间范围')}
          >
            {RANGES.map(r => <option key={r.key} value={r.key}>{t(r.labelKey)}</option>)}
          </select>
          <span className="transaction-count text-muted text-sm">{t('共 {} 条').replace('{}', rows.length)}</span>
        </div>
      </div>

      <div className="card">
        {groups.length === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无记录')}</p>
          </div>
        )}
        {visibleGroups.map(g => (
          <div key={g.date} className="transaction-group">
            <div className="transaction-group-title">{g.date}</div>
            {g.items.map(row => {
              const meta = STATUS_META[row.status];
              const sign = row.kind === 'deposit' ? '+' : '-';
              const symbol = walletAccountOf(row.currency)?.symbol || '';
              // 两路统一跳详情（2026-11-02 定稿）：申请单行带 reqId → 申请详情；流水行带 id → 交易详情
              const href = row.reqId ? `#fund-request/${row.reqId}` : `#transaction/${row.id}`;
              return (
                <div
                  key={row.key}
                  className="wallet-transaction-card transaction-row-link"
                  {...clickable(() => navigate(href))}
                >
                  <div className="wallet-transaction-header">
                    <span className="transaction-type-group">
                      <span className={`transaction-type ${row.kind}`}>{t(row.kind === 'deposit' ? '充值' : '提现')}</span>
                      {meta && <span className={`tag ${meta.cls} transaction-status-tag`}>{t(meta.labelKey)}</span>}
                    </span>
                    {row.extra && <span className="wallet-transaction-extra">{row.extra}</span>}
                  </div>
                  <div className="wallet-transaction-footer">
                    <span className="text-muted text-sm">
                      <Clock size={12} /> {fmtTime(row.time)}
                    </span>
                    <span className="wallet-transaction-amount">
                      {sign}{symbol}{formatExactAmount(row.amount)}
                      <ChevronRight size={14} className="transaction-row-arrow" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hasMore ? (
        <div className="transaction-load-sentinel" aria-hidden="true" />
      ) : (
        groups.length > 0 && <div className="list-end">— {t('到底了')} —</div>
      )}
    </div>
  );
}
