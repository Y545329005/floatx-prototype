import { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Eye, Trash2, Save, X, PlusCircle, Trash, ImageIcon, FileUp, Link2, TrendingUp, Calendar, FileText } from 'lucide-react';
import { projects, events, subscriptions, getProjectById, projectStatusLabels, sectors, Storage, formatCurrency, getCurrencySymbol, getProjectHeroGradient, getProjectHeroEmoji, getProjectStageSlug, logAudit } from '../mock/data';

const emptyProject = {
  id: '',
  coverImage: null,
  title: '',
  company: '',
  stage: 'B轮',
  sector: sectors[0],
  location: '香港',
  valuation: 0,
  status: 'upcoming',
  currency: 'HKD',
  riskLevel: '中风险',
  ipoPlan: '',
  roundNote: '',
  intentDeadline: '',
  allocationRule: 'pro-rata',
  waitlist: [],
  investorCount: 0,
  recentInvestors: [],
  tags: [],
  highlights: [],
  description: '',
  documents: [],
  events: [],
  team: [],
  financials: { revenue: 0, burnRate: 0, grossMargin: '' },
};

const statusOptions = ['upcoming', 'raising', 'closed', 'sold'];
const stageOptions = ['B轮', 'C轮', 'C+轮', 'Pre-IPO轮'];
const riskOptions = ['低风险', '中风险', '中高风险', '高风险'];
const currencyOptions = ['HKD', 'USD', 'CNY'];
const ruleOptions = [
  { value: 'pro-rata', label: '按比例分配（内部）' },
  { value: 'large-first', label: '大额优先（内部）' },
];

export default function AdminProjects({ admin = null }) {
  const [items, setItems] = useState([...projects]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ ...emptyProject });
  const [highlightsText, setHighlightsText] = useState('');
  const [errors, setErrors] = useState({});
  const [showCoverUrl, setShowCoverUrl] = useState(false); // 封面图"高级：URL 输入"折叠
  const coverInputRef = useRef(null);
  const docInputRef = useRef(null);

  const refresh = () => setItems([...projects]);

  const statusFilters = [
    { value: 'all', label: '全部' },
    ...statusOptions.map(s => ({ value: s, label: projectStatusLabels[s] })),
  ];
  const filteredItems = filter === 'all' ? items : items.filter(p => p.status === filter);

  /* 抽屉打开：锁定背景滚动 + Esc 关闭（AntD Drawer 惯例） */
  const drawerOpen = showForm || detail;
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

  /* ---- 新建 / 编辑 ---- */
  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyProject, id: `p${Date.now()}`, events: [], team: [] });
    setHighlightsText('');
    setShowCoverUrl(false);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      ...emptyProject,
      ...p,
      currency: p.currency || 'HKD',
      financials: { ...emptyProject.financials, ...(p.financials || {}) },
      events: p.events || [],
      team: p.team || [],
    });
    setHighlightsText((p.highlights || []).join('\n'));
    setShowCoverUrl(false);
    setErrors({});
    setShowForm(true);
  };

  const closeDrawer = () => {
    setShowForm(false);
    setEditingId(null);
    setDetail(null);
    setErrors({});
  };

  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const handleFin = (key, val) => setForm(f => ({ ...f, financials: { ...f.financials, [key]: val } }));

  const handleTeam = (i, key, val) => setForm(f => ({ ...f, team: (f.team || []).map((m, idx) => (idx === i ? { ...m, [key]: val } : m)) }));
  const addTeam = () => setForm(f => ({ ...f, team: [...(f.team || []), { name: '', role: '', bg: '' }] }));
  const removeTeam = (i) => setForm(f => ({ ...f, team: (f.team || []).filter((_, idx) => idx !== i) }));

  const toggleEvent = (id) => {
    setForm(f => {
      const cur = f.events || [];
      return { ...f, events: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
    });
  };

  const removeDoc = (i) => {
    setForm(f => ({ ...f, documents: (f.documents || []).filter((_, idx) => idx !== i) }));
  };

  /* ---- 上传交互（文件选择按钮；mock 无后端：封面 FileReader 真实预览，文档存文件名占位 URL） ---- */
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
  const onDocFile = (e) => {
    const files = e.target.files || [];
    const added = [...files].map(f => ({ name: f.name, url: '#' }));
    if (added.length > 0) setForm(f => ({ ...f, documents: [...(f.documents || []), ...added] }));
    e.target.value = '';
  };
  const removeEvent = (id) => setForm(f => ({ ...f, events: (f.events || []).filter(x => x !== id) }));

  /* 意向截止已过（raising 且日期已过期）：后台列表/表单黄色提示，辅助运营决策关闭申购（不自动切换） */
  const deadlinePassed = form.status === 'raising' && !!form.intentDeadline && new Date(form.intentDeadline) < new Date();

  const handleSave = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = '请输入项目名称';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const payload = {
      ...form,
      highlights: highlightsText.split('\n').map(s => s.trim()).filter(Boolean),
      events: form.events || [],
      documents: form.documents || [],
      team: form.team || [],
    };
    const isNew = !getProjectById(editingId);
    if (isNew) {
      projects.unshift({ ...payload });
    } else {
      const idx = projects.findIndex(p => p.id === editingId);
      if (idx > -1) projects[idx] = { ...payload };
    }
    logAudit({ operator: admin?.name || '系统', category: 'project', action: isNew ? 'create' : 'update', target: form.title, targetId: editingId || '', note: isNew ? '新建项目' : '编辑项目资料' });
    Storage.save();
    refresh();
    closeDrawer();
  };

  /* ---- 删除保护：有申购记录或关联路演的项目不可删（孤儿引用） ---- */
  const canDelete = (id) => {
    const hasSub = subscriptions.some(s => s.projectId === id);
    const hasEvent = events.some(e => e.projectId === id);
    return !hasSub && !hasEvent;
  };

  const handleDelete = (id) => {
    if (!canDelete(id)) return;
    const proj = projects.find(p => p.id === id);
    if (!window.confirm(`确认删除项目「${proj?.title}」？`)) return;
    const idx = projects.findIndex(p => p.id === id);
    if (idx > -1) projects.splice(idx, 1);
    logAudit({ operator: admin?.name || '系统', category: 'project', action: 'delete', target: proj?.title || id, targetId: id, note: '删除项目' });
    Storage.save();
    refresh();
  };

  const detailProject = detail ? getProjectById(detail) : null;
  const drawerTitle = showForm
    ? (editingId ? '编辑项目' : '新建项目')
    : (detailProject?.title || '');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>项目管理</h1>
        <span className="text-muted admin-header-summary">共 {items.length} 条 · 申购开放 {items.filter(p => p.status === 'raising').length}</span>
        <button className="btn btn-md btn-primary" onClick={openNew}>
          <Plus size={16} /> 新建项目
        </button>
      </div>

      {/* 统一右侧抽屉：查看详情 / 状态流转 / 新建编辑（交互与编辑抽屉一致，列表保持可见） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && (
        <div className="admin-drawer" role="dialog" aria-label={drawerTitle}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">{drawerTitle}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {showForm ? (
              <div className="admin-form-fields">
              {/* ===== 模块 1 · 基本信息（长文本单行独占；短字段双列） ===== */}
              <div className="admin-form-section">
                <div className="admin-form-section-title">基本信息</div>
                <div className="admin-form-section-body">
                  <div className="form-group">
                    <label className="form-label"><span className="required-mark">*</span>项目名称</label>
                    <input className={`form-input${errors.title ? ' field-error' : ''}`} value={form.title} onChange={e => handleField('title', e.target.value)} placeholder="输入项目名称" />
                    {errors.title && <span className="form-error">{errors.title}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">公司名称</label>
                    <input className="form-input" value={form.company} onChange={e => handleField('company', e.target.value)} placeholder="输入公司注册名" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">阶段</label>
                      <select className="form-input" value={form.stage} onChange={e => handleField('stage', e.target.value)}>
                        {stageOptions.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">行业</label>
                      <select className="form-input" value={form.sector} onChange={e => handleField('sector', e.target.value)}>
                        {sectors.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">所在地</label>
                      <input className="form-input" value={form.location} onChange={e => handleField('location', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">币种</label>
                      <select className="form-input" value={form.currency} onChange={e => handleField('currency', e.target.value)}>
                        {currencyOptions.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== 模块 2 · 估值与状态 ===== */}
              <div className="admin-form-section">
                <div className="admin-form-section-title">估值与状态</div>
                <div className="admin-form-section-body">
                  {deadlinePassed && (
                    <div className="admin-form-hint admin-form-hint-warning">已过意向截止日期，建议关闭申购（状态不自动切换，由运营确认后人工流转）</div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">估值</label>
                      <div className="input-affix">
                        <span className="input-affix-prefix">{getCurrencySymbol(form.currency)}</span>
                        <input type="number" value={form.valuation} onChange={e => handleField('valuation', Number(e.target.value) || 0)} placeholder="按最新融资轮估值" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">风险等级<span className="admin-field-tag">内部</span></label>
                      <select className="form-input" value={form.riskLevel} onChange={e => handleField('riskLevel', e.target.value)}>
                        {riskOptions.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">分配规则<span className="admin-field-tag">内部</span></label>
                      <select className="form-input" value={form.allocationRule} onChange={e => handleField('allocationRule', e.target.value)}>
                        {ruleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">状态</label>
                      <select className="form-input" value={form.status} onChange={e => handleField('status', e.target.value)}>
                        {statusOptions.map(s => <option key={s} value={s}>{projectStatusLabels[s]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">意向截止日期</label>
                    <input type="date" className="form-input" value={form.intentDeadline} onChange={e => handleField('intentDeadline', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">上市计划</label>
                    <input className="form-input" value={form.ipoPlan} onChange={e => handleField('ipoPlan', e.target.value)} placeholder="简述上市计划（目标市场 / 预计时间）" />
                  </div>
                </div>
              </div>

              {/* ===== 模块 3 · 内容素材 ===== */}
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
                  <div className="form-group">
                    <label className="form-label">本轮情况说明</label>
                    <textarea className="form-input" rows={3} value={form.roundNote} onChange={e => handleField('roundNote', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">项目介绍</label>
                    <textarea className="form-input" rows={4} value={form.description} onChange={e => handleField('description', e.target.value)} placeholder="公司简介、技术路线、融资用途……（详情页核心内容区）" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">项目亮点（每行一条）</label>
                    <textarea className="form-input" rows={4} value={highlightsText} onChange={e => setHighlightsText(e.target.value)} placeholder={'每行一条，输入项目亮点'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">团队</label>
                    {(form.team || []).map((m, i) => (
                      <div className="admin-team-row" key={i}>
                        <input className="form-input admin-team-name" placeholder="姓名" value={m.name} onChange={e => handleTeam(i, 'name', e.target.value)} />
                        <input className="form-input admin-team-role" placeholder="职位" value={m.role} onChange={e => handleTeam(i, 'role', e.target.value)} />
                        <input className="form-input admin-team-bg" placeholder="背景" value={m.bg} onChange={e => handleTeam(i, 'bg', e.target.value)} />
                        <button className="btn-icon" title="移除成员" onClick={() => removeTeam(i)}><Trash size={15} /></button>
                      </div>
                    ))}
                    <button className="btn btn-outline admin-team-add" onClick={addTeam}><PlusCircle size={15} /> 添加成员</button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">披露文档</label>
                    <div className="admin-upload-row">
                      <input ref={docInputRef} type="file" multiple style={{ display: 'none' }} onChange={onDocFile} />
                      <button className="btn btn-outline" onClick={() => docInputRef.current && docInputRef.current.click()}><FileUp size={15} /> 选择文件</button>
                      <span className="text-muted text-sm">支持多选 · mock 阶段不真实上传</span>
                    </div>
                    {(form.documents || []).length > 0 && (
                      <div className="admin-doc-list">
                        {form.documents.map((d, i) => (
                          <div className="admin-doc-row" key={`${d.name}-${i}`}>
                            <span>{d.name}</span>
                            <button className="btn-icon" title="移除" onClick={() => removeDoc(i)}><Trash size={15} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">关联路演</label>
                    <select className="form-input" value="" onChange={e => { if (e.target.value) toggleEvent(e.target.value); }}>
                      <option value="">选择路演…（可多选）</option>
                      {events.filter(ev => !(form.events || []).includes(ev.id)).map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                    {(form.events || []).length > 0 && (
                      <div className="admin-tag-list">
                        {form.events.map(id => {
                          const ev = events.find(x => x.id === id);
                          return ev ? (
                            <span className="admin-tag-chip" key={id}>
                              <span>{ev.title}</span>
                              <button className="admin-tag-remove" title="移除关联" onClick={() => removeEvent(id)}>×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== 模块 4 · 财务概览 ===== */}
              <div className="admin-form-section">
                <div className="admin-form-section-title">财务概览</div>
                <div className="admin-form-section-body">
                  <div className="form-row admin-fin-row">
                    <div className="form-group">
                      <label className="form-label">营收（年）</label>
                      <div className="input-affix">
                        <span className="input-affix-prefix">{getCurrencySymbol(form.currency)}</span>
                        <input type="number" value={form.financials.revenue} onChange={e => handleFin('revenue', Number(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">月烧钱率</label>
                      <div className="input-affix">
                        <span className="input-affix-prefix">{getCurrencySymbol(form.currency)}</span>
                        <input type="number" value={form.financials.burnRate} onChange={e => handleFin('burnRate', Number(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">毛利率</label>
                      <div className="input-affix">
                        <input type="number" value={form.financials.grossMargin ? form.financials.grossMargin.replace('%', '') : ''} onChange={e => handleFin('grossMargin', e.target.value === '' ? '' : `${Number(e.target.value) || 0}%`)} />
                        <span className="input-affix-suffix">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : detailProject ? (
              /* 查看 = APP 移动端卡片流预览（用户侧只有 APP，运营所见即用户所得）；状态流转走编辑表单 status select */
              <div className="admin-app-preview">
                <div className="project-detail-hero" style={{ background: getProjectHeroGradient(detailProject.sector) }}>
                  {detailProject.coverImage ? (
                    <img src={detailProject.coverImage} alt={detailProject.title} className="detail-hero-img" />
                  ) : (
                    <span className="project-detail-hero-icon">{getProjectHeroEmoji(detailProject.sector)}</span>
                  )}
                  <div className="project-detail-hero-tags">
                    <span className={`tag tag-stage-${getProjectStageSlug(detailProject.stage)}`}>{detailProject.stage}</span>
                    <span className="tag tag-outline tag-on-hero">{detailProject.sector}</span>
                  </div>
                  <div className="project-detail-hero-company">{detailProject.company}</div>
                </div>

                <div className="card card-accent">
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">总部</span><span className="detail-stat-value">{detailProject.location}</span></div>
                    <div className="detail-stat"><span className="detail-stat-label">融资阶段</span><span className="detail-stat-value">{detailProject.stage}</span></div>
                  </div>
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">估值</span><span className="detail-stat-value text-sm">{getCurrencySymbol(detailProject.currency)} {formatCurrency(detailProject.valuation)}</span></div>
                    <div className="detail-stat"><span className="detail-stat-label">意向人数</span><span className="detail-stat-value">{detailProject.investorCount || 0} 人</span></div>
                  </div>
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">上市计划</span><span className="detail-stat-value text-sm">{detailProject.ipoPlan || '—'}</span></div>
                  </div>
                  <div className="detail-stat-row">
                    <div className="detail-stat"><span className="detail-stat-label">意向收集截止</span><span className="detail-stat-value">{detailProject.intentDeadline || '以平台沟通为准'}</span></div>
                  </div>
                </div>

                <div className="card card-secondary">
                  <div className="card-title">本轮情况</div>
                  <div className="round-note"><p className="round-note-text">{detailProject.roundNote || '—'}</p></div>
                </div>

                {detailProject.highlights && detailProject.highlights.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">项目亮点</div>
                    <ul className="highlight-list">
                      {detailProject.highlights.map((h, i) => (
                        <li key={i} className="highlight-item">
                          <TrendingUp size={16} className="highlight-icon" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailProject.description && (
                  <div className="card card-secondary">
                    <div className="card-title">项目简介</div>
                    <p className="text-body">{detailProject.description}</p>
                  </div>
                )}

                {(detailProject.financials?.revenue !== undefined || detailProject.financials?.burnRate !== undefined || detailProject.financials?.grossMargin) && (
                  <div className="card card-secondary">
                    <div className="card-title">财务概览</div>
                    <div className="detail-stat-row">
                      <div className="detail-stat"><span className="detail-stat-label">营收</span><span className="detail-stat-value text-sm">{detailProject.financials.revenue ? `${getCurrencySymbol(detailProject.currency)} ${formatCurrency(detailProject.financials.revenue)}` : '—'}</span></div>
                      <div className="detail-stat"><span className="detail-stat-label">月净烧钱</span><span className="detail-stat-value text-sm">{detailProject.financials.burnRate !== undefined ? `${getCurrencySymbol(detailProject.currency)} ${formatCurrency(detailProject.financials.burnRate)}` : '—'}</span></div>
                    </div>
                    {detailProject.financials.grossMargin != null && (
                      <div className="detail-stat-row">
                        <div className="detail-stat"><span className="detail-stat-label">毛利率</span><span className="detail-stat-value">{detailProject.financials.grossMargin}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {detailProject.team && detailProject.team.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">核心团队</div>
                    {detailProject.team.map((m, i) => (
                      <div key={i} className="team-member">
                        <div className="team-member-avatar">{m.name[0]}</div>
                        <div className="team-member-info">
                          <strong>{m.name}</strong>
                          <span className="text-muted text-sm">{m.role}</span>
                          <p className="text-muted text-sm">{m.bg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detailProject.events && detailProject.events.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">关联路演</div>
                    {detailProject.events.map(id => {
                      const ev = events.find(x => x.id === id);
                      return ev ? (
                        <div key={id} className="related-event">
                          <Calendar size={16} />
                          <div>
                            <span>{ev.title}</span>
                            <span className="text-muted text-sm">{ev.date} {ev.time}</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {detailProject.documents && detailProject.documents.length > 0 && (
                  <div className="card card-secondary">
                    <div className="card-title">披露文档</div>
                    {detailProject.documents.map((d, i) => (
                      <div key={`${d.name}-${i}`} className="related-event">
                        <FileText size={16} />
                        <div><span>{d.name}</span></div>
                      </div>
                    ))}
                  </div>
                )}
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
        {statusFilters.map(f => (
          <button
            key={f.value}
            className={`admin-filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-table admin-table--projects">
        <div className="admin-table-header">
          <span className="col-name">项目名称</span>
          <span className="col-stage">阶段</span>
          <span className="col-sector">行业</span>
          <span className="col-amount">估值</span>
          <span className="col-count">意向人数</span>
          <span className="col-progress">意向截止</span>
          <span className="col-status">状态</span>
          <span className="col-actions">操作</span>
        </div>
        {filteredItems.map(p => (
          <div key={p.id} className="admin-table-row">
            <span className="col-name">
              <strong title={p.title}>{p.title}</strong>
              <span className="text-muted text-sm">{p.company}</span>
            </span>
            <span className="col-stage"><span className="tag admin-stage-tag">{p.stage}</span></span>
            <span className="col-sector">{p.sector}</span>
            <span className="col-amount">{p.valuation ? `${getCurrencySymbol(p.currency)} ${formatCurrency(p.valuation)}` : '—'}</span>
            <span className="col-count">{p.investorCount || 0}</span>
            <span className="col-progress">{p.intentDeadline || '—'}{p.status === 'raising' && p.intentDeadline && new Date(p.intentDeadline) < new Date() && <span className="admin-deadline-tag">已截止</span>}</span>
            <span className="col-status">
              <span className={`status-badge ${p.status === 'raising' ? 'admin-status-raising' : p.status === 'upcoming' ? 'admin-status-upcoming' : p.status === 'closed' ? 'admin-status-closed' : 'admin-status-sold'}`}>{projectStatusLabels[p.status]}</span>
            </span>
            <span className="col-actions">
              <button className="btn-icon" title="查看" onClick={() => setDetail(p.id)}><Eye size={16} /></button>
              <button className="btn-icon" title="编辑" onClick={() => openEdit(p)}><Edit3 size={16} /></button>
              {/* 删除按钮按需展示：仅可删（无申购记录/关联路演）时渲染，避免常态不可删的灰色占位（2026-08-12） */}
              {canDelete(p.id) && (
                <button className="btn-icon" title="删除" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={16} />
                </button>
              )}
            </span>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无符合条件的项目</span></div>
        )}
      </div>
    </div>
  );
}
