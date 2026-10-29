import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import {
  getHolding,
  getHoldings,
  getHoldingRedeemInfo,
  funds,
  latestNav,
  submitRedemptionOrder,
  FUND_FEE_RATE,
  formatExactAmount,
  formatShares,
  fundMonthsLabel,
  fundRedemptionLabel,
} from '../mock/data';
import { groupDigits, applyNumberInput } from '../lib';
import { useLang } from '../i18n';

// 赎回申请（2026-10-28 四轮重做）
// 与申购镜像：把份额换回可用余额。用户在这一屏只关心三件事——
// 能卖多少（锁定期 / 在途冻结）、能拿回多少、多久到账。
// 入口不受 PI 门控——门控只挡买入，不挡卖出（PI 过期还被锁住出不来是合规事故）。
export default function FundRedeem({ id, from, navigate, goBack, setToast }) {
  const { t } = useLang();
  const holding = getHolding(id) || getHoldings()[0] || null;
  const fund = holding ? funds.find(f => f.id === holding.fundId) : null;
  const info = getHoldingRedeemInfo(holding);
  const nav = fund ? latestNav(fund) : 0;

  // 默认空：预填「全部可赎回」等于把「点一下清仓」设成默认值，是全项目最危险的一种预填
  const [shares, setShares] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const shareNum = Number(shares) || 0;
  const rounded = Math.round(shareNum * 10000) / 10000;
  const tooPrecise = shareNum > 0 && rounded !== shareNum;
  const over = rounded > info.redeemable;
  const gross = rounded * nav;
  const fee = gross * FUND_FEE_RATE.redeem;
  const net = gross - fee;
  const remaining = Math.max(0, (holding?.shares || 0) - rounded);
  const validInput = rounded > 0 && !over && !tooPrecise;
  const canSubmit = validInput && info.redeemable > 0 && !!holding;

  const onShares = (e) => { applyNumberInput(e, setShares); setError(''); };

  const back = () => goBack(from === 'asset' ? '#asset' : (fund ? `#fund/${fund.id}` : '#asset'));

  if (!holding || !fund) {
    return (
      <div className="page p-fund-trade">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('赎回申请')}</h1>
          </div>
        </div>
        <div className="card p-fund-trade-card">
          <div className="empty-state">
            <p className="text-muted">{t('暂无可赎回的持仓')}</p>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('#funds')}>{t('去看看基金')}</button>
          </div>
        </div>
      </div>
    );
  }

  // 全锁定态：给「为什么不能赎 + 什么时候能」和一个出口，而不是一个填不进数字的空输入框
  if (info.redeemable <= 0) {
    return (
      <div className="page p-fund-trade">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={back}><ArrowLeft size={20} /></button>
            <h1>{t('赎回申请')}</h1>
          </div>
        </div>

        <div className="p-fund-trade-ident">
          <div className="p-fund-trade-ident-name">{t(fund.name)}</div>
          <div className="p-fund-trade-ident-meta">
            <span>{t('锁定')} {fundMonthsLabel(fund.lockMonths, t)}</span>
          <span>{t('期限')} {fundMonthsLabel(fund.termMonths, t)}</span>
          <span>{t('到账')} {fundRedemptionLabel(fund.redemptionDays, fund.redemptionMode, t)}</span>
          </div>
        </div>

        <div className="card p-fund-trade-card">
          <div className="p-fund-trade-locked" >
            <strong className="p-fund-trade-locked-title">{t('当前无可用赎回份额')}</strong>
            <p className="p-fund-trade-locked-body">
              {t('全部 {} 份仍在锁定期内，最近解锁 {}')
                .replace('{}', formatShares(info.locked || holding.shares))
                .replace('{}', info.earliestUnlock || '—')}
            </p>
            {holding.frozenShares > 0 && (
              <p className="p-fund-trade-locked-body">
                {t('赎回处理中')} {formatShares(holding.frozenShares)} {t('份')}
              </p>
            )}
          </div>
          <button className="btn btn-outline btn-full" onClick={() => navigate(`#fund/${fund.id}`)}>
            {t('查看详情')}
          </button>
        </div>
      </div>
    );
  }

  const submit = () => {
    const res = submitRedemptionOrder({ holdingId: holding.id, shares: rounded });
    if (!res.ok) {
      setConfirming(false);
      setError(t(res.error));
      return;
    }
    setToast && setToast(t('赎回申请已提交，份额已冻结，等待财务确认'));
    navigate('#fund-orders');
  };

  return (
    <div className="page p-fund-trade">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={back}><ArrowLeft size={20} /></button>
          <h1>{t('赎回申请')}</h1>
        </div>
      </div>

      <div className="p-fund-trade-ident">
        <div className="p-fund-trade-ident-name">{t(fund.name)}</div>
        <div className="p-fund-trade-ident-meta">
          <span>{t('锁定')} {fundMonthsLabel(fund.lockMonths, t)}</span>
          <span>{t('期限')} {fundMonthsLabel(fund.termMonths, t)}</span>
          <span>{t('到账')} {fundRedemptionLabel(fund.redemptionDays, fund.redemptionMode, t)}</span>
        </div>
      </div>

      <div className="card p-fund-trade-card">
        {/* 持仓状态放在输入之前：先让人看清「这部分能卖、那部分不能」，再让 ta 决定卖多少 */}
        <dl className="p-fund-trade-status">
          <div className="p-fund-trade-row">
            <dt>{t('持有份额')}</dt>
            <dd>{formatShares(holding.shares)} {t('份')}</dd>
          </div>
          <div className="p-fund-trade-row">
            <dt>{t('可赎回份额')}</dt>
            <dd>{formatShares(info.redeemable)} {t('份')}</dd>
          </div>
          {info.locked > 0 && (
            <div className="p-fund-trade-row">
              <dt>{t('锁定期内份额')}</dt>
              <dd>
                {formatShares(info.locked)} {t('份')}
                {info.earliestUnlock ? ` · ${t('最近解锁')} ${info.earliestUnlock}` : ''}
              </dd>
            </div>
          )}
          {holding.frozenShares > 0 && (
            <div className="p-fund-trade-row">
              <dt>{t('赎回处理中')}</dt>
              <dd>{formatShares(holding.frozenShares)} {t('份')}</dd>
            </div>
          )}
        </dl>

        <div className="p-fund-trade-labelrow">
          <label className="p-fund-trade-label" htmlFor="red-shares">{t('赎回份额')}</label>
          <div className="p-fund-trade-quick">
            <button type="button" onClick={() => { setShares(String(Math.round(info.redeemable / 2 * 10000) / 10000)); setError(''); }}>
              {t('一半')}
            </button>
            <button type="button" onClick={() => { setShares(String(info.redeemable)); setError(''); }}>
              {t('全部')}
            </button>
          </div>
        </div>
        <div className="p-fund-trade-input">
          <input
            id="red-shares"
            type="text"
            inputMode="decimal"
            value={groupDigits(shares)}
            placeholder="0"
            onChange={onShares}
          />
          <span className="p-fund-trade-unit">{t('份')}</span>
        </div>

        {over && (
          <p className="p-fund-trade-alert is-plain">
            {t('超过可赎回份额，上限')} {formatShares(info.redeemable)} {t('份')}
          </p>
        )}
        {tooPrecise && (
          <p className="p-fund-trade-alert is-plain">{t('份额最多 4 位小数')}</p>
        )}

        <dl className="p-fund-trade-rows is-flush">
          <div className="p-fund-trade-row">
            <dt>{t('参考净值')}</dt>
            <dd>{nav}</dd>
          </div>
          <div className="p-fund-trade-row">
            <dt>{t('赎回费')} ({(FUND_FEE_RATE.redeem * 100).toFixed(2)}%)</dt>
            <dd>{validInput ? (fee > 0 ? `−${holding.currency} ${formatExactAmount(fee)}` : `${holding.currency} 0`) : '—'}</dd>
          </div>
        </dl>

        {/* 主数字是「能拿回多少」，不是「卖了多少份」——用户来这一页是为了钱 */}
        <div className="p-fund-trade-result">
          <span className="p-fund-trade-result-label">{t('预估回款')}</span>
          <strong className="p-fund-trade-result-value">
            {validInput ? `${holding.currency} ${formatExactAmount(Number(net.toFixed(2)))}` : '—'}
          </strong>
        </div>

        <div className="p-fund-trade-after">
          <span>{t('赎回后剩余')}</span>
          <strong>{validInput ? `${formatShares(remaining)} ${t('份')}` : '—'}</strong>
        </div>
      </div>

      <p className="p-fund-trade-note">
        {t('本页数字按最近净值估算；私募基金按确认日净值复核，实际回款可能不同。提交后份额立即冻结，财务确认前可撤销。')}
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="bottom-action-bar p-fund-trade-cta">
        <button className="btn btn-primary btn-full" onClick={() => setConfirming(true)} disabled={!canSubmit}>
          {t('提交赎回申请')}
        </button>
      </div>

      {confirming && (
        <>
          <div className="sheet-mask" onClick={() => setConfirming(false)} />
          <div className="sheet p-fund-trade-sheet">
            <div className="sheet-header">
              <h3>{t('确认赎回')}</h3>
              <button className="btn-icon" onClick={() => setConfirming(false)}><X size={18} /></button>
            </div>
            <p className="sheet-sub">{t(fund.name)}</p>

            <dl className="p-fund-trade-rows is-sheet">
              <div className="p-fund-trade-row">
                <dt>{t('赎回份额')}</dt>
                <dd>{formatShares(rounded)} {t('份')}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('赎回费')}</dt>
                <dd>{fee > 0 ? `−${holding.currency} ${formatExactAmount(fee)}` : `${holding.currency} 0`}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('预估回款')}</dt>
                <dd>{holding.currency} {formatExactAmount(Number(net.toFixed(2)))}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('到账')}</dt>
                <dd>{fundRedemptionLabel(fund.redemptionDays, fund.redemptionMode, t)}</dd>
              </div>
            </dl>

            <p className="p-fund-trade-sheet-note">
              {t('提交后份额立即冻结，财务按确认日净值复核后回款进入可用余额；确认前可撤销。')}
            </p>

            <div className="p-fund-trade-sheet-actions">
              <button className="btn btn-outline" onClick={() => setConfirming(false)}>{t('取消')}</button>
              <button className="btn btn-primary" onClick={submit}>{t('确认提交')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
