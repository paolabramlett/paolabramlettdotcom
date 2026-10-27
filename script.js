/**
 * Paola Bramlett: site behavior (v5)
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

  /* ── Frame scheduler: the single rAF loop ────────────── */
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

  /* ── Language ────────────────────────────────────────── */
  // Home and service pages have real /es/ URLs (the switch is a link).
  // Case studies, 404 and /thanks/ are English pages with Spanish in data-es*.
  const ATTRS = [
    ['es', 'text'], ['esHtml', 'html'], ['esPlaceholder', 'placeholder'],
    ['esAria', 'aria-label'], ['esContent', 'content'], ['esAlt', 'alt'],
  ];
  const langHooks = [];
  const lang = () => (root.lang || 'en').slice(0, 2);
  const t = (en, es) => (lang() === 'es' ? es : en);

  function applyLanguage(next) {
    if (next !== 'en' && next !== 'es') return;
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
    const toggles = $$('.lang button[data-lang]');
    if (!toggles.length) { store.set('lang', lang()); return; } // page has a real language URL
    toggles.forEach(b => b.addEventListener('click', () => applyLanguage(b.dataset.lang)));
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
      if (!isOpen() && !reduced() && !nav.contains(document.activeElement)) {
        if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 160) nav.classList.remove('is-hidden');
      }
      lastY = y;
    });
    nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

    // Services dropdown (opens on hover with CSS; click + Escape here)
    $$('.nav__dd', nav).forEach(dd => {
      const b = $('.nav__dd-btn', dd);
      const set = open => { dd.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open)); };
      b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
      dd.addEventListener('mouseenter', () => { if (fine()) b.setAttribute('aria-expanded', 'true'); });
      dd.addEventListener('mouseleave', () => { if (fine()) set(false); });
      dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
      dd.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
    });

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
    const links = $$('.nav__links > li > a').filter(a => a.hash && a.pathname === location.pathname);
    const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (targets.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.setAttribute('aria-current', String(a.hash === '#' + entry.target.id)));
      }), { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(el => io.observe(el));
      tasks.add(() => {
        const first = Math.min(...targets.map(el => el.getBoundingClientRect().top));
        if (first > vh() * 0.55) links.forEach(a => a.setAttribute('aria-current', 'false'));
      });
    }
  }

  /* ── Reveals (IntersectionObserver) ──────────────────── */
  function initReveal() {
    const els = $$('.reveal, .fade, .rise');
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── Hero: aurora parallax ───────────────────────────── */
  function initAurora() {
    const hero = $('[data-hero]');
    const aurora = hero && $('[data-aurora]', hero);
    if (!aurora) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener('pointermove', e => {
      if (!fine()) return;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 24; // ±12px
      ty = ((e.clientY - r.top) / r.height - 0.5) * 24;
      schedule();
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; schedule(); });
    tasks.add(() => {
      if (reduced()) return false;
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      aurora.style.setProperty('--px', cx.toFixed(2) + 'px');
      aurora.style.setProperty('--py', cy.toFixed(2) + 'px');
      return Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05;
    });
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

  /* ── Scroll-lit words (finish-line band, case quotes) ── */
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
      const host = el.closest('[data-words-host]') || el;
      const pinned = () => host.classList.contains('band--pinned') && desktop();
      const bar = $('[data-words-bar]', host);
      let words = [];
      let armed = false;
      const split = () => { splitWords(el); words = $$('.w', el); };
      split();
      langHooks.push(split);
      tasks.add(() => {
        let p;
        const hr = host.getBoundingClientRect();
        if (pinned()) {
          p = clamp(-hr.top / ((hr.height - vh()) * 0.85));
        } else {
          const r = el.getBoundingClientRect();
          p = clamp((vh() * 0.85 - r.top) / (r.height + vh() * 0.35));
        }
        if (!armed && hr.top < vh() && hr.bottom > 0) {
          armed = true;
          host.classList.add('is-armed', 'is-instant');
          requestAnimationFrame(() => requestAnimationFrame(() => host.classList.remove('is-instant')));
        }
        const lit = Math.round(p * words.length);
        words.forEach((w, n) => w.classList.toggle('is-lit', n < lit));
        if (bar) bar.style.setProperty('--p', p.toFixed(4));
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

  /* ── How it works: pinned timeline / vertical on mobile ─ */
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

  /* ── Rail: buttons, drag with inertia, drag cursor ───── */
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

    const cursor = document.createElement('div');
    cursor.className = 'drag-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    const label = () => { cursor.textContent = t('Drag', 'Arrastra'); };
    label();
    langHooks.push(label);
    document.body.appendChild(cursor);
    rail.addEventListener('pointermove', e => {
      if (!fine()) return;
      cursor.style.setProperty('--x', e.clientX + 'px');
      cursor.style.setProperty('--y', e.clientY + 'px');
      cursor.style.setProperty('--s', 1);
    });
    rail.addEventListener('pointerleave', () => cursor.style.setProperty('--s', 0));
  }

  /* ── FAQ: one open at a time (fallback for details[name]) */
  function initFaq() {
    $$('.faq').forEach(group => {
      const all = $$('details', group);
      all.forEach(d => d.addEventListener('toggle', () => {
        if (d.open) all.forEach(o => { if (o !== d && o.open) o.open = false; });
      }));
    });
  }

  /* ── Contact form (Netlify Forms, AJAX) ──────────────── */
  const MSG = {
    en: { sending: 'Sending…', ok: "Thanks, your message is in. I'll reply within 24 hours.", err: 'Something went wrong. Please email me directly at paolabramlett@gmail.com.', invalid: 'Please add your name, a valid email and a short message.' },
    es: { sending: 'Enviando…', ok: 'Gracias, recibí tu mensaje. Te respondo en menos de 24 horas.', err: 'Algo salió mal. Escríbeme directo a paolabramlett@gmail.com.', invalid: 'Agrega tu nombre, un correo válido y un mensaje breve.' },
  };

  function initForms() {
    $$('form[data-contact]').forEach(form => {
      const note = $('.form__note', form);
      const needs = $('[data-needs]', form);
      const chips = $$('.chip', form);
      const btn = $('button[type="submit"]', form);
      const fields = () => $$('input:not([type="hidden"]):not([name="bot-field"]), textarea', form);

      const syncNeeds = () => { needs.value = chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.value).join(', '); };
      chips.forEach(c => c.addEventListener('click', () => {
        c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
        syncNeeds();
      }));
      form.addEventListener('input', e => {
        e.target.closest('.field')?.classList.remove('is-invalid');
        btn.classList.remove('is-sent');
      });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        const m = MSG[lang()] || MSG.en;
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
    });
  }

  /* ── Case studies: reading progress + cover zoom ─────── */
  function initCase() {
    const bar = $('.reading-progress');
    if (bar) tasks.add(() => {
      const max = document.documentElement.scrollHeight - vh();
      bar.style.setProperty('--p', max > 0 ? clamp(scrollY / max).toFixed(4) : 0);
    });
    const fig = $('.case-cover figure');
    if (fig) tasks.add(() => {
      if (!desktop() || reduced()) { fig.style.removeProperty('--p'); return; }
      const r = fig.getBoundingClientRect();
      fig.style.setProperty('--p', clamp((vh() - r.top) / (vh() * 0.7)).toFixed(4));
    });
  }

  function initYear() { $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); }); }

  document.addEventListener('DOMContentLoaded', () => {
    initLanguage();   // before splitting words, so the right language is split
    initNav();
    initReveal();
    initAurora();
    initMarquee();
    initWords();
    initStack();
    initProcess();
    initRail();
    initFaq();
    initForms();
    initCase();
    initYear();
    schedule();
  });
})();
