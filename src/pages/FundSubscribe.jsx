import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { funds, submitFundOrder, getAvailableCash, latestNav, FUND_FEE_RATE, formatExact } from '../mock/data';
import { useLang } from '../i18n';

// 申购申请（2026-10-28 基金一期闭环）
// 余额申购模式：页面不再出现任何基金收款账户——钱的进出统一由「资金」公共模块承担
// （入金到平台账户 → 财务核销 → 可用余额），这里只做「用余额换份额」的交易动作。
// 提交 = 冻结（不扣款），后台确认才扣款并份额入账；驳回/撤销自动释放冻结。
export default function FundSubscribe({ id, navigate, goBack, setToast }) {
  const { t } = useLang();
  const fund = funds.find(f => f.id === id) || funds[0];
  const [currency, setCurrency] = useState(fund.currency?.[0] || 'HKD');
  const [amount, setAmount] = useState(String(fund.minInvestment || 1000000));
  const [error, setError] = useState('');

  const available = getAvailableCash(currency);
  const nav = latestNav(fund);
  const amountNum = Number(amount) || 0;
  const feeAmount = Math.round(amountNum * FUND_FEE_RATE.subscribe);
  const estShares = amountNum > 0 ? (amountNum - feeAmount) / nav : 0;
  const shortfall = amountNum > available ? amountNum - available : 0;

  const submit = () => {
    const res = submitFundOrder({ fundId: fund.id, currency, amount: amountNum });
    if (!res.ok) {
      setError(t(res.error));
      return;
    }
    setToast && setToast(t('申购申请已提交，资金已冻结，等待财务确认'));
    navigate('#fund-orders');
  };

  return (
    <div className="page fund-subscribe-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack(`#fund/${fund.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('申购申请')}</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>{t(fund.name)}</h3></div>
        <div className="form-row">
          <label>{t('申购币种')}</label>
          <div className="segmented">
            {(fund.currency || ['HKD']).map(c => (
              <button
                key={c}
                className={currency === c ? 'active' : ''}
                onClick={() => { setCurrency(c); setError(''); }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>{t('申购金额')}</label>
          <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} inputMode="decimal" />
          <div className="text-sm text-muted">
            {t('起投')}：{currency} {formatExact(fund.minInvestment)} · {t('可用余额')}：{currency} {formatExact(available)}
          </div>
          {shortfall > 0 && (
            <p className="form-error">
              {t('可用余额不足，还差')} {currency} {formatExact(shortfall)}{' '}
              <button className="text-btn link-btn" onClick={() => navigate('#fund-operation/deposit')}>{t('去入金')}</button>
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>{t('申购预估')}</h3></div>
        <div className="fund-order-rows">
          <div className="fund-order-row">
            <span>{t('参考净值')}</span>
            <strong>{nav}</strong>
          </div>
          <div className="fund-order-row">
            <span>{t('认购费率')}</span>
            <strong>{(FUND_FEE_RATE.subscribe * 100).toFixed(2)}%（{currency} {formatExact(feeAmount)}）</strong>
          </div>
          <div className="fund-order-row">
            <span>{t('预估份额')}</span>
            <strong>{formatExact(Number(estShares.toFixed(4)))} {t('份')}</strong>
          </div>
        </div>
        <p className="text-sm text-muted">
          {t('提交后资金立即冻结，财务按确认日净值复核，确认后份额入账；确认前可撤销。')}
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="bottom-action-bar">
        <button className="btn btn-primary btn-full" onClick={submit} disabled={shortfall > 0 || amountNum <= 0}>
          {t('提交申购申请')}
        </button>
      </div>
    </div>
  );
}
