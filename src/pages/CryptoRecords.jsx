import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowUpFromLine, X,
} from 'lucide-react';
import {
  advanceCryptoDeposit, advanceCryptoWithdrawal, cryptoChainOf, cryptoDepositsOf,
  cryptoWithdrawalsOf, cryptoTimeLeft, logCryptoCall,
} from '../mock/data';
import { useLang } from '../i18n';
import {
  CryptoChip, CryptoCopyRow, cryptoDepositMeta, cryptoWithdrawMeta, fmtCrypto, fmtTimeLeft, useCopy,
} from '../components/CryptoBits';

const shortTime = (stamp) => {
  const s = String(stamp || '');
  return s.length >= 16 ? s.slice(5, 16) : (s || '—');
};

// 记录页（2026-11-06 重做）
// 出入金同一条时间线：左列方向、右列金额与状态，扫一眼就能对齐。
// 详情用底部弹层，不为一个只读单据再加一条路由。
export default function CryptoRecords({ navigate, goBack }) {
  const { t } = useLang();
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState(null);
  const [tick, setTick] = useState(0);
  const { copiedKey, copy } = useCopy();

  const rows = useMemo(() => {
    const deposits = cryptoDepositsOf().map(d => ({
      kind: 'deposit',
      raw: d,
      sortKey: d.createdAt || d.creditedAt || '',
      time: d.createdAt || d.creditedAt || '—',
    }));
    const withdrawals = cryptoWithdrawalsOf().map(w => ({
      kind: 'withdraw',
      raw: w,
      sortKey: w.createdAt || '',
      time: w.createdAt,
    }));
    const all = [...deposits, ...withdrawals].sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));
    return tab === 'all' ? all : all.filter(r => r.kind === tab);
  }, [tab, tick]);

  const open = (row) => {
    setDetail(row);
    logCryptoCall('查询单据详情', { kind: row.kind, id: row.raw.id });
  };

  const advance = (row) => {
    const res = row.kind === 'deposit'
      ? advanceCryptoDeposit(row.raw.id)
      : advanceCryptoWithdrawal(row.raw.id);
    if (res.ok) {
      setTick(v => v + 1);
      setDetail({ ...row, raw: { ...row.raw } });
    }
  };

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#crypto')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('数字资产记录')}</h1>
        </div>
      </div>

      <div className="segmented-control crypto-record-tabs">
        <button type="button" className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>{t('全部')}</button>
        <button type="button" className={tab === 'deposit' ? 'active' : ''} onClick={() => setTab('deposit')}>{t('充值')}</button>
        <button type="button" className={tab === 'withdraw' ? 'active' : ''} onClick={() => setTab('withdraw')}>{t('提现')}</button>
      </div>

      {rows.length === 0 ? (
        <div className="card crypto-empty-card">
          <p>{t('暂无记录')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#crypto-deposit')}>{t('去充值')}</button>
        </div>
      ) : (
        <div className="crypto-record-list">
          {rows.map(row => {
            const r = row.raw;
            const meta = row.kind === 'deposit' ? cryptoDepositMeta(r) : cryptoWithdrawMeta(r);
            const chain = cryptoChainOf(r.chain);
            const sign = row.kind === 'withdraw' || r.status === 'reversed' ? '−'
              : ['unmatched', 'wrong_asset', 'under_min'].includes(r.status) ? '' : '+';
            return (
              <button key={`${row.kind}-${r.id}`} type="button" className="crypto-record-row" onClick={() => open(row)}>
                <span className={`crypto-record-icon is-${row.kind}`}>
                  {row.kind === 'deposit' ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}
                </span>
                <span className="crypto-record-main">
                  <span className="crypto-record-title">
                    {row.kind === 'deposit' ? t('充值') : t('提现')} {r.asset}
                  </span>
                  <span className="crypto-record-meta">
                    {shortTime(row.time)} · {chain ? chain.standard : r.chain}
                  </span>
                </span>
                <span className="crypto-record-right">
                  <strong>{sign}{fmtCrypto(r.amount)}</strong>
                  <CryptoChip meta={meta} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {detail && (
        <>
          <div className="sheet-mask" onClick={() => setDetail(null)} />
          <div className="sheet sheet-tall crypto-detail-sheet">
            <div className="sheet-header">
              <h3>{detail.kind === 'deposit' ? t('充值详情') : t('提现详情')}</h3>
              <button className="btn-icon" onClick={() => setDetail(null)} aria-label={t('关闭')}><X size={18} /></button>
            </div>

            <DetailBody row={detail} t={t} copiedKey={copiedKey} copy={copy} />

            {detail.kind === 'deposit' && detail.raw.status === 'confirming' && (
              <button type="button" className="btn btn-outline btn-sm btn-full crypto-demo-btn" onClick={() => advance(detail)}>
                {t('演示：模拟确认入账')}
              </button>
            )}
            {detail.kind === 'withdraw' && ['pending_approval', 'manual_pending', 'submitted', 'broadcasting', 'unknown'].includes(detail.raw.status) && (
              <button type="button" className="btn btn-outline btn-sm btn-full crypto-demo-btn" onClick={() => advance(detail)}>
                {detail.raw.status === 'pending_approval' ? t('演示：审批通过') : t('演示：推进托管状态')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailBody({ row, t, copiedKey, copy }) {
  const r = row.raw;
  const chain = cryptoChainOf(r.chain);
  const meta = row.kind === 'deposit' ? cryptoDepositMeta(r) : cryptoWithdrawMeta(r);
  const left = cryptoTimeLeft(r.availableAt);

  return (
    <>
      <div className="crypto-detail-head">
        <div>
          <span className="crypto-detail-k">{row.kind === 'deposit' ? t('充值金额') : t('提现金额')}</span>
          <strong>{fmtCrypto(r.amount)} <em>{r.asset}</em></strong>
        </div>
        <CryptoChip meta={meta} />
      </div>

      <div className="crypto-meta-list">
        <div className="crypto-meta-row"><span>{t('网络')}</span><strong>{chain ? `${chain.label} · ${chain.standard}` : r.chain}</strong></div>
        <div className="crypto-meta-row"><span>{t('时间')}</span><strong>{r.createdAt || r.creditedAt || '—'}</strong></div>

        {row.kind === 'deposit' && (
          <>
            <div className="crypto-meta-row"><span>{t('确认数')}</span><strong>{r.confirmations}/{r.required}</strong></div>
            {r.custodyFlowId && <div className="crypto-meta-row"><span>{t('托管流水号')}</span><strong>{r.custodyFlowId}</strong></div>}
            {(r.availableAt || r.status === 'credited') && (
              <div className="crypto-meta-row">
                <span>{t('可提时间')}</span>
                <strong>{r.availableAt ? (left && !left.expired ? `${t('{time} 后').replace('{time}', fmtTimeLeft(left, t))}` : r.availableAt) : t('已可提')}</strong>
              </div>
            )}
          </>
        )}

        {row.kind === 'withdraw' && (
          <>
            <div className="crypto-meta-row"><span>{t('业务单号')}</span><strong>{r.businessNo}</strong></div>
            <div className="crypto-meta-row"><span>{t('网络费')}</span><strong>{r.fee} {r.asset}</strong></div>
            <div className="crypto-meta-row"><span>{t('实际到账')}</span><strong>{fmtCrypto(r.netAmount)} {r.asset}</strong></div>
            {r.custodyOrderNo && <div className="crypto-meta-row"><span>{t('托管单号')}</span><strong>{r.custodyOrderNo}</strong></div>}
          </>
        )}
      </div>

      {row.kind === 'withdraw' && (
        <CryptoCopyRow
          label={t('收款地址')}
          value={r.toAddress}
          copyKey={`addr-${r.id}`}
          copiedKey={copiedKey}
          onCopy={copy}
        />
      )}

      {r.txHash ? (
        <CryptoCopyRow
          label={t('链上交易')}
          value={r.txHash}
          copyKey={`tx-${r.id}`}
          copiedKey={copiedKey}
          onCopy={copy}
        />
      ) : (
        <p className="crypto-detail-note">{t('尚无链上交易号')}</p>
      )}

      {r.reason && <p className="crypto-hint is-warn"><AlertTriangle size={14} /><span>{r.reason}</span></p>}
      {r.status === 'unknown' && <p className="crypto-hint is-warn"><AlertTriangle size={14} /><span>{t('该笔出金结果待核实，请联系客服')}</span></p>}
    </>
  );
}

