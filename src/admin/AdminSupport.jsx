import { useState, useEffect, useRef } from 'react';
import { Search, X, Send, MessageCircle, CheckCheck } from 'lucide-react';
import { getStaffTickets, sendStaffReply, closeSupportTicket, isTicketPendingReply } from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 客户消息（2026-08-24 · 在线客服双端闭环）：客服工作台，承接 APP「在线客服」转人工的 1v1 会话。
// 与「通知触达」互补成对：broadcast = 平台主动群发；本页 = 投资人发起的响应式双向咨询。
// 两级服务模型：APP 端智能助手（status:'bot'）不进本队列，「转人工」后 status:'open' 才可见。
// badge 口径 = "球在客服这边"（最后一条来自投资人的 open 会话）；回复后球交还投资人。
// 详情 URL 化 #admin/messages/{id}（ADMIN_DESIGN_SYSTEM §六 D1）；5s 轮询同步 APP 端新消息
// （对齐通知触达定时广播轮询先例；接后端由 WebSocket 推送替换）。

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '进行中' },
  { key: 'closed', label: '已关闭' },
];

const PAGE_SIZE = 10;

function fmtDate(s) { return (s || '').slice(5, 16); }

export default function AdminSupport({ admin, detailId, navigate }) {
  const [tickets, setTickets] = useState(() => getStaffTickets());
  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 回复输入独立 state（轮询只刷新列表/气泡流，不动输入框——防打字内容被冲掉）
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [opMsg, setOpMsg] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const streamRef = useRef(null);

  const refresh = () => setTickets([...getStaffTickets()]);

  // 详情 URL 驱动：selected 由 URL param2 决定（对齐 SPV/分红详情抽屉惯例）
  const sel = detailId ? tickets.find(t => t.id === detailId) : null;

  // 5s 轮询：APP 端新消息 / 其他客服操作同步进来
  useEffect(() => {
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  // 抽屉打开时重置输入区
  useEffect(() => {
    setReplyText(''); setReplyError(''); setOpMsg(''); setConfirmClose(false);
  }, [detailId]);

  // 气泡流自动滚底（新消息到达时）
  useEffect(() => {
    if (sel && streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [sel?.messages.length, detailId]);

  const goList = () => { if (navigate) navigate('#admin/messages'); };

  // 会话抽屉行为（2026-08-24 a11y 补漏：此前无 Esc 关闭、无滚动锁定、无焦点管理）
  useEffect(() => {
    if (!sel) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [!!sel]);
  const drawerRef = useDrawerFocus(!!sel, goList);

  const doReply = () => {
    if (!sel) return;
    const res = sendStaffReply(sel.id, replyText, admin?.name || '');
    if (!res.ok) { setReplyError(res.error); return; }
    setReplyText(''); setReplyError(''); setOpMsg('');
    refresh();
  };

  const doClose = () => {
    if (!sel) return;
    const res = closeSupportTicket(sel.id, admin?.name || '');
    if (!res.ok) { setOpMsg(res.error); setConfirmClose(false); return; }
    refresh();
    setOpMsg('会话已关闭'); setConfirmClose(false);
  };

  // 列表筛选 + 搜索 + 分页（对齐通知触达 B4b 记录列表模式）
  const kw = keyword.trim().toLowerCase();
  const searching = kw.length > 0;
  const filtered = tickets.filter(t => {
    if (searching) {
      return (t.name || '').toLowerCase().includes(kw)
        || t.messages.some(m => m.text.toLowerCase().includes(kw));
    }
    if (filter === 'open') return t.status === 'open';
    if (filter === 'closed') return t.status === 'closed';
    return true;
  });
  // 待回复优先，其余按最近更新倒序
  filtered.sort((a, b) => (isTicketPendingReply(b) - isTicketPendingReply(a)) || (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCount = tickets.filter(isTicketPendingReply).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>客户消息</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">客服工作台 · 共 {tickets.length} 个会话{pendingCount > 0 ? ` · ${pendingCount} 个待回复` : ''}</span>
        </div>
      </div>

      <div className="admin-view-row">
        <div className="admin-filter-row">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? tickets.length : tickets.filter(t => t.status === f.key).length;
            return (
              <button key={f.key} className={`admin-filter-btn ${filter === f.key && !searching ? 'active' : ''}`} onClick={() => { setFilter(f.key); setPage(1); }}>
                {f.label} {count}
              </button>
            );
          })}
        </div>
        <input className="form-input admin-search-input" aria-label="搜索客户 / 消息内容" placeholder="搜索客户 / 消息内容" value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} />
      </div>

      {/* 会话列表（B2 记录列表 · 裸 table 无 card 包裹；列模板 admin-table--tickets） */}
      <div className="admin-table admin-table--tickets">
        <div className="admin-table-header">
          <span className="col-client">客户</span>
          <span className="col-last-msg">最新消息</span>
          <span className="col-status">状态</span>
          <span className="col-staff">接待客服</span>
          <span className="col-updated">最近更新</span>
        </div>
        {rows.length === 0 ? (
          <div className="admin-table-row"><div className="admin-table-empty">暂无客户会话（投资人转人工后将出现在这里）</div></div>
        ) : rows.map(t => {
          const last = t.messages[t.messages.length - 1];
          const pending = isTicketPendingReply(t);
          return (
            <div key={t.id} className="admin-table-row" role="button" tabIndex={0}
              onClick={() => { if (navigate) navigate(`#admin/messages/${t.id}`); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (navigate) navigate(`#admin/messages/${t.id}`); } }}>
              <span className="col-client"><strong>{t.name || t.userName || '—'}</strong></span>
              <span className="col-last-msg">
                {pending && <em className="admin-ticket-pending">待回复</em>}
                <span className="text-secondary" title={last?.text}>{last ? `${last.from === 'user' ? '' : '[客服] '}${last.text}` : '—'}</span>
              </span>
              <span className="col-status">
                <span className={`status-badge ${t.status === 'open' ? 'admin-status-approved' : 'admin-status-closed'}`}>
                  {t.status === 'open' ? '进行中' : '已关闭'}
                </span>
              </span>
              <span className="col-staff">{t.staffName || '—'}</span>
              <span className="col-updated text-secondary">{fmtDate(t.updatedAt)}</span>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹ 上一页</button>
          <span className="admin-page-info">第 {safePage}/{totalPages} 页 · 共 {filtered.length} 个</span>
          <button className="admin-page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>下一页 ›</button>
        </div>
      )}

      {/* —— 详情抽屉：对话视图 —— */}
      {sel && (
        <>
          <div className="admin-drawer-mask" onClick={goList} />
          <div className="admin-drawer admin-drawer--chat" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`客户咨询 · ${sel.name}`}>
            <div className="admin-drawer-head">
              <h3><MessageCircle size={15} /> 客户咨询 · {sel.name}</h3>
              <button className="btn-icon" onClick={goList} aria-label="关闭"><X size={16} /></button>
            </div>
            <div className="admin-chat-stream" ref={streamRef}>
              {sel.messages.map((m, i) => (
                <div key={i} className={`admin-chat-row ${m.from}`}>
                  {(m.from === 'staff' || m.from === 'bot') && (
                    <span className="admin-chat-meta">{m.from === 'bot' ? '智能助手' : (sel.staffName || '客服')} · {m.time}</span>
                  )}
                  <div className={`admin-bubble ${m.from}`}>{m.text}</div>
                  {m.from === 'user' && <span className="admin-chat-meta">{m.time}</span>}
                </div>
              ))}
            </div>
            {opMsg && <p className="form-success admin-chat-opmsg">{opMsg}</p>}
            <div className="admin-chat-input-zone">
              {sel.status === 'open' ? (
                <>
                  <textarea
                    className="form-input admin-chat-textarea"
                    rows={2}
                    placeholder={`回复 ${sel.name}…（Enter 发送，Shift+Enter 换行）`}
                    value={replyText}
                    onChange={e => { setReplyText(e.target.value); setReplyError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doReply(); } }}
                  />
                  {replyError && <p className="form-error">{replyError}</p>}
                  <div className="admin-chat-actions">
                    {!confirmClose ? (
                      <button className="btn btn-md btn-outline" onClick={() => setConfirmClose(true)}>关闭会话</button>
                    ) : (
                      <>
                        <button className="btn btn-md btn-secondary" onClick={() => setConfirmClose(false)}>取消</button>
                        <button className="btn btn-md btn-danger" onClick={doClose}>确认关闭？不可恢复</button>
                      </>
                    )}
                    <button className="btn btn-md btn-primary" onClick={doReply} disabled={!replyText.trim()}>
                      <Send size={14} /> 回复
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-muted admin-chat-closed-note"><CheckCheck size={14} /> 会话已关闭（只读）。投资人再次咨询将创建新会话。</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
