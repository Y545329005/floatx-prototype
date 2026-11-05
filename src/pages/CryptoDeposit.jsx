import { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ChevronRight, Clock3, Copy, Check, RefreshCw,
} from 'lucide-react';
import {
  cryptoAssetOf, cryptoAssets, cryptoChainOf, cryptoChains,
  inboundAddressOf, latestCryptoDeposit, simulateAssignInboundAddress, advanceCryptoDeposit,
  cryptoTimeLeft, currentUser, logCryptoCall,
} from '../mock/data';
import { useLang } from '../i18n';
import { CryptoAssetIcon, cryptoDepositMeta, fmtCrypto, fmtTimeLeft, useCopy } from '../components/CryptoBits';

// 充值页（2026-11-06 重做）
// 一屏内必须看全：收款地址、二维码、网络、到账条件。地址是路由键，没有「提交」。
// 状态区只放最近一笔，空着就不出现——没有正在发生的入金时，进度条只是噪音。
export default function CryptoDeposit({ navigate, goBack, param }) {
  const { t } = useLang();
  const initialChain = cryptoChains[param] ? param : 'tron';
  const [assetCode, setAssetCode] = useState(() => {
    const first = cryptoAssets.find(a => a.chainIds.includes(initialChain));
    return first ? first.code : 'USDT';
  });
  const [chainId, setChainId] = useState(initialChain);
  const [, setTick] = useState(0);
  const { copiedKey, copy } = useCopy();

  const asset = cryptoAssetOf(assetCode);
  const chain = cryptoChainOf(chainId);
  const chains = asset ? asset.chainIds.map(id => cryptoChains[id]) : [];
  const address = inboundAddressOf(currentUser.id, chainId);
  const deposit = address ? latestCryptoDeposit(currentUser.id, assetCode, chainId) : null;
  const left = cryptoTimeLeft(deposit && deposit.availableAt);

  useEffect(() => {
    logCryptoCall('查询充值地址与最近入金', { userId: currentUser.id, chain: chainId, asset: assetCode });
  }, [chainId, assetCode]);

  useEffect(() => {
    const timer = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const pickAsset = (code) => {
    setAssetCode(code);
    const next = cryptoAssetOf(code);
    if (next && !next.chainIds.includes(chainId)) setChainId(next.chainIds[0]);
  };

  const addressStatus = address ? address.status : 'missing';
  const statusMeta = cryptoDepositMeta(deposit);

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#crypto')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('充值')}</h1>
          <div className="page-header-actions">
            <button className="btn-icon" aria-label={t('充值记录')} onClick={() => navigate('#crypto-records')}>
              <Clock3 size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="crypto-chips">
        {cryptoAssets.map(a => (
          <button
            key={a.code}
            type="button"
            className={`crypto-chip-btn${a.code === assetCode ? ' active' : ''}`}
            onClick={() => pickAsset(a.code)}
          >
            <CryptoAssetIcon asset={a} size={20} />
            {a.code}
          </button>
        ))}
      </div>

      {chains.length > 1 ? (
        <div className="crypto-network">
          {chains.map(c => (
            <button
              key={c.id}
              type="button"
              className={`crypto-network-btn${c.id === chainId ? ' active' : ''}`}
              onClick={() => setChainId(c.id)}
            >
              {c.standard}
            </button>
          ))}
        </div>
      ) : (
        <div className="crypto-network-single">
          <span>{t('网络')}</span>
          <strong>{chain ? `${chain.label} · ${chain.standard}` : '—'}</strong>
        </div>
      )}

      {!address || addressStatus === 'requesting' ? (
        <div className="card crypto-pending-card">
          <div className="crypto-pending-head">
            <RefreshCw size={18} className="crypto-spin" />
            <strong>{t('地址准备中')}</strong>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-full crypto-demo-btn"
            onClick={() => { simulateAssignInboundAddress(chainId); setTick(v => v + 1); }}
          >
            {t('演示：模拟地址分配完成')}
          </button>
        </div>
      ) : addressStatus === 'failed' ? (
        <div className="card crypto-pending-card">
          <div className="crypto-pending-head is-bad">
            <AlertTriangle size={18} />
            <strong>{t('地址分配失败')}</strong>
          </div>
          <p className="crypto-pending-reason">{address.reason || t('托管未返回地址，请稍后重试或联系客服')}</p>
          <button type="button" className="btn btn-outline btn-sm btn-full" onClick={() => setTick(v => v + 1)}>
            {t('重试')}
          </button>
        </div>
      ) : (
        <>
          <div className="card crypto-deposit-card">
            <div className="crypto-qr-wrap">
              <img
                className="crypto-qr"
                src={`images/crypto/qr-${chainId}.svg`}
                alt={`${assetCode} ${chain ? chain.standard : ''}`}
              />
            </div>

            <div className="crypto-deposit-chain">
              {chain ? `${chain.label} · ${chain.standard}` : chainId}
            </div>
            <div className="crypto-addr-text mono">{address.address}</div>

            <button
              type="button"
              className={`btn btn-sm btn-full crypto-copy-btn${copiedKey === 'addr' ? ' is-copied' : ''}`}
              onClick={() => copy('addr', address.address)}
            >
              {copiedKey === 'addr' ? <><Check size={14} /> {t('已复制')}</> : <><Copy size={14} /> {t('复制地址')}</>}
            </button>

            <div className="crypto-meta-list">
              <div className="crypto-meta-row">
                <span>{t('最小充值额')}</span>
                <strong>{chain ? `${chain.minDeposit} ${assetCode}` : '—'}</strong>
              </div>
              <div className="crypto-meta-row">
                <span>{t('预计确认')}</span>
                <strong>{chain ? t('约 {n} 分钟').replace('{n}', chain.etaMin) : '—'}</strong>
              </div>
            </div>
          </div>

          <p className="crypto-hint">
            <AlertTriangle size={14} />
            <span>
              {t('仅支持')} {assetCode} · {chain ? chain.standard : ''}，{t('转错网络或代币，资产将无法找回')}
            </span>
          </p>

          {deposit && (
            <div className="card crypto-status-card">
              <div className="crypto-status-head">
                <div>
                  <span className="crypto-status-k">{t('最近一笔')}</span>
                  <strong className="crypto-status-amount">{fmtCrypto(deposit.amount)} {deposit.asset}</strong>
                </div>
                <span className={`crypto-chip is-${statusMeta.tone}`}>{t(statusMeta.label)}</span>
              </div>

              {deposit.status === 'confirming' && (
                <>
                  <div className="crypto-progress">
                    <span style={{ width: `${Math.min(100, (deposit.confirmations / deposit.required) * 100)}%` }} />
                  </div>
                  <p className="crypto-status-note">
                    {t('确认数')} {deposit.confirmations}/{deposit.required}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-full crypto-demo-btn"
                    onClick={() => { advanceCryptoDeposit(deposit.id); setTick(v => v + 1); }}
                  >
                    {t('演示：模拟确认入账')}
                  </button>
                </>
              )}

              {deposit.status === 'credited' && (
                <p className="crypto-status-note">
                  {deposit.availableAt && left && !left.expired
                    ? `${t('已入账，T+1 解锁，约 {time}后可提').replace('{time}', fmtTimeLeft(left, t))}`
                    : t('已入账，可提现')}
                </p>
              )}

              {['reversed', 'unmatched', 'wrong_asset', 'under_min'].includes(deposit.status) && (
                <p className="crypto-status-note">{deposit.reason || t('该笔入金需要人工处理，请联系客服')}</p>
              )}

              <button type="button" className="crypto-text-link" onClick={() => navigate('#crypto-records')}>
                {t('查看全部记录')}
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
