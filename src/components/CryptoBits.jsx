import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Terminal, X } from 'lucide-react';
import {
  cryptoAssumptions, cryptoCapabilities, cryptoDepositStatusMeta, cryptoWithdrawStatusMeta,
  getCryptoCalls,
} from '../mock/data';
import { useLang } from '../i18n';

// 数字资产模块的公共小件（2026-11-04）
// 只做展示，不承载业务判断：状态文案统一从 data.js 的 statusMeta 取，页面不自己拼。

// 资产图标：不引外部图床（网络只放行有限域名），用色块 + 字形
export function CryptoAssetIcon({ asset, size = 40 }) {
  if (!asset) return null;
  return (
    <span
      className="crypto-asset-icon"
      style={{ width: size, height: size, background: asset.color }}
      aria-hidden="true"
    >
      {asset.glyph}
    </span>
  );
}

export function CryptoChip({ meta, children }) {
  const { t } = useLang();
  if (!meta && !children) return null;
  // 状态标签统一在这里翻译：页面传 meta，不各自拼文案
  const label = children || (meta ? t(meta.label) : '');
  return <span className={`crypto-chip is-${meta ? meta.tone : 'muted'}`}>{label}</span>;
}

// 倒计时文案按当前语言拼：data.js 只算时分，单位留给字典
export function fmtTimeLeft(left, t) {
  if (!left) return '';
  if (left.expired) return t('已到期');
  return left.h > 0
    ? t('{h} 小时 {m} 分').replace('{h}', left.h).replace('{m}', left.m)
    : t('{m} 分钟').replace('{m}', left.m);
}

// 币量格式：整数位千分位；小于 1 的资产保留 6 位（BTC 演示 0.15）
export function fmtCrypto(v) {
  const n = Number(v) || 0;
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: n > 0 && n < 1 ? 6 : 2,
  });
}

// 复制：同步 execCommand 优先（自动化/后台标签页里 clipboard.writeText 会挂起），与资金页同一套手感
export function useCopy() {
  const timer = useRef(null);
  const [copiedKey, setCopiedKey] = useState('');
  useEffect(() => () => clearTimeout(timer.current), []);
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
    } catch (e) { done = false; }
    if (!done && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedKey(''), 2500);
  };
  return { copiedKey, copy };
}

export function CryptoCopyRow({ label, value, mono = true, copyKey, copiedKey, onCopy, children }) {
  return (
    <button
      type="button"
      className={`crypto-copy-row${copiedKey === copyKey ? ' copied' : ''}`}
      onClick={() => onCopy(copyKey, value)}
    >
      <span className="k">{label}</span>
      <span className={`v${mono ? ' mono' : ''}`}>{children || value}</span>
      {copiedKey === copyKey ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export function CryptoCallout({ tone = 'info', title, children }) {
  return (
    <div className={`crypto-callout is-${tone}`}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

// 演示用：右下角「接口」浮层
// 目的不是调试，而是让钱包组看到每一步对应的接口与五个待确认假设——
// 这比发一张问题清单更容易对齐。只在数字资产模块内出现。
export function CryptoDevFab() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    if (!open) return;
    setCalls(getCryptoCalls());
  }, [open]);

  return (
    <>
      <button type="button" className="crypto-dev-fab" onClick={() => setOpen(true)} aria-label={t('接口与假设')}>
        <Terminal size={16} />
        <span>{t('接口')}</span>
      </button>
      {open && (
        <>
          <div className="sheet-mask" onClick={() => setOpen(false)} />
          <div className="sheet crypto-dev-sheet">
            <div className="sheet-header">
              <h3>{t('接口与假设（演示）')}</h3>
              <button className="btn-icon" onClick={() => setOpen(false)} aria-label={t('关闭')}><X size={18} /></button>
            </div>
            <p className="text-muted text-sm">
              {t('本页所有数据为 mock；以下为每一步对应的接口调用与待确认假设。')}
            </p>

            <h4 className="crypto-dev-h">{t('最近调用')}</h4>
            {calls.length === 0 && <p className="text-muted text-sm">{t('本页暂无调用（切换页面或执行操作后出现）')}</p>}
            <div className="crypto-dev-calls">
              {calls.map((c, i) => (
                <div key={`${c.at}-${i}`} className="crypto-dev-call">
                  <div className="crypto-dev-call-top">
                    <strong>{c.method}</strong>
                    <span className="text-muted text-sm">{c.at}</span>
                  </div>
                  <code>{JSON.stringify(c.payload)}</code>
                  {c.note && <p className="text-muted text-sm">{c.note}</p>}
                </div>
              ))}
            </div>

            <h4 className="crypto-dev-h">{t('待确认假设')}</h4>
            <div className="crypto-dev-assumptions">
              {cryptoAssumptions.map(a => (
                <div key={a.key} className="crypto-dev-assumption">
                  <strong>{t(a.label)}</strong>
                  <p>{a.value}</p>
                  <p className="text-muted text-sm">{a.basis}</p>
                </div>
              ))}
            </div>

            <h4 className="crypto-dev-h">{t('托管能力')}</h4>
            <div className="crypto-dev-caps">
              {cryptoCapabilities.map(c => (
                <span key={c.key} className={`crypto-dev-cap ${c.available ? 'on' : 'off'}`}>
                  {t(c.label)} · {c.available ? t('可用') : t('未开放')}
                </span>
              ))}
            </div>

            <a className="btn btn-outline btn-sm btn-full" href="#crypto-map">{t('查看完整状态对照')}</a>
          </div>
        </>
      )}
    </>
  );
}

export function cryptoDepositMeta(deposit) {
  if (!deposit) return null;
  const base = cryptoDepositStatusMeta[deposit.status] || { label: deposit.status, tone: 'muted' };
  if (deposit.status === 'credited' && deposit.availableAt) {
    return { label: '待解锁', tone: 'info' };
  }
  return base;
}

export function cryptoWithdrawMeta(row) {
  if (!row) return null;
  return cryptoWithdrawStatusMeta[row.status] || { label: row.status, tone: 'muted' };
}
