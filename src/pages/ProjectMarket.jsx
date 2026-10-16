import { useState } from 'react';
import { clickable } from '../lib';
import { Search, ArrowLeft } from 'lucide-react';
import { projects, projectStatusLabels, getProjectHeroGradient, getProjectHeroEmoji, subscriptions, currentUser, getInvestorNo } from '../mock/data';
import { useLang } from '../i18n';

// 2026-10-16 口径修订：原型需展示完整业务流形态——恢复在售项目展示与申购意向收集
// （真实无在售产品，原型体验有在售时的情况；资金与 SPV 签署全线下，线上只收意向）
// 「往期业绩」保留裁剪版命名；资金账本页（钱包/持仓等）维持摘除
export default function ProjectMarket({ navigate, embed = false, goBack }) {
  const { t } = useLang();
  const [tab, setTab] = useState('active');

  const raising = projects.filter(p => p.status === 'raising');
  const upcoming = projects.filter(p => p.status === 'upcoming');
  const closed = projects.filter(p => p.status === 'closed' || p.status === 'sold');

  const renderCard = (p) => {
    // 多用户化（2026-08-13）：按投资人过滤，"已申购"仅当前用户的记录
    const mySub = subscriptions.find(s => s.projectId === p.id && s.investorNo === getInvestorNo(currentUser.id));
    return (
      <div key={p.id} className="card project-card" {...clickable(() => navigate(`#project/${p.id}`))}>
        <div
          className="project-card-hero"
          style={{ background: getProjectHeroGradient(p.sector) }}
        >
          {p.coverImage ? (
            <img className="project-card-hero-img" src={p.coverImage} alt={p.title} loading="lazy" decoding="async" />
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
          <div className="market-header-title">
            {embed && (
              <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#wealth')}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h1>{t('项目市场')}</h1>
          </div>
          <button className="search-icon-btn" aria-label={t('搜索')} onClick={() => navigate('#search')}>
            <Search size={20} />
          </button>
        </div>

        <div className="segmented-control">
          <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>{t('进行中')}</button>
          <button className={tab === 'closed' ? 'active' : ''} onClick={() => setTab('closed')}>{t('往期业绩')}</button>
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
            {closed.length === 0 && <div className="empty-state">{t('暂无往期项目')}</div>}
          </>
        )}
      </div>

      <div className="list-end">— {t('到底了')} —</div>
    </div>
  );
}
