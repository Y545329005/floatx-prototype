(() => {
  'use strict';

  const root = document.getElementById('detail-root');
  const dataEl = document.getElementById('site-detail-data');
  if (!root || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const L = data.labels;
  const lang = document.documentElement.lang === 'en' ? 'en' : 'zh';
  const suffix = lang === 'en' ? '.en' : '';
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const tx = value => esc(value[lang]);

  const paramKey = L.kind === 'case' ? 'p' : 'id';
  const requested = new URLSearchParams(location.search).get(paramKey);
  const item = data.items.find(entry => entry.id === requested) || null;

  const caseMeta = cs => `${tx(cs.sector)} · ${tx(cs.stage)} · ${tx(cs.location)}`;

  const renderCase = entry => `
    <article class="detail-item">
      <header class="detail-hero">
        <p class="detail-meta">${caseMeta(entry)}</p>
        <h1>${esc(entry.name)}<span class="detail-flag">${esc(L.flag)}</span></h1>
      </header>
      ${entry.image ? `<figure class="detail-media"><img src="${esc(entry.image)}" alt="" width="1200" height="675"></figure>` : ''}
      <section class="detail-section"><h2>${esc(L.sections.about)}</h2>${entry.intro.map(p => `<p class="detail-prose">${tx(p)}</p>`).join('')}</section>
      <section class="detail-section"><h2>${esc(L.sections.highlights)}</h2><ul class="detail-list">${entry.highlights.map(h => `<li>${tx(h)}</li>`).join('')}</ul></section>
      ${entry.team.length ? `<section class="detail-section"><h2>${esc(L.sections.team)}</h2><div class="detail-team">${entry.team.map(m => `<div class="detail-team-row"><strong>${tx(m.name)}</strong><span class="detail-team-role">${esc(m.role)}</span><span class="detail-team-bg">${tx(m.bg)}</span></div>`).join('')}</div></section>` : ''}
      ${entry.linkedEvents.length ? `<section class="detail-section"><h2>${esc(L.sections.related)}</h2><ul class="detail-links">${entry.linkedEvents.map(e => `<li><a href="event${suffix}.html?id=${encodeURIComponent(e.id)}"><span class="detail-link-main"><time datetime="${esc(e.date)}">${tx(e.dateText)}</time><strong>${tx(e.title)}</strong></span><span class="detail-link-action">${esc(L.viewRelated)}</span></a></li>`).join('')}</ul></section>` : ''}
    </article>`;

  const renderEvent = entry => `
    <article class="detail-item">
      <header class="detail-hero">
        <p class="detail-meta"><time datetime="${esc(entry.date)}">${tx(entry.dateText)}</time></p>
        <h1>${tx(entry.title)}<span class="detail-flag">${esc(L.flag)}</span></h1>
      </header>
      <section class="detail-section"><h2>${esc(L.sections.summary)}</h2><p class="detail-prose">${tx(entry.summary)}</p></section>
      <section class="detail-section"><h2>${esc(L.sections.agenda)}</h2><ol class="detail-list detail-list--ordered">${entry.agenda.map(a => `<li>${tx(a)}</li>`).join('')}</ol></section>
      <section class="detail-section"><h2>${esc(L.sections.points)}</h2><ul class="detail-list">${entry.points.map(p => `<li>${tx(p)}</li>`).join('')}</ul></section>
      <section class="detail-section"><h2>${esc(L.sections.qa)}</h2><div class="detail-qa">${entry.qa.map(pair => `<div class="detail-qa-row"><p class="detail-q">${tx(pair.q)}</p><p class="detail-a">${tx(pair.a)}</p></div>`).join('')}</div></section>
      ${entry.linkedCases.length ? `<section class="detail-section"><h2>${esc(L.sections.related)}</h2><ul class="detail-links">${entry.linkedCases.map(cs => `<li><a href="case${suffix}.html?p=${encodeURIComponent(cs.id)}"><span class="detail-link-main"><strong>${esc(cs.name)}</strong><span class="detail-link-meta">${caseMeta(cs)}</span></span><span class="detail-link-action">${esc(L.viewRelated)}</span></a></li>`).join('')}</ul></section>` : ''}
    </article>`;

  const renderIndex = notFound => `
    <article class="detail-item">
      <header class="detail-hero">
        <p class="eyebrow">${esc(L.indexEyebrow)}</p>
        <h1>${esc(L.indexTitle)}</h1>
        ${notFound ? `<p class="detail-notfound">${esc(L.notFound)}</p>` : ''}
      </header>
      <p class="detail-prose detail-index-intro">${esc(L.indexIntro)}</p>
      <ul class="detail-links detail-index">${data.items.map(entry => {
        const href = L.kind === 'case' ? `case${suffix}.html?p=${encodeURIComponent(entry.id)}` : `event${suffix}.html?id=${encodeURIComponent(entry.id)}`;
        const main = L.kind === 'case'
          ? `<strong>${esc(entry.name)}</strong><span class="detail-link-meta">${caseMeta(entry)}</span>`
          : `<time datetime="${esc(entry.date)}">${tx(entry.dateText)}</time><strong>${tx(entry.title)}</strong>`;
        return `<li><a href="${href}"><span class="detail-link-main">${main}</span><span class="detail-link-action">${esc(L.viewDetails)}</span></a></li>`;
      }).join('')}</ul>
    </article>`;

  root.innerHTML = item ? (L.kind === 'case' ? renderCase(item) : renderEvent(item)) : renderIndex(Boolean(requested));
  if (item) document.title = `${item.name || item.title[lang]} | HighBlock Securities Limited`;

  // The language link is static at build time; carry the query parameter over at runtime.
  if (requested) {
    document.querySelectorAll('.language-link').forEach(link => {
      const base = link.getAttribute('href').split('?')[0];
      link.setAttribute('href', `${base}?${paramKey}=${encodeURIComponent(requested)}`);
    });
  }
})();
