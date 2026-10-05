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

  // kolory sprawdzone walidatorem palety (rozróżnialne także przy daltonizmie, w parze z nazwami)
  const C_GREEN = '#3DAA6A', C_BLUE = '#3E63DD', C_GOLD = '#B8860B', C_RED = '#DC3B41', C_PURPLE = '#A23CB8';
  const COLORS = [C_GREEN, C_BLUE, C_GOLD, C_RED, C_PURPLE, '#0D8F99', '#E0590A', '#C2357F'];
  // x10 = wpisujesz liczbę dziesiątek (4 = 40 powtórzeń); tak = trening był (min. 30 min)
  const UNITS = ['x10', 'tak', 'powt.', 'min', 'km'];
  const UNIT_LABEL = { 'x10': 'Liczba ×10', 'tak': 'Był / nie był', 'powt.': 'Powtórzenia', 'min': 'Minuty', 'km': 'Kilometry' };
  const QUICK = { 'x10': [3, 4, 5, 10], 'powt.': [10, 25, 50, 100], 'min': [30, 45, 60, 90], 'km': [3, 5, 10, 20] };
  const STEP = { 'x10': 1, 'powt.': 5, 'min': 5, 'km': 1 };
  const UNIT_LONG = { 'x10': 'powtórzenia', 'tak': 'trening min. 30 min', 'powt.': 'powtórzenia', 'min': 'minuty', 'km': 'kilometry' };
  const MIN_CHECK = 'min. 30 min';
  const DEFAULT_SPORTS = [
    { name: 'Pompki', color: C_GREEN, unit: 'x10' },
    { name: 'Przysiady', color: C_BLUE, unit: 'x10' },
    { name: 'Koszykówka', color: C_GOLD, unit: 'tak' },
    { name: 'Piłka nożna', color: C_RED, unit: 'tak' },
    { name: 'Rower', color: C_PURPLE, unit: 'tak' }
  ];
  const isCheck = (s) => s && s.unit === 'tak';
  // wartość do pokazania: { v: liczba lub '', u: jednostka }
  function shown(s, amount) {
    if (s.unit === 'x10') return { v: num(Math.round(amount * 10 * 10) / 10), u: 'powt.' };
    if (s.unit === 'tak') return { v: '', u: '' };
    return { v: num(amount), u: s.unit };
  }
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
    scale: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.5 9.5a5 5 0 0 1 7 0"/><path d="M12 9.8l1.3-2"/></svg>',
    tick: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
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
  const emptyStore = (owner) => ({ owner: owner || null, sports: [], entries: [], weights: [], queue: [] });
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
  const pushOp = (op) => { if (REMOTE) store.queue.push(op); };

  // jednorazowa zmiana sportów (v2): pompki/przysiady ×10, gry zespołowe i rower = był/nie był, bez biegania
  function migrateV2() {
    const by = (n) => store.sports.find((x) => x.name.trim().toLowerCase() === n);
    const p = by('pompki'), q = by('przysiady');
    if (!((p && p.unit === 'powt.') || (q && q.unit === 'powt.'))) return false;
    const change = (sp, patch) => {
      if (!sp) return;
      const old = sp.unit;
      Object.assign(sp, patch);
      pushOp({ t: 'sports', op: 'upsert', row: Object.assign({}, sp) });
      store.entries.forEach((e) => {
        if (e.sport_id !== sp.id) return;
        let a = e.amount;
        if (patch.unit === 'x10' && old === 'powt.') a = Math.max(0.1, Math.round(e.amount) / 10);
        if (patch.unit === 'tak') a = 1;
        if (a !== e.amount) { e.amount = a; pushOp({ t: 'entries', op: 'upsert', row: Object.assign({}, e) }); }
      });
    };
    const run = by('bieganie');
    if (run) {
      store.sports = store.sports.filter((x) => x.id !== run.id);
      store.entries = store.entries.filter((e) => e.sport_id !== run.id);
      pushOp({ t: 'sports', op: 'delete', id: run.id });
    }
    change(p, { color: C_GREEN, unit: 'x10' });
    change(q, { unit: 'x10' });
    change(by('koszykówka'), { color: C_GOLD, unit: 'tak' });
    change(by('piłka nożna'), { color: C_RED, unit: 'tak' });
    change(by('rower'), { color: C_PURPLE, unit: 'tak' });
    saveLocal();
    return true;
  }

  // ---------- waga ----------
  function setWeight(date, kg) {
    const ex = store.weights.find((w) => w.date === date);
    const row = ex ? Object.assign(ex, { kg: kg }) : { id: uuid(), date: date, kg: kg };
    if (!ex) store.weights.push(row);
    enqueue({ t: 'weights', op: 'upsert', row: Object.assign({}, row) });
  }
  function deleteWeight(id) {
    store.weights = store.weights.filter((w) => w.id !== id);
    enqueue({ t: 'weights', op: 'delete', id: id });
  }
  const weightsSorted = () => store.weights.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const kgFmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));

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
    const parked = [];
    try {
      while (store.queue.length) {
        const op = store.queue[0];
        const res = op.op === 'upsert'
          ? await sb.from(op.t).upsert(op.row)
          : await sb.from(op.t).delete().eq('id', op.id);
        if (res.error && /PGRST205|42P01/.test(res.error.code || '')) {
          // tabela jeszcze nie istnieje (np. waga przed uruchomieniem SQL) – zachowaj wpis na później
          ui.weightsMissing = true; parked.push(store.queue.shift()); continue;
        }
        if (res.error) {
          if (isNetworkError(res.error)) break;
          console.error('HalfWay sync', res.error);
          showToast('Błąd zapisu: ' + res.error.message, true);
        }
        store.queue.shift();
        saveLocal();
      }
    } catch (e) { /* brak sieci – spróbujemy później */ }
    if (parked.length) { store.queue = parked.concat(store.queue); saveLocal(); }
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
    const blocking = () => store.queue.some((op) => !(op.t === 'weights' && ui.weightsMissing));
    if (store.queue.length) { await flush(); if (blocking()) return; }
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
      const w = await sb.from('weights').select('id,date,kg').order('date');
      ui.weightsMissing = !!w.error;
      store.sports = sp.data;
      store.entries = entries.map((e) => Object.assign({}, e, { amount: Number(e.amount) }));
      if (!w.error) store.weights = w.data.map((x) => Object.assign({}, x, { kg: Number(x.kg) }));
      applyQueue();
      saveLocal();
      ui.syncing = false;
      if (!store.sports.length) seedDefaults();
      else if (migrateV2()) { render(); flush(); }
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
    draft: { date: dkey(t0), sportId: null, amount: 4 },
    wDraft: { date: dkey(t0), kg: null }, wSel: null, weightsMissing: false,
    toast: null,
    newSport: { name: '', unit: 'x10', color: COLORS[5] },
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
      (compact ? '' : '<div class="small">' + esc(s.unit === 'x10' ? num(e.amount) + ' × 10' : (UNIT_LONG[s.unit] || s.unit)) + '</div>') + '</div>' +
      (isCheck(s)
        ? '<div class="done" style="--c:' + s.color + '">' + ICON.tick + 'Był</div>'
        : '<div class="amt">' + shown(s, e.amount).v + '<small>' + esc(shown(s, e.amount).u) + '</small></div>') +
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
      '</section>' + weightCard(c) +
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
    const units = UNITS.map((u) => '<button type="button" class="pill' + (f.unit === u ? ' on' : '') + '" data-a="formUnit" data-v="' + u + '">' + UNIT_LABEL[u] + '</button>').join('');
    const cols = COLORS.map((col, i) => '<button type="button" class="swatch' + (f.color === col ? ' on' : '') + '" style="background:' + col + ';--c:' + col + '" data-a="formColor" data-v="' + col + '" aria-label="Kolor ' + (i + 1) + '"></button>').join('');
    return '<section class="card stack" id="sport-form" style="gap:16px">' +
      '<div class="between"><h2 class="h2">' + (e ? 'Edytuj sport' : 'Nowy sport') + '</h2>' +
      (e ? '<button type="button" class="close" data-a="cancelEdit" aria-label="Anuluj">' + ICON.x + '</button>' : '') + '</div>' +
      '<div class="field"><label for="in-' + pre + '-name">Nazwa</label><input class="input" id="in-' + pre + '-name" data-in="formName" type="text" placeholder="np. Pływanie" maxlength="40" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><span class="lab">Jak liczysz</span><div class="seg wrap">' + units + '</div>' +
        '<div class="small" style="font-weight:600">' + ({ x10: 'Wpisujesz liczbę dziesiątek: 4 = 40 powtórzeń.', tak: 'Odhaczasz, że trening był (' + MIN_CHECK + ').' }[f.unit] || '') + '</div></div>' +
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
      const sum = es.reduce((a, e) => a + Number(e.amount), 0);
      const tot = isCheck(s) ? { v: num(es.length), u: plural(es.length, 'raz', 'razy', 'razy') } : shown(s, sum);
      return '<button type="button" class="sport-row" data-a="editSport" data-id="' + s.id + '" aria-label="Edytuj ' + esc(s.name) + '">' +
        '<span class="badge" style="width:42px;height:42px;border-radius:12px;font-size:19px;background:' + s.color + '">' + esc(s.name.charAt(0)) + '</span>' +
        '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px"><span style="font-weight:800;font-size:15px">' + esc(s.name) + '</span>' +
        '<span class="small">' + es.length + ' ' + plural(es.length, 'trening', 'treningi', 'treningów') + ' w ' + M_LOC[c.T.getMonth()] + '</span></span>' +
        '<span class="tot"><b>' + tot.v + '</b><span class="small">' + esc(tot.u) + '</span></span></button>';
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
    const chk = isCheck(sp);
    const already = chk && (store.entries || []).some((e) => e.sport_id === sp.id && e.date === d.date);
    const quick = (QUICK[sp.unit] || [5, 10, 20, 50]).map((v) => '<button type="button" class="pill' + (d.amount === v ? ' on' : '') + '" data-a="quick" data-v="' + v + '">' + v + '</button>').join('');
    return '<div class="panel">' +
      '<div class="between"><h2 class="title">Nowy trening</h2>' + (where === 'sheet' ? '<button type="button" class="close" data-a="closeSheet" aria-label="Zamknij">' + ICON.x + '</button>' : '') + '</div>' +
      '<div class="row" style="flex-wrap:wrap;gap:8px">' + datePill('Dziś', c.tk) + datePill('Wczoraj', yk) +
        '<label class="pill datepick' + (other ? ' on' : '') + '">' + (other ? parseKey(d.date).getDate() + ' ' + M_SHORT[parseKey(d.date).getMonth()] : 'Inna data') +
          '<input type="date" data-ch="date" max="' + c.tk + '" value="' + d.date + '" aria-label="Wybierz inną datę"></label></div>' +
      '<div class="field"><span class="lab">Co trenowałeś?</span><div class="sgrid">' + tiles + '</div></div>' +
      (chk
        ? '<div class="checkbox-info" style="--c:' + sp.color + '"><span class="ci">' + ICON.tick + '</span><div><b>' + (already ? 'Już odhaczone tego dnia' : 'Trening się odbył?') + '</b>' +
          '<div>Odhacz, jeśli trenowałeś ' + MIN_CHECK + '.</div></div></div>'
        : '<div class="stack-s">' +
          '<div class="stepper"><button type="button" class="pm" data-a="minus" aria-label="Mniej">' + ICON.minus + '</button>' +
            '<div style="display:flex;align-items:baseline;gap:4px"><input id="amt-' + where + '" data-in="amount" type="number" inputmode="decimal" min="0" step="any" value="' + d.amount + '" aria-label="Ilość" style="color:' + sp.color + ';width:' + amtWidth(d.amount) + '"><span class="u">' + (sp.unit === 'x10' ? '× 10' : esc(sp.unit)) + '</span></div>' +
            '<button type="button" class="pm" data-a="plus" aria-label="Więcej">' + ICON.plus + '</button></div>' +
          (sp.unit === 'x10' ? '<div class="x10hint">= <b>' + num(Math.round(d.amount * 100) / 10) + '</b> powtórzeń</div>' : '') +
          '<div class="quick">' + quick + '</div>' +
        '</div>') +
      '<button type="button" class="btn big" data-a="save"' + (already ? ' disabled' : '') + '><span style="width:12px;height:12px;border-radius:4px;background:' + sp.color + '"></span>' + (chk ? 'Odhacz: ' + esc(sp.name) : 'Zapisz trening') + '</button>' +
      '</div>';
  }

  function amtWidth(v) { return (Math.max(1, String(v).length) * 0.62 + 0.1).toFixed(2) + 'em'; }

  const lastKg = () => { const w = weightsSorted(); return w.length ? w[w.length - 1].kg : null; };

  function weightNeeded(c) {
    // koniec weekendu: sobota, niedziela, a w poniedziałek przypomnienie za miniony tydzień
    const dow = c.T.getDay();
    if (dow !== 6 && dow !== 0 && dow !== 1) return null;
    const refDay = dow === 1 ? addDays(c.T, -1) : c.T;
    const mon = dkey(mondayOf(refDay)), sun = dkey(addDays(mondayOf(refDay), 6));
    const has = store.weights.some((w) => w.date >= mon && w.date <= sun);
    return has ? null : { date: dkey(refDay), late: dow === 1 };
  }

  function weightForm(c, compact, sfx) {
    const d = ui.wDraft;
    const base = d.kg != null ? d.kg : (lastKg() || '');
    const yk = dkey(addDays(c.T, -1));
    const other = d.date !== c.tk && d.date !== yk;
    const pill = (label, k) => '<button type="button" class="pill' + (d.date === k ? ' on' : '') + '" data-a="wPickDate" data-v="' + k + '">' + label + '</button>';
    const exists = store.weights.find((w) => w.date === d.date);
    return '<div class="stack-s" style="gap:14px">' +
      (compact ? '' : '<div class="row" style="flex-wrap:wrap;gap:8px">' + pill('Dziś', c.tk) + pill('Wczoraj', yk) +
        '<label class="pill datepick' + (other ? ' on' : '') + '">' + (other ? parseKey(d.date).getDate() + ' ' + M_SHORT[parseKey(d.date).getMonth()] : 'Inna data') +
        '<input type="date" data-ch="wdate" max="' + c.tk + '" value="' + d.date + '" aria-label="Wybierz datę pomiaru"></label></div>') +
      '<div class="stepper"><button type="button" class="pm" data-a="wMinus" aria-label="Mniej o 0,1 kg">' + ICON.minus + '</button>' +
        '<div style="display:flex;align-items:baseline;gap:6px"><input id="wkg-' + sfx + '" data-in="wkg" type="text" inputmode="decimal" placeholder="82,4" value="' + (base === '' ? '' : kgFmt(base)) + '" aria-label="Waga w kg" style="width:3.2em"><span class="u">kg</span></div>' +
        '<button type="button" class="pm" data-a="wPlus" aria-label="Więcej o 0,1 kg">' + ICON.plus + '</button></div>' +
      '<button type="button" class="btn big" data-a="saveWeight">' + (exists ? 'Zaktualizuj wagę' : 'Zapisz wagę') + '</button>' +
      '</div>';
  }

  function weightCard(c) {
    const need = weightNeeded(c);
    if (need) {
      ui.wDraft.date = ui.wDraft.date === c.tk || ui.wDraft.date === need.date ? need.date : ui.wDraft.date;
      return '<section class="card stack-s weigh-card" style="gap:12px">' +
        '<div class="row"><span class="wico">' + ICON.scale + '</span><div><div style="font-weight:800;font-size:16px">' + (need.late ? 'Zapisz wagę z weekendu' : 'Koniec weekendu – czas na ważenie') + '</div>' +
        '<div class="muted" style="font-size:13px">Raz w tygodniu, najlepiej rano na czczo.</div></div></div>' +
        weightForm(c, true, 'today') + '</section>';
    }
    const w = weightsSorted();
    if (!w.length) return '';
    const last = w[w.length - 1], prev = w[w.length - 2];
    const diff = prev ? last.kg - prev.kg : null;
    return '<button type="button" class="card weigh-mini" data-a="tab" data-v="weight">' +
      '<span class="wico">' + ICON.scale + '</span><span style="flex:1;text-align:left"><span class="small" style="display:block">Waga · ' + parseKey(last.date).getDate() + ' ' + M_SHORT[parseKey(last.date).getMonth()] + '</span>' +
      '<b style="font-family:var(--display);font-size:22px">' + kgFmt(last.kg) + ' kg</b></span>' +
      (diff != null ? '<span class="delta">' + (diff > 0 ? '+' : diff < 0 ? '−' : '±') + kgFmt(Math.abs(diff)) + ' kg</span>' : '') + ICON.right + '</button>';
  }

  function weightChart(w) {
    const pts = w.slice(-26);
    if (pts.length < 2) return '<div class="muted">Wykres pojawi się po drugim pomiarze.</div>';
    const W = Math.max(280, Math.min(window.innerWidth >= 900 ? Math.min(window.innerWidth - 240, 1080) - 80 - 400 - 28 - 36 : Math.min(window.innerWidth, 640) - 64, 900));
    const H = 190, padL = 40, padR = 52, padT = 18, padB = 26;
    let lo = Math.min.apply(null, pts.map((p) => p.kg)), hi = Math.max.apply(null, pts.map((p) => p.kg));
    lo = Math.floor(lo - 0.5); hi = Math.ceil(hi + 0.5);
    if (hi - lo < 2) { hi += 1; lo -= 1; }
    const t0 = parseKey(pts[0].date).getTime(), t1 = parseKey(pts[pts.length - 1].date).getTime();
    const x = (p) => padL + (W - padL - padR) * ((parseKey(p.date).getTime() - t0) / Math.max(1, t1 - t0));
    const y = (kg) => padT + (H - padT - padB) * (1 - (kg - lo) / (hi - lo));
    const grid = [lo, (lo + hi) / 2, hi].map((g) => '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#E7E3DC" stroke-width="1"/>' +
      '<text x="' + (padL - 8) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="11" font-weight="700" fill="#6B675F">' + kgFmt(g).replace(',0', '') + '</text>').join('');
    const line = pts.map((p, i) => (i ? 'L' : 'M') + x(p).toFixed(1) + ' ' + y(p.kg).toFixed(1)).join(' ');
    const lastP = pts[pts.length - 1];
    const fmtD = (p) => parseKey(p.date).getDate() + ' ' + M_SHORT[parseKey(p.date).getMonth()];
    const dots = pts.map((p) => {
      const sel = ui.wSel === p.id;
      return '<g class="wpt" data-a="wpt" data-id="' + p.id + '" role="button" tabindex="0" aria-label="' + fmtD(p) + ': ' + kgFmt(p.kg) + ' kg">' +
        '<circle cx="' + x(p) + '" cy="' + y(p.kg) + '" r="16" fill="transparent"/>' +
        '<circle cx="' + x(p) + '" cy="' + y(p.kg) + '" r="' + (sel ? 6 : 4) + '" fill="#17171B" stroke="#fff" stroke-width="2"/></g>';
    }).join('');
    const selP = pts.find((p) => p.id === ui.wSel);
    const tip = selP
      ? (function () {
          const tx = Math.min(Math.max(x(selP), padL + 50), W - padR - 10), ty = Math.max(y(selP.kg) - 14, 14);
          return '<g pointer-events="none"><rect x="' + (tx - 52) + '" y="' + (ty - 22) + '" width="104" height="24" rx="8" fill="#17171B"/>' +
            '<text x="' + tx + '" y="' + (ty - 6) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">' + fmtD(selP) + ' · ' + kgFmt(selP.kg) + ' kg</text></g>';
        })()
      : '';
    return '<svg class="wchart" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Wykres wagi z ' + pts.length + ' pomiarów">' + grid +
      '<path d="' + line + '" fill="none" stroke="#17171B" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots +
      '<text x="' + (x(lastP) + 10) + '" y="' + (y(lastP.kg) + 4) + '" font-size="12" font-weight="800" fill="#17171B">' + kgFmt(lastP.kg) + '</text>' +
      '<text x="' + padL + '" y="' + (H - 6) + '" font-size="11" font-weight="700" fill="#6B675F">' + fmtD(pts[0]) + '</text>' +
      '<text x="' + (W - padR) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" font-weight="700" fill="#6B675F">' + fmtD(lastP) + '</text>' +
      tip + '</svg>';
  }

  function viewWeight(c) {
    const w = weightsSorted();
    const last = w[w.length - 1], prev = w[w.length - 2], first = w[0];
    const sign = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±') + kgFmt(Math.abs(v)) + ' kg';
    const hero = last
      ? '<section class="card stack-s" style="gap:6px"><span class="small">Aktualna waga · ' + parseKey(last.date).getDate() + ' ' + M_GEN[parseKey(last.date).getMonth()] + '</span>' +
        '<div style="font-family:var(--display);font-size:56px;font-weight:800;letter-spacing:-0.03em;line-height:1">' + kgFmt(last.kg) + '<span style="font-size:20px;color:var(--muted);margin-left:6px">kg</span></div>' +
        '<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:6px">' +
          (prev ? '<span class="delta">' + sign(last.kg - prev.kg) + ' od poprzedniego</span>' : '') +
          (first && first !== last ? '<span class="delta">' + sign(last.kg - first.kg) + ' od ' + parseKey(first.date).getDate() + ' ' + M_SHORT[parseKey(first.date).getMonth()] + '</span>' : '') +
        '</div></section>'
      : '<section class="empty"><div style="font-weight:800;font-size:16px">Brak pomiarów</div><div class="muted">Zapisz pierwszą wagę – potem raz w tygodniu, na koniec weekendu.</div></section>';
    const rows = w.slice().reverse().map((x, i, arr) => {
      const p = arr[i + 1];
      return '<div class="entry compact"><div style="flex:1;min-width:0"><div class="name">' + esc(longDate(parseKey(x.date))) + '</div>' +
        (p ? '<div class="small">' + sign(x.kg - p.kg) + '</div>' : '<div class="small">pierwszy pomiar</div>') + '</div>' +
        '<div class="amt">' + kgFmt(x.kg) + '<small>kg</small></div>' +
        '<button type="button" class="icon-btn" data-a="delWeight" data-id="' + x.id + '" aria-label="Usuń pomiar z ' + esc(x.date) + '">' + ICON.x + '</button></div>';
    }).join('');
    return '<div class="top"><h1 class="h1">Waga</h1>' + syncBadge() + '</div>' +
      (ui.weightsMissing ? '<div class="banner">Tabela wagi nie jest jeszcze utworzona w Supabase – uruchom SQL z instrukcji, a pomiary zapiszą się w chmurze.</div>' : '') +
      '<div class="sports-grid"><div class="stack">' + hero +
        '<section class="card stack mob-only" style="gap:14px"><h2 class="h2">Nowy pomiar</h2>' + weightForm(c, false, 'm') + '</section>' +
        (w.length ? '<section class="card stack-s"><h2 class="h2" style="font-size:19px">Wykres</h2>' + weightChart(w) + '</section>' : '') +
        (w.length ? '<section class="stack-s"><h2 class="h2">Pomiary</h2>' + rows + '</section>' : '') +
      '</div><div class="desk-only"><section class="card stack" style="gap:14px"><h2 class="h2">Nowy pomiar</h2>' + weightForm(c, false, 'd') + '</section></div></div>';
  }

  function viewLogin() {
    const a = ui.auth, login = a.mode === 'login';
    return '<div class="login"><form class="box" data-submit="auth" novalidate>' +
      '<div class="logo"><span style="background:#DC3B41"></span><span style="background:#3E63DD"></span><span style="background:#E0590A"></span><span style="background:#2B9358"></span></div>' +
      '<div><h1 class="h1">HalfWay</h1><div class="muted">Twój dziennik treningów</div></div>' + installHint() +
      '<div class="field"><label for="in-email">E-mail</label><input class="input" id="in-email" data-in="email" type="email" autocomplete="email" autocapitalize="off" value="' + esc(a.email) + '"></div>' +
      '<div class="field"><label for="in-pass">Hasło' + (login ? '' : ' (min. 6 znaków)') + '</label><input class="input" id="in-pass" data-in="pass" type="password" autocomplete="' + (login ? 'current-password' : 'new-password') + '" value="' + esc(a.pass) + '"></div>' +
      (a.msg ? '<div class="msg' + (a.err ? ' err' : '') + '" role="status">' + esc(a.msg) + '</div>' : '') +
      '<button type="submit" class="btn big"' + (a.busy ? ' disabled' : '') + '>' + (a.busy ? 'Chwila…' : (login ? 'Zaloguj się' : 'Załóż konto')) + '</button>' +
      '<button type="button" class="link-btn" data-a="authMode">' + (login ? 'Nie masz konta? Załóż je' : 'Masz już konto? Zaloguj się') + '</button>' +
      '</form></div>';
  }

  const STANDALONE = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function installHint() {
    if (STANDALONE || !IOS) return '';
    try { if (localStorage.getItem('halfway:hint-off')) return ''; } catch (e) { /* */ }
    return '<div class="hint" role="note"><div class="hint-ic"><span style="background:#DC3B41"></span><span style="background:#3E63DD"></span><span style="background:#E0590A"></span><span style="background:#2B9358"></span></div>' +
      '<div style="flex:1;min-width:0"><b>Zainstaluj HalfWay jak aplikację</b><div>Stuknij <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> <b>Udostępnij</b>, potem <b>Dodaj do ekranu początkowego</b>.</div></div>' +
      '<button type="button" class="icon-btn" data-a="hintOff" aria-label="Ukryj podpowiedź">' + ICON.x + '</button></div>';
  }

  function viewApp() {
    const c = compute();
    const tab = ui.tab;
    const body = tab === 'history' ? viewHistory(c) : tab === 'sports' ? viewSports(c) : tab === 'weight' ? viewWeight(c) : viewToday(c);
    const nav = [['today', 'Dziś', ICON.cal], ['history', 'Ciągłość', ICON.grid], ['weight', 'Waga', ICON.scale], ['sports', 'Sporty', ICON.list]];
    const sidebar = '<aside class="sidebar"><div class="brand"><span class="logo"><span style="background:#DC3B41"></span><span style="background:#3E63DD"></span><span style="background:#E0590A"></span><span style="background:#2B9358"></span></span>HalfWay</div>' +
      nav.map((n) => '<button type="button" class="nav' + (tab === n[0] ? ' on' : '') + '" data-a="tab" data-v="' + n[0] + '">' + n[2] + n[1] + '</button>').join('') +
      '<div class="foot">' + (tab !== 'today' ? '<button type="button" class="btn" data-a="open">' + ICON.plus + 'Dodaj trening</button>' : '') + '</div></aside>';
    const tabbar = '<nav class="tabbar" aria-label="Nawigacja">' +
      nav.map((n) => '<button type="button" class="' + (tab === n[0] ? 'on' : '') + '" data-a="tab" data-v="' + n[0] + '">' + n[2] + n[1] + '</button>').join('') + '</nav>';
    const fab = tab !== 'sports' && tab !== 'weight' ? '<button type="button" class="fab" data-a="open" aria-label="Dodaj trening">' + ICON.plus + '</button>' : '';
    const sheet = ui.sheet
      ? '<div class="overlay' + (ui.sheetAnim ? ' anim' : '') + '"><button type="button" class="backdrop" data-a="closeSheet" aria-label="Zamknij"></button><div class="sheet" role="dialog" aria-label="Nowy trening"><div class="grab"></div>' + addPanel(c, 'sheet') + '</div></div>'
      : '';
    return sidebar + '<main class="main stack">' + installHint() + body + '</main>' + fab + tabbar + sheet + toastHtml();
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
      if (!s) return;
      const date = ui.draft.date;
      const amt = isCheck(s) ? 1 : Number(ui.draft.amount);
      if (!(amt > 0)) { showToast('Wpisz ilość większą od zera', true); return; }
      if (isCheck(s) && store.entries.some((e) => e.sport_id === s.id && e.date === date)) { showToast(s.name + ' już odhaczona tego dnia', true); return; }
      ui.lastSport = s.id;
      ui.sheet = false;
      ui.selDay = date;
      const dd = parseKey(date); ui.calY = dd.getFullYear(); ui.calM = dd.getMonth();
      addEntry(date, s.id, amt);
      const sh = shown(s, amt);
      showToast(isCheck(s) ? 'Odhaczono: ' + s.name : 'Zapisano: ' + s.name + ' · ' + sh.v + ' ' + sh.u);
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
          .map((e) => { const sp = m[e.sport_id]; const sh = shown(sp, e.amount); return [e.date, sp.name, isCheck(sp) ? 'tak' : sh.v, isCheck(sp) ? MIN_CHECK : sh.u]; })
          .concat(weightsSorted().map((w) => [w.date, 'Waga', kgFmt(w.kg), 'kg'])));
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
    wPickDate(d) { ui.wDraft.date = d.v; render(); },
    wMinus() { ui.wDraft.kg = Math.round(((ui.wDraft.kg || lastKg() || 80) - 0.1) * 10) / 10; render(); },
    wPlus() { ui.wDraft.kg = Math.round(((ui.wDraft.kg || lastKg() || 80) + 0.1) * 10) / 10; render(); },
    saveWeight() {
      const kg = Number(ui.wDraft.kg || lastKg());
      if (!(kg > 20 && kg < 400)) { showToast('Wpisz wagę w kg, np. 82,4', true); return; }
      setWeight(ui.wDraft.date, Math.round(kg * 10) / 10);
      ui.wDraft = { date: dkey(today()), kg: null };
      showToast('Zapisano wagę: ' + kgFmt(kg) + ' kg');
    },
    delWeight(d) { deleteWeight(d.id); showToast('Usunięto pomiar'); },
    wpt(d) { ui.wSel = ui.wSel === d.id ? null : d.id; render(); },
    hintOff() { try { localStorage.setItem('halfway:hint-off', '1'); } catch (e) { /* */ } render(); },
    authMode() { ui.auth.mode = ui.auth.mode === 'login' ? 'signup' : 'login'; ui.auth.msg = ''; render(); }
  };

  const IN = {
    amount(v, el) {
      ui.draft.amount = parseFloat(String(v).replace(',', '.')) || 0;
      if (el) {
        el.style.width = amtWidth(v);
        const h = el.closest('.stack-s') && el.closest('.stack-s').querySelector('.x10hint b');
        if (h) h.textContent = num(Math.round(ui.draft.amount * 100) / 10);
      }
    },
    wkg(v) { ui.wDraft.kg = parseFloat(String(v).replace(',', '.')) || null; },
    formName(v) { (ui.edit || ui.newSport).name = v; },
    email(v) { ui.auth.email = v.trim(); },
    pass(v) { ui.auth.pass = v; }
  };
  const CH = {
    date(v) { if (v && parseKey(v) <= today()) ui.draft.date = v; render(); },
    wdate(v) { if (v && parseKey(v) <= today()) ui.wDraft.date = v; render(); }
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
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.in === 'wkg') { e.preventDefault(); A.saveWeight(); }
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
    if (!Array.isArray(store.weights)) store.weights = [];
    if (!store.sports.length) seedDefaults(); else { migrateV2(); render(); }
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* */ });
  }
})();
