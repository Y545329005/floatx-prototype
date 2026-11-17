import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
//
// 页面结构（2026-11-17 重排）：这页只回答四件事——能取多少、取多少、钱去哪、以前提交的怎么样了。
//   因此只剩三段：① 可提取（hero）② 填金额并确认（一张卡）③ 提取记录（列表）+ 协议细节（细字）。
//   原先的「提取须知」三张卡被拆掉：①② 变成确认区的两行事实（划入 / 到账），③ 变成页脚细字，
//   协议条款一句没删，只是不再挡在表单和记录之间。

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
  // 只有真的有钱的币种才列出来：给出 zero-balance 的选项等于让客户先选错再被拒
  const currencies = (summary.portfolio?.cash || [])
    .filter(c => Number(c.balance) > 0.0001)
    .map(c => c.currency);
  const hasPending = pendingTotal > 0.0001;

  // 记录行的日期列：同年只写 MM-DD，跨年才写全
  const years = new Set(records.map(w => String(w.createdAt).slice(0, 4)));
  const dateOf = (at) => (years.size > 1 ? String(at).slice(0, 10) : String(at).slice(5, 10));

  // 记录行的第二行：状态 + 与状态相关的那一个事实（到账日 / 预计日 / 未通过原因）。
  // 不再放状态胶囊——胶囊在 390px 占掉半行宽，且与这行说的是同一件事。
  const sublineOf = (w) => {
    const label = t(MANDATE_WITHDRAWAL_LABELS[w.status] || w.status);
    // 拒绝原因是运营手写的自由文本；种子里的那句进词典，后台新写的原样显示
    if (w.status === 'rejected') return w.rejectReason ? `${label} · ${t(w.rejectReason)}` : label;
    if (w.expectedDate && (w.status === 'pending' || w.status === 'in_progress')) {
      return `${label} · ${t('预计')} ${dateOf(w.expectedDate)}`;
    }
    if (w.status === 'completed' && w.completedAt) return `${label} · ${dateOf(w.completedAt)}`;
    return label;
  };

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

      {/* ① 能取多少：主值是可提取（余额 − 在途）。有在途时补一行把差额讲清，
          没有在途时两个数相同，就不摆第二个数（同一屏同一数字只讲一遍）。 */}
      <div className="mandate-hero mandate-withdraw-hero">
        <span className="mandate-hero-k">{t('可提取金额')}</span>
        <strong className="mandate-hero-v">{symbol} {formatExactAmount(Math.max(0, available))}</strong>
        <p className="mandate-withdraw-hint">
          {hasPending
            ? `${t('余额')} ${symbol} ${formatExactAmount(balance)} · ${t('提取处理中')} ${symbol} ${formatExactAmount(pendingTotal)}`
            : t('持仓不计入可提取金额')}
        </p>
      </div>

      {/* ② 取多少 + 去哪：输入与确认在同一张卡里，客户按下提交前不用翻到别处找事实 */}
      <div className="card">
        <div className="mandate-withdraw-amount-head">
          <span className="form-label">{t('提取金额')}</span>
          <button
            type="button"
            className="btn-link"
            disabled={!authed || available <= 0}
            onClick={() => { setAmount(String(Math.max(0, available))); setError(''); }}
          >
            {t('全部提取')}
          </button>
        </div>

        <div className="mandate-withdraw-input">
          <span className="mandate-withdraw-cur">{symbol || currency}</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={amount}
            disabled={!authed}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="0.00"
            aria-label={t('提取金额')}
          />
        </div>

        {/* 多币种账户才需要选币种；单币种时这个控件是空转的，直接不渲染 */}
        {currencies.length > 1 && (
          <div className="fund-method-chips mandate-withdraw-curs">
            {currencies.map(c => (
              <button
                key={c}
                type="button"
                className={`chip ${currency === c ? 'active' : ''}`}
                onClick={() => { setCurrency(c); setAmount(''); setError(''); }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <dl className="mandate-withdraw-facts">
          <div>
            <dt>{t('划入')}</dt>
            <dd>{t('现金账户')}</dd>
          </div>
          <div>
            <dt>{t('到账时间')}</dt>
            <dd>{t('提交后不少于')} {mandateConfig.withdrawalNoticeDays} {t('个营业日')}</dd>
          </div>
        </dl>
        <p className="mandate-withdraw-hint">{t('资金不会直接汇到银行；如需汇出，到账后可在现金账户发起出金。')}</p>

        {error && <p className="form-error">{error}</p>}
        <button
          type="button"
          className="btn btn-primary btn-lg mandate-withdraw-submit"
          disabled={!authed || available <= 0}
          onClick={submit}
        >
          {t('提交提取申请')}
        </button>
        {/* 缺授权时按钮置灰、原因落一行（与详情页 hero 按钮的处理一致），而不是整块表单消失 */}
        {!authed && (
          <p className="mandate-withdraw-gate-note">
            {t('尚未签署资金划转常设授权书，请联系客户经理补签后提交。')}
          </p>
        )}
      </div>

      {/* ③ 以前提交的怎么样了：与资金记录同一套行式（日期 · 金额 · 状态） */}
      <div className="card">
        <div className="card-title">{t('提取记录')}</div>
        {records.length === 0 && <p className="text-muted text-sm">{t('暂无提取记录')}</p>}
        {records.map(w => (
          <div key={w.id} className="mandate-trade-row is-static">
            <span className="mandate-list-date">{dateOf(w.createdAt)}</span>
            <span className="mandate-trade-main">
              <strong>{CURRENCY_META[w.currency]?.symbol || w.currency} {formatExactAmount(w.amount)}</strong>
              <span>{sublineOf(w)}</span>
            </span>
          </div>
        ))}
      </div>

      {/* 页脚（2026-11-17 定版）：原来是把合同义务摘出来贴给客户看——主语是「提取」「变现」，
          还夹着两个指不到任何条款的编号（协议正文是六节无编号）。改成客户视角的两句话：
          可能更慢 / 想连持仓一起取要先卖、成本自担。事实一条没少。 */}
      <p className="mandate-disclaimer">
        {t('遇上市况异常、暂停交易等情况，到账会比页面显示的时间更晚。')}
        {t('想把持仓一起取出来，请联系客户经理——由管理人先卖出，卖出时的价格波动与交易成本由您承担。')}
      </p>
    </div>
  );
}
