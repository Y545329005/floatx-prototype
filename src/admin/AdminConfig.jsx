import { useState, useEffect } from 'react';
import { Coins, Timer, Tags, ArrowLeftRight, Mail, Landmark, Building2, Edit3, Plus, Trash2, Save, RotateCcw, X } from 'lucide-react';
import {
  systemConfig, updateFreezeGraceSeconds, sectors, exchangeRates, businessContact,
  projects, amountPresets, addAmountPreset, removeAmountPreset,
  platformAccounts, updatePlatformAccounts, resetExchangeRates,
  platformBrand, updatePlatformBrand, logAudit, Storage,
} from '../mock/data';

// 配置项目录（清单行）：key / 名称 / 图标 / 说明 / 当前值摘要（实时派生）
const CONFIG_ITEMS = [
  { key: 'presets', name: '申购金额档位', icon: Coins, desc: '用户侧申购弹框的快捷金额档位', summary: () => `${amountPresets.length} 档 · ${amountPresets[0].label} ~ ${amountPresets[amountPresets.length - 1].label}` },
  { key: 'freeze', name: '冻结宽限期', icon: Timer, desc: '获配额后冻结意向金额的签署宽限期', summary: () => `${systemConfig.freezeGraceSeconds} 秒${systemConfig.freezeGraceSeconds === 30 ? '（演示）' : ''}` },
  { key: 'sectors', name: '行业分类', icon: Tags, desc: '项目 / 路演的行业分类选项', summary: () => `${sectors.length} 个` },
  { key: 'rates', name: '汇率配置', icon: ArrowLeftRight, desc: '法币换汇参考汇率', summary: () => `${Object.keys(exchangeRates).length} 对 · ${exchangeRates['hkd-usd'].from}↔${exchangeRates['hkd-usd'].to} ${exchangeRates['hkd-usd'].rate}` },
  { key: 'contact', name: '商务联系方式', icon: Mail, desc: '对外 BD 联系（登录页 / 路演列表）', summary: () => businessContact.email },
  { key: 'accounts', name: '平台资金账户', icon: Landmark, desc: '充值入金收款 + 提现出金打款账户', summary: () => `收款+打款 · ${platformAccounts.deposit.bank}` },
  { key: 'brand', name: '平台品牌信息', icon: Building2, desc: '公司名 / 英文名 / 牌照编号（About / 登录页）', summary: () => `${platformBrand.nameZh} · CE No. ${platformBrand.licenseNo}` },
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
  const [freezeSec, setFreezeSec] = useState(systemConfig.freezeGraceSeconds);
  const [freezeErr, setFreezeErr] = useState('');
  const [sectorList, setSectorList] = useState([...sectors]);
  const [newSector, setNewSector] = useState('');
  const [sectorErr, setSectorErr] = useState('');
  const [rates, setRates] = useState(() => Object.keys(exchangeRates).map(k => ({ key: k, ...exchangeRates[k] })));
  const [ratesErr, setRatesErr] = useState('');
  const [contact, setContact] = useState({ ...businessContact });
  const [contactErr, setContactErr] = useState('');
  const [accounts, setAccounts] = useState(() => ({ deposit: { ...platformAccounts.deposit }, withdraw: { ...platformAccounts.withdraw } }));
  const [accountErr, setAccountErr] = useState('');
  const [brand, setBrand] = useState({ ...platformBrand });
  const [brandErr, setBrandErr] = useState('');

  const openEdit = (key) => {
    setEditKey(key);
    // 打开时重置编辑 state（组件常驻，需从共享数据回读最新值）
    if (key === 'freeze') setFreezeSec(systemConfig.freezeGraceSeconds);
    if (key === 'sectors') setSectorList([...sectors]);
    if (key === 'rates') setRates(Object.keys(exchangeRates).map(k => ({ key: k, ...exchangeRates[k] })));
    if (key === 'contact') setContact({ ...businessContact });
    if (key === 'accounts') setAccounts({ deposit: { ...platformAccounts.deposit }, withdraw: { ...platformAccounts.withdraw } });
    if (key === 'brand') setBrand({ ...platformBrand });
    setPresetErr(''); setFreezeErr(''); setSectorErr(''); setRatesErr(''); setContactErr(''); setAccountErr(''); setBrandErr('');
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

  // ---- 宽限期抽屉 ----
  const handleFreezeSave = () => {
    const s = Number(freezeSec);
    if (!Number.isFinite(s) || s < 10 || s > 86400) { setFreezeErr('请输入 10~86400 之间的秒数'); return; }
    updateFreezeGraceSeconds(s); setFreezeErr(''); flash('freeze'); closeEdit();
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
      <input className="form-input" value={accounts[kind][field]} placeholder={placeholder} onChange={e => handleAccountChange(kind, field, e.target.value)} />
    </div>
  );

  // ---- 品牌信息抽屉 ----
  const handleBrandSave = () => {
    const res = updatePlatformBrand(brand, operator);
    if (!res.ok) { setBrandErr(res.error); return; }
    setBrandErr(''); flash('brand'); closeEdit();
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
      case 'freeze':
        return (
          <>
            <div className="form-group">
              <label className="form-label">宽限期（秒）</label>
              <input type="number" className="form-input" min={10} max={86400} value={freezeSec} onChange={e => setFreezeSec(e.target.value)} />
            </div>
            <div className="admin-form-hint">演示默认 30 秒；真实生产 24 小时（86400 秒）。</div>
            {freezeErr && <p className="form-error">{freezeErr}</p>}
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
            <div className="admin-config-account-title">收款账户（投资人充值入金）</div>
            <div className="form-row">
              {accountField('deposit', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('deposit', '户名', 'accountName', '如：Zhifu Capital Limited')}
            </div>
            <div className="form-row">
              {accountField('deposit', '账号', 'accountNo', '如：004-123456-789')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <select className="form-input" value={accounts.deposit.currency} onChange={e => handleAccountChange('deposit', 'currency', e.target.value)}>
                  <option value="HKD">HKD</option><option value="USD">USD</option><option value="CNY">CNY</option>
                </select>
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('deposit')}><Save size={15} /> 保存收款账户</button>
            </div>
            <div className="admin-config-account-title">打款账户（投资人提现出金）</div>
            <div className="form-row">
              {accountField('withdraw', '银行', 'bank', '如：星展银行（香港）')}
              {accountField('withdraw', '户名', 'accountName', '如：Zhifu Capital Limited')}
            </div>
            <div className="form-row">
              {accountField('withdraw', '账号', 'accountNo', '如：004-123456-789')}
              <div className="form-group">
                <label className="form-label">币种</label>
                <select className="form-input" value={accounts.withdraw.currency} onChange={e => handleAccountChange('withdraw', 'currency', e.target.value)}>
                  <option value="HKD">HKD</option><option value="USD">USD</option><option value="CNY">CNY</option>
                </select>
              </div>
            </div>
            <div className="admin-form-actions">
              <button className="btn btn-primary btn-md" onClick={() => handleAccountSave('withdraw')}><Save size={15} /> 保存打款账户</button>
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
                <input className="form-input" value={brand.nameZh} placeholder="如：财富资本" onChange={e => setBrand({ ...brand, nameZh: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">公司全称</label>
                <input className="form-input" value={brand.nameFullZh} placeholder="如：财富资本有限公司" onChange={e => setBrand({ ...brand, nameFullZh: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">英文名</label>
                <input className="form-input" value={brand.nameEn} placeholder="如：Zhifu Capital Limited" onChange={e => setBrand({ ...brand, nameEn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">牌照编号（CE No.）</label>
                <input className="form-input" value={brand.licenseNo} placeholder="如：BLA1234" onChange={e => setBrand({ ...brand, licenseNo: e.target.value })} />
              </div>
            </div>
            {brandErr && <p className="form-error">{brandErr}</p>}
            <div className="admin-form-hint">品牌信息展示于「关于」页与登录页；接后端由平台资料接口提供。</div>
          </>
        );
      default:
        return null;
    }
  };

  const editTitle = editKey ? CONFIG_ITEMS.find(i => i.key === editKey)?.name : '';
  const isPresetsLike = editKey === 'presets' || editKey === 'sectors'; // 即时写回型（"完成"关闭）
  const isAccounts = editKey === 'accounts'; // 内部两个保存按钮，抽屉"完成"关闭
  const isRates = editKey === 'rates';       // 保存 + 恢复默认
  const hasSaveAction = editKey === 'freeze' || editKey === 'contact' || editKey === 'brand';

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>系统配置</h1>
        <div className="admin-page-header-actions">
          <span className="text-muted">共 {CONFIG_ITEMS.length} 项配置 · 点击行或 [编辑] 修改</span>
        </div>
      </div>

      {/* 配置项清单（一眼看到所有配置 + 当前值摘要） */}
      <div className="admin-config-list admin-config-catalog">
        {CONFIG_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="admin-config-item" onClick={() => openEdit(item.key)}>
              <span className="admin-config-item-icon"><Icon size={16} /></span>
              <div className="admin-config-item-body">
                <strong>{item.name}</strong>
                <span className="text-muted text-sm">{item.desc}</span>
              </div>
              <span className="admin-config-item-summary">{item.summary()}</span>
              {saved[item.key] && <span className="admin-saved-tag">已保存</span>}
              <button
                className="btn-icon"
                title={`编辑${item.name}`}
                onClick={e => { e.stopPropagation(); openEdit(item.key); }}
              >
                <Edit3 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 配置编辑抽屉（点行/编辑 → 弹出，不占页面空间） */}
      {drawerOpen && <div className="admin-drawer-mask" onClick={closeEdit} />}
      {drawerOpen && (
        <div className="admin-drawer" role="dialog" aria-label={`编辑${editTitle}`}>
          <div className="admin-drawer-head">
            <h3 className="admin-drawer-title">编辑「{editTitle}」</h3>
            <button className="btn-icon" title="关闭" onClick={closeEdit}><X size={18} /></button>
          </div>
          <div className="admin-drawer-body">
            {renderDrawerBody()}
          </div>
          <div className="admin-drawer-actions">
            {hasSaveAction && (
              <>
                <button className="btn btn-md btn-secondary" onClick={closeEdit}>取消</button>
                <button className="btn btn-md btn-primary" onClick={editKey === 'freeze' ? handleFreezeSave : editKey === 'contact' ? handleContactSave : handleBrandSave}>
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
          </div>
        </div>
      )}
    </div>
  );
}
