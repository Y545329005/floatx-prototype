import { useState } from 'react';
import { navPath } from '../components/NavChart';
import { funds, getPiStatusForUser, PI_STATUS, currentUser } from '../mock/data';
import { useLang } from '../i18n';

// 基金列表（2026-10-28 富途式改版）：顶部自营/代售页签 + 类型筛选 chips + 富途式卡片
// （来源徽章 + 风险色标 + 收益大数字 + 指标三列 + 迷你净值曲线）
const SOURCE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'self', label: '自营基金' },
  { key: 'external', label: '代售基金' },
];

const riskClass = (level) => (level === '低风险' || level === '中低风险') ? 'low' : level === '中风险' ? 'mid' : 'high';

// 卡片迷你净值曲线（示意，近 1 年切片）
function Spark({ series }) {
  const pts = series.slice(-52);
  return (
    <svg className="fund-spark" viewBox="0 0 104 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={navPath(pts, 104, 32, 2).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Funds({ navigate, goBack, setToast }) {
  const { t } = useLang();
  const pi = getPiStatusForUser(currentUser.id);
  const piOk = pi === PI_STATUS.APPROVED;
  const [source, setSource] = useState('all');
  const [type, setType] = useState('all');

  const bySource = source === 'all' ? funds : funds.filter(f => f.source === source);
  const types = [...new Set(bySource.map(f => f.type))];
  const list = type === 'all' ? bySource : bySource.filter(f => f.type === type);

  return (
    <div className="page funds-page">
      <div className="subpage-sticky">
        <div className="page-header">
          <h1>{t('基金')}</h1>
        </div>
        <div className="segmented-control fund-source-tabs">
          {SOURCE_TABS.map(tab => (
            <button key={tab.key} className={source === tab.key ? 'active' : ''} onClick={() => { setSource(tab.key); setType('all'); }}>
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {piOk && types.length > 1 && (
        <div className="chips fund-type-chips">
          <button className={`chip ${type === 'all' ? 'active' : ''}`} onClick={() => setType('all')}>{t('全部类型')}</button>
          {types.map(tp => (
            <button key={tp} className={`chip ${type === tp ? 'active' : ''}`} onClick={() => setType(tp)}>{t(tp)}</button>
          ))}
        </div>
      )}

      {!piOk && (
        <div className="card reports-note">
          <p className="text-muted text-sm">{t('需完成专业投资者（PI）认证后方可查看并申购基金产品')}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('#kyc-pi')}>{t('去认证')}</button>
        </div>
      )}

      {piOk && list.map(f => (
        <div key={f.id} className="card fund-card" onClick={() => navigate(`#fund/${f.id}`)}>
          <div className="fund-card-top">
            <span className={`fund-source-badge ${f.source}`}>{t(f.source === 'self' ? '自营' : '代售')}</span>
            <span className={`tag tag-risk-${riskClass(f.riskLevel)}`}>{t(f.riskLevel)}</span>
            <span className="tag tag-outline">{t(f.type)}</span>
            {f.openForSubscription && <span className="tag tag-outline tag-purchasable">{t('可申购')}</span>}
          </div>
          <h3>{t(f.name)}</h3>
          <div className="fund-spark-row">
            <div className="fund-return">
              <span className="fund-return-label">{t(f.returnLabel)} · {t(f.returnNote)}</span>
              <span className="fund-return-value">{t(f.returnValue)}</span>
            </div>
            <Spark series={f.navSeries} />
          </div>
          <div className="fund-metrics">
            <div className="fund-metric">
              <span className="fund-metric-label">{t('期限')}</span>
              <span className="fund-metric-value">{t(f.term)}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-metric-label">{t('起投')}</span>
              <span className="fund-metric-value">HK$ {f.minInvestment.toLocaleString()}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-metric-label">{t('锁定期')}</span>
              <span className="fund-metric-value">{t(f.lockPeriod)}</span>
            </div>
          </div>
          {f.source === 'external' && (
            <p className="text-muted text-sm fund-card-note">{t(f.managerNote)}</p>
          )}
        </div>
      ))}

      {piOk && list.length === 0 && (
        <div className="card reports-note"><p className="text-muted text-sm">{t('该类型暂无基金')}</p></div>
      )}
    </div>
  );
}
