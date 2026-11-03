import { useState, useEffect } from 'react';
import { keyed } from '../lib';
import { Coins, Tags, ArrowLeftRight, Mail, Landmark, Building2, Edit3, Plus, Trash2, Save, RotateCcw, X, FileText, HelpCircle } from 'lucide-react';
import {
  sectors, exchangeRates, businessContact,
  projects, amountPresets, addAmountPreset, removeAmountPreset,
  platformAccounts, updatePlatformAccounts, resetExchangeRates,
  platformBrand, updatePlatformBrand, logAudit, Storage,
  termsState, bumpTermsVersion,
  agreements, updateAgreementSections,
  faqItems, addFaqItem, updateFaqItem, removeFaqItem,
} from '../mock/data';

// 配置项目录（清单行）：key / 名称 / 图标 / 说明 / 当前值摘要（实时派生）
// sensitive: true = 仅 super 可见（2026-10-19 页内分级：品牌/资金账户/条款为权限敏感配置；
// 档位/行业/汇率/商务联系/FAQ 为日常运营参数，ops 及以上可见）
const CONFIG_ITEMS = [
  { key: 'presets', name: '申购金额档位', icon: Coins, desc: '用户侧申购弹框的快捷金额档位', summary: () => `${amountPresets.length} 档 · ${amountPresets[0].label} ~ ${amountPresets[amountPresets.length - 1].label}` },
  { key: 'sectors', name: '行业分类', icon: Tags, desc: '项目 / 路演的行业分类选项', summary: () => `${sectors.length} 个` },
  { key: 'rates', name: '汇率配置', icon: ArrowLeftRight, desc: '法币换汇参考汇率', summary: () => `${Object.keys(exchangeRates).length} 对 · ${exchangeRates['hkd-usd'].from}↔${exchangeRates['hkd-usd'].to} ${exchangeRates['hkd-usd'].rate}` },
  { key: 'contact', name: '商务联系方式', icon: Mail, desc: '对外 BD 联系（登录页 / 路演列表）', summary: () => businessContact.email },
  { key: 'faq', name: '帮助 FAQ', icon: HelpCircle, desc: '用户侧帮助中心的常见问题（简/繁/英三语）', summary: () => `${faqItems.length} 条` },
  { key: 'accounts', name: '平台资金账户', icon: Landmark, desc: '充值入金收款 + 提现出金打款账户', summary: () => `收款+打款 · ${platformAccounts.deposit.bank}`, sensitive: true },
  { key: 'brand', name: '平台品牌信息', icon: Building2, desc: '公司名 / 牌照 / 版本号（About / 登录页 / 法务文本）', summary: () => `${platformBrand.nameZh} · ${platformBrand.licenseType} · v${platformBrand.appVersion}`, sensitive: true },
];

export default function AdminConfig({ admin }) {
  const operator = admin?.name || '系统管理员';

  // 清单保存反馈（每行独立 flash，定位到对应配置项旁）
  const [saved, setSaved] = useState({});
  const [tick, setTick] = useState(0);
  const flash = (key) => { setSaved(prev => ({ ...prev, [key]: true })); setTimeout(() => { setSaved(prev => ({ ...prev, [key]: false })); setTick(t => t + 1); }, 1500); };

  // 抽屉：当前编辑的配置项 key（null = 关闭）
  const [editKey, setEditKey] = useState(null);
  const drawerOpen = !!editKey;

  // 各配置抽屉的编辑 state（打开时从共享数据重置）
  const [presetWan, setPresetWan] = useState('');
  const [presetErr, setPresetErr] = useState('');
  const [sectorList, setSectorList] = useState([...sectors]);
  const [newSector, setNewSector] = useState('');
  const [sectorErr, setSectorErr] = useState('');
  const [rates, setRates] = useState(() => Object.keys(exchangeRates).map(k => ({ key: k, ...exchangeRates[k] })));
  const [ratesErr, setRatesErr] = useState('');
  const [contact, setContact] = useState({ ...businessContact });
  const [contactErr, setContactErr] = useState('');
  const [accounts, setAccounts] = useState(() => ({ deposit: { ...platformAccounts.deposit }, depositUsd: { ...(platformAccounts.depositUsd || {}) }, withdraw: { ...platformAccounts.withdraw }, withdrawUsd: { ...(platformAccounts.withdrawUsd || {}) } }));
  const [accountErr, setAccountErr] = useState('');
  const [brand, setBrand] = useState({ ...platformBrand });
  const [brandErr, setBrandErr] = useState('');

  // ---- FAQ 抽屉（即时写回型：新增/编辑/删除即保存，"完成"关闭） ----
  const EMPTY_FAQ_FORM = { qCN: '', qHK: '', qEN: '', aCN: '', aHK: '', aEN: '' };
  const [faqEditing, setFaqEditing] = useState(null); // null=收起 | 'new'=新增 | 数字=编辑该条下标
  const [faqForm, setFaqForm] = useState(EMPTY_FAQ_FORM);
  const [faqErr, setFaqErr] = useState('');
  const formToFaq = (f) => ({ q: { 'zh-CN': f.qCN, 'zh-HK': f.qHK, en: f.qEN }, a: { 'zh-CN': f.aCN, 'zh-HK': f.aHK, en: f.aEN } });
  const faqToForm = (f) => ({ qCN: f.q['zh-CN'], qHK: f.q['zh-HK'] || '', qEN: f.q.en || '', aCN: f.a['zh-CN'], aHK: f.a['zh-HK'] || '', aEN: f.a.en || '' });

  const openFaqNew = () => { setFaqEditing('new'); setFaqForm({ ...EMPTY_FAQ_FORM }); setFaqErr(''); };
  const openFaqEdit = (i) => { setFaqEditing(i); setFaqForm(faqToForm(faqItems[i])); setFaqErr(''); };
  const closeFaqForm = () => { setFaqEditing(null); setFaqErr(''); };

  const handleFaqAdd = () => {
    const res = addFaqItem(formToFaq(faqForm), operator);
    if (!res.ok) { setFaqErr(res.error); return; }
    setFaqErr(''); setFaqForm({ ...EMPTY_FAQ_FORM }); setFaqEditing(null); flash('faq');
  };
  const handleFaqSave = (i) => {
    const res = updateFaqItem(i, formToFaq(faqForm), operator);
    if (!res.ok) { setFaqErr(res.error); return; }
    setFaqErr(''); setFaqEditing(null); flash('faq');
  };
  const handleFaqRemove = (i) => {
    if (!window.confirm(`删除该 FAQ「${faqItems[i].q['zh-CN']}」？用户侧帮助中心将不再显示。`)) return;
    const res = removeFaqItem(i, operator);
    if (!res.ok) { setFaqErr(res.error); return; }
    setFaqErr(''); if (faqEditing === i) closeFaqForm(); flash('faq');
  };

  const openEdit = (key) => {
    setEditKey(key);
    // 打开时重置编辑 state（组件常驻，需从共享数据回读最新值）
    if (key === 'sectors') setSectorList([...sectors]);
    if (key === 'rates') setRates(Object.keys(exchangeRates).map(k => ({ key: k, ...exchangeRates[k] })));
    if (key === 'contact') setContact({ ...businessContact });
    if (key === 'accounts') setAccounts({ deposit: { ...platformAccounts.deposit }, depositUsd: { ...(platformAccounts.depositUsd || {}) }, withdraw: { ...platformAccounts.withdraw }, withdrawUsd: { ...(platformAccounts.withdrawUsd || {}) } });
    if (key === 'brand') setBrand({ ...platformBrand });
    if (key === 'terms') { setLegalDocId('user-agreement'); setLegalLang('zh-CN'); loadLegalDraft('user-agreement', 'zh-CN'); setTermsTag(''); }
    if (key === 'faq') { setFaqEditing(null); setFaqForm({ ...EMPTY_FAQ_FORM }); }
    setPresetErr(''); setSectorErr(''); setRatesErr(''); setContactErr(''); setAccountErr(''); setBrandErr(''); setFaqErr('');
    setNewSector(''); setPresetWan('');
  };

  const closeEdit = () => setEditKey(null);

  // 统一抽屉行为：滚动锁定 + Esc 关闭
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeEdit(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  // ---- 档位抽屉（即时写回：增删即保存，"完成"关闭） ----
  const handlePresetAdd = () => {
    const wan = Number(presetWan);
    if (!Number.isFinite(wan) || wan <= 0) { setPresetErr('请输入大于 0 的金额（万）'); return; }
    const res = addAmountPreset(wan * 10000, operator);
    if (!res.ok) { setPresetErr(res.error); return; }
    setPresetErr(''); setPresetWan(''); flash('presets');
  };
  const handlePresetRemove = (p) => {
    if (!window.confirm(`删除申购金额档位「${p.label}」？用户侧申购弹框将不再显示该档位。`)) return;
    const res = removeAmountPreset(p.value, operator);
    if (!res.ok) { setPresetErr(res.error); return; }
    setPresetErr(''); flash('presets');
  };

  // ---- 行业抽屉（即时写回 + 删除确认 + 被项目引用禁删） ----
  const handleSectorAdd = () => {
    const s = newSector.trim();
    if (!s) { setSectorErr('请输入行业名称'); return; }
    if (sectorList.includes(s)) { setSectorErr('该行业已存在'); return; }
    sectorList.push(s); setNewSector(''); setSectorList([...sectorList]);
    sectors.push(s);
    logAudit({ operator, category: 'config', action: 'update', target: '行业分类', targetId: '', note: `新增行业：${s}` });
    Storage.save(); setSectorErr(''); flash('sectors');
  };
  const handleSectorRemove = (s) => {
    if (projects.some(p => p.sector === s)) { setSectorErr(`行业「${s}」已被项目引用，不能删除`); return; }
    if (!window.confirm(`删除行业「${s}」？`)) return;
    const next = sectorList.filter(x => x !== s);
    setSectorList(next);
    sectors.splice(sectors.indexOf(s), 1);
    logAudit({ operator, category: 'config', action: 'update', target: '行业分类', targetId: '', note: `删除行业：${s}` });
    Storage.save(); setSectorErr(''); flash('sectors');
  };

  // ---- 汇率抽屉 ----
  const handleRateChange = (i, val) => { const next = [...rates]; next[i] = { ...next[i], rate: val }; setRates(next); };
  const handleRatesSave = () => {
    for (const r of rates) {
      const v = Number(r.rate);
      if (!Number.isFinite(v) || v <= 0) { setRatesErr(`「${r.from} → ${r.to}」汇率需大于 0`); return; }
    }
    rates.forEach(r => { if (exchangeRates[r.key]) exchangeRates[r.key].rate = Number(r.rate); });
    logAudit({ operator, category: 'config', action: 'update', target: '汇率配置', targetId: '', note: '更新汇率（hkd-usd/usd-hkd/cny-hkd）' });
    Storage.save(); setRatesErr(''); flash('rates'); closeEdit();
  };
  const handleRatesReset = () => {
    if (!window.confirm('恢复默认汇率？当前修改将被覆盖。')) return;
    resetExchangeRates(operator);
    setRates(Object.keys(exchangeRates).map(k => ({ key: k, ...exchangeRates[k] })));
    flash('rates');
  };

  // ---- 商务联系抽屉 ----
  const handleContactSave = () => {
    const c = { email: contact.email.trim(), phone: contact.phone.trim(), whatsapp: contact.whatsapp.trim() };
    if (!c.email) { setContactErr('请填写商务邮箱'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) { setContactErr('邮箱格式不正确'); return; }
    if (!/^\+?[\d\s-]{7,}$/.test(c.phone)) { setContactErr('电话格式不正确（如 +852 3568 8888）'); return; }
    if (!/^\+?[\d\s-]{7,}$/.test(c.whatsapp)) { setContactErr('WhatsApp 号码格式不正确'); return; }
    Object.assign(businessContact, c);
    logAudit({ operator, category: 'config', action: 'update', target: '商务联系方式', targetId: '', note: '更新商务联系方式（对外 BD）' });
    Storage.save(); setContactErr(''); flash('contact'); closeEdit();
  };

  // ---- 平台资金账户抽屉 ----
  const handleAccountChange = (kind, field, val) => { setAccounts(prev => ({ ...prev, [kind]: { ...prev[kind], [field]: val } })); };
  const handleAccountSave = (kind) => {
    const res = updatePlatformAccounts(kind, accounts[kind], operator);
    if (!res.ok) { setAccountErr(`「${kind === 'deposit' ? '收款账户' : '打款账户'}」${res.error}`); return; }
    setAccountErr(''); flash('accounts');
  };
  const accountField = (kind, label, field, placeholder) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" value={accounts[kind][field] ?? ''} placeholder={placeholder} onChange={e => handleAccountChange(kind, field, e.target.value)} />
    </div>
  );

  // ---- 品牌信息抽屉 ----
  const handleBrandSave = () => {
    const res = updatePlatformBrand(brand, operator);
    if (!res.ok) { setBrandErr(res.error); return; }
    setBrandErr(''); flash('brand'); closeEdit();
  };

  // ---- 条款版本（2026-09-15 · 对齐公司实践"条款更新→重新同意"）：发布新版 → 用户端登录后弹窗重新勾选 ----
  // ---- 协议文案维护（2026-11-03 · 法务维护入口原型）：协议 × 语言 tab，小节标题/段落逐条编辑，保存写回 agreements ----
  const LEGAL_DOCS = [
    { id: 'user-agreement', name: '使用条款' },
    { id: 'risk-disclosure', name: '风险披露' },
    { id: 'privacy-policy', name: '隐私政策' },
  ];
  const LEGAL_LANGS = [
    { key: 'zh-CN', label: '简体' },
    { key: 'zh-HK', label: '繁體' },
    { key: 'en', label: 'English' },
  ];
  const [termsTag, setTermsTag] = useState('');   // 抽屉内动作反馈（已保存 / 已发布）
  const [, setTermsTick] = useState(0);
  const [legalDocId, setLegalDocId] = useState('user-agreement');
  const [legalLang, setLegalLang] = useState('zh-CN');
  const [legalDraft, setLegalDraft] = useState(''); // 当前协议 × 语言的纯文本草稿（一行一段，## 开头 = 小节标题）
  // sections → 纯文本：小节间空行分隔，标题行加 ## 前缀（标题为空的小节只出段落）
  const serializeLegal = (sections, lang) => sections.map(sec => [
    sec.h[lang] ? `## ${sec.h[lang]}` : null,
    ...sec.p.map(t => t[lang]),
  ].filter(Boolean).join('\n')).join('\n\n');
  const loadLegalDraft = (id, lang) => {
    const doc = agreements.find(a => a.id === id);
    setLegalDraft(doc ? serializeLegal(doc.sections, lang) : '');
  };
  // 纯文本 → sections（保存时转换）：'## ' 开头 = 新小节标题，其余非空行 = 段落；
  // 其他两语按小节序号/段落序号从原文回填（增删行后另一语请在其页签下对照维护，保持行结构一致）
  const parseLegalText = (text, prev, lang) => {
    const other = ['zh-CN', 'zh-HK', 'en'].filter(l => l !== lang);
    const prevHeads = prev.map(s => s.h);
    const prevParas = prev.flatMap(s => s.p);
    const out = [];
    let cur = null;
    let ki = 0;
    text.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('## ')) {
        cur = { h: { 'zh-CN': '', 'zh-HK': '', en: '' }, p: [] };
        cur.h[lang] = line.slice(3).trim();
        const ph = prevHeads[out.length];
        if (ph) other.forEach(l => { cur.h[l] = ph[l] || ''; });
        out.push(cur);
      } else {
        if (!cur) { cur = { h: { 'zh-CN': '', 'zh-HK': '', en: '' }, p: [] }; out.push(cur); }
        const t = { 'zh-CN': '', 'zh-HK': '', en: '' };
        t[lang] = line;
        const pt = prevParas[ki];
        if (pt) other.forEach(l => { t[l] = pt[l] || ''; });
        ki++;
        cur.p.push(t);
      }
    });
    return out;
  };
  const handleBumpTerms = () => {
    if (!window.confirm(`发布新版条款（当前 ${termsState.currentVersion}）？发布后所有用户需重新确认协议。`)) return;
    bumpTermsVersion(operator);
    setTermsTag('已发布');
    setTimeout(() => { setTermsTag(''); setTermsTick(t => t + 1); }, 1500);
  };
  const handleLegalSave = () => {
    const doc = agreements.find(a => a.id === legalDocId);
    updateAgreementSections(legalDocId, parseLegalText(legalDraft, doc?.sections || [], legalLang), operator);
    setTermsTag('已保存');
    setTimeout(() => { setTermsTag(''); setTermsTick(t => t + 1); }, 1500);
  };

  // ---- 抽屉 body 按当前 editKey 渲染 ----
  const renderDrawerBody = () => {
    switch (editKey) {
      case 'presets':
        return (
          <>
            <div className="admin-config-list">
              {amountPresets.map(p => (
                <div key={p.value} className="admin-config-row">
                  <span><strong>{p.label}</strong> <span className="text-muted text-sm">· {p.value.toLocaleString()} HKD</span></span>
                  <button className="btn-icon" title={`删除档位 ${p.label}`} disabled={amountPresets.length <= 1} onClick={() => handlePresetRemove(p)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group">
                <input className="form-input" placeholder="新增档位金额（万，如 200）" value={presetWan} onChange={e => setPresetWan(e.target.value)} />
              </div>
              <div className="form-group admin-flex-end">
                <button className="btn btn-primary btn-md" onClick={handlePresetAdd}><Plus size={15} /> 添加档位</button>
              </div>
            </div>
            {presetErr && <p className="form-error">{presetErr}</p>}
            <div className="admin-form-hint">档位保存后立即生效——用户侧申购弹框实时读取，无需改代码；至少保留 1 个档位。</div>
          </>
        );
      case 'sectors':
        return (
          <>
            <div className="admin-config-list">
              {sectorList.map(s => {
                const inUse = projects.some(p => p.sector === s);
                return (
                  <div key={s} className="admin-config-row">
                    <span>{s}{inUse && <span className="text-muted text-sm"> · 已有项目引用</span>}</span>
                    <button className="btn-icon" title={inUse ? '该行业已被项目引用，不能删除' : '删除行业'} disabled={inUse} onClick={() => handleSectorRemove(s)}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
            <div className="form-row">
              <div className="form-group">
                <input className="form-input" placeholder="新增行业（如：半导体）" value={newSector} onChange={e => setNewSector(e.target.value)} />
              </div>
              <div className="form-group admin-flex-end">
                <button className="btn btn-outline btn-md" onClick={handleSectorAdd}><Plus size={15} /> 添加</button>
              </div>
            </div>
            {sectorErr && <p className="form-error">{sectorErr}</p>}
          </>
        );
      case 'rates':
        return (
          <>
            <div className="admin-config-list">
              {rates.map((r, i) => (
                <div key={r.key} className="admin-config-row">
                  <span><strong>{r.from} → {r.to}</strong></span>
                  <input type="number" step="0.0001" min="0.0001" className="form-input admin-config-rate" value={r.rate} onChange={e => handleRateChange(i, e.target.value)} />
                </div>
              ))}
            </div>
            {ratesErr && <p className="form-error">{ratesErr}</p>}
          </>
        );
      case 'faq':
        return (
          <>
            <div className="admin-config-list">
              {faqItems.map((f, i) => (
                <div key={i}>
                  <div className="admin-config-row">
                    <span><strong>{f.q['zh-CN']}</strong></span>
                    <span className="admin-flex-end" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn-icon" title={faqEditing === i ? '收起编辑' : '编辑该条'} onClick={() => (faqEditing === i ? closeFaqForm() : openFaqEdit(i))}><Edit3 size={14} /></button>
                      <button className="btn-icon" title="删除该条" onClick={() => handleFaqRemove(i)}><Trash2 size={14} /></button>
                    </span>
                  </div>
                  {faqEditing === i && (
                    <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                      {(() => {
                        const setF = (k) => (e) => setFaqForm(prev => ({ ...prev, [k]: e.target.value }));
                        return (
                          <>
                            <div className="form-group">
                              <label className="form-label">问题 · 简体（必填）</label>
                              <input className="form-input" value={faqForm.qCN} onChange={setF('qCN')} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">问题 · 繁體</label>
                                <input className="form-input" value={faqForm.qHK} onChange={setF('qHK')} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">问题 · English</label>
                                <input className="form-input" value={faqForm.qEN} onChange={setF('qEN')} />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label">答案 · 简体（必填）</label>
                              <textarea className="form-input" rows={3} value={faqForm.aCN} onChange={setF('aCN')} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label className="form-label">答案 · 繁體</label>
                                <textarea className="form-input" rows={3} value={faqForm.aHK} onChange={setF('aHK')} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">答案 · English</label>
                                <textarea className="form-input" rows={3} value={faqForm.aEN} onChange={setF('aEN')} />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                      <div className="admin-form-actions">
                        <button className="btn btn-primary btn-md" onClick={() => handleFaqSave(i)}><Save size={15} /> 保存修改</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {faqEditing === 'new' ? (
              <div style={{ padding: 'var(--space-3)', marginTop: 'var(--space-3)', background: 'var(--surface-secondary, rgba(0,0,0,0.02))', borderRadius: 'var(--radius-md)' }}>
                {(() => {
                  const setF = (k) => (e) => setFaqForm(prev => ({ ...prev, [k]: e.target.value }));
                  return (
                    <>
                      <div className="form-group">
                        <label className="form-label">问题 · 简体（必填）</label>
                        <input className="form-input" placeholder="如：出金一般多久到账？" value={faqForm.qCN} onChange={setF('qCN')} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">问题 · 繁體</label>
                          <input className="form-input" value={faqForm.qHK} onChange={setF('qHK')} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">问题 · English</label>
                          <input className="form-input" value={faqForm.qEN} onChange={setF('qEN')} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">答案 · 简体（必填）</label>
                        <textarea className="form-input" rows={3} value={faqForm.aCN} onChange={setF('aCN')} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">答案 · 繁體</label>
                          <textarea className="form-input" rows={3} value={faqForm.aHK} onChange={setF('aHK')} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">答案 · English</label>
                          <textarea className="form-input" rows={3} value={faqForm.aEN} onChange={setF('aEN')} />
                        </div>
                      </div>
                    </>
                  );
                })()}
                <div className="admin-form-actions">
                  <button className="btn btn-primary btn-md" onClick={handleFaqAdd}><Plus size={15} /> 添加 FAQ</button>
                </div>
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group admin-flex-end">
                  <button className="btn btn-outline btn-md" onClick={openFaqNew}><Plus size={15} /> 新增 FAQ</button>
                </div>
              </div>
            )}
            {faqErr && <p className="form-error">{faqErr}</p>}
            <div className="admin-form-hint">简体必填；繁體/英文留空时用户端对应语言回退显示简体。保存后立即生效——用户侧帮助中心实时读取。</div>
          </>
        );
      case 'contact':
        return (
          <>
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input className="form-input" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">电话</label>
                <input className="form-input" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-input" value={contact.whatsapp} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} />
              </div>
            </div>
            {contactErr && <p className="form-error">{contactErr}</p>}
          </>
        );
      case 'accounts':
        return (
          <>
            <div className="admin-config-account-title">收款账户（港币入金）</div>
            <div className="form-row">
              {accountField('deposit', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('deposit', '户名', 'accountName', '如：HKBTC Limited')}
            </div>
            <div className="form-row">
              {accountField('deposit', '账号', 'accountNo', '如：004-123456-789')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <input className="form-input" value="HKD" readOnly />
              </div>
            </div>
            {/* 2026-10-29：国际电汇字段——APP 充值页的「国际电汇需填」折叠区读的就是这三个值 */}
            <div className="form-row">
              {accountField('deposit', '银行名称（英文）', 'bankNameEn', '如：DBS Bank (Hong Kong) Limited')}
              {accountField('deposit', 'SWIFT 代码', 'swift', '如：DHBKHKHH')}
            </div>
            <div className="form-row">
              {accountField('deposit', '银行编号', 'bankCode', '如：016')}
              {accountField('deposit', '银行地址（英文）', 'bankAddress', '如：11/F, 248 Queen\'s Road East, Wan Chai, Hong Kong')}
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('deposit')}><Save size={15} /> 保存港币收款账户</button>
            </div>

            {/* 2026-11-03 多币种闭环：美元收款账户独立配置。
                APP 充值页选中 USD 时读这一组；币种固定 USD，不允许在后台改。 */}
            <div className="admin-config-account-title">收款账户（美元入金）</div>
            <div className="form-row">
              {accountField('depositUsd', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('depositUsd', '户名', 'accountName', '如：HighBlock Securities Limited Client AC')}
            </div>
            <div className="form-row">
              {accountField('depositUsd', '账号', 'accountNo', '如：016-456-000-5678')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <input className="form-input" value="USD" readOnly />
              </div>
            </div>
            <div className="form-row">
              {accountField('depositUsd', '银行名称（英文）', 'bankNameEn', '如：DBS Bank (Hong Kong) Limited')}
              {accountField('depositUsd', 'SWIFT 代码', 'swift', '如：DHBKHKHH')}
            </div>
            <div className="form-row">
              {accountField('depositUsd', '银行编号', 'bankCode', '如：016')}
              {accountField('depositUsd', '银行地址（英文）', 'bankAddress', '如：11/F, 248 Queen\'s Road East, Wan Chai, Hong Kong')}
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('depositUsd')}><Save size={15} /> 保存美元收款账户</button>
            </div>

            {/* 打款账户用途说明（2026-11-03 用户确认口径）：仅作单据展示，不驱动打款 */}
            <p className="admin-form-hint">打款账户仅用于出金审核单据展示「本单汇出账户」，供财务线下汇出时核对；平台未对接银行 API，不驱动实际打款。</p>
            <div className="admin-config-account-title">打款账户（港币出金）</div>
            <div className="form-row">
              {accountField('withdraw', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('withdraw', '户名', 'accountName', '如：HKBTC Limited')}
            </div>
            <div className="form-row">
              {accountField('withdraw', '账号', 'accountNo', '如：004-123456-789')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <input className="form-input" value="HKD" readOnly />
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('withdraw')}><Save size={15} /> 保存港币打款账户</button>
            </div>

            {/* 2026-11-03：美元打款账户独立配置。出金审核抽屉按单据币种读这一组，
                没配就显式报「未配置 USD 打款账户」，不会退回港币账户硬打。 */}
            <div className="admin-config-account-title">打款账户（美元出金）</div>
            <div className="form-row">
              {accountField('withdrawUsd', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('withdrawUsd', '户名', 'accountName', '如：HighBlock Securities Limited')}
            </div>
            <div className="form-row">
              {accountField('withdrawUsd', '账号', 'accountNo', '如：016-456-000-5678')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <input className="form-input" value="USD" readOnly />
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('withdrawUsd')}><Save size={15} /> 保存美元打款账户</button>
            </div>
            {accountErr && <p className="form-error">{accountErr}</p>}
          </>
        );
      case 'brand':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">平台简称</label>
                <input className="form-input" value={brand.nameZh} placeholder="如：HighBlock" onChange={e => setBrand({ ...brand, nameZh: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">公司全称</label>
                <input className="form-input" value={brand.nameFullZh} placeholder="如：HighBlock Securities Limited" onChange={e => setBrand({ ...brand, nameFullZh: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">英文名</label>
                <input className="form-input" value={brand.nameEn} placeholder="如：HighBlock Securities Limited" onChange={e => setBrand({ ...brand, nameEn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">牌照编号（SFC NO）</label>
                <input className="form-input" value={brand.licenseNo} placeholder="如：BWW124" onChange={e => setBrand({ ...brand, licenseNo: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">牌照类型</label>
                <input className="form-input" value={brand.licenseType} placeholder="如：香港证监会第 1、4、9 类牌照" onChange={e => setBrand({ ...brand, licenseType: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">受规管活动</label>
                <input className="form-input" value={brand.licenseDesc} placeholder="如：证券交易 · 就证券提供意见 · 资产管理" onChange={e => setBrand({ ...brand, licenseDesc: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">应用版本号</label>
                <input className="form-input" value={brand.appVersion} placeholder="如：2.0.0（与应用市场注册版本一致）" onChange={e => setBrand({ ...brand, appVersion: e.target.value })} />
              </div>
              <div className="form-group" />
            </div>
            {brandErr && <p className="form-error">{brandErr}</p>}
            <div className="admin-form-hint">{'品牌信息展示于「关于」页与登录页；牌照类型/编号同时注入法务协议文本与基金名（{{BRAND}} 占位插值），改这里即全端生效。版本号须与应用市场注册版本一致。'}</div>
          </>
        );
      case 'terms':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">当前版本</label>
                <input className="form-input" value={termsState.currentVersion} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">上次发布时间</label>
                <input className="form-input date-iso" value={termsState.updatedAt || '—'} readOnly />
              </div>
            </div>

            {/* 协议 × 语言切换（切换即从已保存版本重新载入纯文本，未保存编辑不保留） */}
            <div className="admin-config-legal-bar">
              <div className="admin-config-legal-tabs">
                {LEGAL_DOCS.map(d => (
                  <button key={d.id} className={legalDocId === d.id ? 'admin-config-legal-tab is-active' : 'admin-config-legal-tab'} onClick={() => { setLegalDocId(d.id); loadLegalDraft(d.id, legalLang); }}>{d.name}</button>
                ))}
              </div>
              <div className="admin-config-legal-tabs">
                {LEGAL_LANGS.map(l => (
                  <button key={l.key} className={legalLang === l.key ? 'admin-config-legal-tab is-active' : 'admin-config-legal-tab'} onClick={() => { setLegalLang(l.key); loadLegalDraft(legalDocId, l.key); }}>{l.label}</button>
                ))}
              </div>
            </div>

            <textarea
              className="form-input admin-config-legal-textarea"
              rows={16}
              value={legalDraft}
              onChange={e => setLegalDraft(e.target.value)}
              placeholder={'每行一段，直接编辑正文；「## 开头的行」为小节标题；空行仅作小节分隔。'}
            />

            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={handleLegalSave}><Save size={15} /> 保存{LEGAL_DOCS.find(d => d.id === legalDocId)?.name}文案</button>
              <button className="btn btn-md btn-outline" onClick={handleBumpTerms}><FileText size={15} /> 发布新版（演示）</button>
              {termsTag && <span className="admin-saved-tag">{termsTag}</span>}
            </div>

            <div className="admin-form-hint">纯文本维护（原型演示法务入口，上线后迁后端可配，见执行清单 #43）：每行一段、「## 行」为小节标题；保存即写回，用户端协议页即时可读。三语行结构需保持一致（另两语在对应页签下对照维护）；发布链路：文案改定 → 「发布新版」推进版本号（二次确认）→ 用户端下次进入弹「条款已更新」重新同意。</div>
          </>
        );
      default:
        return null;
    }
  };

  const editTitle = !editKey ? '' : editKey === 'terms' ? '条款版本' : CONFIG_ITEMS.find(i => i.key === editKey)?.name;
  const isPresetsLike = editKey === 'presets' || editKey === 'sectors' || editKey === 'faq'; // 即时写回型（"完成"关闭）
  const isAccounts = editKey === 'accounts'; // 内部两个保存按钮，抽屉"完成"关闭
  const isRates = editKey === 'rates';       // 保存 + 恢复默认
  const hasSaveAction = editKey === 'contact' || editKey === 'brand';

  // 页内分级（2026-10-19）：sensitive 配置（资金账户/品牌）与条款发布仅 super 可见；
  // ops 保留 config 菜单管理日常运营参数（档位/行业/汇率/商务联系/FAQ）
  const isSuper = admin?.role === 'super';
  const opsItems = CONFIG_ITEMS.filter(i => !i.sensitive);
  const complianceItems = CONFIG_ITEMS.filter(i => i.sensitive);

  // 抽屉保存语义标注（呈现层：4 种按钮组合统一预告「改了什么时候生效」，降低每次重学成本）
  const isImmediateKey = k => k === 'presets' || k === 'sectors' || k === 'faq';
  const drawerSemantics = !editKey ? '' : isImmediateKey(editKey) ? '修改即时生效'
    : editKey === 'accounts' ? '各账户独立保存，保存后生效'
    : editKey === 'terms' ? '文案保存后生效；发布版本即时生效（二次确认）' : '保存后生效';

  // 配置卡片：图标 + 名称 + 说明 + 当前值（点卡或 [编辑] 打开抽屉）
  const renderConfigCard = (item) => {
    const Icon = item.icon;
    return (
      <div key={item.key} className="admin-config-card" onClick={() => openEdit(item.key)} {...keyed(() => openEdit(item.key))}>
        <div className="admin-config-card-head">
          <span className="admin-config-item-icon"><Icon size={16} /></span>
          <strong className="admin-config-card-name">{item.name}</strong>
          <button className="btn-icon" title={`编辑${item.name}`} onClick={e => { e.stopPropagation(); openEdit(item.key); }}><Edit3 size={15} /></button>
        </div>
        <p className="admin-config-card-desc">{item.desc}</p>
        <div className="admin-config-card-value">
          <span className="admin-config-card-value-label">当前</span>
          <span className="admin-config-card-value-text">{item.summary()}</span>
          {saved[item.key] && <span className="admin-saved-tag">已保存</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>系统配置</h1>
      </div>

      {/* 运营参数组（ops 及以上）：日常运营参数，分级靠分组呈现而非头部教学文案 */}
      <section className="admin-config-group">
        <div className="admin-config-group-head">
          <h2 className="admin-config-group-title">运营参数</h2>
          <span className="admin-config-group-note">日常运营可调 · {opsItems.length} 项</span>
        </div>
        <div className="admin-config-grid">
          {opsItems.map(renderConfigCard)}
        </div>
      </section>

      {/* 平台与合规组（仅 super）：敏感配置带权限徽标；条款版本并入本组，消除「直操作卡 + 清单」形态混拼 */}
      {isSuper && (
        <section className="admin-config-group">
          <div className="admin-config-group-head">
            <h2 className="admin-config-group-title">平台与合规</h2>
            <span className="admin-config-badge">仅超级管理员</span>
          </div>
          <div className="admin-config-grid">
            {complianceItems.map(renderConfigCard)}
            <div className="admin-config-card" onClick={() => openEdit('terms')} {...keyed(() => openEdit('terms'))}>
              <div className="admin-config-card-head">
                <span className="admin-config-item-icon"><FileText size={16} /></span>
                <strong className="admin-config-card-name">条款版本</strong>
                <button className="btn-icon" title="编辑条款版本" onClick={e => { e.stopPropagation(); openEdit('terms'); }}><Edit3 size={15} /></button>
              </div>
              <p className="admin-config-card-desc">发布后用户端下次进入将弹出「条款已更新」，重新勾选同意后方可继续使用；同意记录写入协议签署留痕（含版本与时间）。三份协议文案（使用条款/风险披露/隐私政策，三语）由法务统一维护，后台仅发布版本号。</p>
              <div className="admin-config-card-value">
                <span className="admin-config-card-value-label">当前</span>
                <span className="admin-config-card-value-text date-iso">{termsState.currentVersion}{termsState.updatedAt ? ` · ${termsState.updatedAt}` : ''}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 配置编辑抽屉（点行/编辑 → 弹出，不占页面空间） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeEdit} />}
      {drawerOpen && (
        <div className="admin-drawer" role="dialog" aria-label={`编辑${editTitle}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">编辑「{editTitle}」</h3>
            <button className="btn-icon" title="关闭" onClick={closeEdit}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            <div className="admin-config-drawer-tag">{drawerSemantics}</div>
            {renderDrawerBody()}
          </div>
          <div className="admin-drawer-actions">
            {hasSaveAction && (
              <>
                <button className="btn btn-md btn-secondary" onClick={closeEdit}>取消</button>
                <button className="btn btn-md btn-primary" onClick={editKey === 'contact' ? handleContactSave : handleBrandSave}>
                  <Save size={15} /> 保存
                </button>
              </>
            )}
            {isPresetsLike && <button className="btn btn-md btn-primary" onClick={closeEdit}>完成</button>}
            {isRates && (
              <>
                <button className="btn btn-md btn-secondary" onClick={handleRatesReset}><RotateCcw size={15} /> 恢复默认</button>
                <button className="btn btn-md btn-primary" onClick={handleRatesSave}><Save size={15} /> 保存汇率</button>
              </>
            )}
            {isAccounts && <button className="btn btn-md btn-primary" onClick={closeEdit}>完成</button>}
            {editKey === 'terms' && <button className="btn btn-md btn-primary" onClick={closeEdit}>完成</button>}
          </div>
        </div>
      )}
    </div>
  );
}
