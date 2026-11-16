/* =====================================================================
   玉桂狗征女朋友 · behaviour
   0 content.txt (all the Chinese text) · 1 helpers · 2 sky + scroll
   3 sparkles · 4 hero · 5 stock chart · 6 mini-games · 7 checker + jokes
   8 contact form · 9 tape + tools
   No dependencies. Everything is deterministic except the mini-games.
   ===================================================================== */
(async () => {
  'use strict';

  /* ---------- 1. helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const usd = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pctAbs = (v, d = 1) => Math.abs(v * 100).toFixed(d) + '%';
  const pctSigned = (v, d = 1) => (v >= 0 ? '+' : '−') + pctAbs(v, d);
  const fmtDate = (t) => new Date(t).toISOString().slice(0, 10).replace(/-/g, '/');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };
  const h = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---------- 0. text: every Chinese string on the page lives in content.txt ----------
     content.txt is "key = text" lines. index.html holds {{key}} placeholders (in text and in
     attributes) and this file asks for T('key'). Inside a line, {word|pinyin} makes a grammar
     highlight and [pinyin, English] makes a gloss; {name} is a number this file fills in. */
  const C = Object.create(null);
  const parseContent = (src) => {
    src.replace(/^﻿/, '').split(/\r?\n/).forEach((line, n) => {
      if (!line.trim() || line.trimStart().startsWith('#')) return;
      const eq = line.indexOf('=');
      const key = eq > 0 ? line.slice(0, eq).trim() : '';
      if (!/^\w+$/.test(key)) { console.warn(`content.txt line ${n + 1}: expected "key = text"`); return; }
      if (key in C) console.warn(`content.txt line ${n + 1}: "${key}" appears twice, the last one wins`);
      C[key] = line.slice(eq + 1).trim();
    });
  };
  const T = (key, vars = {}) => {
    if (!(key in C)) { console.warn(`content.txt: no line for "${key}"`); return '⚠ ' + key; }
    return C[key].replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  };
  const rich = (s) => { // plain text + <mark class="g" title="pinyin"> + <span class="gloss">, built as DOM (never innerHTML)
    const frag = document.createDocumentFragment();
    const re = /\{([^{}|]+)\|([^{}]+)\}|\[([^\]]+)\]/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) frag.append(s.slice(last, m.index));
      if (m[1] != null) { const mk = h('mark', 'g', m[1]); mk.title = m[2]; frag.append(mk); }
      else frag.append(h('span', 'gloss', `(${m[3]})`));
      last = re.lastIndex;
    }
    if (last < s.length) frag.append(s.slice(last));
    return frag;
  };
  const fillPage = () => {
    const ph = /\{\{(\w+)\}\}/g;
    document.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((a) => { if (a.value.includes('{{')) a.value = a.value.replace(ph, (_, k) => T(k)); });
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.includes('{{') && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const out = [];
      n.nodeValue.split(/\{\{(\w+)\}\}/).forEach((part, i) => { if (i % 2) out.push(rich(T(part))); else if (part) out.push(part); });
      n.replaceWith(...out);
    });
    document.title = T('page_title');
  };
  try {
    const res = await fetch('content.txt', { cache: 'no-cache' }); // no-cache: an edit shows up on the next reload
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    parseContent(await res.text());
  } catch (err) {
    console.error('content.txt could not be loaded:', err);
    document.body.prepend(h('p', 'noscript', '⚠️ content.txt could not be loaded. Open the site through a web server (python3 -m http.server) or GitHub Pages: a page opened straight from disk cannot read it.'));
  }
  fillPage();
  document.documentElement.classList.add('ready');

  /* ---------- 2. sky, scroll progress, reveal, nav ---------- */
  const sky = $('#sky');
  for (let i = 0; i < 26; i++) {
    const s = h('i', 'star');
    s.style.cssText = `left:${rand(1, 98).toFixed(1)}%;top:${rand(1, 96).toFixed(1)}%;--s:${rand(8, 20).toFixed(0)}px;--t:${rand(2.4, 5).toFixed(1)}s;--dl:${rand(-5, 0).toFixed(1)}s`;
    sky.append(s);
  }
  const clouds = $$('.cloud');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (!reduced) clouds.forEach((c) => { c.style.transform = `translateY(${(-scrollY * Number(c.dataset.speed)).toFixed(1)}px)`; });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  const navLinks = $$('[data-nav]');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => navIO.observe(s));

  /* ---------- 3. sparkles (cursor trail + bursts) ---------- */
  const cv = $('#sparkles');
  const cx = cv.getContext('2d');
  const parts = [];
  const COLORS = ['#ffffff', '#ffd1e1', '#a9d8fb', '#fff0a6', '#f8bcd2'];
  let sparkRunning = false;
  const sizeCanvas = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeCanvas();
  addEventListener('resize', sizeCanvas);
  const starPath = (x, y, r, rot) => {
    cx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r; const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    cx.closePath();
  };
  const heartPath = (x, y, r) => {
    cx.beginPath(); cx.moveTo(x, y + r * 0.9);
    cx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.7, y - r * 1.1, x, y - r * 0.4);
    cx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.2, x, y + r * 0.9);
    cx.closePath();
  };
  const sparkTick = () => {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.rot += p.vr;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      cx.globalAlpha = 1 - p.life / p.max;
      cx.fillStyle = p.c; cx.strokeStyle = 'rgba(70,130,190,.6)'; cx.lineWidth = 1;
      if (p.heart) heartPath(p.x, p.y, p.size * 0.6); else starPath(p.x, p.y, p.size, p.rot);
      cx.fill(); cx.stroke();
    }
    cx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(sparkTick); else sparkRunning = false;
  };
  const spawn = (x, y, n, burst) => {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2; const v = burst ? rand(1.5, 5.5) : rand(0.2, 1.1);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (burst ? 1.6 : 0.2), life: 0, max: rand(40, 85), size: rand(5, 11), rot: rand(0, 6.28), vr: rand(-0.1, 0.1), c: pick(COLORS), heart: Math.random() < 0.4 });
    }
    if (parts.length > 260) parts.splice(0, parts.length - 260);
    if (!sparkRunning) { sparkRunning = true; requestAnimationFrame(sparkTick); }
  };
  const burstAt = (el, n = 36) => { const r = el.getBoundingClientRect(); spawn(r.left + r.width / 2, r.top + r.height / 2, n, true); };
  let lx = -99, ly = -99;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (Math.hypot(e.clientX - lx, e.clientY - ly) > 16) { lx = e.clientX; ly = e.clientY; spawn(lx, ly, 1, false); }
  }, { passive: true });
  addEventListener('pointerdown', (e) => spawn(e.clientX, e.clientY, 9, true), { passive: true });

  /* ---------- 4. hero ---------- */
  const title = $('#title');
  const titleText = title.textContent.trim();
  title.setAttribute('aria-label', titleText);
  title.textContent = '';
  [...titleText].forEach((ch, i) => {
    const s = h('span', '', ch); s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); title.append(s);
  });
  const heroPhoto = $('.hero-photo');
  if (!reduced && heroPhoto) {
    $('.hero').addEventListener('pointermove', (e) => {
      const r = heroPhoto.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth; const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      heroPhoto.style.transform = `perspective(900px) rotateY(${(dx * 14).toFixed(2)}deg) rotateX(${(-dy * 12).toFixed(2)}deg)`;
    });
    $('.hero').addEventListener('pointerleave', () => { heroPhoto.style.transform = ''; });
  }

  /* ---------- 5. the spoof stock chart ---------- */
  const EVENTS = [ // the date and icon pick the spot on the chart; each story's title + text are news_<n>_title / news_<n>_text in content.txt
    { d: '2024-09-02', icon: '🔔' },
    { d: '2025-02-18', icon: '🚀' },
    { d: '2025-08-05', icon: '🍥' },
    { d: '2025-11-03', icon: '🤫' },
    { d: '2026-01-20', icon: '🏔️' },
    { d: '2026-01-21', icon: '💔' },
    { d: '2026-03-09', icon: '🎙️' },
    { d: '2026-06-01', icon: '📦' },
    { d: '2026-09-01', icon: '🗓️' },
    { d: '2026-11-13', icon: '💌' },
  ].map((e, k) => ({ ...e, title: T(`news_${k + 1}_title`), text: T(`news_${k + 1}_text`) }));
  const KEYFRAMES = [
    ['2024-09-02', 12], ['2024-12-02', 21], ['2025-02-17', 38], ['2025-02-18', 63], ['2025-06-02', 150], ['2025-08-05', 228],
    ['2025-11-03', 318], ['2026-01-20', 486], ['2026-01-21', 372], ['2026-02-10', 301], ['2026-03-09', 236],
    ['2026-04-20', 171], ['2026-06-01', 116], ['2026-07-15', 70], ['2026-09-01', 38], ['2026-10-12', 21], ['2026-11-13', 9.75],
  ];
  const AFFAIR_DATE = '2025-11-03', PEAK_DATE = '2026-01-20', REVEAL_DATE = '2026-01-21';
  const FORECAST = [[10, 12.4], [25, 31], [45, 66], [60, 98]]; // [days after today, price]: pure fantasy

  // weekdays only; 60 more after "today" for the what-if forecast
  const DAY = 864e5;
  const days = [];
  for (let t = Date.UTC(2024, 8, 2); t <= Date.UTC(2026, 10, 13); t += DAY) { const w = new Date(t).getUTCDay(); if (w && w < 6) days.push(t); }
  const N = days.length, F = 60, TOTAL = N + F;
  for (let t = days[N - 1]; days.length < TOTAL;) { t += DAY; const w = new Date(t).getUTCDay(); if (w && w < 6) days.push(t); }
  const idxOf = (iso) => { const i = days.indexOf(Date.parse(iso)); if (i < 0) throw new Error('Not a trading day: ' + iso); return i; };

  // seeded noise so the chart is identical for everyone
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rng = mulberry(20240902);
  const gauss = () => { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); };
  const affairIdx = idxOf(AFFAIR_DATE), peakIdx = idxOf(PEAK_DATE), revealIdx = idxOf(REVEAL_DATE);
  const P = new Array(TOTAL);
  const bridge = (kf, sigmaOf) => { // log-linear path + a Brownian bridge, so it passes through every keyframe
    for (let s = 0; s < kf.length - 1; s++) {
      const [i0, l0] = kf[s], [i1, l1] = kf[s + 1], n = i1 - i0, sig = sigmaOf(i0);
      const w = [0]; let acc = 0;
      for (let k = 1; k <= n; k++) { acc += gauss() * sig; w.push(acc); }
      for (let k = 0; k <= n; k++) P[i0 + k] = Math.exp(lerp(l0, l1, k / n) + w[k] - (k / n) * w[n]);
    }
  };
  bridge(KEYFRAMES.map(([d, p]) => [idxOf(d), Math.log(p)]), (i) => (i >= revealIdx ? 0.036 : i >= affairIdx ? 0.012 : 0.024));
  const cap = P[peakIdx] * 0.985; // the peak really is the peak: bounce noise off the cap instead of flattening it
  for (let i = 0; i < peakIdx; i++) if (P[i] > cap) P[i] = Math.max(cap * 0.9, 2 * cap - P[i]);
  bridge([[N - 1, Math.log(P[N - 1])], ...FORECAST.map(([k, p]) => [N - 1 + k, Math.log(p)])], () => 0.03);
  for (let i = 0; i < TOTAL; i++) P[i] = Math.round(P[i] * 100) / 100;
  const PEAK = P[peakIdx], LAST = P[N - 1];
  const runMax = []; P.forEach((v, i) => runMax.push(i ? Math.max(runMax[i - 1], v) : v));
  const eventIdx = EVENTS.map((e) => idxOf(e.d));
  const revealDrop = P[revealIdx] / P[peakIdx] - 1;
  const fromPeakNow = LAST / PEAK - 1;

  // --- DOM
  const card = $('#chart-card'), wrap = $('#chart-wrap'), svg = $('#chart'), tip = $('#tip'), banner = $('#banner');
  const pxEl = $('#px'), chgEl = $('#chg'), phaseEl = $('#phase'), dateEl = $('#st-date'), ddEl = $('#st-dd');
  const moodEl = $('#st-mood'), moodMeter = $('#mood-meter'), moodFill = $('#mood-fill');
  const playBtn = $('#play'), replayBtn = $('#replay'), scrub = $('#scrub'), whatifBtn = $('#whatif'), feed = $('#feed');

  // --- state
  let cursor = 0, playing = false, hover = null, scrubbing = false, dragging = false, forecastOn = false;
  let started = false, revealFired = false, holdFor = 0, lastT = 0, puffAcc = 0, W = 0, H = 0, yMax = 0;
  const M = { t: 30, r: 16, b: 34, l: 46 };
  const maxC = () => (forecastOn ? TOTAL - 1 : N - 1);
  const xs = (i) => M.l + (i / (TOTAL - 1)) * (W - M.l - M.r);
  const ys = (v) => M.t + (1 - v / yMax) * (H - M.t - M.b);
  const refs = { anns: [], pins: [] };

  const phaseText = (i) => {
    if (i >= N) return '🚀💌';
    if (i === 0) return '🔔';
    if (i < affairIdx) return T('phase_up');
    if (i < peakIdx) return '▲ 🤫';
    if (i === peakIdx) return '🏔️';
    if (i === revealIdx) return T('phase_reveal');
    return T('phase_down');
  };
  const moodOf = (i) => {
    const dd = 1 - P[i] / runMax[i];
    if (i >= N) return ['🚀', dd];
    if (i >= affairIdx && i < revealIdx) return ['😏', dd];
    if (dd < 0.05) return ['😍', dd];
    if (dd < 0.35) return ['😬', dd];
    if (dd < 0.7) return ['😱', dd];
    if (dd < 0.95) return ['💔', dd];
    return ['🥲', dd];
  };

  function build() {
    W = Math.max(280, Math.round(wrap.clientWidth));
    H = W < 520 ? Math.round(W * 0.95) : clamp(Math.round(W * 0.46), 340, 500);
    yMax = PEAK * 1.1;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    refs.anns = []; refs.pins = [];
    const narrow = W < 520;
    const base = ys(0);
    const pw = clamp(W * 0.085, 46, 78); // rider width

    const t = svgEl('title', { id: 'chart-title' }, svg); t.textContent = T('chart_title');
    const d = svgEl('desc', { id: 'chart-desc' }, svg);
    d.textContent = T('chart_desc', {
      start_price: usd(P[0]), start_date: fmtDate(days[0]), peak_price: usd(PEAK), peak_date: fmtDate(days[peakIdx]),
      drop: pctAbs(revealDrop, 0), last_price: usd(LAST), last_date: fmtDate(days[N - 1]), from_peak: pctAbs(fromPeakNow, 0),
    });

    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: 'clip-reveal' }, defs);
    refs.clipRect = svgEl('rect', { x: 0, y: 0, width: 0, height: H + 20 }, clip);

    // grid + y axis ($0 … $500)
    for (let v = 0; v <= 500; v += 100) {
      svgEl('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: ys(v), y2: ys(v) }, svg);
      const tx = svgEl('text', { class: 'axis-lbl', x: M.l - 8, y: ys(v) + 4, 'text-anchor': 'end' }, svg); tx.textContent = '$' + v;
    }
    // x axis: a label every quarter (every half year on a phone), as year/month
    const tickMonths = narrow ? [0, 6] : [0, 3, 6, 9]; let prevM = -1;
    days.forEach((tm, i) => {
      if (i >= N) return;
      const dt = new Date(tm); const mo = dt.getUTCMonth();
      if (mo === prevM) return; prevM = mo;
      if (!tickMonths.includes(mo)) return;
      const tx = svgEl('text', { class: 'axis-lbl', x: xs(i), y: H - 10, 'text-anchor': 'middle' }, svg);
      tx.textContent = `${dt.getUTCFullYear()}/${mo + 1}`;
    });

    // the affair (secret) band + "future" region
    const bx = xs(affairIdx), bw = xs(revealIdx) - xs(affairIdx);
    svgEl('rect', { class: 'band', x: bx, y: M.t, width: bw, height: base - M.t, rx: 6 }, svg);
    const bl = svgEl('text', { class: 'band-lbl', transform: `translate(${bx + bw / 2 + 4} ${base - 12}) rotate(-90)` }, svg); bl.textContent = T('band_label');
    svgEl('rect', { x: xs(N - 1), y: M.t, width: W - M.r - xs(N - 1), height: base - M.t, fill: 'rgba(47,134,214,.045)', rx: 6 }, svg);
    refs.future = svgEl('text', { class: 'future-lbl', transform: `translate(${(xs(N - 1) + W - M.r) / 2 + 4} ${M.t + 52}) rotate(-90)`, 'text-anchor': 'end' }, svg);
    refs.future.textContent = T('future_label'); refs.future.style.transition = 'opacity .4s';
    svgEl('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: base, y2: base, stroke: '#c9d8e8' }, svg);

    // everything that is drawn progressively lives in a clipped group
    const g = svgEl('g', { 'clip-path': 'url(#clip-reveal)' }, svg);
    const pts = (a, b) => { let s = ''; for (let i = a; i <= b; i++) s += (i === a ? 'M' : 'L') + xs(i).toFixed(1) + ' ' + ys(P[i]).toFixed(1); return s; };
    const area = (a, b) => `${pts(a, b)}L${xs(b).toFixed(1)} ${base}L${xs(a).toFixed(1)} ${base}Z`;
    svgEl('path', { class: 'area up', d: area(0, peakIdx) }, g);
    svgEl('path', { class: 'area down', d: area(peakIdx, N - 1) }, g);
    svgEl('line', { x1: xs(revealIdx), x2: xs(revealIdx), y1: ys(PEAK) - 6, y2: base, stroke: 'rgba(214,69,107,.55)', 'stroke-width': 1 }, g);
    svgEl('path', { class: 'ln up', d: pts(0, peakIdx) }, g);
    svgEl('path', { class: 'ln down', d: pts(peakIdx, N - 1) }, g);
    refs.fc = svgEl('path', { class: 'ln fc', d: pts(N - 1, TOTAL - 1) }, g);
    refs.fc.style.display = forecastOn ? '' : 'none';
    svgEl('circle', { class: 'dot down', cx: xs(N - 1), cy: ys(LAST), r: 5 }, g);

    // direct labels (selective): peak + reveal, rising, falling, now
    const label = (at, build2) => { const grp = svgEl('g', {}, svg); grp.style.opacity = 0; grp.style.transition = 'opacity .5s'; build2(grp); refs.anns.push({ el: grp, at }); };
    const keyed = (grp, x, y, color, str, anchorEnd) => {
      const tx = svgEl('text', { class: 'ann', y }, grp); tx.textContent = str;
      const len = tx.getComputedTextLength() || 60;
      const tx0 = anchorEnd ? x - 24 - len : x + 24;
      tx.setAttribute('x', tx0);
      const lx = anchorEnd ? x - 20 : x + 2;
      svgEl('line', { class: 'key-line', x1: lx, x2: lx + 18, y1: y - 4, y2: y - 4, stroke: color }, grp);
    };
    label(revealIdx, (grp) => {
      const cxp = clamp(xs(peakIdx), 80, W - 80);
      const a = svgEl('text', { class: 'ann', x: cxp, y: ys(PEAK) - 24, 'text-anchor': 'middle' }, grp); a.textContent = `🏔️ ${usd(PEAK)}`;
      const b = svgEl('text', { class: 'ann', x: cxp, y: ys(PEAK) - 9, 'text-anchor': 'middle' }, grp); b.textContent = T('ann_peak_drop', { drop: pctSigned(revealDrop, 0) });
    });
    const ri = Math.round(peakIdx * 0.45), fi = revealIdx + Math.round((N - 1 - revealIdx) * 0.3);
    if (!narrow) { // on a phone the key under the chart names the two colours instead
      label(ri, (grp) => keyed(grp, xs(ri) + 6, ys(P[ri]) + 30, '#2f86d6', T('ann_rise'), false));
      label(fi, (grp) => keyed(grp, xs(fi) - 6, ys(P[fi]) + 30, '#d6456b', T('ann_fall'), true));
    }
    label(N - 1, (grp) => {
      const nx = narrow ? xs(N - 1) + 8 : xs(N - 1) - pw * 0.55 - 6, ny = ys(LAST) - (narrow ? 92 : 60); // phone: lift it above the Sept pin
      const tx = svgEl('text', { class: 'ann', x: nx, y: ny, 'text-anchor': 'end' }, grp); tx.textContent = `📍 ${usd(LAST)}`;
      const sub = svgEl('text', { class: 'ann-sub', x: nx, y: ny + 13, 'text-anchor': 'end' }, grp); sub.textContent = `${pctSigned(fromPeakNow, 0)} 🏔️`;
    });

    // news pins
    EVENTS.forEach((e, k) => {
      const i = eventIdx[k];
      const pg = svgEl('g', { class: 'pin-g', transform: `translate(${xs(i)} ${ys(P[i])})`, 'data-i': i, 'data-k': k }, svg);
      pg.style.opacity = 0; pg.style.transition = 'opacity .3s';
      svgEl('circle', { class: 'pin-hit', r: 15 }, pg);
      svgEl('circle', { class: 'pin' + (i === revealIdx ? ' reveal-pin' : ''), r: i === revealIdx ? 6.5 : 5.5 }, pg);
      refs.pins.push({ el: pg, at: i });
    });

    // crosshair + rider
    refs.xhair = svgEl('line', { class: 'xhair', y1: M.t, y2: base }, svg); refs.xhair.style.display = 'none';
    refs.hdot = svgEl('circle', { class: 'dot', r: 5 }, svg); refs.hdot.style.display = 'none';
    refs.ph = pw * (498 / 640);
    refs.plane = svgEl('g', { class: 'plane' }, svg);
    svgEl('image', { href: 'images/plane.webp', x: -pw / 2, y: -refs.ph * 0.92, width: pw, height: refs.ph }, refs.plane);
    update();
  }

  function slopeAngle(c) {
    const a = clamp(Math.floor(c) - 3, 0, maxC()), b = clamp(Math.ceil(c) + 3, 0, maxC());
    if (a === b) return 0;
    const ang = (Math.atan2(ys(P[b]) - ys(P[a]), xs(b) - xs(a)) * 180) / Math.PI;
    return clamp(ang, -32, 58);
  }
  const valueAt = (c) => { const lo = clamp(Math.floor(c), 0, TOTAL - 1), hi = Math.min(lo + 1, TOTAL - 1); return lerp(P[lo], P[hi], clamp(c - lo, 0, 1)); };

  function update() {
    if (!refs.plane) return;
    const x = xs(cursor), y = ys(valueAt(cursor));
    refs.clipRect.setAttribute('width', Math.max(0, x + 0.5));
    refs.plane.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${slopeAngle(cursor).toFixed(1)}) scale(-1 1)`);
    refs.anns.forEach((a) => { a.el.style.opacity = cursor >= a.at ? 1 : 0; });
    refs.pins.forEach((p) => { p.el.style.opacity = cursor >= p.at ? 1 : 0; });
    refs.future.style.opacity = forecastOn ? 0 : 1;

    const shown = hover != null ? hover : Math.round(cursor);
    readout(shown);
    const tipIdx = hover != null ? hover : (scrubbing ? Math.round(cursor) : null);
    if (tipIdx != null) showTip(tipIdx); else { tip.hidden = true; refs.xhair.style.display = 'none'; refs.hdot.style.display = 'none'; }
    if (document.activeElement !== scrub || playing) scrub.value = Math.round(cursor);
    scrub.max = maxC();
    scrub.setAttribute('aria-valuetext', `${fmtDate(days[Math.round(cursor)])}, ${usd(P[Math.round(cursor)])}`);
  }

  function readout(i) {
    const prev = i > 0 ? P[i - 1] : P[0];
    const chg = P[i] / prev - 1;
    pxEl.textContent = usd(P[i]);
    chgEl.textContent = (chg >= 0 ? '▲ ' : '▼ ') + pctAbs(chg);
    chgEl.classList.toggle('neg', chg < 0);
    phaseEl.textContent = phaseText(i);
    dateEl.textContent = fmtDate(days[i]) + (i >= N ? ' 🚀' : '');
    const [mood, dd] = moodOf(i);
    ddEl.textContent = dd < 0.0005 ? '0.0%' : '−' + pctAbs(dd);
    moodEl.textContent = mood;
    moodFill.style.width = (dd * 100).toFixed(1) + '%';
    moodMeter.setAttribute('aria-valuenow', Math.round(dd * 100));
    // news feed: dim the future, highlight the latest story
    let active = -1;
    eventIdx.forEach((ei, k) => { if (ei <= i) active = k; });
    feedItems.forEach((b, k) => {
      b.classList.toggle('upcoming', eventIdx[k] > cursor);
      if (k === active) { if (b.getAttribute('aria-current') !== 'true') { b.setAttribute('aria-current', 'true'); centerFeed(b); } }
      else b.removeAttribute('aria-current');
    });
  }

  function showTip(i) {
    const x = xs(i), y = ys(P[i]);
    const down = i > peakIdx && i < N;
    const prev = i > 0 ? P[i - 1] : P[0];
    const dayChg = P[i] / prev - 1;
    tip.replaceChildren();
    tip.append(h('div', 't-date', fmtDate(days[i]) + (i >= N ? ' 🚀' : '')), h('div', 't-px', usd(P[i])));
    const r1 = h('div', 't-row'); r1.append(h('i', 't-key' + (down ? ' down' : '')), h('span', '', `📅 ${pctSigned(dayChg)}`)); tip.append(r1);
    const r2 = h('div', 't-row'); r2.append(h('i', 't-key none'), h('span', '', `🏔️ ${pctSigned(P[i] / PEAK - 1)}`)); tip.append(r2);
    const k = eventIdx.indexOf(i);
    if (k >= 0) tip.append(h('div', 't-ev', `${EVENTS[k].icon} ${EVENTS[k].title}`));
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = x < W * 0.55 ? x + 18 : x - 18 - tw;
    tip.style.left = clamp(left, 4, W - tw - 4) + 'px';
    tip.style.top = clamp(y - th / 2, 4, H - th - 4) + 'px';
    refs.xhair.setAttribute('x1', x); refs.xhair.setAttribute('x2', x); refs.xhair.style.display = '';
    refs.hdot.setAttribute('cx', x); refs.hdot.setAttribute('cy', y);
    refs.hdot.setAttribute('class', 'dot ' + (down ? 'down' : 'up')); refs.hdot.style.display = '';
  }

  // news feed + data table
  const feedItems = EVENTS.map((e, k) => {
    const li = h('li'); const b = h('button', 'ev'); b.type = 'button';
    const top = h('div', 'e-top'); top.append(h('span', '', e.icon), h('span', '', fmtDate(days[eventIdx[k]])));
    b.append(top, h('div', 'e-title', e.title), h('p', 'e-body', e.text), h('div', 'e-top', usd(P[eventIdx[k]])));
    b.addEventListener('click', () => { seek(eventIdx[k]); });
    li.append(b); feed.append(li); return b;
  });
  const centerFeed = (b) => {
    if (feed.matches(':hover') && !playing) return;
    const left = b.parentElement.offsetLeft - (feed.clientWidth - b.parentElement.offsetWidth) / 2;
    feed.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' });
  };
  (() => {
    const tbl = $('#data-table'); const head = tbl.createTHead().insertRow();
    ['📅', '💲', '🏔️'].forEach((t) => head.append(Object.assign(document.createElement('th'), { textContent: t, scope: 'col' })));
    const body = tbl.createTBody();
    for (let i = 0; i < N; i++) {
      if (i < N - 1 && new Date(days[i]).getUTCMonth() === new Date(days[i + 1]).getUTCMonth()) continue;
      const r = body.insertRow();
      [fmtDate(days[i]), usd(P[i]), pctSigned(P[i] / runMax[i] - 1)].forEach((v) => r.insertCell().textContent = v);
    }
  })();

  // playback
  const setPlayLabel = () => { playBtn.textContent = playing ? '⏸️' : '▶️'; playBtn.setAttribute('aria-label', playing ? T('btn_pause') : T('btn_play')); };
  const spawnPuff = (emoji) => {
    if (reduced || wrap.querySelectorAll('.puff').length > 22) return;
    const p = h('span', 'puff', emoji); const x = xs(cursor), y = ys(valueAt(cursor));
    p.style.left = x - 8 + 'px'; p.style.top = y - 20 + 'px';
    p.style.setProperty('--dx', rand(-34, 34).toFixed(0) + 'px'); p.style.setProperty('--dy', rand(-90, -30).toFixed(0) + 'px');
    wrap.append(p); p.addEventListener('animationend', () => p.remove());
  };
  const onReveal = () => {
    if (reduced) return;
    restart(card, 'shake'); restart(banner, 'show');
    for (let k = 0; k < 14; k++) setTimeout(() => spawnPuff('💔'), k * 45);
  };
  const onEnd = () => {
    if (reduced) return;
    const happy = cursor > N - 1;
    for (let k = 0; k < 9; k++) setTimeout(() => spawnPuff(happy ? '🎉' : '💫'), k * 60);
    const r = wrap.getBoundingClientRect(); spawn(r.left + xs(cursor), r.top + ys(valueAt(cursor)), happy ? 40 : 16, true);
  };
  function frame(now) {
    if (!playing) return;
    const dt = clamp((now - lastT) / 1000, 0, 0.05); lastT = now; // rAF's timestamp can precede performance.now() on the first frame
    if (holdFor > 0) { holdFor -= dt; requestAnimationFrame(frame); return; }
    let speed = (N - 1) / 9.5;
    if (cursor >= N - 1) speed = F / 3.8;
    else { const dRev = Math.abs(cursor - revealIdx); if (dRev < 9) speed *= 0.3 + 0.7 * (dRev / 9); }
    const before = cursor; cursor = Math.min(maxC(), cursor + speed * dt);
    if (before < revealIdx && cursor >= revealIdx && !revealFired) { revealFired = true; cursor = revealIdx; holdFor = 0.9; onReveal(); }
    puffAcc += dt;
    if (puffAcc > 0.12) { puffAcc = 0; spawnPuff(cursor > peakIdx && cursor < N ? pick(['💔', '💸', '📉']) : pick(['✨', '💙', '⭐'])); }
    update();
    if (cursor >= maxC()) { playing = false; setPlayLabel(); onEnd(); return; }
    requestAnimationFrame(frame);
  }
  function play() {
    if (cursor >= maxC() - 0.01) { cursor = 0; revealFired = false; }
    if (playing) return;
    playing = true; lastT = performance.now(); setPlayLabel(); requestAnimationFrame(frame);
  }
  function pause() { playing = false; setPlayLabel(); }
  function seek(i) { pause(); cursor = clamp(i, 0, maxC()); revealFired = cursor >= revealIdx; update(); }

  playBtn.addEventListener('click', () => { if (playing) pause(); else play(); });
  replayBtn.addEventListener('click', () => { cursor = 0; revealFired = false; playing = false; play(); });
  scrub.addEventListener('input', () => { seek(Number(scrub.value)); });
  // while the slider is dragged or stepped with the keyboard, show the same crosshair + tooltip as hover
  scrub.addEventListener('keydown', () => { scrubbing = true; });
  scrub.addEventListener('pointerdown', () => { scrubbing = true; });
  scrub.addEventListener('blur', () => { scrubbing = false; update(); });
  addEventListener('pointerup', () => { if (scrubbing) { scrubbing = false; update(); } });
  whatifBtn.addEventListener('click', () => {
    forecastOn = !forecastOn;
    whatifBtn.setAttribute('aria-pressed', forecastOn);
    refs.fc.style.display = forecastOn ? '' : 'none';
    if (forecastOn) { if (cursor >= N - 1 - 0.01) { cursor = N - 1; play(); } }
    else { cursor = Math.min(cursor, N - 1); pause(); }
    update();
  });

  const idxFromEvent = (e) => {
    const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) * (W / r.width);
    return clamp(Math.round(((x - M.l) / (W - M.l - M.r)) * (TOTAL - 1)), 0, maxC());
  };
  svg.addEventListener('pointermove', (e) => {
    const i = idxFromEvent(e);
    if (dragging) seek(i);
    hover = i <= Math.ceil(cursor) ? i : null;
    update();
  });
  svg.addEventListener('pointerleave', () => { if (dragging) return; hover = null; update(); });
  svg.addEventListener('pointerdown', (e) => {
    const pg = e.target.closest('.pin-g');
    if (pg) { seek(Number(pg.dataset.i)); return; }
    dragging = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    seek(idxFromEvent(e));
  });
  const endDrag = () => { dragging = false; };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

  new ResizeObserver(() => { const w = Math.round(wrap.clientWidth); if (w && w !== W) build(); }).observe(wrap);
  build();
  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting || started) return;
    started = true; io.disconnect();
    if (reduced) { cursor = N - 1; revealFired = true; update(); } else play();
  }, { threshold: 0.5 }).observe(wrap);
  setPlayLabel();

  /* ---------- 6. mini-games ---------- */
  // keys
  (() => {
    const spots = $$('#keys .spot'), msg = $('#keys-msg'), foundEl = $('#keys-found'), lostEl = $('#keys-lost');
    let keyAt = Math.floor(Math.random() * spots.length), found = 0, lost = 1, locked = false;
    const hints = ['🧦❌', '🙅🔍', '🍥✨🧹', '🕳️❓', '🥶', '😰🔑❓'];
    const bigMiss = ['🔥', '🔥🔥'];
    spots.forEach((b, i) => b.addEventListener('click', () => {
      if (locked) return;
      const ico = $('span', b); const orig = ico.textContent;
      if (i === keyAt) {
        locked = true; found++; foundEl.textContent = found; b.classList.add('hit'); ico.textContent = '🔑'; burstAt(b, 22);
        msg.textContent = '🔑🎉 😊 ➡️ 🖐️🔑';
        setTimeout(() => {
          b.classList.remove('hit'); ico.textContent = orig;
          keyAt = (keyAt + 1 + Math.floor(Math.random() * (spots.length - 1))) % spots.length; lost++; lostEl.textContent = lost; locked = false;
          msg.textContent = '😅 🔑❌ ➡️ ❓';
        }, 1700);
      } else {
        restart(b, 'miss'); setTimeout(() => b.classList.remove('miss'), 700);
        msg.textContent = Math.random() < 0.25 ? pick(bigMiss) : pick(hints);
      }
    }));
  })();
  // rolls
  (() => {
    const rolls = $$('#rolls .roll'), row = $('#rolls .roll-row'), msg = $('#rolls-msg');
    const texts = ['0/3 🍥', '1/3 😋', '2/3 😋😋', T('rolls_done_msg')];
    const count = () => rolls.filter((r) => r.classList.contains('eaten')).length;
    const crumbs = (b) => {
      const rr = b.getBoundingClientRect(), pr = row.getBoundingClientRect();
      for (let i = 0; i < 9; i++) {
        const c = h('i', 'crumb'); c.style.left = rr.left - pr.left + rr.width / 2 + 'px'; c.style.top = rr.top - pr.top + rr.height / 2 + 'px';
        c.style.setProperty('--dx', rand(-40, 40).toFixed(0) + 'px'); c.style.setProperty('--dy', rand(-45, 25).toFixed(0) + 'px');
        row.append(c); c.addEventListener('animationend', () => c.remove());
      }
    };
    rolls.forEach((b) => b.addEventListener('click', () => {
      b.classList.add('eaten'); crumbs(b); const n = count(); msg.textContent = texts[n];
      if (n === 3) burstAt($('#rolls h3'), 34);
    }));
    $('#rolls-reset').addEventListener('click', () => { rolls.forEach((b) => b.classList.remove('eaten')); msg.textContent = texts[0]; });
  })();
  // fish vs rolls
  (() => {
    const btns = $$('#taste .seg button'), msg = $('#order-msg');
    const out = { rolls: '🍥🍥 💕', fish: T('order_fish_msg') };
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((o) => o.setAttribute('aria-pressed', o === b)); msg.textContent = out[b.dataset.order];
    }));
  })();
  // homework
  (() => {
    const r = $('#diff'), val = $('#diff-val'), msg = $('#diff-msg');
    const say = (v) => (v <= 3 ? '😎 🎮' : v <= 6 ? '😎 🍥' : v <= 9 ? '😎 😁' : T('hw_max_msg'));
    r.addEventListener('input', () => { val.textContent = r.value; msg.textContent = say(Number(r.value)); });
  })();
  // terminal typewriter
  (() => {
    const out = $('#term-out'), box = $('#terminal');
    const script = `$ GPU 🎮\n🔥🔥🔥 ✅\n$ 🎓 ➡️ 💻\n████████░░ 80%\n$ 📚🔥🔥🔥\n😨 = 0   # ${T('term_note_1')}\n$ 🍥\n3 / 3 ✔   # ${T('term_note_2')}\n`;
    let ran = false;
    const type = () => {
      if (reduced) { out.textContent = script; return; }
      let i = 0;
      const step = () => { out.textContent = script.slice(0, ++i); if (i < script.length) setTimeout(step, script[i - 1] === '\n' ? 320 : 22); };
      step();
    };
    new IntersectionObserver((en, io) => { if (en[0].isIntersecting && !ran) { ran = true; io.disconnect(); type(); } }, { threshold: 0.4 }).observe(box);
  })();
  // fitting room
  (() => {
    const frame2 = $('#fit-frame'), btn = $('#fit-btn'), cap = $('#fit-cap'), count = $('#fit-count');
    const outfits = [
      ['🧥', 160], ['🥋', -80], ['☔', 60], ['🤵💰', 200], ['🛏️', 110], ['🏴‍☠️', -140],
    ];
    let n = 0, busy = false;
    btn.addEventListener('click', () => {
      if (busy) return; busy = true;
      const [name, hue] = outfits[n % outfits.length]; n++;
      frame2.style.setProperty('--h', hue + 'deg'); frame2.classList.add('rejecting'); cap.textContent = `👗 ${name} ❓`;
      setTimeout(() => {
        restart(frame2, 'shake'); count.textContent = n; cap.textContent = '🙅 ➡️ 👔💙🎀';
        burstAt(frame2, 18);
      }, 900);
      setTimeout(() => { frame2.classList.remove('rejecting'); busy = false; }, 1900);
    });
  })();

  /* ---------- 7. application checker + laugh test ---------- */
  (() => {
    const sets = $$('#checker fieldset'), verdict = $('#verdict');
    const bad = {
      spy: '🕵️🚫', coworker: '👔👥🚫', cat: '🐱🚫 (🕵️🐱)', rolls: '🍥💕 ⬆️❗', laugh: '🎤 😐 ❌',
    };
    let state = '';
    const run = () => {
      let answered = 0, firstBad = null;
      sets.forEach((f) => {
        const v = $('input:checked', f); f.classList.remove('good', 'bad');
        if (!v) return; answered++;
        if (v.value === f.dataset.ok) f.classList.add('good'); else { f.classList.add('bad'); firstBad = firstBad || f.dataset.q; }
      });
      let next = 'idle', text = answered ? `${answered}/5 ✍️` : '❓❓❓❓❓';
      if (firstBad) { next = 'bad'; text = bad[firstBad]; } else if (answered === sets.length) { next = 'ok'; text = '🎉✅ ➡️ 💌'; }
      verdict.textContent = text;
      if (next !== state) { verdict.dataset.state = 'idle'; void verdict.offsetWidth; verdict.dataset.state = next; if (next === 'ok') burstAt(verdict, 48); }
      state = next;
    };
    $('#checker').addEventListener('change', run);
  })();
  (() => {
    const jokes = [ // emoji puzzles instead of English puns
      '🐛 ➡️ 🐶🍥 ➡️ ↩️',
      '🔑❓ ➡️ ☁️ ➡️ 🤷',
      '📈🚀 ➡️ 🐱 ➡️ 📉💔',
      '🍥😍 ✅ · 🍥😒 ❌',
      '🧂😖 ➡️ 🍥😍',
      '🐶💻 💕 🍥 ➡️ 🔁♾️',
    ];
    const text = $('#joke-text'), laugh = $('#laugh'), next = $('#joke-next'), count = $('#laugh-count'), msg = $('#laugh-msg');
    let i = 0, n = 0;
    next.addEventListener('click', () => { i = (i + 1) % jokes.length; text.textContent = jokes[i]; restart(text, 'bump'); msg.textContent = '👀'; });
    laugh.addEventListener('click', () => {
      n++; count.textContent = n; burstAt(laugh, 18); restart(text, 'bump');
      msg.textContent = n < 3 ? '😊✨' : n < 8 ? '🤣🤣' : '💒💍';
    });
  })();

  /* ---------- 8. contact form (a demo: nothing leaves the page) ---------- */
  (() => {
    const form = $('#contact-form'), msgBox = $('#c-msg'), status = $('#c-status'), plane = $('#plane-fly');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!msgBox.value.trim()) { restart(msgBox, 'err'); status.textContent = '💬❓'; msgBox.focus(); return; }
      const btn = $('button[type="submit"]', form); const r = btn.getBoundingClientRect();
      status.textContent = '✈️☁️';
      const done = () => {
        status.textContent = T('contact_sent');
        burstAt(btn, 50); msgBox.value = '';
      };
      if (reduced) { done(); return; }
      const sx = r.left + r.width / 2 - 75, sy = r.top - 30, ex = innerWidth + 220, ey = -200;
      const xf = (x, y, rot, s) => `translate(${x}px,${y}px) rotate(${rot}deg) scaleX(-1) scale(${s})`;
      plane.style.opacity = 1;
      plane.animate([
        { transform: xf(sx, sy, -4, 0.5), opacity: 0 },
        { offset: 0.12, transform: xf(sx + 30, sy - 30, -12, 0.8), opacity: 1 },
        { offset: 0.55, transform: xf((sx + ex) / 2, sy - 190, -18, 1), opacity: 1 },
        { transform: xf(ex, ey, -26, 0.7), opacity: 1 },
      ], { duration: 2600, easing: 'cubic-bezier(.45,.1,.3,1)' }).finished.then(() => { plane.style.opacity = 0; done(); }, done);
    });
  })();

  /* ---------- 9. ticker tape + reading tools ---------- */
  (() => {
    const items = [ // [symbol, price, direction, change]
      ['🐶', usd(LAST), 'down', `▼ ${pctAbs(fromPeakNow)} 🏔️`],
      ['🍥', '3/📅', 'up', '▲ 300%'],
      ['🔑', '❓', 'down', '▼ 🔁'],
      ['🐱', '🕵️', 'up', '▲ 420%'],
      ['🎮', 'GPU', 'down', '▼ 91%'],
      ['😆', '🎤', 'up', '▲ 12%'],
      ['👔', '💙', 'up', '▲ 0.0%'],
      ['☁️', '🏢', 'up', '▲ 2%'],
    ];
    const tape = $('#tape');
    const add = () => items.forEach(([sym, px, dir, chg]) => {
      const s = h('span'); s.append(h('b', 'sym', sym), ` ${px} `, h('b', dir, chg)); tape.append(s);
    });
    add(); add();
  })();
  const toggle = (btn, cls, invert) => btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', on);
    document.body.classList.toggle(cls, invert ? !on : on);
  });
  toggle($('#tool-gloss'), 'no-gloss', true);
  toggle($('#tool-grammar'), 'show-grammar', false);
})();
