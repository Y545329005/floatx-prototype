import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Upload, Check, AlertCircle, ChevronDown, X } from 'lucide-react';
import { useLang } from '../i18n';
import BottomPicker from '../components/BottomPicker';
import DateWheelPicker from '../components/DateWheelPicker';
import AccountRow from '../components/AccountRow';
import {
  platformDepositAccount, platformAccounts,
  JURISDICTIONS, jurisdictionLabel, submitKycBankTransfer,
} from '../mock/data';

// KYC 第 4 步：银行转账认证（2026-11-04 · 集团《个人KYC-银行转账认证》+ 会议纪要）
// 交易所口径：KYC 末步用本人借记账户首充 ≥1万 HKD（或等值 USD）完成开户；
// 首充卡自动加白，开户成功即可用于后续出入金。原型在线下转账 + 财务确认的形态下落地：
// 本页创建首卡（待验证）与首充单（待财务确认到账），财务确认时自动加白。
//
// 2026-11-05 版式重排（用户反馈「页面太长、输入负担重」+ RO「KYC 时须完成银行卡充值加白才能开户」）：
// 由 4 卡（动能/收款账户/首卡/首充登记）并为 3 卡——引导 → 汇款银行账户 → 转账信息（收款账户与登记合并）。
// 转账日期不再预填当前时间：用户「先转账、后回来登记」，预填等于替用户假填「已转账」。
const BANK_OPTIONS = ['汇丰银行', '中国银行（香港）', '星展银行', '渣打银行', '恒生银行'];

export default function KYCBankTransfer({ navigate, goBack }) {
  const { t, lang } = useLang();
  const [picker, setPicker] = useState(null);   // 'region' | 'bank'
  const [currency, setCurrency] = useState('HKD');
  const [accountType, setAccountType] = useState('hk'); // hk | overseas
  const [region, setRegion] = useState('SG');
  const [bank, setBank] = useState(BANK_OPTIONS[0]);
  const [cardNo, setCardNo] = useState('');
  const [proof, setProof] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [refNo, setRefNo] = useState('');
  const [receipt, setReceipt] = useState(null);   // 转账凭证 { name, size, uploadedAt, preview }
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [error, setError] = useState('');

  const [thisYear] = useState(new Date().getFullYear());
  const [copiedKey, setCopiedKey] = useState('');
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // 复制：优先走同步 execCommand —— navigator.clipboard.writeText 在文档未获焦点时
  // 会永远 pending（自动化/后台标签页实测），导致「已复制」状态永不出现。
  const copy = (key, text) => {
    let done = false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      done = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      done = false;
    }
    if (!done && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedKey(''), 2500);
  };

  // 凭证读成 dataURL 存 preview，后台资金审核可直接预览原件（2026-11-05）
  const handleReceipt = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const now = new Date();
      const p = n => String(n).padStart(2, '0');
      setReceipt({
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
        preview: reader.result,
      });
      setError('');
    };
    reader.readAsDataURL(f);
  };

  const acc = platformDepositAccount(currency) || platformAccounts.deposit;
  const isOverseas = accountType === 'overseas';

  // 切账户类型：香港账户回到银行列表，海外账户清空让用户填全称（2026-11-05
  // 海外银行范围无限，复用 5 家香港银行列表是数据错误）
  const changeAccountType = next => {
    setAccountType(next);
    setError('');
    if (next === 'hk' && !BANK_OPTIONS.includes(bank)) setBank(BANK_OPTIONS[0]);
    if (next === 'overseas' && BANK_OPTIONS.includes(bank)) setBank('');
  };

  const submit = () => {
    const num = parseFloat(amount) || 0;
    if (!bank.trim()) { setError(t('请填写开户银行名称')); return; }
    if (!cardNo.trim()) { setError(t('请输入本人银行卡号')); return; }
    if (!proof) { setError(t('请上传银行卡照片或开户证明')); return; }
    if (num <= 0) { setError(t('请输入首充金额')); return; }
    if (!transferDate) { setError(t('请选择转账日期')); return; }
    if (!receipt) { setError(t('请上传转账凭证')); return; }
    const res = submitKycBankTransfer({
      currency,
      accountType,
      region: accountType === 'overseas' ? region : 'HK',
      bank: bank.trim(),
      cardNo,
      proofImage: proof,
      amount: num,
      evidence: receipt,
      refNo,
      transferDate: `${transferDate} 00:00`,
    });
    if (!res.ok) { setError(res.error || t('提交失败，请检查填写内容')); return; }
    navigate('kyc-submitted');
  };

  return (
    <div className="kyc-page">
      <div className="kyc-header">
        <div className="kyc-header-inner">
          <button className="kyc-back-btn" onClick={goBack}>
            <ArrowLeft size={20} />
            <span>{t('返回')}</span>
          </button>
          <span className="kyc-header-title">{t('银行转账认证')}</span>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div className="kyc-content">
        {/* 引导：只讲用户要做什么，不讲内部流程 */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('开户最后一步')}</div>
          <p className="kyc-card-desc">
            {t('请从本人名下的银行账户转出一笔不少于 1 万 HKD（或等值 USD）的款项，再回来填写转账信息。款项到账后即完成开户，这张卡也可立即用于出入金。')}
          </p>
        </div>

        {/* 卡 2：用户汇款的银行账户 */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('汇款银行账户')}</div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('账户类型')}</label>
            <div className="fund-method-chips">
              <button type="button" className={`chip ${!isOverseas ? 'active' : ''}`} onClick={() => changeAccountType('hk')}>{t('香港银行')}</button>
              <button type="button" className={`chip ${isOverseas ? 'active' : ''}`} onClick={() => changeAccountType('overseas')}>{t('海外银行')}</button>
            </div>
          </div>
          {isOverseas && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">{t('开户国家 / 地区')}</label>
              <button
                type="button"
                className="kyc-form-input picker-trigger"
                onClick={() => setPicker('region')}
              >
                <span className="picker-trigger-value">{jurisdictionLabel(region, lang)}</span>
                <ChevronDown size={18} className="picker-caret" />
              </button>
            </div>
          )}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行')}</label>
            {isOverseas ? (
              <input
                className="kyc-form-input"
                value={bank}
                onChange={e => { setBank(e.target.value); setError(''); }}
                placeholder={t('请输入开户银行全称')}
              />
            ) : (
              <button
                type="button"
                className="kyc-form-input picker-trigger"
                onClick={() => setPicker('bank')}
              >
                <span className="picker-trigger-value">{bank}</span>
                <ChevronDown size={18} className="picker-caret" />
              </button>
            )}
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行卡号')}</label>
            <input
              className="kyc-form-input"
              inputMode="numeric"
              placeholder={t('请输入本人银行卡号')}
              value={cardNo}
              onChange={e => { setCardNo(e.target.value); setError(''); }}
            />
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行卡照片 / 开户证明')}</label>
            <label className={`kyc-upload-zone ${proof ? 'has-file' : ''}`}>
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  setProof(f ? 'images/demo-bank-card.jpg' : '');
                  setError('');
                }}
              />
              {proof ? (
                <>
                  <Check size={24} style={{ color: 'var(--success)' }} />
                  <div className="kyc-upload-file-name">{t('已上传')}</div>
                </>
              ) : (
                <>
                  <div className="kyc-upload-icon"><Upload size={24} /></div>
                  <div className="kyc-upload-text">{t('点击上传银行卡照片或开户证明')}</div>
                  <div className="kyc-upload-hint">{t('用于核对账户姓名与卡号')}</div>
                </>
              )}
            </label>
          </div>
        </div>

        {/* 卡 3：转给谁 + 转了多少（收款账户与转账登记合并，减少卡片数量与滚动距离） */}
        <div className="kyc-card">
          <div className="kyc-card-title">{t('转账信息')}</div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('币种')}</label>
            <div className="fund-method-chips">
              {['HKD', 'USD'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`chip ${currency === c ? 'active' : ''}`}
                  onClick={() => setCurrency(c)}
                >{c}</button>
              ))}
            </div>
          </div>
          <AccountRow rowKey="bank" label={t('收款银行')} value={acc.bank} long copiedKey={copiedKey} onCopy={copy} />
          <AccountRow rowKey="accountName" label={t('户名')} value={acc.accountName} long copiedKey={copiedKey} onCopy={copy} />
          <AccountRow rowKey="accountNo" label={t('账号')} value={acc.accountNo} mono copiedKey={copiedKey} onCopy={copy} />
          <div className="kyc-form-group" style={{ marginTop: 'var(--space-3)' }}>
            <label className="kyc-form-label">{t('转账金额')}</label>
            <input
              className="kyc-form-input"
              type="number"
              inputMode="decimal"
              placeholder={t('≥1万 HKD 或等值 USD')}
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
            />
            <p className="fund-field-hint">{t('最低转账 {amount}。').replace('{amount}', currency === 'USD' ? 'USD 1,300' : 'HKD 10,000')}</p>
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('转账日期')}</label>
            <button
              type="button"
              className="kyc-form-input kyc-date-button"
              onClick={() => setShowDateSheet(true)}
            >
              <span className={transferDate ? 'kyc-date-value' : 'kyc-date-placeholder'}>
                {transferDate ? transferDate.replace(/-/g, '/') : t('选择转账日期')}
              </span>
              <ChevronDown size={18} className="kyc-date-chevron" />
            </button>
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('转账凭证')}</label>
            <label className={`kyc-upload-zone ${receipt ? 'has-file' : ''}`}>
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleReceipt}
              />
              {receipt ? (
                <>
                  <Check size={24} style={{ color: 'var(--success)' }} />
                  <div className="kyc-upload-file-name">{receipt.name}</div>
                </>
              ) : (
                <>
                  <div className="kyc-upload-icon"><Upload size={24} /></div>
                  <div className="kyc-upload-text">{t('点击上传转账凭证')}</div>
                  <div className="kyc-upload-hint">{t('银行回单或转账成功截图，用于核对金额与时间')}</div>
                </>
              )}
            </label>
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行回单参考号（可选）')}</label>
            <input className="kyc-form-input" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder={t('便于财务核对')} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('请用本人名下借记账户转账，金额不足门槛将原路退回。')}
            </span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="kyc-actions">
        <button className="kyc-btn kyc-btn-primary" onClick={submit}>
          <ShieldCheck size={16} /> {t('我已转账 · 提交开户')}
        </button>
      </div>

      {/* 选择类字段底部弹层（2026-11-05：替代原生 select） */}
      <BottomPicker
        open={picker === 'region'}
        title={t('开户国家 / 地区')}
        options={JURISDICTIONS.filter(j => !j.local).map(j => ({ value: j.code, label: jurisdictionLabel(j.code, lang) }))}
        value={region}
        onSelect={v => setRegion(v)}
        onClose={() => setPicker(null)}
      />
      <BottomPicker
        open={picker === 'bank'}
        title={t('银行')}
        options={BANK_OPTIONS.map(b => ({ value: b, label: b }))}
        value={bank}
        onSelect={v => setBank(v)}
        onClose={() => setPicker(null)}
      />

      {/* 转账日期选择 sheet（复用共享滚轮；只到日，财务按日匹配流水足够） */}
      {showDateSheet && (
        <div className="sheet-mask" onClick={() => setShowDateSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <span className="sheet-title">{t('选择转账日期')}</span>
              <button className="btn-icon" onClick={() => setShowDateSheet(false)} aria-label={t('关闭')}>
                <X size={20} />
              </button>
            </div>
            <div className="sheet-body">
              <DateWheelPicker
                value={transferDate}
                onChange={v => { setTransferDate(v); setError(''); }}
                t={t}
                lang={lang}
                minYear={thisYear - 1}
                maxYear={thisYear}
                initialYear={thisYear}
              />
            </div>
            <div className="sheet-footer">
              <button className="kyc-btn kyc-btn-primary" onClick={() => setShowDateSheet(false)}>
                {t('完成')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
