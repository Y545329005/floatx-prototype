import { useEffect } from 'react';
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Contact, History, ShieldCheck,
} from 'lucide-react';
import {
  KYC_STATUS, cryptoModuleEnabled, cryptoPortfolioOf, currentUser,
  sweepCryptoUnlocks, formatExactAmount,
} from '../mock/data';
import { useLang } from '../i18n';
import { CryptoAssetIcon, fmtCrypto } from '../components/CryptoBits';

// 数字资产（2026-11-06 重做）
// 这一页只回答三个问题：一共值多少、每种币有多少、下一步去哪。
// 估值卡沿用资产页的浅蓝底 + 蓝字，颜色语义与「钱」保持一致；
// 但总额标「总估值」而不是「总资产」——它不是可申购的基金资产。
export default function CryptoWallet({ navigate, goBack }) {
  const { t } = useLang();
  const kycOk = currentUser.kyc_status === KYC_STATUS.APPROVED;

  useEffect(() => {
    sweepCryptoUnlocks();
  }, []);

  if (!cryptoModuleEnabled) {
    return (
      <div className="page crypto-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#asset')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t('数字资产')}</h1>
          </div>
        </div>
        <div className="card">
          <p className="text-muted">{t('数字资产模块未开放')}</p>
        </div>
      </div>
    );
  }

  const p = cryptoPortfolioOf();
  const rows = p.rows;

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('数字资产')}</h1>
        </div>
      </div>

      <div className="crypto-hero">
        <div className="crypto-hero-label">{t('总估值（折合 HKD）')}</div>
        <div className="crypto-hero-value">{formatExactAmount(p.totalHKD)}</div>
      </div>

      {!kycOk ? (
        <div className="card crypto-gate-card">
          <ShieldCheck size={20} />
          <div className="crypto-gate-main">
            <strong>{t('完成身份认证后可用')}</strong>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('#kyc-start')}>{t('去认证')}</button>
        </div>
      ) : (
        <>
          <div className="crypto-actions">
            <button className="crypto-action" onClick={() => navigate('#crypto-deposit')}>
              <span className="crypto-action-icon"><ArrowDownToLine size={20} /></span>
              <span>{t('充值')}</span>
            </button>
            <button className="crypto-action" onClick={() => navigate('#crypto-withdraw')}>
              <span className="crypto-action-icon"><ArrowUpFromLine size={20} /></span>
              <span>{t('提现')}</span>
            </button>
            <button className="crypto-action" onClick={() => navigate('#crypto-addresses')}>
              <span className="crypto-action-icon"><Contact size={20} /></span>
              <span>{t('地址簿')}</span>
            </button>
            <button className="crypto-action" onClick={() => navigate('#crypto-records')}>
              <span className="crypto-action-icon"><History size={20} /></span>
              <span>{t('记录')}</span>
            </button>
          </div>

          <div className="card crypto-assets-card">
            {rows.length === 0 ? (
              <div className="crypto-empty">
                <p>{t('暂无数字资产')}</p>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('#crypto-deposit')}>{t('去充值')}</button>
              </div>
            ) : rows.map(r => (
              <div key={r.code} className="crypto-asset-row">
                <div className="crypto-asset-top">
                  <CryptoAssetIcon asset={r} size={38} />
                  <div className="crypto-asset-id">
                    <strong>{r.code}</strong>
                    <span>{r.name}</span>
                  </div>
                  <div className="crypto-asset-right">
                    <strong>{fmtCrypto(r.total)}</strong>
                    <span>≈ HK$ {formatExactAmount(r.hkd)}</span>
                  </div>
                </div>

                <div className="crypto-asset-sub">
                  <span>{t('可提')} <b>{fmtCrypto(r.available)}</b></span>
                  {r.locked > 0 && (
                    <span className="is-warn">{t('待解锁')} <b>{fmtCrypto(r.locked)}</b></span>
                  )}
                  {r.frozen > 0 && (
                    <span className="is-muted">{t('处理中')} <b>{fmtCrypto(r.frozen)}</b></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
