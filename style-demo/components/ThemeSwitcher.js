// ========== 主题切换器组件 ==========

// 主题配置
export const themes = [
  {
    id: 'classic',
    name: '方案A：经典金融',
    description: '正蓝+深金，传统金融机构风格',
    color: '#005EB8',
  },
  {
    id: 'minimal',
    name: '方案B：现代极简',
    description: '科技紫蓝，Stripe/Linear风格',
    color: '#635BFF',
  },
  {
    id: 'luxury',
    name: '方案C：高端奢华',
    description: '深色+金色，Apple Pro风格',
    color: '#D4AF37',
  },
  {
    id: 'warm',
    name: '方案D：温暖人文',
    description: '温暖橙+深棕，Revolut风格',
    color: '#E67E22',
  },
];

// 获取当前主题
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'classic';
}

// 设置主题
export function setTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  // 保存到localStorage
  localStorage.setItem('style-demo-theme', themeId);
  // 更新切换器UI
  updateSwitcherUI(themeId);
}

// 更新切换器UI
function updateSwitcherUI(activeThemeId) {
  const buttons = document.querySelectorAll('.theme-switcher button');
  buttons.forEach(btn => {
    if (btn.dataset.theme === activeThemeId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 初始化主题
export function initTheme() {
  const savedTheme = localStorage.getItem('style-demo-theme') || 'classic';
  setTheme(savedTheme);
}

// 创建切换器HTML
export function createSwitcherHTML() {
  const currentTheme = getCurrentTheme();
  
  return `
    <div class="theme-switcher">
      ${themes.map(theme => `
        <button 
          data-theme="${theme.id}" 
          class="${theme.id === currentTheme ? 'active' : ''}"
          onclick="window.switchTheme('${theme.id}')"
          title="${theme.description}"
        >
          ${theme.name}
        </button>
      `).join('')}
    </div>
  `;
}

// 绑定切换器事件（在页面加载后调用）
export function bindSwitcherEvents() {
  window.switchTheme = function(themeId) {
    setTheme(themeId);
  };
}
