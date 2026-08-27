import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { exchangeRates, wallet, formatCurrency, exchangeRequests, submitExchangeRequest } from '../mock/data';
import { useLang } from '../i18n';

const pairs = Object.keys(exchangeRates);

// 换汇（2026-08-19 老板确认：换汇由人工在银行内处理，不对客承诺时效与汇率）
// 流程：提交申请（记录参考汇率）→ 人工换汇 → 后台按实际成交汇率上账
// 参考汇率仅用于估算，最终以银行成交为准
export default function Exchange({ navigate, goBack }) {
  const { t } = useLang();
  const [pair, setPair] = useState(pairs[0]);
  const [amount, setAmount] = useState('');

  const rate = exchangeRates[pair];
  const amountNum = parseFloat(amount) || 0;
  const estimate = Math.round(amountNum * rate.rate * 100) / 100;

  const fromKey = rate.from.toLowerCase();
  const fromBalance = wallet[fromKey]?.balance || 0;

  const handleSubmit = () => {
    const ok = submitExchangeRequest({ from: rate.from, to: rate.to, amount: amountNum });
    if (!ok) return;
    const req = exchangeRequests[0]; // 新申请 unshift 到头部
    navigate(`#fund-request/${req.id}`);
  };

  return (
    <div className="page exchange-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#wallet')}><ArrowLeft size={20} /></button>
          <h1>{t('换汇')}</h1>
        </div>
      </div>

      <div className="exchange-human-banner">
        <ShieldCheck size={14} />
        <span>{t('换汇由人工在银行内处理，不承诺时效与汇率，以银行实际成交汇率为准')}</span>
      </div>

      <div className="card">
        <h3 className="card-title">{t('选择币种对')}</h3>
        <div className="chips">
          {pairs.map(p => (
            <button key={p} className={`chip ${pair === p ? 'active' : ''}`} onClick={() => { setPair(p); setAmount(''); }}>
              {p.toUpperCase().replace('-', ' → ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="form-label">{t('卖出')} {rate.from}</label>
        <div className="input-group">
          <span className="input-prefix">{rate.from}</span>
          <input
            type="text"
            className="form-input"
            placeholder={t('输入金额')}
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>
        <p className="text-muted text-sm">{t('可用余额')}: {formatCurrency(fromBalance)} {rate.from}</p>
      </div>

      <div className="exchange-rate-display">
        <ArrowRightLeft size={20} />
        <span>{t('参考汇率')}: 1 {rate.from} = {rate.rate} {rate.to}</span>
      </div>

      <div className="card">
        <label className="form-label">{t('买入')} {rate.to}（估算）</label>
        <div className="exchange-result">
          <span className="exchange-result-amount">{estimate.toFixed(2)}</span>
          <span className="exchange-result-currency">{rate.to}</span>
        </div>
        <p className="text-muted text-sm">{t('估算结果仅供参考，实际以银行成交汇率为准')}</p>
      </div>

      <button
        className="btn btn-primary btn-full"
        disabled={amountNum <= 0 || amountNum > fromBalance}
        onClick={handleSubmit}
      >
        {t('提交换汇申请')}
      </button>
    </div>
  );
}
