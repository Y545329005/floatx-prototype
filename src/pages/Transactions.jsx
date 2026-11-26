import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { clickable } from '../lib';
import BottomPicker from '../components/BottomPicker';
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
  const [picker, setPicker] = useState(null);
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

  // 只取已记账的资金流水；委托账户划入（2026-11-16）同为「已记账」事实，入列展示
  const txRows = transactions
    .filter(tx => (tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'mandate_transfer_in') && tx.status === 'completed')
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
          <h1>{t('资金流水')}</h1>
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
          <button
            type="button"
            className="form-input transaction-range picker-trigger"
            onClick={() => setPicker('status')}
            aria-label={t('状态')}
          >
            <span className="picker-trigger-value">{t(STATUS_FILTERS.find(s => s.key === status)?.labelKey || '全部状态')}</span>
            <ChevronDown size={14} className="picker-caret" />
          </button>
          <button
            type="button"
            className="form-input transaction-range picker-trigger"
            onClick={() => setPicker('range')}
            aria-label={t('时间范围')}
          >
            <span className="picker-trigger-value">{t(RANGES.find(r => r.key === range)?.labelKey || '全部时间')}</span>
            <ChevronDown size={14} className="picker-caret" />
          </button>
          <span className="transaction-count text-muted text-sm">{t('共 {} 条').replace('{}', rows.length)}</span>
        </div>
      </div>

      {/* 筛选底部弹层（替代原生 select，统一 APP 交互） */}
      <BottomPicker
        open={picker === 'status'}
        title={t('状态')}
        value={status}
        options={STATUS_FILTERS.map(s => ({ value: s.key, label: t(s.labelKey) }))}
        onSelect={v => { setStatus(v); resetPaging(); }}
        onClose={() => setPicker(null)}
      />
      <BottomPicker
        open={picker === 'range'}
        title={t('时间范围')}
        value={range}
        options={RANGES.map(r => ({ value: r.key, label: t(r.labelKey) }))}
        onSelect={v => { setRange(v); resetPaging(); }}
        onClose={() => setPicker(null)}
      />

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
              // 委托账户划入是入账方向（2026-11-16）：与充值同号「+」
              const positive = row.kind === 'deposit' || row.kind === 'mandate_transfer_in';
              const sign = positive ? '+' : '-';
              const typeLabel = row.kind === 'deposit' ? '充值' : row.kind === 'mandate_transfer_in' ? '委托账户划入' : '提现';
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
                      <span className={`transaction-type ${row.kind}`}>{t(typeLabel)}</span>
                      {meta && <span className={`tag ${meta.cls} transaction-status-tag`}>{t(meta.labelKey)}</span>}
                    </span>
                    <span className="transaction-row-right">
                      {row.extra && <span className="wallet-transaction-extra">{row.extra}</span>}
                      {/* 回单入口只挂已完成流水：申请单还在途，没有凭证可出；
                          委托划入是平台内部记账，不出银行回单 */}
                      {row.status === 'completed' && row.kind !== 'mandate_transfer_in' && (
                        <button
                          type="button"
                          className="transaction-receipt"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`#receipt/${row.kind}/${row.reqId || row.id}`);
                          }}
                        >
                          {t('回单')}
                        </button>
                      )}
                    </span>
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
