// ========== 项目详情组件 ==========

// 项目详情组件
function renderProjectDetail(projectId) {
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return `
      <div class="page-header">
        <button class="back-btn" onclick="window.showProjectList()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>项目未找到</h1>
      </div>
    `;
  }
  
  const investorRoster = getInvestorRoster(project);
  const f = project.financials || {};
  
  return `
    <div class="detail-sticky">
      <div class="page-header no-margin">
        <button class="back-btn" onclick="window.showProjectList()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>${project.title}</h1>
        <span class="detail-header-badge status-${project.status}">${projectStatusLabels[project.status]}</span>
      </div>
    </div>
    
    <div class="project-detail-hero" style="background: ${getProjectHeroGradient(project.sector)}">
      ${project.coverImage ? (
        `<img src="${project.coverImage}" alt="${project.title}" class="detail-hero-img"/>`
      ) : (
        `<span class="project-detail-hero-icon">${getProjectHeroEmoji(project.sector)}</span>`
      )}
      <div class="project-detail-hero-tags">
        <span class="tag tag-stage-${getProjectStageSlug(project.stage)}">${project.stage}</span>
        <span class="tag tag-outline tag-on-hero">${project.sector}</span>
      </div>
      <div class="project-detail-hero-company">${project.company}</div>
    </div>
    
    <div class="card card-accent">
      <div class="detail-stat-row">
        <div class="detail-stat">
          <span class="detail-stat-label">总部</span>
          <span class="detail-stat-value">${project.location}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">融资阶段</span>
          <span class="detail-stat-value">${project.stage}</span>
        </div>
      </div>
      <div class="detail-stat-row">
        <div class="detail-stat">
          <span class="detail-stat-label">上市计划</span>
          <span class="detail-stat-value text-sm">${project.ipoPlan}</span>
        </div>
      </div>
      ${project.status === 'raising' ? `
        <div class="detail-stat-row">
          <div class="detail-stat">
            <span class="detail-stat-label">意向收集截止</span>
            <span class="detail-stat-value">${project.intentDeadline || '以平台沟通为准'}</span>
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="card card-secondary">
      <div class="card-title">本轮情况</div>
      <div class="round-note">
        <p class="round-note-text">${project.roundNote}</p>
      </div>
    </div>
    
    ${investorRoster.length > 0 ? `
      <div class="card card-secondary">
        <div class="card-header">
          <div class="card-title">申购热度</div>
          <span class="heat-count">${investorRoster.length} 位投资人已提交意向</span>
        </div>
        <div class="heat-list">
          <div class="heat-row heat-head-row">
            <span class="heat-head-label">投资人</span>
            <span class="heat-head-label">提交时间</span>
          </div>
          ${investorRoster.slice(-5).reverse().map(r => `
            <div class="heat-row ${r.investorNo === getInvestorNo(currentUser.id) ? 'is-me' : ''}">
              <span class="heat-investor">
                ${r.investorNo}
                ${r.investorNo === getInvestorNo(currentUser.id) ? '<em class="heat-me-tag">我</em>' : ''}
              </span>
              <span class="text-muted text-sm">${r.createdAt.split(' ')[0]}</span>
            </div>
          `).join('')}
        </div>
        <button class="heat-view-all">
          <span>查看全部 ${investorRoster.length} 位提交</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    ` : ''}
    
    <div class="card card-secondary">
      <div class="card-title">项目亮点</div>
      <ul class="highlight-list">
        ${project.highlights.map(h => `
          <li class="highlight-item">
            <svg class="highlight-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 6l-9.5 9.5-5-5L1 18"/>
              <path d="M17 6h6v6"/>
            </svg>
            <span>${h}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    
    <div class="card card-secondary">
      <div class="card-title">项目简介</div>
      <p class="text-body">${project.description}</p>
    </div>
    
    ${(f.revenue !== undefined || f.burnRate !== undefined || f.grossMargin !== null && f.grossMargin !== undefined) ? `
      <div class="card card-secondary">
        <div class="card-title">财务概览</div>
        <div class="detail-stat-row">
          <div class="detail-stat">
            <span class="detail-stat-label">营收</span>
            <span class="detail-stat-value text-sm">${f.revenue ? `${getCurrencySymbol(project.currency)} ${formatCurrency(f.revenue)}` : '尚未产生收入'}</span>
          </div>
          ${f.burnRate !== undefined ? `
            <div class="detail-stat">
              <span class="detail-stat-label">月净烧钱</span>
              <span class="detail-stat-value text-sm">${getCurrencySymbol(project.currency)} ${formatCurrency(f.burnRate)}</span>
            </div>
          ` : ''}
          ${f.grossMargin != null ? `
            <div class="detail-stat">
              <span class="detail-stat-label">毛利率</span>
              <span class="detail-stat-value text-sm">${f.grossMargin}</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}
    
    ${project.team && project.team.length > 0 ? `
      <div class="card card-secondary">
        <div class="card-title">核心团队</div>
        ${project.team.map(m => `
          <div class="team-member">
            <div class="team-member-avatar">${m.name[0]}</div>
            <div class="team-member-info">
              <strong>${m.name}</strong>
              <span class="text-muted text-sm">${m.role}</span>
              <p class="text-muted text-sm">${m.bg}</p>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${project.documents && project.documents.length > 0 ? `
      <div class="card card-secondary">
        <div class="card-title">相关文档</div>
        ${project.documents.map(doc => `
          <a class="doc-item" href="${doc.url}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>${doc.name}</span>
          </a>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="detail-actions">
      <button class="btn btn-primary btn-lg" style="width: 100%;">
        ${project.status === 'raising' ? '提交意向' : project.status === 'upcoming' ? '即将开放' : '已结束'}
      </button>
    </div>
  `;
}
