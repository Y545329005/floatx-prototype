// ========== 资产总览组件 ==========

// 资产总览组件
function renderAssetOverview() {
  const latestTotal = assetHistory[assetHistory.length - 1].total;
  
  // 计算本月净入金
  const monthInflow = 500000; // Mock数据
  
  // 计算持仓
  const holdingsValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const holdingsCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalPnl = holdingsValue - holdingsCost;
  const pnlPct = holdingsCost > 0 ? (totalPnl / holdingsCost * 100).toFixed(1) : '0.0';
  
  const sign = up => (up ? '+' : '-');
  
  // 生成迷你趋势图
  const sparkW = 340;
  const sparkH = 38;
  const sparkPad = 4;
  const sparkMax = Math.max(...assetHistory.map(a => a.total));
  const sparkMin = Math.min(...assetHistory.map(a => a.total));
  const sparkSpan = sparkMax - sparkMin || 1;
  const sparkPts = assetHistory.map((a, i) => {
    const x = (sparkW - sparkPad * 2) * (i / (assetHistory.length - 1)) + sparkPad;
    const y = sparkH - sparkPad - ((a.total - sparkMin) / sparkSpan) * (sparkH - sparkPad * 2);
    return { x, y };
  });
  const sparkStr = sparkPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const sparkArea = `${sparkPts[0].x.toFixed(1)},${sparkH} ${sparkStr} ${sparkPts[sparkPts.length - 1].x.toFixed(1)},${sparkH}`;
  
  return `
    <div class="asset-hero-card">
      <div class="asset-hero-head">
        <span class="asset-hero-label">总资产（折合 HKD）</span>
        <button class="asset-hero-more">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      <div class="asset-hero-main">
        <div class="asset-hero-value">${formatCurrency(latestTotal)}</div>
        <div class="asset-hero-spark">
          <svg viewBox="0 0 ${sparkW} ${sparkH}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="assetSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fff" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#fff" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <polygon points="${sparkArea}" fill="url(#assetSparkFill)"/>
            <polyline points="${sparkStr}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="asset-hero-change">
        <span class="${monthInflow >= 0 ? 'up' : 'down'}">
          本月净入金 ${formatCurrency(Math.abs(monthInflow))}
        </span>
      </div>
      <div class="asset-hero-stats">
        <div>
          <span>可用资金</span>
          <strong>${formatCurrency(currentUser.account.hkd)}</strong>
        </div>
        <div>
          <span>持仓市值</span>
          <strong>${formatCurrency(holdingsValue)}</strong>
        </div>
        <div>
          <span>冻结资金</span>
          <strong>${formatCurrency(currentUser.account.frozen)}</strong>
        </div>
      </div>
    </div>
    
    <div class="asset-actions">
      <button class="asset-action">
        <span class="asset-action-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </span>
        <span>钱包</span>
      </button>
      <button class="asset-action">
        <span class="asset-action-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </span>
        <span>申购记录</span>
      </button>
      <button class="asset-action">
        <span class="asset-action-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
            <path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
        </span>
        <span>基金</span>
      </button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title no-margin">持仓概览</h3>
        <button class="text-btn link-btn">
          查看全部
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      ${holdings.length === 0 ? (
        '<p class="text-muted text-sm">暂无持仓</p>'
      ) : `
        <div class="position-summary">
          <div>
            <span>持仓市值</span>
            <strong>HK$ ${formatCurrency(holdingsValue)}</strong>
          </div>
          <div>
            <span>估值变动（按最新轮）</span>
            <strong class="${totalPnl >= 0 ? 'up' : 'down'}">
              ${sign(totalPnl >= 0)}HK$ ${formatCurrency(Math.abs(totalPnl))}（${sign(totalPnl >= 0)}${pnlPct}%）
            </strong>
          </div>
        </div>
        <div class="holding-preview-list">
          ${holdings.map(h => `
            <div class="holding-preview-row">
              <div class="holding-preview-name">
                <span class="holding-preview-dot">${h.projectName[0]}</span>
                <span>${h.projectName}</span>
              </div>
              <div class="holding-preview-right">
                <strong>HK$ ${formatCurrency(h.currentValue)}</strong>
                <span class="${h.return >= 0 ? 'up' : 'down'}">${h.return >= 0 ? '+' : ''}${h.return}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}
