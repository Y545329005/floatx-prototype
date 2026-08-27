import { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Eye, Trash2, Save, Archive, X, PlusCircle, Trash, ImageIcon, Link2, TrendingUp, MapPin, Monitor, Calendar, UserCheck, RotateCcw, CheckCircle } from 'lucide-react';
import {
  events, projects, eventRegistrationsList,
  Storage, isEventLive, isEventOverdue, syncEventRegistered, logAudit,
  checkInRegistration, undoCheckInRegistration, formatISODateTime,
  getProjectHeroGradient, getProjectHeroEmoji,
} from '../mock/data';

const typeOptions = [
  { value: 'online', label: '线上' },
  { value: 'offline', label: '线下' },
];

// 参与方式说明 = 跟随类型的默认模板（运营可在默认基础上自定义；type 切换时同步替换）
const DEFAULT_JOIN_NOTE = {
  online: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过短信发送至您预留的手机。',
  offline: '线下 · 请于活动开始前 15 分钟凭报名手机号签到，凭预约名单入场。',
};

// 路演状态 = 时间驱动：upcoming（即将开始/进行中）→ past（已结束）。
// live（进行中）是 upcoming 的派生状态（isEventLive 按当前时刻实时计算），后台不手动设置。
const statusOptions = [
  { value: 'upcoming', label: '即将开始' },
  { value: 'past', label: '已结束' },
];

const emptyEvent = {
  id: '',
  projectId: null,
  projectName: '',
  sector: '',
  coverImage: null,
  type: 'online',
  title: '',
  date: '',
  time: '',
  timezone: 'HKT',
  description: '',
  status: 'upcoming',
  speaker: '',
  speakerBio: '',
  capacity: null,
  registered: 0,
  joinNote: DEFAULT_JOIN_NOTE.online,
  joinUrl: '',
  streamUrl: '',
  location: '',
  agenda: [],
  highlights: [],
};

export default function AdminEvents({ admin = null }) {
  const [items, setItems] = useState([...events]);
  const [filter, setFilter] = useState('all'); // events 列表状态筛选
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyEvent });
  const [detail, setDetail] = useState(null);
  const [signInEvent, setSignInEvent] = useState(null); // 线下活动签到核销抽屉
  const [errors, setErrors] = useState({});
  const [showCoverUrl, setShowCoverUrl] = useState(false); // 封面图"高级：URL 输入"折叠
  const [windowWarn, setWindowWarn] = useState(''); // 议程时间超出活动时间窗提示
  const [regRefresh, setRegRefresh] = useState(0); // 签到抽屉名单刷新
  const coverInputRef = useRef(null);
  const operator = admin?.name || admin?.username || '系统';

  const refresh = () => setItems([...events]);

  const eventFilters = [
    { value: 'all', label: '全部' },
    ...statusOptions.map(s => ({ value: s.value, label: s.label })),
  ];
  const filteredEvents = filter === 'all' ? items : items.filter(e => e.status === filter);
  const detailEvent = detail ? events.find(e => e.id === detail) : null;

  /* 抽屉打开：锁定背景滚动 + Esc 关闭（AntD Drawer 惯例） */
  const drawerOpen = showForm || detail || signInEvent;
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const drawerTitle = showForm
    ? (editingId ? '编辑路演' : '新建路演')
    : (signInEvent ? `签到核销 · ${signInEvent.title}` : (detailEvent?.title || ''));

  /* ---- 新建 / 编辑 ---- */
  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyEvent, id: `e${Date.now()}` });
    setShowCoverUrl(false);
    setErrors({});
    setWindowWarn('');
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ ...emptyEvent, ...e });
    setShowCoverUrl(false);
    setErrors({});
    setWindowWarn('');
    setShowForm(true);
  };

  const closeDrawer = () => {
    setShowForm(false);
    setEditingId(null);
    setDetail(null);
    setSignInEvent(null);
    setErrors({});
    setWindowWarn('');
  };

  /* ---- 线下活动签到核销（降级：活动执行动作，非客户发掘） ---- */
  const signInRegs = signInEvent
    ? eventRegistrationsList.filter(r => r.eventId === signInEvent.id)
    : [];
  const signInPending = signInRegs.filter(r => r.status === 'registered').length;
  const doCheckIn = (regId) => {
    checkInRegistration(regId, operator);
    setRegRefresh(x => x + 1);
  };
  const doUndoCheckIn = (regId) => {
    undoCheckInRegistration(regId);
    setRegRefresh(x => x + 1);
  };

  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* 活动时间 = 双 time 输入（开始/结束），保存时拼接 form.time = "HH:mm-HH:mm" */
  const timeParts = (form.time || '').split('-');
  const timeStart = timeParts[0] || '';
  const timeEnd = timeParts[1] || '';
  const handleTimeStart = (v) => setForm(f => {
    const e = ((f.time || '').split('-')[1] || '');
    return { ...f, time: v ? `${v}${e ? `-${e}` : ''}` : (e ? `-${e}` : '') };
  });
  const handleTimeEnd = (v) => setForm(f => {
    const s = ((f.time || '').split('-')[0] || '');
    return { ...f, time: v ? `${s ? `${s}-` : ''}${v}` : (s || '') };
  });

  // 类型切换：同步替换 joinNote 为对应默认模板（参与方式说明跟随类型强绑定）
  const handleType = (val) => setForm(f => ({ ...f, type: val, joinNote: DEFAULT_JOIN_NOTE[val] || f.joinNote }));

  const handleProject = (pid) => {
    const p = projects.find(x => x.id === pid);
    setForm(f => ({
      ...f,
      projectId: pid || null,
      projectName: p ? p.title : '',
      sector: p ? p.sector : f.sector, // 平台自办时保留已填行业
    }));
  };

  /* ---- 活动时间窗解析（"HH:mm-HH:mm" → { startMin, endMin }） ---- */
  const parseTimeWindow = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split('-');
    if (parts.length !== 2) return null;
    const [sh, sm] = parts[0].split(':').map(Number);
    const [eh, em] = parts[1].split(':').map(Number);
    if ([sh, sm, eh, em].some(Number.isNaN)) return null;
    return { startMin: sh * 60 + sm, endMin: eh * 60 + em };
  };
  const fmtMin = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

  /* ---- 议程结构化行（时间 + 主题 + 移除） ---- */
  const handleAgenda = (i, key, val) => setForm(f => ({ ...f, agenda: (f.agenda || []).map((a, idx) => (idx === i ? { ...a, [key]: val } : a)) }));
  // 智能建议：添加上一行 + 30 分钟；无上行 → 活动开始时间；超出活动结束 → 留空
  const addAgenda = () => setForm(f => {
    const win = parseTimeWindow(f.time);
    const last = (f.agenda || []).filter(a => a.time).slice(-1)[0];
    let time = '';
    if (last && last.time) {
      const [h, m] = last.time.split(':').map(Number);
      if (!Number.isNaN(h)) {
        const next = h * 60 + m + 30;
        time = win && next > win.endMin ? '' : fmtMin(next);
      }
    } else if (win) {
      time = fmtMin(win.startMin);
    }
    return { ...f, agenda: [...(f.agenda || []), { time, topic: '' }] };
  });
  const removeAgenda = (i) => setForm(f => ({ ...f, agenda: (f.agenda || []).filter((_, idx) => idx !== i) }));

  /* ---- 看点结构化行（内容 + 移除） ---- */
  const handleHighlight = (i, val) => setForm(f => ({ ...f, highlights: (f.highlights || []).map((h, idx) => (idx === i ? val : h)) }));
  const addHighlight = () => setForm(f => ({ ...f, highlights: [...(f.highlights || []), ''] }));
  const removeHighlight = (i) => setForm(f => ({ ...f, highlights: (f.highlights || []).filter((_, idx) => idx !== i) }));

  /* ---- 归档辅助信号：upcoming 但活动已结束（时间驱动，人工确认归档） ---- */
  const isOverdue = isEventOverdue(form);

  /* ---- 封面图上传（文件选择按钮 + FileReader 真实预览；mock 不传后端） ---- */
  const onCoverFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, coverImage: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = '请输入路演标题';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    // 议程时间窗校验：议程项时间须落在活动时间（HH:mm-HH:mm）范围内（超范围黄条提示，不硬拦阻断）
    const win = parseTimeWindow(form.time);
    const outOfWindow = (form.agenda || [])
      .filter(a => a.time && /^\d{2}:\d{2}$/.test(a.time))
      .filter(a => {
        const [h, m] = a.time.split(':').map(Number);
        if (!win || Number.isNaN(h)) return false;
        const min = h * 60 + m;
        return min < win.startMin || min > win.endMin;
      });
    if (outOfWindow.length > 0) {
      setWindowWarn(`有 ${outOfWindow.length} 项议程时间超出活动时间范围（${form.time}），请调整后再保存`);
      return; // 保持抽屉打开，运营修复后重存
    }
    setWindowWarn('');
    const payload = {
      ...form,
      agenda: (form.agenda || []).filter(a => a.topic && a.topic.trim()).map(a => ({ time: a.time, topic: a.topic.trim() })),
      highlights: (form.highlights || []).map(s => s.trim()).filter(Boolean),
    };
    const exists = events.some(e => e.id === editingId);
    if (!exists) {
      events.unshift({ ...payload });
    } else {
      const idx = events.findIndex(e => e.id === editingId);
      if (idx > -1) events[idx] = { ...payload };
    }
    syncEventRegistered(); // 保存后报名人数由名单派生重算（表单已不可手填）
    logAudit({ operator: admin?.name || '系统', category: 'event', action: exists ? 'update' : 'create', target: form.title, targetId: editingId || '', note: exists ? '编辑路演资料' : '新建路演' });
    Storage.save();
    refresh();
    closeDrawer();
  };

  /* ---- 删除保护：有报名记录或项目关联的路演不可删（孤儿引用） ---- */
  const canDelete = (id) => {
    const hasReg = eventRegistrationsList.some(r => r.eventId === id);
    const hasProjectRef = projects.some(p => (p.events || []).includes(id));
    return !hasReg && !hasProjectRef;
  };

  const handleDelete = (id) => {
    if (!canDelete(id)) return;
    const evt = events.find(e => e.id === id);
    if (!window.confirm(`确认删除路演「${evt?.title}」？`)) return;
    const idx = events.findIndex(e => e.id === id);
    if (idx > -1) events.splice(idx, 1);
    logAudit({ operator: admin?.name || '系统', category: 'event', action: 'delete', target: evt?.title || id, targetId: id, note: '删除路演' });
    Storage.save();
    refresh();
  };

  /* ---- 行内快捷归档：upcoming 且已过结束时间的路演一键归档为已结束（人工确认，不自动） ---- */
  const handleArchive = (id) => {
    const evt = events.find(e => e.id === id);
    if (!evt) return;
    if (!window.confirm(`活动已结束，确认将「${evt.title}」归档为「已结束」？`)) return;
    evt.status = 'past';
    logAudit({ operator: admin?.name || '系统', category: 'event', action: 'archive', target: evt.title, targetId: id, note: '归档路演为已结束' });
    Storage.save();
    refresh();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>路演管理</h1>
        <span className="text-muted admin-header-summary">共 {items.length} 条 · 报名 {eventRegistrationsList.length}</span>
        <button className="btn btn-md btn-primary" onClick={openNew}>
          <Plus size={16} /> 新建路演
        </button>
      </div>

      {/* 统一右侧抽屉：查看详情（APP 预览）/ 新建编辑（列表保持可见）；状态流转走编辑表单 */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && (
        <div className="admin-drawer" role="dialog" aria-label={drawerTitle}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">{drawerTitle}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {signInEvent ? (
              /* 线下活动签到核销（活动执行动作 · 从报名管理降级到路演管理） */
              <div className="admin-form-fields">
                <div className="card admin-form">
                  <div className="admin-detail-header">
                    <h3>报名名单 · 待签到 {signInPending}</h3>
                  </div>
                  {signInRegs.length === 0 ? (
                    <p className="admin-form-hint">该活动暂无报名记录。</p>
                  ) : (
                    <div className="admin-signin-list">
                      {signInRegs.map(r => (
                        <div key={r.id} className="admin-signin-row">
                          <div className="admin-signin-info">
                            <strong>{r.name}</strong>
                            <span className="text-muted text-sm">{r.investorNo} · {1 + (r.accompanying || 0)} 人 · {r.phone}</span>
                            {r.checkInCode && <span className="admin-signin-code date-iso">凭证码 {r.checkInCode}</span>}
                            {r.status === 'checked-in' && r.checkedInAt && (
                              <span className="admin-signin-stamp">于 {formatISODateTime(r.checkedInAt)} 由 {r.checkedInBy} 签到</span>
                            )}
                          </div>
                          {r.status === 'checked-in' ? (
                            <button className="btn btn-md btn-outline" onClick={() => doUndoCheckIn(r.id)}><RotateCcw size={14} /> 撤销</button>
                          ) : (
                            <button className="btn btn-md btn-primary" onClick={() => doCheckIn(r.id)}><CheckCircle size={14} /> 签到</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : showForm ? (
              <div className="admin-form-fields">
                {/* ===== 模块 1 · 基本信息（长文本单行独占；短字段双列） ===== */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">基本信息</div>
                  <div className="admin-form-section-body">
                    <div className="form-group">
                      <label className="form-label">关联项目</label>
                      <select className="form-input" value={form.projectId || ''} onChange={e => handleProject(e.target.value)}>
                        <option value="">不关联（平台自办）</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label"><span className="required-mark">*</span>路演标题</label>
                      <input
                        className={`form-input${errors.title ? ' field-error' : ''}`}
                        value={form.title}
                        onChange={e => handleField('title', e.target.value)}
                        placeholder="输入路演标题"
                      />
                      {errors.title && <span className="form-error">{errors.title}</span>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">类型</label>
                        <select className="form-input" value={form.type} onChange={e => handleType(e.target.value)}>
                          {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">状态</label>
                        <select className="form-input" value={form.status} onChange={e => handleField('status', e.target.value)}>
                          {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                    {isOverdue && (
                      <div className="admin-form-hint admin-form-hint-warning">活动已超时（超过设定结束时间）——若活动已结束请归档为「已结束」；若仍在进行请修改结束时间</div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">日期</label>
                        <input type="date" className="form-input" value={form.date} onChange={e => handleField('date', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">时间</label>
                        <div className="admin-time-range">
                          <input type="time" className="form-input admin-time-input" value={timeStart} onChange={e => handleTimeStart(e.target.value)} />
                          <span className="admin-time-sep">至</span>
                          <input type="time" className="form-input admin-time-input" value={timeEnd} onChange={e => handleTimeEnd(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    {!form.projectId && (
                      <div className="form-group">
                        <label className="form-label">行业</label>
                        <select className="form-input" value={form.sector} onChange={e => handleField('sector', e.target.value)}>
                          <option value="">选择行业…</option>
                          {projects.reduce((acc, p) => (p.sector && !acc.includes(p.sector) ? [...acc, p.sector] : acc), []).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== 模块 2 · 活动内容 ===== */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">活动内容</div>
                  <div className="admin-form-section-body">
                    <div className="form-group">
                      <label className="form-label">活动介绍</label>
                      <textarea className="form-input" rows={4} value={form.description} onChange={e => handleField('description', e.target.value)} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">主讲人</label>
                        <input className="form-input" value={form.speaker} onChange={e => handleField('speaker', e.target.value)} placeholder="姓名 (职位)" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">容量（线下）</label>
                        <input type="number" className="form-input" value={form.capacity || ''} onChange={e => handleField('capacity', e.target.value ? Number(e.target.value) : null)} placeholder="留空=不限" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">主讲人背景</label>
                      <textarea className="form-input" rows={2} value={form.speakerBio} onChange={e => handleField('speakerBio', e.target.value)} placeholder="从业经历、技术背景、代表成果…" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">活动议程（时间 + 主题，自动建议 + 校验活动时间窗内）</label>
                      {(form.agenda || []).map((a, i) => (
                        <div className="admin-agenda-row" key={i}>
                          <input type="time" className="form-input admin-agenda-time" value={a.time} onChange={e => handleAgenda(i, 'time', e.target.value)} />
                          <input className="form-input admin-agenda-topic" placeholder="议程主题" value={a.topic} onChange={e => handleAgenda(i, 'topic', e.target.value)} />
                          <button className="btn-icon" title="移除议程" onClick={() => removeAgenda(i)}><Trash size={15} /></button>
                        </div>
                      ))}
                      <button className="btn btn-outline admin-line-add" onClick={addAgenda}><PlusCircle size={15} /> 添加议程</button>
                      {windowWarn && <div className="admin-form-hint admin-form-hint-warning">{windowWarn}</div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">活动看点（每行一条）</label>
                      {(form.highlights || []).map((h, i) => (
                        <div className="admin-line-row" key={i}>
                          <input className="form-input admin-line-input" placeholder="活动看点" value={h} onChange={e => handleHighlight(i, e.target.value)} />
                          <button className="btn-icon" title="移除看点" onClick={() => removeHighlight(i)}><Trash size={15} /></button>
                        </div>
                      ))}
                      <button className="btn btn-outline admin-line-add" onClick={addHighlight}><PlusCircle size={15} /> 添加看点</button>
                    </div>
                  </div>
                </div>

                {/* ===== 模块 3 · 参与与容量 ===== */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">参与与容量</div>
                  <div className="admin-form-section-body">
                    {form.type === 'offline' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">线下地址</label>
                          <input className="form-input" value={form.location} onChange={e => handleField('location', e.target.value)} placeholder="详细地址（楼层）" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">在线直播链接（可选）</label>
                          <input className="form-input" value={form.streamUrl} onChange={e => handleField('streamUrl', e.target.value)} placeholder="https://…（线下活动如同步直播）" />
                        </div>
                      </>
                    )}
                    {form.type === 'online' && (
                      <div className="form-group">
                        <label className="form-label">会议链接（报名后可见）</label>
                        <input className="form-input" value={form.joinUrl} onChange={e => handleField('joinUrl', e.target.value)} placeholder="https://…（线上会议链接）" />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">参与方式说明</label>
                      <textarea className="form-input" rows={2} value={form.joinNote} onChange={e => handleField('joinNote', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">已报名人数</label>
                      <div className="admin-form-hint">报名人数由报名名单自动统计（名单派生），在「报名管理」页签到核验，不可手动修改</div>
                    </div>
                  </div>
                </div>

                {/* ===== 模块 4 · 内容素材 ===== */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">内容素材</div>
                  <div className="admin-form-section-body">
                    <div className="form-group">
                      <label className="form-label">封面图</label>
                      <div className="admin-upload-row">
                        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />
                        {form.coverImage ? (
                          <div className="admin-cover-preview" style={{ backgroundImage: `url(${form.coverImage})` }} />
                        ) : (
                          <div className="admin-cover-placeholder">无封面</div>
                        )}
                        <div className="admin-upload-actions">
                          <button className="btn btn-outline" onClick={() => coverInputRef.current && coverInputRef.current.click()}><ImageIcon size={15} /> 选择图片</button>
                          {form.coverImage && <button className="btn btn-outline" onClick={() => handleField('coverImage', null)}>清除</button>}
                          <button className="admin-link-btn" onClick={() => setShowCoverUrl(v => !v)}><Link2 size={13} /> {showCoverUrl ? '收起' : '高级：图片 URL'}</button>
                        </div>
                      </div>
                      {showCoverUrl && (
                        <input
                          className="form-input admin-cover-url-input"
                          value={form.coverImage && form.coverImage.startsWith('data:') ? '' : (form.coverImage || '')}
                          onChange={e => handleField('coverImage', e.target.value)}
                          placeholder="https://…（留空=前端渐变占位）"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : detailEvent ? (
              /* 查看 = APP 移动端卡片流预览（用户侧只有 APP，运营所见即用户所得）；状态流转走编辑表单 status select */
              <div className="admin-app-preview">
                <div className="project-detail-hero" style={{ background: getProjectHeroGradient(detailEvent.sector) }}>
                  {detailEvent.coverImage ? (
                    <img src={detailEvent.coverImage} alt={detailEvent.title} className="detail-hero-img" />
                  ) : (
                    <span className="project-detail-hero-icon">{getProjectHeroEmoji(detailEvent.sector)}</span>
                  )}
                  <div className="project-detail-hero-tags">
                    <span className="tag tag-outline tag-on-hero">{detailEvent.type === 'online' ? '线上会议' : '线下活动'}</span>
                    {detailEvent.sector && <span className="tag tag-outline tag-on-hero">{detailEvent.sector}</span>}
                  </div>
                  <div className="project-detail-hero-company">{detailEvent.projectName || '平台自办'}</div>
                </div>

                <div className="card card-accent">
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">日期</span><span className="detail-stat-value">{detailEvent.date || '—'}</span></div>
                    <div className="detail-stat"><span className="detail-stat-label">时间</span><span className="detail-stat-value">{detailEvent.time || '—'}</span></div>
                  </div>
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">报名</span><span className="detail-stat-value">{detailEvent.registered}{detailEvent.capacity != null ? `/${detailEvent.capacity}` : ' 人'}</span></div>
                    <div className="detail-stat"><span className="detail-stat-label">状态</span><span className="detail-stat-value">{detailEvent.status === 'past' ? '已结束' : isEventLive(detailEvent) ? '进行中' : '即将开始'}</span></div>
                  </div>
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">参与方式</span><span className="detail-stat-value text-sm">{detailEvent.type === 'online' ? '线上会议' : detailEvent.location || '线下活动'}</span></div>
                  </div>
                  {detailEvent.type === 'online' && detailEvent.joinUrl && (
                    <div className="detail-stat-row">
                      <div className="detail-stat"><span className="detail-stat-label">会议链接</span><span className="detail-stat-value text-sm">{detailEvent.joinUrl}</span></div>
                    </div>
                  )}
                  {detailEvent.type === 'offline' && detailEvent.streamUrl && (
                    <div className="detail-stat-row">
                      <div className="detail-stat"><span className="detail-stat-label">在线直播</span><span className="detail-stat-value text-sm">{detailEvent.streamUrl}</span></div>
                    </div>
                  )}
                </div>

                {detailEvent.joinNote && (
                  <div className="event-join-note">
                    {detailEvent.type === 'online' ? <Monitor size={14} /> : <MapPin size={14} />}
                    <span>{detailEvent.joinNote}</span>
                  </div>
                )}

                {detailEvent.description && (
                  <div className="card card-secondary">
                    <div className="card-title">活动介绍</div>
                    <p className="text-body">{detailEvent.description}</p>
                  </div>
                )}

                {detailEvent.agenda && detailEvent.agenda.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">活动议程</div>
                    <div className="agenda-list">
                      {detailEvent.agenda.map((a, i) => (
                        <div key={i} className="agenda-item">
                          <span className="agenda-time">{a.time}</span>
                          <span className="agenda-topic">{a.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailEvent.highlights && detailEvent.highlights.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">活动看点</div>
                    <ul className="highlight-list">
                      {detailEvent.highlights.map((h, i) => (
                        <li key={i} className="highlight-item">
                          <TrendingUp size={16} className="highlight-icon" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailEvent.speaker && (
                  <div className="card card-secondary">
                    <div className="card-title">主讲人</div>
                    <div className="speaker-card">
                      <div className="speaker-avatar">{detailEvent.speaker[0]}</div>
                      <div className="speaker-info">
                        <strong>{detailEvent.speaker}</strong>
                        {detailEvent.speakerBio && <p className="text-muted text-sm">{detailEvent.speakerBio}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {detailEvent.projectId && (() => {
                  const proj = projects.find(x => x.id === detailEvent.projectId);
                  return proj ? (
                    <div className="card card-secondary">
                      <div className="card-title">关联项目</div>
                      <div className="related-event">
                        <Calendar size={16} />
                        <div><span>{proj.title}</span></div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : null}
          </div>
          {/* 操作区仅编辑表单需要（预览 = 纯只读，关闭走头部 X，不重复底部按钮） */}
          {showForm && (
            <div className="admin-drawer-actions">
              <button className="btn btn-md btn-secondary" onClick={closeDrawer}>取消</button>
              <button className="btn btn-md btn-primary" onClick={handleSave}><Save size={15} /> 保存</button>
            </div>
          )}
        </div>
      )}

      <div className="admin-filter-row">
        {eventFilters.map(f => (
          <button
            key={f.value}
            className={`admin-filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="admin-table admin-table--events">
        <div className="admin-table-header">
          <span className="col-name">路演标题</span>
          <span className="col-project">关联项目</span>
          <span className="col-date">日期</span>
          <span className="col-type">类型</span>
          <span className="col-registration">报名情况</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
            {filteredEvents.map(e => (
              <div key={e.id} className="admin-table-row">
                <span className="col-name">
                  <span className="col-name-title">
                    <strong title={e.title}>{e.title}</strong>
                    {isEventOverdue(e) && <span className="admin-overdue-tag">已超时</span>}
                  </span>
                </span>
                <span className="col-project">{e.projectName || '平台自办'}</span>
                <span className="col-date">{e.date}</span>
                <span className="col-type">{e.type === 'online' ? '线上' : '线下'}</span>
                <span className="col-registration">{e.registered}/{e.capacity || '不限'}</span>
                <span className="col-status">
                  {(() => {
                    const live = isEventLive(e);
                    const badge = e.status === 'past' ? 'admin-status-closed' : live ? 'admin-status-live' : 'admin-status-upcoming';
                    const label = e.status === 'past' ? '已结束' : live ? '进行中' : '即将开始';
                    // 超时（超过设定结束时间）= 待运营二选一（归档/改时间），由操作列橙色归档按钮承载，状态列不叠加文字标记
                    return <span className={`status-badge ${badge}`}>{label}</span>;
                  })()}
                </span>
                <span className="col-actions">
                  <button className="btn-icon" title="查看" onClick={() => setDetail(e.id)}><Eye size={16} /></button>
                  <button className="btn-icon" title="编辑" onClick={() => openEdit(e)}><Edit3 size={16} /></button>
                  {/* 删除按钮按需展示：仅可删（无报名记录/项目关联）时渲染，避免常态不可删的灰色占位（2026-08-12） */}
                  {canDelete(e.id) && (
                    <button className="btn-icon" title="删除" onClick={() => handleDelete(e.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  {isEventOverdue(e) && (
                    <button className="btn-icon admin-archive-btn" title="活动已结束，归档为已结束" onClick={() => handleArchive(e.id)}>
                      <Archive size={16} />
                    </button>
                  )}
                  {e.type === 'offline' && e.status === 'upcoming' && (
                    <button className="btn-icon" title="现场签到核销" onClick={() => { setSignInEvent(e); }}>
                      <UserCheck size={16} />
                    </button>
                  )}
                </span>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的路演</span></div>
            )}
          </div>
    </div>
  );
}
