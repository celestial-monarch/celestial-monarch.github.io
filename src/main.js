import '@fontsource-variable/inter';
import '@fontsource/instrument-serif';
import './style.css';
import content from './generated/content.json';

const { site, cv, sections } = content;

// ---------- small helpers ----------

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Links still holding the placeholder text (or left empty) are hidden instead of shown broken.
const isRealLink = (url) => typeof url === 'string' && /^https?:\/\//.test(url) && !/REPLACE/i.test(url);

const pad = (n) => String(n).padStart(2, '0');

const icon = {
  download:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" /></svg>',
  arrowUpRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8.5 7H17v8.5" /></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true" class="fill"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.06c.53-1.01 1.84-2.07 3.79-2.07 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.92 1.3-1.92 2.63V21h-4V9.75Z"/></svg>',
  drive:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3.5h7l6 10.5-3.5 6H6L2.5 14l6-10.5Zm0 0L15 14.5M15.5 3.5 9 14.5m-6.5-.5h19" /></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>',
};

function setFavicon(name) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171615"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-size="28" fill="#f3f1ec">${initials}</text></svg>`;
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.append(link);
}

// ---------- page ----------

function actionLinks({ compact = false } = {}) {
  const links = [];
  if (cv) {
    links.push(
      `<a class="btn btn-solid" href="${esc(cv)}" target="_blank" rel="noopener">${icon.download}<span>${esc(site.cvLabel || 'Download CV')}</span></a>`,
    );
  }
  if (isRealLink(site.linkedin)) {
    links.push(
      `<a class="btn" href="${esc(site.linkedin)}" target="_blank" rel="noopener">${icon.linkedin}<span>LinkedIn</span></a>`,
    );
  }
  if (!compact && isRealLink(site.googleDrive)) {
    links.push(
      `<a class="btn" href="${esc(site.googleDrive)}" target="_blank" rel="noopener">${icon.drive}<span>${esc(site.googleDriveLabel || 'Google Drive')}</span></a>`,
    );
  }
  return links.join('');
}

function render() {
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const year = new Date().getFullYear();

  document.getElementById('app').innerHTML = `
    <header class="topbar">
      <a class="brand" href="#top">${esc(site.name)}</a>
      <nav class="topnav" aria-label="Sections">
        ${sections.map((s) => `<a href="#${s.id}" data-nav="${s.id}">${esc(s.title)}</a>`).join('')}
      </nav>
      <div class="topbar-actions">${actionLinks({ compact: true })}</div>
    </header>

    <main id="top">
      <section class="hero">
        <p class="eyebrow">${esc(site.role)}</p>
        <h1 class="hero-name">${esc(site.name)}</h1>
        <div class="hero-foot">
          <p class="hero-intro">${esc(site.intro)}</p>
          <div class="hero-actions">${actionLinks()}</div>
        </div>
        <ol class="hero-index">
          ${sections
            .map(
              (s, i) => `
            <li><a href="#${s.id}">
              <span class="idx">${pad(i + 1)}</span>
              <span class="idx-title">${esc(s.title)}</span>
              <span class="idx-count">${s.items.length}</span>
            </a></li>`,
            )
            .join('')}
        </ol>
      </section>

      ${sections
        .map(
          (s, i) => `
        <section class="work" id="${s.id}" aria-labelledby="${s.id}-title">
          <header class="work-head">
            <span class="work-num">${pad(i + 1)}</span>
            <h2 id="${s.id}-title">${esc(s.title)}</h2>
            ${s.description ? `<p class="work-desc">${esc(s.description)}</p>` : ''}
            <span class="work-count">${s.items.length} ${s.items.length === 1 ? 'work' : 'works'}</span>
          </header>
          <div class="grid" data-section="${i}"></div>
        </section>`,
        )
        .join('')}
    </main>

    <footer class="footer">
      <div class="footer-cta">
        <p class="footer-kicker">Let’s work together</p>
        <p class="footer-name">${esc(site.name)}</p>
        <div class="hero-actions">${actionLinks()}</div>
      </div>
      <p class="footer-meta">© ${year} ${esc(site.name)} · ${total} works</p>
    </footer>

    <dialog class="lightbox" aria-label="Image viewer">
      <div class="lb-stage">
        <img class="lb-img" alt="" />
      </div>
      <button class="lb-btn lb-close" type="button" aria-label="Close">${icon.close}</button>
      <button class="lb-btn lb-prev" type="button" aria-label="Previous image">${icon.prev}</button>
      <button class="lb-btn lb-next" type="button" aria-label="Next image">${icon.next}</button>
      <div class="lb-info">
        <div>
          <p class="lb-title"></p>
          <p class="lb-caption"></p>
        </div>
        <p class="lb-count"></p>
      </div>
    </dialog>
  `;
}

// ---------- masonry grid (keeps reading order left-to-right) ----------

const grids = [];

function columnCount() {
  const w = window.innerWidth;
  return w < 560 ? 1 : w < 1024 ? 2 : 3;
}

function buildGrids() {
  document.querySelectorAll('.grid').forEach((el) => {
    const sectionIndex = Number(el.dataset.section);
    const cards = sections[sectionIndex].items.map((item, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.style.setProperty('--ar', `${item.width} / ${item.height}`);
      card.style.setProperty('--ph', item.color);
      card.setAttribute('aria-label', `View ${item.title}`);
      card.innerHTML = `
        <img src="${esc(item.thumb)}" width="${item.width}" height="${item.height}" alt="${esc(item.title)}" loading="lazy" decoding="async" />
        <span class="card-title">${esc(item.title)}</span>`;
      const img = card.querySelector('img');
      const done = () => card.classList.add('is-loaded');
      if (img.complete) done();
      else img.addEventListener('load', done, { once: true });
      card.addEventListener('click', () => openLightbox(sectionIndex, i));
      return card;
    });
    grids.push({ el, sectionIndex, cards, cols: 0 });
  });
  layoutGrids();
}

function layoutGrids() {
  const cols = columnCount();
  for (const grid of grids) {
    if (grid.cols === cols) continue;
    grid.cols = cols;
    const columns = Array.from({ length: cols }, () => {
      const c = document.createElement('div');
      c.className = 'grid-col';
      return c;
    });
    const heights = new Array(cols).fill(0);
    sections[grid.sectionIndex].items.forEach((item, i) => {
      // Place each image in the currently shortest column.
      const target = heights.indexOf(Math.min(...heights));
      columns[target].append(grid.cards[i]);
      heights[target] += item.height / item.width + 0.04;
    });
    grid.el.replaceChildren(...columns);
  }
}

// ---------- lightbox ----------

const lb = { section: 0, index: 0, token: 0 };

function openLightbox(sectionIndex, index) {
  const dialog = document.querySelector('.lightbox');
  lb.section = sectionIndex;
  showImage(index);
  if (!dialog.open) {
    dialog.showModal();
    document.documentElement.classList.add('lb-open');
  }
}

function showImage(index) {
  const items = sections[lb.section].items;
  lb.index = (index + items.length) % items.length;
  const item = items[lb.index];
  const token = ++lb.token;

  const dialog = document.querySelector('.lightbox');
  const img = dialog.querySelector('.lb-img');

  // Show the (already cached) thumbnail instantly, then swap in the large version.
  img.src = item.thumb;
  img.alt = item.title;
  img.classList.add('is-preview');
  const full = new Image();
  full.decoding = 'async';
  full.src = item.full;
  full.decode().then(
    () => {
      if (token !== lb.token) return;
      img.src = item.full;
      img.classList.remove('is-preview');
    },
    () => img.classList.remove('is-preview'),
  );

  dialog.querySelector('.lb-title').textContent = item.title;
  const caption = dialog.querySelector('.lb-caption');
  caption.textContent = item.caption;
  caption.hidden = !item.caption;
  dialog.querySelector('.lb-count').textContent =
    `${sections[lb.section].title} · ${lb.index + 1} / ${items.length}`;

  const single = items.length < 2;
  dialog.querySelector('.lb-prev').hidden = single;
  dialog.querySelector('.lb-next').hidden = single;

  // Warm up neighbours so next/previous feels instant.
  [1, -1].forEach((d) => {
    const n = items[(lb.index + d + items.length) % items.length];
    new Image().src = n.full;
  });
}

function setupLightbox() {
  const dialog = document.querySelector('.lightbox');
  const close = () => dialog.close();

  dialog.querySelector('.lb-close').addEventListener('click', close);
  dialog.querySelector('.lb-prev').addEventListener('click', () => showImage(lb.index - 1));
  dialog.querySelector('.lb-next').addEventListener('click', () => showImage(lb.index + 1));
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lb-open');
    lb.token++;
  });

  // Clicking the dark area around the image closes the viewer.
  dialog.querySelector('.lb-stage').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') showImage(lb.index + 1);
    else if (e.key === 'ArrowLeft') showImage(lb.index - 1);
  });

  // Swipe left/right on touch screens.
  let startX = null;
  let startY = null;
  dialog.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showImage(lb.index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

// ---------- header state ----------

function setupHeader() {
  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const links = new Map([...document.querySelectorAll('[data-nav]')].map((a) => [a.dataset.nav, a]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = links.get(entry.target.id);
        if (link) link.classList.toggle('is-active', entry.isIntersecting);
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('.work').forEach((s) => observer.observe(s));
}

// ---------- start ----------

setFavicon(site.name);
render();
buildGrids();
setupLightbox();
setupHeader();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutGrids, 120);
});
