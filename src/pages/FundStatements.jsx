import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { fundStatements } from '../mock/data';
import { useLang } from '../i18n';

export default function FundStatements({ navigate, goBack }) {
  const { t } = useLang();
  const list = fundStatements || [];

  return (
    <div className="page fund-statements-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#asset')}><ArrowLeft size={20} /></button>
          <h1>{t('基金结单')}</h1>
        </div>
      </div>

      {list.length === 0 && (
        <div className="card">
          <p className="text-muted text-center">{t('暂无结单')}</p>
        </div>
      )}

      {list.map(s => (
        <button key={s.id} className="card list-card" onClick={() => navigate(`#fund-statement/${s.id}`)}>
          <div className="list-item">
            <div className="list-item-icon"><FileText size={18} /></div>
            <div className="list-item-content">
              <div className="list-item-title">
                {s.type === 'monthly' ? t('月结单') : t('逐笔结单')} · {s.period || s.date}
                {s.tradeType && <span className="tag tag-outline fund-order-type">{t(s.tradeType)}</span>}
              </div>
              <div className="list-item-subtitle">{t(s.fundName)} {s.currency} {s.amount?.toLocaleString()}</div>
            </div>
            <ChevronRight size={18} />
          </div>
        </button>
      ))}
    </div>
  );
}
