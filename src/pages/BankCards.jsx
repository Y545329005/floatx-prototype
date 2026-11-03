import { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Trash2, X, ShieldCheck, ShieldQuestion, Check, Upload, Ban, RotateCcw } from 'lucide-react';
import {
  bankCards, BANK_CARD_STATUS, CARD_REVIEW_STATUS, CARD_QUOTA_PER_CURRENCY,
  JURISDICTIONS, jurisdictionLabel, countActiveCards,
  recordAgreement, getFreezeState, formatExactAmount,
  addBankCard, removeBankCard, setBankCardDisabled, currentUser,
} from '../mock/data';
import { useLang } from '../i18n';
import AgreementModal from '../components/AgreementModal';

// 用户侧四态 + 后台审核子态（2026-11-04 · 对齐集团《统一法币出入金整体方案》§5.5）
// 待验证里再分「卡审核中」与「审核通过、待首充」——两者用户都要等，但动作不同：
// 审核中不能充值，审核通过后要用该卡首充 ≥1万 HKD 等值才加白。
const cardStatusMeta = {
  [BANK_CARD_STATUS.VERIFIED]: { label: '已验证 · 白名单', cls: 'tag-success' },
  [BANK_CARD_STATUS.UNVERIFIED]: { label: '待验证', cls: 'tag-warning' },
  [BANK_CARD_STATUS.DISABLED]: { label: '已停用', cls: 'tag-neutral' },
  [BANK_CARD_STATUS.REJECTED]: { label: '已拒绝', cls: 'tag-danger' },
};

const CURRENCIES = [
  { key: 'HKD', label: 'HKD 港币' },
  { key: 'USD', label: 'USD 美元' },
  { key: 'CNH', label: 'CNH 离岸人民币' },
];

// 银行卡管理（2026-11-04 重构）
// 链路：添加卡（个人单名 + 开户地区 + 卡照/开户证明）→ 后台卡审核 → 待验证
//       → 用该卡充值 ≥1万 HKD 等值 → 财务确认到账时自动加白（独立白名单验证单已下线）
export default function BankCards({ navigate, goBack }) {
  const { t, lang } = useLang();
  const [freezeBlocked, setFreezeBlocked] = useState(false);
  const ownedCards = () => bankCards.filter(c => c.userId === currentUser.id).map(c => ({ ...c }));
  const [cards, setCards] = useState(ownedCards);

  // 新增卡表单（2026-11-04：账户类型 + 开户地区 + 凭证三项补齐）
  const [addForm, setAddForm] = useState({ bank: '星展银行', currency: 'HKD', cardNo: '', accountType: 'personal', region: 'HK' });
  const [addProof, setAddProof] = useState('');
  const [addError, setAddError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [addAgreed, setAddAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const refresh = () => setCards(ownedCards());

  const removeCard = (id) => {
    if (getFreezeState().frozen) {
      setConfirmRemove(null);
      setFreezeBlocked(true);
      return;
    }
    const res = removeBankCard(id);
    if (!res.ok) { setAddError(res.error); setConfirmRemove(null); return; }
    refresh();
    setConfirmRemove(null);
    setAddError('');
  };

  const toggleDisabled = (card) => {
    if (getFreezeState().frozen) { setFreezeBlocked(true); return; }
    const res = setBankCardDisabled(card.id, card.whitelistStatus !== BANK_CARD_STATUS.DISABLED);
    if (!res.ok) { setAddError(res.error); return; }
    refresh();
    setAddError('');
  };

  const submitCard = () => {
    if (!addAgreed) return;
    if (getFreezeState().frozen) { setShowAdd(false); setFreezeBlocked(true); return; }
    const digits = addForm.cardNo.replace(/\D/g, '');
    if (digits.length < 8) { setAddError(t('请输入有效的银行卡号（至少 8 位数字）')); return; }
    if (!addProof) { setAddError(t('请上传银行卡照片或开户证明')); return; }
    const res = addBankCard({
      bank: addForm.bank,
      branch: addForm.region === 'HK' ? '香港' : jurisdictionLabel(addForm.region, lang),
      holder: currentUser.name || '—',
      cardNo: addForm.cardNo.trim(),
      type: addForm.region === 'HK' ? '香港账户' : '海外账户',
      currency: addForm.currency,
      accountType: addForm.accountType,
      region: addForm.region,
      proofImage: addProof,
    });
    if (!res.ok) { setAddError(res.error || t('添加失败，请检查填写内容后重试')); return; }
    recordAgreement({ type: 'bank-card', agreementIds: ['bank-card-service'] });
    refresh();
    setShowAdd(false);
    setAddAgreed(false);
    setAddForm({ bank: '星展银行', currency: 'HKD', cardNo: '', accountType: 'personal', region: 'HK' });
    setAddProof('');
    setAddError('');
  };

  const renderStatus = (c) => {
    const meta = cardStatusMeta[c.whitelistStatus] || cardStatusMeta[BANK_CARD_STATUS.UNVERIFIED];
    if (c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED) {
      if (c.reviewStatus === CARD_REVIEW_STATUS.PENDING) {
        return <><ShieldQuestion size={14} /> <span>{meta.label} · {t('资料审核中')}</span></>;
      }
      return <><ShieldQuestion size={14} /> <span>{meta.label} · {t('首充 ≥1万 HKD 等值后加白')}</span></>;
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.VERIFIED) {
      return <><ShieldCheck size={14} className="wl-ok" /> <span>{meta.label}{c.verifiedAmount ? ` · ${c.currency} ${formatExactAmount(c.verifiedAmount)}` : ''}</span></>;
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.REJECTED) {
      return <><Ban size={14} /> <span>{meta.label}{c.reviewReason ? ` · ${c.reviewReason}` : ''}</span></>;
    }
    return <><Ban size={14} /> <span>{meta.label}</span></>;
  };

  return (
    <div className="page bank-cards-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('银行卡管理')}</h1>
        </div>
      </div>

      {getFreezeState().frozen && (
        <div className="sc-freeze-banner">
          <ShieldCheck size={16} />
          <span>{t('安全冻结生效中：出金账户变更将暂停至 {time}（{reason}）').replace('{time}', String(getFreezeState().until).replace('T', ' ').slice(0, 16)).replace('{reason}', getFreezeState().reason || '')}</span>
        </div>
      )}
      {freezeBlocked && <div className="sc-freeze-banner">{t('安全冻结生效中：安全项变更后 24 小时内无法变更出金账户')}</div>}

      <p className="text-muted text-sm bank-cards-note">
        {t('出入金仅限「已验证」银行卡：添加卡 → 专员审核资料 → 用该卡首充 ≥1万 HKD 等值 → 自动加入白名单。每个币种最多 3 张。')}
      </p>

      {cards.length === 0 && (
        <div className="bank-cards-empty">
          <p className="text-muted">{t('暂无绑定银行卡')}</p>
        </div>
      )}

      {cards.map(c => (
        <div key={c.id} className="card bank-card">
          <div className="bank-card-top">
            <div className="bank-card-brand">
              <CreditCard size={18} />
              <div>
                <strong>{c.bank}</strong>
                <span className="text-muted text-sm">{jurisdictionLabel(c.region, lang)} · {c.type}</span>
              </div>
            </div>
            <div className="bank-card-actions">
              {(c.whitelistStatus === BANK_CARD_STATUS.VERIFIED || c.whitelistStatus === BANK_CARD_STATUS.DISABLED) && (
                <button className="btn-icon" title={c.whitelistStatus === BANK_CARD_STATUS.DISABLED ? t('启用') : t('停用')} onClick={() => toggleDisabled(c)}>
                  {c.whitelistStatus === BANK_CARD_STATUS.DISABLED ? <RotateCcw size={16} /> : <Ban size={16} />}
                </button>
              )}
              <button className="btn-icon" title={t('删除')} onClick={() => setConfirmRemove(c)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="bank-card-masked">{c.maskedNo}</div>
          <div className="bank-card-bottom">
            <span className="text-muted text-sm">{c.holder}</span>
            <span className="tag tag-currency">{c.currency}</span>
          </div>
          <div className="bank-card-whitelist">{renderStatus(c)}</div>
          {c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED && c.reviewStatus === CARD_REVIEW_STATUS.APPROVED && (
            <button className="btn btn-outline btn-full bank-verify-btn" onClick={() => navigate('#fund-operation/deposit')}>
              {t('去充值验证')}
            </button>
          )}
        </div>
      ))}

      {addError && <p className="form-error">{addError}</p>}

      <button
        className="btn btn-outline btn-full bank-cards-add"
        onClick={() => { setAddError(''); setShowAdd(true); }}
      >
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
            <p className="text-muted text-sm sheet-sub">{t('仅接受个人单名账户；联名账户不可用于出入金。提交后由专员审核资料。')}</p>
            <div className="bank-card-add-form">
              <div className="form-group">
                <label className="form-label">{t('银行')}</label>
                <select
                  className="form-input"
                  value={addForm.bank}
                  onChange={e => { setAddForm(f => ({ ...f, bank: e.target.value })); setAddError(''); }}
                >
                  <option>星展银行</option>
                  <option>汇丰银行</option>
                  <option>中国银行（香港）</option>
                  <option>渣打银行</option>
                  <option>恒生银行</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('账户类型')}</label>
                <select
                  className="form-input"
                  value={addForm.accountType}
                  onChange={e => { setAddForm(f => ({ ...f, accountType: e.target.value })); setAddError(''); }}
                >
                  <option value="personal">{t('个人单名账户')}</option>
                  <option value="joint" disabled>{t('联名账户（不支持）')}</option>
                </select>
                <p className="fund-field-hint">{t('只接受与实名一致的个人账户；联名账户转账视为非同名人转账，不予入账。')}</p>
              </div>
              <div className="form-group">
                <label className="form-label">{t('开户国家 / 地区')}</label>
                <select
                  className="form-input"
                  value={addForm.region}
                  onChange={e => { setAddForm(f => ({ ...f, region: e.target.value })); setAddError(''); }}
                >
                  {JURISDICTIONS.map(j => (
                    <option key={j.code} value={j.code}>{jurisdictionLabel(j.code, lang)}</option>
                  ))}
                </select>
                <p className="fund-field-hint">{t('仅接受证监会合资格司法管辖区（含香港）开立的银行账户。')}</p>
              </div>
              <div className="form-group">
                <label className="form-label">{t('账户币种')}</label>
                <select
                  className="form-input"
                  value={addForm.currency}
                  onChange={e => { setAddForm(f => ({ ...f, currency: e.target.value })); setAddError(''); }}
                >
                  {CURRENCIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <p className="fund-field-hint">{t('该币种已有 {n} / {max} 张有效卡').replace('{n}', String(countActiveCards(addForm.currency, currentUser.id))).replace('{max}', String(CARD_QUOTA_PER_CURRENCY))}</p>
              </div>
              <div className="form-group">
                <label className="form-label">{t('银行卡号')}</label>
                <input
                  className="form-input"
                  placeholder={t('请输入银行卡号')}
                  inputMode="numeric"
                  value={addForm.cardNo}
                  onChange={e => { setAddForm(f => ({ ...f, cardNo: e.target.value })); setAddError(''); }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('银行卡照片 / 开户证明')}</label>
                <label className="fund-evidence-box" style={{ display: 'block' }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files && e.target.files[0];
                      // 演示：记录文件名，审核抽屉展示演示占位图（接后端替换为真实上传 URL）
                      setAddProof(f ? 'images/demo-bank-card.jpg' : '');
                      setAddError('');
                    }}
                  />
                  {addProof ? (
                    <div className="fund-evidence-done">
                      <Upload size={18} />
                      <div><strong>{t('已上传')}</strong><span className="text-muted text-sm"> · {t('点击重新上传')}</span></div>
                    </div>
                  ) : (
                    <div className="fund-evidence-empty">
                      <Upload size={20} />
                      <strong>{t('点击上传')}</strong>
                      <span className="text-muted text-sm">{t('用于核对账户姓名与卡号')}</span>
                    </div>
                  )}
                </label>
              </div>
              <div
                className="form-checkbox-group"
                onClick={() => setAddAgreed(!addAgreed)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`kyc-checkbox ${addAgreed ? 'checked' : ''}`}>
                  {addAgreed && <Check size={12} />}
                </div>
                <span className="bank-card-agree-label">
                  {t('我已阅读并同意')}
                  <a
                    href="#bank-card-service"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setViewingDoc('bank-card-service'); }}
                  >
                    {t('《银行卡及出入金服务协议》')}
                  </a>
                </span>
              </div>
              <button
                className="btn btn-primary btn-full"
                disabled={!addAgreed}
                style={{ opacity: addAgreed ? 1 : 0.45 }}
                onClick={submitCard}
              >{t('提交审核')}</button>
              {addError && <div className="form-error">{addError}</div>}
            </div>
          </div>
        </>
      )}

      {confirmRemove && (
        <>
          <div className="sheet-mask" onClick={() => setConfirmRemove(null)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('删除银行卡')}</h3>
              <button className="btn-icon" onClick={() => setConfirmRemove(null)}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {t('确认删除')} {confirmRemove.bank}（{confirmRemove.maskedNo}）？{t('删除后释放名额；有在途提现的卡不能删除')}
            </p>
            <div className="bank-card-confirm-actions">
              <button className="btn btn-outline btn-full" onClick={() => setConfirmRemove(null)}>{t('取消')}</button>
              <button className="btn btn-danger btn-full" onClick={() => removeCard(confirmRemove.id)}>{t('确认删除')}</button>
            </div>
          </div>
        </>
      )}

      {viewingDoc && <AgreementModal agreementId={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
