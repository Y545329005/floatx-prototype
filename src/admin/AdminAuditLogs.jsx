import { useState } from 'react';
import { Search, X, Download } from 'lucide-react';
import { auditLogs, auditCategoryLabels } from '../mock/data';

// 审计日志（2026-08-13 · 后台 P0）：全局统一留痕视图（谁、何时、对什么、做了什么）
// 老板 2026-08-06 拍板"全流程留痕"——此前留痕散落各模块，本页统一查询（按操作人/类型/关键词筛选）。
// 浏览视图（无抽屉）：日志行是只读记录，无行内操作；接后端由服务端审计表支撑。
// 2026-11-03 定向补齐（/impeccable critique 30/40 → 方案 A，用户拍板）：
//   ① 时间筛选（快捷 chips + 起止日期；at 前缀字符串比较，免 Date 解析/时区）
//   ② 详情列 title 全文 + 两行截断（此前 nowrap+ellipsis 静默丢证据）
//   ③ 无障碍：select/图标按钮 aria-label、表格 role=table/row/cell
//   ④ 危险动作语义色（删除/禁用/重置密码；拒绝/顺延/撤销签到）
//   ⑤ 类型分三组 optgroup（业务运营/合规认证/系统与后台）
//   ⑥ 时间戳与单号 mono（DESIGN.md「可信感来自精确——等宽单号」）、计数单口径、空态出口、导出 CSV

const actionLabels = {
  create: '新建', update: '编辑', delete: '删除', archive: '归档',
  approve: '通过', reject: '拒绝', checkin: '签到', uncheckin: '撤销签到',
  allocate: '获配', unallocate: '未获配额', forfeit: '顺延', promote: '上位', sign: '确认签署',
  assign: '分配', disable: '禁用', enable: '启用',
  submit: '提交', register: '报名', unregister: '取消报名', apply: '申请',
  // 2026-08-13 P1 新增动作
  requires_action: '退回补件', broadcast: '发送通知', reset_password: '重置密码',
};

// 危险动作语义色（2026-11-03）：破坏性 = danger，拒绝/回退 = warning；
// 沿 2026-08-14「语义色文字」惯例（不实底、不引入新色相）——审计扫读的第一问是「有没有人干了危险的事」
const dangerActions = new Set(['delete', 'disable', 'reset_password']);
const warnActions = new Set(['reject', 'forfeit', 'uncheckin']);

// 类型下拉分组（2026-11-03）：14 类平铺超出工作记忆上限，按风险域分三组
const categoryGroups = [
  { label: '业务运营', keys: ['project', 'event', 'registration', 'lead', 'user', 'service', 'fundProduct', 'subscription', 'exit'] },
  { label: '合规认证', keys: ['kyc', 'pi', 'fund'] },
  { label: '系统与后台', keys: ['admin', 'config'] },
];

// 分页每页 10 条：日志行高 ~60px，900 视口一屏完整放下（页头+筛选+表头+10 行+分页 ≈ 800px），
// 分页按钮无需滚动即可见——"一屏放得下"（2026-08-13 用户反馈：每次滑动找分页按钮）
// 2026-11-03 增加时间窗行（约 +54px），仍须满足 900 视口一屏（浏览器实测验收）
const PAGE_SIZE = 10;

const pad2 = n => String(n).padStart(2, '0');
const toYmd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const daysAgoYmd = n => { const d = new Date(); d.setDate(d.getDate() - n); return toYmd(d); };

// 时间窗快捷项（改造前审计缺「何时」筛选；chips 最省空间，起止日期保留精确入口）
const RANGES = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今日', days: 0 },
  { key: '7d', label: '近 7 天', days: 6 },
  { key: '30d', label: '近 30 天', days: 29 },
];

export default function AdminAuditLogs() {
  const [cat, setCat] = useState('all');
  const [operator, setOperator] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [range, setRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // 操作人选项：从日志本身派生唯一名单 + "全部"（动态，含后台管理员与投资人）
  const operators = [...new Set(auditLogs.map(l => l.operator).filter(Boolean))].sort();

  const kw = keyword.trim().toLowerCase();
  // 最新在前（logAudit push 追加，倒序展示 = 审计惯例）；接后端由审计表按时间倒序查询
  const filtered = [...auditLogs].reverse().filter(l => {
    if (cat !== 'all' && l.category !== cat) return false;
    if (operator !== 'all' && l.operator !== operator) return false;
    const day = (l.at || '').slice(0, 10);   // "2026-08-13 16:00:00" → 日期前缀直接比较（免 Date 解析）
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    if (kw) {
      const hay = `${l.target || ''} ${l.note || ''} ${l.targetId || ''}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });

  const isFiltered = cat !== 'all' || operator !== 'all' || !!kw || !!dateFrom || !!dateTo;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const applyRange = key => {
    const r = RANGES.find(x => x.key === key);
    setRange(key);
    if (key === 'all') { setDateFrom(''); setDateTo(''); }
    else { setDateFrom(daysAgoYmd(r.days)); setDateTo(toYmd(new Date())); }
    resetPage();
  };

  const changeDate = (which, value) => {
    if (which === 'from') setDateFrom(value); else setDateTo(value);
    setRange('custom');   // 手选起止后 chips 全部回落（自定义态），避免 chips 与输入框矛盾
    resetPage();
  };

  const clearAll = () => {
    setCat('all'); setOperator('all'); setKeyword('');
    setRange('all'); setDateFrom(''); setDateTo('');
    resetPage();
  };

  // 导出当前筛选结果（合规调函的终点是可归档文件；接后端后应带水印/权限校验）
  const exportCsv = () => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(l => [
      l.at, l.operator, auditCategoryLabels[l.category] || l.category,
      actionLabels[l.action] || l.action, l.target || '', l.targetId || '', l.note || '',
    ]);
    const csv = '\ufeff' + [['时间', '操作人', '类型', '动作', '对象', '对象编号', '详情'], ...rows]
      .map(r => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `审计日志-${toYmd(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionTone = a => (dangerActions.has(a) ? 'danger' : warnActions.has(a) ? 'warn' : '');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>审计日志</h1>
        <div className="admin-page-header-actions">
          <span className="admin-header-summary" aria-live="polite">
            {isFiltered ? `筛选后 ${filtered.length} 条 / 共 ${auditLogs.length} 条` : `共 ${auditLogs.length} 条记录`}
          </span>
          <button className="admin-page-btn admin-audit-export" onClick={exportCsv} disabled={filtered.length === 0} title="导出当前筛选结果为 CSV">
            <Download size={15} /> 导出 CSV
          </button>
        </div>
      </div>

      {/* 视图控制行：类型筛选 + 操作人筛选 + 关键词搜索（2026-11-03 类型改三组 optgroup） */}
      <div className="admin-view-row admin-view-row--audit">
        <div className="admin-filter-row">
          <select className="form-input admin-audit-select" value={cat} onChange={e => { setCat(e.target.value); resetPage(); }} aria-label="按操作类型筛选">
            <option value="all">全部类型</option>
            {categoryGroups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.keys.filter(k => auditCategoryLabels[k]).map(k => (
                  <option key={k} value={k}>{auditCategoryLabels[k]}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select className="form-input admin-audit-select" value={operator} onChange={e => { setOperator(e.target.value); resetPage(); }} aria-label="按操作人筛选">
            <option value="all">全部操作人</option>
            {operators.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索对象 / 详情 / 编号"
            placeholder="搜索对象 / 详情 / 编号"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); resetPage(); }}
          />
          {keyword && (
            <button className="btn-icon" aria-label="清除搜索" title="清除" onClick={() => { setKeyword(''); resetPage(); }}><X size={16} /></button>
          )}
        </div>
      </div>

      {/* 时间窗（2026-11-03 补上「何时」这一问）：快捷 chips + 起止日期双入口 */}
      <div className="admin-audit-timerow">
        <div className="admin-audit-chips" role="group" aria-label="时间范围">
          {RANGES.map(r => (
            <button
              key={r.key}
              type="button"
              className={`admin-filter-btn${range === r.key ? ' active' : ''}`}
              aria-pressed={range === r.key}
              onClick={() => applyRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="admin-audit-dates">
          <input type="date" className="form-input admin-audit-date" aria-label="开始日期" value={dateFrom} max={dateTo || undefined} onChange={e => changeDate('from', e.target.value)} />
          <span className="admin-audit-date-sep">至</span>
          <input type="date" className="form-input admin-audit-date" aria-label="结束日期" value={dateTo} min={dateFrom || undefined} onChange={e => changeDate('to', e.target.value)} />
        </div>
      </div>

      {/* 全宽列表（只读浏览；role=table 让读屏建立列归属） */}
      <div className="admin-table admin-table--audit" role="table" aria-label="审计日志">
        <div className="admin-table-header" role="row">
          <span className="col-date" role="columnheader">时间</span>
          <span className="col-operator" role="columnheader">操作人</span>
          <span className="col-cat" role="columnheader">类型</span>
          <span className="col-action" role="columnheader">动作</span>
          <span className="col-target" role="columnheader">对象</span>
          <span className="col-note" role="columnheader">详情</span>
        </div>
        {pageRows.map(l => (
          <div className="admin-table-row" key={l.id} role="row">
            <span className="col-date" role="cell">{l.at}</span>
            <span className="col-operator" role="cell">{l.operator}</span>
            <span className="col-cat" role="cell">
              <span className="admin-audit-cat">{auditCategoryLabels[l.category] || l.category}</span>
            </span>
            <span className={`col-action admin-audit-action${actionTone(l.action) ? ` admin-audit-action--${actionTone(l.action)}` : ''}`} role="cell">
              {actionLabels[l.action] || l.action}
            </span>
            <span className="col-target" role="cell">
              <strong>{l.target || '—'}</strong>
              {l.targetId && <span className="admin-audit-targetid">{l.targetId}</span>}
            </span>
            <span className="col-note" role="cell" title={l.note || undefined}>{l.note || '—'}</span>
          </div>
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row" role="row">
            <span className="admin-table-empty" role="cell">
              暂无匹配的审计记录
              <button type="button" className="admin-filter-btn admin-audit-clear-empty" onClick={clearAll}>清除全部筛选</button>
            </span>
          </div>
        )}
      </div>

      {/* 分页 */}
      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 条</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}
    </div>
  );
}
