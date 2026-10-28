import { ArrowLeft, Download } from 'lucide-react';
import { fundStatements } from '../mock/data';
import { useLang } from '../i18n';

export default function FundStatementDetail({ id, navigate, goBack }) {
  const { t } = useLang();
  const s = (fundStatements || []).find(x => x.id === id);

  if (!s) {
    return (
      <div className="page">
        <div className="subpage-sticky">
          <div className="page-header">
            <button className="back-btn" onClick={() => goBack('#fund-statements')}><ArrowLeft size={20} /></button>
            <h1>{t('结单详情')}</h1>
          </div>
        </div>
        <div className="card"><p className="text-muted">{t('结单不存在')}</p></div>
      </div>
    );
  }

  return (
    <div className="page fund-statement-detail-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#fund-statements')}><ArrowLeft size={20} /></button>
          <h1>{s.type === 'monthly' ? t('月结单') : t('逐笔结单')}</h1>
        </div>
      </div>

      <div className="card statement-card">
        <div className="statement-header">
          <div>
            <div className="statement-title">{s.fundName}</div>
            <div className="text-sm text-muted">{s.period || s.date}</div>
          </div>
          <div className="statement-amount">{s.currency} {s.amount?.toLocaleString()}</div>
        </div>
        <div className="statement-row"><span>{t('交易类型')}</span><span>{t(s.tradeType || '认购')}</span></div>
        <div className="statement-row"><span>{t('状态')}</span><span>{t('已确认')}</span></div>
        <div className="statement-row"><span>{t('结单编号')}</span><span>{s.statementNo}</span></div>
        <div className="statement-row"><span>{t('确认时间')}</span><span>{s.confirmedAt}</span></div>
      </div>

      <div className="bottom-action-bar">
        <button className="btn btn-outline btn-full"><Download size={16} /> {t('下载结单')}</button>
      </div>
    </div>
  );
}
