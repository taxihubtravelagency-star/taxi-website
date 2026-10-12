'use strict';

/* UI enhancements. Everything here is progressive: without JavaScript the page still shows all content. */

// 1 ─ Scroll progress: a small taxi drives along a lane under the header ──────────────
(() => {
  const bar = document.createElement('div');
  bar.className = 'road-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<i></i><svg viewBox="0 0 34 14"><rect x="1" y="6" width="32" height="5" rx="2.5" fill="#ffc20e"/><path d="M8 6l3-4.5h12L27 6z" fill="#ffc20e"/><path d="M11 5.5l2-3h4v3zM19 5.5v-3h3.5l2 3z" fill="#15171b"/><circle cx="9" cy="11.2" r="2.4" fill="#15171b"/><circle cx="25" cy="11.2" r="2.4" fill="#15171b"/></svg>`;
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

// 2 ─ Mark the current page in the main navigation ────────────────────────────────────
(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.primary-nav a').forEach(link => {
    const target = link.getAttribute('href').split('#')[0];
    const isHomeLink = target === 'index.html' && !link.getAttribute('href').includes('#services');
    if ((page === 'index.html' || page === '') ? isHomeLink : target === page) link.setAttribute('aria-current', 'page');
  });
})();

// 3 ─ Keep hero facts in sync with the real content on the page ───────────────────────
(() => {
  const counts = {
    destinations: document.querySelectorAll('.destination-card').length,
    routes: document.querySelectorAll('.route-card').length,
    vehicles: document.querySelectorAll('.fleet-card').length
  };
  document.querySelectorAll('[data-count]').forEach(el => {
    const n = counts[el.dataset.count];
    if (n) el.textContent = n;
  });
})();

// 4 ─ Long card lists: show the first few, reveal the rest on request ─────────────────
(() => {
  const lists = [
    { selector: '.destination-grid', noun: 'destinations' },
    { selector: '.package-grid', noun: 'packages' },
    { selector: '.route-grid', noun: 'routes' }
  ];
  lists.forEach(({ selector, noun }) => {
    const grid = document.querySelector(selector);
    if (!grid || grid.children.length < 7) return;
    const total = grid.children.length;
    grid.classList.add('is-collapsed');
    const wrap = document.createElement('div');
    wrap.className = 'list-toggle-wrap';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-toggle';
    button.setAttribute('aria-expanded', 'false');
    if (!grid.id) grid.id = `${noun}-grid`;
    button.setAttribute('aria-controls', grid.id);
    const label = expanded => `${expanded ? 'Show fewer' : `Show all ${total}`} ${noun}`;
    button.textContent = label(false);
    button.addEventListener('click', () => {
      const expanded = grid.classList.toggle('is-collapsed') === false;
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = label(expanded);
      if (!expanded) grid.closest('section')?.scrollIntoView({ block: 'start' });
    });
    wrap.appendChild(button);
    const actions = grid.nextElementSibling?.classList.contains('center-actions') ? grid.nextElementSibling : null;
    if (actions) actions.prepend(button); else grid.after(wrap);
  });
})();

// 5 ─ Fare tables: one route at a time, chosen with tabs ──────────────────────────────
(() => {
  const list = document.querySelector('.fare-list');
  if (!list) return;
  const cards = [...list.querySelectorAll(':scope > .fare-route-card')];
  if (cards.length < 2) return;

  const tabs = document.createElement('div');
  tabs.className = 'fare-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Choose a route to see fares');

  const select = (index, focus = false) => {
    cards.forEach((card, i) => {
      const active = i === index;
      card.hidden = !active;
      card.classList.toggle('is-shown', active);
      const tab = tabs.children[i];
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
  };

  cards.forEach((card, i) => {
    const title = card.querySelector('h3')?.textContent.trim() || `Route ${i + 1}`;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'fare-tab';
    tab.setAttribute('role', 'tab');
    tab.id = `fare-tab-${i}`;
    tab.textContent = title.replace(/^Haldwani to\s+/i, '');
    tab.title = title;
    card.setAttribute('role', 'tabpanel');
    card.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (dir) { event.preventDefault(); select((i + dir + cards.length) % cards.length, true); }
      if (event.key === 'Home') { event.preventDefault(); select(0, true); }
      if (event.key === 'End') { event.preventDefault(); select(cards.length - 1, true); }
    });
    tabs.appendChild(tab);
  });

  list.before(tabs);
  select(0);
})();
