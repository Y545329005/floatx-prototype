import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ChevronRight, Check, Plus, ShieldCheck, Wallet, X,
} from 'lucide-react';
import {
  cryptoAssetOf, cryptoAssets, cryptoBalanceOf, cryptoChainOf,
  cryptoTimeLeft, outboundAddressesOf, cryptoAddressStatusMeta, getFreezeState,
  submitCryptoWithdrawal, currentUser, logCryptoCall,
} from '../mock/data';
import { useLang } from '../i18n';
import { CryptoAssetIcon, CryptoChip, fmtCrypto, fmtTimeLeft } from '../components/CryptoBits';

const shortAddr = (a) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : '');

// 提现页（2026-11-06 重做）
// 一张卡从上往下就是一次提现的顺序：可提余额 → 到哪 → 多少 → 手续费 → 提交。
// 地址用选择器而不是把所有地址铺在页面上——地址多的时候，页面不该被地址簿撑满。
export default function CryptoWithdraw({ navigate, goBack, setToast }) {
  const { t } = useLang();
  const [assetCode, setAssetCode] = useState('USDT');
  const [addressId, setAddressId] = useState('');
  const [amount, setAmount] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const balances = cryptoBalanceOf(currentUser.id);
  const asset = cryptoAssetOf(assetCode);
  const bal = balances[assetCode] || { available: 0, locked: 0, frozen: 0 };
  const allAddresses = outboundAddressesOf(currentUser.id);
  const usable = useMemo(
    () => allAddresses.filter(a => asset && asset.chainIds.includes(a.chain) && ['active', 'cooling'].includes(a.status)),
    [allAddresses, assetCode],
  );

  useEffect(() => {
    const first = usable.find(a => a.status === 'active');
    if (first && !usable.some(a => a.id === addressId)) setAddressId(first.id);
    if (!first) setAddressId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetCode, usable.length]);

  useEffect(() => {
    logCryptoCall('查询可提余额与地址簿', { userId: currentUser.id, asset: assetCode });
  }, [assetCode]);

  const selected = usable.find(a => a.id === addressId) || null;
  const chain = selected ? cryptoChainOf(selected.chain) : null;
  const fee = chain ? chain.fee : 0;
  const amt = Number(amount) || 0;
  const net = Math.max(0, amt - fee);
  const freeze = getFreezeState();
  const addrLeft = selected ? cryptoTimeLeft(selected.activatesAt) : null;
  const cooling = !!(selected && selected.status === 'cooling' && addrLeft && !addrLeft.expired);
  const firstCapBlocked = !!(selected && selected.verifyMethod !== 'signature' && !selected.firstCapUsed);

  const canSubmit = !!(selected && selected.status === 'active' && !cooling && !freeze.frozen
    && amt >= (chain ? chain.minWithdraw : 0) && amt <= bal.available && amt > 0);

  const pickAsset = (nextCode) => {
    setAssetCode(nextCode);
    setAmount('');
    setError('');
  };

  const submit = () => {
    setError('');
    if (amt <= 0) { setError(t('请输入有效金额')); return; }
    if (!selected) { setError(t('请选择提现地址')); return; }
    if (amt < (chain ? chain.minWithdraw : 0)) { setError(`${t('最小提现额')} ${chain ? chain.minWithdraw : 0} ${assetCode}`); return; }
    if (amt > bal.available) { setError(t('超出可提余额')); return; }
    if (firstCapBlocked && amt > 5000) { setError(t('该地址首笔提现上限 5,000，可先完成签名验证或分笔提取')); return; }
    setConfirmOpen(true);
  };

  const confirm = () => {
    if (code !== '123456') { setError(t('验证码不正确（演示：123456）')); return; }
    const res = submitCryptoWithdrawal({ asset: assetCode, chain: selected.chain, addressId: selected.id, amount: amt });
    if (!res.ok) { setError(t(res.error)); return; }
    setConfirmOpen(false);
    setAmount('');
    setCode('');
    if (setToast) setToast(t('提现申请已提交，等待审批'));
    navigate('#crypto-records');
  };

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#crypto')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('提现')}</h1>
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

      {freeze.frozen && (
        <div className="crypto-hint is-warn">
          <AlertTriangle size={14} />
          <span>{t('安全项变更后 24 小时内无法提现，暂停至')} {String(freeze.until).replace('T', ' ').slice(0, 16)}</span>
        </div>
      )}

      <div className="card crypto-wd-card">
        <div className="crypto-wd-balance">
          <span className="crypto-wd-k">{t('可提')}</span>
          <div className="crypto-wd-v">
            {fmtCrypto(bal.available)} <em>{assetCode}</em>
          </div>
          {(bal.locked > 0 || bal.frozen > 0) && (
            <div className="crypto-wd-sub">
              {bal.locked > 0 && <span>{t('待解锁')} {fmtCrypto(bal.locked)}</span>}
              {bal.frozen > 0 && <span>{t('处理中')} {fmtCrypto(bal.frozen)}</span>}
            </div>
          )}
        </div>

        {usable.length === 0 ? (
          <div className="crypto-wd-empty">
            <Wallet size={20} />
            <strong>{t('还没有可用的提现地址')}</strong>
            <p>{t('添加后需平台审核与 24 小时冷却')}</p>
            <button className="btn btn-primary btn-sm btn-full" onClick={() => navigate('#crypto-addresses')}>
              {t('去添加地址')}
            </button>
          </div>
        ) : (
          <>
            <button type="button" className="crypto-select" onClick={() => setPickerOpen(true)}>
              <span className="crypto-select-main">
                <span className="crypto-select-k">{t('提现地址')}</span>
                {selected ? (
                  <>
                    <strong>{selected.label}</strong>
                    <span className="crypto-select-sub">{shortAddr(selected.address)} · {chain ? chain.standard : ''}</span>
                  </>
                ) : (
                  <span className="is-empty">{t('请选择提现地址')}</span>
                )}
              </span>
              <ChevronRight size={16} className="crypto-select-chev" />
            </button>

            <div className="crypto-amount">
              <div className="crypto-amount-head">
                <span>{t('提现金额')}</span>
                <button type="button" onClick={() => { setAmount(String(bal.available)); setError(''); }}>
                  {t('全部')}
                </button>
              </div>
              <div className="crypto-amount-row">
                <input
                  className="crypto-amount-input"
                  type="number"
                  aria-label={t('提现金额')}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                />
                <span className="crypto-amount-unit">{assetCode}</span>
              </div>
              <p className="crypto-amount-hint">
                {amt > 0
                  ? `${t('网络费')} ${fee} ${assetCode} · ${t('到账')} ${fmtCrypto(net)} ${assetCode}`
                  : `${t('最小提现额')} ${chain ? chain.minWithdraw : 0} ${assetCode} · ${t('网络费')} ${fee} ${assetCode}`}
              </p>
            </div>

            {firstCapBlocked && (
              <p className="crypto-hint is-info">
                <ShieldCheck size={14} />
                <span>{t('该地址未做签名验证，首笔提现上限 5,000 {asset}；完成签名验证可解除。').replace('{asset}', assetCode)}</span>
              </p>
            )}

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary btn-full" onClick={submit} disabled={!canSubmit}>
              {t('提交提现申请')}
            </button>
            <p className="crypto-submit-note">{t('提交后冻结余额，托管受理后不可撤回')}</p>
          </>
        )}
      </div>

      {pickerOpen && (
        <>
          <div className="sheet-mask" onClick={() => setPickerOpen(false)} />
          <div className="sheet sheet-tall crypto-picker-sheet">
            <div className="sheet-header">
              <h3>{t('提现地址')}</h3>
              <button className="btn-icon" onClick={() => setPickerOpen(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>

            <div className="crypto-picker-list">
              {usable.map(a => {
                const meta = cryptoAddressStatusMeta[a.status] || { label: a.status, tone: 'muted' };
                const left = cryptoTimeLeft(a.activatesAt);
                const disabled = a.status !== 'active';
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`crypto-picker-row${a.id === addressId ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    onClick={() => { if (disabled) return; setAddressId(a.id); setPickerOpen(false); setError(''); }}
                  >
                    <span className="crypto-picker-main">
                      <strong>{a.label}</strong>
                      <span className="mono">{shortAddr(a.address)}</span>
                      <span>{cryptoChainOf(a.chain)?.label} · {cryptoChainOf(a.chain)?.standard}</span>
                    </span>
                    <span className="crypto-picker-side">
                      {a.id === addressId && !disabled
                        ? <Check size={18} className="crypto-picker-check" />
                        : <CryptoChip meta={meta} />}
                      {a.status === 'cooling' && left && !left.expired && (
                        <span className="crypto-picker-left">{fmtTimeLeft(left, t)}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button type="button" className="crypto-text-link" onClick={() => { setPickerOpen(false); navigate('#crypto-addresses'); }}>
              <Plus size={14} /> {t('管理地址簿')}
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {confirmOpen && selected && (
        <>
          <div className="sheet-mask" onClick={() => setConfirmOpen(false)} />
          <div className="sheet sheet-tall crypto-confirm-sheet">
            <div className="sheet-header">
              <h3>{t('确认提现')}</h3>
              <button className="btn-icon" onClick={() => setConfirmOpen(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>

            <div className="crypto-confirm-amount">
              <strong>{fmtCrypto(amt)} <em>{assetCode}</em></strong>
              <span>{t('到账')} {fmtCrypto(net)} {assetCode}</span>
            </div>

            <div className="crypto-meta-list">
              <div className="crypto-meta-row"><span>{t('收款地址')}</span><strong>{selected.label} · {shortAddr(selected.address)}</strong></div>
              <div className="crypto-meta-row"><span>{t('网络')}</span><strong>{cryptoChainOf(selected.chain)?.label} · {cryptoChainOf(selected.chain)?.standard}</strong></div>
              <div className="crypto-meta-row"><span>{t('网络费')}</span><strong>{fee} {assetCode}</strong></div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('双重验证')}</label>
              <input
                className="form-input crypto-code-input"
                inputMode="numeric"
                maxLength={6}
                placeholder={t('6 位验证码')}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              />
              <p className="crypto-code-hint">{t('演示验证码 123456')}</p>
            </div>

            {error && <p className="form-error">{error}</p>}

            <p className="crypto-hint is-warn">
              <AlertTriangle size={14} />
              <span>{t('链上广播后不可撤销，请再次核对地址与网络。')}</span>
            </p>

            <button className="btn btn-primary btn-full" onClick={confirm} disabled={code.length !== 6}>
              <ShieldCheck size={15} /> {t('确认提交')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
