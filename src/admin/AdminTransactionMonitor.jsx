import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, AlertTriangle, TrendingUp, DollarSign, Activity, CheckCircle, XCircle, Clock, FileText, Eye } from 'lucide-react';
import { transactions, formatExactAmount } from '../mock/data';

// AML 标签映射
const AML_FLAG_LABELS = {
  large_amount: { label: '大额交易', className: 'aml-flag-warning' },
  suspicious: { label: '可疑交易', className: 'aml-flag-danger' },
  cross_border: { label: '跨境交易', className: 'aml-flag-primary' },
  structure_break: { label: '疑似拆分', className: 'aml-flag-compliance' },
  frequent_exit: { label: '频繁退出', className: 'aml-flag-danger' },
};

const typeLabels = { deposit: '充值', withdraw: '提现', subscription: '申购', exchange: '换汇', exit: '退出' };

// 大额交易阈值（HKD）
const LARGE_AMOUNT_THRESHOLD = 500000;

// 标签页定义
const TABS = [
  { key: 'all', label: '全部交易', icon: Activity },
  { key: 'large', label: '大额交易', icon: DollarSign },
  { key: 'suspicious', label: '异常交易', icon: AlertTriangle },
  { key: 'chart', label: '监控图表', icon: TrendingUp },
];

// 类型筛选
const TX_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'deposit', label: '充值' },
  { key: 'withdraw', label: '提现' },
  { key: 'subscription', label: '申购' },
  { key: 'exchange', label: '换汇' },
  { key: 'exit', label: '退出' },
];

// 时间范围
const TX_RANGES = [
  { key: 'all', label: '全部时间' },
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: '90d', label: '近 90 天' },
];

// 处置状态定义
const DISPOSITION_STATUS = {
  pending: { label: '待审核', className: 'status-pending', icon: Clock },
  reported: { label: '已上报', className: 'status-reported', icon: CheckCircle },
  excluded: { label: '已排除', className: 'status-excluded', icon: XCircle },
  rejected: { label: '已拒绝', className: 'status-rejected', icon: XCircle },
};

/**
 * 交易监控页面（合规风控）
 * 结构对齐后台列表页规范：标签页 + 筛选行 + 表格（操作列）+ 右侧抽屉
 */
export default function AdminTransactionMonitor({ admin }) {
  const [activeTab, setActiveTab] = useState('all');
  const [txType, setTxType] = useState('all');
  const [txRange, setTxRange] = useState('all');
  const [txKeyword, setTxKeyword] = useState('');
  const [txPage, setTxPage] = useState(1);

  // 抽屉状态
  const [selectedTx, setSelectedTx] = useState(null);
  const [showMarkInput, setShowMarkInput] = useState(false);
  const [markNote, setMarkNote] = useState('');
  const [showApprovalInput, setShowApprovalInput] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalAction, setApprovalAction] = useState('reported');

  // 处置数据（内存存储，刷新后丢失）
  const [dispositions, setDispositions] = useState({});

  // 当前用户角色（来自登录态；super 可标记+审批，compliance 仅标记——审批视角分叉的唯一真源）
  const currentUserRole = admin?.role || 'compliance';
  const currentUser = admin?.name || '张合规';
  const canMark = ['compliance', 'super'].includes(currentUserRole);
  const canApprove = currentUserRole === 'super';

  const drawerOpen = !!selectedTx;

  // 抽屉打开：锁定背景滚动 + Esc 关闭（AntD Drawer 惯例，对齐 PI/KYC 抽屉）
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeDetail(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // 统计（badge 用；口径与 tab 过滤一致：异常 = amlFlags 非空，大额 = 超阈值）
  const stats = useMemo(() => ({
    total: transactions.length,
    large: transactions.filter(t => t.amount >= LARGE_AMOUNT_THRESHOLD).length,
    suspicious: transactions.filter(t => t.amlFlags && t.amlFlags.length > 0).length,
  }), []);

  // 大额交易
  const largeTransactions = useMemo(
    () => transactions.filter(t => t.amount >= LARGE_AMOUNT_THRESHOLD), []);

  // 异常交易
  const suspiciousTransactions = useMemo(
    () => transactions.filter(t => t.amlFlags && t.amlFlags.length > 0), []);

  // 按月统计
  const monthlyStats = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const month = t.createdAt.slice(0, 7);
      if (!map[month]) map[month] = { count: 0, amount: 0 };
      map[month].count += 1;
      map[month].amount += t.amount;
    });
    return Object.entries(map)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, []);

  const maxMonthlyAmount = useMemo(
    () => Math.max(...monthlyStats.map(s => s.amount), 1), [monthlyStats]);

  // 筛选逻辑
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

  const txFiltered = useMemo(() => {
    let filtered = transactions;
    if (activeTab === 'large') filtered = largeTransactions;
    else if (activeTab === 'suspicious') filtered = suspiciousTransactions;

    if (txSearching) {
      filtered = filtered.filter(t => txMatch(t));
    } else {
      if (txType !== 'all') filtered = filtered.filter(t => t.type === txType);
      filtered = filtered.filter(t => txInRange(t));
    }
    return filtered;
  }, [activeTab, largeTransactions, suspiciousTransactions, txSearching, txKw, txType, txRange]);

  const TX_PAGE = 10;
  const txTotalPages = Math.max(1, Math.ceil(txFiltered.length / TX_PAGE));
  const safeTxPage = Math.min(txPage, txTotalPages);
  const txRows = txFiltered.slice((safeTxPage - 1) * TX_PAGE, safeTxPage * TX_PAGE);

  // AML 标签（抽屉内）——数据契约：amlFlags = [{ type, level, triggeredAt, ... }]（PRD 08 §4.1，T1 归一化）
  const getAmlFlagsBadges = (flags) => {
    if (!flags || flags.length === 0) return <span className="text-muted">—</span>;
    return flags.map((flag, i) => {
      const info = AML_FLAG_LABELS[flag.type] || { label: flag.type, className: 'aml-flag-default' };
      return <span key={`${flag.type}-${i}`} className={`aml-flag-badge ${info.className}`}>{info.label}</span>;
    });
  };

  // 处置状态标签（列表单号后）
  const getDispositionStatus = (txId) => {
    const d = dispositions[txId];
    if (!d) return null;
    const info = DISPOSITION_STATUS[d.status];
    if (!info) return null;
    const Icon = info.icon;
    return (
      <span className={`disposition-badge ${info.className}`}>
        <Icon size={12} />
        {info.label}
      </span>
    );
  };

  // 打开抽屉
  const openDrawer = useCallback((tx) => {
    setSelectedTx(tx);
    setShowMarkInput(false);
    setMarkNote('');
    setShowApprovalInput(false);
    setApprovalNote('');
  }, []);

  // 关闭抽屉
  const closeDetail = useCallback(() => {
    setSelectedTx(null);
    setShowMarkInput(false);
    setShowApprovalInput(false);
  }, []);

  // 提交标记
  const submitMark = useCallback(() => {
    if (!selectedTx || !markNote.trim()) return;
    setDispositions(prev => ({
      ...prev,
      [selectedTx.id]: {
        status: 'pending',
        note: markNote.trim(),
        markedBy: currentUser,
        markedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }
    }));
    setShowMarkInput(false);
    setMarkNote('');
    setSelectedTx(prev => prev ? { ...prev } : null);
  }, [selectedTx, markNote, currentUser]);

  // 提交审批
  const submitApproval = useCallback(() => {
    if (!selectedTx || !approvalNote.trim()) return;
    setDispositions(prev => ({
      ...prev,
      [selectedTx.id]: {
        ...prev[selectedTx.id],
        status: approvalAction,
        approvedBy: currentUser,
        approvedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        approvalNote: approvalNote.trim(),
      }
    }));
    setShowApprovalInput(false);
    setApprovalNote('');
    setSelectedTx(prev => prev ? { ...prev } : null);
  }, [selectedTx, approvalAction, approvalNote, currentUser]);

  // 导出报告（新窗口打印 → 保存为 PDF）
  const exportReport = useCallback(() => {
    const reportData = txFiltered.map(t => {
      const d = dispositions[t.id];
      return {
        orderNo: t.orderNo,
        type: typeLabels[t.type] || t.type,
        amount: `${t.currency} ${formatExactAmount(t.amount)}`,
        time: t.createdAt,
        project: t.projectName || t.method || '—',
        status: d ? DISPOSITION_STATUS[d.status]?.label : '未标记',
        note: d?.note || '',
        markedBy: d?.markedBy || '',
        markedAt: d?.markedAt || '',
      };
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>交易监控报告</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>交易监控报告</h1>
        <div class="meta">
          <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
          <p>筛选条件：${txRange === 'all' ? '全部时间' : TX_RANGES.find(r => r.key === txRange)?.label} | ${txType === 'all' ? '全部类型' : TX_FILTERS.find(f => f.key === txType)?.label}</p>
          <p>共 ${reportData.length} 条记录</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>流水单号</th><th>类型</th><th>金额</th><th>时间</th><th>关联</th>
              <th>状态</th><th>备注</th><th>标记人</th><th>标记时间</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td>${row.orderNo}</td><td>${row.type}</td><td>${row.amount}</td>
                <td>${row.time}</td><td>${row.project}</td><td>${row.status}</td>
                <td>${row.note}</td><td>${row.markedBy}</td><td>${row.markedAt}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [txFiltered, dispositions, txRange, txType]);

  const activeDisposition = selectedTx ? dispositions[selectedTx.id] : null;

  return (
    <div className="admin-page">
      {/* 页面头部 */}
      <div className="admin-page-header">
        <h1>交易监控</h1>
        <div className="admin-page-header-right">
          <span className="text-muted">合规风控 · 共 {stats.total} 笔</span>
          {activeTab !== 'chart' && (
            <button className="btn btn-outline btn-sm" onClick={exportReport}>
              <FileText size={14} />
              导出
            </button>
          )}
        </div>
      </div>

      {/* 标签页（唯一视图切换器，badge 携带数量） */}
      <div className="admin-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setTxPage(1); }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.key === 'large' && <span className="admin-tab-badge">{stats.large}</span>}
              {tab.key === 'suspicious' && <span className="admin-tab-badge warning">{stats.suspicious}</span>}
            </button>
          );
        })}
      </div>

      {/* 筛选行：类型 + 时间 + 搜索 */}
      {activeTab !== 'chart' && (
        <div className="admin-filter-row">
          <div className="admin-filter-types">
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
          <div className="admin-filter-right">
            <select className="form-input admin-tx-range" value={txRange} onChange={e => { setTxRange(e.target.value); setTxPage(1); }}>
              {TX_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <div className="admin-search-wrap">
              <Search size={14} className="admin-search-icon" />
              <input
                className="admin-search-input"
                placeholder="搜索单号 / 关联 / 金额"
                value={txKeyword}
                onChange={e => { setTxKeyword(e.target.value); setTxPage(1); }}
              />
              {txKeyword && <button className="btn-icon" onClick={() => setTxKeyword('')}><X size={14} /></button>}
            </div>
          </div>
        </div>
      )}

      {/* 监控图表 */}
      {activeTab === 'chart' && (
        <div className="admin-chart-container">
          <div className="admin-chart-card">
            <h3>月度交易趋势</h3>
            <div className="admin-chart">
              {monthlyStats.map(stat => (
                <div key={stat.month} className="admin-chart-bar-group">
                  <div className="admin-chart-bar-wrapper">
                    <div
                      className="admin-chart-bar"
                      style={{ height: `${(stat.amount / maxMonthlyAmount) * 100}%` }}
                      title={`HKD ${formatExactAmount(stat.amount)}`}
                    />
                  </div>
                  <div className="admin-chart-label">{stat.month.slice(5)}月</div>
                  <div className="admin-chart-value">{stat.count}笔</div>
                </div>
              ))}
            </div>
            <div className="admin-chart-legend"><span>单位：HKD（金额）</span></div>
          </div>
          <div className="admin-chart-card">
            <h3>交易类型分布</h3>
            <div className="admin-chart-distribution">
              {TX_FILTERS.filter(f => f.key !== 'all').map(f => {
                const count = transactions.filter(t => t.type === f.key).length;
                const pct = (count / stats.total) * 100;
                return (
                  <div key={f.key} className="admin-chart-dist-item">
                    <div className="admin-chart-dist-label">{f.label}</div>
                    <div className="admin-chart-dist-bar-bg">
                      <div className="admin-chart-dist-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="admin-chart-dist-value">{count}笔 ({pct.toFixed(1)}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 交易列表（6 列：单号/类型/金额/时间/关联/操作） */}
      {activeTab !== 'chart' && (
        <>
          <div className="admin-table admin-table--tx-monitor">
            <div className="admin-table-header">
              <span className="col-id">流水单号</span>
              <span className="col-type">类型</span>
              <span className="col-amount">金额</span>
              <span className="col-date">时间</span>
              <span className="col-project">关联</span>
              <span className="col-actions">操作</span>
            </div>
            {txRows.map(t => (
              <div key={t.id} className="admin-table-row" onClick={() => openDrawer(t)}>
                <span className="col-id">
                  {t.orderNo}
                  {dispositions[t.id] && getDispositionStatus(t.id)}
                </span>
                <span className="col-type">{typeLabels[t.type] || t.type}</span>
                <span className="col-amount">
                  <strong>{t.type === 'deposit' || t.type === 'exit' ? '+' : '-'}{t.currency} {formatExactAmount(t.amount)}</strong>
                </span>
                <span className="col-date">{t.createdAt}</span>
                <span className="col-project">{t.projectName || t.method || '—'}</span>
                <span className="col-actions">
                  <button className="btn-icon" title="查看详情" onClick={(e) => { e.stopPropagation(); openDrawer(t); }}>
                    <Eye size={16} />
                  </button>
                </span>
              </div>
            ))}
            {txRows.length === 0 && (
              <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的交易记录</span></div>
            )}
          </div>
          {txFiltered.length > 0 && (
            <div className="admin-pagination">
              <button className="admin-page-btn" disabled={safeTxPage === 1} onClick={() => setTxPage(safeTxPage - 1)}>‹ 上一页</button>
              <span className="admin-page-info">第 {safeTxPage}/{txTotalPages} 页 · 共 {txFiltered.length} 条</span>
              <button className="admin-page-btn" disabled={safeTxPage === txTotalPages} onClick={() => setTxPage(safeTxPage + 1)}>下一页 ›</button>
            </div>
          )}
        </>
      )}

      {/* 交易详情抽屉（AntD Drawer 惯例：列表保持可见） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDetail} />}
      {drawerOpen && selectedTx && (
        <div className="admin-drawer" role="dialog" aria-label={`交易 ${selectedTx.orderNo}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">交易详情 · {selectedTx.orderNo}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDetail}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {/* 交易信息 */}
            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-label">流水单号</span>
                <span className="detail-value">{selectedTx.orderNo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">类型</span>
                <span className="detail-value">{typeLabels[selectedTx.type] || selectedTx.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">金额</span>
                <span className="detail-value">
                  {selectedTx.type === 'deposit' || selectedTx.type === 'exit' ? '+' : '-'}
                  {selectedTx.currency} {formatExactAmount(selectedTx.amount)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">时间</span>
                <span className="detail-value">{selectedTx.createdAt}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">关联</span>
                <span className="detail-value">{selectedTx.projectName || selectedTx.method || '—'}</span>
              </div>
              {selectedTx.amlFlags && selectedTx.amlFlags.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">合规标记</span>
                  <span className="detail-value detail-value--flags">{getAmlFlagsBadges(selectedTx.amlFlags)}</span>
                </div>
              )}
            </div>

            {/* 处置状态回显 */}
            {activeDisposition && (
              <div className="detail-section detail-section--status">
                <h4>处置状态</h4>
                <div className="detail-row">
                  <span className="detail-label">状态</span>
                  <span className="detail-value">{getDispositionStatus(selectedTx.id)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">备注</span>
                  <span className="detail-value">{activeDisposition.note}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">标记人</span>
                  <span className="detail-value">{activeDisposition.markedBy}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">标记时间</span>
                  <span className="detail-value">{activeDisposition.markedAt}</span>
                </div>
                {activeDisposition.approvedBy && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">审批人</span>
                      <span className="detail-value">{activeDisposition.approvedBy}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">审批意见</span>
                      <span className="detail-value">{activeDisposition.approvalNote}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 处置操作（仅 compliance/super 可见） */}
            {canMark && (
              <div className="detail-section detail-section--action">
                <h4>处置操作</h4>

                {!activeDisposition && !showMarkInput && (
                  <button className="btn btn-outline" onClick={() => setShowMarkInput(true)}>
                    <AlertTriangle size={14} />
                    标记可疑
                  </button>
                )}

                {showMarkInput && (
                  <div className="mark-form">
                    <textarea
                      className="form-input"
                      placeholder="请输入标记原因..."
                      value={markNote}
                      onChange={e => setMarkNote(e.target.value)}
                      rows={3}
                    />
                    <div className="mark-form-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => setShowMarkInput(false)}>取消</button>
                      <button className="btn btn-primary btn-sm" onClick={submitMark} disabled={!markNote.trim()}>提交</button>
                    </div>
                  </div>
                )}

                {/* 待审核且当前用户有审批权：展示审批动作 */}
                {activeDisposition?.status === 'pending' && canApprove && !showApprovalInput && (
                  <div className="approval-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setApprovalAction('reported'); setShowApprovalInput(true); }}>通过上报</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setApprovalAction('excluded'); setShowApprovalInput(true); }}>排除</button>
                  </div>
                )}

                {/* 待审核但当前用户无审批权：提示流转去向 */}
                {activeDisposition?.status === 'pending' && !canApprove && (
                  <div className="detail-hint">已提交标记，待合规主管审批</div>
                )}

                {showApprovalInput && (
                  <div className="mark-form">
                    <textarea
                      className="form-input"
                      placeholder="请输入审批意见..."
                      value={approvalNote}
                      onChange={e => setApprovalNote(e.target.value)}
                      rows={3}
                    />
                    <div className="mark-form-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => setShowApprovalInput(false)}>取消</button>
                      <button className="btn btn-primary btn-sm" onClick={submitApproval} disabled={!approvalNote.trim()}>
                        确认{approvalAction === 'reported' ? '上报' : '排除'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
