// ========== 项目列表组件 ==========

// 项目列表组件
function renderProjectList() {
  const raising = projects.filter(p => p.status === 'raising');
  const upcoming = projects.filter(p => p.status === 'upcoming');
  const closed = projects.filter(p => p.status === 'closed' || p.status === 'sold');
  
  // 渲染项目卡片
  function renderCard(p) {
    const mySub = subscriptions.find(s => s.projectId === p.id && s.investorNo === getInvestorNo(currentUser.id));
    return `
      <div class="card project-card">
        <div class="project-card-hero" style="background: ${getProjectHeroGradient(p.sector)}">
          ${p.coverImage ? (
            `<img class="project-card-hero-img" src="${p.coverImage}" alt="${p.title}"/>`
          ) : (
            `<span class="project-card-hero-icon">${getProjectHeroEmoji(p.sector)}</span>`
          )}
          <span class="card-status-badge ${p.status}">${projectStatusLabels[p.status]}</span>
        </div>
        <div class="project-card-body">
          <h3>${p.title}</h3>
          <div class="project-card-meta-line">
            ${mySub ? `<span class="sub-mark">已申购</span> · ` : ''}
            ${p.sector} · ${p.location}
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="market-sticky">
      <div class="market-header">
        <h1>项目市场</h1>
        <button class="search-icon-btn" aria-label="搜索">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
      <div class="segmented-control">
        <button class="active" onclick="window.switchProjectTab('active')">进行中</button>
        <button onclick="window.switchProjectTab('closed')">已结束</button>
      </div>
    </div>
    
    <div class="project-list" id="project-list-content">
      <div id="active-projects">
        ${raising.map(renderCard).join('')}
        ${upcoming.length > 0 ? `
          <div class="section-divider">即将上线</div>
          ${upcoming.map(renderCard).join('')}
        ` : ''}
        ${raising.length === 0 && upcoming.length === 0 ? (
          '<div class="empty-state">暂无进行中的项目</div>'
        ) : ''}
      </div>
      <div id="closed-projects" style="display: none;">
        ${closed.map(renderCard).join('')}
        ${closed.length === 0 ? '<div class="empty-state">暂无已结束的项目</div>' : ''}
      </div>
    </div>
    
    <div class="list-end">— 到底了 —</div>
  `;
}

// 切换项目Tab
function switchProjectTab(tab) {
  const activeProjects = document.getElementById('active-projects');
  const closedProjects = document.getElementById('closed-projects');
  const buttons = document.querySelectorAll('.segmented-control button');
  
  if (tab === 'active') {
    activeProjects.style.display = 'block';
    closedProjects.style.display = 'none';
    buttons[0].classList.add('active');
    buttons[1].classList.remove('active');
  } else {
    activeProjects.style.display = 'none';
    closedProjects.style.display = 'block';
    buttons[0].classList.remove('active');
    buttons[1].classList.add('active');
  }
}

// 绑定事件
function bindProjectListEvents() {
  window.switchProjectTab = switchProjectTab;
}
