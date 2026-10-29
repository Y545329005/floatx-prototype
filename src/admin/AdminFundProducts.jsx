import { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Trash, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  funds,
  fundHoldings,
  updateFundProduct,
  appendFundNav,
  latestNav,
  FUND_FEE_RATE,
  FUND_OPTIONS,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 基金产品管理（2026-10-28 基金一期后台）
//
// 三条设计约束，来自「改一个字段会动到谁的钱」：
// 1) 条款是事实、文案是投影。锁定期/存续期/最低持有期只收数字（月），
//    「24个月」由 APP 端用 i18n 模板生成——后台若还能手填文案，两套值必然有一天对不上。
// 2) 净值只追加。已确认单据里存的 nav 是成交快照，改历史净值会让持仓收益与发给投资人的结单
//    从此对不上账；要修正只能补一条并留痕。
// 3) 锁定期变更会重算存量持仓的可赎回状态。数据层自带闸门（未确认直接拒绝），
//    界面只是把影响面说清楚——弹窗可以绕过，数据层不能。
// 4) 封闭枚举一律下拉，不给文本框（2026-10-28 用户反馈）：类型/风险/收益口径这些值在 APP 端
//    都过一次 t()，字典只为「写死的那几个值」提供译文——自由输入多打一个字，英文界面就整块回退
//    中文，且没有任何报错。可选值真源 = data.js 的 FUND_OPTIONS，本文件只负责给人看的标签。

const SOURCE_LABEL = { self: '自营（HighBlock 管理）', external: '代售（第三方管理）' };
const OPEN_FREQ_LABEL = {
  'quarterly-start': '每季度首个营业日',
  'quarterly-end': '每季度最后营业日',
  'semi-annual-start': '每半年首个营业日',
};
const DOC_TYPE_LABEL = { kfs: '产品资料概要（KFS）', ppm: '要约备忘录（PPM）', other: '其他' };
const REDEMPTION_MODE_LABEL = { manual: '人工处理', auto: '自动处理' };

// 值真源在 data.js（FUND_OPTIONS），这里只挂中文标签；标签缺失时退回原值而不是空白
const toOptions = (values, labels = {}) => values.map(v => ({ value: v, label: labels[v] || v }));
const SOURCE_OPTIONS = toOptions(FUND_OPTIONS.sources, SOURCE_LABEL);
const OPEN_FREQ_OPTIONS = toOptions(FUND_OPTIONS.openFrequencies, OPEN_FREQ_LABEL);
const DOC_TYPE_OPTIONS = toOptions(FUND_OPTIONS.docTypes, DOC_TYPE_LABEL);
const REDEMPTION_MODE_OPTIONS = toOptions(FUND_OPTIONS.redemptionModes, REDEMPTION_MODE_LABEL);
const TYPE_OPTIONS = toOptions(FUND_OPTIONS.types);
const RISK_OPTIONS = toOptions(FUND_OPTIONS.riskLevels);
const RETURN_LABEL_OPTIONS = toOptions(FUND_OPTIONS.returnLabels);
const RETURN_NOTE_OPTIONS = toOptions(FUND_OPTIONS.returnNotes);

// 本地日期（不能用 toISOString：HKT 00:00–08:00 之间它会给出「昨天」，
// 结果就是「今天」被判成未来日期或被判成与上次同日，两种都错得很隐蔽）
const today = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// 产品对象 → 表单（数值一律转字符串，空值转 ''）
function toForm(fund) {
  if (!fund) return null;
  const ec = fund.economics || {};
  const dl = fund.dealing || {};
  const pt = fund.parties || {};
  return {
    name: fund.name || '',
    source: fund.source || 'self',
    type: fund.type || '',
    riskLevel: fund.riskLevel || '',
    description: fund.description || '',
    manager: fund.manager || '',
    managerNote: fund.managerNote || '',
    returnLabel: fund.returnLabel || '',
    returnValue: fund.returnValue || '',
    returnNote: fund.returnNote || '',
    minInvestment: fund.minInvestment == null ? '' : String(fund.minInvestment),
    lockMonths: fund.lockMonths == null ? '' : String(fund.lockMonths),
    minHoldMonths: fund.minHoldMonths == null ? '' : String(fund.minHoldMonths),
    termMonths: fund.termMonths == null ? '' : String(fund.termMonths),
    inceptionDate: fund.inceptionDate || '',
    fundSizeYi: fund.fundSizeYi == null ? '' : String(fund.fundSizeYi),
    redemptionDays: fund.redemptionDays == null ? '' : String(fund.redemptionDays),
    redemptionMode: fund.redemptionMode || 'manual',
    managementFeePct: ec.managementFeePct == null ? '' : String(ec.managementFeePct),
    performanceFeePct: ec.performanceFeePct == null ? '' : String(ec.performanceFeePct),
    openFrequency: dl.openFrequency || '',
    confirmDays: dl.confirmDays == null ? '' : String(dl.confirmDays),
    redemptionNoticeDays: dl.redemptionNoticeDays == null ? '' : String(dl.redemptionNoticeDays),
    custodian: pt.custodian || '',
    administrator: pt.administrator || '',
    auditor: pt.auditor || '',
    docs: (Array.isArray(fund.fundDocuments) ? fund.fundDocuments : []).map(d => ({ name: d.name || '', type: d.type || 'other', url: d.url || '' })),
  };
}

// 表单 → patch（只送白名单字段；空字符串按语义转 null 而不是 0）
function toPatch(form) {
  const num = (v) => (v === '' ? undefined : Number(v));
  const orNull = (v) => (String(v).trim() ? String(v).trim() : null);
  return {
    name: form.name,
    source: form.source,
    type: form.type,
    riskLevel: form.riskLevel,
    description: form.description,
    manager: form.manager,
    managerNote: form.managerNote,
    returnLabel: form.returnLabel,
    returnValue: form.returnValue,
    returnNote: form.returnNote,
    minInvestment: num(form.minInvestment),
    lockMonths: num(form.lockMonths),
    minHoldMonths: num(form.minHoldMonths),
    termMonths: num(form.termMonths),
    inceptionDate: form.inceptionDate,
    fundSizeYi: form.fundSizeYi === '' ? null : Number(form.fundSizeYi),
    redemptionDays: num(form.redemptionDays) ?? null,
    redemptionMode: form.redemptionMode,
    economics: {
      managementFeePct: form.managementFeePct === '' ? null : Number(form.managementFeePct),
      performanceFeePct: form.performanceFeePct === '' ? null : Number(form.performanceFeePct),
    },
    dealing: {
      openFrequency: form.openFrequency || null,
      confirmDays: num(form.confirmDays) ?? null,
      redemptionNoticeDays: num(form.redemptionNoticeDays) ?? null,
    },
    parties: {
      custodian: orNull(form.custodian),
      administrator: orNull(form.administrator),
      auditor: orNull(form.auditor),
    },
    fundDocuments: form.docs
      .filter(d => String(d.name).trim())
      .map(d => ({ name: d.name, type: d.type, url: d.url || null })),
  };
}

export default function AdminFundProducts({ admin, detailId, navigate }) {
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  // needsConfirm：数据层拒绝并要求确认时，把「原 patch + 影响面」暂存，确认后用 acknowledge 再提交一次
  const [pendingSave, setPendingSave] = useState(null);
  const [navDate, setNavDate] = useState(today());
  const [navValue, setNavValue] = useState('');
  const [pendingNav, setPendingNav] = useState(null);
  const [navMsg, setNavMsg] = useState('');
  const operator = admin?.name || '运营后台';

  const selected = detailId ? funds.find(f => f.id === detailId) : null;
  const drawerOpen = !!selected;
  const goList = () => { if (navigate) navigate('#admin/fund-products'); };
  const drawerRef = useDrawerFocus(drawerOpen, goList);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  // 打开产品时重建表单（不在渲染期读 selected 生成，避免输入被其它 state 更新冲掉）
  useEffect(() => {
    setForm(toForm(selected));
    setErrorMsg('');
    setOkMsg('');
    setPendingSave(null);
    setPendingNav(null);
    setNavMsg('');
    setNavValue('');
    setNavDate(today());
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeDrawer = () => {
    setForm(null);
    setErrorMsg('');
    setOkMsg('');
    setPendingSave(null);
    setPendingNav(null);
    goList();
  };

  const rows = useMemo(() => funds.map(f => ({
    fund: f,
    nav: latestNav(f),
    holdings: fundHoldings.filter(h => h.fundId === f.id && Number(h.shares) > 0).length,
  })), [tick]);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errorMsg) setErrorMsg('');
    if (okMsg) setOkMsg('');
  };

  const commitSave = (acknowledge) => {
    const patch = pendingSave?.patch || toPatch(form);
    const res = updateFundProduct(selected.id, patch, { operator, acknowledge });
    if (!res.ok) {
      if (res.needsConfirm) { setPendingSave({ patch, message: res.error }); return; }
      setErrorMsg(res.error);
      setPendingSave(null);
      return;
    }
    setPendingSave(null);
    setForm(toForm(res.fund));
    setOkMsg(`已保存：${res.changes.join('；')}`);
    setTick(t => t + 1);
  };

  const handleSave = () => {
    if (!form || !selected) return;
    setErrorMsg('');
    setOkMsg('');
    commitSave(false);
  };

  const handleAppendNav = () => {
    setNavMsg('');
    const res = appendFundNav(selected.id, { date: navDate, nav: navValue }, { operator, acknowledge: false });
    if (!res.ok) {
      if (res.needsConfirm) { setPendingNav({ date: navDate, nav: navValue, message: res.error }); return; }
      setNavMsg(res.error);
      return;
    }
    setNavValue('');
    setNavMsg(`已追加 ${res.date} 净值 ${res.nav}（${res.pct >= 0 ? '+' : ''}${res.pct.toFixed(2)}%）`);
    setTick(t => t + 1);
  };

  const handleConfirmNav = () => {
    if (!pendingNav) return;
    const res = appendFundNav(selected.id, { date: pendingNav.date, nav: pendingNav.nav }, { operator, acknowledge: true });
    setPendingNav(null);
    if (!res.ok) { setNavMsg(res.error); return; }
    setNavValue('');
    setNavMsg(`已追加 ${res.date} 净值 ${res.nav}（${res.pct >= 0 ? '+' : ''}${res.pct.toFixed(2)}%）`);
    setTick(t => t + 1);
  };

  const updateDoc = (i, k, v) => {
    setForm(prev => {
      const docs = prev.docs.slice();
      docs[i] = { ...docs[i], [k]: v };
      return { ...prev, docs };
    });
    if (errorMsg) setErrorMsg('');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>基金产品</h1>
        <span className="admin-header-summary">
          {funds.length} 只产品 · 在售 {funds.filter(f => f.status === 'open' && f.openForSubscription !== false).length} 只 ·
          认购费 {(FUND_FEE_RATE.subscribe * 100).toFixed(2)}% / 赎回费 {(FUND_FEE_RATE.redeem * 100).toFixed(2)}%（全局费率，产品页只读）
        </span>
      </div>

      <div className="admin-table admin-table--fund-products">
        <div className="admin-table-header">
          <span className="col-name">产品</span>
          <span className="col-type">类型</span>
          <span className="col-risk">风险等级</span>
          <span className="col-amount">起投额</span>
          <span className="col-months">锁定期</span>
          <span className="col-nav">当前净值</span>
          <span className="col-date">最后净值日</span>
          <span className="col-count">持有人</span>
          <span className="col-actions">操作</span>
        </div>
        {rows.map(({ fund, nav, holdings }) => (
          <div
            key={fund.id}
            className="admin-table-row"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`#admin/fund-products/${fund.id}`)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`#admin/fund-products/${fund.id}`); } }}
          >
            <span className="col-name">
              <strong>{fund.name}</strong>
              <span className={`status-badge ${fund.source === 'self' ? 'admin-status-approved' : 'admin-status-pending'}`}>
                {fund.source === 'self' ? '自营' : '代售'}
              </span>
            </span>
            <span className="col-type">{fund.type}</span>
            <span className="col-risk">{fund.riskLevel}</span>
            <span className="col-amount">{formatExactAmount(fund.minInvestment)}</span>
            <span className="col-months">{fund.lockMonths} 个月</span>
            <span className="col-nav">{nav.toFixed(3)}</span>
            <span className="col-date">{fund.navMeta?.lastNavDate || '—'}</span>
            <span className="col-count">{holdings}</span>
            <span className="col-actions">
              <button className="btn-icon" title="编辑" onClick={e => { e.stopPropagation(); navigate(`#admin/fund-products/${fund.id}`); }}>
                <TrendingUp size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && selected && form && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`基金产品 ${selected.name}`}>
          <div className="admin-drawer-head">
            <h3>{selected.name}</h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          <div className="admin-drawer-body">
            <div className="card">
              <div className="kyc-review-row"><span>状态</span><strong>{selected.id} · {selected.status === 'open' ? '在售' : '已结束'}{selected.openForSubscription === false ? '（暂停申购）' : ''}</strong></div>
              <div className="kyc-review-row"><span>币种</span><strong>HKD（首期仅港币）</strong></div>
              <div className="kyc-review-row"><span>费率</span><strong>认购 {(FUND_FEE_RATE.subscribe * 100).toFixed(2)}% · 赎回 {(FUND_FEE_RATE.redeem * 100).toFixed(2)}%</strong></div>
              <p className="admin-form-hint">
                状态、币种与费率不在此页修改：费率的唯一事实源是全局 FUND_FEE_RATE（账务与展示同源），
                上下架与额度留到下一期。
              </p>
            </div>

            <div className="card">
              <div className="card-title">产品资料</div>
              <div className="form-group">
                <label>基金名称</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>来源</label>
                <select className="form-input" value={form.source} onChange={e => set('source', e.target.value)}>
                  {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>产品类型</label>
                <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="admin-form-hint">新增类型请先在图示字典补译文——自由文本会在英文界面整块回退中文。</div>
              </div>
              <div className="form-group">
                <label>风险等级</label>
                <select className="form-input" value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}>
                  {RISK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="admin-form-hint">APP 只对「高风险」着色，其余为普通文字。</div>
              </div>
              <div className="form-group">
                <label>一句话描述（APP 详情页展示）</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label>管理人</label>
                <input className="form-input" value={form.manager} onChange={e => set('manager', e.target.value)} />
              </div>
              <div className="form-group">
                <label>管理人披露（代售产品须写明分销关系）</label>
                <textarea className="form-input" rows={2} value={form.managerNote} onChange={e => set('managerNote', e.target.value)} />
              </div>
            </div>

            <div className="card">
              <div className="card-title">收益与条款</div>
              <div className="form-group">
                <label>收益口径 / 数值 / 注释</label>
                <div className="fund-product-inline">
                  <select className="form-input" value={form.returnLabel} onChange={e => set('returnLabel', e.target.value)} aria-label="收益标签">
                    {RETURN_LABEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input className="form-input" value={form.returnValue} onChange={e => set('returnValue', e.target.value)} placeholder="8-10%" aria-label="收益数值" />
                  <select className="form-input" value={form.returnNote} onChange={e => set('returnNote', e.target.value)} aria-label="口径注释">
                    {RETURN_NOTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="admin-form-hint">
                  数值仍为文本框：形态有「8-10%」「10%+」「约10%」三种，且本身是数字、中英文都读得通。
                  标为「保证」属于受监管表述，改前需合规确认。
                </div>
              </div>
              <div className="form-group">
                <label>起投额（HKD）</label>
                <input className="form-input" type="number" value={form.minInvestment} onChange={e => set('minInvestment', e.target.value)} />
              </div>
              <div className="form-group">
                <label>锁定期（月）</label>
                <input className="form-input" type="number" value={form.lockMonths} onChange={e => set('lockMonths', e.target.value)} />
                <div className="admin-form-hint">只填数字。「{form.lockMonths || 0} 个月」由 APP 按语言生成；此处也是可赎回判定的唯一依据。</div>
              </div>
              <div className="form-group">
                <label>最低持有期（月）</label>
                <input className="form-input" type="number" value={form.minHoldMonths} onChange={e => set('minHoldMonths', e.target.value)} />
              </div>
              <div className="form-group">
                <label>存续期（月）</label>
                <input className="form-input" type="number" value={form.termMonths} onChange={e => set('termMonths', e.target.value)} />
              </div>
              <div className="form-group">
                <label>成立时间</label>
                <input className="form-input" type="month" value={form.inceptionDate} onChange={e => set('inceptionDate', e.target.value)} />
                <div className="admin-form-hint">档案展示用。净值走势图的时间跨度由净值序列本身决定，不由此字段推算。</div>
              </div>
              <div className="form-group">
                <label>基金规模（亿港元）</label>
                <div className="fund-product-suffix">
                  <input className="form-input" type="number" step="0.1" min="0" value={form.fundSizeYi} onChange={e => set('fundSizeYi', e.target.value)} placeholder="2.4" />
                  <span className="fund-product-suffix-unit">亿港元</span>
                </div>
                <div className="admin-form-hint">只填数字：中文显示「HK$ 2.4亿」、英文「HK$240M」由系统生成，不再手写单位。</div>
              </div>
              <div className="form-group">
                <label>赎回到账</label>
                <div className="fund-product-inline">
                  <span className="fund-product-suffix">
                    <span className="fund-product-suffix-unit">T+</span>
                    <input className="form-input" type="number" min="0" max="365" value={form.redemptionDays} onChange={e => set('redemptionDays', e.target.value)} aria-label="到账天数" />
                  </span>
                  <select className="form-input" value={form.redemptionMode} onChange={e => set('redemptionMode', e.target.value)} aria-label="到账处理方式">
                    {REDEMPTION_MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="admin-form-hint">APP 显示「T+{form.redemptionDays || 0}（{REDEMPTION_MODE_LABEL[form.redemptionMode]}）」——文案由这两个值生成。</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">费率与交易</div>
              <div className="form-group">
                <label>管理费（%/年）</label>
                <input className="form-input" type="number" step="any" value={form.managementFeePct} onChange={e => set('managementFeePct', e.target.value)} />
              </div>
              <div className="form-group">
                <label>表现费（%）</label>
                <input className="form-input" type="number" step="any" value={form.performanceFeePct} onChange={e => set('performanceFeePct', e.target.value)} />
              </div>
              <div className="form-group">
                <label>开放日频率</label>
                <select className="form-input" value={form.openFrequency} onChange={e => set('openFrequency', e.target.value)}>
                  <option value="">详见基金文件</option>
                  {OPEN_FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>确认时效（T+n 的 n）</label>
                <input className="form-input" type="number" value={form.confirmDays} onChange={e => set('confirmDays', e.target.value)} />
              </div>
              <div className="form-group">
                <label>赎回通知期（天）</label>
                <input className="form-input" type="number" value={form.redemptionNoticeDays} onChange={e => set('redemptionNoticeDays', e.target.value)} />
              </div>
            </div>

            <div className="card">
              <div className="card-title">净值</div>
              <div className="kyc-review-row"><span>当前净值</span><strong>{latestNav(selected).toFixed(3)}</strong></div>
              <div className="kyc-review-row"><span>最后净值日</span><strong>{selected.navMeta?.lastNavDate || '—'}</strong></div>
              <div className="kyc-review-row"><span>序列点数</span><strong>{selected.navSeries?.length || 0} 周</strong></div>
              <p className="admin-form-hint">
                净值只追加、不改历史：已确认单据里的净值是成交快照，改历史点会让持仓收益与已发出的结单对不上账。
                追加后会立刻改变所有持有人的市值与收益率（份额不变）。
              </p>

              <div className="fund-product-inline">
                <input
                  className="form-input"
                  type="date"
                  aria-label="净值日期"
                  value={navDate}
                  max={today()}
                  onChange={e => { setNavDate(e.target.value); if (navMsg) setNavMsg(''); }}
                />
                <input
                  className="form-input"
                  type="number"
                  step="0.001"
                  aria-label="新净值"
                  placeholder="如 1.156"
                  value={navValue}
                  onChange={e => { setNavValue(e.target.value); if (navMsg) setNavMsg(''); }}
                />
                <button className="btn btn-md btn-outline" onClick={handleAppendNav}><Plus size={16} /> 追加净值</button>
              </div>

              {pendingNav && (
                <div className="fund-product-confirm">
                  <p><AlertTriangle size={16} /> {pendingNav.message}</p>
                  <div className="fund-product-confirm-actions">
                    <button className="btn btn-md btn-secondary" onClick={() => setPendingNav(null)}>取消</button>
                    <button className="btn btn-md btn-primary" onClick={handleConfirmNav}>确认无误，追加</button>
                  </div>
                </div>
              )}

              {navMsg && <p className="admin-form-hint">{navMsg}</p>}
            </div>

            <div className="card">
              <div className="card-title">发售文件</div>
              <p className="admin-form-hint">URL 留空时 APP 只说明「联系客户经理获取」，不给死链。</p>
              {form.docs.map((d, i) => (
                <div key={i} className="fund-product-doc">
                  <input className="form-input" value={d.name} onChange={e => updateDoc(i, 'name', e.target.value)} placeholder="文件名称" aria-label="文件名称" />
                  <select className="form-input" value={d.type} onChange={e => updateDoc(i, 'type', e.target.value)} aria-label="文件类型">
                    {DOC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input className="form-input" value={d.url} onChange={e => updateDoc(i, 'url', e.target.value)} placeholder="https://…（可留空）" aria-label="文件链接" />
                  <button className="btn-icon" title="删除该文件" onClick={() => setForm(prev => ({ ...prev, docs: prev.docs.filter((_, x) => x !== i) }))}>
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              <button className="btn btn-md btn-outline" onClick={() => setForm(prev => ({ ...prev, docs: [...prev.docs, { name: '', type: 'other', url: '' }] }))}>
                <Plus size={16} /> 添加文件
              </button>
            </div>

            <div className="card">
              <div className="card-title">第三方机构</div>
              <p className="admin-form-hint">留空 = APP 显示「详见基金文件」。原型阶段不编造具名机构（审核会逐一点名核查）。</p>
              <div className="form-group">
                <label>托管人</label>
                <input className="form-input" value={form.custodian} onChange={e => set('custodian', e.target.value)} />
              </div>
              <div className="form-group">
                <label>行政管理人</label>
                <input className="form-input" value={form.administrator} onChange={e => set('administrator', e.target.value)} />
              </div>
              <div className="form-group">
                <label>审计师</label>
                <input className="form-input" value={form.auditor} onChange={e => set('auditor', e.target.value)} />
              </div>
            </div>

          </div>

          {/* 保存结果与二次确认放在底栏上方，不进滚动区：
              点「保存」的人此刻多半停在某个字段上（截图实测：确认块渲染在抽屉最底部，
              用户看不到任何反馈，会以为按钮坏了）。 */}
          {pendingSave && (
            <div className="fund-product-confirm fund-product-confirm--footer">
              <p><AlertTriangle size={16} /> {pendingSave.message}</p>
              <div className="fund-product-confirm-actions">
                <button className="btn btn-md btn-secondary" onClick={() => setPendingSave(null)}>取消</button>
                <button className="btn btn-md btn-primary" onClick={() => commitSave(true)}>确认修改</button>
              </div>
            </div>
          )}
          {(errorMsg || okMsg) && (
            <div className="fund-product-footer-status">
              {errorMsg && <p className="form-error">{errorMsg}</p>}
              {okMsg && <p className="admin-form-hint">{okMsg}</p>}
            </div>
          )}

          <div className="admin-drawer-actions">
            <button className="btn btn-md btn-secondary" onClick={closeDrawer}>关闭</button>
            <button className="btn btn-md btn-primary" onClick={handleSave}><Save size={16} /> 保存产品资料</button>
          </div>
        </div>
      )}
    </div>
  );
}
