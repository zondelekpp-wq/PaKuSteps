/* PaKuSteps – one small step at a time. Offline; all data stays on the device. */
'use strict';
(() => {
  const APP_VERSION = '1.3.4';
  const LINKS = { paku: 'https://zondelekpp-wq.github.io/PaKu/' };       // apps a step can open (reading routine → PaKuReading; its address stays /PaKu/)
  /* PaKu family: this app works alone; shortcuts to other family apps appear only when they are used here (or switched on) */
  const F = window.PaKuFamily || null;
  const SELF = 'steps';
  const LINKS_TO = ['paku', 'grounding'];                                // apps this app has shortcuts to
  const APP_URL = 'https://zondelekpp-wq.github.io/PaKuSteps/';          // the QR code in qr.svg points here
  const GROUNDING_URL = 'https://zondelekpp-wq.github.io/PaKuGrounding/?sos=1';
  const CONTACT_EMAIL = 'zondelek.p.p@gmail.com';                       // shown in Terms & privacy
  const BMC_URL = 'https://buymeacoffee.com/Hieronim';
  const LANGS = [['en', 'English'], ['pl', 'Polski'], ['de', 'Deutsch'], ['es', 'Español'], ['fr', 'Français'], ['zh', '中文'], ['uk', 'Українська'], ['lv', 'Latviešu']];
  const LOCALES = { en: 'en-GB', pl: 'pl-PL', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN', uk: 'uk-UA', lv: 'lv-LV' };
  const KEY = 'pakusteps.v1';
  const DEFAULT_ACCENT = '#7a5ca8';
  const ACCENTS = [['lavender', '#7a5ca8'], ['blue', '#3f6fb5'], ['teal', '#2f8a85'], ['green', '#4f8a4f'], ['rose', '#b0507a'], ['amber', '#b5762a'], ['grey', '#646a78']];
  const TIMERS = [0, 2, 5, 10, 15];
  const METRES_PER_STEP = 10;
  const MILESTONES = [['ms_eiffel', 330], ['ms_burj', 828], ['ms_blanc', 4808], ['ms_kili', 5895], ['ms_everest', 8849], ['ms_space', 100000], ['ms_iss', 408000], ['ms_moon', 384400000]];

  const mq = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };
  const DEFAULTS = () => ({
    lang: 'en', theme: mq('(prefers-color-scheme: dark)') ? 'night' : 'calm', textSize: 'normal',
    reduceMotion: mq('(prefers-reduced-motion: reduce)'), accent: DEFAULT_ACCENT,
    vibrate: true, cheerSound: false, focusSound: false, timerDefault: 0, splash: false,
    tasks: [], log: {}, tipDismissed: false, offlineToastShown: false, family: {}
  });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

  function normalize(p) {
    const d = DEFAULTS();
    if (!p || typeof p !== 'object') return d;
    for (const k of Object.keys(d)) {
      if (!(k in p)) continue;
      const v = p[k];
      if (k === 'tasks') {
        if (Array.isArray(v)) d.tasks = v.filter(x => x && typeof x === 'object').slice(0, 300).map(x => ({
          id: str(x.id, 40) || uid(), name: str(x.name, 120), routine: x.routine === true, created: Number(x.created) || Date.now(),
          steps: (Array.isArray(x.steps) ? x.steps : []).filter(s => s && typeof s.text === 'string').slice(0, 100)
            .map(s => Object.assign({ id: str(s.id, 40) || uid(), text: s.text.slice(0, 200), done: s.done === true }, LINKS[s.link] ? { link: s.link } : {}))
        }));
      } else if (k === 'family') {
        if (v && typeof v === 'object') for (const id of Object.keys(v)) if (typeof v[id] === 'boolean' && /^[\w-]{1,30}$/.test(id)) d.family[id] = v[id];
      } else if (k === 'log') {
        if (v && typeof v === 'object') for (const day of Object.keys(v)) {
          const e = v[day];
          if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(e)) d.log[day] = [Math.max(0, +e[0] || 0), Math.max(0, +e[1] || 0)];
        }
      } else if (typeof v === typeof d[k]) d[k] = typeof v === 'string' ? v.slice(0, 40) : v;
    }
    if (!window.I18N[d.lang]) d.lang = 'en';
    if (!['calm', 'night', 'contrast'].includes(d.theme)) d.theme = 'calm';
    if (!['normal', 'large', 'xl'].includes(d.textSize)) d.textSize = 'normal';
    if (!TIMERS.includes(d.timerDefault)) d.timerDefault = 0;
    if (!/^#[0-9a-f]{6}$/i.test(d.accent)) d.accent = DEFAULT_ACCENT;
    d.accent = d.accent.toLowerCase();
    return d;
  }
  function load() { try { return normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return DEFAULTS(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  let S = load();
  /* is another family app "connected" here? user's own choice wins, otherwise: has it been used on this device */
  const connected = id => (id in S.family ? S.family[id] : !!(F && F.used(id)));
  const ft = k => (F ? F.t(k, S.lang) : k);

  /* ---------- helpers ---------- */
  function t(k, v) {
    let s = (window.I18N[S.lang] || {})[k];
    if (s == null) s = window.I18N.en[k];
    if (s == null) return k;
    if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] != null ? v[n] : m));
    return s;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const te = (k, v) => esc(t(k, v));
  const $ = (sel, root = document) => root.querySelector(sel);
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function fmtHeight(m) {
    const km = m >= 1000;
    try { return new Intl.NumberFormat(LOCALES[S.lang], { style: 'unit', unit: km ? 'kilometer' : 'meter', maximumFractionDigits: km && m < 100000 ? 1 : 0 }).format(km ? m / 1000 : m); }
    catch (e) { return km ? (m / 1000).toFixed(1) + ' km' : m + ' m'; }
  }
  const fmtNum = n => { try { return new Intl.NumberFormat(LOCALES[S.lang]).format(n); } catch (e) { return String(n); } };

  let cleanups = [];
  const onCleanup = f => cleanups.push(f);
  function runCleanup() { const c = cleanups; cleanups = []; c.forEach(f => { try { f(); } catch (e) { } }); }
  async function keepAwake() {
    try { if ('wakeLock' in navigator) { const l = await navigator.wakeLock.request('screen'); onCleanup(() => l.release().catch(() => { })); } } catch (e) { }
  }

  /* ---------- icons ---------- */
  const sv = p => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICON = {
    steps: sv('<path d="M3 20h5v-5h5v-5h5V5h3"/>'),
    back: sv('<path d="M15 5l-7 7 7 7"/>'),
    globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
    settings: sv('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    list: sv('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    play: sv('<path d="M7 4l13 8-13 8z"/>'),
    trash: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    up: sv('<path d="M6 15l6-6 6 6"/>'),
    down: sv('<path d="M6 9l6 6 6-6"/>'),
    check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    checkCircle: sv('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
    split: sv('<path d="M12 3v6M12 9l-6 6v6M12 9l6 6v6"/>'),
    later: sv('<path d="M5 12h12M13 7l5 5-5 5"/>'),
    help: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.5v.5"/>'),
    mountain: sv('<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M7.5 10.5l1.5 1.5 1.5-1.5"/>'),
    sound: sv('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
    timer: sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>'),
    anchor: sv('<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V21M8 11h8M4.5 13.5A7.5 7.5 0 0 0 12 21a7.5 7.5 0 0 0 7.5-7.5"/>'),
    info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    share: sv('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    coffee: sv('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
    upload: sv('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>'),
    download: sv('<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>'),
    leaf: sv('<polygon stroke-width="1.6" points="12.0,2.0 13.8,5.8 16.2,4.6 15.4,9.8 19.0,6.6 19.8,8.6 22.6,8.0 21.0,11.8 22.4,12.6 17.0,16.2 17.8,18.6 13.0,17.6 13.0,22.0 11.0,22.0 11.0,17.6 6.2,18.6 7.0,16.2 1.6,12.6 3.0,11.8 1.4,8.0 4.2,8.6 5.0,6.6 8.6,9.8 7.8,4.6 10.2,5.8"/>'),
    book: sv('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>'),
    repeat: sv('<path d="M4 11V9a4 4 0 0 1 4-4h11M15 1l4 4-4 4M20 13v2a4 4 0 0 1-4 4H5M9 23l-4-4 4-4"/>')
  };

  /* ---------- colours ---------- */
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const lum = c => { const s = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const PALETTE_VARS = ['--primary', '--primary-2', '--bg', '--surface', '--surface2', '--border', '--ring'];
  function palette(hex, theme) {
    const W = [255, 255, 255], B = [0, 0, 0], K = [16, 13, 22];
    let a = hexRgb(hex);
    if (theme === 'calm') {
      for (let i = 0; i < 30 && ratio(a, W) < 4.6; i++) a = mixc(a, B, 0.07);
      return { '--primary': a, '--primary-2': mixc(a, W, 0.3), '--bg': mixc(a, W, 0.94), '--surface': W, '--surface2': mixc(a, W, 0.87), '--border': mixc(a, W, 0.8), '--ring': mixc(a, W, 0.5) };
    }
    const bg = mixc(a, K, 0.92);
    let p = a;
    for (let i = 0; i < 30 && ratio(p, bg) < 6; i++) p = mixc(p, W, 0.08);
    return { '--primary': p, '--primary-2': mixc(p, K, 0.25), '--bg': bg, '--surface': mixc(a, K, 0.86), '--surface2': mixc(a, K, 0.8), '--border': mixc(a, K, 0.72), '--ring': mixc(p, K, 0.4) };
  }
  function applyLook() {
    const r = document.documentElement;
    r.dataset.theme = S.theme; r.dataset.size = S.textSize; r.dataset.motion = S.reduceMotion ? 'reduce' : 'full';
    r.lang = S.lang === 'zh' ? 'zh-CN' : S.lang;
    PALETTE_VARS.forEach(v => r.style.removeProperty(v));
    let bg = { calm: '#f5f1fb', night: '#14111b', contrast: '#000000' }[S.theme];
    if (S.theme !== 'contrast' && S.accent !== DEFAULT_ACCENT) {
      const p = palette(S.accent, S.theme);
      for (const k in p) r.style.setProperty(k, rgbHex(p[k]));
      bg = rgbHex(p['--bg']);
    }
    const m = $('meta[name="theme-color"]'); if (m) m.content = bg;
  }

  /* ---------- sound ---------- */
  let actx = null;
  function ctx() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { } return actx; }
  function chime(notes) {
    const c = ctx(); if (!c) return;
    notes.forEach((f, i) => {
      try {
        const o = c.createOscillator(), g = c.createGain(), n = c.currentTime + i * 0.14;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.08, n + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.8);
        o.connect(g).connect(c.destination); o.start(n); o.stop(n + 0.9);
      } catch (e) { }
    });
  }
  /* focus sound: soft brown noise rendered once into a looping audio file, so it keeps playing in the background */
  let focusAudio = null, focusUrl = null;
  function brownNoiseWav() {
    const SR = 22050, L = SR * 12, F = SR, n = L, raw = new Float32Array(L + F);
    let last = 0;
    for (let i = 0; i < raw.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; raw[i] = last * 3.2; }
    const pcm = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      let v = raw[i];
      if (i < F) { const k = i / F; v = raw[i] * k + raw[L + i] * (1 - k); }   // crossfade so the loop has no click
      pcm[i] = Math.max(-1, Math.min(1, v * 0.5)) * 32767;
    }
    const buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 2, true);
    new Int16Array(buf, 44).set(pcm);
    return new Blob([buf], { type: 'audio/wav' });
  }
  function setMediaSession(title, handlers) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'PaKuSteps', artwork: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] });
      for (const a of ['play', 'pause', 'stop']) { try { navigator.mediaSession.setActionHandler(a, (handlers && handlers[a]) || null); } catch (e) { } }
    } catch (e) { }
  }
  function clearMediaSession() { if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = null; for (const a of ['play', 'pause', 'stop']) navigator.mediaSession.setActionHandler(a, null); } catch (e) { } } }
  function focusStart() {
    if (focusAudio) return;
    try {
      focusUrl = focusUrl || URL.createObjectURL(brownNoiseWav());
      focusAudio = new Audio(focusUrl); focusAudio.loop = true; focusAudio.volume = 0.6;
      const a = focusAudio;
      setMediaSession(t('focus_on'), { play: () => a.play().catch(() => { }), pause: () => a.pause(), stop: () => focusStop() });
      a.play().catch(() => { });
    } catch (e) { }
  }
  function focusStop() { if (focusAudio) { try { focusAudio.pause(); } catch (e) { } focusAudio = null; clearMediaSession(); } }

  /* ---------- toast & modal ---------- */
  let toastTimer = null;
  function toast(msg, action, fn, ms) {
    const el = $('#toast');
    const hide = () => { el.classList.remove('show'); el.hidden = true; el.innerHTML = ''; };
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="btn small primary">${esc(action)}</button>` : ''}`;
    el.hidden = false; requestAnimationFrame(() => el.classList.add('show'));
    if (action) $('button', el).onclick = () => { hide(); fn(); };
    clearTimeout(toastTimer); toastTimer = setTimeout(hide, ms || (action ? 15000 : 3000));
  }
  let closeModal = null;
  function modal(html, setup) {
    const m = $('#modal'), prev = document.activeElement;
    m.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    m.hidden = false;
    const onKey = e => { if (e.key === 'Escape') close(); };
    const close = () => { m.hidden = true; m.innerHTML = ''; closeModal = null; document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
    closeModal = close;
    document.addEventListener('keydown', onKey);
    $('.modal-back', m).addEventListener('click', e => { if (e.target.classList.contains('modal-back')) close(); });
    setup($('.modal', m), close);
    const f = $('.modal [autofocus], .modal button', m); if (f) f.focus();
  }
  function confirmBox(text, okLabel) {
    return new Promise(res => modal(
      `<p class="lead">${esc(text)}</p><div class="row end"><button class="btn ghost" data-r="0">${te('cancel')}</button><button class="btn danger" data-r="1">${esc(okLabel)}</button></div>`,
      (el, close) => el.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { close(); res(b.dataset.r === '1'); } })));
  }
  function langPicker() {
    modal(`<h2 class="modal-title">${ICON.globe}<span>${te('language')}</span></h2><div class="lang-list">${LANGS.map(([c, n]) =>
      `<button class="lang-opt${c === S.lang ? ' on' : ''}" data-l="${c}" lang="${c === 'zh' ? 'zh-CN' : c}" aria-pressed="${c === S.lang}">${esc(n)}</button>`).join('')}</div>`,
      (el, close) => el.addEventListener('click', e => {
        const b = e.target.closest('[data-l]'); if (!b) return;
        S.lang = b.dataset.l; save(); applyLook(); close(); show(current.screen, current.params, false);
      }));
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (err) {
      const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { } ta.remove(); return ok;
    }
  }
  function shareModal() {
    modal(`<h2 class="modal-title">${ICON.share}<span>${te('share_title')}</span></h2>
      <div class="qr-box"><img src="qr.svg" alt="QR: ${esc(APP_URL)}" width="240" height="240"></div>
      <p class="center small muted">${te('share_d')}</p>
      <p class="center link-text">${esc(APP_URL.replace(/^https:\/\//, ''))}</p>
      <div class="stack">
        ${navigator.share ? `<button class="btn primary" data-s="share">${ICON.share}<span>${te('share_btn')}</span></button>` : ''}
        <button class="btn" data-s="copy">${ICON.link}<span>${te('copy_btn')}</span></button>
        <button class="btn ghost" data-s="close">${te('close')}</button>
      </div>`,
      (el, close) => el.addEventListener('click', async e => {
        const b = e.target.closest('[data-s]'); if (!b) return;
        if (b.dataset.s === 'close') close();
        else if (b.dataset.s === 'share') { try { await navigator.share({ title: 'PaKuSteps', text: t('share_text'), url: APP_URL }); } catch (err) { } }
        else if (b.dataset.s === 'copy') { if (await copyText(APP_URL)) toast(t('copied')); }
      }));
  }

  /* ---------- tasks & progress ---------- */
  const findTask = id => S.tasks.find(x => x.id === id);
  const doneCount = tk => tk.steps.filter(s => s.done).length;
  function logEvent(steps, tasks) {
    const k = dayKey(new Date()); const e = S.log[k] || [0, 0];
    S.log[k] = [e[0] + steps, e[1] + tasks];
  }
  function stats() {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const monday = new Date(y, m, now.getDate() - ((now.getDay() + 6) % 7));
    const wk = dayKey(monday), mk = `${y}-${String(m + 1).padStart(2, '0')}`, yk = String(y);
    const r = { week: [0, 0], month: [0, 0], year: [0, 0], all: [0, 0] };
    for (const [day, [s, tk]] of Object.entries(S.log)) {
      r.all[0] += s; r.all[1] += tk;
      if (day.startsWith(yk)) { r.year[0] += s; r.year[1] += tk; }
      if (day.startsWith(mk)) { r.month[0] += s; r.month[1] += tk; }
      if (day >= wk) { r.week[0] += s; r.week[1] += tk; }
    }
    return r;
  }
  function climbInfo() {
    const h = stats().all[0] * METRES_PER_STEP;
    let reached = null, next = MILESTONES[0], prevH = 0;
    for (const ms of MILESTONES) { if (h >= ms[1]) { reached = ms; prevH = ms[1]; } else { next = ms; break; } }
    if (reached && reached === MILESTONES[MILESTONES.length - 1]) next = null;
    const pct = next ? Math.max(0, Math.min(1, (h - prevH) / (next[1] - prevH))) : 1;
    return { h, reached, next, pct };
  }

  /* ---------- router ---------- */
  const app = $('#app');
  let current = { screen: 'home', params: {} }, depth = 0;
  function show(screen, params = {}, push = true) {
    runCleanup();
    if (closeModal) closeModal();
    if (push) { history.pushState({ screen, params }, ''); depth++; }
    current = { screen, params };
    (SCREENS[screen] || SCREENS.home)(params);
    window.scrollTo(0, 0);
    const h = $('.bar-title, .brand-name', app);
    if (h && push) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  const replace = (screen, params) => { history.replaceState({ screen, params }, ''); show(screen, params, false); };
  function goBack() { if (depth > 0) history.back(); else show('home', {}, false); }
  window.addEventListener('popstate', e => {
    const st = e.state || { screen: 'home', params: {} };
    depth = Math.max(0, depth - 1);
    show(st.screen, st.params || {}, false);
  });

  function frame(title, body, home) {
    return `<header class="bar">${home
      ? `<div class="brand"><span class="brand-mark">${ICON.steps}</span><span class="brand-name">PaKuSteps</span></div>`
      : `<button class="icon-btn" data-act="back" aria-label="${te('back')}">${ICON.back}</button><h1 class="bar-title">${esc(title)}</h1>`}
      <div class="bar-actions">${home ? `<button class="icon-btn" data-act="share" aria-label="${te('share_title')}">${ICON.share}</button>` : ''}<button class="icon-btn" data-act="lang" aria-label="${te('language')}">${ICON.globe}</button>${home ? `<button class="icon-btn" data-act="settings" aria-label="${te('settings')}">${ICON.settings}</button>` : ''}</div>
      </header><main class="main" id="main">${body}</main>`;
  }
  app.addEventListener('click', e => {
    const a = e.target.closest('[data-act],[data-go]');
    if (!a) return;
    if (a.dataset.go) { show(a.dataset.go, a.dataset.id ? { id: a.dataset.id } : {}); return; }
    switch (a.dataset.act) {
      case 'back': goBack(); break;
      case 'settings': show('settings'); break;
      case 'lang': langPicker(); break;
      case 'share': shareModal(); break;
      case 'tip': S.tipDismissed = true; save(); a.closest('.tip').remove(); break;
    }
  });

  /* ---------- climb card ---------- */
  function climbCard(small) {
    const c = climbInfo();
    return `<button class="card climb-card${small ? ' small' : ''}" data-go="climb">
      <span class="climb-ic">${ICON.mountain}</span>
      <span class="grow">
        <span class="climb-label">${te('climb_now')}</span>
        <span class="climb-h">${esc(fmtHeight(c.h))}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(c.pct * 100).toFixed(1)}%"></span></span>
        <span class="climb-next">${c.next ? te('next_goal', { m: t(c.next[0]), left: fmtHeight(c.next[1] - c.h) }) : te('reached', { m: t('ms_moon') })}</span>
      </span></button>`;
  }

  /* ---------- screens ---------- */
  const SCREENS = {
    home() {
      const tasks = S.tasks;
      app.innerHTML = frame('', `
        <p class="tagline">${te('tagline')}</p>
        ${climbCard(true)}
        ${S.tipDismissed ? '' : `<div class="tip card"><p>${te('tip_first')}</p><button class="btn ghost small" data-act="tip">${te('got_it')}</button></div>`}
        <div class="stack">
          <button class="btn primary big-btn wide" data-go="edit">${ICON.plus}<span>${te('new_task')}</span></button>
          <button class="btn wide" data-go="templates">${ICON.list}<span>${te('from_template')}</span></button>
        </div>
        <h2 class="section-title">${te('my_tasks')}</h2>
        ${tasks.length ? `<ul class="list tasks">${tasks.map(tk => {
          const d = doneCount(tk), n = tk.steps.length;
          const fin = n > 0 && d === n;
          return `<li class="task card${fin ? ' finished' : ''}">
            <button class="task-main" data-go="edit" data-id="${esc(tk.id)}">
              <span class="task-name">${fin ? `<span class="rt">${ICON.checkCircle}</span>` : ''}${tk.routine ? `<span class="rt" title="${te('routine')}">${ICON.repeat}</span>` : ''}${esc(tk.name || t('untitled'))}</span>
              <span class="muted small">${te('progress', { a: d, b: n })}</span>
              <span class="bar-track"><span class="bar-fill" style="width:${n ? (d / n * 100).toFixed(1) : 0}%"></span></span>
            </button>
            ${n ? `<button class="btn ${fin ? '' : 'primary'}" data-go="do" data-id="${esc(tk.id)}">${fin ? ICON.repeat : ICON.play}<span>${te(fin ? 'reset_task' : d ? 'continue_task' : 'start')}</span></button>` : ''}
          </li>`;
        }).join('')}</ul>` : `<p class="muted empty">${te('no_tasks')}</p>`}
        <button class="tile wide" data-go="why"><span class="tile-ic">${ICON.info}</span><span><span class="tile-t">${te('why_link')}</span><span class="tile-d">${te('why_link_d')}</span></span></button>
        ${F ? `<button class="tile wide" data-go="family"><span class="tile-ic">${ICON.leaf}</span><span><span class="tile-t">${esc(ft('fam_title'))}</span><span class="tile-d">${esc(ft('fam_d'))}</span></span></button>` : ''}
      `, true);
    },

    templates() {
      const base = (Array.isArray(t('tpl')) ? t('tpl') : window.I18N.en.tpl).map(([title, steps]) => ({ title, steps, routine: false }));
      const rd = Array.isArray(t('tpl_read')) ? t('tpl_read') : window.I18N.en.tpl_read;
      // reading routine: repeats every time, and its last step opens PaKu
      const rdSteps = connected('paku') ? rd[1] : rd[1].slice(0, -1).concat(t('tpl_read_alt'));   // without PaKu: just "read a chapter"
      const list = [{ title: rd[0], steps: rdSteps, routine: true, link: [rdSteps.length - 1, 'paku'] }, ...base];
      app.innerHTML = frame(t('templates'), `<ul class="list">${list.map((tp, i) => `
        <li><button class="card tpl" data-i="${i}"><span class="task-name">${tp.routine ? `<span class="rt">${ICON.repeat}</span>` : ''}${esc(tp.title)}</span>
        <span class="muted small">${tp.routine ? te('routine') + ' · ' : ''}${te('tpl_steps', { n: tp.steps.length })}</span>
        <span class="tpl-prev">${tp.steps.slice(0, 3).map(esc).join(' · ')}…</span></button></li>`).join('')}</ul>`);
      $('#main').addEventListener('click', e => {
        const b = e.target.closest('[data-i]'); if (!b) return;
        const tp = list[+b.dataset.i];
        const tk = { id: uid(), name: tp.title, routine: tp.routine, created: Date.now(),
          steps: tp.steps.map((s, j) => Object.assign({ id: uid(), text: s, done: false }, tp.link && tp.link[0] === j ? { link: tp.link[1] } : {})) };
        S.tasks.unshift(tk); save();
        replace('edit', { id: tk.id });
      });
    },

    edit(p) {
      let tk = p.id && findTask(p.id);
      const isNew = !tk;
      if (isNew) tk = { id: uid(), name: '', routine: false, created: Date.now(), steps: [] };
      const persist = () => { if (!findTask(tk.id)) S.tasks.unshift(tk); save(); };
      app.innerHTML = frame(tk.name || t('new_task'), `
        <label class="field"><span>${te('task_name')}</span><input id="tn" maxlength="120" value="${esc(tk.name)}" placeholder="${te('task_name_ph')}" autocomplete="off"></label>
        <h2 class="section-title">${te('steps_title')}</h2>
        <p class="hint">${te('steps_hint')}</p>
        <ol class="list steps-edit" id="sl"></ol>
        <form class="add-row" id="sf"><input id="si" maxlength="200" placeholder="${te('step_ph')}" autocomplete="off" aria-label="${te('add_step')}"><button class="btn" type="submit">${ICON.plus}<span>${te('add_step')}</span></button></form>
        <label class="toggle card"><span class="grow"><span class="with-ic">${ICON.repeat}<span>${te('routine')}</span></span><small class="muted">${te('routine_d')}</small></span>
          <input type="checkbox" id="rt" ${tk.routine ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>
        <button class="btn primary big-btn wide" id="go">${ICON.play}<span>${te(doneCount(tk) ? 'continue_task' : 'start')}</span></button>
        <div class="row">
          ${doneCount(tk) ? `<button class="btn ghost" id="rs">${ICON.repeat}<span>${te('reset_task')}</span></button>` : ''}
          ${isNew ? '' : `<button class="btn danger-ghost" id="del">${ICON.trash}<span>${te('delete_task')}</span></button>`}
        </div>`);
      const sl = $('#sl'), si = $('#si'), tn = $('#tn');
      const render = () => {
        sl.innerHTML = tk.steps.map((s, i) => `
          <li class="step-row${s.done ? ' done' : ''}" data-i="${i}">
            <button class="chk" data-a="done" aria-pressed="${s.done}" aria-label="${te('mark_done')}">${s.done ? ICON.check : `<span>${i + 1}</span>`}</button>
            <textarea class="grow" data-a="text" rows="1" maxlength="200" aria-label="${te('steps_title')} ${i + 1}">${esc(s.text)}</textarea>
            <span class="step-tools">
              <button class="icon-btn" data-a="up" aria-label="${te('move_up')}" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
              <button class="icon-btn" data-a="down" aria-label="${te('move_down')}" ${i === tk.steps.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
              <button class="icon-btn" data-a="del" aria-label="${te('delete')}">${ICON.trash}</button>
            </span>
          </li>`).join('');
        sl.querySelectorAll('textarea').forEach(fit);
      };
      const fit = a => { a.style.height = 'auto'; a.style.height = a.scrollHeight + 'px'; };
      render();
      sl.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA') fit(e.target); });
      sl.addEventListener('keydown', e => { if (e.target.tagName === 'TEXTAREA' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
      tn.addEventListener('input', () => { tk.name = tn.value.slice(0, 120); $('.bar-title').textContent = tk.name || t('new_task'); persist(); });
      $('#sf').onsubmit = e => {
        e.preventDefault(); const v = si.value.trim(); if (!v) return;
        tk.steps.push({ id: uid(), text: v.slice(0, 200), done: false }); persist(); si.value = ''; render(); si.focus();
      };
      sl.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const i = +b.closest('[data-i]').dataset.i, s = tk.steps[i];
        if (b.dataset.a === 'done') s.done = !s.done;
        else if (b.dataset.a === 'up' && i > 0) tk.steps.splice(i - 1, 0, tk.steps.splice(i, 1)[0]);
        else if (b.dataset.a === 'down' && i < tk.steps.length - 1) tk.steps.splice(i + 1, 0, tk.steps.splice(i, 1)[0]);
        else if (b.dataset.a === 'del') tk.steps.splice(i, 1);
        persist(); render();
      });
      sl.addEventListener('change', e => {
        if (e.target.dataset.a !== 'text') return;
        const i = +e.target.closest('[data-i]').dataset.i, v = e.target.value.trim();
        if (v) tk.steps[i].text = v.slice(0, 200); else tk.steps.splice(i, 1);
        persist(); render();
      });
      $('#rt').onchange = e => { tk.routine = e.target.checked; persist(); };
      $('#go').onclick = () => {
        const v = si.value.trim();
        if (v) { tk.steps.push({ id: uid(), text: v.slice(0, 200), done: false }); si.value = ''; }
        if (!tk.steps.length) { toast(t('no_steps')); si.focus(); return; }
        if (!tk.name.trim()) tk.name = tk.steps[0].text.slice(0, 120);
        if (tk.steps.every(s => s.done)) tk.steps.forEach(s => { s.done = false; });
        persist(); replace('do', { id: tk.id });
      };
      const rs = $('#rs'); if (rs) rs.onclick = () => { tk.steps.forEach(s => { s.done = false; }); persist(); replace('edit', { id: tk.id }); };
      const del = $('#del');
      if (del) del.onclick = async () => {
        if (await confirmBox(t('delete_task_confirm'), t('delete'))) { S.tasks = S.tasks.filter(x => x.id !== tk.id); save(); goBack(); }
      };
      if (isNew) tn.focus();
    },

    do(p) {
      const tk = findTask(p.id);
      if (!tk || !tk.steps.length) { replace('home', {}); return; }
      if (tk.steps.every(s => s.done)) { tk.steps.forEach(s => { s.done = false; }); save(); }   // finished task opened again = start over
      let timerEnd = 0, timerTotal = 0, timerLoop = null, timerChoice = S.timerDefault;
      keepAwake();
      if (S.focusSound) focusStart();
      onCleanup(() => { clearInterval(timerLoop); focusStop(); });
      app.innerHTML = frame(tk.name || t('untitled'), `<div id="dz"></div>`);
      const dz = $('#dz');
      const RING = 2 * Math.PI * 52;

      const nextIndex = () => tk.steps.findIndex(s => !s.done);
      const opened = new Set();
      const openLink = s => { opened.add(s.id); try { window.open(LINKS[s.link], '_blank', 'noopener'); } catch (e) { } };
      function stopTimer() { clearInterval(timerLoop); timerLoop = null; timerEnd = 0; }
      function startTimer(min) {
        stopTimer(); if (!min) return paintTimer();
        timerTotal = min * 60; timerEnd = Date.now() + timerTotal * 1000;
        timerLoop = setInterval(paintTimer, 250); paintTimer();
      }
      function paintTimer() {
        const ring = $('#ring', dz), lbl = $('#tl', dz), box = $('#tbox', dz); if (!ring) return;
        if (!timerEnd) { box.hidden = true; return; }
        box.hidden = false;
        const left = Math.max(0, (timerEnd - Date.now()) / 1000);
        ring.style.strokeDashoffset = String(RING * (1 - left / timerTotal));
        lbl.textContent = mmss(left);
        if (left <= 0) {
          stopTimer(); box.hidden = false; lbl.textContent = '0:00'; ring.style.strokeDashoffset = String(RING);
          $('#tmsg', dz).textContent = t('timer_up');
          if (S.vibrate && navigator.vibrate) navigator.vibrate([120, 80, 120]);
          chime([523, 659, 784]);
        }
      }
      function render(cheer, byTap) {
        stopTimer();
        const i = nextIndex();
        if (i < 0) return finish();
        const n = tk.steps.length, d = doneCount(tk), cur = tk.steps[i];
        // a step that links to another app (e.g. reading → PaKu) opens it by itself, right after the tap that led here
        const hasLink = !!(cur.link && LINKS[cur.link] && connected(cur.link));
        if (hasLink && byTap && !opened.has(cur.id)) openLink(cur);
        dz.innerHTML = `
          <p class="sos-progress">${te('step_of', { a: d + 1, b: n })}</p>
          <div class="pdots" aria-hidden="true">${tk.steps.map(s => `<span class="${s.done ? 'on' : ''}"></span>`).join('')}</div>
          ${cheer ? `<p class="cheer" role="status">${ICON.checkCircle}<span>${esc(cheer)}</span></p>` : ''}
          <div class="card step-card"><p id="st">${esc(tk.steps[i].text)}</p>
            ${hasLink ? `<div class="link-step"><a class="btn primary" id="ol" href="${LINKS[cur.link]}" target="_blank" rel="noopener">${ICON.book}<span>${te('open_paku')}</span></a><p class="hint">${te('paku_hint')}</p></div>` : ''}</div>
          <button class="btn primary big-btn wide done-btn" id="dn">${ICON.check}<span>${te('step_done')}</span></button>
          <div class="row center-row">
            <button class="btn" id="sp">${ICON.split}<span>${te('split')}</span></button>
            ${n - d > 1 ? `<button class="btn" id="lt">${ICON.later}<span>${te('later')}</span></button>` : ''}
          </div>
          <div class="card timer-card">
            <div class="field-label with-ic">${ICON.timer}<span>${te('timer')}</span></div>
            <div class="chips" id="tc">${TIMERS.map(m => `<button class="chip" data-m="${m}" aria-pressed="${m === timerChoice}">${m ? te('min', { n: m }) : te('timer_off')}</button>`).join('')}</div>
            <div class="timer-box" id="tbox" hidden>
              <svg viewBox="0 0 120 120" class="ring" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle id="ring" cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg>
              <span class="timer-left" id="tl" role="timer"></span>
            </div>
            <p class="hint center" id="tmsg" aria-live="polite"></p>
          </div>
          <div class="row center-row">
            <button class="chip snd" id="fs" aria-pressed="${S.focusSound}">${ICON.sound}<span>${te(S.focusSound ? 'focus_on' : 'focus_off')}</span></button>
            <button class="btn ghost" id="stk">${ICON.help}<span>${te('stuck')}</span></button>
          </div>`;
        $('#dn', dz).onclick = () => {
          tk.steps[i].done = true; logEvent(1, 0); save();
          if (S.vibrate && navigator.vibrate) navigator.vibrate(40);
          if (S.cheerSound) chime([659, 880]);
          render(t('cheer' + (1 + Math.floor(Math.random() * 4))), true);
        };
        const ol = $('#ol', dz); if (ol) ol.addEventListener('click', () => opened.add(cur.id));
        $('#sp', dz).onclick = splitStep;
        const lt = $('#lt', dz); if (lt) lt.onclick = () => { tk.steps.push(tk.steps.splice(i, 1)[0]); save(); render(); };
        $('#tc', dz).onclick = e => {
          const b = e.target.closest('[data-m]'); if (!b) return;
          timerChoice = +b.dataset.m; $('#tmsg', dz).textContent = '';
          $('#tc', dz).querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
          ctx(); startTimer(timerChoice);
        };
        $('#fs', dz).onclick = e => {
          S.focusSound = !S.focusSound; save();
          if (S.focusSound) focusStart(); else focusStop();
          const b = e.currentTarget; b.setAttribute('aria-pressed', S.focusSound); b.innerHTML = `${ICON.sound}<span>${te(S.focusSound ? 'focus_on' : 'focus_off')}</span>`;
        };
        $('#stk', dz).onclick = stuck;
        if (timerChoice) startTimer(timerChoice);
      }
      function splitStep() {
        const i = nextIndex();
        modal(`<h2 class="modal-title">${ICON.split}<span>${te('split_title')}</span></h2>
          <p class="muted">${esc(tk.steps[i].text)}</p><p class="small">${te('split_hint')}</p>
          <form id="spf" class="stack"><input id="spi" maxlength="200" placeholder="${te('split_ph')}" autocomplete="off" autofocus>
          <div class="row end"><button type="button" class="btn ghost" data-x>${te('cancel')}</button><button class="btn primary" type="submit">${te('save')}</button></div></form>`,
          (el, close) => {
            $('[data-x]', el).onclick = close;
            $('#spf', el).onsubmit = e => {
              e.preventDefault(); const v = $('#spi', el).value.trim(); if (!v) return;
              tk.steps.splice(i, 0, { id: uid(), text: v.slice(0, 200), done: false }); save(); close(); render();
            };
          });
      }
      function stuck() {
        modal(`<h2 class="modal-title">${ICON.help}<span>${te('stuck_title')}</span></h2>
          <div class="stack">
            <button class="btn wide" data-o="split">${ICON.split}<span>${te('stuck_split')}</span></button>
            <button class="btn wide" data-o="2">${ICON.timer}<span>${te('stuck_2min')}</span></button>
            <button class="btn wide" data-o="break">${ICON.mountain}<span>${te('stuck_break')}</span></button>
            ${connected('grounding') ? `<a class="btn wide ghost" href="${GROUNDING_URL}" target="_blank" rel="noopener">${ICON.anchor}<span>${te('stuck_ground')}</span></a>` : ''}
            <button class="btn ghost" data-o="close">${te('close')}</button>
          </div>`,
          (el, close) => el.addEventListener('click', e => {
            const b = e.target.closest('[data-o]'); if (!b) return;
            const o = b.dataset.o; close();
            if (o === 'split') splitStep();
            else if (o === '2') { timerChoice = 2; render(); ctx(); startTimer(2); }
            else if (o === 'break') takeBreak();
          }));
      }
      function takeBreak() {
        const end = Date.now() + 60000; let loop = null;
        modal(`<div class="center break"><div class="breath-dot" aria-hidden="true"></div><p class="lead">${te('break_text')}</p><p class="timer-left" id="bl">1:00</p>
          <button class="btn" data-x>${te('done')}</button></div>`,
          (el, close) => {
            $('[data-x]', el).onclick = () => { clearInterval(loop); close(); };
            loop = setInterval(() => {
              if (!el.isConnected) { clearInterval(loop); return; }
              const l = (end - Date.now()) / 1000;
              $('#bl', el).textContent = mmss(l);
              if (l <= 0) { clearInterval(loop); if (S.vibrate && navigator.vibrate) navigator.vibrate(60); chime([523, 659]); $('#bl', el).textContent = '0:00'; }
            }, 250);
          });
      }
      function finish() {
        stopTimer(); focusStop();
        logEvent(0, 1);
        const gained = tk.steps.length * METRES_PER_STEP;
        if (tk.routine) tk.steps.forEach(s => { s.done = false; });
        save();
        if (S.cheerSound) chime([523, 659, 784, 1047]);
        if (S.vibrate && navigator.vibrate) navigator.vibrate([60, 60, 120]);
        dz.innerHTML = `
          <div class="card center done-card">
            <span class="done-icon">${ICON.checkCircle}</span>
            <h2 class="step-title">${te('task_done_title')}</h2>
            <p class="lead">${te('task_done_text', { name: tk.name || t('untitled') })}</p>
            <p class="gain">${te('climbed', { h: fmtHeight(gained) })}</p>
            ${tk.routine ? `<p class="muted with-ic">${ICON.repeat}<span>${te('routine_reset')}</span></p>` : ''}
          </div>
          ${climbCard(true)}
          <button class="btn primary big-btn wide" id="bk">${te('back_to_tasks')}</button>`;
        $('#bk', dz).onclick = () => replace('home', {});
      }
      render(null, true);   // opened by a tap (Start / Continue)
    },

    climb() {
      const st = stats(), c = climbInfo();
      const row = (k, v) => `<div class="stat"><span class="stat-t">${te(k)}</span>
        <span class="stat-v"><b>${esc(fmtNum(v[0]))}</b> ${te('steps_n')}</span>
        <span class="stat-v"><b>${esc(fmtNum(v[1]))}</b> ${te('tasks_n')}</span>
        <span class="stat-v"><b>${esc(fmtHeight(v[0] * METRES_PER_STEP))}</b></span></div>`;
      app.innerHTML = frame(t('climb_title'), `
        ${climbCard(false)}
        <p class="muted">${te('climb_d')}</p>
        <div class="card stats">${row('st_week', st.week)}${row('st_month', st.month)}${row('st_year', st.year)}${row('st_all', st.all)}</div>
        <h2 class="section-title">${te('milestones')}</h2>
        <ul class="list ms">${MILESTONES.map(([k, h]) => `<li class="ms-item${c.h >= h ? ' on' : ''}"><span class="ms-ic">${c.h >= h ? ICON.check : ICON.mountain}</span><span class="grow">${te(k)}</span><span class="muted">${esc(fmtHeight(h))}</span></li>`).join('')}</ul>`);
      $('.climb-card').removeAttribute('data-go');
    },

    settings() {
      const chips = (key, opts) => `<div class="chips" data-chips="${key}">${opts.map(([v, lbl]) => `<button class="chip" data-v="${esc(v)}" aria-pressed="${String(S[key]) === String(v)}">${esc(lbl)}</button>`).join('')}</div>`;
      const toggle = (key, label, desc) => `<label class="toggle"><span class="grow"><span>${esc(label)}</span>${desc ? `<small class="muted">${esc(desc)}</small>` : ''}</span>
          <input type="checkbox" data-tg="${key}" ${S[key] ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>`;
      const standalone = mq('(display-mode: standalone)') || navigator.standalone === true;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      app.innerHTML = frame(t('settings'), `
        <section class="card set"><h2 class="set-title">${te('language')}</h2>
          <div class="chips" data-chips="lang">${LANGS.map(([c, n]) => `<button class="chip" data-v="${c}" lang="${c === 'zh' ? 'zh-CN' : c}" aria-pressed="${S.lang === c}">${esc(n)}</button>`).join('')}</div></section>
        <section class="card set"><h2 class="set-title">${te('set_look')}</h2>
          ${chips('theme', [['calm', t('theme_calm')], ['night', t('theme_night')], ['contrast', t('theme_contrast')]])}
          <div class="field-label">${te('set_color')}</div>
          <div class="swatches" id="swatches">
            ${ACCENTS.map(([n, c]) => `<button class="sw-btn" data-c="${c}" style="background:${c}" aria-pressed="${S.accent === c}" aria-label="${te('col_' + n)}" title="${te('col_' + n)}"></button>`).join('')}
            <label class="sw-btn sw-custom" title="${te('col_custom')}" aria-pressed="${!ACCENTS.some(([, c]) => c === S.accent)}"><input type="color" id="swc" value="${S.accent}" aria-label="${te('col_custom')}"></label>
          </div>
          <p class="hint">${te('set_color_d')}</p>
          <div class="field-label">${te('set_text')}</div>
          ${chips('textSize', [['normal', t('size_normal')], ['large', t('size_large')], ['xl', t('size_xl')]])}
          ${toggle('reduceMotion', t('set_motion'), t('set_motion_d'))}</section>
        <section class="card set"><h2 class="set-title">${te('set_doing')}</h2>
          <div class="field-label">${te('set_timer_default')}</div>
          ${chips('timerDefault', TIMERS.map(m => [m, m ? t('min', { n: m }) : t('timer_off')]))}
          ${toggle('cheerSound', t('set_cheer'))}
          ${toggle('vibrate', t('set_vibe'))}
          ${toggle('splash', t('set_splash'), t('set_splash_d'))}</section>
        <section class="card set"><h2 class="set-title">${te('share_title')}</h2>
          <p class="muted">${te('share_d')}</p>
          <div class="stack"><button class="btn primary" data-act="share">${ICON.share}<span>${te('share_title')}</span></button></div></section>
        ${standalone ? '' : `<section class="card set" id="installSec" ${deferredPrompt || ios ? '' : 'hidden'}><h2 class="set-title">${te('install')}</h2>
          ${ios && !deferredPrompt ? `<p>${te('install_ios')}</p>` : `<button class="btn primary" id="installBtn">${ICON.download}<span>${te('install')}</span></button>`}</section>`}
        <section class="card set"><h2 class="set-title">${te('set_data')}</h2>
          <p class="muted">${te('set_data_d')}</p>
          <div class="stack">
            <button class="btn" id="exp">${ICON.download}<span>${te('set_export')}</span></button>
            <label class="btn file-btn">${ICON.upload}<span>${te('set_import')}</span><input type="file" accept="application/json,.json" id="imp" hidden></label>
            <button class="btn danger-ghost" id="wipe">${ICON.trash}<span>${te('set_wipe')}</span></button>
          </div></section>
        <section class="card set"><h2 class="set-title">${te('set_about')}</h2>
          <p>${te('about_text')}</p>
          <div class="stack">
            <a class="btn coffee" href="${BMC_URL}" target="_blank" rel="noopener noreferrer">${ICON.coffee}<span>${te('bmc')}</span></a>
            <button class="btn ghost" data-go="why">${ICON.info}<span>${te('why_link')}</span></button>
            ${F ? `<button class="btn ghost" data-go="family">${ICON.leaf}<span>${esc(ft('fam_title'))}</span></button>` : ''}
            <button class="btn ghost" data-go="terms">${te('terms_title')}</button>
          </div>
          <p class="muted center small">PaKuSteps · ${te('version', { v: APP_VERSION })}</p></section>`);
      const main = $('#main');
      main.addEventListener('click', e => {
        const c = e.target.closest('.chip'); if (!c) return;
        const key = c.parentElement.dataset.chips; let v = c.dataset.v;
        if (key === 'timerDefault') v = +v;
        S[key] = v; save(); applyLook();
        if (key === 'lang') { replace('settings', {}); return; }
        c.parentElement.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c));
      });
      main.addEventListener('change', e => {
        const tg = e.target.closest('[data-tg]'); if (!tg) return;
        S[tg.dataset.tg] = tg.checked; save(); applyLook();
        if (tg.dataset.tg === 'cheerSound' && tg.checked) chime([659, 880]);
      });
      const swr = $('#swatches');
      const setAccent = c => {
        S.accent = c.toLowerCase(); save(); applyLook();
        swr.querySelectorAll('.sw-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.c ? b.dataset.c === S.accent : !ACCENTS.some(([, x]) => x === S.accent)));
      };
      swr.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) setAccent(b.dataset.c); });
      $('#swc').addEventListener('input', e => setAccent(e.target.value));
      const ib = $('#installBtn');
      if (ib) ib.onclick = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) { } deferredPrompt = null; const s = $('#installSec'); if (s) s.hidden = true; };
      $('#exp').onclick = exportData;
      $('#imp').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) importData(f); e.target.value = ''; };
      $('#wipe').onclick = async () => {
        if (!(await confirmBox(t('set_wipe_confirm'), t('delete')))) return;
        try { localStorage.removeItem(KEY); } catch (e) { }
        location.replace(location.pathname);
      };
    },

    why() {
      const parts = [['why_h_for', 'why_for'], ['why_h_works', 'why_works'], ['why_h_helps', 'why_helps'], ['why_h_tips', 'why_tips'], ['why_h_limits', 'why_limits']];
      app.innerHTML = frame(t('why_link'), parts.map(([h, p]) => `<section class="card why"><h2>${te(h)}</h2><p>${te(p)}</p></section>`).join('') +
        `<div class="center"><button class="btn primary big-btn" data-go="edit">${ICON.plus}<span>${te('new_task')}</span></button></div>`);
    },

    family() {
      if (!F) { replace('home', {}); return; }
      const paint = () => {
        app.innerHTML = frame(ft('fam_title'), `<p class="muted">${esc(ft('fam_d'))}</p>
          <ul class="list fam">${F.all().map(a => {
            const me = a.id === SELF, used = me || F.used(a.id);
            return `<li class="card fam-app${me ? ' me' : ''}">
              <div class="fam-head"><img class="fam-ic" src="${esc(F.icon(a))}" alt="" width="48" height="48" onerror="this.style.visibility='hidden'">
                <span class="grow"><strong>${esc(a.name)}</strong><small class="muted">${esc(F.desc(a, S.lang))}</small>
                ${me ? `<small class="fam-tag">${esc(ft('fam_this'))}</small>` : used ? `<small class="fam-tag">${ICON.check}${esc(ft('fam_used'))}</small>` : ''}</span>
                ${me ? '' : `<a class="btn small${used ? ' primary' : ''}" href="${esc(F.url(a))}" target="_blank" rel="noopener">${esc(ft(used ? 'fam_open' : 'fam_get'))}</a>`}</div>
              ${!me && LINKS_TO.includes(a.id) ? `<label class="toggle"><span class="grow"><span>${esc(ft('fam_link'))}</span><small class="muted">${esc(ft('fam_link_d'))}</small></span>
                <input type="checkbox" data-fam="${esc(a.id)}" ${connected(a.id) ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>` : ''}
            </li>`;
          }).join('')}</ul>
          <a class="btn wide" href="${esc(F.hub)}" target="_blank" rel="noopener">${ICON.leaf}<span>${esc(ft('fam_hub'))}</span></a>`);
        $('#main').addEventListener('change', e => {
          const c = e.target.closest('[data-fam]'); if (!c) return;
          S.family[c.dataset.fam] = c.checked; save();
        });
      };
      paint();
      F.detect().then(() => { if (current.screen === 'family') paint(); });
    },

    terms() {
      app.innerHTML = frame(t('terms_title'), `<article class="card prose">
        ${[1, 2, 3, 4, 5].map(i => `<p>${te('terms_' + i)}</p>`).join('')}
        ${CONTACT_EMAIL ? `<p>${te('terms_contact', { email: CONTACT_EMAIL })}</p>` : ''}
      </article>`);
    }
  };

  /* ---------- backup ---------- */
  function exportData() {
    const out = { app: 'PaKuSteps', format: 1, version: APP_VERSION, exported: new Date().toISOString(), data: S };
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `pakusteps-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  async function importData(file) {
    try {
      const d = JSON.parse(await file.text());
      if (!d || d.app !== 'PaKuSteps' || typeof d.data !== 'object') throw new Error('bad');
      S = normalize(d.data); S.tipDismissed = true; save(); applyLook();
      replace('settings', {}); toast(t('set_import_ok'));
    } catch (e) { toast(t('set_import_bad')); }
  }

  /* ---------- splash (optional) ---------- */
  function splash() {
    const c = climbInfo();
    const el = document.createElement('div');
    el.className = 'splash'; el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.innerHTML = `<div class="splash-in"><span class="splash-ic">${ICON.mountain}</span>
      <p class="muted">${te('climb_now')}</p><p class="splash-h">${esc(fmtHeight(c.h))}</p>
      ${c.reached ? `<p>${te('reached', { m: t(c.reached[0]) })}</p>` : ''}
      ${c.next ? `<p class="muted">${te('next_goal', { m: t(c.next[0]), left: fmtHeight(c.next[1] - c.h) })}</p>` : ''}
      <p class="small muted">${te('tap_skip')}</p></div>`;
    document.body.appendChild(el);
    const close = () => { if (el.isConnected) el.remove(); };
    el.addEventListener('click', close); el.addEventListener('keydown', close);
    setTimeout(close, 4000); el.focus();
  }

  /* ---------- install & offline ---------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (current.screen === 'settings') replace('settings', {}); });
  function setupSW() {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) return;
    let wantReload = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) { wantReload = false; location.reload(); } });
    navigator.serviceWorker.register('./sw.js').then(reg => {
      /* on the home screen a new version is applied at once; in the middle of a task the user decides */
      const offer = w => { if (current.screen === 'home') { wantReload = true; w.postMessage('SKIP_WAITING'); return; } toast(t('update_ready'), t('reload'), () => { wantReload = true; w.postMessage('SKIP_WAITING'); }); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => { }); });
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener('statechange', () => {
          if (w.state !== 'installed') return;
          if (navigator.serviceWorker.controller) offer(w);
          else if (!S.offlineToastShown) { S.offlineToastShown = true; save(); toast(t('offline_ready')); }
        });
      });
    }).catch(() => { });
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { }
  }

  /* ---------- start ---------- */
  const startNew = new URLSearchParams(location.search).get('new') === '1';
  applyLook();
  history.replaceState({ screen: 'home', params: {} }, '', location.pathname);
  show('home', {}, false);
  if (startNew) show('edit');
  else if (S.splash) splash();
  setupSW();
  if (F) F.detect().then(() => F.refresh());
})();
