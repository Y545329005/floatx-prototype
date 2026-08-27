import { useState, useRef, useEffect } from 'react';
import { MapPin, Monitor, Search, ChevronDown, Check } from 'lucide-react';
import { events, projects, getProjectHeroGradient, getProjectHeroEmoji, isEventRegistered, isEventLive, eventStatusLabels } from '../mock/data';
import { useLang } from '../i18n';
import BusinessContact from '../components/BusinessContact';

const TYPE_OPTIONS = [
  { value: 'all', labelKey: '全部活动' },
  { value: 'online', labelKey: '线上会议' },
  { value: 'offline', labelKey: '线下活动' },
];

export default function Events({ navigate, setToast, isLoggedIn = false }) {
  const { t } = useLang();
  const [tab, setTab] = useState('upcoming');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'online' | 'offline'
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!typeOpen) return;
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [typeOpen]);

  const currentTypeLabel = (TYPE_OPTIONS.find(o => o.value === typeFilter) || TYPE_OPTIONS[0]).labelKey;

  const upcoming = events.filter(e => e.status === 'upcoming');
  const past = events.filter(e => e.status === 'past');

  const filterByType = (list) => {
    if (typeFilter === 'all') return list;
    return list.filter(e => e.type === typeFilter);
  };

  const renderEvent = (e) => {
    const proj = projects.find(p => p.id === e.projectId);
    const heroSector = proj ? proj.sector : e.projectName;
    const live = isEventLive(e);
    return (
      <div key={e.id} className="card project-card" onClick={() => navigate(`#event/${e.id}`)}>
        <div
          className="event-card-hero-lg"
          style={{ background: getProjectHeroGradient(heroSector) }}
        >
          {e.coverImage ? (
            <img src={e.coverImage} alt={e.title} />
          ) : (
            <span className="event-card-hero-icon">{getProjectHeroEmoji(heroSector)}</span>
          )}
          {live ? (
            <span className="event-date-pill event-date-pill-live">{t('进行中')}</span>
          ) : (
            <span className="event-date-pill">{e.date.slice(5, 7)}{t('月')}{e.date.slice(8, 10)}{t('日')} · {e.time.split('-')[0]}</span>
          )}
        </div>
        <div className="event-card-body-lg">
          <h3>{e.title}</h3>
          <div className="project-card-meta-line">
            {isEventRegistered(e.id) && <><span className="sub-mark">{t('已报名')}</span> · </>}
            {t(heroSector)}{proj && proj.stage ? ` · ${t(proj.stage)}` : ''}
          </div>
          <div className="event-meta">
            <span className="event-meta-loc">
              {e.type === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
              <span className="event-meta-loc-text">{e.type === 'online' ? t('线上会议') : e.location}</span>
            </span>
            {e.status === 'upcoming' && (
              <span className="event-register-count">
                {e.capacity == null
                  ? t('{} 人报名').replace('{}', e.registered)
                  : t('{}/{} 人报名').replace('{}', e.registered).replace('{}', e.capacity)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page events-page">
      <div className="market-sticky">
        <div className="market-header">
          <h1>{t('路演活动')}</h1>
          <div className="market-header-actions">
            <div className="type-dropdown" ref={typeRef}>
              <button
                className={`type-dropdown-btn${typeOpen ? ' open' : ''}`}
                onClick={() => setTypeOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={typeOpen}
              >
                <span className="type-dropdown-label">{t(currentTypeLabel)}</span>
                <ChevronDown size={14} className="type-dropdown-chevron" />
              </button>
              {typeOpen && (
                <div className="type-dropdown-menu" role="listbox">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`type-dropdown-menu-item${typeFilter === opt.value ? ' selected' : ''}`}
                      onClick={() => {
                        setTypeFilter(opt.value);
                        setTypeOpen(false);
                      }}
                      role="option"
                      aria-selected={typeFilter === opt.value}
                    >
                      <span>{t(opt.labelKey)}</span>
                      {typeFilter === opt.value && <Check size={14} className="check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isLoggedIn ? (
              <BusinessContact setToast={setToast} variant="text" isLoggedIn={isLoggedIn} />
            ) : (
              <button className="search-icon-btn" aria-label={t('搜索')} onClick={() => navigate('#search')}>
                <Search size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="segmented-control">
          <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>{t(eventStatusLabels.upcoming)}</button>
          <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>{t(eventStatusLabels.past)}</button>
        </div>
      </div>

      <div className="project-list">
        {tab === 'upcoming' ? (
          filterByType(upcoming).length > 0 ? (
            filterByType(upcoming).map(renderEvent)
          ) : (
            <div className="empty-state">{t('暂无符合条件的路演')}</div>
          )
        ) : (
          filterByType(past).length > 0 ? (
            filterByType(past).map(renderEvent)
          ) : (
            <div className="empty-state">{t('暂无符合条件的路演')}</div>
          )
        )}
      </div>

      <div className="list-end">— {t('到底了')} —</div>

    </div>
  );
}
