import { useState } from 'react';
import { ScrollText, Search, X } from 'lucide-react';
import { auditLogs, auditCategoryLabels } from '../mock/data';

// 审计日志（2026-08-13 · 后台 P0）：全局统一留痕视图（谁、何时、对什么、做了什么）
// 老板 2026-08-06 拍板"全流程留痕"——此前留痕散落各模块，本页统一查询（按操作人/类型/关键词筛选）。
// 浏览视图（无抽屉）：日志行是只读记录，无行内操作；接后端由服务端审计表支撑。

const actionLabels = {
  create: '新建', update: '编辑', delete: '删除', archive: '归档',
  approve: '通过', reject: '拒绝', checkin: '签到', uncheckin: '撤销签到',
  allocate: '获配', unallocate: '未获配额', forfeit: '顺延', promote: '上位', sign: '确认签署',
  assign: '分配', disable: '禁用', enable: '启用',
  submit: '提交', register: '报名', unregister: '取消报名', apply: '申请',
  // 2026-08-13 P1 新增动作
  requires_action: '退回补件', broadcast: '发送通知', reset_password: '重置密码',
};

// 分页每页 10 条：日志行高 ~60px，900 视口一屏完整放下（页头+筛选+表头+10 行+分页 ≈ 800px），
// 分页按钮无需滚动即可见——"一屏放得下"（2026-08-13 用户反馈：每次滑动找分页按钮）
const PAGE_SIZE = 10;

export default function AdminAuditLogs() {
  const [cat, setCat] = useState('all');
  const [operator, setOperator] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 操作人选项：从日志本身派生唯一名单 + "全部"（动态，含后台管理员与投资人）
  const operators = [...new Set(auditLogs.map(l => l.operator).filter(Boolean))].sort();

  const kw = keyword.trim().toLowerCase();
  // 最新在前（logAudit push 追加，倒序展示 = 审计惯例）；接后端由审计表按时间倒序查询
  const filtered = [...auditLogs].reverse().filter(l => {
    if (cat !== 'all' && l.category !== cat) return false;
    if (operator !== 'all' && l.operator !== operator) return false;
    if (kw && !(l.target || '').toLowerCase().includes(kw) && !(l.note || '').toLowerCase().includes(kw)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>审计日志</h1>
        <span className="admin-header-summary">共 {auditLogs.length} 条记录</span>
      </div>

      {/* 视图控制行：类型筛选 + 操作人筛选 + 关键词搜索（日志检索，AntD 审计列表标准） */}
      <div className="admin-view-row admin-view-row--audit">
        <div className="admin-filter-row">
          <select className="form-input admin-audit-select" value={cat} onChange={e => { setCat(e.target.value); resetPage(); }} title="按操作类型筛选">
            <option value="all">全部类型</option>
            {Object.entries(auditCategoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-input admin-audit-select" value={operator} onChange={e => { setOperator(e.target.value); resetPage(); }} title="按操作人筛选">
            <option value="all">全部操作人</option>
            {operators.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="搜索对象 / 详情"
            placeholder="搜索对象 / 详情"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); resetPage(); }}
          />
          {keyword && (
            <button className="btn-icon" title="清除" onClick={() => { setKeyword(''); resetPage(); }}><X size={16} /></button>
          )}
        </div>
      </div>

      {/* 全宽列表（只读浏览） */}
      <div className="admin-table admin-table--audit">
        <div className="admin-table-header">
          <span className="col-date">时间</span>
          <span className="col-operator">操作人</span>
          <span className="col-cat">类型</span>
          <span className="col-action">动作</span>
          <span className="col-target">对象</span>
          <span className="col-note">详情</span>
        </div>
        {pageRows.map(l => (
          <div className="admin-table-row" key={l.id}>
            <span className="col-date">{l.at}</span>
            <span className="col-operator">{l.operator}</span>
            <span className="col-cat">
              <span className="admin-audit-cat">{auditCategoryLabels[l.category] || l.category}</span>
            </span>
            <span className="col-action">{actionLabels[l.action] || l.action}</span>
            <span className="col-target"><strong>{l.target || '—'}</strong></span>
            <span className="col-note">{l.note || '—'}</span>
          </div>
        ))}
        {pageRows.length === 0 && (
          <div className="admin-table-row">
            <span className="admin-table-empty">暂无匹配的审计记录</span>
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
