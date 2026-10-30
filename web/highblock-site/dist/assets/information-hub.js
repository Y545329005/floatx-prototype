(() => {
  'use strict';

  const hub = document.querySelector('.information-hub');
  const tablist = hub?.querySelector('[data-information-tabs]');
  if (!hub || !tablist) return;

  const tabs = Array.from(tablist.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(hub.querySelectorAll('[data-information-panel]'));
  const panelById = new Map(panels.map(panel => [panel.id, panel]));
  if (!tabs.length || tabs.some(tab => !panelById.has(tab.hash.slice(1)))) return;

  const languageLinks = Array.from(document.querySelectorAll('.language-link')).map(link => ({
    link,
    base: link.getAttribute('href').split('#')[0]
  }));
  const media = window.matchMedia('(max-width: 780px)');
  const defaultId = 'licensing';
  let selectedId = defaultId;

  const idFromHash = () => {
    const id = location.hash.slice(1);
    return panelById.has(id) ? id : defaultId;
  };
  const select = (id, { updateHistory = false, moveFocus = false } = {}) => {
    if (!panelById.has(id)) return;
    const followFocus = moveFocus || tablist.contains(document.activeElement) ||
      panels.some(panel => panel.id !== id && panel.contains(document.activeElement));
    selectedId = id;
    tabs.forEach(tab => {
      const selected = tab.hash === `#${id}`;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && followFocus) tab.focus({ preventScroll: true });
    });
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    languageLinks.forEach(({ link, base }) => { link.setAttribute('href', `${base}#${id}`); });
    if (updateHistory && location.hash !== `#${id}`) {
      history.pushState(null, '', `${location.pathname}${location.search}#${id}`);
    }
  };

  tablist.setAttribute('role', 'tablist');
  const updateOrientation = () => tablist.setAttribute('aria-orientation', media.matches ? 'horizontal' : 'vertical');
  updateOrientation();
  media.addEventListener('change', updateOrientation);

  tabs.forEach(tab => {
    const id = tab.hash.slice(1);
    const panel = panelById.get(id);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;

    tab.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(id, { updateHistory: true });
    });
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let nextIndex;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else if (event.key === ' ') nextIndex = index;
      else return;
      event.preventDefault();
      select(tabs[nextIndex].hash.slice(1), { updateHistory: true, moveFocus: true });
    });
  });

  const syncHistory = () => {
    const id = idFromHash();
    if (id !== selectedId) select(id);
  };
  window.addEventListener('hashchange', syncHistory);
  window.addEventListener('popstate', syncHistory);
  select(idFromHash());
  hub.setAttribute('data-tabs-ready', '');
})();
