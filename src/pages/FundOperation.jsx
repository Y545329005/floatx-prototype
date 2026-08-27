import { useRef, useState } from 'react';
import { ArrowLeft, Landmark, Upload, Zap, ShieldCheck } from 'lucide-react';
import {
  wallet, bankCards, platformAccounts, eddaAuth, authorizeEdda,
  depositRequests, withdrawRequests, submitDepositRequest, submitWithdrawRequest, formatCurrency,
} from '../mock/data';
import { useLang } from '../i18n';

const currencyOptions = [
  { key: 'hkd', label: 'HKD 港币', symbol: 'HK$' },
  { key: 'usd', label: 'USD 美元', symbol: '$' },
  { key: 'cny', label: 'CNY 人民币', symbol: '¥' },
];

// 白名单卡（出入金前置：≥1万 HKD 或等值 USD 转账白名单验证，2026-08-19）
const whitelistedCards = bankCards.filter(c => c.whitelistStatus === 'verified');

// 充值 / 提现 独立页（2026-08-19：充值重构为线下转账闭环——展示平台收款账户 + 方式选择 + 上传凭证 + 白名单卡
// 2026-08-21 登记模式：线下转账金额从「转账前申报」改为「转账后登记」（对标长桥/富途：看收款信息 → 自行转账 → 回 APP 登记转账金额+凭证）；
// eDDA 为 APP 内发起扣款，金额仍前置必填；提现必须填金额，不受影响）
// 路由：#fund-operation/deposit 和 #fund-operation/withdraw
export default function FundOperation({ mode, navigate, goBack }) {
  const { t } = useLang();
  const isDeposit = mode === 'deposit';
  const [currency, setCurrency] = useState('hkd');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(isDeposit ? 'bank' : 'bank'); // 充值通道：bank 银行转账 / edda eDDA 快捷入金
  const [bankCard, setBankCard] = useState(whitelistedCards[0]?.id || '');
  const [evidenceName, setEvidenceName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const cur = wallet[currency];
  const amountNum = parseFloat(amount) || 0;
  const [eddaReady, setEddaReady] = useState(eddaAuth.status === 'authorized'); // eddaAuth 非 React state，本地镜像驱动渲染

  // 模拟凭证选择：读取文件名作为凭证（演示阶段，接后端由真实文件上传替换）
  const handleEvidenceFile = (e) => {
    const f = e.target.files && e.target.files[0];
    setEvidenceName(f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(1)} MB` : '');
    setError('');
  };

  const handleSubmit = () => {
    if (amountNum <= 0) {
      setError(t('请输入有效金额'));
      return;
    }
    const bc = bankCards.find(b => b.id === bankCard);
    if (!bc) {
      setError(isDeposit ? t('请选择已通过白名单验证的付款银行卡') : t('请选择已通过白名单验证的收款银行卡'));
      return;
    }
    const opts = {
      currency: currency.toUpperCase(),
      amount: amountNum,
      method: isDeposit && method === 'edda' ? 'eDDA' : '银行转账',
      cardId: bc.id,
      bank: bc.bank,
      cardNo: bc.cardNo,
    };
    let ok;
    if (isDeposit) {
      if (method === 'edda') {
        if (!eddaReady) {
          setError(t('请先在银行卡管理完成 eDDA 授权'));
          return;
        }
        ok = submitDepositRequest(opts);
      } else {
        if (!evidenceName) {
          setError(t('请上传银行转账凭证'));
          return;
        }
        ok = submitDepositRequest({ ...opts, evidence: { name: evidenceName, size: '—', uploadedAt: '' } });
      }
    } else {
      ok = submitWithdrawRequest(opts);
    }
    if (!ok) {
      setError(isDeposit ? t('入金申请提交失败，请检查付款卡与凭证') : t('可用余额不足或收款卡未通过验证'));
      return;
    }
    // 提交成功 → 跳转资金申请详情页（新申请 unshift 到头部，取最新一条）
    const reqs = isDeposit ? depositRequests : withdrawRequests;
    const req = reqs[0];
    navigate(`#fund-request/${req.id}`);
  };

  const renderAccountCard = () => {
    const acc = platformAccounts.deposit;
    return (
      <div className="card fund-account-card">
        <div className="fund-account-title">
          <Landmark size={16} />
          <span>{t('转账至平台收款账户')}</span>
        </div>
        <div className="fund-account-row">
          <span className="text-muted">{t('银行')}</span>
          <strong>{acc.bank}</strong>
        </div>
        <div className="fund-account-row">
          <span className="text-muted">{t('户名')}</span>
          <strong>{acc.accountName}</strong>
        </div>
        <div className="fund-account-row">
          <span className="text-muted">{t('账号')}</span>
          <strong className="date-iso">{acc.accountNo}</strong>
        </div>
        <div className="fund-account-row">
          <span className="text-muted">{t('币种')}</span>
          <strong>{acc.currency}</strong>
        </div>
        <p className="text-muted text-sm fund-account-tip">
          {t('请使用白名单银行卡向此账户完成转账，然后在下方登记转账金额并上传凭证。')}
        </p>
      </div>
    );
  };

  return (
    <div className="page fund-operation-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#wallet')}><ArrowLeft size={20} /></button>
          <h1>{isDeposit ? t('充值入金') : t('提现出金')}</h1>
        </div>
      </div>

      <p className="text-muted text-sm fund-operation-note">
        {isDeposit
          ? `${t('线下转账 + 登记核销：请先向平台收款账户完成转账，再登记转账金额并上传凭证，财务核对到账后上账')}`
          : `${t('当前可用')} ${cur.label} ${cur.symbol}${formatCurrency(cur.balance)}`}
      </p>

      {isDeposit && renderAccountCard()}

      <div className="card fund-operation-form">
        {isDeposit && (
          <div className="form-group">
            <label className="form-label">{t('入金方式')}</label>
            <div className="fund-method-chips">
              <button
                type="button"
                className={`chip ${method === 'bank' ? 'active' : ''}`}
                onClick={() => { setMethod('bank'); setError(''); }}
              >
                <Upload size={14} /> {t('银行转账')}
              </button>
              <button
                type="button"
                className={`chip ${method === 'edda' ? 'active' : ''}`}
                onClick={() => { setMethod('edda'); setError(''); }}
              >
                <Zap size={14} /> {t('eDDA 快捷入金')}
              </button>
            </div>
            {method === 'edda' && (
              <div className={`fund-edda-note${eddaReady ? ' ok' : ''}`}>
                {eddaReady ? (
                  <><ShieldCheck size={14} /> {t('已授权 eDDA：')}{eddaAuth.bank}（{eddaAuth.accountMasked}）{t('可直接发起入金')}</>
                ) : (
                  <>
                    <ShieldCheck size={14} /> {t('eDDA 未授权，需先从中国银行（香港）授权快捷扣款')}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => { authorizeEdda(); setEddaReady(true); setError(''); }}
                    >
                      {t('模拟授权')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t('币种')}</label>
          <select className="form-input" value={currency} onChange={e => { setCurrency(e.target.value); setError(''); }}>
            {currencyOptions.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* 金额前置：提现（必须填）与 eDDA（APP 内发起扣款）；线下转账（bank）的金额移至付款卡之后——转账完成后登记，语义是「转了多少」而非「要充多少」 */}
        {(!isDeposit || method === 'edda') && (
          <div className="form-group">
            <label className="form-label">{t('金额')}</label>
            <div className="input-group">
              <span className="input-symbol">{cur.symbol}</span>
              <input
                className="form-input"
                type="number"
                placeholder={t('请输入金额')}
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                inputMode="decimal"
              />
            </div>
          </div>
        )}

        {isDeposit && method === 'edda' ? (
          <div className="form-group">
            <label className="form-label">{t('扣款账户（eDDA）')}</label>
            <div className="fund-edda-account">
              <span>{eddaAuth.bank}（{eddaAuth.accountMasked}）</span>
              {eddaReady
                ? <span className="tag tag-success">{t('已授权')}</span>
                : <span className="tag tag-neutral">{t('未授权')}</span>}
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">{isDeposit ? t('付款银行卡（白名单）') : t('收款银行卡（白名单）')}</label>
            <select className="form-input" value={bankCard} onChange={e => { setBankCard(e.target.value); setError(''); }}>
              {whitelistedCards.map(c => (
                <option key={c.id} value={c.id}>{c.bank} {c.maskedNo} · {c.currency}</option>
              ))}
            </select>
            {whitelistedCards.length === 0 && (
              <p className="form-error">{t('暂无白名单银行卡，请先完成白名单验证')}</p>
            )}
          </div>
        )}

        {/* 线下转账（bank）专属：转账完成后的登记区——转账金额（按银行回执填写）+ 参考号 + 凭证，三者的核对锚点是用户声明的转账金额 */}
        {isDeposit && method === 'bank' && (
          <div className="form-group">
            <label className="form-label">{t('转账金额（转账完成后登记）')}</label>
            <div className="input-group">
              <span className="input-symbol">{cur.symbol}</span>
              <input
                className="form-input"
                type="number"
                placeholder={t('请按银行回执填写实际转账金额')}
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                inputMode="decimal"
              />
            </div>
          </div>
        )}

        {isDeposit && method === 'bank' && (
          <div className="form-group">
            <label className="form-label">{t('银行转账参考号（可选）')}</label>
            <input
              className="form-input"
              placeholder={t('转账后银行回执上的参考号')}
              onChange={() => { if (error) setError(''); }}
            />
            <div className="fund-evidence-box" onClick={() => fileRef.current && fileRef.current.click()}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleEvidenceFile}
              />
              {evidenceName ? (
                <div className="fund-evidence-done">
                  <Upload size={18} />
                  <div>
                    <strong>{evidenceName.split(' · ')[0]}</strong>
                    <span className="text-muted text-sm">{evidenceName.split(' · ')[1] || ''} · {t('点击重新上传')}</span>
                  </div>
                </div>
              ) : (
                <div className="fund-evidence-empty">
                  <Upload size={20} />
                  <strong>{t('上传转账凭证')}</strong>
                  <span className="text-muted text-sm">{t('截图或转账回执，财务据此核对到账（演示阶段仅模拟文件名）')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-full" onClick={handleSubmit}>
          {isDeposit
            ? (method === 'edda' ? t('提交 eDDA 入金申请') : t('完成转账，提交登记'))
            : t('提交提现申请')}
        </button>
        {isDeposit && (
          <p className="text-muted text-sm fund-operation-tip">
            {t('到账时间以财务核对为准，不承诺到账时效')}
          </p>
        )}
      </div>
    </div>
  );
}
