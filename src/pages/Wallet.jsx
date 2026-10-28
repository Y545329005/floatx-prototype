import { useState } from 'react';
import { ArrowLeft, Download, Upload, ChevronRight, ClipboardList, ArrowLeftRight, CreditCard, History } from 'lucide-react';
import { wallet, CURRENCY_META, convertToHKD, getAvailableCash, getFundFrozen, formatExact } from '../mock/data';
import { useLang } from '../i18n';

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
// 只保留闭环需要的三个动作（充值 / 提现 / 资金申请）；换汇、银行卡、交易记录三页本期未接线，
// 入口一并摘除——留着就是「点了落到路演页」的静默错页（router default 兜底渲染 Events）。
const CURRENCIES = ['HKD', 'USD', 'CNH'].map(code => ({ code, ...CURRENCY_META[code] }));

export default function Wallet({ navigate, goBack }) {
  const { t } = useLang();
  const [heroCurrency, setHeroCurrency] = useState('HKD');

  const totalHKD = CURRENCIES.reduce((s, c) => {
    const acc = wallet[c.walletKey];
    return s + (acc ? convertToHKD(acc.balance, c.code) : 0);
  }, 0);
  const heroRate = convertToHKD(1, heroCurrency) || 1;
  const heroFrozen = getFundFrozen(undefined, heroCurrency);
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
          <div className={`wallet-hero-value ${heroAmountSize(longAmountRank(formatExact(totalHKD / heroRate)))}`}>
            {formatExact(Math.round(totalHKD / heroRate))}
          </div>
        </div>
        <div className="wallet-hero-stats">
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('可用')}</span>
            <span className="wallet-hero-stat-value">{formatExact(heroAvailable)}</span>
          </div>
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('冻结')}</span>
            <span className="wallet-hero-stat-value">{formatExact(heroFrozen)}</span>
          </div>
        </div>
      </div>

      {/* 操作：充值 / 提现 / 换汇 / 银行卡（2026-10-28 APP 侧收口：换汇与银行卡页接回） */}
      <div className="wallet-actions-grid wallet-actions-grid-4">
        <button className="wallet-action-item" onClick={() => navigate('#fund-operation/deposit')}>
          <Upload size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('充值')}</span>
        </button>
        <button className="wallet-action-item" onClick={() => navigate('#fund-operation/withdraw')}>
          <Download size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('提现')}</span>
        </button>
        <button className="wallet-action-item" onClick={() => navigate('#exchange')}>
          <ArrowLeftRight size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('换汇')}</span>
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
            <div className="list-item-subtitle">{t('充值 · 提现 · 换汇处理进度')}</div>
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
            const frozen = getFundFrozen(undefined, currency.code);
            return (
              <div key={currency.code} className="wallet-balance-item">
                <span className="wallet-balance-card-label">{currency.code} · {t(currency.label)}</span>
                <span className={`wallet-balance-item-amount ${balanceAmountSize(longAmountRank(formatExact(acc.balance)))}`}>
                  {formatExact(acc.balance)}
                </span>
                {frozen > 0 && (
                  <span className="text-muted text-xs">{t('冻结')} {formatExact(frozen)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
