import { useState } from 'react';
import { ArrowLeft, Check, Upload, ShieldCheck, ChevronDown } from 'lucide-react';
import {
  BANK_OPTIONS, CARD_QUOTA_PER_CURRENCY,
  JURISDICTIONS, jurisdictionLabel, countActiveCards,
  currentUser, addBankCard, recordAgreement, getFreezeState,
} from '../mock/data';
import { useLang } from '../i18n';
import AgreementModal from '../components/AgreementModal';
import BottomPicker from '../components/BottomPicker';

// 添加银行卡（2026-11-04 由底部弹层改为独立页）
// 原因：表单含「银行 / 开户地区 / 币种 / 卡号 / 凭证」5 项，弹层高度已接近整屏；
// 且内部还要叠协议弹窗、失败要保留已填内容——这些都是页面语义，不是弹层语义。
// 账户类型不再是表单项：业务只接受个人单名账户，给一个只有单一选项的下拉等于让用户做无意义操作，
// 数据层仍保留校验（防绕过）。地区选定后「香港账户 / 海外账户」由数据层按 region 推断。
// 顶部不再写流程说明：规则在上一级页面的「?」里，重复一遍只会把表单推低。
const CURRENCIES = [
  { key: 'HKD', label: 'HKD 港币' },
  { key: 'USD', label: 'USD 美元' },
  { key: 'CNH', label: 'CNH 离岸人民币' },
];

export default function BankCardAdd({ navigate, goBack, setToast, currency }) {
  const { t, lang } = useLang();
  const quotaOf = (cur) => countActiveCards(cur, currentUser.id);
  const firstOpen = CURRENCIES.find(c => quotaOf(c.key) < CARD_QUOTA_PER_CURRENCY);

  const [form, setForm] = useState({
    bank: BANK_OPTIONS[0],
    // 入口带币种（从银行卡页当前页签传进来）；该币种已满则落到还有名额的币种
    currency: (currency && quotaOf(currency) < CARD_QUOTA_PER_CURRENCY) ? currency : (firstOpen ? firstOpen.key : 'HKD'),
    region: 'HK',
    cardNo: '',
  });
  const [proof, setProof] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState(null);   // 'bank' | 'region' | 'currency'

  const allFull = CURRENCIES.every(c => quotaOf(c.key) >= CARD_QUOTA_PER_CURRENCY);
  const frozen = getFreezeState().frozen;

  const submit = () => {
    if (frozen) { setError(t('安全冻结生效中：安全项变更后 24 小时内无法变更出金账户')); return; }
    if (!agreed) { setError(t('请先阅读并同意服务协议')); return; }
    const digits = form.cardNo.replace(/\D/g, '');
    if (digits.length < 8) { setError(t('请输入有效的银行卡号（至少 8 位数字）')); return; }
    if (!proof) { setError(t('请上传银行卡照片或开户证明')); return; }

    const res = addBankCard({
      bank: form.bank,
      branch: form.region === 'HK' ? '香港' : jurisdictionLabel(form.region, lang),
      holder: currentUser.name || '—',
      cardNo: form.cardNo.trim(),
      type: form.region === 'HK' ? '香港账户' : '海外账户',
      currency: form.currency,
      accountType: 'personal',
      region: form.region,
      proofImage: proof,
    });
    if (!res.ok) { setError(res.error || t('添加失败，请检查填写内容后重试')); return; }
    recordAgreement({ type: 'bank-card', agreementIds: ['bank-card-service'] });
    if (setToast) setToast(t('银行卡已提交审核'));
    navigate('#bank-cards');
  };

  const currencyLabel = CURRENCIES.find(c => c.key === form.currency)?.label || form.currency;

  return (
    <div className="page bank-card-add-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#bank-cards')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('添加银行卡')}</h1>
        </div>
      </div>

      <div className="kyc-content">
        {frozen && (
          <div className="sc-freeze-banner">
            <ShieldCheck size={16} />
            <span>{t('安全冻结生效中：安全项变更后 24 小时内无法变更出金账户')}</span>
          </div>
        )}

        <div className="kyc-card">
          <div className="form-group">
            <label className="form-label">{t('银行')}</label>
            <button className="form-input picker-trigger" onClick={() => setPicker('bank')}>
              <span className="picker-trigger-value">{form.bank}</span>
              <ChevronDown size={18} className="picker-caret" />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">{t('开户国家 / 地区')}</label>
            <button className="form-input picker-trigger" onClick={() => setPicker('region')}>
              <span className="picker-trigger-value">{jurisdictionLabel(form.region, lang)}</span>
              <ChevronDown size={18} className="picker-caret" />
            </button>
            <p className="fund-field-hint">{t('仅支持证监会合资格地区（含香港）开立的银行账户。')}</p>
          </div>

          <div className="form-group">
            <label className="form-label">{t('账户币种')}</label>
            <button className="form-input picker-trigger" onClick={() => setPicker('currency')}>
              <span className="picker-trigger-value">{currencyLabel}</span>
              <ChevronDown size={18} className="picker-caret" />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">{t('银行卡号')}</label>
            <input
              className="form-input"
              placeholder={t('请输入银行卡号')}
              inputMode="numeric"
              value={form.cardNo}
              onChange={e => { setForm(f => ({ ...f, cardNo: e.target.value })); setError(''); }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('银行卡照片 / 开户证明')}</label>
            <label className="fund-evidence-box" style={{ display: 'block' }}>
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  // 演示：记录文件名，审核抽屉展示演示占位图（接后端替换为真实上传 URL）
                  setProof(f ? 'images/demo-bank-card.jpg' : '');
                  setError('');
                }}
              />
              {proof ? (
                <div className="fund-evidence-done">
                  <Upload size={18} />
                  <div><strong>{t('已上传')}</strong><span className="text-muted text-sm"> · {t('点击重新上传')}</span></div>
                </div>
              ) : (
                <div className="fund-evidence-empty">
                  <Upload size={20} />
                  <strong>{t('点击上传')}</strong>
                  <span className="text-muted text-sm">{t('用于核对账户姓名与卡号')}</span>
                </div>
              )}
            </label>
          </div>

          <div
            className="form-checkbox-group"
            onClick={() => setAgreed(!agreed)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`kyc-checkbox ${agreed ? 'checked' : ''}`}>
              {agreed && <Check size={12} />}
            </div>
            <span className="bank-card-agree-label">
              {t('我已阅读并同意')}
              <a
                href="#bank-card-service"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setViewingDoc('bank-card-service'); }}
              >
                {t('《银行卡及出入金条款》')}
              </a>
            </span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="kyc-actions">
        <button
          className="kyc-btn kyc-btn-primary"
          disabled={!agreed || allFull || frozen}
          style={{ opacity: (agreed && !allFull && !frozen) ? 1 : 0.45 }}
          onClick={submit}
        >
          {t('提交审核')}
        </button>
      </div>

      <BottomPicker
        open={picker === 'bank'}
        title={t('选择银行')}
        value={form.bank}
        options={BANK_OPTIONS.map(b => ({ value: b, label: b }))}
        onSelect={v => { setForm(f => ({ ...f, bank: v })); setError(''); }}
        onClose={() => setPicker(null)}
      />

      <BottomPicker
        open={picker === 'region'}
        title={t('开户国家 / 地区')}
        value={form.region}
        options={JURISDICTIONS.map(j => ({ value: j.code, label: jurisdictionLabel(j.code, lang) }))}
        onSelect={v => { setForm(f => ({ ...f, region: v })); setError(''); }}
        onClose={() => setPicker(null)}
      />

      <BottomPicker
        open={picker === 'currency'}
        title={t('账户币种')}
        value={form.currency}
        options={CURRENCIES.map(cur => {
          const used = quotaOf(cur.key);
          const full = used >= CARD_QUOTA_PER_CURRENCY;
          return {
            value: cur.key,
            label: cur.label,
            sub: full ? t('已达上限') : `${used}/${CARD_QUOTA_PER_CURRENCY}`,
            disabled: full,
          };
        })}
        onSelect={v => { setForm(f => ({ ...f, currency: v })); setError(''); }}
        onClose={() => setPicker(null)}
      />

      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
