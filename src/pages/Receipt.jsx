import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { formatExactAmount, currentUser, platformBrand, receiptOf } from '../mock/data';
import { useLang } from '../i18n';

/* ─────────────────────────────────────────────────────────────
   单次资金变动回单（2026-11-12）
   一页一单，只证「这一笔到账 / 打款」。四类（入金/出金/充币/提币）共用同一套骨架，
   差异只在字段：法币看银行与参考号，数字资产看链、地址与交易哈希。
   未到终态不出回单——发出去就是一张假凭证。
   ───────────────────────────────────────────────────────────── */

const fmtQty = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

export default function Receipt({ type, id, goBack }) {
  const { t } = useLang();
  const [printNote, setPrintNote] = useState('');

  const rec = receiptOf(type, id);

  const back = () => goBack(type && type.startsWith('crypto') ? '#crypto-records' : '#transactions');

  if (!rec) {
    return (
      <div className="page doc-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={back} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t('回单')}</h1>
          </div>
        </div>
        <div className="card"><p className="text-muted">{t('单据不存在')}</p></div>
      </div>
    );
  }

  if (!rec.ready) {
    return (
      <div className="page doc-page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={back} aria-label={t('返回')}><ArrowLeft size={20} /></button>
            <h1>{t(rec.title)}</h1>
          </div>
        </div>
        <div className="card">
          <p className="doc-unready-title">{t('该单据尚未完成')}</p>
          <p className="text-muted text-sm">{t('资金变动完成入账或打款后，才能生成回单。')}</p>
        </div>
      </div>
    );
  }

  const download = () => {
    if (typeof window === 'undefined') return;
    if (window.parent !== window) {
      setPrintNote(t('请在独立浏览器中打开后下载'));
      return;
    }
    setPrintNote('');
    window.print();
  };

  const amountText = rec.type.startsWith('crypto')
    ? `${fmtQty(rec.amount)} ${rec.currency}`
    : `${rec.currency} ${formatExactAmount(rec.amount)}`;

  return (
    <div className="page doc-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={back} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t(rec.title)}</h1>
        </div>
      </div>

      <article className="doc-sheet">
        <header className="doc-head">
          <div>
            <div className="doc-brand">{platformBrand.nameZh}</div>
            <div className="doc-title">{t(rec.title)}</div>
          </div>
          <div className="doc-meta">
            <span>{t('单据编号')} {rec.docNo}</span>
            <span>{t('列印日期')} {String(rec.issuedAt || '').slice(0, 10)}</span>
          </div>
        </header>

        <div className="doc-client">
          <div><span>{t('客户名称')}</span><b>{t(currentUser.name)}</b></div>
          <div><span>{t('客户 UID')}</span><b>{String(currentUser.id).toUpperCase()}</b></div>
        </div>

        <p className="doc-decl">
          {t('本回单为该笔资金变动的记账凭证，由电脑系统自动生成，无需签署。如对金额或参考号有疑问，请于收到后 7 天内联系客户经理。')}
        </p>

        <div className="doc-amount">
          <span>{t(rec.amountLabel)}</span>
          <b>{amountText}</b>
        </div>

        <div className="doc-table-wrap">
          <table className="doc-table doc-table-kv">
            <tbody>
              {rec.fields.map(f => (f.value ? (
                <tr key={f.label}>
                  <th>{t(f.label)}</th>
                  <td>{String(f.value)}</td>
                </tr>
              ) : null))}
            </tbody>
          </table>
        </div>

        <p className="doc-legal">
          {t('本回单不构成投资建议，也不作为基金份额的确认依据。资金到账状态以银行或托管方的最终结果为准。')}
        </p>
        <footer className="doc-foot">
          <span>
            {platformBrand.nameFullZh} · <span className="doc-nowrap">{t(platformBrand.licenseType)}</span> · {t('中央编号')} {platformBrand.licenseNo}
          </span>
          <span>1 / 1</span>
        </footer>
      </article>

      {printNote && <p className="statement-print-note">{printNote}</p>}
      {printNote && <p className="statement-print-note">{printNote}</p>}

      <div className="bottom-action-bar doc-actions">
        <button className="btn btn-primary" onClick={download}>
          <Download size={16} /> {t('下载')}
        </button>
      </div>
    </div>
  );
}
