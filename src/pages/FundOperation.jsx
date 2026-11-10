import { useEffect, useRef, useState } from 'react';
import { clickable } from '../lib';
import {
  ArrowLeft, Landmark, Upload, ShieldCheck, Copy, Check, ChevronDown,
  AlertTriangle, ReceiptText, X,
} from 'lucide-react';
import {
  wallet, walletAccountOf, bankCards, BANK_CARD_STATUS, platformAccounts, platformDepositAccount,
  depositRequests, withdrawRequests, submitDepositRequest, submitWithdrawRequest,
  getAvailableCash, getFreezeState, depositRefCode, formatExactAmount,
  getWithdrawQuote, getMinWithdraw, currentUser,
} from '../mock/data';
import { useLang } from '../i18n';
import AccountRow from '../components/AccountRow';

// 币种以代码为准（2026-10-28）：钱包内部键仍是 cny，换算交给 walletAccountOf，
// 避免页面层自己维护一套 key ↔ 币种映射（基金用 CNH，钱包键 cny）
const currencyOptions = [
  { key: 'HKD', label: 'HKD 港币', symbol: 'HK$' },
  { key: 'USD', label: 'USD 美元', symbol: '$' },
  { key: 'CNH', label: 'CNH 离岸人民币', symbol: '¥' },
];

// 本地时间 yyyy-MM-ddThh:mm（datetime-local 的入参格式；用 toISOString 会按 UTC 少 8 小时）
function nowLocalInput() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 汇款信息行：整行即复制目标（44px 高、比一个 16px 图标按钮好点得多），复制后短暂转绿
// 充值 / 提现 独立页
// 2026-10-29 充值页重构（对标持牌交易所入金页，第一性原理：入金页不是表单，是一次对账）：
//   ① 转账：参考代码置顶必填 + 收款账户逐行可复制 + 国际电汇字段折叠 + 客户资金账户说明
//   ② 登记：币种/金额/日期/回单号/凭证，日期预填当前时间
//   ③ 注意：付款人一致性、汇差手续费、到账时效三个「钱出去之后才发作」的坑前置
// 关键取舍：不照抄「到账自动上账」——后台是人工核销（AdminFunds 入金核销），
// 抄 SLA 会让用户不传凭证、钱悬着没人找。结构抄，承诺不抄。
// 路由：#fund-operation/deposit 和 #fund-operation/withdraw
export default function FundOperation({ mode, navigate, goBack }) {
  const { t } = useLang();
  const isDeposit = mode === 'deposit';
  const [currency, setCurrency] = useState('HKD');
  const [amount, setAmount] = useState('');
  const [bankCard, setBankCard] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [payerRef, setPayerRef] = useState('');
  const [transferDate, setTransferDate] = useState(nowLocalInput());
  const [moreOpen, setMoreOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [error, setError] = useState('');
  const [cardPickerOpen, setCardPickerOpen] = useState(false); // 选卡底部弹层（2026-10-29：原生 select 是 Web 交互，手机端应为 APP 风格选项列表）
  const fileRef = useRef(null);
  const copyTimer = useRef(null);

  // 出金币种 = 港币 + 美元 + 任何「有可用余额」的币种（2026-11-03）：
  // 港币/美元是产品支持的币种，必须始终可见——否则「入金能选 USD、出金看不到 USD」会被读成功能没做；
  // 余额为 0 的币种置灰并说明原因，不是死选项，也不需要写死一份只有余额的名单。
  // 额外保留「有余额的其它币种」出口：历史/异常入账（如 CNH）仍能提走。
  const withdrawCurrencies = currencyOptions.filter(c => c.key === 'HKD' || c.key === 'USD' || getAvailableCash(c.key) > 0);
  const hasEmptyWithdrawCurrency = withdrawCurrencies.some(c => c.key !== 'HKD' && getAvailableCash(c.key) <= 0);
  // 入金币种只列「有收款账户」的币种：没有账户的币种不给选项，避免用户汇出去却没有落点
  const depositCurrencies = currencyOptions.filter(c => !!platformDepositAccount(c.key));
  const activeCurrency = isDeposit
    ? currency
    : (withdrawCurrencies.some(c => c.key === currency && (c.key === 'HKD' || getAvailableCash(c.key) > 0)) ? currency : 'HKD');
  const cur = walletAccountOf(activeCurrency) || wallet.hkd;
  const amountNum = parseFloat(amount) || 0;
  // INV-5 凡动必冻：安全冻结期内阻断出金（UI 层前置拦截 + 数据层兜底）
  const freeze = getFreezeState();
  const acc = platformDepositAccount(activeCurrency) || platformAccounts.deposit;
  const refCode = depositRefCode();
  // 2026-11-04：充值付款卡放开到「本人全部有效卡」——未验证卡正是首充验证的对象
  // （此前只列已验证卡，导致「先验证才能充值」的顺序与会议纪要/集团口径相反）。
  // 2026-11-09 链路重排：卡审核取消，全部非拒绝卡都可充；出金仍只允许已验证卡（白名单硬约束），
  // 且按币种匹配，不做跨币种打款。数据层 submitDepositRequest 保留 pending 卡拦截兜底。
  const myCards = bankCards.filter(c => c.userId === currentUser.id
    && c.whitelistStatus !== BANK_CARD_STATUS.SUSPENDED);
  const whitelistedCards = myCards.filter(c => c.whitelistStatus === BANK_CARD_STATUS.VERIFIED);
  // 2026-11-06：完全未绑卡时直接拦截提现表单（与充值侧拦截态同构）——
  // 否则用户填完整页金额/费用，才在收款卡字段与提交时报错。有卡但未达白名单不拦，保留字段级提示。
  const hasNoCard = !bankCards.some(c => c.userId === currentUser.id);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // 复制：优先走同步 execCommand —— navigator.clipboard.writeText 在文档未获焦点时
  // 会永远 pending（自动化/后台标签页实测），导致「已复制」状态永不出现。
  // 同步路径还能拿到真实结果，先复制成功再亮状态，不骗人。
  const copy = (key, text) => {
    let done = false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      done = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      done = false;
    }
    if (!done && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedKey(''), 2500);
  };

  const wireText = [
    `${t('收款银行（英文）')}: ${acc.bankNameEn || acc.bank}`,
    `${t('户名')}: ${acc.accountName}`,
    `${t('账号')}: ${acc.accountNo}`,
    `${t('币种')}: ${acc.currency}`,
    `SWIFT: ${acc.swift || '—'}`,
    `${t('银行编号')}: ${acc.bankCode || '—'}`,
    `${t('银行地址')}: ${acc.bankAddress || '—'}`,
    `${t('参考代码')}: ${refCode}（${t('汇款备注必填')}）`,
  ].join('\n');

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
    const bc = selectedCard;
    if (!bc) {
      setError(isDeposit
        ? t('请选择付款银行卡（可用本人名下银行卡首充验证）')
        : t('请先添加并验证一张 {cur} 收款银行卡').replace('{cur}', activeCurrency));
      return;
    }
    if (!isDeposit) {
      const min = getMinWithdraw(activeCurrency);
      if (amountNum < min) {
        setError(t('最低提现金额为 {amount}').replace('{amount}', `${cur.symbol}${formatExactAmount(min)}`));
        return;
      }
    }
    if (!isDeposit && freeze.frozen) { // 凡动必冻拦截
      setError(t('安全冻结生效中：安全项变更后 24 小时内无法提现'));
      return;
    }
    const opts = {
      currency: activeCurrency,
      amount: amountNum,
      method: '银行转账',
      cardId: bc.id,
      bank: bc.bank,
      cardNo: bc.cardNo,
    };
    let ok;
    if (isDeposit) {
      if (!evidenceName) {
        setError(t('请上传银行转账凭证'));
        return;
      }
      ok = submitDepositRequest({
        ...opts,
        evidence: { name: evidenceName, size: '—', uploadedAt: '' },
        // 对账三元组（2026-10-29）：参考代码已写进用户汇款备注，是财务侧最强的匹配键
        refCode,
        refNo: payerRef,
        transferDate: transferDate ? transferDate.replace('T', ' ').slice(0, 16) : '',
      });
    } else {
      ok = submitWithdrawRequest(opts);
    }
    if (!ok) {
      setError(isDeposit ? t('入金申请提交失败，请检查付款卡与凭证') : t('可用余额不足、未达最低提现金额或收款卡未通过验证'));
      return;
    }
    // 提交成功 → 跳转资金申请详情页（新申请 unshift 到头部，取最新一条）
    const reqs = isDeposit ? depositRequests : withdrawRequests;
    const req = reqs[0];
    navigate(`#fund-request/${req.id}`);
  };

  // 币种选择（充值按「汇款币种」= 用户实际汇出什么；提现按「出金币种」= 账上真有的钱）
  const renderCurrencyChips = (list, opts = {}) => (
    <div className="fund-method-chips">
      {list.map(c => {
        // 提现：非港币且可用为 0 → 置灰。仍然把币种列出来，用户才知道「有这个币种、只是还没钱」，
        // 而不是以为平台不支持。
        const empty = opts.disableEmpty && c.key !== 'HKD' && getAvailableCash(c.key) <= 0;
        return (
          <button
            key={c.key}
            type="button"
            className={`chip ${currency === c.key ? 'active' : ''}`}
            disabled={empty}
            title={empty ? t('该币种暂无可提余额') : undefined}
            onClick={() => { setCurrency(c.key); setError(''); }}
          >
            {c.key}
          </button>
        );
      })}
    </div>
  );

  const renderAmountField = (placeholder) => (
    <div className="form-group">
      <label className="form-label">{t('金额')}</label>
      <div className="input-group">
        <span className="input-symbol">{cur.symbol}</span>
        <input
          className="form-input"
          type="number"
          placeholder={placeholder}
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(''); }}
          inputMode="decimal"
        />
      </div>
    </div>
  );

  // ---------- 提现（保持原闭环，仅复用新的页头/币种组件） ----------
  const renderWithdraw = () => (
    <>
      <p className="text-muted text-sm fund-operation-note">
        {/* 可用口径（2026-11-02 口径 B）：余额 - 申购冻结 - 在途提现；金额按定版口径 formatExactAmount */}
        {`${t('当前可用')} ${cur.label} ${cur.symbol}${formatExactAmount(getAvailableCash(activeCurrency))}`}
      </p>

      {freeze.frozen && (
        <div className="sc-freeze-banner">
          <ShieldCheck size={16} />
          <span>{t('安全冻结生效中：提现功能将暂停至 {time}（{reason}）').replace('{time}', String(freeze.until).replace('T', ' ').slice(0, 16)).replace('{reason}', freeze.reason || '')}</span>
        </div>
      )}

      <div className="card fund-operation-form">
        {withdrawCurrencies.length > 1 && (
          <div className="form-group">
            <label className="form-label">{t('币种')}</label>
            {renderCurrencyChips(withdrawCurrencies, { disableEmpty: true })}
            {hasEmptyWithdrawCurrency && (
              <p className="fund-field-hint">{t('灰色币种暂无可提余额；对应币种入金到账后即可选择。')}</p>
            )}
          </div>
        )}

        {renderAmountField(t('请输入金额'))}

        {/* 费用与到账（2026-11-04 会议纪要 + 集团 FR-13）：金额输入即展示费率/手续费/预计到账；
            费率按卡的开户地区分本地/跨境两档，后台可配；手续费从提现金额中扣除。 */}
        {(() => {
          const quote = getWithdrawQuote(activeCurrency, amountNum, selectedCard);
          const min = getMinWithdraw(activeCurrency);
          return (
            <div className="card fund-operation-card">
              <h3 className="card-title">{t('费用与到账')}</h3>
              <div className="kyc-review-row"><span>{t('出金费率')}</span><strong>{quote.rate}% · {quote.isCross ? t('跨境汇款') : t('本地出金')}</strong></div>
              <div className="kyc-review-row"><span>{t('手续费')}</span><strong>{cur.symbol}{formatExactAmount(quote.fee)}</strong></div>
              <div className="kyc-review-row"><span>{t('预计到账')}</span><strong>{cur.symbol}{formatExactAmount(quote.net > 0 ? quote.net : 0)}</strong></div>
              <p className="fund-field-hint">{t('最低提现金额 {amount}；手续费从提现金额中扣除。').replace('{amount}', `${cur.symbol}${formatExactAmount(min)}`)}</p>
            </div>
          );
        })()}

        <div className="form-group">
          <label className="form-label">{t('收款银行卡（白名单）')}</label>
          {/* 2026-10-29：原生 select 弹系统下拉（Web 感），改为触发按钮 + 底部选项弹层 */}
          <button
            type="button"
            className="form-input fund-card-trigger"
            onClick={() => cardOptions.length > 0 && setCardPickerOpen(true)}
            aria-label={t('收款银行卡（白名单）')}
          >
            <span className={selectedCard ? '' : 'text-muted'}>
              {selectedCard ? `${selectedCard.bank} ${selectedCard.maskedNo} · ${selectedCard.currency}` : t('暂无 {cur} 白名单银行卡，请先完成验证').replace('{cur}', activeCurrency)}
            </span>
            <ChevronDown size={16} className="fund-card-trigger-chevron" />
          </button>
          {cardOptions.length === 0 && (
            <p className="form-error">{t('暂无 {cur} 白名单银行卡，请先完成验证').replace('{cur}', activeCurrency)}</p>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-full" onClick={handleSubmit}>
          {t('提交提现申请')}
        </button>
      </div>
    </>
  );

  // ---------- 银行转账（① 转账 → ② 登记） ----------
  // 2026-10-29 二轮：eDDA 通道整条下线（首期只有银行转账）；「注意」区整块移除。
  const renderBankTransfer = () => (
    <>
      <div className="fund-step">
        <span className="fund-step-num">1</span>
        <h2 className="fund-step-title">{t('转账至客户资金账户')}</h2>
      </div>

      {/* 参考代码：整页唯一必填的「备注」动作，也是财务把入账对上账户的唯一强键 */}
      <div className="card fund-ref-card">
        <div className="fund-ref-head">
          <span className="fund-ref-label">{t('参考代码')}</span>
          <span className="fund-ref-badge">{t('汇款备注必填')}</span>
        </div>
        <button type="button" className="fund-ref-code" onClick={() => copy('ref', refCode)}>
          <strong>{refCode}</strong>
          <span className="fund-ref-copy">
            {copiedKey === 'ref' ? <><Check size={14} /> {t('已复制')}</> : <><Copy size={14} /> {t('复制')}</>}
          </span>
        </button>
        <p className="fund-ref-note">
          <AlertTriangle size={14} />
          <span>{t('汇款时请在【备注 / 给收款人的信息】栏填写这 6 位代码；漏填会拖慢核对，可能需要补传凭证。')}</span>
        </p>
      </div>

      <div className="card fund-acct-card">
        <div className="fund-acct-head">
          <Landmark size={16} />
          <strong>{t('收款账户')}</strong>
        </div>

        <AccountRow rowKey="bankNameEn" label={t('银行名称')} value={acc.bankNameEn || acc.bank} long copiedKey={copiedKey} onCopy={copy} />
        <AccountRow rowKey="accountName" label={t('户名')} value={acc.accountName} long copiedKey={copiedKey} onCopy={copy} />
        <AccountRow rowKey="accountNo" label={t('账号')} value={acc.accountNo} mono copiedKey={copiedKey} onCopy={copy} />
        {/* 币种是汇款单必填项（2026-11-03）：账户数据里的 currency 才是事实，页头那句「HKD · USD · CNH」是未经银行确认的断言 */}
        <AccountRow rowKey="currency" label={t('币种')} value={acc.currency} copiedKey={copiedKey} onCopy={copy} />

        {moreOpen && (
          <>
            <AccountRow rowKey="swift" label="SWIFT" value={acc.swift || '—'} mono copiedKey={copiedKey} onCopy={copy} />
            <AccountRow rowKey="bankCode" label={t('银行编号')} value={acc.bankCode || '—'} mono copiedKey={copiedKey} onCopy={copy} />
            <AccountRow rowKey="bankAddress" label={t('银行地址')} value={acc.bankAddress || '—'} long copiedKey={copiedKey} onCopy={copy} />
          </>
        )}

        <button type="button" className="fund-acct-toggle" onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}>
          <span>{moreOpen ? t('收起国际电汇信息') : t('国际电汇需填：SWIFT 代码、银行编号、银行地址')}</span>
          <ChevronDown size={15} className={moreOpen ? 'flip' : ''} />
        </button>

        <button type="button" className="btn btn-outline btn-sm btn-full fund-acct-all" onClick={() => copy('all', wireText)}>
          {copiedKey === 'all' ? <><Check size={14} /> {t('已复制全部汇款信息')}</> : <><Copy size={14} /> {t('复制全部汇款信息')}</>}
        </button>

        <p className="fund-acct-trust">
          <ShieldCheck size={13} />
          <span>{t('该账户为 HighBlock 客户资金账户，与公司自有资金分开存放。')}</span>
        </p>
        <p className="fund-field-hint">{t('请向对应币种的收款账户汇款；其他币种请联系客户经理。')}</p>
      </div>

      <div className="fund-step">
        <span className="fund-step-num">2</span>
        <h2 className="fund-step-title">{t('转账后登记')}</h2>
      </div>

      <div className="card fund-operation-form">
        <div className="form-group">
          {/* 语义纠正（2026-10-29 标注反馈）：这是「你汇出的是什么币」，不是「系统承诺入账什么币」。
              用户可能汇错币种，银行仍可能入账（换汇入账或挂账），所以只声明事实、由财务按实际到账核对。 */}
          <label className="form-label">{t('汇款币种')}</label>
          {renderCurrencyChips(depositCurrencies)}
          <p className="fund-field-hint">{t('按你实际汇出的币种填写；到账币种与金额以银行实际为准。')}</p>
          <p className="fund-field-hint">{t('HKD 到账仅可申购港币份额基金；USD 到账仅可申购美元份额基金。')}</p>
        </div>

        {renderAmountField(t('请按银行回执填写实际转账金额'))}

        <div className="form-group">
          <label className="form-label">{t('转账日期')}</label>
          <input
            className="form-input"
            type="datetime-local"
            value={transferDate}
            onChange={e => { setTransferDate(e.target.value); setError(''); }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('银行回单参考号（可选）')}</label>
          <input
            className="form-input"
            placeholder={t('回单上的参考编号，便于财务核对')}
            value={payerRef}
            onChange={e => { setPayerRef(e.target.value); setError(''); }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('上传转账凭证')}</label>
          <p className="fund-field-hint">{t('凭证需含：汇款时间、金额、收付款账户、汇款编号与备注信息。')}</p>
          <div className="fund-evidence-box" {...clickable(() => fileRef.current && fileRef.current.click())}>
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
                <strong>{t('点击上传凭证')}</strong>
                <span className="text-muted text-sm">{t('支持 PDF / JPG / PNG')}</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-full" onClick={handleSubmit}>
          {t('完成转账，提交登记')}
        </button>
        <p className="text-muted text-sm fund-operation-tip">
          {t('提交后财务按参考代码核对到账；核对不通过会通知你补传凭证。')}
        </p>
      </div>

    </>
  );

  // 选卡弹层：充值「从」行与提现「收款银行卡」共用同一份卡与选中态。
  // 2026-11-04：充值列本人全部有效卡（未验证卡标注「首充 ≥1万加白」）；出金只列已验证卡。
  const cardOptions = isDeposit ? myCards : whitelistedCards.filter(c => c.currency === activeCurrency);
  const selectedCard = cardOptions.find(c => c.id === bankCard) || cardOptions[0] || null;
  const pickCard = (id) => {
    setBankCard(id);
    setError('');
    setCardPickerOpen(false);
  };
  // 2026-11-10：充值侧名额口径每币种 ≤3 张 × 3 币种，最多 9 张——平铺时币种交错难扫读。
  // 改为按币种分组、当前汇款币种组排最前；提现侧本就单币种，分组头自动隐藏。
  // 币种不在三币种内的历史/异常卡兜底归入「其他币种」组，避免凭空消失。
  const cardGroups = currencyOptions
    .filter(o => cardOptions.some(c => c.currency === o.key))
    .map(o => ({ key: o.key, label: t(o.label), cards: cardOptions.filter(c => c.currency === o.key) }));
  const otherCurrencyCards = cardOptions.filter(c => !currencyOptions.some(o => o.key === c.currency));
  if (otherCurrencyCards.length > 0) cardGroups.push({ key: '_other', label: t('其他币种'), cards: otherCurrencyCards });
  cardGroups.sort((a, b) => (b.key === activeCurrency) - (a.key === activeCurrency));
  const renderCardOption = (c) => (
    <button key={c.id} ref={el => { if (el && c.id === selectedCard?.id) el.scrollIntoView({ block: 'nearest' }); }} type="button" className={`fund-card-option${c.id === selectedCard?.id ? ' selected' : ''}`} onClick={() => pickCard(c.id)}>
      <span className="fund-card-option-main">
        <strong>{c.bank}</strong>
        <span className="text-muted text-sm">{c.maskedNo} · {c.currency}{c.whitelistStatus !== BANK_CARD_STATUS.VERIFIED ? ` · ${t('首充验证')}` : ''}</span>
      </span>
      {c.id === selectedCard?.id && <Check size={18} className="fund-card-option-check" />}
    </button>
  );
  const renderCardPicker = () => !cardPickerOpen ? null : (
    <>
      <div className="sheet-mask" onClick={() => setCardPickerOpen(false)} />
      <div className="sheet">
        <div className="sheet-header">
          <h3>{t('选择银行卡')}</h3>
          <button className="btn-icon" onClick={() => setCardPickerOpen(false)}><X size={18} /></button>
        </div>
        {cardOptions.length === 0 ? (
          <p className="text-muted text-sm sheet-sub">
            {isDeposit
              ? t('暂无可用银行卡，请先添加银行卡')
              : t('暂无 {cur} 白名单银行卡，请先完成验证').replace('{cur}', activeCurrency)}
          </p>
        ) : (
          <div className="fund-card-options">
            {cardGroups.map(g => (
              <div key={g.key} className="fund-card-group">
                {cardGroups.length > 1 && <span className="fund-card-group-label">{g.label}</span>}
                {g.cards.map(renderCardOption)}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-outline btn-sm btn-full" onClick={() => { setCardPickerOpen(false); navigate('#bank-cards'); }}>
          {t('管理银行卡')}
        </button>
      </div>
    </>
  );

  return (
    <div className="page fund-operation-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{isDeposit ? t('充值入金') : t('提现出金')}</h1>
          {isDeposit && (
            <button className="btn-icon" title={t('资金明细')} onClick={() => navigate('#transactions')}>
              <ReceiptText size={18} />
            </button>
          )}
        </div>
      </div>

      <p className="text-muted text-sm fund-operation-note">
        {isDeposit
          ? t('资金进入 HighBlock 客户资金账户，财务按参考代码核对到账后上账。')
          : `${t('提现打款至本人白名单银行卡，财务复核后汇出。')}`}
      </p>

      {!isDeposit && !hasNoCard && renderWithdraw()}

      {!isDeposit && hasNoCard && (
        <div className="card fund-empty-card">
          <p>{t('暂无绑定银行卡，无法提现')}</p>
          <p className="text-muted text-sm">{t('提现仅支持本人已验证的白名单银行卡，绑卡并通过验证后即可发起。')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#bank-cards')}>{t('去添加')}</button>
        </div>
      )}

      {isDeposit && myCards.length === 0 && (
        <div className="card fund-empty-card">
          <p>{t('暂无可用银行卡，请先添加银行卡')}</p>
          <p className="text-muted text-sm">{t('添加银行卡后，用该卡首充 ≥1万 HKD 等值即可自动加入白名单。')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#bank-cards')}>{t('去添加')}</button>
        </div>
      )}

      {isDeposit && myCards.length > 0 && (
        <>
          <div className="fund-pay-row">
            <span className="fund-pay-label">{t('从')}</span>
            <div className="fund-pay-control">
              {/* 2026-10-29：原生 select → 触发按钮（同一底部选卡弹层） */}
              <button
                type="button"
                className="fund-pay-select fund-pay-trigger"
                onClick={() => setCardPickerOpen(true)}
                aria-label={t('付款银行卡')}
              >
                {selectedCard ? `${selectedCard.bank} · ${selectedCard.maskedNo}` : t('选择银行卡')}
              </button>
              <ChevronDown size={16} />
            </div>
            {/* 卡是页面前提，但用户看不到它从哪来——给一条直达管理页的路（2026-10-29 标注反馈） */}
            <button type="button" className="fund-pay-manage" onClick={() => navigate('#bank-cards')}>
              {t('管理')}
            </button>
          </div>

          {renderBankTransfer()}
        </>
      )}

      {renderCardPicker()}
    </div>
  );
}
