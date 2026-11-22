(() => {
  const root = document.getElementById('app');
  const PLATFORM = { android: 'Android', windows: 'Windows', web: 'Web', ios: 'iPhone' };

  /* ---------- outils ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  }

  function detectDevice() {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/windows/i.test(ua)) return 'windows';
    return 'other';
  }
  const device = detectDevice();

  function fmtDate(iso) {
    try { return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }
  const platformsOf = (app) => [...new Set(app.downloads.map((d) => d.platform))];
  const colorStyle = (app) => `--app:${app.color};--app-ink:${app.ink}`;

  /* Action principale d'une application selon l'appareil du visiteur */
  function primaryAction(app) {
    const d = app.downloads.find((x) => x.platform === device && x.primary !== false && x.file);
    if (d) return { label: `Télécharger pour ${PLATFORM[device]}`, href: d.file, download: true };
    const web = app.downloads.find((x) => x.platform === 'web');
    if (web) return { label: web.pwa ? 'Ouvrir la version web' : (web.label || 'Ouvrir le site'), href: web.href, external: !web.pwa || /^https?:/.test(web.href) };
    return null;
  }

  function actionButton(a, cls) {
    return h('a', { class: `btn ${cls}`, href: a.href, download: a.download ? '' : null, target: a.external ? '_blank' : null, rel: a.external ? 'noopener' : null }, a.label);
  }

  /* ---------- pièces communes ---------- */
  function topbar() {
    return h('div', { class: 'wrap bar' },
      h('a', { class: 'brand', href: '#/' }, h('img', { src: 'icons/store.svg', alt: '', width: 36, height: 36 }), STORE.name),
      h('nav', { 'aria-label': 'Principal' }, h('a', { href: '#/aide' }, 'Comment installer')),
    );
  }

  function stepsFor(platform) { return h('ol', { class: 'steps' }, INSTALL[platform].map((t) => h('li', null, t))); }

  function installBlocks(order) {
    return order.map((p, i) =>
      h('details', { class: 'steps-block', open: i === 0 ? '' : null },
        h('summary', null, `Installer sur ${PLATFORM[p]}`),
        stepsFor(p)));
  }

  function footer() {
    return h('footer', { class: 'wrap' },
      h('span', null, `${STORE.owner}, ${STORE.city}`),
      h('span', null, 'Installez les applications uniquement depuis cette page.'));
  }

  function helpLink() {
    if (!STORE.whatsapp) return null;
    return h('p', { class: 'help-line' }, 'Un problème pour installer ? ',
      h('a', { href: `https://wa.me/${STORE.whatsapp}`, target: '_blank', rel: 'noopener' }, 'Écrivez-nous sur WhatsApp'), '.');
  }

  /* ---------- accueil ---------- */
  let filter = 'all';
  let query = '';

  function heroSentence() {
    const n = APPS.filter((a) => a.downloads.some((d) => d.platform === device && d.file)).length;
    if (device === 'android') return [h('span', { class: 'device' }, 'Android détecté.'), ` ${n} application${n > 1 ? 's' : ''} à installer en un appui.`];
    if (device === 'windows') return [h('span', { class: 'device' }, 'Windows détecté.'), ` ${n} application${n > 1 ? 's' : ''} pour votre ordinateur.`];
    if (device === 'ios') return [h('span', { class: 'device' }, 'iPhone détecté.'), ' Pas de fichier à télécharger : ouvrez la version web et ajoutez-la à l’écran d’accueil.'];
    return ['Choisissez une application, puis le fichier qui correspond à votre appareil.'];
  }

  function tile(app) {
    const act = primaryAction(app);
    const plats = platformsOf(app);
    return h('article', { class: 'tile', style: colorStyle(app) },
      h('img', { class: 'big', src: app.icon, alt: '', width: 290, height: 290 }),
      h('div', { class: 'badges' }, plats.map((p) => h('span', { class: 'badge' }, PLATFORM[p]))),
      h('div', null,
        h('h2', null, h('a', { href: `#/app/${app.id}` }, app.name)),
        h('p', { class: 'tag' }, app.tagline),
        app.access ? h('p', { class: 'meta' }, app.access) : null,
        h('div', { class: 'actions' },
          act ? actionButton(act, 'btn-main') : h('a', { class: 'btn btn-main', href: `#/app/${app.id}` }, 'Voir les téléchargements'),
          act ? h('a', { class: 'btn btn-ghost', href: `#/app/${app.id}`, 'aria-label': `Détails de ${app.name}` }, 'Détails') : null)));
  }

  function renderHome() {
    document.title = STORE.name;
    const platforms = [...new Set(APPS.flatMap(platformsOf))];
    const grid = h('div', { class: 'tiles' });
    const empty = h('p', { class: 'empty', hidden: true }, 'Aucune application ne correspond. Changez de filtre ou effacez la recherche.');

    function paint() {
      const q = query.trim().toLowerCase();
      const list = APPS.filter((a) =>
        (filter === 'all' || platformsOf(a).includes(filter)) &&
        (!q || (a.name + ' ' + a.tagline).toLowerCase().includes(q)));
      grid.replaceChildren(...list.map(tile));
      empty.hidden = list.length > 0;
    }

    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrer par appareil' },
      [['all', 'Toutes'], ...platforms.map((p) => [p, PLATFORM[p]])].map(([k, label]) =>
        h('button', { class: 'chip', type: 'button', 'aria-pressed': String(filter === k), onclick: (e) => {
          filter = k;
          chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === e.currentTarget)));
          paint();
        } }, label)));

    const search = APPS.length > 5
      ? h('input', { class: 'search', type: 'search', placeholder: 'Rechercher', 'aria-label': 'Rechercher une application', oninput: (e) => { query = e.target.value; paint(); } })
      : null;

    paint();
    const base = ['android', 'ios', 'windows'];
    const order = [device, ...base.filter((p) => p !== device)].filter((p) => base.includes(p));

    root.replaceChildren(
      topbar(),
      h('main', { class: 'wrap', id: 'main', tabindex: '-1' },
        h('section', { class: 'hero' },
          h('h1', null, 'Les applications Orienta, en téléchargement direct.'),
          h('p', null, heroSentence())),
        h('div', { class: 'tools' }, chips, search),
        grid, empty,
        h('section', { class: 'help', id: 'aide', 'aria-labelledby': 'aide-t' },
          h('div', null,
            h('h2', { id: 'aide-t' }, 'Installer hors du Play Store'),
            h('p', { class: 'why' }, 'Ces applications ne passent pas par une boutique officielle. Android et Windows affichent donc un avertissement : il est normal, et la marche à suivre est ci-contre.'),
            helpLink()),
          h('div', null, installBlocks(order)))),
      footer());
  }

  /* ---------- page d'une application ---------- */
  function renderApp(app) {
    document.title = `${app.name} – ${STORE.name}`;
    const act = primaryAction(app);
    const plats = platformsOf(app).filter((p) => p !== 'web');
    const avail = app.downloads.some((d) => d.pwa) ? [...plats, 'ios'] : plats;
    const order = [device, ...avail.filter((p) => p !== device)].filter((p, i, a) => INSTALL[p] && avail.includes(p) && a.indexOf(p) === i);

    const files = app.downloads.map((d) => h('li', { class: 'file' },
      h('div', null, h('strong', null, d.label), h('small', null, d.file ? [`v${app.version}`, d.size ? `  ${d.size}` : ''] : 'Sans installation')),
      d.file
        ? h('a', { class: 'btn btn-ink', href: d.file, download: '' }, 'Télécharger')
        : h('a', { class: 'btn btn-ink', href: d.href, target: '_blank', rel: 'noopener' }, 'Ouvrir')));

    root.replaceChildren(
      h('div', { class: 'apphead', style: colorStyle(app) },
        topbar(),
        h('div', { class: 'wrap' },
          h('a', { class: 'back', href: '#/' }, '‹ Toutes les applications'),
          h('div', { class: 'hd' },
            h('img', { class: 'icon', src: app.icon, alt: '', width: 148, height: 148 }),
            h('div', null,
              h('h1', { id: 'title' }, app.name),
              h('p', { class: 'tag' }, app.tagline),
              h('p', { class: 'facts' }, h('span', null, `Version ${app.version}`), h('span', null, `Mise à jour le ${fmtDate(app.updated)}`)),
              h('div', { class: 'actions' },
                act ? actionButton(act, 'btn-main') : h('span', { class: 'btn btn-main', 'aria-disabled': 'true' }, 'Pas de version pour votre appareil')))))),
      h('main', { class: 'wrap', id: 'main', tabindex: '-1' },
        app.shots.length
          ? h('div', { class: 'shots', role: 'group', 'aria-label': 'Captures d’écran', tabindex: '0' },
              app.shots.map((s) => h('img', { class: s.kind, src: s.src, alt: s.alt, loading: 'lazy' })))
          : null,
        h('div', { class: 'body', style: colorStyle(app) },
          h('div', null,
            h('h2', null, 'À propos'),
            h('p', null, app.description),
            h('ul', { class: 'features' }, app.features.map((f) => h('li', null, f))),
            app.access ? h('p', { class: 'note access' }, app.access + '.') : null,
            app.updateNote ? h('p', { class: 'note' }, h('strong', null, 'Mises à jour. '), app.updateNote) : null),
          h('div', { class: 'side' },
            h('h2', null, 'Télécharger'),
            h('ul', { class: 'files' }, files),
            order.length ? [h('h2', null, 'Installer'), installBlocks(order)] : null,
            helpLink()))),
      footer());
  }

  /* ---------- routage ---------- */
  function route() {
    const m = location.hash.match(/^#\/app\/([\w-]+)/);
    const app = m && APPS.find((a) => a.id === m[1]);
    if (location.hash === '#/aide') { renderHome(); document.getElementById('aide')?.scrollIntoView(); return; }
    if (app) renderApp(app); else renderHome();
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  route();
})();
