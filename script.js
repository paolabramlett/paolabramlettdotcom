/**
 * Paola Bramlett — site behavior (v4)
 * Vanilla JS, no dependencies. One requestAnimationFrame loop drives every
 * scroll/pointer-linked effect; IntersectionObserver handles reveals.
 * Everything is readable without JS, and prefers-reduced-motion disables
 * pinning, parallax and autoplay.
 */
(() => {
  'use strict';
  window.__pb = true;

  const root = document.documentElement;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  const mqDesktop = matchMedia('(min-width: 901px)');
  const reduced = () => mqReduce.matches;
  const fine = () => mqFine.matches && !reduced();
  const desktop = () => mqDesktop.matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* ── Frame scheduler: the single rAF loop ────────────── */
  // Tasks run on the next frame after any scroll/resize/pointer event.
  // A task returns true to ask for another frame (e.g. while easing).
  const tasks = new Set();
  let queued = false;
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  function tick(t) {
    queued = false;
    let again = false;
    tasks.forEach(fn => { if (fn(t) === true) again = true; });
    if (again) schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  const vh = () => window.innerHeight;

  /* ── i18n: English in the HTML, Spanish in data-es* ──── */
  const ATTRS = [
    ['es', 'text'], ['esHtml', 'html'], ['esPlaceholder', 'placeholder'],
    ['esAria', 'aria-label'], ['esContent', 'content'], ['esAlt', 'alt'],
  ];
  const langHooks = [];
  let lang = 'en';
  const t = (en, es) => (lang === 'es' ? es : en);

  function applyLanguage(next) {
    if (next !== 'en' && next !== 'es') return;
    lang = next;
    root.lang = next;
    ATTRS.forEach(([key, kind]) => {
      const attr = 'data-' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      $$('[' + attr + ']').forEach(el => {
        const enKey = 'en' + key.slice(2);
        if (el.dataset[enKey] === undefined) {
          el.dataset[enKey] = kind === 'text' ? el.textContent : kind === 'html' ? el.innerHTML : (el.getAttribute(kind) || '');
        }
        const value = next === 'es' ? el.dataset[key] : el.dataset[enKey];
        if (kind === 'text') el.textContent = value;
        else if (kind === 'html') el.innerHTML = value;
        else el.setAttribute(kind, value);
      });
    });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    langHooks.forEach(fn => fn());
    store.set('lang', next);
    schedule();
  }

  function initLanguage() {
    document.addEventListener('click', e => {
      const b = e.target.closest('.lang button[data-lang]');
      if (b) applyLanguage(b.dataset.lang);
    });
    const param = new URLSearchParams(location.search).get('lang');
    if ((param || store.get('lang')) === 'es') applyLanguage('es');
  }

  /* ── Nav: glass after 20px, hides down / returns up ──── */
  function initNav() {
    const nav = $('.nav');
    if (!nav) return;
    const btn = $('.nav__menu-btn', nav);
    const sheet = $('#nav-sheet');
    let lastY = scrollY;
    const isOpen = () => btn && btn.getAttribute('aria-expanded') === 'true';

    tasks.add(() => {
      const y = scrollY;
      nav.classList.toggle('is-scrolled', y > 20);
      if (!isOpen() && !reduced()) {
        if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
      }
      lastY = y;
    });
    nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

    if (btn && sheet) {
      sheet.setAttribute('inert', '');
      const setOpen = open => {
        btn.setAttribute('aria-expanded', String(open));
        sheet.classList.toggle('is-open', open);
        sheet.toggleAttribute('inert', !open);
        root.style.overflow = open ? 'hidden' : '';
        if (open) nav.classList.remove('is-hidden');
      };
      btn.addEventListener('click', () => setOpen(!isOpen()));
      $$('a', sheet).forEach(a => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); } });
      mqDesktop.addEventListener('change', () => setOpen(false));
    }

    // Current section in the nav (home only)
    const links = $$('.nav__links a').filter(a => a.hash && a.pathname === location.pathname);
    const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (targets.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.setAttribute('aria-current', String(a.hash === '#' + entry.target.id)));
      }), { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(el => io.observe(el));
      tasks.add(() => {
        if (targets[0].getBoundingClientRect().top > vh() * 0.55) links.forEach(a => a.setAttribute('aria-current', 'false'));
      });
    }
  }

  /* ── Reveals (IntersectionObserver) ──────────────────── */
  function initReveal() {
    const els = $$('.reveal, .fade, .rise:not([data-rise]), [data-scramble-group]');
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      entry.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── Hero: load sequence, grid spotlight, aurora parallax */
  function initHero() {
    const typed = $$('[data-typed]');
    const setCount = () => typed.forEach(el => el.style.setProperty('--n', el.textContent.replace(/\s+/g, ' ').trim().length));
    setCount();
    langHooks.push(setCount);

    const start = () => requestAnimationFrame(() => {
      $$('[data-rise], [data-typed]').forEach(el => el.classList.add('is-in'));
    });
    // Wait (briefly) for web fonts so lines don't reflow mid-animation
    if (document.fonts && document.fonts.ready && !reduced()) {
      Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]).then(start);
    } else start();

    const hero = $('[data-hero]');
    const aurora = $('[data-aurora]');
    if (!hero || !aurora) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener('pointermove', e => {
      if (!fine()) return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
      hero.classList.add('is-lit');
      tx = ((e.clientX - r.left) / r.width - 0.5) * 24; // ±12px
      ty = ((e.clientY - r.top) / r.height - 0.5) * 24;
      schedule();
    });
    hero.addEventListener('pointerleave', () => { hero.classList.remove('is-lit'); tx = ty = 0; schedule(); });
    tasks.add(() => {
      if (reduced()) return false;
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      aurora.style.setProperty('--px', cx.toFixed(2) + 'px');
      aurora.style.setProperty('--py', cy.toFixed(2) + 'px');
      return Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05;
    });
  }

  /* ── Work console: autoplay, progress, crossfade ─────── */
  function initConsole() {
    const con = $('[data-console]');
    if (!con) return;
    const items = $$('[data-console-item]', con);
    const slides = $$('[data-console-slide]', con);
    const dots = $$('[data-console-dots] button', con);
    const stage = $('[data-console-stage]', con);
    const pauseBtn = $('[data-console-pause]', con);
    let idx = 0;
    const why = new Set();   // reasons the autoplay is paused

    const autoplay = () => desktop() && !reduced();
    const syncPaused = () => {
      con.classList.toggle('is-paused', why.size > 0);
      if (pauseBtn) {
        const user = why.has('user');
        pauseBtn.setAttribute('aria-pressed', String(user));
        pauseBtn.firstElementChild.textContent = user ? t('Play', 'Reproducir') : t('Pause', 'Pausa');
      }
    };
    const show = i => {
      idx = (i + items.length) % items.length;
      items.forEach((el, n) => el.classList.toggle('is-active', n === idx));
      slides.forEach((el, n) => el.classList.toggle('is-active', n === idx));
      const bar = $('.console__progress i', items[idx]);
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    };
    const setMode = () => {
      con.classList.toggle('is-autoplay', autoplay());
      if (pauseBtn) pauseBtn.hidden = !autoplay();
      show(idx);
    };
    setMode();
    mqDesktop.addEventListener('change', setMode);
    mqReduce.addEventListener('change', setMode);

    con.addEventListener('animationend', e => {
      if (e.animationName === 'progress' && autoplay() && !why.size) show(idx + 1);
    });
    items.forEach((el, n) => {
      el.addEventListener('mouseenter', () => { if (n !== idx) show(n); });
      el.addEventListener('focus', () => { if (n !== idx) show(n); });
    });
    con.addEventListener('mouseenter', () => { why.add('hover'); syncPaused(); });
    con.addEventListener('mouseleave', () => { why.delete('hover'); syncPaused(); });
    con.addEventListener('focusin', () => { why.add('focus'); syncPaused(); });
    con.addEventListener('focusout', e => { if (!con.contains(e.relatedTarget)) { why.delete('focus'); syncPaused(); } });
    if (pauseBtn) pauseBtn.addEventListener('click', () => { why.has('user') ? why.delete('user') : why.add('user'); syncPaused(); });
    document.addEventListener('visibilitychange', () => { document.hidden ? why.add('hidden') : why.delete('hidden'); syncPaused(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { en.isIntersecting ? why.delete('offscreen') : why.add('offscreen'); syncPaused(); }).observe(con);
    }
    langHooks.push(syncPaused);

    // Scroll-linked entrance: scale .92 → 1, translateY 60 → 0
    tasks.add(() => {
      if (!desktop() || reduced()) { con.style.removeProperty('--p'); return; }
      const r = con.getBoundingClientRect();
      con.style.setProperty('--p', clamp((vh() - r.top) / (vh() * 0.75)).toFixed(4));
    });

    // Mobile: swipe carousel with snap + pagination dots
    if (stage && dots.length) {
      const current = () => {
        const w = slides[0].getBoundingClientRect().width + 12;
        return clamp(Math.round(stage.scrollLeft / w), 0, slides.length - 1);
      };
      stage.addEventListener('scroll', () => {
        if (desktop()) return;
        const c = current();
        dots.forEach((d, n) => d.setAttribute('aria-current', String(n === c)));
      }, { passive: true });
      dots.forEach((d, n) => d.addEventListener('click', () => {
        stage.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: reduced() ? 'auto' : 'smooth' });
      }));
    }
  }

  /* ── Marquee: speed follows scroll velocity ──────────── */
  function initMarquee() {
    const track = $('[data-marquee] .marquee__track');
    if (!track || !track.getAnimations) return;
    let lastY = scrollY, rate = 1;
    tasks.add(() => {
      const anim = track.getAnimations()[0];
      const v = Math.abs(scrollY - lastY);
      lastY = scrollY;
      if (!anim || reduced()) return false;
      const target = 1 + Math.min(v / 6, 5);
      rate = target > rate ? lerp(rate, target, 0.3) : lerp(rate, 1, 0.06);
      anim.playbackRate = rate;
      return rate > 1.01;
    });
  }

  /* ── Scroll-lit words (statement + case quote bands) ─── */
  function splitWords(el) {
    if (el.dataset.en === undefined) el.dataset.en = el.textContent;
    const accent = (el.dataset.accent || '').toLowerCase().split('|').filter(Boolean);
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const words = text.split(' ').map(w => {
      const bare = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      return `<span class="w${accent.includes(bare) ? ' is-accent' : ''}">${w}</span>`;
    }).join(' ');
    el.innerHTML = `<span class="sr-only">${text}</span><span aria-hidden="true">${words}</span>`;
  }

  function initWords() {
    if (reduced()) return;
    $$('[data-words]').forEach(el => {
      const section = el.closest('[data-statement]');
      const pinned = () => section && section.classList.contains('statement--pinned') && desktop();
      const bar = section && $('[data-statement-bar]', section);
      const meter = section && $('[data-statement-meter]', section);
      const pct = section && $('[data-statement-pct]', section);
      const host = section || el;
      let words = [];
      let armed = false;
      const split = () => { splitWords(el); words = $$('.w', el); };
      split();
      langHooks.push(split);

      tasks.add(() => {
        let p;
        if (pinned()) {
          const r = section.getBoundingClientRect();
          p = clamp(-r.top / ((r.height - vh()) * 0.85));
        } else {
          const r = el.getBoundingClientRect();
          p = clamp((vh() * 0.85 - r.top) / (r.height + vh() * 0.35));
        }
        const r = host.getBoundingClientRect();
        if (!armed && r.top < vh() && r.bottom > 0) {
          armed = true;
          host.classList.add('is-armed', 'is-instant');
          requestAnimationFrame(() => requestAnimationFrame(() => host.classList.remove('is-instant')));
        }
        const lit = Math.round(p * words.length);
        words.forEach((w, n) => w.classList.toggle('is-lit', n < lit));
        if (bar) bar.style.setProperty('--p', p.toFixed(4));
        if (meter) meter.style.setProperty('--p', p.toFixed(4));
        if (pct) pct.textContent = Math.round(p * 100) + '%';
      });
    });
  }

  /* ── Sticky stack: covered card scales to .94, dims 25% ─ */
  function initStack() {
    const cards = $$('[data-stack-card]');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      tasks.add(() => {
        if (!desktop() || reduced()) { card.style.setProperty('--p', 0); return; }
        const top = parseFloat(getComputedStyle(card).top) || 96;
        const p = clamp(1 - (next.getBoundingClientRect().top - top) / (vh() - top));
        card.style.setProperty('--p', p.toFixed(4));
      });
    });
  }

  /* ── Cursor spotlight on card borders ────────────────── */
  function initSpotlight() {
    $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
      if (!fine()) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ── Process: pinned timeline (desktop) / vertical (mobile) */
  function initProcess() {
    const sec = $('[data-process]');
    if (!sec || reduced()) return;
    const steps = $$('.step', sec);
    const nodes = $$('.timeline__nodes i', sec);
    const fill = $('[data-process-fill]', sec);
    const list = $('[data-process-steps]', sec);
    let armed = false;
    tasks.add(() => {
      const r = sec.getBoundingClientRect();
      if (!armed && r.top < vh() && r.bottom > 0) { armed = true; sec.classList.add('is-armed'); }
      let p, active;
      if (desktop()) {
        p = clamp(-r.top / (r.height - vh()));
        active = Math.min(steps.length - 1, Math.floor(p * steps.length));
        if (fill) fill.style.setProperty('--p', p.toFixed(4));
      } else {
        const lr = list.getBoundingClientRect();
        p = clamp((vh() * 0.6 - lr.top) / lr.height);
        active = -1;
        steps.forEach((s, n) => { if (s.getBoundingClientRect().top < vh() * 0.6) active = n; });
        list.style.setProperty('--p', p.toFixed(4));
      }
      steps.forEach((s, n) => { s.classList.toggle('is-reached', n <= active); s.classList.toggle('is-current', n === active); });
      nodes.forEach((d, n) => { d.classList.toggle('is-done', n < active); d.classList.toggle('is-current', n === active); });
    });
  }

  /* ── Rail: buttons, drag with inertia, DRAG cursor ───── */
  function initRail() {
    const rail = $('[data-rail]');
    if (!rail) return;
    const sec = rail.closest('[data-rail-section]');
    const prev = sec && $('[data-rail-prev]', sec);
    const next = sec && $('[data-rail-next]', sec);
    const step = () => ($('.rail-card', rail)?.getBoundingClientRect().width || 400) + 20;
    const update = () => {
      if (prev) prev.disabled = rail.scrollLeft < 8;
      if (next) next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    prev && prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduced() ? 'auto' : 'smooth' }));
    next && next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduced() ? 'auto' : 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();

    // Drag with inertia (mouse only — touch scrolls natively)
    let down = false, moved = 0, lastX = 0, v = 0, gliding = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; lastX = e.clientX; v = 0; gliding = false;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 4) rail.classList.add('is-dragging');
      rail.scrollLeft -= dx;
      v = dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!rail.classList.contains('is-dragging')) return;
      if (reduced()) { rail.classList.remove('is-dragging'); return; }
      gliding = true; schedule();
    });
    rail.addEventListener('click', e => { if (moved > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    tasks.add(() => {
      if (!gliding) return false;
      v *= 0.94;
      rail.scrollLeft -= v;
      if (Math.abs(v) < 0.4) { gliding = false; rail.classList.remove('is-dragging'); return false; }
      return true;
    });

    // Custom cursor
    const cursor = document.createElement('div');
    cursor.className = 'drag-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = 'DRAG';
    document.body.appendChild(cursor);
    rail.addEventListener('pointermove', e => {
      if (!fine()) return;
      cursor.style.setProperty('--x', e.clientX + 'px');
      cursor.style.setProperty('--y', e.clientY + 'px');
      cursor.style.setProperty('--s', 1);
    });
    rail.addEventListener('pointerleave', () => cursor.style.setProperty('--s', 0));
    langHooks.push(() => { cursor.textContent = t('DRAG', 'ARRASTRA'); });
  }

  /* ── Clock (Oaxaca, America/Mexico_City) + presence ──── */
  function initClock() {
    const clocks = $$('[data-clock]');
    const presence = $$('[data-presence]');
    if (!clocks.length && !presence.length) return;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });
    const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short' });
    const render = () => {
      const now = new Date();
      const hm = fmt.format(now);
      clocks.forEach(c => { c.textContent = hm; c.dateTime = hm; });
      const h = parseInt(hm, 10);
      const weekend = /Sat|Sun/.test(dayFmt.format(now));
      const online = !weekend && h >= 9 && h < 19;
      presence.forEach(p => { p.textContent = online ? t('Online', 'En línea') : t('Away · replies in 24h', 'Fuera · respondo en 24 h'); });
    };
    render();
    setInterval(render, 15000);
    langHooks.push(render);
  }

  /* ── HUD: characters decode when the portrait enters ─── */
  function initScramble() {
    const portrait = $('[data-portrait]');
    if (!portrait || reduced()) return;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/';
    const run = () => $$('[data-scramble]', portrait).forEach(el => {
      const final = el.textContent;
      const start = performance.now();
      const dur = 500 + Math.random() * 300;
      const step = now => {
        const k = clamp((now - start) / dur);
        const fixed = Math.floor(final.length * k);
        el.textContent = final.slice(0, fixed) + final.slice(fixed).replace(/[^\s·]/g, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
        if (k < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      requestAnimationFrame(step);
    });
    portrait.addEventListener('reveal', run, { once: true });
  }

  /* ── FAQ: one open at a time (fallback for details[name]) */
  function initFaq() {
    const all = $$('.faq details');
    all.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) all.forEach(o => { if (o !== d && o.open) o.open = false; });
    }));
  }

  /* ── Contact palette (inline + ⌘K modal) ─────────────── */
  const MSG = {
    en: { sending: 'Sending…', ok: "Thanks — your message is in. I'll reply within 24 hours.", err: 'Something went wrong. Please email me directly at paolabramlett@gmail.com.', invalid: 'Please add your name, a valid email, and a short message.' },
    es: { sending: 'Enviando…', ok: 'Gracias, recibí tu mensaje. Te respondo en menos de 24 horas.', err: 'Algo salió mal. Escríbeme directo a paolabramlett@gmail.com.', invalid: 'Agrega tu nombre, un correo válido y un mensaje breve.' },
  };

  function initForm(form) {
    if (!form || form.dataset.ready) return;
    form.dataset.ready = '1';
    const note = $('.form__note', form);
    const needs = $('[data-needs]', form);
    const chips = $$('.chip', form);
    const btn = $('button[type="submit"]', form);
    const fields = () => $$('input:not([type="hidden"]):not([name="bot-field"]), textarea', form);
    const kbd = $('[data-kbd]', form);
    if (kbd && !isMac) kbd.textContent = 'Ctrl K';

    const syncNeeds = () => { needs.value = chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.value).join(', '); };
    chips.forEach(c => c.addEventListener('click', () => {
      c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      syncNeeds();
    }));

    form.addEventListener('input', e => {
      e.target.closest('.field')?.classList.remove('is-invalid');
      btn.classList.remove('is-sent');
    });

    form.addEventListener('keydown', e => {
      const f = fields();
      const i = f.indexOf(e.target);
      if (i === -1) return;
      const isArea = e.target.tagName === 'TEXTAREA';
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); form.requestSubmit(); return; }
      if (!isArea && e.key === 'ArrowDown' && f[i + 1]) { e.preventDefault(); f[i + 1].focus(); }
      if (!isArea && e.key === 'ArrowUp' && f[i - 1]) { e.preventDefault(); f[i - 1].focus(); }
      if (e.key === 'Escape' && !form.closest('dialog') && e.target.value) { e.preventDefault(); e.target.value = ''; }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const m = MSG[lang] || MSG.en;
      note.className = 'form__note';
      const bad = fields().filter(f => !f.checkValidity());
      bad.forEach(f => f.closest('.field')?.classList.add('is-invalid'));
      if (bad.length) { note.textContent = m.invalid; note.classList.add('is-err'); bad[0].focus(); return; }
      note.textContent = m.sending;
      btn.disabled = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        note.textContent = m.ok; note.classList.add('is-ok');
        btn.classList.add('is-sent');
        form.reset();
        chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
        syncNeeds();
      } catch {
        note.textContent = m.err; note.classList.add('is-err');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function initPalette() {
    $$('form[data-palette]').forEach(initForm);
    const dialog = $('#palette-modal');
    if (!dialog || !dialog.showModal) return;
    const home = $('[data-palette-home]');
    const tpl = $('#palette-tpl');
    let opener = null;

    const open = () => {
      if (dialog.open) return;
      opener = document.activeElement;
      if (home) {
        const form = $('form[data-palette]', home);
        if (form) dialog.appendChild(form);
      } else if (!dialog.firstElementChild && tpl) {
        dialog.appendChild(tpl.content.cloneNode(true));
        if (lang === 'es') applyLanguage('es');
        initForm($('form[data-palette]', dialog));
      }
      const form = $('form[data-palette]', dialog);
      if (!form) return;
      form.classList.add('is-in');
      const title = $('[id$="palette-title"]', form);
      if (title) dialog.setAttribute('aria-labelledby', title.id);
      dialog.showModal();
      $('input:not([type="hidden"]):not([name="bot-field"])', form)?.focus();
    };
    const close = () => { if (dialog.open) dialog.close(); };

    dialog.addEventListener('close', () => {
      if (home) { const form = $('form[data-palette]', dialog); if (form) home.appendChild(form); }
      if (opener && opener.focus) opener.focus();
    });
    dialog.addEventListener('click', e => {
      if (e.target === dialog) close();
      if (e.target.closest('[data-palette-close]')) close();
    });
    // Focus trap (the native modal also makes the page inert)
    dialog.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = $$('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea', dialog).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dialog.open ? close() : open();
      }
    });
    // "Start a project" opens the palette in place on inner pages (desktop)
    if (!home) {
      $$('[data-palette-open]').forEach(a => a.addEventListener('click', e => {
        if (!desktop() || !tpl) return;
        e.preventDefault();
        open();
      }));
    }
  }

  /* ── Footer: giant wordmark rises from a mask ────────── */
  function initFooter() {
    const footer = $('[data-footer]');
    const word = footer && $('.footer__word', footer);
    if (!word) return;
    tasks.add(() => {
      if (reduced()) { word.style.removeProperty('--p'); return; }
      const r = footer.getBoundingClientRect();
      word.style.setProperty('--p', clamp((vh() - r.top) / (r.height * 0.85)).toFixed(4));
    });
  }

  /* ── Case studies: reading progress + cover zoom ─────── */
  function initCase() {
    const bar = $('.reading-progress');
    if (bar) tasks.add(() => {
      const max = document.documentElement.scrollHeight - vh();
      bar.style.setProperty('--p', max > 0 ? clamp(scrollY / max).toFixed(4) : 0);
    });
    const win = $('.case-cover .window');
    if (win) tasks.add(() => {
      if (!desktop() || reduced()) { win.style.removeProperty('--p'); return; }
      const r = win.getBoundingClientRect();
      win.style.setProperty('--p', clamp((vh() - r.top) / (vh() * 0.7)).toFixed(4));
    });
  }

  function initYear() { $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); }); }

  document.addEventListener('DOMContentLoaded', () => {
    initLanguage();   // before splitting words, so the right language is split
    initNav();
    initHero();
    initReveal();
    initConsole();
    initMarquee();
    initWords();
    initStack();
    initSpotlight();
    initProcess();
    initRail();
    initClock();
    initScramble();
    initFaq();
    initPalette();
    initFooter();
    initCase();
    initYear();
    schedule();
  });
})();
