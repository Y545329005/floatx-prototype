import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import {
  cryptoApiContract, cryptoAssumptions, cryptoCapabilities,
  cryptoAddressStatusMeta, cryptoDepositStatusMeta, cryptoWithdrawStatusMeta,
  getCryptoCalls,
} from '../mock/data';
import { useLang } from '../i18n';
import { CryptoCallout, CryptoChip, CryptoDevFab } from '../components/CryptoBits';

// 接口与状态对照（2026-11-04）
// 这一页不是给用户看的，是给钱包组评审用的：
//   ① 状态映射——我们的枚举对应托管的什么状态，空白处就是他们要填的；
//   ② 五个待确认假设——答案不同会改哪一块；
//   ③ 我们要的接口契约——比问题清单更容易对齐；
//   ④ 本次会话的调用记录——每一步对应哪一次接口。
export default function CryptoMap({ goBack }) {
  const { t } = useLang();
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    setCalls(getCryptoCalls());
  }, []);

  return (
    <div className="page crypto-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#crypto')} aria-label={t('返回')}><ArrowLeft size={20} /></button>
          <h1>{t('接口与状态对照')}</h1>
        </div>
      </div>

      <CryptoCallout tone="info" title={t('给钱包组看的演示页')}>
        {t('本页把「页面需要的托管状态与字段」摊开：状态映射的空白处、假设项、以及我们要的接口契约，都是需要双方确认的部分。')}
      </CryptoCallout>

      <section className="card crypto-map-card">
        <h3 className="card-title">{t('一、托管能力现状')}</h3>
        <div className="crypto-map-caps">
          {cryptoCapabilities.map(c => (
            <div key={c.key} className="crypto-map-cap">
              <span className={`crypto-map-dot ${c.available ? 'on' : 'off'}`} />
              <div>
                <strong>{t(c.label)}</strong>
                <p className="text-muted text-sm">{c.note}</p>
              </div>
              <span className={`crypto-map-state ${c.available ? 'on' : 'off'}`}>{c.available ? t('可用') : t('未开放')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card crypto-map-card">
        <h3 className="card-title">{t('二、五个待确认假设')}</h3>
        <p className="text-muted text-sm crypto-map-intro">
          {t('页面不直接读托管字段，只读假设后的结果；答案变化时改一处适配层，不改页面。')}
        </p>
        {cryptoAssumptions.map(a => (
          <div key={a.key} className="crypto-map-assumption">
            <strong>{t(a.label)}</strong>
            <p>{a.value}</p>
            <p className="text-muted text-sm">{t('依据')}：{a.basis}</p>
            <p className="text-muted text-sm">{t('若不同')}：{a.impact}</p>
          </div>
        ))}
      </section>

      <section className="card crypto-map-card">
        <h3 className="card-title">{t('三、状态映射')}</h3>
        <p className="text-muted text-sm crypto-map-intro">
          {t('左列是我们页面上展示的状态，右列需要托管给出对应状态或原因码。')}
        </p>

        <StatusTable
          title={t('入金')}
          t={t}
          rows={Object.entries(cryptoDepositStatusMeta).map(([key, meta]) => ({
            key, label: meta.label, tone: meta.tone, custody: DEPOSIT_MAP[key] || '',
          }))}
        />
        <StatusTable
          title={t('出金')}
          t={t}
          rows={Object.entries(cryptoWithdrawStatusMeta).map(([key, meta]) => ({
            key, label: meta.label, tone: meta.tone, custody: WITHDRAW_MAP[key] || '',
          }))}
        />
        <StatusTable
          title={t('地址')}
          t={t}
          rows={Object.entries(cryptoAddressStatusMeta).map(([key, meta]) => ({
            key, label: meta.label, tone: meta.tone, custody: ADDRESS_MAP[key] || '',
          }))}
        />
      </section>

      <section className="card crypto-map-card">
        <h3 className="card-title">{t('四、我们要的接口契约')}</h3>
        <div className="crypto-map-contract">
          {cryptoApiContract.map(c => (
            <div key={c.method} className="crypto-map-method">
              <code>{c.method}</code>
              <div className="crypto-map-io">
                <span><em>{t('入参')}</em>{c.request}</span>
                <span><em>{t('出参')}</em>{c.response}</span>
              </div>
              <p className="text-muted text-sm">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card crypto-map-card">
        <h3 className="card-title">{t('五、本次会话的调用记录')}</h3>
        {calls.length === 0 && <p className="text-muted text-sm">{t('还没有调用记录。返回上一页操作后回来查看。')}</p>}
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
      </section>

      <CryptoCallout tone="warn" title={t('验收时请重点看三个反例')}>
        <div className="crypto-map-checklist">
          <span><ClipboardCheck size={14} /> {t('未审批的提现指令签不出来')}</span>
          <span><ClipboardCheck size={14} /> {t('结果不明时没有「补发」入口')}</span>
          <span><ClipboardCheck size={14} /> {t('地址冷却中与白名单未启用都提不了')}</span>
        </div>
      </CryptoCallout>

      <CryptoDevFab />
    </div>
  );
}

function StatusTable({ title, rows, t }) {
  return (
    <div className="crypto-status-table">
      <h4>{title}</h4>
      <div className="crypto-status-head">
        <span>{t('页面状态')}</span>
        <span>{t('托管状态 / 原因码')}</span>
      </div>
      {rows.map(r => (
        <div key={r.key} className="crypto-status-row">
          <span><CryptoChip meta={{ label: r.label, tone: r.tone }} /><code>{r.key}</code></span>
          <span className="crypto-status-custody">{r.custody || t('待确认')}</span>
        </div>
      ))}
    </div>
  );
}

// 文档里能对应的先填上，其余留空给钱包组
const DEPOSIT_MAP = {
  confirming: 'deposit.pending / confirming',
  credited: 'wallet credited + flow',
  reversed: 'correction / deduction flow',
  unmatched: '',
  wrong_asset: 'unsupported asset 核查',
  under_min: '',
};
const WITHDRAW_MAP = {
  pending_approval: '—（平台内部）',
  manual_pending: '—（页面手动执行）',
  submitted: 'order accepted',
  broadcasting: 'broadcasting / processing',
  confirmed: 'completed + txHash',
  failed: 'failed / rejected',
  returned: 'returned / refund flow',
  unknown: '查询原单',
  rejected: 'rejected',
};
const ADDRESS_MAP = {
  reviewing: '—（平台审核）',
  whitelist_pending: 'whitelist pending',
  cooling: '—（平台冷却）',
  active: 'whitelist active',
  rejected: 'whitelist rejected',
  disabled: 'whitelist disabled',
};
