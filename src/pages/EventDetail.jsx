import { useState } from 'react';
import { ArrowLeft, Calendar, Monitor, MapPin, TrendingUp, ChevronRight, X, Link2, Copy, Navigation, Users } from 'lucide-react';
import { events, projects, currentUser, getProjectHeroGradient, getProjectHeroEmoji, projectStageColors, projectStatusLabels, registerEvent, unregisterEvent, isEventRegistered, getEventRegistration, getCheckInCode, formatCurrency, formatDateCN, getProjectStageSlug, isEventLive, getCurrencySymbol } from '../mock/data';
import { useLang } from '../i18n';

export default function EventDetail({ id, navigate, goBack, setToast }) {
  const { t } = useLang();
  const event = events.find(e => e.id === id);
  const [isRegistered, setIsRegistered] = useState(() => isEventRegistered(id));
  const [showForm, setShowForm] = useState(false);
  const [regForm, setRegForm] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    consent: false,
    accompanying: 0, // 0-3 陪同人数
  });

  if (!event) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => goBack('#events')}><ArrowLeft size={20} /></button>
          <h1>{t('活动未找到')}</h1>
        </div>
      </div>
    );
  }

  const project = projects.find(p => p.id === event.projectId);
  const heroSector = project ? project.sector : event.projectName;
  const isPast = event.status === 'past';
  const isLive = isEventLive(event);
  const isOnline = event.type === 'online';
  const isOffline = event.type === 'offline';
  const hasCapacity = event.capacity != null;
  const myReg = isRegistered ? getEventRegistration(event.id) : null;
  const myPartySize = myReg ? 1 + (myReg.accompanying || 0) : 0;
  // 报名人数 = 名单派生（event.registered 已含当前用户报名），不再叠加 myPartySize（2026-08-12 口径统一）
  const shownRegistered = event.registered;
  const full = hasCapacity && shownRegistered >= event.capacity;
  const capPct = hasCapacity ? Math.min(100, Math.round((shownRegistered / event.capacity) * 100)) : 0;
  const canSubmit = regForm.name.trim() && regForm.phone.trim() && regForm.consent;
  const checkInCode = getCheckInCode(event.id, regForm.phone, regForm.accompanying);

  const openForm = () => {
    setRegForm({ name: currentUser.name, phone: currentUser.phone, email: currentUser.email, consent: false, accompanying: 0 });
    setShowForm(true);
  };

  const confirmRegister = () => {
    registerEvent(event.id, regForm.accompanying, regForm.phone, regForm.email); // 联系方式与表单一致（客户线索）
    setIsRegistered(true);
    setShowForm(false);
    setToast(isOffline && regForm.accompanying > 0
      ? t('报名成功，您已报名 {} 人（含本人 {} 人），届时请准时参加').replace('{}', String(regForm.accompanying + 1)).replace('{}', String(regForm.accompanying))
      : t('报名成功，届时请准时参加'));
  };

  const handleCancel = () => {
    unregisterEvent(event.id);
    setIsRegistered(false);
    setToast(t('已取消报名'));
  };

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(event.joinUrl);
      setToast(t('会议链接已复制，活动前 24 小时亦会短信提醒'));
    } catch {
      setToast(t('复制失败，请长按链接手动复制'));
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(event.location);
      setToast(t('地址已复制'));
    } catch {
      setToast(t('复制失败，请长按手动复制'));
    }
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  const copyStreamUrl = async () => {
    try {
      await navigator.clipboard.writeText(event.streamUrl);
      setToast(t('直播链接已复制'));
    } catch {
      setToast(t('复制失败，请长按手动复制'));
    }
  };

  return (
    <div className="page event-detail-page">
      <div className="detail-sticky">
        <div className="page-header no-margin">
          <button className="back-btn" onClick={() => goBack('#events')}><ArrowLeft size={20} /></button>
          <h1>{event.title}</h1>
        </div>
      </div>

      <div
        className="project-detail-hero"
        style={{ background: getProjectHeroGradient(heroSector) }}
      >
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="detail-hero-img"
          />
        ) : (
          <span className="project-detail-hero-icon">{getProjectHeroEmoji(heroSector)}</span>
        )}
        <div className="project-detail-hero-tags">
          <span className="tag tag-on-hero">
            {isOnline ? t('线上路演') : t('线下活动')}
          </span>
          {isLive && (
            <span className="tag tag-live tag-on-hero">
              {t('进行中')}
            </span>
          )}
          {!isLive && (
            <span className="tag tag-outline tag-on-hero">
              {isPast ? t('往期回顾') : t('即将开始')}
            </span>
          )}
        </div>
        <div className="project-detail-hero-company">{event.projectName}</div>
      </div>

      <div className="card">
        <div className="event-hero-date">
          <Calendar size={18} />
          <strong>{formatDateCN(event.date)}</strong>
          <span className="event-hero-time">{event.time}</span>
        </div>
        <div className="event-meta-grid">
          {isOnline ? (
            <>
              <div className="event-meta-cell">
                <span className="event-meta-label">{t('参与方式')}</span>
                <span className="event-meta-value">{t('线上会议')}</span>
              </div>
              <div className="event-meta-cell">
                <span className="event-meta-label">{t('报名')}</span>
                <span className="event-meta-value">{t('{} 人').replace('{}', shownRegistered)}</span>
              </div>
            </>
          ) : (
            <div className="event-meta-cell event-meta-cell-wide">
              <span className="event-meta-label">{t('地点')}</span>
              <div className="event-location-row">
                <span className="event-meta-value event-location-text">{event.location}</span>
                <div className="event-location-actions">
                  <button className="btn-icon" onClick={copyAddress} title={t('复制地址')}><Copy size={16} /></button>
                  <button className="btn-icon" onClick={openMaps} title={t('打开地图')}><Navigation size={16} /></button>
                </div>
              </div>
              {event.streamUrl && (
                <div className="event-stream-row">
                  <span className="event-meta-label">{t('直播')}</span>
                  <div className="event-stream-content">
                    <a href={event.streamUrl} target="_blank" rel="noopener noreferrer" className="event-stream-link">
                      {event.streamUrl}
                    </a>
                    <button className="btn-icon" onClick={copyStreamUrl} title={t('复制链接')}><Copy size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {hasCapacity && (
          <div className="capacity-row">
            <span className="capacity-reg">{t('已报 {}/{} 人').replace('{}', shownRegistered).replace('{}', event.capacity)}</span>
            <div className="capacity-bar">
              <div
                className={`capacity-fill ${full ? 'full' : ''}`}
                style={{ width: `${capPct}%` }}
              />
            </div>
            <span className={`capacity-text ${full ? 'full' : ''}`}>
              {full ? t('名额已满') : t('余 {} 位').replace('{}', event.capacity - shownRegistered)}
            </span>
          </div>
        )}
        {event.joinNote && (
          <div className="event-join-note">
            {isOnline ? <Monitor size={14} /> : <MapPin size={14} />}
            <span>{event.joinNote}</span>
          </div>
        )}
      </div>

      <div className="card card-secondary">
        <h3 className="card-title">{t('活动介绍')}</h3>
        <p className="text-body">{event.description}</p>
      </div>

      {event.agenda && event.agenda.length > 0 && (
        <div className="card card-secondary">
          <h3 className="card-title">{t('活动议程')}</h3>
          <div className="agenda-list">
            {event.agenda.map((a, i) => (
              <div key={i} className="agenda-item">
                <span className="agenda-time">{a.time}</span>
                <span className="agenda-topic">{a.topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.highlights && event.highlights.length > 0 && (
        <div className="card card-secondary">
          <h3 className="card-title">{t('活动看点')}</h3>
          <ul className="highlight-list">
            {event.highlights.map((h, i) => (
              <li key={i} className="highlight-item">
                <TrendingUp size={16} className="highlight-icon" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card-secondary">
        <h3 className="card-title">{t('主讲人')}</h3>
        <div className="speaker-card">
          <div className="speaker-avatar">{event.speaker[0]}</div>
          <div className="speaker-info">
            <strong>{event.speaker}</strong>
            {event.speakerBio && <p className="text-muted text-sm">{event.speakerBio}</p>}
          </div>
        </div>
      </div>

      {project && (
        <div className="card card-accent event-project-card" onClick={() => navigate(`#project/${project.id}`)}>
          <div className="event-project-top">
            <div>
              <div className="event-project-tags">
                <span className="tag tag-outline">{t(project.sector)}</span>
                <span className={`tag tag-stage-${getProjectStageSlug(project.stage)}`}>{t(project.stage)}</span>
              </div>
              <h4>{t('关于 {}').replace('{}', project.title)}</h4>
            </div>
            <ChevronRight size={18} className="event-project-arrow" />
          </div>
          {project.highlights && project.highlights[0] && (
            <p className="text-muted text-sm event-project-desc">{project.highlights[0]}</p>
          )}
          <div className="detail-stat-row event-project-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">{t('估值')}</span>
              <span className="detail-stat-value text-sm">{getCurrencySymbol(project.currency)} {formatCurrency(project.valuation)}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">{t('状态')}</span>
              <span className="detail-stat-value text-sm">{t(projectStatusLabels[project.status])}</span>
            </div>
          </div>
        </div>
      )}

      <div className="detail-actions">
        {isPast ? (
          <button className="btn btn-full" disabled>{t('活动已结束')}</button>
        ) : isRegistered ? (
          <div className="register-confirm">
            <div className="register-confirm-head">
              <span className="status-dot approved" />
              <strong>{t('已报名 · 席位已确认')}</strong>
            </div>
            <p className="text-muted text-sm">
              {formatDateCN(event.date)} {event.time} · {isOnline ? t('线上会议') : event.location}
              {isOffline && myReg && myReg.accompanying > 0 && (
                <span className="register-accompanying"> · {t('共 {} 人').replace('{}', String(1 + myReg.accompanying))}</span>
              )}
            </p>
            {isOnline && event.joinUrl ? (
              <div className="join-link">
                <Link2 size={16} />
                <span className="join-link-text">{event.joinUrl}</span>
                <button className="btn-icon" onClick={copyJoinLink} title={t('复制会议链接')}><Copy size={16} /></button>
              </div>
            ) : (
              <div className="check-in-code">
                <div>
                  <span className="check-in-label">{t('入场凭证码')}</span>
                  <strong className="check-in-value">{checkInCode}</strong>
                </div>
                <p className="text-muted text-sm">{t('活动现场请出示凭证码并凭报名手机号签到')}</p>
              </div>
            )}
            <button className="btn btn-outline btn-full" onClick={handleCancel}>{t('取消报名')}</button>
          </div>
        ) : full ? (
          <button className="btn btn-full" disabled>{t('名额已满')}</button>
        ) : (
          <button className="btn btn-primary btn-full" onClick={openForm}>{t('报名参加')}</button>
        )}
      </div>

      {showForm && (
        <div className="sheet-mask" onClick={() => setShowForm(false)} />
      )}
      {showForm && (
        <div className="sheet">
          <div className="sheet-header">
            <h3>{t('报名信息')}</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <p className="text-muted text-sm sheet-sub">{event.title}</p>
          <div className="form-group">
            <label>{t('姓名')}</label>
            <input
              className="form-input"
              value={regForm.name}
              onChange={e => setRegForm({ ...regForm, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>{t('手机')}</label>
            <input
              className="form-input"
              value={regForm.phone}
              onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>{t('邮箱')}</label>
            <input
              className="form-input"
              value={regForm.email}
              onChange={e => setRegForm({ ...regForm, email: e.target.value })}
            />
          </div>
          {isOffline && (
            <div className="form-group">
              <label>{t('陪同人员')}</label>
              <div className="accompanying-selector">
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`accompanying-btn ${regForm.accompanying === n ? 'active' : ''}`}
                    onClick={() => setRegForm({ ...regForm, accompanying: n })}
                  >
                    {n === 0 ? t('仅本人') : `+${n} ${t('人')}`}
                  </button>
                ))}
              </div>
              <p className="text-muted text-xs accompanying-hint">{t('线下活动最多可携带 3 人同行')}</p>
            </div>
          )}
          <label className="form-checkbox-group">
            <input
              type="checkbox"
              checked={regForm.consent}
              onChange={e => setRegForm({ ...regForm, consent: e.target.checked })}
            />
            <span>{t('我同意接收活动通知及会议链接')}</span>
          </label>
          <button className="btn btn-primary btn-full sheet-submit" disabled={!canSubmit} onClick={confirmRegister}>
            {t('确认报名')}
          </button>
        </div>
      )}
    </div>
  );
}
