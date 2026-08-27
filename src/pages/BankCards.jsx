import { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Trash2, X, ShieldCheck, ShieldQuestion, Zap } from 'lucide-react';
import { bankCards, platformAccounts, eddaAuth, authorizeEdda, submitCardVerification } from '../mock/data';
import { useLang } from '../i18n';

const whitelistMeta = {
  verified: { label: '白名单 · 已验证', cls: 'tag-success' },
  verifying: { label: '验证中', cls: 'tag-warning' },
  unverified: { label: '未验证', cls: 'tag-neutral' },
};

// 验证款建议金额：HKD ≥ 1万；USD/CNY 按等值换算（1万 HKD ≈ 1282 USD ≈ 9346 CNY）
const suggestAmount = (currency) => (currency === 'USD' ? 1300 : currency === 'CNY' ? 9500 : 10000);

// 银行卡管理（2026-08-19 白名单机制：出入金仅限已验证白名单卡；新增 eDDA 授权入口）
// 白名单验证：向平台收款账户转账 ≥1万 HKD（或等值 USD）→ 财务核对到账 → 卡片置白名单
export default function BankCards({ navigate, goBack }) {
  const { t } = useLang();
  const [cards, setCards] = useState(bankCards.map(c => ({ ...c })));
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [verifyingCard, setVerifyingCard] = useState(null); // 发起验证的卡（id）
  const [verifyForm, setVerifyForm] = useState({ currency: 'HKD', amount: '', remark: '' });
  const [verifyError, setVerifyError] = useState('');
  const [eddaReady, setEddaReady] = useState(eddaAuth.status === 'authorized'); // eddaAuth 非 React state，本地镜像驱动渲染

  const removeCard = (id) => {
    const idx = bankCards.findIndex(c => c.id === id);
    if (idx >= 0) bankCards.splice(idx, 1);
    setCards(cards.filter(c => c.id !== id));
    setConfirmRemove(null);
  };

  // 发起白名单验证：转账验证款 → 财务核对 → 置白名单
  const startVerification = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    setVerifyingCard(cardId);
    setVerifyForm({ currency: card.currency || 'HKD', amount: String(suggestAmount(card.currency || 'HKD')), remark: `卡片白名单验证（${card.maskedNo}）` });
    setVerifyError('');
  };

  const submitVerification = () => {
    const amount = parseFloat(verifyForm.amount) || 0;
    if (amount <= 0) { setVerifyError(t('请输入有效的验证转账金额')); return; }
    const ok = submitCardVerification({
      cardId: verifyingCard,
      currency: verifyForm.currency,
      amount,
      remark: verifyForm.remark,
    });
    if (!ok) { setVerifyError(t('该卡已通过验证或提交失败')); return; }
    setCards(bankCards.map(c => ({ ...c }))); // 同步真实数据源状态
    setVerifyingCard(null);
  };

  const renderVerificationSheet = () => {
    const card = cards.find(c => c.id === verifyingCard);
    if (!card) return null;
    const acc = platformAccounts.deposit;
    return (
      <>
        <div className="sheet-mask" onClick={() => setVerifyingCard(null)} />
        <div className="sheet">
          <div className="sheet-header">
            <h3>{t('白名单验证')} · {card.bank}（{card.maskedNo}）</h3>
            <button className="btn-icon" onClick={() => setVerifyingCard(null)}><X size={18} /></button>
          </div>
          <p className="text-muted text-sm sheet-sub">
            {t('请向平台收款账户转账验证款（≥1万 HKD 或等值 USD），财务核对到账后该卡生效，可用于出入金。验证款将计入可用余额。')}
          </p>
          <div className="bank-verify-account">
            <div className="bank-verify-account-row"><span className="text-muted">{t('收款银行')}</span><strong>{acc.bank}</strong></div>
            <div className="bank-verify-account-row"><span className="text-muted">{t('户名')}</span><strong>{acc.accountName}</strong></div>
            <div className="bank-verify-account-row"><span className="text-muted">{t('账号')}</span><strong className="date-iso">{acc.accountNo}</strong></div>
          </div>
          <div className="bank-card-add-form">
            <div className="form-group">
              <label className="form-label">{t('验证款币种')}</label>
              <select
                className="form-input"
                value={verifyForm.currency}
                onChange={e => {
                  const cur = e.target.value;
                  setVerifyForm(f => ({ ...f, currency: cur, amount: String(suggestAmount(cur)) }));
                  setVerifyError('');
                }}
              >
                <option value="HKD">HKD 港币</option>
                <option value="USD">USD 美元</option>
                <option value="CNY">CNY 人民币</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('验证转账金额')}</label>
              <div className="input-group">
                <span className="input-symbol">{verifyForm.currency === 'USD' ? '$' : verifyForm.currency === 'CNY' ? '¥' : 'HK$'}</span>
                <input
                  className="form-input"
                  type="number"
                  value={verifyForm.amount}
                  onChange={e => { setVerifyForm(f => ({ ...f, amount: e.target.value })); setVerifyError(''); }}
                  inputMode="decimal"
                />
              </div>
              <p className="text-muted text-sm">
                {t('最低 1万 HKD 或等值 USD；请务必填写转账附言以便核对归属')}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">{t('转账附言')}</label>
              <input
                className="form-input"
                value={verifyForm.remark}
                onChange={e => { setVerifyForm(f => ({ ...f, remark: e.target.value })); setVerifyError(''); }}
                placeholder={t('如：卡片白名单验证（卡号后四位）')}
              />
            </div>
            {verifyError && <p className="form-error">{verifyError}</p>}
            <button className="btn btn-primary btn-full" onClick={submitVerification}>{t('提交验证')}</button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="page bank-cards-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#wallet')}><ArrowLeft size={20} /></button>
          <h1>{t('银行卡管理')}</h1>
        </div>
      </div>

      <p className="text-muted text-sm bank-cards-note">
        {t('出入金仅限「白名单」银行卡。新卡需通过转账验证（≥1万 HKD 或等值 USD）后方可用于资金往来。')}
      </p>

      {/* eDDA 快捷入金授权 */}
      <div className="card edda-auth-card">
        <div className="edda-auth-head">
          <div className="edda-auth-title">
            <Zap size={16} />
            <span>{t('eDDA 快捷入金')}</span>
          </div>
          {eddaAuth.status === 'authorized'
            ? <span className="tag tag-success">{t('已授权')}</span>
            : <span className="tag tag-neutral">{t('未授权')}</span>}
        </div>
        <p className="text-muted text-sm">
          {(eddaReady ? `${t('已授权从')} ${eddaAuth.bank}（${eddaAuth.accountMasked}）${t('快捷扣款入金')}${eddaAuth.authorizedAt ? ` · ${eddaAuth.authorizedAt}` : ''}` : t('授权后充值可直接选择 eDDA 快捷入金通道（香港本土）。'))}
        </p>
        {!eddaReady && (
          <button className="btn btn-outline btn-full edda-auth-btn" onClick={() => { authorizeEdda(); setEddaReady(true); }}>
            {t('模拟完成 eDDA 授权')}
          </button>
        )}
      </div>

      {cards.length === 0 && (
        <div className="bank-cards-empty">
          <p className="text-muted">{t('暂无绑定银行卡')}</p>
        </div>
      )}

      {cards.map(c => {
        const meta = whitelistMeta[c.whitelistStatus] || whitelistMeta.unverified;
        return (
          <div key={c.id} className="card bank-card">
            <div className="bank-card-top">
              <div className="bank-card-brand">
                <CreditCard size={18} />
                <div>
                  <strong>{c.bank}</strong>
                  <span className="text-muted text-sm">{c.branch} · {c.type}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setConfirmRemove(c)}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="bank-card-masked">{c.maskedNo}</div>
            <div className="bank-card-bottom">
              <span className="text-muted text-sm">{c.holder}</span>
              <span className="tag tag-currency">{c.currency}</span>
            </div>
            <div className="bank-card-whitelist">
              {c.whitelistStatus === 'verified' ? (
                <><ShieldCheck size={14} className="wl-ok" /> <span>{meta.label}{c.verifiedAmount ? ` · ${c.currency} ${c.verifiedAmount.toLocaleString()}` : ''}</span></>
              ) : c.whitelistStatus === 'verifying' ? (
                <><ShieldQuestion size={14} /> <span>{meta.label} · {t('财务核对中')}</span></>
              ) : (
                <><ShieldQuestion size={14} /> <span>{meta.label} · {t('不能用于出入金')}</span></>
              )}
            </div>
            {c.whitelistStatus !== 'verified' && (
              <button className="btn btn-outline btn-full bank-verify-btn" onClick={() => startVerification(c.id)}>
                {c.whitelistStatus === 'verifying' ? t('查看/重新验证') : t('发起白名单验证')}
              </button>
            )}
          </div>
        );
      })}

      <button className="btn btn-outline btn-full bank-cards-add" onClick={() => setShowAdd(true)}>
        <Plus size={16} /> {t('添加银行卡')}
      </button>

      {showAdd && (
        <>
          <div className="sheet-mask" onClick={() => setShowAdd(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('添加银行卡')}</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">{t('新卡添加后需通过白名单验证（≥1万 HKD 转账）方可处理出入金。')}</p>
            <div className="bank-card-add-form">
              <div className="form-group">
                <label className="form-label">{t('银行')}</label>
                <select className="form-input">
                  <option>星展银行</option>
                  <option>汇丰银行</option>
                  <option>中国银行（香港）</option>
                  <option>渣打银行</option>
                  <option>恒生银行</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('账户币种')}</label>
                <select className="form-input">
                  <option>HKD 港币</option>
                  <option>USD 美元</option>
                  <option>CNY 人民币</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('银行卡号')}</label>
                <input className="form-input" placeholder={t('请输入银行卡号')} inputMode="numeric" />
              </div>
              <button className="btn btn-primary btn-full" onClick={() => {
                // 演示阶段：新增卡加入真实数据源（unverified），以便演示白名单验证流程
                bankCards.push({
                  id: `bc${Date.now()}`,
                  userId: bankCards[0]?.userId || 'u1',
                  bank: '星展银行',
                  branch: '香港',
                  holder: 'ZHANG SAN',
                  maskedNo: '**** 8888',
                  cardNo: '6222 3456 7890 8888',
                  type: '香港账户',
                  currency: 'HKD',
                  whitelistStatus: 'unverified',
                  verifiedAt: null,
                  verifiedAmount: null,
                });
                setCards(bankCards.map(c => ({ ...c })));
                setShowAdd(false);
              }}>{t('提交（待白名单验证）')}</button>
            </div>
          </div>
        </>
      )}

      {confirmRemove && (
        <>
          <div className="sheet-mask" onClick={() => setConfirmRemove(null)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('解绑银行卡')}</h3>
              <button className="btn-icon" onClick={() => setConfirmRemove(null)}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {t('确认解绑')} {confirmRemove.bank}（{confirmRemove.maskedNo}）？{t('解绑后该账户将无法用于资金往来')}
            </p>
            <div className="bank-card-confirm-actions">
              <button className="btn btn-outline btn-full" onClick={() => setConfirmRemove(null)}>{t('取消')}</button>
              <button className="btn btn-danger btn-full" onClick={() => removeCard(confirmRemove.id)}>{t('确认解绑')}</button>
            </div>
          </div>
        </>
      )}

      {renderVerificationSheet()}
    </div>
  );
}
