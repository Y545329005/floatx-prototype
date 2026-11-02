import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, Plus, Trash, AlertTriangle, Pencil, Upload, Power } from 'lucide-react';
import {
  funds,
  fundHoldings,
  updateFundProduct,
  createFundProduct,
  publishFundProduct,
  unpublishFundProduct,
  deleteFundProduct,
  appendFundNav,
  importFundNavSeries,
  latestNav,
  FUND_FEE_RATE,
  FUND_OPTIONS,
  formatExactAmount,
} from '../mock/data';
import { useDrawerFocus } from './useDrawerFocus';

// 基金产品管理（2026-10-28 基金一期后台；2026-10-29 重构）
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
//
// 2026-10-29 重构的第一性原理：本页不是「表单页」，是投资人侧事实的登记册，
// 三层频率差一个数量级——追加净值（每周）> 改条款（偶尔、高危）> 新建/上架（一次性）。
// 所以编辑态抽屉拆成四段（资料 / 条款 / 净值 / 文件与机构），把最高频的「净值」从
// 2000px 表单墙的第四屏提到一次点击；状态流转（发布/下架/删除）常驻抽屉顶部，任何分段下都够得着。
const SOURCE_LABEL = { self: '自营（HighBlock 管理）', external: '代售（第三方管理）' };
const OPEN_FREQ_LABEL = {
  'quarterly-start': '每季度首个营业日',
  'quarterly-end': '每季度最后营业日',
  'semi-annual-start': '每半年首个营业日',
};
const DOC_TYPE_LABEL = { kfs: '产品资料概要（KFS）', ppm: '要约备忘录（PPM）', other: '其他' };
const REDEMPTION_MODE_LABEL = { manual: '人工处理', auto: '自动处理' };
const STATUS_LABEL = { draft: '草稿', open: '在售', closed: '已下架' };
// 状态徽标沿用现有 badge 语义：在售=通过色、草稿=待处理色、下架=关闭色
const STATUS_BADGE = { draft: 'admin-status-pending', open: 'admin-status-approved', closed: 'admin-status-closed' };
const CADENCE_LABEL = { weekly: '周频', monthly: '月频' };
const CADENCE_OPTIONS = FUND_OPTIONS.cadences.map(v => ({ value: v, label: CADENCE_LABEL[v] || v }));

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

// 编辑态四段：顺序 = 运营的心智顺序（是什么 → 怎么交易 → 怎么定价 → 谁背书）
const TABS = [
  { key: 'profile', label: '资料' },
  { key: 'terms', label: '条款' },
  { key: 'nav', label: '净值' },
  { key: 'docs', label: '文件与机构' },
];

// 本地日期（不能用 toISOString：HKT 00:00–08:00 之间它会给出「昨天」，
// 结果就是「今天」被判成未来日期或被判成与上次同日，两种都错得很隐蔽）
const today = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// 新建表单的底：与 data.js 的 FUND_DEFAULTS 同源，数值一律是字符串（受控 input）
const EMPTY_FORM = {
  name: '', source: 'self', type: '另类投资', riskLevel: '中风险',
  description: '', manager: '', managerNote: '',
  returnLabel: '目标回报', returnValue: '', returnNote: '非保证',
  minInvestment: '1000000', lockMonths: '12', minHoldMonths: '6', termMonths: '24',
  inceptionDate: '', fundSizeYi: '', redemptionDays: '15', redemptionMode: 'manual',
  managementFeePct: '', performanceFeePct: '',
  openFrequency: '', confirmDays: '', redemptionNoticeDays: '',
  custodian: '', administrator: '', auditor: '',
  docs: [{ name: '产品资料概要', type: 'kfs', url: '' }],
  cadence: 'weekly',
  startNav: '', startNavDate: today(),
};

// 产品对象 → 表单（数值一律转字符串，空值转 ''）
function toForm(fund) {
  if (!fund) return { ...EMPTY_FORM, docs: EMPTY_FORM.docs.map(d => ({ ...d })) };
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
    cadence: fund.navMeta?.cadence === 'monthly' ? 'monthly' : 'weekly',
    // 首条净值只用于新建；编辑态的净值走「追加/批量导入」，避免这里偷偷多出第二条写入入口
    startNav: '',
    startNavDate: today(),
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
  const [tab, setTab] = useState('profile');
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  // needsConfirm：数据层拒绝并要求确认时，把「原 patch + 影响面」暂存，确认后用 acknowledge 再提交一次
  const [pendingSave, setPendingSave] = useState(null);
  const [navDate, setNavDate] = useState(today());
  const [navValue, setNavValue] = useState('');
  const [pendingNav, setPendingNav] = useState(null);
  const [navMsg, setNavMsg] = useState('');
  const [navImportText, setNavImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [pendingDelete, setPendingDelete] = useState(false);
  // 保存按钮只在「表单真的变了」时可点：无改动保存是空操作，可点会制造「保存成功」的假反馈
  const initialFormRef = useRef(null);
  const operator = admin?.name || '运营后台';

  // 新建设为独立路由 #admin/fund-products/new：与「选中某个产品」共用同一个抽屉，但不能互相覆盖
  const isNew = detailId === 'new';
  const selected = (!isNew && detailId) ? funds.find(f => f.id === detailId) : null;
  const drawerOpen = isNew || !!selected;
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
    const next = toForm(selected);
    setForm(next);
    initialFormRef.current = isNew ? null : JSON.stringify(next);
    // 编辑态默认落在「净值」：这是产品抽屉里最高频的动作（每周追加），
    // 资料/条款是低频段，各一次点击可达。新建态无分段，值无关。
    setTab('nav');
    setErrorMsg('');
    setOkMsg('');
    setPendingSave(null);
    setPendingNav(null);
    setNavMsg('');
    setNavValue('');
    setNavDate(today());
    setNavImportText('');
    setStatusMsg('');
    setPendingDelete(false);
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
    // 没有净值序列时不能显示 latestNav 的兜底 1.000 —— 那是「没有数据」，不是「净值 1.000」
    nav: Array.isArray(f.navSeries) && f.navSeries.length ? latestNav(f) : null,
    holdings: fundHoldings.filter(h => h.fundId === f.id && Number(h.shares) > 0).length,
  })), [tick]);

  const openCount = funds.filter(f => f.status === 'open').length;
  const draftCount = funds.filter(f => f.status === 'draft').length;
  const closedCount = funds.filter(f => f.status === 'closed').length;

  const dirty = isNew ? true : !!form && initialFormRef.current !== JSON.stringify(form);

  // 批量导入的示例必须「照抄即可通过」：只取晚于最后净值日、且不晚于今天的日期。
  // 固定写死 2024 年的示例会被数据层拒绝（只能向后追加），示例就成了陷阱。
  const navImportPlaceholder = (() => {
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parse = s => new Date(`${s}T00:00:00`);
    const last = selected?.navMeta?.lastNavDate;
    const startNav = selected && Array.isArray(selected.navSeries) && selected.navSeries.length ? latestNav(selected) : 1;
    const todayD = parse(today());
    const from = last ? new Date(parse(last).getTime() + 86400000) : new Date(todayD.getTime() - 21 * 86400000);
    const dates = [];
    for (let i = 0; i < 3; i += 1) {
      const d = new Date(from.getTime() + i * 7 * 86400000);
      if (d > todayD) break;
      dates.push(d);
    }
    if (!dates.length) return `日期,净值（须晚于 ${last || '—'} 且不晚于今天）`;
    return dates.map((d, i) => `${fmt(d)},${(startNav * (1 + 0.004 * (i + 1))).toFixed(3)}`).join('\n');
  })();

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
    const next = toForm(res.fund);
    setForm(next);
    initialFormRef.current = JSON.stringify(next);
    setOkMsg(`已保存：${res.changes.join('；')}`);
    setTick(t => t + 1);
  };

  const handleSave = () => {
    if (!form) return;
    setErrorMsg('');
    setOkMsg('');
    if (isNew) {
      const res = createFundProduct({
        name: form.name, source: form.source, type: form.type, riskLevel: form.riskLevel,
        description: form.description, manager: form.manager, managerNote: form.managerNote,
        returnLabel: form.returnLabel, returnValue: form.returnValue, returnNote: form.returnNote,
        minInvestment: form.minInvestment,
        lockMonths: form.lockMonths, minHoldMonths: form.minHoldMonths, termMonths: form.termMonths,
        inceptionDate: form.inceptionDate, fundSizeYi: form.fundSizeYi,
        redemptionDays: form.redemptionDays, redemptionMode: form.redemptionMode,
        cadence: form.cadence,
        startNav: form.startNav, startNavDate: form.startNavDate,
      }, { operator });
      if (!res.ok) { setErrorMsg(res.error); return; }
      setTick(t => t + 1);
      // 建完直接进该产品：费率/文件/三方机构在详情抽屉里补，新建表单只收「能决定它是什么」的字段
      if (navigate) navigate(`#admin/fund-products/${res.fund.id}`);
      return;
    }
    if (!selected) return;
    commitSave(false);
  };

  // —— 状态流转（发布 / 下架 / 删除）——
  const handlePublish = () => {
    if (!selected) return;
    const res = publishFundProduct(selected.id, { operator });
    setStatusMsg(res.ok ? '已发布，投资人现在可以看到并申购该产品' : res.error);
    if (res.ok) setTick(t => t + 1);
  };

  const handleUnpublish = () => {
    if (!selected) return;
    const res = unpublishFundProduct(selected.id, { operator });
    setStatusMsg(res.ok ? '已下架：不再出现在投资人列表，历史净值与持仓全部保留' : res.error);
    if (res.ok) setTick(t => t + 1);
  };

  const doDelete = () => {
    if (!selected) return;
    const res = deleteFundProduct(selected.id, { operator });
    setPendingDelete(false);
    if (!res.ok) { setStatusMsg(res.error); return; }
    setTick(t => t + 1);
    if (navigate) navigate('#admin/fund-products');
  };

  // 批量导入：一行「日期,净值」。整体校验通过才写（数据层保证），失败时把行号带回来
  const handleImportNav = () => {
    if (!selected) return;
    setNavMsg('');
    const rows = navImportText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [date, nav] = line.split(/[,\t]/).map(x => (x || '').trim());
        return { date, nav };
      });
    const res = importFundNavSeries(selected.id, rows, { operator });
    if (!res.ok) { setNavMsg(res.error); return; }
    setNavImportText('');
    setNavMsg(`已导入 ${res.count} 条净值（${res.from} ~ ${res.to}）`);
    setTick(t => t + 1);
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

  // —— 可复用表单块（新建与编辑共用；新建只有前三段，编辑走四段分栏） ——

  const renderProfileCard = () => (
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
  );

  const renderTermsCards = () => (
    <>
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
    </>
  );

  const renderFeeCards = () => (
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
  );

  const renderNavCard = () => (
    <div className="card">
      <div className="card-title">净值</div>
      <div className="kyc-review-row"><span>当前净值</span><strong>
        {Array.isArray(selected.navSeries) && selected.navSeries.length ? latestNav(selected).toFixed(3) : '—'}
      </strong></div>
      <div className="kyc-review-row"><span>最后净值日</span><strong>{selected.navMeta?.lastNavDate || '—'}</strong></div>
      <div className="kyc-review-row"><span>披露频率</span><strong>{CADENCE_LABEL[selected.navMeta?.cadence] || '周频'}</strong></div>
      <div className="kyc-review-row">
        <span>序列点数</span>
        <strong>{selected.navSeries?.length || 0} {selected.navMeta?.cadence === 'monthly' ? '月' : '周'}</strong>
      </div>
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

      <div className="form-group fund-product-import">
        <label>批量导入历史净值（追加）</label>
        <textarea
          className="form-input"
          rows={4}
          value={navImportText}
          onChange={e => { setNavImportText(e.target.value); if (navMsg) setNavMsg(''); }}
          placeholder={navImportPlaceholder}
          aria-label="批量导入净值"
        />
        <div className="admin-form-hint">
          每行「日期,净值」。只允许追加到 {selected.navMeta?.lastNavDate || '（暂无记录）'} 之后，不能回头改历史点。
          不校验间隔——管理人漏披露某一期是真实数据，不是录错；单条追加才做间隔拦截。
        </div>
        <button className="btn btn-md btn-outline" onClick={handleImportNav}><Upload size={16} /> 导入</button>
      </div>
    </div>
  );

  const renderDocsCards = () => (
    <>
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
    </>
  );

  return (
    <div className="admin-page admin-page--fund-products">
      <div className="admin-page-header">
        <h1>基金产品</h1>
        <span className="admin-header-summary">
          {funds.length} 只产品 · 在售 {openCount} 只
          {draftCount > 0 ? ` · 草稿 ${draftCount}` : ''}
          {closedCount > 0 ? ` · 已下架 ${closedCount}` : ''} ·
          认购费 {(FUND_FEE_RATE.subscribe * 100).toFixed(2)}% / 赎回费 {(FUND_FEE_RATE.redeem * 100).toFixed(2)}%（全局费率，产品页只读）
        </span>
        <button className="btn btn-md btn-primary" onClick={() => navigate('#admin/fund-products/new')}>
          <Plus size={16} /> 新建基金产品
        </button>
      </div>

      <div className="admin-table admin-table--fund-products">
        <div className="admin-table-header">
          <span className="col-name">产品</span>
          <span className="col-amount">起投额</span>
          <span className="col-months">锁定期</span>
          <span className="col-nav">当前净值</span>
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
              <span className="fund-product-name-line">
                <strong>{fund.name}</strong>
                <span className={`status-badge ${fund.source === 'self' ? 'fund-source-self' : 'fund-source-external'}`}>
                  {fund.source === 'self' ? '自营' : '代售'}
                </span>
                {/* 在售是默认态，不占徽标位；草稿/已下架必须一眼看出来（它们不在投资人侧） */}
                {fund.status !== 'open' && (
                  <span className={`status-badge ${STATUS_BADGE[fund.status] || ''}`}>{STATUS_LABEL[fund.status] || fund.status}</span>
                )}
              </span>
              <span className="fund-product-subline">{fund.type} · {fund.riskLevel}</span>
            </span>
            <span className="col-amount">{formatExactAmount(fund.minInvestment)}</span>
            <span className="col-months">{fund.lockMonths} 个月</span>
            <span className="col-nav">
              <span className="fund-product-nav-value">{nav == null ? '—' : nav.toFixed(3)}</span>
              {fund.navMeta?.lastNavDate && <span className="fund-product-nav-date">{fund.navMeta.lastNavDate}</span>}
            </span>
            <span className="col-count">{holdings}</span>
            <span className="col-actions">
              <button className="btn-icon" title="编辑" onClick={e => { e.stopPropagation(); navigate(`#admin/fund-products/${fund.id}`); }}>
                <Pencil size={16} />
              </button>
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="admin-table-row"><span className="admin-table-empty">暂无基金产品，点击右上角「新建基金产品」创建第一只</span></div>
        )}
      </div>

      {drawerOpen && <div className="admin-drawer-mask" onClick={closeDrawer} />}
      {drawerOpen && form && (
        <div className="admin-drawer admin-drawer--wide" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isNew ? '新建基金产品' : `基金产品 ${selected?.name || ''}`}>
          <div className="admin-drawer-head">
            <h3>
              {isNew ? '新建基金产品' : <span className="fund-product-head-name">{selected.name}</span>}
              {!isNew && (
                <span className={`status-badge ${STATUS_BADGE[selected.status] || ''} fund-product-head-badge`}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </span>
              )}
            </h3>
            <button className="btn-icon" title="关闭" onClick={closeDrawer}><X size={18} /></button>
          </div>

          {/* 状态流转常驻顶部：任何分段下都够得着（2026-10-29 从「第一张卡」上提） */}
          {!isNew && (
            <>
              <div className="admin-drawer-meta">
                <span className="fund-product-meta-item">编号 <strong className="fund-product-meta-id">{selected.id}</strong></span>
                <span className="fund-product-meta-item">币种 <strong>HKD</strong></span>
                <span className="fund-product-meta-item">费率 <strong>认购 {(FUND_FEE_RATE.subscribe * 100).toFixed(2)}% · 赎回 {(FUND_FEE_RATE.redeem * 100).toFixed(2)}%</strong></span>
                <div className="fund-product-meta-actions">
                  {selected.status !== 'open' && (
                    <button className="btn btn-md btn-primary" onClick={handlePublish}>
                      <Power size={16} /> {selected.status === 'draft' ? '发布（投资人可见）' : '重新上架'}
                    </button>
                  )}
                  {selected.status === 'open' && (
                    <button className="btn btn-md btn-secondary" onClick={handleUnpublish}>
                      <Power size={16} /> 下架
                    </button>
                  )}
                  <button className="btn btn-md btn-outline" onClick={() => setPendingDelete(true)}>
                    <Trash size={16} /> 删除
                  </button>
                </div>
              </div>
              <p className="admin-form-hint fund-product-meta-hint">
                费率与币种由全局配置统一管理，不在此页修改。
              </p>
              {pendingDelete && (
                <div className="fund-product-confirm fund-product-confirm--meta">
                  <p><AlertTriangle size={16} /> 删除后不可恢复，且只允许删除没有任何持仓、单据与结单的产品。</p>
                  <div className="fund-product-confirm-actions">
                    <button className="btn btn-md btn-secondary" onClick={() => setPendingDelete(false)}>取消</button>
                    <button className="btn btn-md btn-danger" onClick={doDelete}>确认删除</button>
                  </div>
                </div>
              )}
              {statusMsg && <p className="admin-form-hint fund-product-status-msg">{statusMsg}</p>}
            </>
          )}

          {/* 编辑态：四段分栏（资料 / 条款 / 净值 / 文件与机构）；新建态：单列表单（创建只收决定「它是什么」的字段） */}
          {!isNew && (
            <div className="admin-tabs admin-drawer-tabs fund-drawer-tabs" role="tablist" aria-label="基金产品分段">
              {TABS.map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`admin-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="admin-drawer-body">
            {isNew ? (
              <>
                {renderProfileCard()}
                {renderTermsCards()}
                <div className="card">
                  <div className="card-title">净值起点</div>
                  <div className="form-group">
                    <label>净值披露频率</label>
                    <select className="form-input" value={form.cadence} onChange={e => set('cadence', e.target.value)}>
                      {CADENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="admin-form-hint">
                      创建后不可修改：频率决定走势图日期轴，以及净值录入的间隔门槛（周频 ≥7 天 / 月频 ≥25 天）。
                    </div>
                  </div>
                  <div className="form-group">
                    <label>首条净值（可留空）</label>
                    <div className="fund-product-inline">
                      <input className="form-input" type="number" step="0.001" min="0" placeholder="1.000"
                        value={form.startNav} onChange={e => set('startNav', e.target.value)} aria-label="首条净值" />
                      <input className="form-input" type="date" max={today()}
                        value={form.startNavDate} onChange={e => set('startNavDate', e.target.value)} aria-label="净值日期" />
                    </div>
                    <div className="admin-form-hint">
                      自营产品成立日净值通常为 1.000；代售产品的净值在管理人手上，可以留空先建草稿。
                      没有净值的产品不能发布——申购份额按净值计算，空序列会被当成 1.000 成交。
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {tab === 'profile' && renderProfileCard()}
                {tab === 'terms' && (
                  <>
                    {renderTermsCards()}
                    {renderFeeCards()}
                  </>
                )}
                {tab === 'nav' && renderNavCard()}
                {tab === 'docs' && renderDocsCards()}
              </>
            )}
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
            <button className="btn btn-md btn-primary" onClick={handleSave} disabled={!isNew && !dirty}>
              <Save size={16} /> {isNew ? '创建草稿' : '保存产品资料'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
