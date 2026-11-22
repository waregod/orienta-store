/* Emploi du temps : semaines, enregistrement, glisser-déposer (souris + tactile), PWA */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  }

  /* ---------- Dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const isISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s));
  const sameDay = (a, b) => toISO(a) === toISO(b);
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const dnum = (d) => (d.getDate() === 1 ? '1er' : String(d.getDate()));
  const dayIdx = (d) => (d.getDay() + 6) % 7; // lundi = 0, dimanche = 6

  function weekLabel(w) {
    const a = parseISO(w.start), b = parseISO(w.end);
    if (a.getFullYear() === b.getFullYear()) {
      if (a.getMonth() === b.getMonth()) return `${dnum(a)} – ${dnum(b)} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
      return `${dnum(a)} ${MONTHS_S[a.getMonth()]} – ${dnum(b)} ${MONTHS_S[b.getMonth()]} ${b.getFullYear()}`;
    }
    return `${dnum(a)} ${MONTHS_S[a.getMonth()]} ${a.getFullYear()} – ${dnum(b)} ${MONTHS_S[b.getMonth()]} ${b.getFullYear()}`;
  }
  const dayName = (d) => (DAYS[dayIdx(d)] ? DAYS[dayIdx(d)].label.toLowerCase() : 'dimanche');
  const longDate = (d) => `${dayName(d)} ${dnum(d)} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  /* date réelle de la colonne `dayId` dans la semaine w (null si hors intervalle) */
  function dateForDay(w, dayId) {
    const a = parseISO(w.start), b = parseISO(w.end);
    for (let d = new Date(a); d <= b; d = addDays(d, 1)) if (dayIdx(d) === dayId) return new Date(d);
    return null;
  }

  const toMin = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const fmt = (t) => {
    const [h24, b] = t.split(':').map(Number);
    const a = h24 % 24; // 25:00 → 1 h
    return b ? `${a} h ${pad(b)}` : `${a} h`;
  };
  const range = (s) => `${fmt(s.start)} – ${fmt(s.end)}`;

  /* ---------- État ---------- */
  let state = null;
  let selectedId = null;

  const uid = () => 's' + Math.random().toString(36).slice(2, 9);
  const subjectById = (id) => state.subjects.find((s) => s.id === id);
  const sortedWeeks = () => Object.values(state.weeks).sort((a, b) => (a.start < b.start ? -1 : 1));
  const week = () => state.weeks[state.current];
  const grid = () => week().grid;

  function normalize() {
    const base = structuredClone(DEFAULT_STATE);
    // ancienne version (une seule grille) → semaines
    if (state.grid && !state.weeks) {
      state.weeks = { [DEFAULT_WEEK.start]: { ...DEFAULT_WEEK, grid: state.grid } };
      state.current = DEFAULT_WEEK.start;
    }
    delete state.grid;
    state.meta = Object.assign({ title: base.meta.title, room: base.meta.room }, state.meta || {});
    delete state.meta.week;
    state.subjects = Array.isArray(state.subjects) ? state.subjects : [];
    // v3 : RDV love / Formation / TD sont des TYPES, plus des matières.
    // On retire les anciennes matières de ce nom si elles ne sont placées nulle part.
    if ((state.seed || 0) < 3) {
      const placed = new Set();
      for (const w of Object.values(state.weeks || {})) for (const id of Object.values((w && w.grid) || {})) placed.add(id);
      state.subjects = state.subjects.filter((x) => !(['rdv-love', 'formation', 'td'].includes(x.id) && !placed.has(x.id)));
      state.seed = 3;
    }
    state.v = 2;
    if (!state.weeks || typeof state.weeks !== 'object' || !Object.keys(state.weeks).length) {
      state.weeks = base.weeks;
      state.current = base.current;
    }
    const slotIds = new Set(SLOTS.filter((s) => !s.pause).map((s) => s.id));
    for (const [key, w] of Object.entries(state.weeks)) {
      if (!w || !isISO(w.start) || !isISO(w.end)) { delete state.weeks[key]; continue; }
      w.grid = w.grid && typeof w.grid === 'object' ? w.grid : {};
      for (const [k, id] of Object.entries(w.grid)) {
        const [d, sl] = k.split('-');
        if (!subjectById(id) || !slotIds.has(sl) || !DAYS[+d]) delete w.grid[k];
      }
    }
    if (!Object.keys(state.weeks).length) { state.weeks = base.weeks; state.current = base.current; }
    if (!state.weeks[state.current]) state.current = sortedWeeks()[0].start;
    state.saved = Array.isArray(state.saved) ? state.saved.filter((s) => s && isISO(s.start) && Array.isArray(s.cells)) : [];
  }

  function commit() {
    render();
    Store.save(state);
  }

  /* ---------- Rendu ---------- */
  function render() {
    renderHeader();
    renderBanner();
    renderWeekbar();
    renderGrid();
    renderLibrary();
    renderSavebar();
    document.body.classList.toggle('has-selection', !!selectedId);
  }

  function renderHeader() {
    const m = state.meta;
    $('#title').textContent = m.title || 'Emploi du temps';
    $('#subtitle').textContent = [weekLabel(week()), m.room].filter(Boolean).join(' · ');
    document.title = m.title ? `${m.title} – Emploi du temps` : 'Emploi du temps';
  }

  /* cours en cours / prochain cours, toutes semaines confondues (dates réelles) */
  function nextInfo() {
    const now = new Date();
    const nowMs = now.getTime();
    const items = [];
    for (const w of sortedWeeks()) {
      for (const [key, id] of Object.entries(w.grid)) {
        const [d, sl] = key.split('-');
        const slot = SLOTS.find((s) => s.id === sl);
        const sub = subjectById(id);
        const date = dateForDay(w, +d);
        if (!slot || !sub || !date || slot.pause) continue;
        const at = (t) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, toMin(t)).getTime();
        items.push({ sub, slot, date, start: at(slot.start), end: at(slot.end) });
      }
    }
    const cur = items.find((i) => i.start <= nowMs && nowMs < i.end);
    if (cur) return { live: true, ...cur };
    const future = items.filter((i) => i.start > nowMs).sort((a, b) => a.start - b.start)[0];
    return future ? { live: false, ...future } : null;
  }

  function renderBanner() {
    const box = $('#banner');
    box.replaceChildren();
    const info = nextInfo();
    if (!info) {
      box.append(h('div', { class: 'card' }, h('span', { class: 'pill' }, 'Rien de prévu'),
        h('span', { class: 'when' }, 'Aucun cours à venir. Glissez une matière dans la grille.')));
      return;
    }
    const now = new Date();
    let when;
    if (info.live) when = `jusqu’à ${fmt(info.slot.end)}`;
    else if (sameDay(info.date, now)) when = `aujourd’hui, ${range(info.slot)}`;
    else if (sameDay(info.date, addDays(now, 1))) when = `demain, ${range(info.slot)}`;
    else when = `${dayName(info.date)} ${dnum(info.date)} ${MONTHS[info.date.getMonth()]}, ${range(info.slot)}`;
    box.append(h('div', { class: 'card tone', style: `--h:${info.sub.hue}` },
      h('span', { class: 'pill' + (info.live ? ' live' : '') }, info.live ? 'En cours' : 'Prochain'),
      h('div', { class: 'txt' }, h('strong', {}, info.sub.name), h('span', { class: 'when' }, when))));
  }

  function previousWeek() {
    return sortedWeeks().filter((w) => w.start < week().start).pop() || null;
  }

  function renderWeekbar() {
    $('#wkLabel').textContent = weekLabel(week());
    const prev = previousWeek();
    $('#wkCopy').hidden = !(prev && !Object.keys(grid()).length && Object.keys(prev.grid).length);
  }

  function renderGrid() {
    const g = $('#grid');
    g.replaceChildren();
    const w = week();
    const now = new Date();
    g.append(h('div', { class: 'corner' }, 'Heures'));
    DAYS.forEach((d) => {
      const date = dateForDay(w, d.id);
      const isToday = date && sameDay(date, now);
      g.append(h('div', { class: 'dayhead' + (isToday ? ' today' : '') + (d.id === 5 ? ' last' : ''), role: 'columnheader' },
        h('span', { class: 'full' }, d.label), h('span', { class: 'short' }, d.short),
        date && h('small', { class: 'dnum' }, dnum(date))));
    });

    SLOTS.forEach((s) => {
      if (s.pause) {
        g.append(h('div', { class: 'pause' }, h('span', {}, `Pause · ${range(s)}`)));
        return;
      }
      g.append(h('div', { class: 'hour' + (s.long ? ' tall' : '') },
        h('b', {}, fmt(s.start)), h('span', {}, fmt(s.end))));
      DAYS.forEach((d) => {
        const key = `${d.id}-${s.id}`;
        const sub = subjectById(grid()[key]);
        const date = dateForDay(w, d.id);
        const isToday = date && sameDay(date, now);
        g.append(h('div', {
          class: 'cell' + (s.long ? ' tall' : '') + (isToday ? ' today' : '') + (sub ? '' : ' empty') + (d.id === 5 ? ' last' : ''),
          dataset: { key }, role: 'gridcell', 'aria-label': `${d.label}, ${range(s)}`,
          onclick: onCellClick,
        }, sub ? placedBlock(sub, key) : null));
      });
    });
  }

  function placedBlock(sub, key) {
    return h('div', {
      class: 'placed tone', style: `--h:${sub.hue}`, dataset: { key },
      onpointerdown: (e) => pointerDown(e, { kind: 'cell', key, id: sub.id }),
      oncontextmenu: (e) => e.preventDefault(),
    },
      h('strong', {}, sub.name),
      sub.teacher && h('span', { class: 't' }, sub.teacher),
      sub.phone && h('a', { class: 'ph', href: 'tel:' + sub.phone.replace(/\s+/g, '') }, sub.phone),
      sub.room && h('span', { class: 'rm' }, `Salle ${sub.room}`),
      h('button', {
        class: 'x', type: 'button', 'aria-label': `Retirer ${sub.name} de ce créneau`,
        onclick: (e) => { e.stopPropagation(); delete grid()[key]; commit(); },
      }, '×'));
  }

  function renderLibrary() {
    const list = $('#list');
    list.replaceChildren();
    const hint = $('#hint');
    const sel = selectedId && subjectById(selectedId);
    if (!sel) selectedId = null;
    hint.className = 'hint' + (sel ? ' active' : '');
    hint.textContent = sel
      ? `« ${sel.name} » est sélectionnée : touchez une case pour la placer.`
      : 'Glissez une matière dans la grille, ou touchez-la puis touchez une case.';

    if (!state.subjects.length) {
      list.append(h('li', { class: 'empty-list' }, 'Aucune matière pour l’instant. Ajoutez-en une.'));
      return;
    }
    state.subjects.forEach((s) => {
      const meta = [s.kind, s.teacher].filter(Boolean).join(' · ');
      list.append(h('li', {},
        h('div', {
          class: 'chip tone' + (s.id === selectedId ? ' selected' : ''), style: `--h:${s.hue}`,
          dataset: { id: s.id }, role: 'button', tabindex: '0',
          'aria-pressed': s.id === selectedId ? 'true' : 'false',
          onpointerdown: (e) => pointerDown(e, { kind: 'subject', id: s.id }),
          onclick: () => { if (!justDragged) toggleSelect(s.id); },
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(s.id); } },
          oncontextmenu: (e) => e.preventDefault(),
        },
          h('div', { class: 'main' }, h('strong', {}, s.name), meta && h('span', { class: 'meta' }, meta)),
          h('button', {
            class: 'edit', type: 'button', 'aria-label': `Modifier ${s.name}`,
            onclick: (e) => { e.stopPropagation(); openSubject(s.id); },
          }, '✎'))));
    });
  }

  function toggleSelect(id) {
    selectedId = selectedId === id ? null : id;
    render();
  }

  function onCellClick(e) {
    if (justDragged || !selectedId) return;
    if (e.target.closest('button, a')) return;
    grid()[e.currentTarget.dataset.key] = selectedId;
    commit();
  }

  /* ---------- Semaines ---------- */
  function openWeek(start, end) {
    if (!state.weeks[start]) state.weeks[start] = { start, end, grid: {} };
    state.current = start;
    commit();
  }

  function shiftWeek(delta) {
    const w = week();
    const start = toISO(addDays(parseISO(w.start), 7 * delta));
    const end = toISO(addDays(parseISO(w.end), 7 * delta));
    const isNew = !state.weeks[start];
    openWeek(start, end);
    if (isNew) toast('Nouvelle semaine créée');
  }

  function goToday() {
    const iso = toISO(new Date());
    const found = sortedWeeks().find((w) => w.start <= iso && iso <= w.end);
    if (found) { state.current = found.start; commit(); return; }
    const monday = addDays(new Date(), -dayIdx(new Date()));
    openWeek(toISO(monday), toISO(addDays(monday, 5)));
    toast('Semaine en cours créée');
  }

  $('#wkPrev').addEventListener('click', () => shiftWeek(-1));
  $('#wkNext').addEventListener('click', () => shiftWeek(1));
  $('#wkToday').addEventListener('click', goToday);
  $('#wkCopy').addEventListener('click', () => {
    const prev = previousWeek();
    if (!prev) return;
    state.weeks[state.current].grid = { ...prev.grid };
    commit();
    toast('Semaine précédente copiée : ajuste-la');
  });

  const wDlg = $('#weekDialog');
  const wForm = $('#weekForm');
  $('#wkLabel').addEventListener('click', () => {
    wForm.elements.start.value = week().start;
    wForm.elements.end.value = week().end;
    $('#wkDelete').hidden = Object.keys(state.weeks).length < 2;
    wDlg.showModal();
  });
  wForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const start = wForm.elements.start.value, end = wForm.elements.end.value;
    if (!isISO(start) || !isISO(end)) return;
    if (end < start) { toast('La date de fin doit être après le début.'); return; }
    if ((parseISO(end) - parseISO(start)) / 86400000 > 6) { toast('Une semaine fait 7 jours au maximum.'); return; }
    const old = state.current;
    if (start !== old && state.weeks[start]) { toast('Une semaine commence déjà à cette date.'); return; }
    const w = state.weeks[old];
    delete state.weeks[old];
    state.weeks[start] = { ...w, start, end };
    state.current = start;
    wDlg.close();
    commit();
    toast('Intervalle modifié');
  });
  $('#wkCancel').addEventListener('click', () => wDlg.close());
  $('#wkDelete').addEventListener('click', () => {
    if (Object.keys(state.weeks).length < 2) return;
    if (!confirm(`Supprimer la semaine du ${weekLabel(week())} ? Ses enregistrements (fichiers) ne sont pas touchés.`)) return;
    const ws = sortedWeeks();
    const i = ws.findIndex((w) => w.start === state.current);
    delete state.weeks[state.current];
    const rest = sortedWeeks();
    state.current = (rest[Math.min(i, rest.length - 1)]).start;
    wDlg.close();
    commit();
  });

  /* ---------- Enregistrer la semaine (copie figée + fichier texte) ---------- */
  function snapshot() {
    const w = week();
    const cells = [];
    for (const [key, id] of Object.entries(w.grid)) {
      const [d, sl] = key.split('-');
      const sub = subjectById(id);
      if (sub) cells.push({ day: +d, slot: sl, name: sub.name, teacher: sub.teacher, phone: sub.phone, room: sub.room, kind: sub.kind, hue: sub.hue });
    }
    const order = (c) => c.day * 100 + SLOTS.findIndex((s) => s.id === c.slot);
    cells.sort((a, b) => order(a) - order(b));
    return { start: w.start, end: w.end, title: state.meta.title, room: state.meta.room, savedAt: new Date().toISOString(), cells };
  }
  const cellsKey = (cells) => JSON.stringify(cells.map((c) => [c.day, c.slot, c.name, c.teacher, c.phone, c.room]).sort());
  const stamp = (iso) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  function toText(snap) {
    const lines = [];
    const a = parseISO(snap.start), b = parseISO(snap.end);
    lines.push(`EMPLOI DU TEMPS${snap.title ? ' · ' + snap.title : ''}`);
    lines.push(`Du ${longDate(a)} au ${longDate(b)}`);
    if (snap.room) lines.push(snap.room);
    lines.push(`Enregistré le ${stamp(snap.savedAt)}`);
    lines.push('='.repeat(56), '');
    if (!snap.cells.length) lines.push('Rien de prévu cette semaine.');
    for (const d of DAYS) {
      const cs = snap.cells.filter((c) => c.day === d.id);
      if (!cs.length) continue;
      const date = dateForDay(snap, d.id);
      lines.push(`${d.label.toUpperCase()}${date ? ' ' + dnum(date) + ' ' + MONTHS[date.getMonth()] : ''}`);
      for (const c of cs) {
        const slot = SLOTS.find((s) => s.id === c.slot);
        lines.push(`  ${(slot ? range(slot) : c.slot).padEnd(14)} ${c.name} (${c.kind})`);
        const more = [c.teacher, c.phone, c.room && `Salle ${c.room}`].filter(Boolean).join(' · ');
        if (more) lines.push(`  ${' '.repeat(14)} ${more}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  function download(name, text, type) {
    const blob = new Blob(['\ufeff' + text], { type: type + ';charset=utf-8' });
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const fileName = (snap) => `emploi-du-temps_${snap.start}_au_${snap.end}.txt`;

  async function saveWeek() {
    const snap = snapshot();
    const i = state.saved.findIndex((s) => s.start === snap.start);
    if (i >= 0) state.saved[i] = snap; else state.saved.push(snap);
    await Store.save(state);
    download(fileName(snap), toText(snap), 'text/plain');
    renderSavebar();
    toast('Semaine enregistrée · fichier .txt téléchargé');
  }

  function renderSavebar() {
    const snap = snapshot();
    const saved = state.saved.find((s) => s.start === snap.start);
    const st = $('#saveStatus');
    if (!saved) { st.textContent = 'Cette semaine n’est pas encore enregistrée.'; st.className = 'save-status dirty'; }
    else if (cellsKey(saved.cells) !== cellsKey(snap.cells)) { st.textContent = `Modifiée depuis l’enregistrement du ${stamp(saved.savedAt)}.`; st.className = 'save-status dirty'; }
    else { st.textContent = `Enregistrée le ${stamp(saved.savedAt)}.`; st.className = 'save-status'; }
    $('#btnHistory').textContent = state.saved.length ? `Semaines enregistrées (${state.saved.length})` : 'Semaines enregistrées';
  }

  const hDlg = $('#historyDialog');
  function renderHistory() {
    const list = $('#savedList');
    list.replaceChildren();
    const items = [...state.saved].sort((a, b) => (a.start < b.start ? 1 : -1));
    if (!items.length) {
      list.append(h('li', {}, h('span', { class: 'note' }, 'Aucune semaine enregistrée. Utilise le bouton « Enregistrer la semaine ».')));
      return;
    }
    for (const s of items) {
      list.append(h('li', {},
        h('div', { class: 'info' },
          h('strong', {}, weekLabel(s)),
          h('small', {}, `Enregistrée le ${stamp(s.savedAt)} · ${s.cells.length} créneau${s.cells.length > 1 ? 'x' : ''}`)),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'primary', onclick: () => restore(s) }, 'Ouvrir'),
          h('button', { type: 'button', class: 'ghost', onclick: () => download(fileName(s), toText(s), 'text/plain') }, 'Fichier .txt'),
          h('button', { type: 'button', class: 'danger', onclick: () => removeSaved(s) }, 'Supprimer'))));
    }
  }

  function restore(snap) {
    const existing = state.weeks[snap.start];
    if (existing && Object.keys(existing.grid).length) {
      const cur = Object.entries(existing.grid).map(([k, id]) => { const [d, sl] = k.split('-'); const sub = subjectById(id); return [+d, sl, sub && sub.name]; });
      const old = snap.cells.map((c) => [c.day, c.slot, c.name]);
      const key = (a) => JSON.stringify(a.sort());
      if (key(cur) !== key(old) && !confirm(`Remplacer la semaine du ${weekLabel(snap)} par la version enregistrée ?`)) return;
    }
    const g = {};
    for (const c of snap.cells) {
      let sub = state.subjects.find((s) => s.name.toLowerCase() === c.name.toLowerCase());
      if (!sub) {
        sub = { id: uid(), name: c.name, teacher: c.teacher, phone: c.phone, room: c.room, kind: c.kind, hue: c.hue };
        state.subjects.push(sub);
      }
      g[`${c.day}-${c.slot}`] = sub.id;
    }
    state.weeks[snap.start] = { start: snap.start, end: snap.end, grid: g };
    state.current = snap.start;
    hDlg.close();
    commit();
    toast('Semaine ouverte');
  }

  function removeSaved(snap) {
    if (!confirm(`Supprimer l’enregistrement du ${weekLabel(snap)} ? (La semaine reste dans la grille.)`)) return;
    state.saved = state.saved.filter((s) => s.start !== snap.start);
    renderHistory();
    commit();
  }

  $('#btnSave').addEventListener('click', saveWeek);
  $('#btnHistory').addEventListener('click', () => { renderHistory(); hDlg.showModal(); });
  $('#hsClose').addEventListener('click', () => hDlg.close());

  /* ---------- Glisser-déposer (pointer events : souris + tactile) ---------- */
  let drag = null;
  let justDragged = false;

  function pointerDown(e, payload) {
    if (e.button > 0 || e.target.closest('button, a')) return;
    cancelDrag();
    drag = {
      payload, src: e.currentTarget, pointerId: e.pointerId, touch: e.pointerType === 'touch',
      sx: e.clientX, sy: e.clientY, active: false, ghost: null, target: null, timer: null,
    };
    if (drag.touch) drag.timer = setTimeout(() => beginDrag(drag.sx, drag.sy), 280); // appui long
  }

  function beginDrag(x, y) {
    if (!drag || drag.active) return;
    drag.active = true;
    const r = drag.src.getBoundingClientRect();
    drag.ghost = drag.src.cloneNode(true);
    drag.ghost.classList.add('ghost-drag');
    drag.ghost.style.width = r.width + 'px';
    drag.ghost.querySelectorAll('button').forEach((b) => b.remove());
    document.body.append(drag.ghost);
    drag.src.classList.add('dragging');
    document.body.classList.add('is-dragging');
    if (navigator.vibrate) navigator.vibrate(12);
    moveDrag(x, y);
  }

  function moveDrag(x, y) {
    const gh = drag.ghost;
    gh.style.transform = `translate(${x - gh.offsetWidth / 2}px, ${y - 24}px)`;
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest('.cell');
    const lib = el && el.closest('.library');
    document.querySelectorAll('.cell.over, .library.over').forEach((n) => n.classList.remove('over'));
    drag.target = null;
    if (cell) { cell.classList.add('over'); drag.target = { cell }; }
    else if (lib && drag.payload.kind === 'cell') { lib.classList.add('over'); drag.target = { lib }; }

    const sc = $('.board-scroll').getBoundingClientRect();
    if (y > sc.top && y < sc.bottom) {
      if (x < sc.left + 40) $('.board-scroll').scrollLeft -= 14;
      else if (x > sc.right - 40) $('.board-scroll').scrollLeft += 14;
    }
    if (y < 60) window.scrollBy(0, -12);
    else if (y > innerHeight - 110) window.scrollBy(0, 12);
  }

  function endDrag(drop) {
    if (!drag) return;
    clearTimeout(drag.timer);
    if (drag.active) {
      if (drop && drag.target) applyDrop(drag.payload, drag.target);
      drag.ghost.remove();
      drag.src.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      document.querySelectorAll('.cell.over, .library.over').forEach((n) => n.classList.remove('over'));
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 80);
    }
    drag = null;
  }
  const cancelDrag = () => endDrag(false);

  function applyDrop(payload, target) {
    const g = grid();
    if (target.cell) {
      const key = target.cell.dataset.key;
      if (payload.kind === 'subject') {
        g[key] = payload.id;
      } else if (payload.key !== key) {
        const other = g[key];
        g[key] = payload.id;
        if (other) g[payload.key] = other; else delete g[payload.key];
      }
    } else if (target.lib && payload.kind === 'cell') {
      delete g[payload.key];
      toast('Retiré de la grille');
    }
    commit();
  }

  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dist = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
    if (!drag.active) {
      if (drag.touch) { if (dist > 10) cancelDrag(); return; } // le doigt fait défiler la page
      if (dist < 5) return;
      beginDrag(e.clientX, e.clientY);
    }
    moveDrag(e.clientX, e.clientY);
  });
  document.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.pointerId) endDrag(true); });
  document.addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.pointerId && !drag.active) cancelDrag(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cancelDrag(); if (selectedId) { selectedId = null; render(); } } });
  document.addEventListener('touchmove', (e) => { if (drag && drag.active) e.preventDefault(); }, { passive: false });

  /* ---------- Dialogue matière ---------- */
  const sDlg = $('#subjectDialog');
  const sForm = $('#subjectForm');
  let editingId = null;

  function buildSwatches(current) {
    const box = $('#swatches');
    box.replaceChildren();
    HUES.forEach((hue) => box.append(h('label', { 'aria-label': `Teinte ${hue}` },
      h('input', { type: 'radio', name: 'hue', value: hue, checked: hue === current }),
      h('span', { style: `--h:${hue}` }))));
  }

  function buildKinds(current) {
    const box = $('#kinds');
    box.replaceChildren();
    KINDS.forEach((k) => box.append(h('label', { class: 'inline' },
      h('input', { type: 'radio', name: 'kind', value: k, checked: k === current }), ' ' + k)));
  }

  function openSubject(id) {
    editingId = id || null;
    const s = id ? subjectById(id) : null;
    $('#sdTitle').textContent = s ? 'Modifier' : 'Nouvelle matière ou activité';
    sForm.elements.name.value = s ? s.name : '';
    sForm.elements.teacher.value = s ? s.teacher : '';
    sForm.elements.phone.value = s ? s.phone : '';
    sForm.elements.room.value = s ? s.room : '';
    buildKinds(s && KINDS.includes(s.kind) ? s.kind : 'Cours');
    const used = new Set(state.subjects.map((x) => x.hue));
    buildSwatches(s ? s.hue : (HUES.find((x) => !used.has(x)) ?? HUES[0]));
    $('#sdDelete').hidden = !s;
    sDlg.showModal();
    sForm.elements.name.focus();
  }

  sForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(sForm);
    const data = {
      name: f.get('name').trim(), teacher: f.get('teacher').trim(), phone: f.get('phone').trim(),
      room: f.get('room').trim(), kind: f.get('kind'), hue: Number(f.get('hue')),
    };
    if (!data.name) return;
    if (editingId) Object.assign(subjectById(editingId), data);
    else state.subjects.push({ id: uid(), ...data });
    sDlg.close();
    commit();
    toast('Enregistré');
  });
  $('#sdCancel').addEventListener('click', () => sDlg.close());
  $('#sdDelete').addEventListener('click', () => {
    const s = subjectById(editingId);
    if (!s || !confirm(`Supprimer « ${s.name} » ? Elle sera retirée de toutes les semaines de la grille (les semaines enregistrées ne changent pas).`)) return;
    state.subjects = state.subjects.filter((x) => x.id !== s.id);
    for (const w of Object.values(state.weeks)) for (const k of Object.keys(w.grid)) if (w.grid[k] === s.id) delete w.grid[k];
    if (selectedId === s.id) selectedId = null;
    sDlg.close();
    commit();
    toast('Supprimé');
  });
  $('#btnAdd').addEventListener('click', () => openSubject(null));

  /* ---------- Réglages / sauvegarde ---------- */
  const stDlg = $('#settingsDialog');
  const stForm = $('#settingsForm');

  $('#btnSettings').addEventListener('click', () => {
    stForm.elements.title.value = state.meta.title || '';
    stForm.elements.room.value = state.meta.room || '';
    stDlg.showModal();
  });
  stForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.meta = { title: stForm.elements.title.value.trim(), room: stForm.elements.room.value.trim() };
    stDlg.close();
    commit();
  });
  $('#stCancel').addEventListener('click', () => stDlg.close());
  $('#btnPrint').addEventListener('click', () => window.print());

  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'emploi-du-temps-sauvegarde.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.subjects) || (typeof data.grid !== 'object' && typeof data.weeks !== 'object')) throw new Error('format');
      if (!confirm('Remplacer tout (semaines et enregistrements) par ce fichier ?')) return;
      state = data;
      normalize();
      stDlg.close();
      commit();
      toast('Importé');
    } catch (err) {
      toast('Fichier invalide : choisissez une sauvegarde .json de cette page.');
    }
  });
  $('#btnReset').addEventListener('click', async () => {
    if (!confirm('Tout effacer (semaines et enregistrements) et revenir au départ ?')) return;
    state = structuredClone(DEFAULT_STATE);
    selectedId = null;
    await Store.clear();
    stDlg.close();
    commit();
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- Démarrage ---------- */
  async function init() {
    state = (await Store.load()) || structuredClone(DEFAULT_STATE);
    normalize();
    // à l'ouverture : la semaine qui contient aujourd'hui, si elle existe
    const iso = toISO(new Date());
    const today = sortedWeeks().find((w) => w.start <= iso && iso <= w.end);
    if (today) state.current = today.start;
    render();
    Store.save(state);
    setInterval(renderBanner, 60000);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW', err));
    }
  }
  init();
})();
