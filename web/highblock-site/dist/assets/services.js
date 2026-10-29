/* Project examples belong only to the services-page preview. */
(() => {
  'use strict';

  function initialiseProjectPreviews() {
    document.querySelectorAll('.services-page [data-project-tabs]').forEach((preview) => {
      const tabs = Array.from(preview.querySelectorAll('[data-project-tab]'));
      if (!tabs.length) return;

      function selectTab(nextTab, moveFocus) {
        tabs.forEach((tab) => {
          const selected = tab === nextTab;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          const panelId = tab.getAttribute('aria-controls');
          const panel = panelId ? document.getElementById(panelId) : null;
          if (panel && preview.contains(panel)) panel.hidden = !selected;
        });
        if (moveFocus) nextTab.focus();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectTab(tab, false));
        tab.addEventListener('keydown', (event) => {
          let nextIndex;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = tabs.length - 1;
          else return;
          event.preventDefault();
          selectTab(tabs[nextIndex], true);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseProjectPreviews, { once: true });
  } else {
    initialiseProjectPreviews();
  }
})();
