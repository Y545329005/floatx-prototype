import { ArrowLeft } from 'lucide-react';
import { funds, projectStageColors, formatCurrency } from '../mock/data';
import { useLang } from '../i18n';

export default function Funds({ navigate, goBack, setToast }) {
  const { t } = useLang();
  return (
    <div className="page funds-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#assets')}><ArrowLeft size={20} /></button>
          <h1>{t('基金产品')}</h1>
        </div>
      </div>
      <p className="text-muted">{t('资金闲置期间的选择，低门槛灵活配置')}</p>

      <div className="card reports-note">
        <p className="text-muted text-sm">{t('基金产品为长远规划，首期暂不开放申购')}</p>
      </div>

      {funds.map(f => (
        <div key={f.id} className="card fund-detail-card">
          <div className="fund-card-top">
            <span className={`tag tag-risk-${f.riskLevel === '低风险' ? 'low' : f.riskLevel === '中风险' ? 'mid' : 'high'}`}>{f.riskLevel}</span>
            <span className="tag tag-outline">{f.type}</span>
            <span className="tag tag-outline tag-purchasable">{t('可申购')}</span>
          </div>
          <h3>{f.name}</h3>
          <p className="text-muted text-sm">{f.description}</p>
          <div className="fund-metrics">
            <div className="fund-metric">
              <span className="fund-metric-label">{t('年化收益')}</span>
              <span className="fund-metric-value">{f.annualReturn}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-metric-label">{t('期限')}</span>
              <span className="fund-metric-value">{f.term}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-metric-label">{t('起投')}</span>
              <span className="fund-metric-value">HK$ {formatCurrency(f.minInvestment)}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setToast(t('基金申购即将开放，敬请期待'))}>{t('立即申购')}</button>
        </div>
      ))}
    </div>
  );
}
