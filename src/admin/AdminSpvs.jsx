import { useState, useEffect } from 'react';
import { CheckCircle, Eye, Edit3, Plus, X, ExternalLink, FileText } from 'lucide-react';
import {
  spvs, getSpvCandidates, createSpv, updateSpvStatus, updateSpvProfile,
  getSpvSnapshot, getSigningEvidenceBySpv, subscriptions, maskName, formatCurrency, formatListDateTime,
} from '../mock/data';

// 生命周期状态（建档 = 设立中；有 signed 出资自动进入运作中；运营确认流转清算）
const statusMeta = {
  establishing: { label: '设立中', cls: 'admin-status-establishing' },
  operating: { label: '运作中', cls: 'admin-status-operating' },
  liquidating: { label: '清算中', cls: 'admin-status-liquidating' },
  liquidated: { label: '已清算', cls: 'admin-status-liquidated' },
};

// 下一状态流转（顺序：设立中 → 运作中 → 清算中 → 已清算）
const NEXT_STATUS = {
  establishing: { status: 'operating', actionLabel: '开始运作', desc: '确认 SPV 开始运作（已完成出资、进入投资管理）？' },
  operating: { status: 'liquidating', actionLabel: '进入清算', desc: '确认 SPV 进入清算（份额退出 / 资产处置中）？' },
  liquidating: { status: 'liquidated', actionLabel: '完成清算', desc: '确认 SPV 已完成清算（资产分配完毕）？' },
};

const EMPTY_FORM = { projectId: '', planAmount: '', registrationNo: '', custodianBank: '', managementFee: '2%', carryRate: '20%' };

export default function AdminSpvs({ navigate, detailId, admin }) {
  const [items, setItems] = useState([...spvs]);
  const [formOpen, setFormOpen] = useState(false);        // 设立 SPV 抽屉（低频动作，state 驱动）
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [editOpen, setEditOpen] = useState(false);        // 编辑档案抽屉
  const [editTarget, setEditTarget] = useState(null);     // 被编辑的 SPV（列表操作列进入时无 URL detailId，须独立于 sel）
  const [editForm, setEditForm] = useState({});
  const [confirmNext, setConfirmNext] = useState(null);   // 状态流转确认视图
  const [transferForm, setTransferForm] = useState({ transferEvidence: '', transferRef: '' }); // 公对公划款留痕（2026-08-19 会议纪要增量）

  const operator = admin?.name || '运营后台';
  const candidates = getSpvCandidates();

  // 详情 URL 化：selected 由 URL param2 驱动（#admin/spvs/{id}）
  const selected = detailId || null;
  const refresh = () => setItems([...spvs]);
  const sel = selected ? items.find(s => s.id === selected) : null;
  const drawerOpen = !!selected || formOpen || editOpen;
  const goList = () => { if (navigate) navigate('#admin/spvs'); };

  // 统一抽屉行为：滚动锁定 + Esc 关闭
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const closeAll = () => { setFormOpen(false); setEditOpen(false); setEditTarget(null); setConfirmNext(null); setTransferForm({ transferEvidence: '', transferRef: '' }); setFormError(''); goList(); };

  const handleCreate = () => {
    const cand = candidates.find(c => c.projectId === form.projectId);
    if (!cand) { setFormError('请选择已确定投资的项目'); return; }
    // 计划募集金额（2026-08-21）：设立时确定本轮盘子，认缴进度/超募判断的锚点（金额口径）
    const plan = Number(form.planAmount);
    if (!form.planAmount.trim() || !plan || plan <= 0) { setFormError('请填写计划募集金额（本轮盘子规模）'); return; }
    const res = createSpv({
      projectId: cand.projectId,
      projectName: cand.projectName,
      spvName: cand.spvName,
      planAmount: plan,
      registrationNo: form.registrationNo.trim(),
      custodianBank: form.custodianBank.trim(),
      managementFee: form.managementFee.trim(),
      carryRate: form.carryRate.trim(),
    }, operator);
    if (!res.ok) { setFormError(res.error); return; }
    setFormOpen(false);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    refresh();
    if (navigate) navigate(`#admin/spvs/${res.id}`);
  };

  const openEdit = (spv) => {
    setEditTarget(spv);
    setEditForm({
      registrationNo: spv.registrationNo || '',
      establishmentDate: spv.establishmentDate || '',
      custodianBank: spv.custodianBank || '',
      managementFee: spv.managementFee || '2%',
      carryRate: spv.carryRate || '20%',
      // 协议引用（2026-09-15 · APP 内电子签署：Admin 维护该 SPV 用哪份协议文档（平台存档）+ 版本 + 哈希，签署时固化）
      agreementDocUrl: spv.agreementDocUrl || '',
      agreementVersion: spv.agreementVersion || '',
      agreementHash: spv.agreementHash || '',
    });
    setEditOpen(true);
    setConfirmNext(null);   // 进入编辑抽屉时重置状态流转确认视图
    setTransferForm({ transferEvidence: '', transferRef: '' });
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    updateSpvProfile(editTarget.id, editForm, operator);
    setEditOpen(false);
    setEditTarget(null);
    refresh();
  };

  const handleConfirmNext = () => {
    if (!confirmNext) return;
    // 流转到「运作中」携带公对公划款留痕（流水单 + 参考号）
    const opts = confirmNext.status === 'operating' ? { ...transferForm } : {};
    updateSpvStatus(confirmNext.id, confirmNext.status, opts, operator);
    setConfirmNext(null);
    setTransferForm({ transferEvidence: '', transferRef: '' });
    refresh();
  };

  // 详情聚合（复用既有数据派生）
  const snap = sel ? getSpvSnapshot(sel) : null;
  const signedSubs = sel ? subscriptions.filter(s => s.projectId === sel.projectId && s.status === 'signed') : [];
  // 认缴进度（2026-08-21）：已认缴 = signed 出资合计；在途 = allocated 冻结中（尚未签署）；锚点 = 设立时确定的 planAmount
  const pendingAmount = sel ? subscriptions
    .filter(s => s.projectId === sel.projectId && s.status === 'allocated')
    .reduce((sum, s) => sum + (s.frozenAmount || 0), 0) : 0;
  const raisePct = sel?.planAmount ? (snap.totalRaised / sel.planAmount) * 100 : null;
  const evList = sel ? getSigningEvidenceBySpv(sel.id) : []; // 签署证据台账（2026-09-15 · APP 内电子签署 · 合规留痕）
  const editNext = editTarget ? NEXT_STATUS[editTarget.status] : null;

  // 编辑抽屉 body（默认表单 / 状态流转确认视图） — 抽取函数避免嵌套三元
  const renderEditBody = () => {
    if (confirmNext) {
      return (
        <div className="admin-reject-form">
          <p className="text-muted text-sm">{confirmNext.desc}</p>
          <p className="text-muted text-sm admin-confirm-delta">
            状态：{statusMeta[editTarget.status].label} → {statusMeta[confirmNext.status].label}
          </p>
          {/* 公对公划款留痕（2026-08-19 会议纪要增量）：财务线下网银转账至 SPV 账户 → 手动上传流水单到系统留痕 */}
          {confirmNext.status === 'operating' && (
            <div className="card kyc-review-block admin-fund-card" style={{ marginTop: 12 }}>
              <div className="card-title">公对公划款留痕</div>
              <div className="form-group">
                <label className="form-label">划款流水单（网银转账凭证）</label>
                <input
                  className="form-input"
                  placeholder="如 DBS 公对公划款流水单_20260819.pdf"
                  value={transferForm.transferEvidence}
                  onChange={e => setTransferForm(f => ({ ...f, transferEvidence: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">银行划款参考号（可选）</label>
                <input
                  className="form-input date-iso"
                  placeholder="网银转账回执号"
                  value={transferForm.transferRef}
                  onChange={e => setTransferForm(f => ({ ...f, transferRef: e.target.value }))}
                />
              </div>
              <p className="admin-form-hint">平台对公账户 → SPV 账户的公对公划款流水单，纳入 SPV 档案与审计留痕。</p>
            </div>
          )}
        </div>
      );
    }
    return (
      <>
        {/* 归档字段表单 */}
        <div className="card kyc-review-block admin-fund-card">
          <div className="card-title">归档字段</div>
          <div className="form-group">
            <label className="form-label">LPF 注册号</label>
            <input className="form-input" value={editForm.registrationNo} onChange={e => setEditForm(f => ({ ...f, registrationNo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">设立日期</label>
            <input type="date" className="form-input" value={editForm.establishmentDate} onChange={e => setEditForm(f => ({ ...f, establishmentDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">托管行</label>
            <input className="form-input" value={editForm.custodianBank} onChange={e => setEditForm(f => ({ ...f, custodianBank: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">管理费率（年）</label>
              <input className="form-input" value={editForm.managementFee} onChange={e => setEditForm(f => ({ ...f, managementFee: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Carry（盈利分成）</label>
              <input className="form-input" value={editForm.carryRate} onChange={e => setEditForm(f => ({ ...f, carryRate: e.target.value }))} />
            </div>
          </div>
          {/* 协议引用（2026-09-15 · APP 内电子签署）：维护"该 SPV 用哪份协议"（平台存档文档 + 版本 + 哈希），用户 APP 内签署时版本/哈希固化 */}
          <div className="form-group">
            <label className="form-label">SPV 协议文档链接</label>
            <input className="form-input" placeholder="https://…/spv-agreement.html（平台存档协议文档）" value={editForm.agreementDocUrl} onChange={e => setEditForm(f => ({ ...f, agreementDocUrl: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">协议版本</label>
              <input className="form-input" placeholder="如 v1.0" value={editForm.agreementVersion} onChange={e => setEditForm(f => ({ ...f, agreementVersion: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">文档哈希（sha256）</label>
              <input className="form-input date-iso" placeholder="签署时锁定版本防篡改" value={editForm.agreementHash} onChange={e => setEditForm(f => ({ ...f, agreementHash: e.target.value }))} />
            </div>
          </div>
        </div>
        {/* 生命周期动作（状态流转） */}
        <div className="card kyc-review-block admin-fund-card">
          <div className="card-title">生命周期</div>
          <div className="kyc-review-row">
            <span>当前状态</span>
            <span className={`status-badge ${statusMeta[editTarget.status].cls}`}>{statusMeta[editTarget.status].label}</span>
          </div>
          {editNext ? (
            <button className="btn btn-md btn-outline" onClick={() => setConfirmNext({ id: editTarget.id, status: editNext.status, desc: editNext.desc })}>
              <CheckCircle size={16} /> {editNext.actionLabel}
            </button>
          ) : (
            <div className="text-muted text-sm">SPV 已到达终态（已清算），无后续状态流转</div>
          )}
        </div>
      </>
    );
  };

  // 编辑抽屉 footer 两态切换（默认档案 / 状态流转确认）
  const renderEditFooter = () => {
    if (confirmNext) {
      return (
        <div className="admin-drawer-actions">
          <button className="btn btn-md btn-secondary" onClick={() => setConfirmNext(null)}>取消</button>
          <button className="btn btn-md btn-primary" onClick={handleConfirmNext}><CheckCircle size={16} /> 确认执行</button>
        </div>
      );
    }
    return (
      <div className="admin-drawer-actions">
        <button className="btn btn-md btn-secondary" onClick={closeAll}>取消</button>
        <button className="btn btn-md btn-primary" onClick={handleEditSave}>保存档案</button>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>SPV 管理</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">共 {items.length} 个 SPV · 待设立 {candidates.length}</span>
          <button className="btn btn-md btn-primary" onClick={() => { setFormOpen(true); setFormError(''); }}>
            <Plus size={16} /> 设立 SPV
          </button>
        </div>
      </div>

      {/* 全宽列表（行点击 → 弹抽屉详情） */}
      <div className="admin-table admin-table--spvs">
        <div className="admin-table-header">
          <span className="col-name">SPV</span>
          <span className="col-reg">LPF 注册号</span>
          <span className="col-status">状态</span>
          <span className="col-amount">募资总额</span>
          <span className="col-holders">持有人</span>
          <span className="col-fee">管理费率</span>
          <span className="col-actions">操作</span>
        </div>
        {items.map(s => {
          const meta = statusMeta[s.status];
          const snapRow = getSpvSnapshot(s);
          return (
            <div key={s.id} className="admin-table-row" role="button" tabIndex={0}
              onClick={() => { if (navigate) navigate(`#admin/spvs/${s.id}`); setConfirmNext(null); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (navigate) navigate(`#admin/spvs/${s.id}`); setConfirmNext(null); } }}>
              <span className="col-name">
                <strong title={s.spvName}>{s.spvName}</strong>
                <span className="text-muted text-sm">{s.projectName}</span>
              </span>
              <span className="col-reg">{s.registrationNo || '—'}</span>
              <span className="col-status"><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
              <span className="col-amount">HKD {formatCurrency(snapRow.totalRaised)}</span>
              <span className="col-holders">{snapRow.holderCount}</span>
              <span className="col-fee">{s.managementFee}</span>
              <span className="col-actions">
                <button className="btn-icon" title="查看 SPV 档案" onClick={(e) => { e.stopPropagation(); if (navigate) navigate(`#admin/spvs/${s.id}`); }}>
                  <Eye size={16} />
                </button>
                <button className="btn-icon" title="编辑档案" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                  <Edit3 size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {items.length === 0 && <div className="admin-table-row"><span className="admin-table-empty">暂无 SPV 档案</span></div>}
      </div>

      {/* 设立 SPV 抽屉（form 模式，state 驱动；候选 = 已确定投资但未建档的项目） */}
      {formOpen && <div className="admin-drawer-mask" onClick={closeAll} />}
      {formOpen && (
        <div className="admin-drawer" role="dialog" aria-label="设立 SPV">
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">设立 SPV</h3>
            <button className="btn-icon" title="关闭" onClick={closeAll}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {candidates.length === 0 ? (
              <p className="form-success">暂无待设立 SPV——所有已确定投资的项目均已建档。</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">项目（已确定投资）</label>
                  <select className="form-input" value={form.projectId} onChange={e => { setForm(f => ({ ...f, projectId: e.target.value })); setFormError(''); }}>
                    <option value="">选择项目</option>
                    {candidates.map(c => <option key={c.projectId} value={c.projectId}>{c.projectName} · {c.spvName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">计划募集金额（HKD）<span className="required-mark">*</span></label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="本轮盘子规模，如 8000000"
                    value={form.planAmount}
                    onChange={e => { setForm(f => ({ ...f, planAmount: e.target.value })); setFormError(''); }}
                  />
                  <p className="admin-form-hint">设立时确定的本轮募集规模，作为认缴进度与超募判断的锚点。</p>
                </div>
                <div className="form-group">
                  <label className="form-label">LPF 注册号</label>
                  <input className="form-input" placeholder="如 LPF-2026-000xx" value={form.registrationNo} onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">托管行</label>
                  <input className="form-input" placeholder="如 汇丰银行" value={form.custodianBank} onChange={e => setForm(f => ({ ...f, custodianBank: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">管理费率（年）</label>
                    <input className="form-input" value={form.managementFee} onChange={e => setForm(f => ({ ...f, managementFee: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Carry（盈利分成）</label>
                    <input className="form-input" value={form.carryRate} onChange={e => setForm(f => ({ ...f, carryRate: e.target.value }))} />
                  </div>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <div className="admin-form-hint">设立后状态为「设立中」；项目完成出资（签 SPV 扣款）后进入「运作中」。</div>
              </>
            )}
          </div>
          {candidates.length > 0 && (
            <div className="admin-drawer-actions">
              <button className="btn btn-md btn-secondary" onClick={closeAll}>取消</button>
              <button className="btn btn-md btn-primary" onClick={handleCreate}><Plus size={16} /> 提交设立</button>
            </div>
          )}
        </div>
      )}

      {/* 编辑档案抽屉（归档字段维护 + 生命周期流转，共担「修改」职责；editTarget 独立承载，列表操作列可进入） */}
      {editOpen && editTarget && <div className="admin-drawer-mask" onClick={closeAll} />}
      {editOpen && editTarget && (
        <div className="admin-drawer" role="dialog" aria-label={`编辑档案 · ${editTarget.spvName}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">编辑档案 · {editTarget.spvName}</h3>
            <button className="btn-icon" title="关闭" onClick={closeAll}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {renderEditBody()}
          </div>
          {renderEditFooter()}
        </div>
      )}

      {/* 详情抽屉：纯只读（4 卡信息 + 生命周期只读位置跳到编辑抽屉修改） */}
      {selected && sel && <div className="admin-drawer-mask" onClick={closeAll} />}
      {selected && sel && (
        <div className="admin-drawer" role="dialog" aria-label={`SPV · ${sel.spvName}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">{sel.spvName}</h3>
            <button className="btn-icon" title="关闭" onClick={closeAll}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">档案</div>
              <div className="kyc-review-row"><span>项目</span><strong>{sel.projectName}</strong></div>
              <div className="kyc-review-row"><span>法律实体</span><strong>{sel.legalEntity}</strong></div>
              <div className="kyc-review-row"><span>LPF 注册号</span><strong className="date-iso">{sel.registrationNo || '—'}</strong></div>
              <div className="kyc-review-row"><span>设立日期</span><strong>{sel.establishmentDate || '—'}</strong></div>
              <div className="kyc-review-row"><span>托管行</span><strong>{sel.custodianBank || '—'}</strong></div>
              <div className="kyc-review-row"><span>管理费率</span><strong>{sel.managementFee} / 年 · Carry {sel.carryRate}</strong></div>
              {/* 协议引用（当前 SPV 档案版本 vs 已签证据锁定的签署时版本——版本固化的对比锚点） */}
              <div className="kyc-review-row">
                <span>SPV 协议</span>
                <strong>
                  {sel.agreementDocUrl ? (
                    <a className="admin-sub-doc" href={sel.agreementDocUrl} target="_blank" rel="noopener noreferrer" title="打开协议文档">协议文档</a>
                  ) : '—'} · 版本 {sel.agreementVersion || '—'}
                </strong>
              </div>
              {sel.agreementHash && (
                <div className="kyc-review-row">
                  <span>文档哈希</span>
                  <strong className="date-iso admin-hash" title={sel.agreementHash}>{sel.agreementHash.slice(0, 24)}…</strong>
                </div>
              )}
            </div>
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">资金</div>
              {/* 认缴进度（2026-08-21）：锚点 = 设立时确定的计划募集金额；超 100% 显超募标识 */}
              {raisePct !== null ? (
                <div className="admin-spv-progress">
                  <div className="admin-spv-progress-head">
                    <span className="text-muted text-sm">认缴进度</span>
                    <strong className={`admin-spv-progress-pct${raisePct > 100 ? ' over' : ''}`}>
                      {Math.round(raisePct)}%{raisePct > 100 ? ` · 超募 ${Math.round(raisePct) - 100}%` : ''}
                    </strong>
                  </div>
                  <div className="admin-spv-progress-bar">
                    <div className={`admin-spv-progress-fill${raisePct > 100 ? ' over' : ''}`} style={{ width: `${Math.min(raisePct, 100)}%` }} />
                  </div>
                  <div className="admin-spv-progress-meta text-muted text-sm">
                    已认缴 HKD {formatCurrency(snap.totalRaised)} / 计划 HKD {formatCurrency(sel.planAmount)}
                    {pendingAmount > 0 && ` · 在途（待签）HKD ${formatCurrency(pendingAmount)}`}
                  </div>
                </div>
              ) : (
                <div className="kyc-review-row"><span>计划募集</span><strong className="text-muted">未设置</strong></div>
              )}
              <div className="kyc-review-row"><span>募资总额</span><strong className="admin-fund-amount">HKD {formatCurrency(snap.totalRaised)}</strong></div>
              <div className="kyc-review-row"><span>累计分红</span><strong>HKD {formatCurrency(snap.totalDividends)}</strong></div>
              <div className="kyc-review-row"><span>托管中资金</span><strong>HKD {formatCurrency(snap.totalRaised - snap.totalDividends)}</strong></div>
            </div>
            {/* 公对公划款留痕（2026-08-19 会议纪要增量）：财务线下网银公对公转账至 SPV 账户后上传流水单 */}
            {sel.transferEvidence && (
              <div className="card kyc-review-block admin-fund-card">
                <div className="card-title">公对公划款留痕</div>
                <div className="kyc-review-row"><span>划款流水单</span><strong className="date-iso"><FileText size={13} className="inline-icon" /> {sel.transferEvidence}</strong></div>
                <div className="kyc-review-row"><span>银行参考号</span><strong className="date-iso">{sel.transferRef || '—'}</strong></div>
                <div className="kyc-review-row"><span>划款时间</span><strong>{formatListDateTime(sel.transferAt)}</strong></div>
              </div>
            )}
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">份额（{signedSubs.length} 笔出资）</div>
              {signedSubs.length === 0 && <div className="kyc-review-row"><span>持有人</span><strong>—</strong></div>}
              {signedSubs.map(s => (
                <div key={s.id} className="kyc-review-row">
                  <span>{maskName(s.investorName)}</span>
                  <strong>{s.shares ? `${s.shares} 份` : '已出资'} · HKD {formatCurrency(s.amount || 0)}</strong>
                </div>
              ))}
            </div>
            {/* 签署证据（2026-09-15 · APP 内电子签署 · 香港私募合规留痕审计）：签名图 + 协议版本哈希固化构成证据链 */}
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">签署证据（{evList.length}）</div>
              {evList.length === 0 && (
                <div className="kyc-review-row"><span>暂无</span><strong>客户 APP 内签署或运营线下登记后自动生成</strong></div>
              )}
              {evList.map(e => (
                <div key={e.id} className="admin-ev-item">
                  <div className="admin-ev-head">
                    <strong>{maskName(e.signerName)}</strong>
                    <span className="admin-ev-env date-iso">{e.signedRef}</span>
                    {e.evidenceUrl && (
                      <a className="admin-sub-doc" href={e.evidenceUrl} target="_blank" rel="noopener noreferrer" title="协议文档">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <div className="admin-ev-meta">
                    签署 {formatListDateTime(e.signedAt)} · 协议 {e.agreementVersion}{e.agreementHash ? ' · 哈希已固化' : ''}
                  </div>
                  <div className="admin-ev-meta">
                    {e.source === 'app' ? 'APP 内电子签署' : '线下签署登记'}{e.confirmedBy ? ` · 确认 ${e.confirmedBy}` : ''}
                  </div>
                  {e.signatureImage && (
                    <div className="admin-sub-evidence-signature">
                      <img src={e.signatureImage} alt="电子签名" />
                      <span className="text-muted text-sm">电子签名存档</span>
                    </div>
                  )}
                </div>
              ))}
              <p className="admin-form-hint">客户在 APP 内阅读协议并以电子签名完成签署（签名图 + 协议版本/哈希签署时固化存档）；线下纸质签署由运营登记编号与时间。签署编号 + 哈希构成签署内容不可篡改的证据链。</p>
            </div>
            <div className="card kyc-review-block admin-fund-card">
              <div className="card-title">生命周期</div>
              <div className="kyc-review-row"><span>状态</span>
                <span className={`status-badge ${statusMeta[sel.status].cls}`}>{statusMeta[sel.status].label}</span>
              </div>
              <div className="kyc-review-row"><span>持有人数</span><strong>{snap.holderCount} 人 · {snap.totalShares} 份</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
