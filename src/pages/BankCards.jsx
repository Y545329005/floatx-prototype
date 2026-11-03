import { useEffect, useState } from 'react';
import {
  ArrowLeft, Plus, CreditCard, Trash2, X, ShieldCheck, Check,
  Upload, Ban, RotateCcw, HelpCircle, MoreHorizontal,
} from 'lucide-react';
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
// 徽标只放状态词（chip），具体说明放 chip 后的 detail，避免整行靠图标表达状态。
const cardStatusMeta = {
  [BANK_CARD_STATUS.VERIFIED]: { label: '已验证', cls: 'is-ok' },
  [BANK_CARD_STATUS.UNVERIFIED]: { label: '待验证', cls: 'is-warn' },
  [BANK_CARD_STATUS.DISABLED]: { label: '已停用', cls: 'is-off' },
  [BANK_CARD_STATUS.REJECTED]: { label: '已拒绝', cls: 'is-bad' },
};

const CURRENCIES = [
  { key: 'HKD', label: 'HKD 港币' },
  { key: 'USD', label: 'USD 美元' },
  { key: 'CNH', label: 'CNH 离岸人民币' },
];

// 银行卡管理（2026-11-04 重构）
// 链路：添加卡（个人单名 + 开户地区 + 卡照/开户证明）→ 后台卡审核 → 待验证
//       → 用该卡充值 ≥1万 HKD 等值 → 财务确认到账时自动加白（独立白名单验证单已下线）
// 2026-11-04 二次改版（验收反馈）：
//   - 页面顶部流程说明过长 → 收进页头「?」，点开底部说明弹层
//   - 添加按钮在长列表末尾 → 移到页头右上角
//   - 停用/删除两个裸图标竖排 → 收进「···」动作菜单（移动端无 hover，title 不可见）
//   - 已停用卡只靠一行文字 → 整卡置灰 + 状态徽标 + 说明
export default function BankCards({ navigate, goBack }) {
  const { t, lang } = useLang();
  const [freezeBlocked, setFreezeBlocked] = useState(false);
  const ownedCards = () => bankCards.filter(c => c.userId === currentUser.id).map(c => ({ ...c }));
  const [cards, setCards] = useState(ownedCards);

  // 新增卡表单（2026-11-04：账户类型 + 开户地区 + 凭证三项补齐）
  const [addForm, setAddForm] = useState({ bank: '星展银行', currency: 'HKD', cardNo: '', accountType: 'personal', region: 'HK' });
  const [addProof, setAddProof] = useState('');
  const [addError, setAddError] = useState('');
  const [pageError, setPageError] = useState('');   // 列表动作失败（停用/启用/删除）在页顶提示，不落在页尾
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [addAgreed, setAddAgreed] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showInfo, setShowInfo] = useState(false);   // 「?」说明弹层
  const [menuCard, setMenuCard] = useState(null);    // 「···」动作菜单

  const refresh = () => setCards(ownedCards());

  // 页顶错误提示 5 秒自动消失（用户改完别的卡后，旧错误不应长期挂红）
  useEffect(() => {
    if (!pageError) return undefined;
    const timer = setTimeout(() => setPageError(''), 5000);
    return () => clearTimeout(timer);
  }, [pageError]);

  const quotaOf = (currency) => countActiveCards(currency, currentUser.id);
  const allQuotaFull = CURRENCIES.every(c => quotaOf(c.key) >= CARD_QUOTA_PER_CURRENCY);

  // 列表动作失败提示统一在页顶（操作点是页头「+」与卡片「···」，提示落到页尾等于没说）
  const showPageError = (msg) => {
    setPageError(msg || t('操作未执行，请重试'));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdd = () => {
    const firstOpen = CURRENCIES.find(c => quotaOf(c.key) < CARD_QUOTA_PER_CURRENCY);
    setAddError(allQuotaFull ? t('三个币种的名额都已用满，请先停用或删除旧卡。') : '');
    // 默认币种已满时切到第一个还有名额的币种，避免一打开就落在禁用选项上
    if (firstOpen && quotaOf(addForm.currency) >= CARD_QUOTA_PER_CURRENCY) {
      setAddForm(f => ({ ...f, currency: firstOpen.key }));
    }
    setShowAdd(true);
  };

  const removeCard = (id) => {
    if (getFreezeState().frozen) {
      setConfirmRemove(null);
      setFreezeBlocked(true);
      return;
    }
    const res = removeBankCard(id);
    if (!res.ok) { showPageError(res.error); setConfirmRemove(null); return; }
    refresh();
    setConfirmRemove(null);
    setPageError('');
  };

  const toggleDisabled = (card) => {
    setMenuCard(null);
    if (getFreezeState().frozen) { setFreezeBlocked(true); return; }
    const res = setBankCardDisabled(card.id, card.whitelistStatus !== BANK_CARD_STATUS.DISABLED);
    if (!res.ok) { showPageError(res.error); return; }
    refresh();
    setPageError('');
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

  // 状态说明：chip 只给状态词，这里给「下一步该做什么 / 为什么停用」
  const renderDetail = (c) => {
    if (c.whitelistStatus === BANK_CARD_STATUS.VERIFIED) {
      return <>{t('白名单')}{c.verifiedAmount ? ` · ${c.currency} ${formatExactAmount(c.verifiedAmount)}` : ''}</>;
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED) {
      return c.reviewStatus === CARD_REVIEW_STATUS.PENDING ? t('资料审核中') : t('首充 ≥1万 HKD 等值后加白');
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.DISABLED) return t('启用后可恢复出入金');
    if (c.whitelistStatus === BANK_CARD_STATUS.REJECTED) return c.reviewReason || t('资料不符，请重新添加');
    return '';
  };

  const isDisabledCard = (c) => c.whitelistStatus === BANK_CARD_STATUS.DISABLED;

  return (
    <div className="page bank-cards-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('银行卡管理')}</h1>
          <div className="page-header-actions">
            <button className="btn-icon" aria-label={t('银行卡使用说明')} onClick={() => setShowInfo(true)}>
              <HelpCircle size={20} />
            </button>
            <button className="btn-icon" aria-label={t('添加银行卡')} onClick={openAdd}>
              <Plus size={22} />
            </button>
          </div>
        </div>
      </div>

      {getFreezeState().frozen && (
        <div className="sc-freeze-banner">
          <ShieldCheck size={16} />
          <span>{t('安全冻结生效中：出金账户变更将暂停至 {time}（{reason}）').replace('{time}', String(getFreezeState().until).replace('T', ' ').slice(0, 16)).replace('{reason}', getFreezeState().reason || '')}</span>
        </div>
      )}
      {freezeBlocked && <div className="sc-freeze-banner">{t('安全冻结生效中：安全项变更后 24 小时内无法变更出金账户')}</div>}
      {pageError && <p className="form-error bank-cards-error">{pageError}</p>}

      {cards.length === 0 && (
        <div className="bank-cards-empty">
          <p className="text-muted">{t('暂无绑定银行卡')}</p>
          <button className="btn btn-outline btn-sm" onClick={openAdd}>{t('添加银行卡')}</button>
        </div>
      )}

      {cards.map(c => {
        const meta = cardStatusMeta[c.whitelistStatus] || cardStatusMeta[BANK_CARD_STATUS.UNVERIFIED];
        const off = isDisabledCard(c);
        return (
          <div key={c.id} className={`card bank-card${off ? ' bank-card-disabled' : ''}`}>
            <div className="bank-card-top">
              <div className="bank-card-brand">
                <CreditCard size={18} />
                <div>
                  <strong>{c.bank}</strong>
                  <span className="bank-card-sub">{c.holder} · {jurisdictionLabel(c.region, lang)} · {c.type}</span>
                </div>
              </div>
              <button className="btn-icon" aria-label={t('更多操作')} onClick={() => setMenuCard(c)}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="bank-card-number">
              <span className="bank-card-masked">{c.maskedNo}</span>
              <span className="tag tag-currency">{c.currency}</span>
            </div>

            <div className="bank-card-whitelist">
              <span className={`bank-status-chip ${meta.cls}`}>{t(meta.label)}</span>
              <span className="bank-card-detail">{renderDetail(c)}</span>
            </div>

            {c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED && c.reviewStatus === CARD_REVIEW_STATUS.APPROVED && (
              <button className="btn btn-outline btn-full bank-verify-btn" onClick={() => navigate('#fund-operation/deposit')}>
                {t('去充值验证')}
              </button>
            )}
          </div>
        );
      })}

      {/* 说明弹层：原本常驻页顶的两行长说明，改成按需展开 */}
      {showInfo && (
        <>
          <div className="sheet-mask" onClick={() => setShowInfo(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('银行卡使用说明')}</h3>
              <button className="btn-icon" onClick={() => setShowInfo(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <div className="bank-card-info">
              <p className="bank-card-info-lead">{t('出入金仅限「已验证」银行卡。')}</p>
              <ul className="bank-card-info-list">
                <li>{t('添加卡 → 专员审核资料 → 用该卡首充 ≥1万 HKD 等值 → 自动加入白名单。')}</li>
                <li>{t('每个币种最多 3 张有效卡（待验证 + 已验证 计入，停用 / 已拒绝不占名额）。')}</li>
                <li>{t('仅接受个人单名账户，开户地区限香港及证监会合资格司法管辖区名单。')}</li>
                <li>{t('有在途提现的银行卡不可删除或停用。')}</li>
              </ul>
              <div className="bank-card-quota">
                {CURRENCIES.map(cur => (
                  <div key={cur.key} className="bank-card-quota-row">
                    <span>{cur.label}</span>
                    <strong>{quotaOf(cur.key)} / {CARD_QUOTA_PER_CURRENCY}</strong>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setShowInfo(false)}>{t('我知道了')}</button>
          </div>
        </>
      )}

      {/* 卡片动作菜单：替代右上角两个裸图标 */}
      {menuCard && (
        <>
          <div className="sheet-mask" onClick={() => setMenuCard(null)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{menuCard.bank} <span className="bank-card-menu-no">{menuCard.maskedNo}</span></h3>
              <button className="btn-icon" onClick={() => setMenuCard(null)} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <div className="bank-card-menu">
              {(menuCard.whitelistStatus === BANK_CARD_STATUS.VERIFIED || menuCard.whitelistStatus === BANK_CARD_STATUS.DISABLED) && (
                <button className="menu-item" onClick={() => toggleDisabled(menuCard)}>
                  {isDisabledCard(menuCard) ? <RotateCcw size={18} /> : <Ban size={18} />}
                  <span className="menu-item-label">{isDisabledCard(menuCard) ? t('启用这张卡') : t('停用这张卡')}</span>
                </button>
              )}
              <button
                className="menu-item menu-item-danger"
                onClick={() => { setConfirmRemove(menuCard); setMenuCard(null); }}
              >
                <Trash2 size={18} />
                <span className="menu-item-label">{t('删除银行卡')}</span>
              </button>
            </div>
            <button className="btn btn-secondary btn-full" onClick={() => setMenuCard(null)}>{t('取消')}</button>
          </div>
        </>
      )}

      {showAdd && (
        <>
          <div className="sheet-mask" onClick={() => setShowAdd(false)} />
          <div className="sheet sheet-tall">
            <div className="sheet-header">
              <h3>{t('添加银行卡')}</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)} aria-label={t('关闭')}><X size={18} /></button>
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
                  {CURRENCIES.map(cur => {
                    const used = quotaOf(cur.key);
                    const full = used >= CARD_QUOTA_PER_CURRENCY;
                    return (
                      <option key={cur.key} value={cur.key} disabled={full}>
                        {cur.label} · {used}/{CARD_QUOTA_PER_CURRENCY}{full ? `（${t('已满')}）` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="fund-field-hint">{t('该币种已有 {n} / {max} 张有效卡').replace('{n}', String(quotaOf(addForm.currency))).replace('{max}', String(CARD_QUOTA_PER_CURRENCY))}</p>
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
                disabled={!addAgreed || allQuotaFull}
                style={{ opacity: addAgreed && !allQuotaFull ? 1 : 0.45 }}
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
              <button className="btn-icon" onClick={() => setConfirmRemove(null)} aria-label={t('关闭')}><X size={18} /></button>
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
