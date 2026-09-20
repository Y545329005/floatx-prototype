// ===== 设计主题（2026-09-14 双皮肤）=====
// '' = 经典（默认，旧金融蓝）| 'hkbtc' = HKBTC 2.0（公司 Figma kit 换肤）
// 机制：CSS 变量作用域覆盖（styles.css :root[data-theme="hkbtc"]），无组件级差异
// - localStorage 'zhifu-theme' 持久化（Profile 页切换入口写入）
// - 首帧防闪：index.html 内联脚本在 React mount 前预设 data-theme
// - URL ?theme=hkbtc 或 #page?theme=hkbtc：一次性覆盖，不写 localStorage（复刻 ?visitor=1 模式）

export function getTheme() {
  try {
    return localStorage.getItem('zhifu-theme') === 'hkbtc' ? 'hkbtc' : '';
  } catch (e) { return ''; }
}

export function setTheme(theme) {
  const v = theme === 'hkbtc' ? 'hkbtc' : '';
  try {
    if (v) localStorage.setItem('zhifu-theme', v);
    else localStorage.removeItem('zhifu-theme');
  } catch (e) { /* 隐私模式 */ }
  if (v) document.documentElement.dataset.theme = v;
  else delete document.documentElement.dataset.theme;
}

// URL 参数一次性覆盖（模块加载即执行，早于首次 render）
(function applyThemeOverride() {
  const m = window.location.search.match(/[?&]theme=(hkbtc)(?=&|$)/)
    || window.location.hash.match(/[?&]theme=(hkbtc)(?=&|$)/);
  if (m) document.documentElement.dataset.theme = m[1];
})();
