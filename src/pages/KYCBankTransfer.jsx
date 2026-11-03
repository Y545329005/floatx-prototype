import { useState } from 'react';
import { ArrowLeft, ShieldCheck, Upload, Check, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n';
import {
  currentUser, platformDepositAccount, platformAccounts,
  JURISDICTIONS, jurisdictionLabel, submitKycBankTransfer, formatExactAmount,
} from '../mock/data';

// KYC 第 4 步：银行转账认证（2026-11-04 · 集团《个人KYC-银行转账认证》+ 会议纪要）
// 交易所口径：KYC 末步用本人借记账户首充 ≥1万 HKD（或等值 USD）完成开户；
// 首充卡自动加白，开户成功即可用于后续出入金。原型在线下转账 + 财务确认的形态下落地：
// 本页创建首卡（待验证）与首充单（待财务确认到账），财务确认时自动加白。
const BANK_OPTIONS = ['汇丰银行', '中国银行（香港）', '星展银行', '渣打银行', '恒生银行'];

export default function KYCBankTransfer({ navigate, goBack }) {
  const { t, lang } = useLang();
  const [currency, setCurrency] = useState('HKD');
  const [accountType, setAccountType] = useState('hk'); // hk | overseas
  const [region, setRegion] = useState('SG');
  const [bank, setBank] = useState(BANK_OPTIONS[0]);
  const [cardNo, setCardNo] = useState('');
  const [proof, setProof] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState(() => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  });
  const [refNo, setRefNo] = useState('');
  const [error, setError] = useState('');

  const acc = platformDepositAccount(currency) || platformAccounts.deposit;

  const submit = () => {
    const num = parseFloat(amount) || 0;
    if (num <= 0) { setError(t('请输入首充金额')); return; }
    const res = submitKycBankTransfer({
      currency,
      accountType,
      region: accountType === 'overseas' ? region : 'HK',
      bank,
      cardNo,
      proofImage: proof,
      amount: num,
      evidence: { name: 'KYC 首充转账凭证', size: '—', uploadedAt: '' },
      refNo,
      transferDate: transferDate ? transferDate.replace('T', ' ').slice(0, 16) : '',
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
        <div className="kyc-card">
          <div className="kyc-card-title">{t('开户最后一步')}</div>
          <p className="kyc-card-desc">
            {t('使用本人名下的银行借记账户完成首次转账（≥1万 HKD 或等值 USD），财务确认到账后该卡自动加入白名单，开户即可用于出入金。')}
          </p>
          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <label className="kyc-form-label">{t('首充币种')}</label>
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
        </div>

        <div className="kyc-card">
          <div className="kyc-card-title">{t('收款账户')}</div>
          <div className="kyc-review-row"><span>{t('收款银行')}</span><strong>{acc.bank}</strong></div>
          <div className="kyc-review-row"><span>{t('户名')}</span><strong>{acc.accountName}</strong></div>
          <div className="kyc-review-row"><span>{t('账号')}</span><strong className="date-iso">{acc.accountNo}</strong></div>
          <div className="kyc-review-row"><span>{t('币种')}</span><strong>{acc.currency}</strong></div>
          <p className="fund-field-hint">{t('请务必使用本人名下借记账户；不支持联名账户、ACH 及 Wise / Payment Asia 等第三方支付。FPS / CHATS 预计 1 个工作日到账。')}</p>
        </div>

        <div className="kyc-card">
          <div className="kyc-card-title">{t('首充银行账户')}</div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('账户类型')}</label>
            <div className="fund-method-chips">
              <button type="button" className={`chip ${accountType === 'hk' ? 'active' : ''}`} onClick={() => setAccountType('hk')}>{t('香港银行')}</button>
              <button type="button" className={`chip ${accountType === 'overseas' ? 'active' : ''}`} onClick={() => setAccountType('overseas')}>{t('海外银行')}</button>
            </div>
          </div>
          {accountType === 'overseas' && (
            <div className="kyc-form-group">
              <label className="kyc-form-label">{t('开户国家 / 地区')}</label>
              <select className="kyc-form-input" value={region} onChange={e => setRegion(e.target.value)}>
                {JURISDICTIONS.filter(j => !j.local).map(j => (
                  <option key={j.code} value={j.code}>{jurisdictionLabel(j.code, lang)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行')}</label>
            <select className="kyc-form-input" value={bank} onChange={e => setBank(e.target.value)}>
              {BANK_OPTIONS.map(b => <option key={b}>{b}</option>)}
            </select>
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

        <div className="kyc-card">
          <div className="kyc-card-title">{t('首充登记')}</div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('首充金额')}</label>
            <input
              className="kyc-form-input"
              type="number"
              inputMode="decimal"
              placeholder={t('≥1万 HKD 或等值 USD')}
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
            />
            <p className="fund-field-hint">{t('最低首充 {amount}。').replace('{amount}', currency === 'USD' ? 'USD 1,300' : 'HKD 10,000')}</p>
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('转账日期')}</label>
            <input className="kyc-form-input" type="datetime-local" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
          </div>
          <div className="kyc-form-group">
            <label className="kyc-form-label">{t('银行回单参考号（可选）')}</label>
            <input className="kyc-form-input" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder={t('便于财务核对')} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 'var(--space-3)', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('首充需与本人实名一致；到账金额不足门槛将原路退回。财务确认到账后开户完成，首卡自动加入白名单。')}
            </span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="kyc-actions">
        <button className="kyc-btn kyc-btn-primary" onClick={submit}>
          <ShieldCheck size={16} /> {t('我已完成充值 · 提交开户')}
        </button>
      </div>
    </div>
  );
}
