import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { fundStatements, formatExactAmount } from '../mock/data';
import { useLang } from '../i18n';

export default function FundStatements({ navigate, goBack }) {
  const { t } = useLang();
  // 按确认时间倒序：种子数据是 push 进来的（时间正序），运行时确认的是 unshift（时间倒序），
  // 两种来源混在一起，只有显式排序才稳定
  const list = (fundStatements || [])
    .slice()
    .sort((a, b) => String(b.confirmedAt || b.date || '').localeCompare(String(a.confirmedAt || a.date || '')));

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
              <div className="list-item-subtitle">{t(s.fundName)} {s.currency} {formatExactAmount(s.amount)}</div>
            </div>
            <ChevronRight size={18} />
          </div>
        </button>
      ))}
    </div>
  );
}
