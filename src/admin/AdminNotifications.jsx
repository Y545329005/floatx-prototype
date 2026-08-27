import { useState, useEffect } from 'react';
import { Send, Search, X } from 'lucide-react';
import { broadcastLogs, NOTICE_TYPE_META, sendBroadcastNotification } from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 通知触达（2026-08-14 广播台账化 · 方案 A；同轮抽屉化 · 用户拍板 A；同轮定时发送）：
// 发送表单 = 页头「发送通知」按钮 → 右侧抽屉（与全后台 B2「新建 → 抽屉」同构），台账列表回到首屏主角。
// 发送 = 立即（三写：台账 + 收件箱 + 审计）/ 定时（先写台账 status scheduled，到点由 data.js processDueBroadcasts 派发）。
// 台账与收件箱数据模型分离：本页"发送历史" = 平台发送记录（含发送人），非投资人个人收件箱（无"已读/未读"列——那是接收方状态）。
// 接后端：broadcastLogs 由服务端广播记录替换、notifications 由各用户收件箱替换，零返工。

const TYPE_OPTIONS = Object.entries(NOTICE_TYPE_META).map(([key, meta]) => ({ key, label: meta.label }));

// 类型筛选（高频主筛选）：全部 + 4 类通知；搜索 = 跨类型全局（运营复盘按标题/单号查，记不清类型）
const FILTERS = [
  { key: 'all', label: '全部' },
  ...TYPE_OPTIONS,
];

export default function AdminNotifications({ admin }) {
  const [open, setOpen] = useState(false); // 发送抽屉（state 驱动，无 URL——发送是低频主动动作，对齐 AdminDividends 发起抽屉）
  const [form, setForm] = useState({ type: 'service', target: '全部投资人', title: '', body: '', mode: 'now', scheduledAt: '' });
  const [formError, setFormError] = useState('');
  // refresh hack：发送后 / 定时到期后同步台账列表（broadcastLogs 模块级数组）
  const [, setRefresh] = useState(0);
  // 确认视图（2026-08-24：全员广播不可撤回，摩擦 ∝ 爆炸半径——先预览再派发）
  const [confirmPending, setConfirmPending] = useState(false);
  // 发送回执：页头常驻绿字，下次打开抽屉或刷新前保留
  const [sentMsg, setSentMsg] = useState('');

  // 列表筛选 + 搜索 + 分页（对齐资金流水 B4b 记录列表模式）
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 统一抽屉行为：滚动锁定（Esc / Tab 圈闭 / 焦点还原由 useDrawerFocus 接管）
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeDrawer = () => { setOpen(false); setConfirmPending(false); setFormError(''); };
  // 分层退出：确认态先退回表单，再关抽屉（对齐申购页 confirmMode 惯例）
  const exitLayer = () => {
    if (confirmPending) { setConfirmPending(false); return; }
    closeDrawer();
  };
  const drawerRef = useDrawerFocus(open, exitLayer);

  // 定时广播到期联动：data.js 调度器每 5s 派发到期广播，本组件同步轮询刷新列表状态（已排期 → 已发送）
  useEffect(() => {
    const timer = setInterval(() => setRefresh(r => r + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const openDrawer = () => {
    setForm(f => ({ ...f, title: '', body: '', mode: 'now', scheduledAt: '' }));
    setFormError('');
    setConfirmPending(false);
    setOpen(true);
  };

  // 第一步：校验并进入确认视图（不派发）
  const requestSend = () => {
    if (!form.title.trim()) { setFormError('请填写通知标题'); return; }
    if (form.mode === 'schedule') {
      if (!form.scheduledAt) { setFormError('请选择定时发送时间'); return; }
      const scheduledAt = form.scheduledAt.replace('T', ' ');
      if (new Date(scheduledAt.replace(' ', 'T')).getTime() <= Date.now()) {
        setFormError('定时发送时间需晚于当前时间'); return;
      }
    }
    setFormError('');
    setConfirmPending(true);
  };

  // 第二步：确认视图中「确认发送」才真正派发（校验已在 requestSend 完成）
  const executeSend = () => {
    const isSchedule = form.mode === 'schedule';
    const scheduledAt = isSchedule ? form.scheduledAt.replace('T', ' ') : undefined;
    sendBroadcastNotification(
      { type: form.type, title: form.title.trim(), body: form.body.trim(), target: form.target, scheduledAt },
      admin?.name,
    );
    setOpen(false);
    setConfirmPending(false);
    setForm(f => ({ ...f, title: '', body: '', mode: 'now', scheduledAt: '' }));
    setFormError('');
    setRefresh(r => r + 1);
    setPage(1);
    // 发送回执：结尾闭环（此前发送后无任何显式反馈，运营需自行去台账确认）
    setSentMsg(isSchedule ? `定时广播已排期：${scheduledAt}` : '广播已发送');
  };

  // 搜索有词 → 跨类型全局检索（单号/标题/内容）；无词 → 按类型筛选
  const kw = keyword.trim().toLowerCase();
  const searching = kw.length > 0;
  const filtered = broadcastLogs.filter(l => {
    if (searching) {
      return (l.orderNo || '').toLowerCase().includes(kw)
        || (l.title || '').toLowerCase().includes(kw)
        || (l.body || '').toLowerCase().includes(kw);
    }
    if (filter !== 'all' && l.type !== filter) return false;
    return true;
  });
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>通知触达</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">平台广播台账 · 共 {broadcastLogs.length} 条</span>
          <button className="btn btn-md btn-primary" onClick={openDrawer}>
            <Send size={14} /> 发送通知
          </button>
        </div>
      </div>
      {/* 发送回执（结尾闭环：发送后页头常驻绿字直至下次打开抽屉） */}
      {sentMsg && <p className="form-success" role="status">{sentMsg}</p>}

      {/* 台账列表（B2 记录列表 · 首屏主角：类型筛选 + 搜索 + 分页；对齐 AuditLogs/KYC 列表形态——裸 table 无 card 包裹） */}
      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-filter-btn ${filter === f.key && !searching ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="admin-search-wrap">
          <Search size={14} className="admin-search-icon" />
          <input
            className="admin-search-input"
            aria-label="按单号 / 标题 / 内容搜索"
            placeholder="按单号 / 标题 / 内容搜索"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
          />
          {keyword && <button className="btn-icon" title="清除搜索" onClick={() => setKeyword('')}><X size={14} /></button>}
        </div>
      </div>

      <div className="admin-table admin-table--broadcast">
        <div className="admin-table-header">
          <span className="col-id">广播单号</span>
          <span className="col-date">发送时间</span>
          <span className="col-type">类型</span>
          <span className="col-title">标题</span>
          <span className="col-body">内容</span>
          <span className="col-operator">发送人</span>
          <span className="col-status">状态</span>
        </div>
        {rows.length === 0 ? (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的广播记录</span></div>
        ) : rows.map(l => {
          const meta = NOTICE_TYPE_META[l.type];
          return (
            <div key={l.id} className="admin-table-row">
              <span className="col-id">{l.orderNo}</span>
              <span className="col-date">{l.status === 'scheduled' ? l.scheduledAt : l.createdAt}</span>
              <span className="col-type"><span className={`status-badge ${meta?.cls || 'admin-status-notify-sub'}`}>{meta?.label || l.type}</span></span>
              <span className="col-title"><strong title={l.title}>{l.title}</strong></span>
              <span className="col-body">{l.body || '—'}</span>
              <span className="col-operator">{l.operator}</span>
              <span className="col-status">
                {l.status === 'scheduled'
                  ? <span className="status-badge admin-status-broadcast-scheduled">已排期</span>
                  : <span className="status-badge admin-status-broadcast-sent">已发送</span>}
              </span>
            </div>
          );
        })}
      </div>
      {filtered.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 条</span>
          <button className="admin-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* 发送抽屉（与 B2 新建抽屉同构：遮罩 + Esc + 滚动锁定 + head X） */}
      {open && <div className="admin-drawer-mask" onClick={exitLayer} />}
      {open && (
        <div className="admin-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="发送给投资人">
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">发送给投资人</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          {confirmPending ? (
            <>
              {/* 确认视图（2026-08-24：复用申购页 admin-confirm-view 范式；红色确认键 = 摩擦 ∝ 爆炸半径） */}
              <div className="admin-drawer-body">
                <div className="admin-confirm-view">
                  <div className="admin-confirm-title">确认发送通知</div>
                  <p className="admin-confirm-desc">面向「{form.target}」全员触达，发出后不可撤回，请核对以下内容。</p>
                  <div className="admin-confirm-row"><span>类型</span><strong>{NOTICE_TYPE_META[form.type]?.label || form.type}</strong></div>
                  <div className="admin-confirm-row"><span>发送时间</span><strong>{form.mode === 'schedule' ? `定时 · ${(form.scheduledAt || '').replace('T', ' ')}` : '立即发送'}</strong></div>
                  <div className="admin-confirm-row"><span>标题</span><strong>{form.title}</strong></div>
                  {form.body.trim() && <div className="admin-confirm-row"><span>正文</span><strong>{form.body}</strong></div>}
                </div>
                {formError && <p className="form-error">{formError}</p>}
              </div>
              <div className="admin-drawer-actions">
                <button className="btn btn-md btn-secondary" onClick={() => setConfirmPending(false)}>← 返回修改</button>
                <button className="btn btn-md btn-danger" onClick={executeSend}><Send size={14} /> 确认发送</button>
              </div>
            </>
          ) : (
            <>
          <div className="admin-drawer-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">通知类型 <span className="required-mark">*</span></label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">目标受众 <span className="required-mark">*</span></label>
                <select className="form-input" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                  <option value="全部投资人">全部投资人</option>
                </select>
                <p className="form-hint">mock 阶段仅全员广播；按角色 / 按项目 / 定向客户接后端开放</p>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">发送时间 <span className="required-mark">*</span></label>
              <div className="broadcast-schedule-row">
                <select
                  className="form-input broadcast-schedule-mode"
                  value={form.mode}
                  onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                >
                  <option value="now">立即发送</option>
                  <option value="schedule">定时发送</option>
                </select>
                {form.mode === 'schedule' && (
                  <input
                    type="datetime-local"
                    className="form-input broadcast-schedule-time"
                    value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">标题 <span className="required-mark">*</span></label>
              <input className="form-input" placeholder="如：路演提醒 / 申购进度更新" value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormError(''); }} />
            </div>
            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea className="form-input" rows={3} placeholder="通知正文（可选，标题已能表达时留空）" value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            {/* 广播内容边界（2026-08-14 用户拍板 A：合规提示，不硬校验；同轮精简——只保留禁发提示）：
                广播 = 全员公告/活动触达；个性化业务事件（某人审批结果）由系统自动通知按人推送，不进广播 */}
            <div className="admin-broadcast-boundary">
              <strong>禁发内容</strong>
              <p>投资建议 / 收益承诺 · 募资话术 · 个性化业务事件（某人的审批结果）· 敏感内部信息</p>
            </div>
            {formError && <p className="form-error">{formError}</p>}
          </div>
          <div className="admin-drawer-actions">
            <button className="btn btn-md btn-secondary" onClick={closeDrawer}>取消</button>
            <button className="btn btn-md btn-primary" onClick={requestSend}><Send size={14} /> 发送通知</button>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
