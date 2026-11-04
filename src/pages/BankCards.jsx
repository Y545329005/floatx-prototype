import { useState } from 'react';
import {
  ArrowLeft, Plus, CreditCard, Trash2, X, ShieldCheck, Ban, RotateCcw, HelpCircle, MoreHorizontal,
} from 'lucide-react';
import {
  bankCards, BANK_CARD_STATUS, CARD_REVIEW_STATUS, CARD_QUOTA_PER_CURRENCY,
  jurisdictionLabel, countActiveCards,
  getFreezeState, formatExactAmount,
  removeBankCard, setBankCardDisabled, currentUser,
} from '../mock/data';
import { useLang } from '../i18n';

// 用户侧四态 + 后台审核子态（2026-11-04 · 对齐集团《统一法币出入金整体方案》§5.5）
// 待验证里再分「卡审核中」与「审核通过、待首充」——两者用户都要等，但动作不同：
// 审核中不能充值，审核通过后要用该卡首充 ≥1万 HKD 等值才加白。
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

// 列表内排序权重（币种页签内）：待验证 → 已拒绝 → 已验证 → 已停用
const CARD_ORDER = {
  [BANK_CARD_STATUS.UNVERIFIED]: 0,
  [BANK_CARD_STATUS.REJECTED]: 1,
  [BANK_CARD_STATUS.VERIFIED]: 2,
  [BANK_CARD_STATUS.DISABLED]: 3,
};

// 银行卡管理（2026-11-04）
// 链路：添加卡（个人单名 + 开户地区 + 卡照/开户证明）→ 后台卡审核 → 待验证
//       → 用该卡充值 ≥1万 HKD 等值 → 财务确认到账时自动加白
// 2026-11-04 第三轮（验收反馈）：
//   - 币种页签移出吸顶区：本页内容不超过一屏，吸顶页签只会长期占据 100px 却换不来导航收益
//   - 添加卡改为独立页（#bank-card-add/:currency），弹层已装不下 6 项表单
//   - 动作失败改为就地提示（菜单内 / 删除确认内），不再用页顶红字 + 自动消失
//   - 说明文案只留客户要知道的：规则、门槛、限制；名额表已在页签上，删除
export default function BankCards({ navigate, goBack, setToast }) {
  const { t, lang } = useLang();
  const [freezeBlocked, setFreezeBlocked] = useState(false);
  const ownedCards = () => bankCards.filter(c => c.userId === currentUser.id).map(c => ({ ...c }));
  const [cards, setCards] = useState(ownedCards);

  // 默认落在「最需要处理」的币种：有待首充加白 → 有卡 → HKD
  const [activeCurrency, setActiveCurrency] = useState(() => {
    const mine = bankCards.filter(c => c.userId === currentUser.id);
    const todo = CURRENCIES.find(cur => mine.some(c => c.currency === cur.key
      && c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED
      && c.reviewStatus === CARD_REVIEW_STATUS.APPROVED));
    if (todo) return todo.key;
    const withCard = CURRENCIES.find(cur => mine.some(c => c.currency === cur.key));
    return withCard ? withCard.key : 'HKD';
  });

  const [menuCard, setMenuCard] = useState(null);     // 「···」动作菜单
  const [menuError, setMenuError] = useState('');     // 菜单内就地错误
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removeError, setRemoveError] = useState(''); // 删除确认内就地错误
  const [showInfo, setShowInfo] = useState(false);

  const refresh = () => {
    setCards(ownedCards());
    // 启停/删除会改变列表长度，只在页面已经滚下去时回到顶部：避免停在半截页签上
    if (typeof window !== 'undefined' && window.scrollY > 0) window.scrollTo({ top: 0 });
  };
  const quotaOf = (currency) => countActiveCards(currency, currentUser.id);

  const hasVerifyTodo = (currency) => cards.some(c => c.currency === currency
    && c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED
    && c.reviewStatus === CARD_REVIEW_STATUS.APPROVED);

  const activeCards = cards
    .filter(c => c.currency === activeCurrency)
    .sort((a, b) => (CARD_ORDER[a.whitelistStatus] ?? 9) - (CARD_ORDER[b.whitelistStatus] ?? 9));

  // 添加入口：带当前页签币种（该币种已满则交给新页选第一个有空位的）
  const openAdd = () => navigate(`#bank-card-add/${activeCurrency}`);

  const toggleDisabled = (card) => {
    if (getFreezeState().frozen) { setMenuCard(null); setFreezeBlocked(true); return; }
    const res = setBankCardDisabled(card.id, card.whitelistStatus !== BANK_CARD_STATUS.DISABLED);
    if (!res.ok) { setMenuError(res.error || t('操作未执行，请重试')); return; }
    setMenuCard(null);
    setMenuError('');
    refresh();
    if (setToast) setToast(card.whitelistStatus === BANK_CARD_STATUS.DISABLED ? t('银行卡已启用') : t('银行卡已停用'));
  };

  const removeCard = (id) => {
    if (getFreezeState().frozen) { setConfirmRemove(null); setFreezeBlocked(true); return; }
    const res = removeBankCard(id);
    if (!res.ok) { setRemoveError(res.error || t('操作未执行，请重试')); return; }
    setConfirmRemove(null);
    setRemoveError('');
    refresh();
    if (setToast) setToast(t('银行卡已删除'));
  };

  // 状态说明：徽标只给状态词，这里给「下一步该做什么 / 为什么停用」
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

      {/* 币种页签（随内容滚动，不吸顶）：复用全站 .segmented-control */}
      <div className="segmented-control bank-currency-tabs" role="tablist">
        {CURRENCIES.map(cur => {
          const active = cur.key === activeCurrency;
          return (
            <button
              key={cur.key}
              role="tab"
              aria-selected={active}
              className={active ? 'active' : ''}
              onClick={() => setActiveCurrency(cur.key)}
            >
              {cur.key}
              <span className="segment-count">{quotaOf(cur.key)}/{CARD_QUOTA_PER_CURRENCY}</span>
              {hasVerifyTodo(cur.key) && <span className="segment-dot" aria-label={t('有待验证的银行卡')} />}
            </button>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="bank-cards-empty">
          <p className="text-muted">{t('暂无绑定银行卡')}</p>
          <button className="btn btn-outline btn-sm" onClick={openAdd}>{t('添加银行卡')}</button>
        </div>
      )}

      {/* 该币种下没有卡：给「加这个币种的卡」而不是全局空态（其他币种可能有卡） */}
      {cards.length > 0 && activeCards.length === 0 && (
        <div className="bank-cards-empty">
          <p className="text-muted">{t('暂无 {cur} 银行卡').replace('{cur}', activeCurrency)}</p>
          <p className="text-muted text-sm">{t('该币种还可添加 {n} 张').replace('{n}', String(CARD_QUOTA_PER_CURRENCY - quotaOf(activeCurrency)))}</p>
          <button className="btn btn-outline btn-sm" onClick={openAdd}>{t('添加银行卡')}</button>
        </div>
      )}

      {activeCards.map(c => {
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
              <button
                className="btn-icon"
                aria-label={t('更多操作')}
                onClick={() => { setMenuCard(c); setMenuError(''); }}
              >
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

      {/* 说明弹层：只留客户需要知道的（规则 / 门槛 / 限制）。
          名额用量在页签上，不在途提现的限制在实际操作失败时就地提示，都不重复写。 */}
      {showInfo && (
        <>
          <div className="sheet-mask" onClick={() => setShowInfo(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('银行卡使用说明')}</h3>
              <button className="btn-icon" onClick={() => setShowInfo(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <div className="bank-card-info">
              <ul className="bank-card-info-list">
                <li>{t('出入金仅限「已验证」银行卡。')}</li>
                <li>{t('新卡提交后由专员审核，审核通过后用该卡入金满 1 万 HKD（或等值）即自动加入白名单。')}</li>
                <li>{t('每个币种最多 3 张。')}</li>
                <li>{t('仅支持个人单名账户，开户地区须在香港或证监会合资格地区。')}</li>
              </ul>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setShowInfo(false)}>{t('我知道了')}</button>
          </div>
        </>
      )}

      {/* 卡片动作菜单：停用 / 删除带一句差异说明——两者都释放名额，但停用可恢复、删除要重新验证 */}
      {menuCard && (
        <>
          <div className="sheet-mask" onClick={() => { setMenuCard(null); setMenuError(''); }} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{menuCard.bank} <span className="bank-card-menu-no">{menuCard.maskedNo}</span></h3>
              <button className="btn-icon" onClick={() => { setMenuCard(null); setMenuError(''); }} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <div className="bank-card-menu">
              {(menuCard.whitelistStatus === BANK_CARD_STATUS.VERIFIED || menuCard.whitelistStatus === BANK_CARD_STATUS.DISABLED) && (
                <button className="menu-item" onClick={() => toggleDisabled(menuCard)}>
                  {isDisabledCard(menuCard) ? <RotateCcw size={18} /> : <Ban size={18} />}
                  <span className="menu-item-label">
                    <span className="menu-item-title">{isDisabledCard(menuCard) ? t('启用这张卡') : t('停用这张卡')}</span>
                    <span className="menu-item-sub">
                      {isDisabledCard(menuCard) ? t('恢复出入金，重新占用该币种名额') : t('暂时不用这张卡，随时可恢复')}
                    </span>
                  </span>
                </button>
              )}
              <button
                className="menu-item menu-item-danger"
                onClick={() => { setConfirmRemove(menuCard); setRemoveError(''); setMenuCard(null); setMenuError(''); }}
              >
                <Trash2 size={18} />
                <span className="menu-item-label">
                  <span className="menu-item-title">{t('删除银行卡')}</span>
                  <span className="menu-item-sub">{t('移除后需重新添加并通过验证')}</span>
                </span>
              </button>
            </div>
            {menuError && <p className="form-error">{menuError}</p>}
            <button className="btn btn-outline btn-full" onClick={() => { setMenuCard(null); setMenuError(''); }}>{t('取消')}</button>
          </div>
        </>
      )}

      {confirmRemove && (
        <>
          <div className="sheet-mask" onClick={() => { setConfirmRemove(null); setRemoveError(''); }} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('删除银行卡')}</h3>
              <button className="btn-icon" onClick={() => { setConfirmRemove(null); setRemoveError(''); }} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {t('确认删除')} {confirmRemove.bank}（{confirmRemove.maskedNo}）？{t('删除后不可恢复，需重新添加并通过验证。')}
            </p>
            {removeError && <p className="form-error">{removeError}</p>}
            <div className="bank-card-confirm-actions">
              <button className="btn btn-outline btn-full" onClick={() => { setConfirmRemove(null); setRemoveError(''); }}>{t('取消')}</button>
              <button className="btn btn-danger btn-full" onClick={() => removeCard(confirmRemove.id)}>{t('确认删除')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
