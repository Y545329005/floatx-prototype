import { useState } from 'react';
import { X } from 'lucide-react';
import { amountPresets, submitSubscription, convertLeadsToSubscribed, currentUser, getInvestorNo, formatCurrency, getSubscriptionGate } from '../mock/data';
import { useLang } from '../i18n';

export default function SubscribeSheet({ project, onClose, onSubmitted }) {
  const { t } = useLang();
  const [amount, setAmount] = useState(amountPresets[0].value);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const handlePreset = (value) => {
    setAmount(value);
    setCustomMode(false);
    setCustomAmount('');
    setError('');
  };

  const handleCustom = (value) => {
    setCustomAmount(value);
    const num = parseFloat(value);
    // 输入框以"万"为单位，换算为完整金额（与档位 value 同量级）
    if (num > 0) setAmount(num * 10000);
    setError('');
  };

  const handleSubmit = () => {
    // 2026-08-17 防御校验：申购入口强制 KYC + PI 资格（正常路径已被 ProjectDetail CTA 拦截，此处防绕过）
    const gate = getSubscriptionGate(currentUser);
    if (!gate.ok) {
      setError(t(gate.labelKey));
      return;
    }
    if (!agree) return;
    const finalAmount = amount;
    if (!finalAmount || finalAmount <= 0) {
      setError(t('请选择或填写有效金额'));
      return;
    }
    const createdAt = submitSubscription({
      project,
      amount: finalAmount,
      currency: 'HKD',
    });
    // 申购意向提交 = 报名线索"已转化"（报名客户进入申购漏斗，与申购记录语义联动）
    convertLeadsToSubscribed();
    onSubmitted(createdAt);
    onClose();
  };

  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <h3>{t('提交申购意向')}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-muted text-sm sheet-sub">{project.title} · {t(project.stage)}</p>

        <div className="form-group">
          <label className="form-label">{t('意向金额（HKD）')}</label>
          <div className="amount-presets">
            {amountPresets.map(p => (
              <button
                key={p.value}
                type="button"
                className={`amount-preset ${amount === p.value && !customMode ? 'selected' : ''}`}
                onClick={() => handlePreset(p.value)}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className={`amount-preset ${customMode ? 'selected' : ''}`}
              onClick={() => { setCustomMode(true); setAmount(0); }}
            >
              {t('自定义')}
            </button>
          </div>
          {(customMode || amount > 0) && (
            <p className="amount-summary">
              <span className="text-muted">{t('意向金额')}</span>
              {customMode ? (
                <span className="amount-summary-edit">
                  <input
                    className="amount-summary-input"
                    type="number"
                    placeholder={t('请输入金额')}
                    value={customAmount}
                    onChange={e => handleCustom(e.target.value)}
                    inputMode="decimal"
                    autoFocus
                  />
                  <span className="amount-summary-unit">{t('万')}</span>
                </span>
              ) : (
                <strong className="date-iso">{formatCurrency(amount)}</strong>
              )}
            </p>
          )}
        </div>

        <div className="subscription-notice">
          <ul>
            <li>{t('意向金额非合同承诺，最终以 SPV 文件为准')}</li>
            <li>{t('获配额后意向金额将被冻结（不扣款），请在 24 小时内签署 SPV 确认出资，逾期未签署将自动顺延')}</li>
            <li>{t('您确认本人为香港《证券及期货条例》定义的专业投资者')}</li>
          </ul>
        </div>

        <label className="form-checkbox-group">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          <span>{t('我已阅读并确认以上事项')}</span>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary btn-full sheet-submit" disabled={!agree || !amount} onClick={handleSubmit}>
          {t('确认提交')}
        </button>
      </div>
    </>
  );
}