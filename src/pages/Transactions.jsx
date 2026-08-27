import { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { transactions, wallet, formatExact } from '../mock/data';
import { useLang } from '../i18n';

// 投资人交易记录页（2026-08-18：钱包交易记录独立成页，对齐后台资金流水查询心智）
// 钱包页只保留最近 5 条摘要 + 「查看全部」入口 → 此页承担完整明细查询：
// 类型筛选 + 时间范围 + 日期分组 + 分组加载
// 2026-08-19：行结构对齐钱包页 wallet-transaction-card 两行布局（此前 .transaction-row CSS 缺失导致全部内容靠左堆叠）；
// 「加载更多」按钮 → 无限滚动（window scroll + rAF 兜底，触底追加日期组，组完整不被截断；全部加载后显示到底标记）；
// 筛选区（类型 tab + 时间工具栏）整体吸顶（transactions-sticky 变体）；
// 金额改精确数值 formatExact（对账场景不缩写，对齐钱包页余额格式；币种符号前置为国际惯例）
const TX_FILTERS = [
  { key: 'all', labelKey: '全部' },
  { key: 'deposit', labelKey: '充值' },
  { key: 'withdraw', labelKey: '提现' },
  { key: 'subscription', labelKey: '申购' },
  { key: 'exchange', labelKey: '换汇' },
  { key: 'exit', labelKey: '退出' },
  { key: 'dividend', labelKey: '分红' },
];

const TX_RANGES = [
  { key: 'all', labelKey: '全部时间' },
  { key: '7d', labelKey: '近 7 天' },
  { key: '30d', labelKey: '近 30 天' },
  { key: '90d', labelKey: '近 90 天' },
];

// 分组加载：初始显示 2 个日期组，触底每次追加 2 组（移动端逐条分页反而打断日期分组）
const INITIAL_GROUPS = 2;
const STEP_GROUPS = 2;

export default function Transactions({ navigate, goBack }) {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState('all');
  const [shownGroups, setShownGroups] = useState(INITIAL_GROUPS);

  const labels = {
    deposit: t('充值'),
    withdraw: t('提现'),
    subscription: t('申购'),
    exchange: t('换汇'),
    exit: t('退出'),
    dividend: t('分红'),
  };

  const inRange = (tx) => {
    if (range === 'all') return true;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
    const d = new Date(tx.createdAt.slice(0, 10));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  };

  // 过滤 + 按日期倒序（createdAt 为 YYYY-MM-DD，字符串比较即时间序）
  const filtered = transactions
    .filter(tx => (filter === 'all' || tx.type === filter) && inRange(tx))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // 按日期分组（保证每组完整渲染，不被分页截断）
  const groups = [];
  filtered.forEach(tx => {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.createdAt) {
      last.items.push(tx);
    } else {
      groups.push({ date: tx.createdAt, items: [tx] });
    }
  });
  const visibleGroups = groups.slice(0, shownGroups);
  const hasMore = visibleGroups.length < groups.length;

  // 无限滚动：触底（提前 160px）自动追加下一批日期组。
  // scroll 事件触发立即检查；未触底时 rAF 循环兜底（覆盖滚动位置已到底但无新事件的场景，如浏览器恢复滚动位置）；
  // shownGroups 变化后 effect 重跑自检 → 内容不足一屏时自动连续加载到撑满或全部加载完
  useEffect(() => {
    if (!hasMore) return undefined;
    let raf = 0;
    const check = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 160) {
        setShownGroups(s => Math.min(s + STEP_GROUPS, groups.length));
        return; // 已触底加载，等 effect 重跑后再次检查
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
          <button className="back-btn" onClick={() => goBack('#wallet')}><ArrowLeft size={20} /></button>
          <h1>{t('交易记录')}</h1>
        </div>

        <div className="segmented-control transaction-tabs">
          {TX_FILTERS.map(f => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => { setFilter(f.key); setShownGroups(INITIAL_GROUPS); }}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div className="transaction-toolbar">
          <select
            className="form-input transaction-range"
            value={range}
            onChange={e => { setRange(e.target.value); setShownGroups(INITIAL_GROUPS); }}
          >
            {TX_RANGES.map(r => <option key={r.key} value={r.key}>{t(r.labelKey)}</option>)}
          </select>
          <span className="transaction-count text-muted text-sm">{t('共 {} 条').replace('{}', filtered.length)}</span>
        </div>
      </div>

      <div className="card">
        {groups.length === 0 && (
          <div className="empty-state">
            <p className="text-muted">{t('暂无交易记录')}</p>
          </div>
        )}
        {visibleGroups.map(g => (
          <div key={g.date} className="transaction-group">
            <div className="transaction-group-title">{g.date}</div>
            {g.items.map(tx => (
              <div key={tx.id} className="wallet-transaction-card">
                <div className="wallet-transaction-header">
                  <span className={`transaction-type ${tx.type}`}>{labels[tx.type] || tx.type}</span>
                  <span className="wallet-transaction-extra">
                    {tx.projectName || (tx.type === 'exchange' ? tx.method : '') || ''}
                  </span>
                </div>
                <div className="wallet-transaction-footer">
                  <span className="text-muted text-sm">
                    <Clock size={12} /> {tx.createdAt}
                  </span>
                  <span className="wallet-transaction-amount">
                    {tx.type === 'deposit' || tx.type === 'exit' || tx.type === 'dividend' ? '+' : tx.type === 'exchange' ? '' : '-'}
                    {wallet[tx.currency.toLowerCase()]?.symbol || ''}{formatExact(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
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