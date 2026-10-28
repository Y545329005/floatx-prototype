import { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import {
  getHolding,
  getHoldings,
  getHoldingRedeemInfo,
  funds,
  latestNav,
  submitRedemptionOrder,
  FUND_FEE_RATE,
  formatExact,
} from '../mock/data';
import { useLang } from '../i18n';

// 赎回申请（2026-10-28 P2）
// 与申购对称：页面只做「把份额换成回款」的申请，提交即冻结份额、不扣不回款；
// 财务确认才真正扣份额并把钱打回平台钱包余额（出金仍走资金公共模块的「提现」）。
// 入口不受 PI 门控——门控只挡买入，不挡卖出（PI 过期还被锁住出不来是合规事故）。
export default function FundRedeem({ id, navigate, goBack, setToast }) {
  const { t } = useLang();
  const holding = getHolding(id) || getHoldings()[0] || null;
  const fund = holding ? funds.find(f => f.id === holding.fundId) : null;
  const info = getHoldingRedeemInfo(holding);
  const nav = fund ? latestNav(fund) : 0;

  const [shares, setShares] = useState(String(info.redeemable || ''));
  const [error, setError] = useState('');

  const shareNum = Number(shares) || 0;
  const gross = shareNum * nav;
  const fee = gross * FUND_FEE_RATE.redeem;
  const net = gross - fee;
  const over = shareNum > info.redeemable;

  if (!holding || !fund) {
    return (
      <div className="page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('赎回申请')}</h1>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <p className="text-muted">{t('暂无可赎回的持仓')}</p>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('#funds')}>{t('去看看基金')}</button>
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    const res = submitRedemptionOrder({ holdingId: holding.id, shares: shareNum });
    if (!res.ok) {
      setError(t(res.error));
      return;
    }
    setToast && setToast(t('赎回申请已提交，份额已冻结，等待财务确认'));
    navigate('#fund-orders');
  };

  return (
    <div className="page fund-redeem-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack(`#fund/${fund.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('赎回申请')}</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>{t(fund.name)}</h3></div>
        <div className="fund-order-rows">
          <div className="fund-order-row">
            <span>{t('持有份额')}</span>
            <strong>{formatExact(holding.shares)} {t('份')}</strong>
          </div>
          <div className="fund-order-row">
            <span>{t('可赎回份额')}</span>
            <strong>{formatExact(info.redeemable)} {t('份')}</strong>
          </div>
          {info.locked > 0 && (
            <div className="fund-order-row">
              <span>{t('锁定期内份额')}</span>
              <strong>
                {formatExact(info.locked)} {t('份')}
                {info.earliestUnlock ? ` · ${t('最近解锁')} ${info.earliestUnlock}` : ''}
              </strong>
            </div>
          )}
          {holding.frozenShares > 0 && (
            <div className="fund-order-row">
              <span>{t('赎回处理中')}</span>
              <strong>{formatExact(holding.frozenShares)} {t('份')}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="form-row">
          <label>{t('赎回份额')}</label>
          <input
            type="number"
            inputMode="decimal"
            value={shares}
            onChange={(e) => { setShares(e.target.value); setError(''); }}
            placeholder={String(info.redeemable)}
          />
          <div className="fund-redeem-quick">
            <button type="button" className="chip" onClick={() => setShares(String(info.redeemable))}>{t('全部')}</button>
            <button type="button" className="chip" onClick={() => setShares(String(Math.round(info.redeemable / 2 * 10000) / 10000))}>{t('一半')}</button>
          </div>
          {over && (
            <p className="form-error">
              {t('超过可赎回份额，上限')} {formatExact(info.redeemable)} {t('份')}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>{t('回款预估')}</h3></div>
        <div className="fund-order-rows">
          <div className="fund-order-row">
            <span>{t('参考净值')}</span>
            <strong>{nav}</strong>
          </div>
          <div className="fund-order-row">
            <span>{t('赎回费')}</span>
            <strong>{(FUND_FEE_RATE.redeem * 100).toFixed(2)}%（{holding.currency} {formatExact(fee)}）</strong>
          </div>
          <div className="fund-order-row">
            <span>{t('预估回款')}</span>
            <strong>{holding.currency} {formatExact(Number(net.toFixed(2)))}</strong>
          </div>
        </div>
        <p className="text-sm text-muted">
          <Info size={12} /> {t('提交后份额立即冻结，财务按确认日净值复核，确认后回款进入可用余额；确认前可撤销。')}
        </p>
        <p className="text-sm text-muted">
          {t('演示环境：确认即到账。实际赎回到账周期见基金档案（本基金为 T+15 人工处理）。')}
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="bottom-action-bar">
        <button
          className="btn btn-primary btn-full"
          onClick={submit}
          disabled={over || shareNum <= 0 || info.redeemable <= 0}
        >
          {t('提交赎回申请')}
        </button>
      </div>
    </div>
  );
}
