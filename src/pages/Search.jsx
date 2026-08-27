import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { projects, events, projectStatusLabels, getProjectHeroGradient, getProjectHeroEmoji, subscriptions, sectors, isEventRegistered, currentUser, getInvestorNo } from '../mock/data';
import { useLang } from '../i18n';

export default function SearchPage({ navigate, goBack }) {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const [selectedSectors, setSelectedSectors] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 切换行业选中状态（多选 OR 逻辑）
  const toggleSector = (sector) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  // 过滤项目
  const filteredProjects = projects.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.company.toLowerCase().includes(q)) return false;
    }
    if (selectedSectors.length > 0 && !selectedSectors.includes(p.sector)) return false;
    return true;
  });

  // 过滤路演
  const filteredEvents = events.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      const proj = e.projectId ? projects.find(p => p.id === e.projectId) : null;
      if (!e.title.toLowerCase().includes(q) &&
          !(proj?.sector && proj.sector.toLowerCase().includes(q)) &&
          !(e.projectName && e.projectName.toLowerCase().includes(q)) &&
          !(proj && (proj.title.toLowerCase().includes(q) || proj.company.toLowerCase().includes(q)))) {
        return false;
      }
    }
    if (selectedSectors.length > 0 && !selectedSectors.includes(e.sector)) return false;
    return true;
  });

  const hasResults = filteredProjects.length > 0 || filteredEvents.length > 0;
  const hasSearch = search.trim().length > 0 || selectedSectors.length > 0;
  const searchedNotFound = hasSearch && !hasResults;

  const renderProjectCard = (p) => {
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

  const renderEventCard = (e) => {
    const proj = projects.find(p => p.id === e.projectId);
    const heroSector = proj ? proj.sector : e.projectName;
    return (
      <div key={e.id} className="card project-card" onClick={() => navigate(`#event/${e.id}`)}>
        <div
          className="project-card-hero"
          style={{ background: getProjectHeroGradient(heroSector) }}
        >
          {e.coverImage ? (
            <img className="project-card-hero-img" src={e.coverImage} alt={e.title} />
          ) : (
            <span className="project-card-hero-icon">{getProjectHeroEmoji(heroSector)}</span>
          )}
          <span className="event-date-pill">{e.date.slice(5, 7)}{t('月')}{e.date.slice(8, 10)}{t('日')}</span>
        </div>
        <div className="project-card-body">
          <h3>{e.title}</h3>
          <div className="project-card-meta-line">
            {isEventRegistered(e.id) && <><span className="sub-mark">{t('已报名')}</span> · </>}
            {t(heroSector)}
            {proj && proj.stage ? ` · ${t(proj.stage)}` : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page search-page">
      <div className="search-sticky">
        <div className="search-header">
          <button className="back-btn" aria-label={t('返回')} onClick={() => goBack('#projects')}>
            <ArrowLeft size={20} />
          </button>
          <div className="search-input-wrap" role="searchbox" aria-label={t('搜索项目或路演')}>
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('搜索项目或路演名称...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear-btn" aria-label={t('清除搜索')} onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-chips" role="group" aria-label={t('行业筛选')}>
          <div className="chips">
            {sectors.map(s => (
              <button
                key={s}
                className={`chip ${selectedSectors.includes(s) ? 'active' : ''}`}
                aria-pressed={selectedSectors.includes(s)}
                aria-label={t('筛选：') + t(s)}
                onClick={() => toggleSector(s)}
              >
                {t(s)}
              </button>
            ))}
          </div>
          {selectedSectors.length > 0 && (
            <button
              className="search-clear-filters-btn"
              onClick={() => setSelectedSectors([])}
            >
              {t('清除筛选')}
            </button>
          )}
        </div>
      </div>

      {/* 初始状态：未输入且无筛选 */}
      {!hasSearch && (
        <div className="search-empty-initial">
          <p className="search-empty-hint">{t('输入关键词搜索项目或路演')}</p>
          <p className="search-empty-sub">{t('选择行业筛选')}</p>
        </div>
      )}

      {/* 无结果状态 */}
      {searchedNotFound && (
        <div className="search-empty-no-results">
          <p className="search-empty-title">{t('未找到匹配的项目或路演')}</p>
        </div>
      )}

      {/* 有搜索/筛选时显示结果 */}
      {hasSearch && hasResults && (
        <>
          {/* 项目结果 */}
          {filteredProjects.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <span className="search-section-title">
                  {t('项目结果')} ({filteredProjects.length})
                </span>
                <button
                  className="search-section-more"
                  onClick={() => navigate('#projects')}
                >
                  {t('全部')} <ChevronRight size={14} />
                </button>
              </div>
              <div className="project-list">
                {filteredProjects.map(renderProjectCard)}
              </div>
            </div>
          )}

          {/* 路演结果 */}
          {filteredEvents.length > 0 && (
            <div className="search-section">
              <div className="search-section-header">
                <span className="search-section-title">
                  {t('路演结果')} ({filteredEvents.length})
                </span>
                <button
                  className="search-section-more"
                  onClick={() => navigate('#events')}
                >
                  {t('全部')} <ChevronRight size={14} />
                </button>
              </div>
              <div className="project-list">
                {filteredEvents.map(renderEventCard)}
              </div>
            </div>
          )}

          {/* 列表结束标记 */}
          <div className="list-end">— {t('到底了')} —</div>
        </>
      )}
    </div>
  );
}

function ChevronRight({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
