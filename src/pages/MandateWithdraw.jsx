import { useMemo, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import {
  getMandateSummaryForUser,
  mandateConfig,
  getMandateWithdrawalsForUser,
  getMandateAvailableCash,
  getMandateWithdrawFrozen,
  getMandateCashBalance,
  hasMandateTransferAuth,
  requestMandateWithdrawal,
  MANDATE_WITHDRAWAL_LABELS,
  CURRENCY_META,
  formatExactAmount,
} from '../mock/data';
import { useLang } from '../i18n';

// 委托提取申请页（2026-11-16 · 协议 10 · B→A 两段式第一段）：
//   本页只做「委托 B → 现金 A」的提取申请；钱要出银行走现有现金出金（#fund-operation/withdraw），零新增。
//   命名纪律：动作叫「提取」（协议 10 用词），不叫「出金」——出金在现金域严格指 A→银行。
//   金额口径（对抗性审查定版）：可提取上限 = B 户现金余额 − 在途提取合计。持仓不进可提取范围
//   （协议 10.1「变现适当部分」是管理人义务条款，不是客户权利上限），大额变现联系客户经理。
//   四层拦截：路由门控（router）→ 入口 UI（MandateDetail）→ 数据层（canRequestMandateWithdrawal）→ 后台复核。

const STATUS_CLS = {
  pending: 'tag-warning',
  in_progress: 'tag-warning',
  completed: 'tag-success',
  rejected: 'tag-neutral',
};

export default function MandateWithdraw({ goBack, setToast }) {
  const { t } = useLang();
  const summary = getMandateSummaryForUser();
  const [currency, setCurrency] = useState('HKD');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const active = summary.state === 'active' && !!summary.account;
  const authed = active && hasMandateTransferAuth(summary.account.id);
  const available = useMemo(
    () => (active ? getMandateAvailableCash(summary.account.id, currency) : 0),
    [active, summary.account, currency],
  );
  const records = useMemo(
    () => (active ? getMandateWithdrawalsForUser().filter(w => w.accountId === summary.account.id) : []),
    [active, summary.account],
  );
  const pendingTotal = active ? getMandateWithdrawFrozen(summary.account.id, currency) : 0;
  const balance = active ? getMandateCashBalance(summary.account.id, currency) : 0;
  const symbol = CURRENCY_META[currency]?.symbol || '';

  const submit = () => {
    setError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError(t('请输入有效金额')); return; }
    const res = requestMandateWithdrawal({ accountId: summary.account.id, currency, amount: amt });
    if (!res.ok) { setError(t(res.error)); return; }
    setToast?.(t('提取申请已提交，待平台审核'));
    setAmount('');
    goBack(`#mandate-detail/${summary.account.id}`);
  };

  if (!active) {
    return (
      <div className="page mandate-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
            <h1>{t('提取')}</h1>
          </div>
        </div>
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('该委托账户暂不可查看，如需了解请联系客户经理。')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => goBack('#asset')}>{t('返回资产')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page mandate-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack(`#mandate-detail/${summary.account.id}`)}><ArrowLeft size={20} /></button>
          <h1>{t('提取')}</h1>
        </div>
      </div>

      {!authed && (
        <div className="mandate-withdraw-gate">
          <Info size={15} />
          {t('缺少资金划转常设授权（协议 14.2），请联系客户经理补签后再发起提取。')}
        </div>
      )}

      {/* 可用余额：主值 = 可提取（余额 − 在途）；余额与在途分列辅行，防止「余额和可用对不上」的困惑 */}
      <div className="mandate-hero mandate-withdraw-hero">
        <span className="mandate-hero-k">{t('可提取金额')}</span>
        <strong className="mandate-hero-v">{symbol} {formatExactAmount(Math.max(0, available))}</strong>
        <div className="mandate-hero-sub">
          <span>{t('余额')} {symbol} {formatExactAmount(balance)}</span>
          <span>{t('提取处理中')} {symbol} {formatExactAmount(pendingTotal)}</span>
        </div>
      </div>

      {authed && (
        <div className="card">
          <div className="card-title">{t('申请金额')}</div>
          <div className="form-group mandate-withdraw-amount">
            <div className="mandate-withdraw-input">
              <span className="mandate-withdraw-cur">{currency}</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                aria-label={t('申请金额')}
              />
            </div>
            <button
              type="button"
              className="btn-link"
              disabled={available <= 0}
              onClick={() => setAmount(String(Math.max(0, available)))}
            >
              {t('全部提取')}
            </button>
          </div>
          <div className="form-group">
            <label className="form-label">{t('提取币种')}</label>
            <select className="form-input" value={currency} onChange={e => setCurrency(e.target.value)}>
              {(summary.portfolio.cash.length ? summary.portfolio.cash : [{ currency: 'HKD' }]).map(c => (
                <option key={c.currency} value={c.currency}>{c.currency}</option>
              ))}
            </select>
          </div>
          <div className="mandate-withdraw-meta">
            <span>{t('预计到账')}</span>
            <strong>{t('提交后不少于')} {mandateConfig.withdrawalNoticeDays} {t('个营业日')}</strong>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button
            type="button"
            className="btn btn-primary btn-lg mandate-withdraw-submit"
            disabled={available <= 0}
            onClick={submit}
          >
            {t('提交提取申请')}
          </button>
        </div>
      )}

      <div className="card mandate-withdraw-notice">
        <div className="card-title">{t('提取须知')}</div>
        <p className="text-muted text-sm">{t('提取资金将划入您的现金账户，不会直接汇出银行；如需汇出银行，请在到账后另发起现金出金。')}</p>
        <p className="text-muted text-sm">{t('按协议约定，提取须提前提交书面通知，平台将在禁售期规限下不少于 10 个营业日内处理；遇暂停事件（协议 10.2）处理可能延迟。')}</p>
        <p className="text-muted text-sm">{t('持仓不在可提取范围内；大额变现请联系客户经理。因变现产生的市场影响与成本由客户承担（协议 10.3）。')}</p>
      </div>

      <div className="card">
        <div className="card-title">{t('提取记录')}</div>
        {records.length === 0 && <p className="text-muted text-sm">{t('暂无提取记录')}</p>}
        {records.map(w => (
          <div key={w.id} className="mandate-withdraw-row">
            <span className="mandate-withdraw-main">
              <strong>{w.currency} {formatExactAmount(w.amount)}</strong>
              <span className="text-muted text-sm">{String(w.createdAt).slice(0, 16)} · {w.no}</span>
              {w.status === 'rejected' && w.rejectReason && (
                <span className="text-muted text-sm">{t('未通过原因')}：{w.rejectReason}</span>
              )}
            </span>
            <span className="mandate-withdraw-side">
              <span className={`tag ${STATUS_CLS[w.status] || 'tag-neutral'}`}>{t(MANDATE_WITHDRAWAL_LABELS[w.status] || w.status)}</span>
              {(w.status === 'pending' || w.status === 'in_progress') && w.expectedDate && (
                <span className="text-muted text-sm">{t('预计')} {w.expectedDate}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <p className="mandate-disclaimer">
        {t('「提取」指委托账户资金划转入现金账户；「出金」指现金账户资金汇出银行，两者为不同流程。')}
      </p>
    </div>
  );
}
