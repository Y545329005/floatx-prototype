import { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Power, Ban } from 'lucide-react';
import {
  mandateAgreements,
  mandateConfig,
  saveMandateAgreement,
  setMandateAgreementStatus,
  getInvestorUsers,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 委托协议台账（2026-11-13 批 1a 登记页 → 2026-11-17 IA 收敛为账户签内嵌台账）
//
// 这不是「协议列表」，是开户资格的法律底稿：账户只能从一份生效协议上开出来
//（闸门在 data.js 的 canOpenMandateAccount，不在按钮上）。所以协议本身必须完整：
// 编号可追溯、双方见证、持牌代表 + CE 号、语言版本、费率与附录限制。
//
// 协议里所有 [ ] 空值（费率/限制/最低投资额）都做成可配字段：合规填之前是 0，
// 0 在业务上等于「待填」，不当作免费——展示层必须保留「待合规填写」的提示。
//
// IA 收敛（2026-11-17 方案 A）：协议是开户流程的第一步，不是独立管理域——
// 台账嵌在委托业务「账户」签顶部，抽屉走组件内 state（低频台账，不占 URL 深链）。

const STATUS_META = {
  draft: { label: '草稿', cls: 'admin-status-pending' },
  active: { label: '生效', cls: 'admin-status-approved' },
  terminated: { label: '已终止', cls: 'admin-status-closed' },
};

const LANG_OPTIONS = [
  { value: 'zh-HK', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English（协议 33：英文版优先）' },
];

const CYCLE_OPTIONS = [
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季' },
];

const today = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const emptyForm = () => ({
  id: '',
  no: '',
  userId: '',
  userName: '',
  signedAt: today(),
  effectiveAt: '',
  clientWitness: '',
  managerDirector: '',
  licensedRepName: '',
  licensedRepCE: '',
  language: 'zh-HK',
  scanUrl: '',
  version: 'v1.0',
  fees: { ...mandateConfig.fees },
  limits: { ...mandateConfig.limits },
  strategy: { objectives: '', policy: '', limits: { ...mandateConfig.limits } },
  valuationCurrency: 'HKD',
  valuationCycle: 'monthly',
  reportingPeriod: 'monthly',
});

const toForm = (ag) => ({
  ...emptyForm(),
  ...ag,
  scanUrl: ag.scanUrl || '',
  fees: { ...mandateConfig.fees, ...(ag.fees || {}) },
  limits: { ...mandateConfig.limits, ...(ag.strategy?.limits || {}) },
  strategy: {
    objectives: ag.strategy?.objectives || '',
    policy: ag.strategy?.policy || '',
    limits: { ...mandateConfig.limits, ...(ag.strategy?.limits || {}) },
  },
  signedAt: String(ag.signedAt || '').slice(0, 10),
  effectiveAt: String(ag.effectiveAt || '').slice(0, 10),
});

export default function MandateAgreementLedger({ admin, onChanged }) {
  const [tick, setTick] = useState(0);
  // 抽屉驱动：state（'new' | agreementId | null）。协议是低频台账，
  // 不走 URL——URL param 已被账户/交易抽屉占用（#admin/mandate/{tab}/{id}）
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const operator = admin?.name || '合规后台';
  const isNew = openId === 'new';
  const selected = openId && !isNew ? mandateAgreements.find(a => a.id === openId) : null;
  const drawerOpen = openId != null && (isNew || !!selected);

  const investors = useMemo(() => getInvestorUsers(), [tick]);
  const closeDrawer = () => setOpenId(null);
  const drawerRef = useDrawerFocus(drawerOpen, closeDrawer);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  useEffect(() => {
    if (openId == null) { setForm(null); return; }
    if (openId === 'new') { setForm(emptyForm()); setError(''); setDoneMsg(''); return; }
    const ag = mandateAgreements.find(a => a.id === openId);
    setForm(ag ? toForm(ag) : null);
    setError('');
    setDoneMsg('');
  }, [openId]);

  const refresh = () => { setTick(t => t + 1); onChanged?.(); };
  const set = (key, value) => setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  const setFee = (key, value) => setForm(prev => (prev ? { ...prev, fees: { ...prev.fees, [key]: value } } : prev));
  const setLimit = (key, value) => setForm(prev => (prev ? {
    ...prev,
    limits: { ...prev.limits, [key]: value },
    strategy: { ...prev.strategy, limits: { ...prev.strategy.limits, [key]: value } },
  } : prev));

  const handleSave = () => {
    if (!form) return;
    const user = investors.find(u => u.userId === form.userId);
    const res = saveMandateAgreement({
      ...form,
      signedAt: form.signedAt ? `${form.signedAt} 00:00:00` : '',
      effectiveAt: form.effectiveAt ? `${form.effectiveAt} 00:00:00` : '',
      userName: user?.name || form.userName,
      fees: {
        managementPct: Number(form.fees.managementPct) || 0,
        inceptionPct: Number(form.fees.inceptionPct) || 0,
        performancePct: Number(form.fees.performancePct) || 0,
        hurdlePct: Number(form.fees.hurdlePct) || 0,
        minimumValue: Number(form.fees.minimumValue) || 0,
      },
      strategy: {
        objectives: form.strategy.objectives,
        policy: form.strategy.policy,
        limits: {
          singleCompanyPct: Number(form.limits.singleCompanyPct) || 0,
          singleIssuerPct: Number(form.limits.singleIssuerPct) || 0,
          borrowingPct: Number(form.limits.borrowingPct) || 0,
        },
      },
      id: form.id || undefined,
    }, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    refresh();
    closeDrawer();
  };

  const handleStatus = (status) => {
    if (!selected) return;
    const res = setMandateAgreementStatus(selected.id, status, status === 'terminated' ? today() : null, operator);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    setDoneMsg(status === 'active' ? '协议已生效，可为该客户开立委托账户。' : '协议已终止，关联委托账户同步关闭。');
    refresh();
  };

  return (
    <div className="mandate-agr-ledger">
      <div className="mandate-panel-bar">
        <span className="admin-header-summary">
          委托协议台账 · {mandateAgreements.length} 份 · 生效 {mandateAgreements.filter(a => a.status === 'active').length} 份 ·
          协议是开户的唯一法律依据，未登记协议不能开户
        </span>
        <button className="btn btn-md btn-primary" onClick={() => setOpenId('new')}>
          <Plus size={16} /> 登记委托协议
        </button>
      </div>

      <div className="admin-table admin-table--mandate-agreements">
        <div className="admin-table-header">
          <span className="col-name">协议编号 / 客户</span>
          <span>签署日</span>
          <span>持牌代表</span>
          <span className="col-amount">最低投资额</span>
          <span>状态</span>
          <span className="col-actions">操作</span>
        </div>
        {mandateAgreements.map(ag => {
          const meta = STATUS_META[ag.status] || STATUS_META.draft;
          return (
            <div
              key={ag.id}
              className="admin-table-row"
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(ag.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(ag.id); } }}
            >
              <span className="col-name">
                <strong>{ag.no}</strong>
                <span className="mandate-subline">{ag.userName || ag.userId} · {LANG_OPTIONS.find(l => l.value === ag.language)?.label || ag.language}</span>
              </span>
              <span>{String(ag.signedAt || '—').slice(0, 10)}</span>
              <span>
                {ag.licensedRepName || '—'}
                <span className="mandate-subline">CE {ag.licensedRepCE || '未填（不能开户）'}</span>
              </span>
              <span className="col-amount">{Number(ag.fees?.minimumValue || 0).toLocaleString()}</span>
              <span><span className={`status-badge ${meta.cls}`}>{meta.label}</span></span>
              <span className="col-actions">
                <button className="btn-icon" title="编辑" onClick={e => { e.stopPropagation(); setOpenId(ag.id); }}>
                  <Power size={16} />
                </button>
              </span>
            </div>
          );
        })}
        {mandateAgreements.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无委托协议，点击右上角登记第一份</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && form && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '登记委托协议' : `委托协议 ${form.no}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '登记委托协议' : form.no}
              {!isNew && selected && (
                <span className={`status-badge ${STATUS_META[selected.status]?.cls} fund-product-head-badge`}>
                  {STATUS_META[selected.status]?.label}
                </span>
              )}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            {doneMsg && <div className="fund-trade-done">{doneMsg}</div>}

            <div className="card">
              <div className="card-title">协议主体</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">协议编号</label>
                  <input className="form-input" value={form.no} onChange={e => set('no', e.target.value)} placeholder="如 HB-DA-2026-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">客户</label>
                  <select
                    className="form-input"
                    value={form.userId}
                    onChange={e => {
                      const u = investors.find(x => x.userId === e.target.value);
                      setForm(prev => ({ ...prev, userId: e.target.value, userName: u?.name || '' }));
                    }}
                  >
                    <option value="">请选择客户</option>
                    {investors.map(u => <option key={u.userId} value={u.userId}>{u.name}（{u.investorNo || u.userId}）</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">客户签署日</label>
                  <input className="form-input" type="date" value={form.signedAt} onChange={e => set('signedAt', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">生效日</label>
                  <input className="form-input" type="date" value={form.effectiveAt} onChange={e => set('effectiveAt', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">客户方见证人</label>
                  <input className="form-input" value={form.clientWitness} onChange={e => set('clientWitness', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">公司方董事 / 负责人员</label>
                  <input className="form-input" value={form.managerDirector} onChange={e => set('managerDirector', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">持牌代表姓名</label>
                  <input className="form-input" value={form.licensedRepName} onChange={e => set('licensedRepName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">持牌代表 CE 编号（开户必填）</label>
                  <input className="form-input" value={form.licensedRepCE} onChange={e => set('licensedRepCE', e.target.value)} placeholder="如 BJW123" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">协议语言版本</label>
                  <select className="form-input" value={form.language} onChange={e => set('language', e.target.value)}>
                    {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">扫描件 URL（可留空）</label>
                  <input className="form-input" value={form.scanUrl} onChange={e => set('scanUrl', e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div className="admin-form-hint">CE 编号缺失时协议不能生效，也不能开立委托账户——这是协议的持牌职员见证要求。</div>
            </div>

            <div className="card">
              <div className="card-title">费用表（协议留空项，0 = 待合规填写）</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">管理费 %/年（按 NAV，月末）</label>
                  <input className="form-input" type="number" step="any" value={form.fees.managementPct} onChange={e => setFee('managementPct', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">设立费 %（按每笔供款）</label>
                  <input className="form-input" type="number" step="any" value={form.fees.inceptionPct} onChange={e => setFee('inceptionPct', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">表现费 %（超门槛部分）</label>
                  <input className="form-input" type="number" step="any" value={form.fees.performancePct} onChange={e => setFee('performancePct', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">门槛回报率 %/年</label>
                  <input className="form-input" type="number" step="any" value={form.fees.hurdlePct} onChange={e => setFee('hurdlePct', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">最低投资额（协议附录）</label>
                <input className="form-input" type="number" step="any" value={form.fees.minimumValue} onChange={e => setFee('minimumValue', e.target.value)} />
              </div>
            </div>

            <div className="card">
              <div className="card-title">附录 A · 投资策略与限制</div>
              <div className="form-group">
                <label className="form-label">投资目标</label>
                <input className="form-input" value={form.strategy.objectives} onChange={e => setForm(prev => ({ ...prev, strategy: { ...prev.strategy, objectives: e.target.value } }))} />
              </div>
              <div className="form-group">
                <label className="form-label">投资政策</label>
                <input className="form-input" value={form.strategy.policy} onChange={e => setForm(prev => ({ ...prev, strategy: { ...prev.strategy, policy: e.target.value } }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">单一公司上限 % of NAV</label>
                  <input className="form-input" type="number" step="any" value={form.limits.singleCompanyPct} onChange={e => setLimit('singleCompanyPct', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">单一发行人上限 %</label>
                  <input className="form-input" type="number" step="any" value={form.limits.singleIssuerPct} onChange={e => setLimit('singleIssuerPct', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">借贷上限 % of 市值</label>
                <input className="form-input" type="number" step="any" value={form.limits.borrowingPct} onChange={e => setLimit('borrowingPct', e.target.value)} />
              </div>
              <div className="admin-form-hint">限制用于录入交易时的软提示（1b），不阻断保存——估值波动导致的超限不该把正常交易卡死。</div>
            </div>

            <div className="card">
              <div className="card-title">估值与报告（协议 11）</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">估值货币</label>
                  <select className="form-input" value={form.valuationCurrency} onChange={e => set('valuationCurrency', e.target.value)}>
                    <option value="HKD">HKD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">估值周期</label>
                  <select className="form-input" value={form.valuationCycle} onChange={e => set('valuationCycle', e.target.value)}>
                    {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">报告期间</label>
                <select className="form-input" value={form.reportingPeriod} onChange={e => set('reportingPeriod', e.target.value)}>
                  {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="admin-form-hint">协议 11.3：月报须于期末 15 个营业日内出具。日结单不能替代月报（合同义务）。</div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="admin-form-actions">
              {!isNew && selected?.status === 'draft' && (
                <button className="btn btn-md btn-primary" onClick={() => handleStatus('active')}><Power size={16} /> 生效</button>
              )}
              {!isNew && selected?.status === 'active' && (
                <button className="btn btn-md btn-secondary" onClick={() => handleStatus('terminated')}><Ban size={16} /> 终止协议</button>
              )}
              <button className="btn btn-md btn-primary" onClick={handleSave}><Save size={16} /> 保存协议</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
