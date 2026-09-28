/**
 * Paola Bramlett — site behavior (v3)
 * No dependencies. Everything degrades gracefully without JS
 * and respects prefers-reduced-motion.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reduceMotion.matches;
  if (isReduced()) root.classList.add('reduce-motion');

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ── NAV ─────────────────────────────────────────────── */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const btn = nav.querySelector('.nav__menu-btn');
    const sheet = document.getElementById('nav-sheet');
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 8);
      const menuOpen = btn && btn.getAttribute('aria-expanded') === 'true';
      if (!menuOpen) nav.classList.toggle('is-hidden', y > 480 && y > lastY + 4);
      if (y < lastY - 4 || y < 480) nav.classList.remove('is-hidden');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (btn && sheet) {
      const setOpen = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        sheet.classList.toggle('is-open', open);
        sheet.toggleAttribute('inert', !open);
      };
      sheet.setAttribute('inert', '');
      btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
      sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    }

    // Highlight current section in nav
    const links = [...nav.querySelectorAll('.nav__links a[href^="#"]')];
    const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (targets.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          links.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + entry.target.id)));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(t => io.observe(t));
    }
  }

  /* ── REVEAL ON SCROLL ────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal, .split');
    if (isReduced() || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── STATEMENT: split into words ─────────────────────── */
  function splitWords(el) {
    const accent = (el.dataset.accent || '').toLowerCase().split('|').filter(Boolean);
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(w => {
      const bare = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      const cls = accent.includes(bare) ? 'w is-accent' : 'w';
      return `<span class="${cls}" aria-hidden="true">${w}</span>`;
    }).join(' ');
  }

  /* ── SCROLL-LINKED EFFECTS (single rAF loop) ─────────── */
  const scrollFx = [];

  function initScrollFx() {
    // Stage zoom: frame grows to full size as it enters
    document.querySelectorAll('[data-fx="stage"]').forEach(el => {
      scrollFx.push(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh - r.top) / (vh * 0.85));
        el.style.setProperty('--p', p.toFixed(4));
      });
    });

    // Stacked cards: each card recedes as the next one slides over it
    const cards = [...document.querySelectorAll('[data-fx="stack"]')];
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      scrollFx.push(() => {
        if (window.innerWidth <= 900) { card.style.setProperty('--p', 0); return; }
        const stickyTop = parseFloat(getComputedStyle(card).top) || 0;
        const nextTop = next.getBoundingClientRect().top;
        const vh = window.innerHeight;
        const p = clamp(1 - (nextTop - stickyTop) / (vh - stickyTop));
        card.style.setProperty('--p', p.toFixed(4));
      });
    });

    // Statement: words light up with scroll progress through the section
    document.querySelectorAll('[data-fx="words"]').forEach(section => {
      const text = section.querySelector('.statement__text');
      if (!text) return;
      splitWords(text);
      scrollFx.push(() => {
        const r = section.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = clamp(-r.top / (total * 0.8));
        const words = text.querySelectorAll('.w');
        const lit = Math.round(p * words.length);
        words.forEach((w, idx) => w.classList.toggle('is-lit', idx < lit));
      });
    });

    if (!scrollFx.length || isReduced()) return;

    let ticking = false;
    const run = () => { scrollFx.forEach(fn => fn()); ticking = false; };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    run();
  }

  /* ── PROCESS: active step follows the viewport center ── */
  function initSteps() {
    const steps = document.querySelectorAll('.step');
    if (!steps.length || isReduced() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('is-active', e.isIntersecting));
    }, { rootMargin: '-40% 0px -40% 0px' });
    steps.forEach(s => io.observe(s));
  }

  /* ── RAIL: prev/next buttons ─────────────────────────── */
  function initRails() {
    document.querySelectorAll('[data-rail]').forEach(wrap => {
      const rail = wrap.querySelector('.rail');
      const prev = wrap.querySelector('[data-rail-prev]');
      const next = wrap.querySelector('[data-rail-next]');
      if (!rail || !prev || !next) return;
      const step = () => (rail.querySelector('.rail-card')?.getBoundingClientRect().width || 400) + 16;
      const update = () => {
        prev.disabled = rail.scrollLeft < 8;
        next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
      };
      prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: isReduced() ? 'auto' : 'smooth' }));
      next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: isReduced() ? 'auto' : 'smooth' }));
      rail.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ── i18n: English lives in the HTML; Spanish in data-es ─ */
  const ATTRS = [
    ['es', 'text'], ['esHtml', 'html'], ['esPlaceholder', 'placeholder'],
    ['esAria', 'aria-label'], ['esContent', 'content'], ['esAlt', 'alt'],
  ];
  let currentLang = 'en';

  function applyLanguage(lang) {
    if (lang !== 'en' && lang !== 'es') return;
    currentLang = lang;
    root.lang = lang;
    ATTRS.forEach(([key, kind]) => {
      const attr = 'data-' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        const enKey = 'en' + key.slice(2);
        if (el.dataset[enKey] === undefined) {
          el.dataset[enKey] =
            kind === 'text' ? el.textContent :
            kind === 'html' ? el.innerHTML :
            (el.getAttribute(kind) || '');
        }
        const value = lang === 'es' ? el.dataset[key] : el.dataset[enKey];
        if (kind === 'text') el.textContent = value;
        else if (kind === 'html') el.innerHTML = value;
        else el.setAttribute(kind, value);
      });
    });
    // Re-split statement words after text swap
    document.querySelectorAll('[data-fx="words"] .statement__text').forEach(el => {
      if (el.dataset.es) { splitWords(el); window.dispatchEvent(new Event('scroll')); }
    });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store.set('lang', lang);
  }

  function initLanguage() {
    document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => applyLanguage(b.dataset.lang)));
    const saved = store.get('lang');
    const param = new URLSearchParams(location.search).get('lang');
    const lang = param || saved;
    if (lang === 'es') applyLanguage('es');
  }

  /* ── CONTACT FORM (Netlify Forms, AJAX) ──────────────── */
  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const note = form.querySelector('.form__note');
    const msg = {
      en: { sending: 'Sending…', ok: "Thanks — your message is in. I'll reply within one business day.", err: 'Something went wrong. Please email me directly at paolabramlett@gmail.com.', invalid: 'Please add your name, a valid email, and a short message.' },
      es: { sending: 'Enviando…', ok: 'Gracias, recibí tu mensaje. Te respondo en máximo un día hábil.', err: 'Algo salió mal. Escríbeme directo a paolabramlett@gmail.com.', invalid: 'Agrega tu nombre, un correo válido y un mensaje breve.' },
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = msg[currentLang] || msg.en;
      note.className = 'form__note';
      if (!form.checkValidity()) { note.textContent = t.invalid; note.classList.add('is-err'); return; }
      note.textContent = t.sending;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        note.textContent = t.ok; note.classList.add('is-ok');
        form.reset();
      } catch {
        note.textContent = t.err; note.classList.add('is-err');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ── MISC ────────────────────────────────────────────── */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initLanguage();   // before splitting words so the right language is split
    initScrollFx();
    initReveal();
    initSteps();
    initRails();
    initForm();
    initYear();
  });
})();
