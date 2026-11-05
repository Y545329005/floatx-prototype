import { useState } from 'react';
import {
  ArrowLeft, Copy, Check, Plus, ShieldCheck, Trash2, X,
} from 'lucide-react';
import {
  cryptoAddressStatusMeta, cryptoChains, cryptoTimeLeft, cryptoAssetsOnChain,
  outboundAddressesOf, submitCryptoAddress, advanceCryptoAddress, removeCryptoAddress,
  currentUser, logCryptoCall,
} from '../mock/data';
import { useLang } from '../i18n';
import { CryptoChip, fmtTimeLeft, useCopy } from '../components/CryptoBits';

// 地址簿（2026-11-06 重做）
// 一条地址就是一条出金通道：状态、链、可用资产、还剩几道闸，全在卡的同一屏里说完。
// 不解释四道闸的定义，只显示这条地址现在卡在哪一道。
export default function CryptoAddresses({ navigate, goBack, setToast }) {
  const { t } = useLang();
  const [rows, setRows] = useState(() => outboundAddressesOf(currentUser.id).map(a => ({ ...a })));
  const [addOpen, setAddOpen] = useState(false);
  const [chain, setChain] = useState('ethereum');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('review');
  const [error, setError] = useState('');
  const { copiedKey, copy } = useCopy();

  const refresh = () => setRows(outboundAddressesOf(currentUser.id).map(a => ({ ...a })));
  const conf = cryptoChains[chain];

  const openAdd = () => {
    setChain('ethereum');
    setAddress('');
    setLabel('');
    setVerifyMethod('review');
    setError('');
    setAddOpen(true);
    logCryptoCall('打开新增地址', { userId: currentUser.id });
  };

  const submit = () => {
    const res = submitCryptoAddress({ chain, address, label, verifyMethod });
    if (!res.ok) { setError(t(res.error)); return; }
    setAddOpen(false);
    refresh();
    if (setToast) setToast(t('地址已提交审核'));
  };

  const advance = (id) => {
    const res = advanceCryptoAddress(id);
    if (res.ok) refresh();
  };

  const disable = (id) => {
    const res = removeCryptoAddress(id);
    if (!res.ok) { if (setToast) setToast(t(res.error)); return; }
    refresh();
    if (setToast) setToast(t('地址已停用'));
  };

  const statusLine = (a) => {
    if (a.status === 'reviewing') return t('平台审核中');
    if (a.status === 'whitelist_pending') return t('托管审核中');
    if (a.status === 'rejected') return a.reason || t('已拒绝');
    if (a.status === 'disabled') return t('已停用');
    if (a.status === 'active') {
      return a.verifyMethod === 'signature'
        ? t('已签名验证 · 无首笔限额')
        : (a.firstCapUsed ? t('已审核通过') : t('已审核 · 首笔上限 5,000'));
    }
    return '';
  };

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#crypto')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('提现地址簿')}</h1>
          <div className="page-header-actions">
            <button className="btn-icon" aria-label={t('添加地址')} onClick={openAdd}><Plus size={22} /></button>
          </div>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="card crypto-empty-card">
          <ShieldCheck size={22} />
          <strong>{t('还没有提现地址')}</strong>
          <p>{t('提现前请先添加本人地址并等待审核与冷却。')}</p>
          <button className="btn btn-primary btn-sm btn-full" onClick={openAdd}>{t('添加地址')}</button>
        </div>
      )}

      {rows.map(a => {
        const meta = cryptoAddressStatusMeta[a.status] || { label: a.status, tone: 'muted' };
        const left = cryptoTimeLeft(a.activatesAt);
        const assets = Object.keys(a.whitelist || {});
        const chainConf = cryptoChains[a.chain];
        const canAdvance = ['reviewing', 'whitelist_pending', 'cooling'].includes(a.status);
        return (
          <div key={a.id} className="card crypto-address-card">
            <div className="crypto-address-top">
              <div className="crypto-address-id">
                <strong>{a.label}</strong>
                <span>{chainConf ? `${chainConf.label} · ${chainConf.standard}` : a.chain}</span>
              </div>
              <CryptoChip meta={meta} />
            </div>

            <button
              type="button"
              className={`crypto-address-line${copiedKey === a.id ? ' copied' : ''}`}
              onClick={() => copy(a.id, a.address)}
            >
              <span className="mono">{a.address.slice(0, 18)}…{a.address.slice(-8)}</span>
              {copiedKey === a.id ? <Check size={14} /> : <Copy size={14} />}
            </button>

            <div className="crypto-address-meta">
              <span>{t('白名单资产')}</span>
              <strong>{assets.length ? assets.join(' · ') : '—'}</strong>
            </div>

            <div className="crypto-address-foot">
              <span className={`crypto-address-state${a.status === 'active' ? ' is-ok' : ''}`}>
                {a.status === 'cooling' && left && !left.expired
                  ? `${t('冷却中')} · ${t('剩余')} ${fmtTimeLeft(left, t)}`
                  : statusLine(a)}
              </span>

              <span className="crypto-address-actions">
                {canAdvance && (
                  <button type="button" className="btn btn-outline btn-sm crypto-demo-btn" onClick={() => advance(a.id)}>
                    {a.status === 'reviewing' ? t('演示：审核通过')
                      : a.status === 'whitelist_pending' ? t('演示：白名单启用')
                        : t('演示：冷却到期')}
                  </button>
                )}
                {a.status === 'active' && (
                  <button type="button" className="crypto-text-danger" onClick={() => disable(a.id)}>
                    <Trash2 size={14} /> {t('停用')}
                  </button>
                )}
              </span>
            </div>
          </div>
        );
      })}

      {addOpen && (
        <>
          <div className="sheet-mask" onClick={() => setAddOpen(false)} />
          <div className="sheet sheet-tall crypto-add-sheet">
            <div className="sheet-header">
              <h3>{t('添加提现地址')}</h3>
              <button className="btn-icon" onClick={() => setAddOpen(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>

            <div className="crypto-network crypto-network-pick">
              {Object.values(cryptoChains).map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`crypto-network-btn${c.id === chain ? ' active' : ''}`}
                  onClick={() => { setChain(c.id); setAddress(''); setError(''); }}
                >
                  {c.standard}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">{t('地址')}</label>
              <input
                className="form-input mono"
                placeholder={conf ? conf.addressHint : ''}
                value={address}
                onChange={e => { setAddress(e.target.value.trim()); setError(''); }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('备注名')}</label>
              <input
                className="form-input"
                placeholder={t('例如：我的 Ledger / 交易所账户')}
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('验证方式')}</label>
              <div className="crypto-radio-list">
                <button
                  type="button"
                  className={`crypto-radio${verifyMethod === 'review' ? ' active' : ''}`}
                  onClick={() => setVerifyMethod('review')}
                >
                  <strong>{t('人工审核')}</strong>
                  <span>{t('审核后生效 · 首笔上限 5,000')}</span>
                </button>
                <button
                  type="button"
                  className={`crypto-radio${verifyMethod === 'signature' ? ' active' : ''}`}
                  onClick={() => setVerifyMethod('signature')}
                >
                  <strong>{t('钱包签名验证')}</strong>
                  <span>{t('验证通过可跳过首笔限额')}</span>
                </button>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary btn-full" onClick={submit} disabled={!address}>
              {t('提交审核')}
            </button>
            <p className="crypto-submit-note">{t('提交后需平台审核与 24 小时冷却')}</p>
          </div>
        </>
      )}
    </div>
  );
}
