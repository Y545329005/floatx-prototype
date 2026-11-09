import { useState } from 'react';
import {
  ArrowLeft, Plus, CreditCard, X, ShieldCheck, HelpCircle,
} from 'lucide-react';
import {
  bankCards, BANK_CARD_STATUS, CARD_QUOTA_PER_CURRENCY,
  jurisdictionLabel, countActiveCards,
  getFreezeState, formatExactAmount,
  removeBankCard, currentUser,
} from '../mock/data';
import { useLang } from '../i18n';

// 用户侧三态（2026-11-09 定版）：「待验证」= 等首充加白（≥1万 HKD 等值）；
// 「已停用」= 平台风控切断（用户不能自行恢复，只能解绑后重新添加并重新首充）。
const cardStatusMeta = {
  [BANK_CARD_STATUS.VERIFIED]: { label: '已验证', cls: 'is-ok' },
  [BANK_CARD_STATUS.UNVERIFIED]: { label: '待验证', cls: 'is-warn' },
  [BANK_CARD_STATUS.SUSPENDED]: { label: '已停用', cls: 'is-bad' },
};

const CURRENCIES = [
  { key: 'HKD', label: 'HKD 港币' },
  { key: 'USD', label: 'USD 美元' },
  { key: 'CNH', label: 'CNH 离岸人民币' },
];

// 列表内排序权重（币种页签内）：待验证 → 已停用 → 已验证
const CARD_ORDER = {
  [BANK_CARD_STATUS.UNVERIFIED]: 0,
  [BANK_CARD_STATUS.SUSPENDED]: 1,
  [BANK_CARD_STATUS.VERIFIED]: 2,
};

// 银行卡管理（2026-11-04；2026-11-05 收敛）
// 银行卡管理（2026-11-04；2026-11-05 收敛；2026-11-09 链路重排）
// 链路：添加卡（个人单名 + 开户地区 + 卡照/开户证明）→ 立即生效（可打款）
//       → 用该卡充值 ≥1万 HKD 等值 → 财务核销核对（付款人姓名 + 卡资料）→ 自动加白
// 2026-11-05：取消「停用」。它与「解绑」在用户视角没有区别（都释放名额、都受在途提现拦截、
// 都不能用于出入金），两项并存只会让菜单多一个含义重叠的选项。卡片右上角直接给「解绑」。
export default function BankCards({ navigate, goBack, setToast }) {
  const { t, lang } = useLang();
  const [freezeBlocked, setFreezeBlocked] = useState(false);
  const ownedCards = () => bankCards.filter(c => c.userId === currentUser.id).map(c => ({ ...c }));
  const [cards, setCards] = useState(ownedCards);

  // 默认落在「最需要处理」的币种：有待首充加白 → 有卡 → HKD
  const [activeCurrency, setActiveCurrency] = useState(() => {
    const mine = bankCards.filter(c => c.userId === currentUser.id);
    const todo = CURRENCIES.find(cur => mine.some(c => c.currency === cur.key
      && c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED));
    if (todo) return todo.key;
    const withCard = CURRENCIES.find(cur => mine.some(c => c.currency === cur.key));
    return withCard ? withCard.key : 'HKD';
  });

  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const refresh = () => {
    setCards(ownedCards());
    // 解绑会改变列表长度，只在页面已经滚下去时回到顶部：避免停在半截页签上
    if (typeof window !== 'undefined' && window.scrollY > 0) window.scrollTo({ top: 0 });
  };

  const quotaOf = (currency) => countActiveCards(currency, currentUser.id);

  const hasVerifyTodo = (currency) => cards.some(c => c.currency === currency
    && c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED);

  const activeCards = cards
    .filter(c => c.currency === activeCurrency)
    .sort((a, b) => (CARD_ORDER[a.whitelistStatus] ?? 9) - (CARD_ORDER[b.whitelistStatus] ?? 9));

  const openAdd = () => navigate(`#bank-card-add/${activeCurrency}`);

  const unbindCard = (id) => {
    if (getFreezeState().frozen) { setConfirmRemove(null); setFreezeBlocked(true); return; }
    const res = removeBankCard(id);
    if (!res.ok) { setRemoveError(res.error || t('操作未执行，请重试')); return; }
    setConfirmRemove(null);
    setRemoveError('');
    refresh();
    if (setToast) setToast(t('银行卡已解绑'));
  };

  // 状态说明：徽标只给状态词，这里给「下一步该做什么」
  const renderDetail = (c) => {
    if (c.whitelistStatus === BANK_CARD_STATUS.VERIFIED) {
      return <>{t('白名单')}{c.verifiedAmount ? ` · ${c.currency} ${formatExactAmount(c.verifiedAmount)}` : ''}</>;
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED) {
      return t('首充 ≥1万 HKD 等值后加白');
    }
    if (c.whitelistStatus === BANK_CARD_STATUS.SUSPENDED) return t('已停用：{reason}。请解绑后重新添加本人银行卡并完成首充验证。').replace('{reason}', c.reviewReason || t('风控停用'));
    return '';
  };

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
        return (
          <div key={c.id} className="card bank-card">
            <div className="bank-card-top">
              <div className="bank-card-brand">
                <CreditCard size={18} />
                <div>
                  <strong>{c.bank}</strong>
                  <span className="bank-card-sub">{c.holder} · {jurisdictionLabel(c.region, lang)} · {t(c.type)}</span>
                </div>
              </div>
              <button
                className="bank-card-unbind"
                onClick={() => { setConfirmRemove(c); setRemoveError(''); }}
              >
                {t('解绑')}
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

            {c.whitelistStatus === BANK_CARD_STATUS.UNVERIFIED && (
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
                <li>{t('新卡添加后立即生效，可直接用于充值打款；用该卡入金满 1 万 HKD（或等值）并经财务确认到账后自动加入白名单。')}</li>
                <li>{t('每个币种最多 3 张。')}</li>
                <li>{t('仅支持个人单名账户，开户地区须在香港或证监会合资格地区。')}</li>
              </ul>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setShowInfo(false)}>{t('我知道了')}</button>
          </div>
        </>
      )}

      {confirmRemove && (
        <>
          <div className="sheet-mask" onClick={() => { setConfirmRemove(null); setRemoveError(''); }} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>{t('解绑银行卡')}</h3>
              <button className="btn-icon" onClick={() => { setConfirmRemove(null); setRemoveError(''); }} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm sheet-sub">
              {t('确认解绑')} {confirmRemove.bank}（{confirmRemove.maskedNo}）？{t('解绑后将无法用于出入金，重新添加后需完成首充验证。')}
            </p>
            {removeError && <p className="form-error">{removeError}</p>}
            <div className="bank-card-confirm-actions">
              <button className="btn btn-outline btn-full" onClick={() => { setConfirmRemove(null); setRemoveError(''); }}>{t('取消')}</button>
              <button className="btn btn-danger btn-full" onClick={() => unbindCard(confirmRemove.id)}>{t('确认解绑')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
