(() => {
  document.querySelectorAll('[data-research-planes]').forEach(widget => {
    const tabs = [...widget.querySelectorAll('[data-concept-node]')];
    const panels = [...widget.querySelectorAll('[data-concept-panel]')];
    const marks = [...widget.querySelectorAll('[data-concept-mark]')];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const choose = index => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle('is-active', selected);
      });
      panels.forEach(panel => { panel.hidden = Number(panel.dataset.conceptPanel) !== index; });
      marks.forEach(mark => mark.classList.toggle('is-active', Number(mark.dataset.conceptMark) === index));
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => choose(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); choose(next); tabs[next].focus(); }
      });
    });
    widget.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return;
      const rect = widget.getBoundingClientRect();
      widget.style.setProperty('--pointer-x', String((event.clientX - rect.left) / rect.width * 2 - 1));
      widget.style.setProperty('--pointer-y', String((event.clientY - rect.top) / rect.height * 2 - 1));
    });
    const resetPointer = () => {
      widget.style.setProperty('--pointer-x', '0');
      widget.style.setProperty('--pointer-y', '0');
    };
    widget.addEventListener('pointerleave', resetPointer);
    reducedMotion.addEventListener('change', resetPointer);
    choose(0);
  });
})();
