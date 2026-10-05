/* HalfWay – dziennik treningów (PWA, vanilla JS + Supabase) */
(function () {
  'use strict';

  // ---------- konfiguracja ----------
  const CFG = window.HALFWAY_CONFIG || {};
  const REMOTE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const sb = REMOTE
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'halfway-auth' }
      })
    : null;

  const COLORS = ['#DC3B41', '#3E63DD', '#E0590A', '#2B9358', '#8E4EC6', '#0D8F99', '#C2357F', '#6B5E14'];
  const UNITS = ['powt.', 'min', 'km'];
  const QUICK = { 'powt.': [10, 25, 50, 100], 'min': [30, 45, 60, 90], 'km': [3, 5, 10, 20] };
  const STEP = { 'powt.': 5, 'min': 5, 'km': 1 };
  const UNIT_LONG = { 'powt.': 'powtórzenia', 'min': 'minuty', 'km': 'kilometry' };
  const DEFAULT_SPORTS = [
    { name: 'Pompki', color: '#DC3B41', unit: 'powt.' },
    { name: 'Przysiady', color: '#3E63DD', unit: 'powt.' },
    { name: 'Koszykówka', color: '#E0590A', unit: 'min' },
    { name: 'Piłka nożna', color: '#2B9358', unit: 'min' },
    { name: 'Bieganie', color: '#8E4EC6', unit: 'km' },
    { name: 'Rower', color: '#0D8F99', unit: 'km' }
  ];
  const DAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const DAYS_S = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  const M_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const M_NOM = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const M_LOC = ['styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu', 'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu'];
  const M_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

  const ICON = {
    cal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><rect x="8" y="13" width="4" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
    grid: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2" fill="currentColor"/><rect x="3.5" y="13.5" width="7" height="7" rx="2" fill="currentColor"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
    list: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="7" r="2.2" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="2.2" fill="currentColor" stroke="none"/><circle cx="6" cy="17" r="2.2" fill="currentColor" stroke="none"/><path d="M11 7h9M11 12h9M11 17h9"/></svg>',
    plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    flame: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c.8 3.2 4.5 5.4 4.5 10a4.5 4.5 0 0 1-9 0c0-2.1 1-3.6 2.2-4.6.1 1.9 1 3 2.1 3.3-.4-3 .4-5.8.2-8.7z"/></svg>',
    left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  // ---------- pomocnicze ----------
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseKey = (k) => { const p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const longDate = (d) => DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + M_GEN[d.getMonth()];
  const plural = (n, one, few, many) => {
    if (n === 1) return one;
    const a = n % 10, b = n % 100;
    return a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  const num = (n) => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString().replace('.', ','));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  // ---------- dane (cache lokalny + kolejka zmian do wysłania) ----------
  const LS = 'halfway:data:v1';
  const emptyStore = (owner) => ({ owner: owner || null, sports: [], entries: [], queue: [] });
  let store = emptyStore();
  try {
    const s = JSON.parse(localStorage.getItem(LS));
    if (s && Array.isArray(s.sports)) store = Object.assign(emptyStore(), s);
  } catch (e) { /* brak danych */ }
  const saveLocal = () => { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { /* pełna pamięć */ } };

  const sports = () => store.sports.slice().sort((a, b) => a.position - b.position);
  const sportMap = () => { const m = {}; store.sports.forEach((s) => { m[s.id] = s; }); return m; };

  function enqueue(op) { if (REMOTE) store.queue.push(op); saveLocal(); render(); flush(); }

  function addEntry(date, sportId, amount) {
    const row = { id: uuid(), sport_id: sportId, date: date, amount: amount };
    store.entries.push(row);
    enqueue({ t: 'entries', op: 'upsert', row: row });
  }
  function deleteEntry(id) {
    store.entries = store.entries.filter((e) => e.id !== id);
    enqueue({ t: 'entries', op: 'delete', id: id });
  }
  function addSport(name, color, unit, silent) {
    const pos = store.sports.reduce((m, s) => Math.max(m, s.position), -1) + 1;
    const row = { id: uuid(), name: name, color: color, unit: unit, position: pos };
    store.sports.push(row);
    if (REMOTE) store.queue.push({ t: 'sports', op: 'upsert', row: Object.assign({}, row) });
    if (!silent) { saveLocal(); render(); flush(); }
    return row;
  }
  function updateSport(id, patch) {
    const s = store.sports.find((x) => x.id === id);
    if (!s) return;
    Object.assign(s, patch);
    enqueue({ t: 'sports', op: 'upsert', row: Object.assign({}, s) });
  }
  function deleteSport(id) {
    store.sports = store.sports.filter((s) => s.id !== id);
    store.entries = store.entries.filter((e) => e.sport_id !== id);
    store.queue = store.queue.filter((op) => !(op.t === 'entries' && op.row && op.row.sport_id === id));
    enqueue({ t: 'sports', op: 'delete', id: id });
  }
  function seedDefaults() {
    DEFAULT_SPORTS.forEach((s) => addSport(s.name, s.color, s.unit, true));
    saveLocal(); render(); flush();
  }

  // ---------- synchronizacja z Supabase ----------
  let flushing = false;
  const isNetworkError = (err) => !err.code || /fetch|network|load failed/i.test(err.message || '');

  async function flush() {
    if (!REMOTE || !ui.session || flushing || !navigator.onLine) return;
    flushing = true;
    try {
      while (store.queue.length) {
        const op = store.queue[0];
        const res = op.op === 'upsert'
          ? await sb.from(op.t).upsert(op.row)
          : await sb.from(op.t).delete().eq('id', op.id);
        if (res.error) {
          if (isNetworkError(res.error)) break;
          console.error('HalfWay sync', res.error);
          showToast('Błąd zapisu: ' + res.error.message, true);
        }
        store.queue.shift();
        saveLocal();
      }
    } catch (e) { /* brak sieci – spróbujemy później */ }
    flushing = false;
    render();
  }

  function applyQueue() {
    store.queue.forEach((op) => {
      const arr = store[op.t];
      if (op.op === 'upsert') {
        const i = arr.findIndex((x) => x.id === op.row.id);
        if (i >= 0) arr[i] = Object.assign({}, op.row); else arr.push(Object.assign({}, op.row));
      } else {
        store[op.t] = arr.filter((x) => x.id !== op.id);
      }
    });
  }

  async function pull() {
    if (!REMOTE || !ui.session || ui.syncing) return;
    if (store.queue.length) { await flush(); if (store.queue.length) return; }
    ui.syncing = true; render();
    try {
      const sp = await sb.from('sports').select('id,name,color,unit,position').order('position');
      if (sp.error) throw sp.error;
      let entries = [], from = 0;
      const size = 1000;
      for (;;) {
        const r = await sb.from('entries').select('id,sport_id,date,amount').order('date').range(from, from + size - 1);
        if (r.error) throw r.error;
        entries = entries.concat(r.data);
        if (r.data.length < size) break;
        from += size;
      }
      store.sports = sp.data;
      store.entries = entries.map((e) => Object.assign({}, e, { amount: Number(e.amount) }));
      applyQueue();
      saveLocal();
      ui.syncing = false;
      if (!store.sports.length) seedDefaults();
    } catch (e) {
      console.warn('HalfWay pull', e);
    }
    ui.syncing = false;
    render();
  }

  // ---------- stan interfejsu ----------
  const t0 = today();
  const ui = {
    tab: 'today', filter: 'all',
    calY: t0.getFullYear(), calM: t0.getMonth(), selDay: dkey(t0),
    sheet: false,
    draft: { date: dkey(t0), sportId: null, amount: 50 },
    toast: null,
    newSport: { name: '', unit: 'powt.', color: COLORS[6] },
    edit: null,
    session: null, ready: !REMOTE, syncing: false,
    auth: { mode: 'login', email: '', pass: '', busy: false, msg: '', err: false }
  };
  try { const t = localStorage.getItem('halfway:tab'); if (t) ui.tab = t; } catch (e) { /* */ }

  let toastTimer = null;
  function showToast(text, err) {
    ui.toast = { text: text, err: !!err };
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast = null; render(); }, 2600);
  }

  // ---------- obliczenia ----------
  function compute() {
    const T = today(), tk = dkey(T);
    const smap = sportMap();
    const byDate = {};
    store.entries.forEach((e) => { if (smap[e.sport_id]) (byDate[e.date] = byDate[e.date] || []).push(e); });
    let streak = 0, d = byDate[tk] ? T : addDays(T, -1);
    while (byDate[dkey(d)]) { streak++; d = addDays(d, -1); }
    const keys = Object.keys(byDate).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((k) => {
      run = prev && dkey(addDays(parseKey(prev), 1)) === k ? run + 1 : 1;
      if (run > best) best = run;
      prev = k;
    });
    const monthPrefix = tk.slice(0, 7);
    const monthDays = keys.filter((k) => k.indexOf(monthPrefix) === 0).length;
    return { T: T, tk: tk, smap: smap, byDate: byDate, streak: streak, best: best, monthDays: monthDays, monthPrefix: monthPrefix };
  }

  function segs(c, k, useFilter) {
    const list = c.byDate[k] || [];
    return sports().filter((s) => {
      if (useFilter && ui.filter !== 'all' && ui.filter !== s.id) return false;
      return list.some((e) => e.sport_id === s.id);
    }).map((s) => '<span style="background:' + s.color + '"></span>').join('');
  }

  function sortedEntries(c, k) {
    const order = sports().map((s) => s.id);
    return (c.byDate[k] || []).slice().sort((a, b) => order.indexOf(a.sport_id) - order.indexOf(b.sport_id));
  }

  // ---------- widoki ----------
  function syncBadge() {
    if (!REMOTE) return '<span class="sync off"><i></i>Lokalnie</span>';
    if (!navigator.onLine) return '<button type="button" class="sync off" data-a="sync"><i></i>Offline' + (store.queue.length ? ' · ' + store.queue.length : '') + '</button>';
    if (store.queue.length || ui.syncing) return '<button type="button" class="sync pending" data-a="sync"><i></i>Synchronizuję…</button>';
    return '<button type="button" class="sync" data-a="sync" aria-label="Odśwież dane"><i></i>Zapisane</button>';
  }

  function entryRow(c, e, compact) {
    const s = c.smap[e.sport_id];
    return '<div class="entry' + (compact ? ' compact' : '') + '">' +
      '<div class="badge' + (compact ? ' s' : '') + '" style="background:' + s.color + '">' + esc(s.name.charAt(0)) + '</div>' +
      '<div style="flex:1;min-width:0"><div class="name">' + esc(s.name) + '</div>' +
      (compact ? '' : '<div class="small">' + esc(UNIT_LONG[s.unit] || s.unit) + '</div>') + '</div>' +
      '<div class="amt">' + num(e.amount) + '<small>' + esc(s.unit) + '</small></div>' +
      '<button type="button" class="icon-btn" data-a="delEntry" data-id="' + e.id + '" aria-label="Usuń wpis: ' + esc(s.name) + '">' + ICON.x + '</button>' +
      '</div>';
  }

  function viewToday(c) {
    let week = '';
    for (let i = 6; i >= 0; i--) {
      const wd = addDays(c.T, -i), wk = dkey(wd);
      week += '<div class="d' + (i === 0 ? ' today' : '') + '"><button type="button" class="t" data-a="day" data-k="' + wk + '" data-go="1" aria-label="' + esc(longDate(wd)) + '">' + segs(c, wk, false) + '</button>' + DAYS_S[wd.getDay()] + '</div>';
    }
    const list = sortedEntries(c, c.tk);
    const n = list.length;
    const left =
      '<section class="streak">' +
        '<div class="between" style="align-items:flex-end">' +
          '<div class="row"><div class="flame">' + ICON.flame + '</div><div><div class="num">' + c.streak + '</div><div class="lbl">' + (c.streak === 1 ? 'dzień z rzędu' : 'dni z rzędu') + '</div></div></div>' +
          '<div class="rec">Rekord<b>' + c.best + ' ' + plural(c.best, 'dzień', 'dni', 'dni') + '</b></div>' +
        '</div>' +
        '<div class="week">' + week + '</div>' +
      '</section>' +
      '<section class="stack-s">' +
        '<div class="between"><h2 class="h2">Twój trening</h2><div class="small" style="font-size:13px">' + n + ' ' + plural(n, 'aktywność', 'aktywności', 'aktywności') + '</div></div>' +
        (n === 0
          ? '<div class="empty"><div style="font-weight:800;font-size:16px">Dziś jeszcze nic</div><div class="muted">Wpisz pierwszy trening, żeby nie przerwać serii.</div><button type="button" class="btn mob-only" data-a="open">Dodaj trening</button></div>'
          : list.map((e) => entryRow(c, e, false)).join('')) +
      '</section>';
    return '<div class="top"><div><div class="eyebrow">' + esc(longDate(c.T)) + '</div><h1 class="h1">Dzisiaj</h1></div>' + syncBadge() + '</div>' +
      '<div class="today-grid"><div class="stack">' + left + '</div><div class="side desk-only">' + addPanel(c, 'side') + '</div></div>';
  }

  function heatWeeks() {
    const w = window.innerWidth;
    const content = w >= 900 ? Math.min(w - 240, 1080) - 80 : Math.min(w, 640) - 32;
    const avail = content - 32 - 30;
    return Math.max(8, Math.min(53, Math.floor((avail + 5) / 30)));
  }

  function viewHistory(c) {
    const weeks = heatWeeks();
    const dow = (c.T.getDay() + 6) % 7;
    const start = addDays(c.T, -dow - (weeks - 1) * 7);
    let months = '', cells = '';
    for (let w = 0; w < weeks; w++) {
      const mon = addDays(start, w * 7), prevMon = addDays(mon, -7);
      months += '<span>' + (w === 0 || mon.getMonth() !== prevMon.getMonth() ? M_SHORT[mon.getMonth()] : '') + '</span>';
    }
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(start, i), k = dkey(d), future = d > c.T;
      const sg = future ? '' : segs(c, k, true);
      const names = (c.byDate[k] || []).map((e) => c.smap[e.sport_id].name).join(', ');
      cells += '<button type="button" class="cell' + (future ? ' future' : '') + (sg ? ' has' : '') + (k === ui.selDay ? ' sel' : '') + '"' +
        (future ? ' disabled' : ' data-a="day" data-k="' + k + '"') +
        ' aria-label="' + esc(longDate(d) + ': ' + (names || 'brak treningu')) + '" title="' + esc(longDate(d) + (names ? ' – ' + names : '')) + '">' + sg + '</button>';
    }
    const filters = [{ id: 'all', name: 'Wszystko' }].concat(sports()).map((f) =>
      '<button type="button" class="pill' + (ui.filter === f.id ? ' on' : '') + '" data-a="filter" data-id="' + f.id + '">' +
      (f.color ? '<span class="dot" style="background:' + f.color + '"></span>' : '') + esc(f.name) + '</button>').join('');

    // kalendarz
    const first = new Date(ui.calY, ui.calM, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(ui.calY, ui.calM + 1, 0).getDate();
    let cal = '';
    for (let b = 0; b < lead; b++) cal += '<div></div>';
    for (let dnum = 1; dnum <= dim; dnum++) {
      const d = new Date(ui.calY, ui.calM, dnum), k = dkey(d), future = d > c.T;
      const sg = future ? '' : segs(c, k, true);
      cal += '<button type="button" class="day' + (sg ? ' has' : '') + (k === c.tk ? ' today' : '') + (k === ui.selDay ? ' sel' : '') + (future ? ' future' : '') + '"' +
        (future ? ' disabled' : ' data-a="day" data-k="' + k + '"') + ' aria-label="' + esc(longDate(d)) + '">' +
        '<span class="n">' + dnum + '</span><span class="bar">' + sg + '</span></button>';
    }

    const sel = parseKey(ui.selDay);
    const selList = sortedEntries(c, ui.selDay);

    return '<div class="top"><h1 class="h1">Ciągłość</h1>' + syncBadge() + '</div>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + c.streak + '</b><span class="small">Seria (dni)</span></div>' +
        '<div class="stat"><b>' + c.best + '</b><span class="small">Rekord serii</span></div>' +
        '<div class="stat"><b>' + c.monthDays + '</b><span class="small">Dni w ' + M_LOC[c.T.getMonth()] + '</span></div>' +
      '</div>' +
      '<div class="chips">' + filters + '</div>' +
      '<section class="card stack-s" style="gap:14px">' +
        '<div class="between"><h2 class="h2" style="font-size:19px">Ostatnie ' + weeks + ' tygodni</h2><div class="small">' + start.getDate() + ' ' + M_SHORT[start.getMonth()] + ' – ' + c.T.getDate() + ' ' + M_SHORT[c.T.getMonth()] + '</div></div>' +
        '<div class="heat-wrap"><div class="heat-days"><div></div><div>Pn</div><div>Wt</div><div>Śr</div><div>Cz</div><div>Pt</div><div>Sb</div><div>Nd</div></div>' +
          '<div class="heat-col"><div class="heat-months">' + months + '</div><div class="heat">' + cells + '</div></div></div>' +
        '<div class="legend">' + sports().map((s) => '<div><span style="background:' + s.color + '"></span>' + esc(s.name) + '</div>').join('') + '</div>' +
      '</section>' +
      '<div class="hist-grid">' +
        '<section class="card stack-s" style="padding:14px 12px 16px">' +
          '<div class="between"><button type="button" class="icon-btn" style="color:var(--ink)" data-a="prevM" aria-label="Poprzedni miesiąc">' + ICON.left + '</button>' +
          '<h2 class="h2" style="font-size:19px">' + M_NOM[ui.calM] + ' ' + ui.calY + '</h2>' +
          '<button type="button" class="icon-btn" style="color:var(--ink)" data-a="nextM" aria-label="Następny miesiąc">' + ICON.right + '</button></div>' +
          '<div class="cal-head"><div>Pn</div><div>Wt</div><div>Śr</div><div>Cz</div><div>Pt</div><div>Sb</div><div>Nd</div></div>' +
          '<div class="cal">' + cal + '</div>' +
        '</section>' +
        '<section class="stack-s">' +
          '<h2 class="h2">' + (ui.selDay === c.tk ? 'Dziś' : esc(longDate(sel))) + '</h2>' +
          (selList.length ? selList.map((e) => entryRow(c, e, true)).join('') : '<div class="muted">Brak treningu tego dnia.</div>') +
          (sel <= c.T ? '<button type="button" class="btn ghost" data-a="open" data-date="' + ui.selDay + '">Dopisz trening do tego dnia</button>' : '') +
        '</section>' +
      '</div>';
  }

  function sportForm() {
    const e = ui.edit;
    const f = e || ui.newSport;
    const pre = e ? 'edit' : 'new';
    const units = UNITS.map((u) => '<button type="button" class="pill' + (f.unit === u ? ' on' : '') + '" data-a="formUnit" data-v="' + u + '">' + u + '</button>').join('');
    const cols = COLORS.map((col, i) => '<button type="button" class="swatch' + (f.color === col ? ' on' : '') + '" style="background:' + col + ';--c:' + col + '" data-a="formColor" data-v="' + col + '" aria-label="Kolor ' + (i + 1) + '"></button>').join('');
    return '<section class="card stack" id="sport-form" style="gap:16px">' +
      '<div class="between"><h2 class="h2">' + (e ? 'Edytuj sport' : 'Nowy sport') + '</h2>' +
      (e ? '<button type="button" class="close" data-a="cancelEdit" aria-label="Anuluj">' + ICON.x + '</button>' : '') + '</div>' +
      '<div class="field"><label for="in-' + pre + '-name">Nazwa</label><input class="input" id="in-' + pre + '-name" data-in="formName" type="text" placeholder="np. Pływanie" maxlength="40" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><span class="lab">Jednostka</span><div class="seg">' + units + '</div></div>' +
      '<div class="field"><span class="lab">Kolor</span><div class="swatches">' + cols + '</div></div>' +
      (e
        ? '<div class="stack-s"><button type="button" class="btn" data-a="saveEdit">Zapisz zmiany</button>' +
          '<button type="button" class="btn ' + (e.confirm ? 'danger' : 'soft') + '" data-a="delSport">' + (e.confirm ? 'Na pewno? Usunie też wszystkie wpisy tego sportu' : 'Usuń sport') + '</button></div>'
        : '<button type="button" class="btn" data-a="addSport">Dodaj sport</button>') +
      '</section>';
  }

  function viewSports(c) {
    const rows = sports().map((s) => {
      const es = store.entries.filter((e) => e.sport_id === s.id && e.date.indexOf(c.monthPrefix) === 0);
      const total = es.reduce((a, e) => a + Number(e.amount), 0);
      return '<button type="button" class="sport-row" data-a="editSport" data-id="' + s.id + '" aria-label="Edytuj ' + esc(s.name) + '">' +
        '<span class="badge" style="width:42px;height:42px;border-radius:12px;font-size:19px;background:' + s.color + '">' + esc(s.name.charAt(0)) + '</span>' +
        '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px"><span style="font-weight:800;font-size:15px">' + esc(s.name) + '</span>' +
        '<span class="small">' + es.length + ' ' + plural(es.length, 'trening', 'treningi', 'treningów') + ' w ' + M_LOC[c.T.getMonth()] + '</span></span>' +
        '<span class="tot"><b>' + num(total) + '</b><span class="small">' + esc(s.unit) + '</span></span></button>';
    }).join('');
    const email = ui.session ? ui.session.user.email : '';
    const account = '<section class="card stack-s">' +
      '<h2 class="h2" style="font-size:19px">Konto</h2>' +
      (REMOTE
        ? '<div class="muted">Zalogowany jako <b style="color:var(--ink)">' + esc(email) + '</b></div><div class="muted">Dane synchronizują się między iPhone\'em a Makiem.</div>'
        : '<div class="banner">Tryb lokalny – dane są tylko na tym urządzeniu. Uzupełnij config.js danymi Supabase, żeby włączyć synchronizację.</div>') +
      '<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:4px">' +
        '<button type="button" class="btn soft" data-a="exportCsv">Eksport CSV</button>' +
        (REMOTE ? '<button type="button" class="btn soft" data-a="logout">Wyloguj</button>' : '') +
      '</div></section>';
    return '<div class="top"><div class="stack-s" style="gap:6px"><h1 class="h1">Sporty</h1><div class="muted">Każdy sport ma swój kolor – tak widzisz go w kafelkach. Kliknij, żeby edytować.</div></div>' + syncBadge() + '</div>' +
      '<div class="sports-grid"><div class="stack"><section class="card" style="padding:6px 14px">' + rows + '</section>' + account + '</div><div>' + sportForm() + '</div></div>';
  }

  function addPanel(c, where) {
    const list = sports();
    const d = ui.draft;
    let sp = c.smap[d.sportId];
    if (!sp) { sp = c.smap[ui.lastSport] || list[0]; if (sp) d.sportId = sp.id; }
    if (!sp) return '<div class="panel"><div class="muted">Najpierw dodaj sport w zakładce Sporty.</div></div>';
    const yk = dkey(addDays(c.T, -1));
    const datePill = (label, k) => '<button type="button" class="pill' + (d.date === k ? ' on' : '') + '" data-a="pickDate" data-v="' + k + '">' + label + '</button>';
    const other = d.date !== c.tk && d.date !== yk;
    const tiles = list.map((s) => {
      const on = s.id === sp.id;
      return '<button type="button" class="stile" data-a="pickSport" data-id="' + s.id + '" aria-pressed="' + on + '"' +
        (on ? ' style="background:' + s.color + '1F;box-shadow:inset 0 0 0 2px ' + s.color + '"' : '') + '>' +
        '<span class="sw" style="background:' + s.color + '"></span><span class="nm">' + esc(s.name) + '</span></button>';
    }).join('');
    const quick = (QUICK[sp.unit] || [5, 10, 20, 50]).map((v) => '<button type="button" class="pill' + (d.amount === v ? ' on' : '') + '" data-a="quick" data-v="' + v + '">' + v + '</button>').join('');
    return '<div class="panel">' +
      '<div class="between"><h2 class="title">Nowy trening</h2>' + (where === 'sheet' ? '<button type="button" class="close" data-a="closeSheet" aria-label="Zamknij">' + ICON.x + '</button>' : '') + '</div>' +
      '<div class="row" style="flex-wrap:wrap;gap:8px">' + datePill('Dziś', c.tk) + datePill('Wczoraj', yk) +
        '<label class="pill datepick' + (other ? ' on' : '') + '">' + (other ? parseKey(d.date).getDate() + ' ' + M_SHORT[parseKey(d.date).getMonth()] : 'Inna data') +
          '<input type="date" data-ch="date" max="' + c.tk + '" value="' + d.date + '" aria-label="Wybierz inną datę"></label></div>' +
      '<div class="field"><span class="lab">Co trenowałeś?</span><div class="sgrid">' + tiles + '</div></div>' +
      '<div class="stack-s">' +
        '<div class="stepper"><button type="button" class="pm" data-a="minus" aria-label="Mniej">' + ICON.minus + '</button>' +
          '<div style="display:flex;align-items:baseline;gap:4px"><input id="amt-' + where + '" data-in="amount" type="number" inputmode="decimal" min="0" step="any" value="' + d.amount + '" aria-label="Ilość" style="color:' + sp.color + ';width:' + amtWidth(d.amount) + '"><span class="u">' + esc(sp.unit) + '</span></div>' +
          '<button type="button" class="pm" data-a="plus" aria-label="Więcej">' + ICON.plus + '</button></div>' +
        '<div class="quick">' + quick + '</div>' +
      '</div>' +
      '<button type="button" class="btn big" data-a="save"><span style="width:12px;height:12px;border-radius:4px;background:' + sp.color + '"></span>Zapisz trening</button>' +
      '</div>';
  }

  function amtWidth(v) { return (Math.max(1, String(v).length) * 0.62 + 0.1).toFixed(2) + 'em'; }

  function viewLogin() {
    const a = ui.auth, login = a.mode === 'login';
    return '<div class="login"><form class="box" data-submit="auth" novalidate>' +
      '<div class="logo"><span style="background:#DC3B41"></span><span style="background:#3E63DD"></span><span style="background:#E0590A"></span><span style="background:#2B9358"></span></div>' +
      '<div><h1 class="h1">HalfWay</h1><div class="muted">Twój dziennik treningów</div></div>' +
      '<div class="field"><label for="in-email">E-mail</label><input class="input" id="in-email" data-in="email" type="email" autocomplete="email" autocapitalize="off" value="' + esc(a.email) + '"></div>' +
      '<div class="field"><label for="in-pass">Hasło' + (login ? '' : ' (min. 6 znaków)') + '</label><input class="input" id="in-pass" data-in="pass" type="password" autocomplete="' + (login ? 'current-password' : 'new-password') + '" value="' + esc(a.pass) + '"></div>' +
      (a.msg ? '<div class="msg' + (a.err ? ' err' : '') + '" role="status">' + esc(a.msg) + '</div>' : '') +
      '<button type="submit" class="btn big"' + (a.busy ? ' disabled' : '') + '>' + (a.busy ? 'Chwila…' : (login ? 'Zaloguj się' : 'Załóż konto')) + '</button>' +
      '<button type="button" class="link-btn" data-a="authMode">' + (login ? 'Nie masz konta? Załóż je' : 'Masz już konto? Zaloguj się') + '</button>' +
      '</form></div>';
  }

  function viewApp() {
    const c = compute();
    const tab = ui.tab;
    const body = tab === 'history' ? viewHistory(c) : tab === 'sports' ? viewSports(c) : viewToday(c);
    const nav = [['today', 'Dziś', ICON.cal], ['history', 'Ciągłość', ICON.grid], ['sports', 'Sporty', ICON.list]];
    const sidebar = '<aside class="sidebar"><div class="brand"><span class="logo"><span style="background:#DC3B41"></span><span style="background:#3E63DD"></span><span style="background:#E0590A"></span><span style="background:#2B9358"></span></span>HalfWay</div>' +
      nav.map((n) => '<button type="button" class="nav' + (tab === n[0] ? ' on' : '') + '" data-a="tab" data-v="' + n[0] + '">' + n[2] + n[1] + '</button>').join('') +
      '<div class="foot">' + (tab !== 'today' ? '<button type="button" class="btn" data-a="open">' + ICON.plus + 'Dodaj trening</button>' : '') + '</div></aside>';
    const tabbar = '<nav class="tabbar" aria-label="Nawigacja">' +
      nav.map((n) => '<button type="button" class="' + (tab === n[0] ? 'on' : '') + '" data-a="tab" data-v="' + n[0] + '">' + n[2] + n[1] + '</button>').join('') + '</nav>';
    const fab = tab !== 'sports' ? '<button type="button" class="fab" data-a="open" aria-label="Dodaj trening">' + ICON.plus + '</button>' : '';
    const sheet = ui.sheet
      ? '<div class="overlay' + (ui.sheetAnim ? ' anim' : '') + '"><button type="button" class="backdrop" data-a="closeSheet" aria-label="Zamknij"></button><div class="sheet" role="dialog" aria-label="Nowy trening"><div class="grab"></div>' + addPanel(c, 'sheet') + '</div></div>'
      : '';
    return sidebar + '<main class="main stack">' + body + '</main>' + fab + tabbar + sheet + toastHtml();
  }

  function toastHtml() {
    if (!ui.toast) return '';
    return '<div class="toast' + (ui.toast.err ? ' err' : '') + '" role="status"><span class="ok">' + (ui.toast.err ? ICON.x.replace(/currentColor/g, '#fff').replace(/18/g, '12') : ICON.check) + '</span>' + esc(ui.toast.text) + '</div>';
  }

  // ---------- render ----------
  const root = document.getElementById('app');
  function render() {
    const ae = document.activeElement;
    const id = ae && ae.id;
    let s1 = null, s2 = null;
    try { s1 = ae.selectionStart; s2 = ae.selectionEnd; } catch (e) { /* */ }
    if (REMOTE && !ui.ready) root.innerHTML = '<div class="login"><div class="muted">Ładowanie…</div></div>';
    else if (REMOTE && !ui.session) root.innerHTML = viewLogin() + toastHtml();
    else root.innerHTML = viewApp();
    if (id) {
      const el = document.getElementById(id);
      if (el) { el.focus({ preventScroll: true }); try { if (s1 != null) el.setSelectionRange(s1, s2); } catch (e) { /* */ } }
    }
  }

  // ---------- akcje ----------
  function openSheet(date) {
    const T = today();
    const k = date && parseKey(date) <= T ? date : dkey(T);
    ui.draft.date = k;
    const sp = sportMap()[ui.draft.sportId] || sportMap()[ui.lastSport] || sports()[0];
    if (sp) { ui.draft.sportId = sp.id; ui.draft.amount = (QUICK[sp.unit] || [10, 10])[1]; }
    ui.sheet = true;
    ui.sheetAnim = true;
    render();
    ui.sheetAnim = false;
  }

  const A = {
    tab(d) { ui.tab = d.v; ui.edit = null; try { localStorage.setItem('halfway:tab', d.v); } catch (e) { /* */ } render(); window.scrollTo(0, 0); },
    open(d) { openSheet(d.date); },
    closeSheet() { ui.sheet = false; render(); },
    pickDate(d) { ui.draft.date = d.v; render(); },
    pickSport(d) {
      const s = sportMap()[d.id];
      if (!s) return;
      ui.draft.sportId = s.id;
      ui.draft.amount = (QUICK[s.unit] || [10, 10])[1];
      render();
    },
    minus() { const s = sportMap()[ui.draft.sportId]; ui.draft.amount = Math.max(0, Math.round((ui.draft.amount - (STEP[s && s.unit] || 1)) * 10) / 10); render(); },
    plus() { const s = sportMap()[ui.draft.sportId]; ui.draft.amount = Math.round((ui.draft.amount + (STEP[s && s.unit] || 1)) * 10) / 10; render(); },
    quick(d) { ui.draft.amount = Number(d.v); render(); },
    save() {
      const s = sportMap()[ui.draft.sportId];
      const amt = Number(ui.draft.amount);
      if (!s) return;
      if (!(amt > 0)) { showToast('Wpisz ilość większą od zera', true); return; }
      const date = ui.draft.date;
      ui.lastSport = s.id;
      ui.sheet = false;
      ui.selDay = date;
      const dd = parseKey(date); ui.calY = dd.getFullYear(); ui.calM = dd.getMonth();
      addEntry(date, s.id, amt);
      showToast('Zapisano: ' + s.name + ' · ' + num(amt) + ' ' + s.unit);
    },
    delEntry(d) { deleteEntry(d.id); showToast('Usunięto wpis'); },
    filter(d) { ui.filter = d.id; render(); },
    day(d) {
      ui.selDay = d.k;
      const dd = parseKey(d.k); ui.calY = dd.getFullYear(); ui.calM = dd.getMonth();
      if (d.go) { ui.tab = 'history'; render(); window.scrollTo(0, 0); } else render();
    },
    prevM() { ui.calM--; if (ui.calM < 0) { ui.calM = 11; ui.calY--; } render(); },
    nextM() { ui.calM++; if (ui.calM > 11) { ui.calM = 0; ui.calY++; } render(); },
    formUnit(d) { (ui.edit || ui.newSport).unit = d.v; render(); },
    formColor(d) { (ui.edit || ui.newSport).color = d.v; render(); },
    addSport() {
      const n = ui.newSport;
      const name = n.name.trim();
      if (!name) { showToast('Podaj nazwę sportu', true); return; }
      addSport(name, n.color, n.unit);
      const used = store.sports.map((s) => s.color);
      ui.newSport = { name: '', unit: n.unit, color: COLORS.find((col) => used.indexOf(col) < 0) || COLORS[0] };
      showToast('Dodano sport: ' + name);
    },
    editSport(d) {
      const s = sportMap()[d.id];
      if (!s) return;
      ui.edit = { id: s.id, name: s.name, unit: s.unit, color: s.color, confirm: false };
      render();
      const f = document.getElementById('sport-form');
      if (f && window.innerWidth < 900) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    cancelEdit() { ui.edit = null; render(); },
    saveEdit() {
      const e = ui.edit;
      const name = e.name.trim();
      if (!name) { showToast('Podaj nazwę sportu', true); return; }
      ui.edit = null;
      updateSport(e.id, { name: name, unit: e.unit, color: e.color });
      showToast('Zapisano zmiany');
    },
    delSport() {
      const e = ui.edit;
      if (!e.confirm) { e.confirm = true; render(); return; }
      ui.edit = null;
      if (ui.filter === e.id) ui.filter = 'all';
      deleteSport(e.id);
      showToast('Usunięto sport');
    },
    exportCsv() {
      const m = sportMap();
      const rows = [['data', 'sport', 'ilosc', 'jednostka']].concat(
        store.entries.slice().sort((a, b) => (a.date < b.date ? -1 : 1))
          .filter((e) => m[e.sport_id])
          .map((e) => [e.date, m[e.sport_id].name, String(e.amount).replace('.', ','), m[e.sport_id].unit]));
      const csv = '﻿' + rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'halfway-' + dkey(today()) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    },
    sync() { flush().then(pull); },
    async logout() {
      await sb.auth.signOut();
      store = emptyStore(); saveLocal();
      ui.auth = { mode: 'login', email: '', pass: '', busy: false, msg: '', err: false };
      render();
    },
    authMode() { ui.auth.mode = ui.auth.mode === 'login' ? 'signup' : 'login'; ui.auth.msg = ''; render(); }
  };

  const IN = {
    amount(v, el) { ui.draft.amount = parseFloat(String(v).replace(',', '.')) || 0; if (el) el.style.width = amtWidth(v); },
    formName(v) { (ui.edit || ui.newSport).name = v; },
    email(v) { ui.auth.email = v.trim(); },
    pass(v) { ui.auth.pass = v; }
  };
  const CH = {
    date(v) { if (v && parseKey(v) <= today()) ui.draft.date = v; render(); }
  };

  const AUTH_ERRORS = {
    'Invalid login credentials': 'Zły e-mail lub hasło.',
    'Email not confirmed': 'Najpierw potwierdź e-mail – kliknij link, który przyszedł na skrzynkę.',
    'User already registered': 'Takie konto już istnieje – zaloguj się.',
    'Password should be at least 6 characters.': 'Hasło musi mieć co najmniej 6 znaków.'
  };
  async function submitAuth() {
    const a = ui.auth;
    if (!a.email || !a.pass) { a.msg = 'Podaj e-mail i hasło.'; a.err = true; render(); return; }
    a.busy = true; a.msg = ''; render();
    let res;
    if (a.mode === 'login') {
      res = await sb.auth.signInWithPassword({ email: a.email, password: a.pass });
    } else {
      res = await sb.auth.signUp({ email: a.email, password: a.pass, options: { emailRedirectTo: location.origin + location.pathname } });
    }
    a.busy = false;
    if (res.error) {
      a.err = true; a.msg = AUTH_ERRORS[res.error.message] || res.error.message;
    } else if (a.mode === 'signup' && !res.data.session) {
      a.err = false; a.mode = 'login';
      a.msg = 'Wysłaliśmy link na ' + a.email + '. Kliknij go, a potem zaloguj się tutaj.';
    } else {
      a.pass = ''; a.msg = '';
    }
    render();
  }

  // ---------- zdarzenia ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });
  document.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.in; if (k && IN[k]) IN[k](e.target.value, e.target); });
  document.addEventListener('change', (e) => { const k = e.target.dataset && e.target.dataset.ch; if (k && CH[k]) CH[k](e.target.value); });
  document.addEventListener('submit', (e) => { if (e.target.dataset.submit === 'auth') { e.preventDefault(); submitAuth(); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.sheet) { ui.sheet = false; render(); }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.in === 'amount') { e.preventDefault(); A.save(); }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.in === 'formName') { e.preventDefault(); ui.edit ? A.saveEdit() : A.addSport(); }
  });
  document.addEventListener('click', (e) => {
    const inp = e.target.closest && e.target.closest('.datepick input');
    if (inp && inp.showPicker) { try { inp.showPicker(); } catch (er) { /* iOS otwiera sam */ } }
  });
  let rz = null;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 150); });
  window.addEventListener('online', () => { flush().then(pull); });
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { render(); pull(); } });

  // ---------- start ----------
  function setSession(session) {
    const prev = ui.session && ui.session.user.id;
    ui.session = session;
    ui.ready = true;
    if (session) {
      if (store.owner !== session.user.id) { store = emptyStore(session.user.id); saveLocal(); }
      if (prev !== session.user.id) setTimeout(pull, 0);
    }
    render();
  }

  if (REMOTE) {
    render();
    sb.auth.getSession().then((r) => setSession(r.data.session));
    sb.auth.onAuthStateChange((ev, session) => { setSession(session); });
  } else {
    if (store.owner !== 'local') { store = emptyStore('local'); }
    if (!store.sports.length) seedDefaults(); else render();
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* */ });
  }
})();
