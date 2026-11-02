import { useState } from 'react';
import { ArrowLeft, Download, Upload, ChevronRight, ClipboardList, CreditCard, History } from 'lucide-react';
import { wallet, CURRENCY_META, convertToHKD, getAvailableCash, getFundFrozen, getWithdrawFrozen, formatExactAmount } from '../mock/data';
import { useLang } from '../i18n';

// ⚠ 死页（2026-11-02 资金审查摘除）：#wallet 路由已从 router.jsx 摘除，全仓无正向入口，
// 仅深链可达。资金域归属地为 #asset（资产总览），本页的多币种余额/冻结拆解信息 #asset 已覆盖。
// 文件保留不删（同 Exchange.jsx 模式），2026-11-02 的冻结拆分/双口径修复仍有效；
// 二期随资金域重评估：恢复 = router lazy + case 'wallet' + 本注释三处同步。

// 金额位数自适应降档：返回 0（正常）/1（降一档）/2（降两档）
// 位数越长字号越小，防止长数字撑爆布局换行（2026-08-19）
function longAmountRank(str) {
  const len = (str || '').replace(/[^\d]/g, '').length;
  if (len >= 15) return 2;
  if (len >= 11) return 1;
  return 0;
}
const heroAmountSize = r => (r === 2 ? 'wallet-hero-value-xs' : r === 1 ? 'wallet-hero-value-sm' : '');
const balanceAmountSize = r => (r === 2 ? 'wallet-balance-item-amount-xs' : r === 1 ? 'wallet-balance-item-amount-sm' : '');

// 钱包（2026-10-28 基金一期）：资金公共模块的明细页
// 动作四格：充值 / 提现 / 银行卡 + 资金申请入口。换汇 2026-11-02 口径收口（资金审查 A）：
// 首期不做换汇，入口与路由摘除（Exchange.jsx 文件保留、数据层 submitExchangeRequest 兜底拦截），
// 留着入口就是「能下单但单据无处可寻」的半闭环。
const CURRENCIES = ['HKD', 'USD', 'CNH'].map(code => ({ code, ...CURRENCY_META[code] }));

export default function Wallet({ navigate, goBack }) {
  const { t } = useLang();
  const [heroCurrency, setHeroCurrency] = useState('HKD');

  const totalHKD = CURRENCIES.reduce((s, c) => {
    const acc = wallet[c.walletKey];
    return s + (acc ? convertToHKD(acc.balance, c.code) : 0);
  }, 0);
  const heroRate = convertToHKD(1, heroCurrency) || 1;
  const heroFundFrozen = getFundFrozen(undefined, heroCurrency);
  // 冻结 = 申购冻结 + 在途提现（2026-11-02 口径 B：提现申请即冻结；币种行有分项拆解）
  const heroFrozen = heroFundFrozen + getWithdrawFrozen(undefined, heroCurrency);
  const heroAvailable = getAvailableCash(heroCurrency);

  return (
    <div className="page wallet-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('钱包')}</h1>
        </div>
      </div>

      {/* Hero 卡：资产总览 + 统计行 */}
      <div className="wallet-hero-card">
        <div className="wallet-hero-head">
          <span className="wallet-hero-label">{t('资产总览')}</span>
          <div className="wallet-currency-dropdown">
            <select
              className="wallet-currency-select"
              value={heroCurrency}
              onChange={e => setHeroCurrency(e.target.value)}
            >
              {CURRENCIES.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code}</option>
              ))}
            </select>
            <ChevronRight size={14} className="wallet-currency-chevron" />
          </div>
        </div>
        <div className="wallet-hero-main">
          <div className={`wallet-hero-value ${heroAmountSize(longAmountRank(formatExactAmount(totalHKD / heroRate)))}`}>
            {formatExactAmount(Math.round(totalHKD / heroRate))}
          </div>
        </div>
        <div className="wallet-hero-stats">
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('可用')}</span>
            <span className="wallet-hero-stat-value">{formatExactAmount(heroAvailable)}</span>
          </div>
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('冻结')}</span>
            <span className="wallet-hero-stat-value">{formatExactAmount(heroFrozen)}</span>
          </div>
        </div>
      </div>

      {/* 操作：充值 / 提现 / 银行卡（换汇入口 2026-11-02 口径收口摘除） */}
      <div className="wallet-actions-grid">
        <button className="wallet-action-item" onClick={() => navigate('#fund-operation/deposit')}>
          {/* 入金=钱落进账户（Download 落托盘）；出金=钱提出去（Upload 升出）。行业通用方向（Binance/券商/银行 APP 同款） */}
          <Download size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('充值')}</span>
        </button>
        <button className="wallet-action-item" onClick={() => navigate('#fund-operation/withdraw')}>
          <Upload size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('提现')}</span>
        </button>
        <button className="wallet-action-item" onClick={() => navigate('#bank-cards')}>
          <CreditCard size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('银行卡')}</span>
        </button>
      </div>

      <div className="card">
        <button className="list-item" onClick={() => navigate('#fund-requests')}>
          <div className="list-item-icon"><ClipboardList size={18} /></div>
          <div className="list-item-content">
            <div className="list-item-title">{t('资金申请')}</div>
            <div className="list-item-subtitle">{t('充值 · 提现处理进度')}</div>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </button>
        <button className="list-item" onClick={() => navigate('#transactions')}>
          <div className="list-item-icon"><History size={18} /></div>
          <div className="list-item-content">
            <div className="list-item-title">{t('交易记录')}</div>
            <div className="list-item-subtitle">{t('全部资金流水')}</div>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </button>
      </div>

      {/* 币种余额 */}
      <div className="card">
        <h3 className="card-title">{t('币种余额')}</h3>
        <div className="wallet-balance-list">
          {CURRENCIES.map(currency => {
            const acc = wallet[currency.walletKey];
            if (!acc) return null;
            const fundFrozen = getFundFrozen(undefined, currency.code);
            const wdrFrozen = getWithdrawFrozen(undefined, currency.code);
            return (
              <div key={currency.code} className="wallet-balance-item">
                <span className="wallet-balance-card-label">{currency.code} · {t(currency.label)}</span>
                <span className={`wallet-balance-item-amount ${balanceAmountSize(longAmountRank(formatExactAmount(acc.balance)))}`}>
                  {formatExactAmount(acc.balance)}
                </span>
                {(fundFrozen > 0 || wdrFrozen > 0) && (
                  <span className="text-muted text-xs">
                    {[
                      fundFrozen > 0 ? `${t('申购冻结')} ${formatExactAmount(fundFrozen)}` : null,
                      wdrFrozen > 0 ? `${t('在途提现')} ${formatExactAmount(wdrFrozen)}` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
