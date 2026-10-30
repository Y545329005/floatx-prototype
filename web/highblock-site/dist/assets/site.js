(() => {
  'use strict';
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
  const legalPage = location.pathname.includes('/legal/');
  const legalInformationPage = document.body.dataset.page === 'compliance';
  const corporateNewsPage = ['news', 'news-licensing'].includes(document.body.dataset.page);
  const acceptedKey = 'highblock-disclaimer-20261028-v4';
  const words = window.HighBlockWebsiteNotice[isEnglish ? 'en' : 'zh'];
  const dialog = document.createElement('dialog');
  dialog.className = 'disclaimer-dialog';
  dialog.id = 'website-disclaimer';
  dialog.setAttribute('aria-labelledby', 'disclaimer-title');
  dialog.setAttribute('aria-describedby', 'disclaimer-intro');
  dialog.innerHTML = `<div class="disclaimer-content"><div class="disclaimer-heading"><img class="brand-symbol" src="${legalPage ? '../' : ''}assets/highblock-logo.svg" width="32" height="32" alt="" aria-hidden="true"><h2 id="disclaimer-title" tabindex="-1">${words.title}</h2><span class="utility-label">${words.label}</span><button type="button" class="disclaimer-language-top" data-dialog-language>${words.language}</button></div>${words.paragraphs.map((p, i) => `<p ${i === 0 ? 'id="disclaimer-intro"' : ''}>${p}</p>`).join('')}<div class="disclaimer-actions"><button type="button" class="button disclaimer-accept">${words.accept}</button></div></div>`;
  document.body.append(dialog);
  let previousFocus = null;
  let scene = null;
  let sceneVisible = true;
  const accept = dialog.querySelector('.disclaimer-accept');
  const syncScene = () => scene?.setPaused(!sceneVisible || dialog.open);
  const openNotice = () => {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    syncScene();
    dialog.querySelector('#disclaimer-title').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  };
  const hasAccepted = () => {
    try { return sessionStorage.getItem(acceptedKey) === 'acknowledged'; }
    catch { return false; }
  };
  accept.addEventListener('click', () => {
    try { sessionStorage.setItem(acceptedKey, 'acknowledged'); } catch { /* Current page can still be entered. */ }
    dialog.close();
    syncScene();
    if (previousFocus?.isConnected) previousFocus.focus();
  });
  dialog.addEventListener('cancel', e => { e.preventDefault(); });
  document.querySelectorAll('[data-open-disclaimer]').forEach(button => button.addEventListener('click', openNotice));
  dialog.querySelector('[data-dialog-language]').addEventListener('click', () => {
    const route = location.pathname.split('/').pop() || 'index.html';
    const target = route.endsWith('.html') ? route : route + '.html';
    const translated = isEnglish ? target.replace('.en.html', '.html') : target.replace('.html', '.en.html');
    location.href = translated + location.search + location.hash;
  });
  if (!legalPage && !legalInformationPage && !corporateNewsPage && !hasAccepted()) openNotice();
  const nav = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    nav?.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };
  menuToggle?.addEventListener('click', () => {
    const on = nav.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(on));
  });
  nav?.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.open && nav?.classList.contains('menu-open')) { closeMenu(); menuToggle.focus(); }
  });
  const updateHeader = () => nav?.classList.toggle('is-fixed', scrollY > 30);
  addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
  const container = document.getElementById('financial-background');
  if (container && window.FinancialMotionBackground) {
    try {
      scene = new window.FinancialMotionBackground(container);
      syncScene();
      const visibility = new IntersectionObserver(entries => {
        sceneVisible = entries[0].isIntersecting; syncScene();
      }, { threshold: 0.02 });
      visibility.observe(container);
      addEventListener('pagehide', event => {
        if (!event.persisted) { visibility.disconnect(); scene?.destroy(); }
      });
    } catch (error) {
      container.querySelector('canvas').hidden = true;
      console.error('Background unavailable; gradient fallback retained.', error);
    }
  }
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
  }
  document.querySelector('[data-contact-form]')?.addEventListener('submit', event => event.preventDefault());
})();
