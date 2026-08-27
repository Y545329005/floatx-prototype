import { useState } from 'react';
import { Search } from 'lucide-react';
import { projects, projectStatusLabels, getProjectHeroGradient, getProjectHeroEmoji, subscriptions, currentUser, getInvestorNo } from '../mock/data';
import { useLang } from '../i18n';

export default function ProjectMarket({ navigate }) {
  const { t } = useLang();
  const [tab, setTab] = useState('active');

  const raising = projects.filter(p => p.status === 'raising');
  const upcoming = projects.filter(p => p.status === 'upcoming');
  const closed = projects.filter(p => p.status === 'closed' || p.status === 'sold');

  const renderCard = (p) => {
    // 多用户化（2026-08-13）：按投资人过滤，"已申购"仅当前用户的记录
    const mySub = subscriptions.find(s => s.projectId === p.id && s.investorNo === getInvestorNo(currentUser.id));
    return (
      <div key={p.id} className="card project-card" onClick={() => navigate(`#project/${p.id}`)}>
        <div
          className="project-card-hero"
          style={{ background: getProjectHeroGradient(p.sector) }}
        >
          {p.coverImage ? (
            <img className="project-card-hero-img" src={p.coverImage} alt={p.title} />
          ) : (
            <span className="project-card-hero-icon">{getProjectHeroEmoji(p.sector)}</span>
          )}
          <span className={`card-status-badge ${p.status}`}>{t(projectStatusLabels[p.status])}</span>
        </div>
        <div className="project-card-body">
          <h3>{p.title}</h3>
          <div className="project-card-meta-line">
            {mySub && <span className="sub-mark">{t('已申购')}</span>}
            {mySub && ' · '}
            {t(p.sector)} · {p.location}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page project-market-page">
      <div className="market-sticky">
        <div className="market-header">
          <h1>{t('项目市场')}</h1>
          <button className="search-icon-btn" aria-label={t('搜索')} onClick={() => navigate('#search')}>
            <Search size={20} />
          </button>
        </div>

        <div className="segmented-control">
          <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>{t('进行中')}</button>
          <button className={tab === 'closed' ? 'active' : ''} onClick={() => setTab('closed')}>{t('已结束')}</button>
        </div>
      </div>

      <div className="project-list">
        {tab === 'active' ? (
          <>
            {raising.map(renderCard)}
            {upcoming.length > 0 && <div className="section-divider">{t('即将上线')}</div>}
            {upcoming.map(renderCard)}
            {raising.length === 0 && upcoming.length === 0 && (
              <div className="empty-state">{t('暂无进行中的项目')}</div>
            )}
          </>
        ) : (
          <>
            {closed.map(renderCard)}
            {closed.length === 0 && <div className="empty-state">{t('暂无已结束的项目')}</div>}
          </>
        )}
      </div>

      <div className="list-end">— {t('到底了')} —</div>
    </div>
  );
}
