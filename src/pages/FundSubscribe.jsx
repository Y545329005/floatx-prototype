import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { funds, submitFundOrder, getAvailableCash, latestNav, FUND_FEE_RATE, formatExactAmount, formatShares, fundMonthsLabel } from '../mock/data';
import { groupDigits, applyNumberInput } from '../lib';
import { useLang } from '../i18n';

// 申购申请（2026-10-28 四轮重做）
// 定位：一次不可撤销的资金转移的最后一道闸门，不是「表单页」。页面只回答三个问题——
//   ① 会从我账上拿走多少  ② 这些钱换到多少份  ③ 点下去还能不能反悔
// 因此信息按「问题」排，不按「数据分类」排：身份条（买的是什么）→ 交易卡（输入 + 后果）
// → 口径说明（数字怎么来的）→ 固定底栏（唯一动作）。
// 余额申购模式不变：页面不出现基金收款账户，钱的进出统一由「资金」模块承担。
export default function FundSubscribe({ id, navigate, goBack, setToast }) {
  const { t } = useLang();
  const fund = funds.find(f => f.id === id) || funds[0];
  // 币种固定为基金主币种（2026-10-28 五轮）：原来给了 HKD/USD/CNH 三选，
  // 但净值只有一条且标的是 HKD 份额——选 USD 会用 HKD 净值算份额，等于算错；
  // 且 USD/CNH 余额都不到起投额。多币种份额属二期，届时每个币种要有自己的净值序列。
  const currency = fund.navMeta?.currency || fund.currency?.[0] || 'HKD';
  // 默认空：预填任何一个金额都是在替用户做决定
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const available = getAvailableCash(currency);
  const nav = latestNav(fund);
  const amountNum = Number(amount) || 0;
  const feeAmount = Math.round(amountNum * FUND_FEE_RATE.subscribe);
  const netAmount = amountNum - feeAmount;
  // 与 confirmFundOrder 同口径（4 位小数）计算；展示用 2 位——预估是近似值，4 位是假精度
  // （赎回页不同：那里的份额是「能赎多少」的事实，必须 4 位，否则「全部」填出来的数对不上）
  const estShares = netAmount > 0 && nav > 0 ? Math.round((netAmount / nav) * 10000) / 10000 : 0;
  const afterBalance = Math.max(0, available - amountNum);
  const shortfall = amountNum > available ? amountNum - available : 0;
  const belowMin = amountNum > 0 && amountNum < fund.minInvestment;
  const canSubmit = amountNum > 0 && shortfall === 0 && !belowMin && fund.openForSubscription !== false;
  // 可用余额本身不够起投时，「全部」只会一键生成一个必然失败的状态——不给这个按钮，直接说差多少
  const minTopUp = available < fund.minInvestment ? fund.minInvestment - available : 0;
  const cashGap = Math.max(shortfall, minTopUp);

  const onAmount = (e) => { applyNumberInput(e, setAmount); setError(''); };
  const fillAll = () => { setAmount(String(Math.floor(available))); setError(''); };

  const submit = () => {
    const res = submitFundOrder({ fundId: fund.id, currency, amount: amountNum });
    if (!res.ok) {
      setConfirming(false);
      setError(t(res.error));
      return;
    }
    setToast && setToast(t('申购申请已提交，资金已冻结，等待财务确认'));
    navigate('#fund-orders');
  };

  return (
    <div className="page p-fund-trade">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack(`#fund/${fund.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('申购申请')}</h1>
        </div>
      </div>

      {/* 身份条：成交页重述关键条款（合规惯例）——用户在这一屏确认的，不只是金额 */}
      <div className="p-fund-trade-ident">
        <div className="p-fund-trade-ident-name">{t(fund.name)}</div>
        <div className="p-fund-trade-ident-meta">
          <span>{t('锁定')} {fundMonthsLabel(fund.lockMonths, t)}</span>
          <span>{t('期限')} {fundMonthsLabel(fund.termMonths, t)}</span>
          <span>{t('起投')} {currency} {formatExactAmount(fund.minInvestment)}</span>
        </div>
      </div>

      <div className="card p-fund-trade-card">
        <label className="p-fund-trade-label" htmlFor="sub-amount">{t('申购金额')}</label>
        <div className="p-fund-trade-input">
          <span className="p-fund-trade-unit">{currency}</span>
          <input
            id="sub-amount"
            type="text"
            inputMode="decimal"
            value={groupDigits(amount)}
            placeholder="0"
            onChange={onAmount}
          />
        </div>
        <div className="p-fund-trade-hint">
          <span>{t('可用余额')} {currency} {formatExactAmount(available)}</span>
          {minTopUp === 0 && (
            <div className="p-fund-trade-quick">
              <button type="button" onClick={fillAll}>{t('全部')}</button>
            </div>
          )}
        </div>

        {/* 余额不足是最常见的失败路径：就地给出差额与出口，不让用户滚到底部找 */}
        {cashGap > 0 && (
          <div className="p-fund-trade-alert">
            <span>{t('可用余额不足，还差')} {currency} {formatExactAmount(cashGap)}</span>
            <button type="button" className="p-fund-trade-alert-link" onClick={() => navigate('#fund-operation/deposit')}>
              {t('去入金')}
            </button>
          </div>
        )}
        {minTopUp === 0 && belowMin && (
          <p className="p-fund-trade-alert is-plain">
            {t('低于起投金额')} {currency} {formatExactAmount(fund.minInvestment)}
          </p>
        )}

        <dl className="p-fund-trade-rows">
          <div className="p-fund-trade-row">
            <dt>{t('认购费')} ({(FUND_FEE_RATE.subscribe * 100).toFixed(2)}%)</dt>
            <dd>{amountNum > 0 ? `−${currency} ${formatExactAmount(feeAmount)}` : '—'}</dd>
          </div>
          <div className="p-fund-trade-row">
            <dt>{t('参考净值')}</dt>
            <dd>{nav}</dd>
          </div>
        </dl>

        <div className="p-fund-trade-result">
          <span className="p-fund-trade-result-label">{t('预估份额')}</span>
          <strong className="p-fund-trade-result-value">
            {estShares > 0 ? formatShares(estShares) : '—'}<em>{t('份')}</em>
          </strong>
        </div>

        <div className="p-fund-trade-after">
          <span>{t('提交后可用余额')}</span>
          <strong>{currency} {formatExactAmount(afterBalance)}</strong>
        </div>
      </div>

      {/* 口径说明：私募按确认日净值复核，估算≠成交。这是本页最容易被误解的一条，常显不折叠 */}
      <p className="p-fund-trade-note">
        {t('本页数字按最近净值估算；私募基金按确认日净值复核，实际成交份额可能不同。提交后资金立即冻结，财务确认前可撤销。')}
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="bottom-action-bar p-fund-trade-cta">
        <button className="btn btn-primary btn-full" onClick={() => setConfirming(true)} disabled={!canSubmit}>
          {t('提交申购申请')}
        </button>
      </div>

      {/* 二次确认：100 万级、提交即冻结，一次确认换掉「误触后要走后台撤销」 */}
      {confirming && (
        <>
          <div className="sheet-mask" onClick={() => setConfirming(false)} />
          <div className="sheet p-fund-trade-sheet">
            <div className="sheet-header">
              <h3>{t('确认申购')}</h3>
              <button className="btn-icon" onClick={() => setConfirming(false)}><X size={18} /></button>
            </div>
            <p className="sheet-sub">{t(fund.name)}</p>

            <dl className="p-fund-trade-rows is-sheet">
              <div className="p-fund-trade-row">
                <dt>{t('申购金额')}</dt>
                <dd>{currency} {formatExactAmount(amountNum)}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('认购费')}</dt>
                <dd>−{currency} {formatExactAmount(feeAmount)}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('预估份额')}</dt>
                <dd>{formatShares(estShares)} {t('份')}</dd>
              </div>
              <div className="p-fund-trade-row">
                <dt>{t('提交后可用余额')}</dt>
                <dd>{currency} {formatExactAmount(afterBalance)}</dd>
              </div>
            </dl>

            <p className="p-fund-trade-sheet-note">
              {t('提交后资金立即冻结，财务按确认日净值复核后份额入账；确认前可撤销。')}
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
