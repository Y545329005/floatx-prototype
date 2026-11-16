import { ArrowLeft } from 'lucide-react';
import {
  RECEIPT_TYPES, buildPeriodStatement, fundStatements, receiptOf,
  mandateTrades, mandateAccounts,
} from '../mock/data';
import { useLang } from '../i18n';
import { confirmationEmailDoc, periodEmailDoc, receiptEmailDoc, adviceEmailDoc } from '../mock/emailDocs';
import { renderEmailHtml } from '../mock/emailTemplates';

/* ─────────────────────────────────────────────────────────────
   邮件正文预览（2026-11-12）
   故意不挂任何入口：这是一张给设计/研发核对邮件正文的「校样页」，不是产品页面。
   路由：#mail-preview/{type}/{id}
     · 回单：deposit / withdraw / crypto-deposit / crypto-withdraw + 单据 id
     · 确认单：confirmation + statement id
     · 期间结单：period/{from}/{to}
   · 成交通知：mandate-advice/{tradeId}
   ───────────────────────────────────────────────────────────── */

export default function MailPreview({ type, id, to, goBack }) {
  const { t } = useLang();
  let doc = null;

  if (RECEIPT_TYPES.includes(type)) {
    const rec = receiptOf(type, id);
    if (rec && rec.ready) doc = receiptEmailDoc(rec, t);
  } else if (type === 'confirmation') {
    const s = (fundStatements || []).find(x => x.id === id);
    if (s) doc = confirmationEmailDoc(s, t);
  } else if (type === 'period') {
    doc = periodEmailDoc(buildPeriodStatement({ from: id, to }), t);
  } else if (type === 'mandate-advice') {
    const trade = mandateTrades.find(x => x.id === id);
    if (trade) doc = adviceEmailDoc(trade, mandateAccounts.find(a => a.id === trade.accountId), t);
  }

  return (
    <div className="page mail-preview-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')} aria-label={t('返回')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t('邮件预览')}</h1>
        </div>
      </div>

      {!doc ? (
        <div className="card"><p className="text-muted">{t('单据不存在或尚未完成')}</p></div>
      ) : (
        <>
          <p className="mail-preview-subject">{doc.subject}</p>
          <iframe
            className="mail-preview-frame"
            title={t('邮件预览')}
            srcDoc={renderEmailHtml(doc)}
          />
        </>
      )}
    </div>
  );
}
