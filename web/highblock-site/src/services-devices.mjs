// Native, bilingual recreation of the original white App previews.
const icon = (name) => {
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M8 3v5M16 3v5M4 10h16"/>',
    case: '<rect x="3.5" y="7" width="17" height="14" rx="2"/><path d="M9 7V4h6v3M9 7v14M15 7v14"/>',
    person: '<circle cx="12" cy="7" r="3.5"/><path d="M5.5 21v-2.5a6.5 6.5 0 0 1 13 0V21"/>',
    screen: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M9 21h6M12 17v4"/>',
    chevron: '<path d="m7 10 5 5 5-5"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
};

function bottomNav(t, active) {
  return `<div class="app-preview-bottom" aria-hidden="true"><span class="${active === 'roadshow' ? 'is-selected' : ''}">${icon('calendar')}<span>${t.roadshows}</span></span><span class="${active === 'projects' ? 'is-selected' : ''}">${icon('case')}<span>${t.projects}</span></span><span>${icon('person')}<span>${t.mine}</span></span></div>`;
}

function projectCard(image, name, meta, t) {
  return `<article class="app-preview-card app-preview-project"><div class="app-preview-photo"><img src="assets/services-original/${image}" alt="${meta}" width="1200" height="675" loading="eager"><span class="app-preview-image-label">${t.details}</span></div><div class="app-preview-card-copy"><h4>${name}</h4><p>${meta}</p></div></article>`;
}

function roadshowCard(image, title, meta, t, second = false) {
  return `<article class="app-preview-card app-preview-event"><div class="app-preview-photo"><img src="assets/services-original/${image}" alt="" width="1200" height="675" loading="eager"><span class="app-preview-image-label${second ? ' is-soft' : ''}">${second ? t.coming : t.onlineRoadshow}</span></div><div class="app-preview-card-copy"><h4>${title}</h4><p>${meta}</p><div class="app-preview-event-meta">${icon('screen')}<span>${t.online}</span><span>${t.example}</span></div></div></article>`;
}

export function serviceDevices(lang) {
  const english = lang === 'en';
  const t = english ? {
    projects: 'Projects', roadshows: 'Events', mine: 'My account', all: 'All events', active: 'Ongoing', ended: 'Completed', upcoming: 'Upcoming', past: 'Past events',
    details: 'View details', demo: 'Interface and project information are illustrative', coming: 'Coming soon', onlineRoadshow: 'Online roadshow', online: 'Online meeting', example: 'Illustrative',
    marketLabel: 'Illustrative project market interface', eventLabel: 'Illustrative roadshow interface', tabLabel: 'Illustrative project status',
    endedTitle: 'Completed projects', endedText: 'No project examples are displayed here',
    quantum: 'Quantum computing · Hong Kong', biotech: 'Biotechnology · Shenzhen', robot: 'Robotics · Greater China',
    eventOne: 'QuantumCore online roadshow — the path to commercial quantum computing', eventTwo: 'BioNova clinical data briefing',
    eventOneMeta: 'Quantum computing · Series C', eventTwoMeta: 'Biotechnology · Series C+'
  } : {
    projects: '項目市場', roadshows: '路演活動', mine: '我的', all: '全部活動', active: '進行中', ended: '已結束', upcoming: '即將開始', past: '往期回顧',
    details: '了解詳情', demo: '界面及項目資料僅作示意', coming: '即將公佈', onlineRoadshow: '線上路演', online: '線上會議', example: '活動示意',
    marketLabel: '項目市場界面示意', eventLabel: '路演活動界面示意', tabLabel: '示意項目狀態',
    endedTitle: '已結束項目', endedText: '界面示意，暫不展示項目資料',
    quantum: '量子計算 · 香港', biotech: '生物醫藥 · 深圳', robot: '智能機器人 · 大中華區',
    eventOne: 'QuantumCore 線上路演 — 量子計算的商業化路徑', eventTwo: 'BioNova 臨床數據解讀會',
    eventOneMeta: '量子計算 · C 輪', eventTwoMeta: '生物醫藥 · C+ 輪'
  };

  return `<div class="app-preview-stage${english ? ' is-english' : ''}" aria-label="${english ? 'HighBlock App interface previews' : 'HighBlock App 界面預覽'}">
    <div class="app-preview-ground" aria-hidden="true"></div>
    <div class="app-preview-panel is-roadshow" role="group" aria-label="${t.eventLabel}">
      <div class="app-preview-head"><div class="app-preview-title-row"><h3>${t.roadshows}</h3><span class="app-preview-filter" aria-hidden="true">${t.all}${icon('chevron')}</span><span class="app-preview-search" aria-hidden="true">${icon('search')}</span></div><div class="app-preview-tabs is-visual" aria-hidden="true"><span class="is-selected">${t.upcoming}</span><span>${t.past}</span></div></div>
      <div class="app-preview-list is-roadshow-list"><p class="app-preview-demo">${t.demo}</p>${roadshowCard('e1-quantum-roadshow.jpg', t.eventOne, t.eventOneMeta, t)}${roadshowCard('e2-biotech-clinical.jpg', t.eventTwo, t.eventTwoMeta, t, true)}</div>
      ${bottomNav(t, 'roadshow')}
    </div>
    <div class="app-preview-panel is-projects" role="group" aria-label="${t.marketLabel}" data-project-tabs>
      <div class="app-preview-head"><div class="app-preview-title-row"><h3>${t.projects}</h3><span class="app-preview-search" aria-hidden="true">${icon('search')}</span></div><div class="app-preview-tabs" role="tablist" aria-label="${t.tabLabel}"><button type="button" role="tab" id="services-tab-active" data-project-tab="active" aria-selected="true" aria-controls="services-panel-active" tabindex="0">${t.active}</button><button type="button" role="tab" id="services-tab-ended" data-project-tab="ended" aria-selected="false" aria-controls="services-panel-ended" tabindex="-1">${t.ended}</button></div></div>
      <div class="app-preview-list" id="services-panel-active" role="tabpanel" aria-labelledby="services-tab-active" tabindex="0"><p class="app-preview-demo">${t.demo}</p>${projectCard('p1-quantum.jpg', 'QuantumCore Technologies', t.quantum, t)}${projectCard('p2-biotech.jpg', 'BioNova Therapeutics', t.biotech, t)}${projectCard('p3-robot.jpg', 'RoboFlow', t.robot, t)}</div>
      <div class="app-preview-list" id="services-panel-ended" role="tabpanel" aria-labelledby="services-tab-ended" tabindex="0" hidden><p class="app-preview-demo">${t.demo}</p><div class="app-preview-empty">${icon('case')}<h4>${t.endedTitle}</h4><p>${t.endedText}</p></div></div>
      ${bottomNav(t, 'projects')}
    </div>
  </div>`;
}
