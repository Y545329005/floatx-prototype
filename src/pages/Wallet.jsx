import { useState } from 'react';
import { ArrowLeft, Download, Upload, ArrowLeftRight, ChevronRight, CreditCard, History, ClipboardList } from 'lucide-react';
import { wallet, currentUser, formatExact } from '../mock/data';
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

export default function Wallet({ navigate, goBack }) {
  const { t } = useLang();
  const [heroCurrency, setHeroCurrency] = useState('hkd');

  // 币种选项（Hero 卡下拉 + 紧凑列表）
  const currencyOptions = [
    { key: 'hkd', label: 'HKD', symbol: 'HK$', rate: 1 },
    { key: 'usd', label: 'USD', symbol: '$', rate: 7.8 },
    { key: 'cny', label: 'CNY', symbol: '¥', rate: 1.1 },
    { key: 'eur', label: 'EUR', symbol: '€', rate: 8.5 },
  ];

  // 计算总资产（所有币种转换为 HKD）
  const totalAssetHKD = Object.entries(wallet).reduce((sum, [key, w]) => {
    const rates = { hkd: 1, usd: 7.8, cny: 1.1, eur: 8.5 };
    return sum + w.balance * (rates[key] || 1);
  }, 0);

  // 计算选中币种的总资产（各币种折算到选中币种）
  const getAssetInCurrency = (currencyKey) => {
    const targetRate = currencyOptions.find(c => c.key === currencyKey)?.rate || 1;
    const rates = { hkd: 1, usd: 7.8, cny: 1.1, eur: 8.5 };
    return Object.entries(wallet).reduce((sum, [key, w]) => {
      return sum + (w.balance * (rates[key] || 1)) / targetRate;
    }, 0);
  };

  return (
    <div className="page wallet-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#assets')}><ArrowLeft size={20} /></button>
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
              {currencyOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ChevronRight size={14} className="wallet-currency-chevron" />
          </div>
        </div>
        <div className="wallet-hero-main">
          <div className={`wallet-hero-value ${heroAmountSize(longAmountRank(formatExact(getAssetInCurrency(heroCurrency))))}`}>
            {formatExact(getAssetInCurrency(heroCurrency))}
          </div>
        </div>
        <div className="wallet-hero-stats">
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('可用')}</span>
            <span className="wallet-hero-stat-value">{formatExact(totalAssetHKD / (currencyOptions.find(c => c.key === heroCurrency)?.rate || 1))}</span>
          </div>
          <div className="wallet-hero-stat">
            <span className="wallet-hero-stat-label">{t('冻结')}</span>
            <span className="wallet-hero-stat-value">{formatExact(currentUser.account.frozen / (currencyOptions.find(c => c.key === heroCurrency)?.rate || 1))}</span>
          </div>
        </div>
      </div>

      {/* 操作宫格：充值/提现/换汇/银行卡/资金申请/交易记录（六入口统一独立页交互，2026-08-19） */}
      <div className="wallet-actions-grid">
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
        <button className="wallet-action-item" onClick={() => navigate('#fund-requests')}>
          <ClipboardList size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('资金申请')}</span>
        </button>
        <button className="wallet-action-item" onClick={() => navigate('#transactions')}>
          <History size={24} className="wallet-action-icon" />
          <span className="wallet-action-label">{t('交易记录')}</span>
        </button>
      </div>

      {/* 币种余额：纵向全宽卡片列表（数量无关，币种多时自然堆叠；2026-08-19） */}
      <div className="card">
        <h3 className="card-title">{t('币种余额')}</h3>
        <div className="wallet-balance-list">
          {currencyOptions.map(currency => {
            const curWallet = wallet[currency.key];
            if (!curWallet) return null;

            return (
              <div key={currency.key} className="wallet-balance-item">
                <span className="wallet-balance-card-label">{currency.label}</span>
                <span className={`wallet-balance-item-amount ${balanceAmountSize(longAmountRank(formatExact(curWallet.balance)))}`}>
                  {formatExact(curWallet.balance)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
