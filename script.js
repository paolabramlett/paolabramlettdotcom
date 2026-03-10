/**
 * Paola Bramlett — Portfolio
 * Interactions, animations, and UI behavior
 */

'use strict';

// ── UTILITIES ──────────────────────────────────────────────

/**
 * Debounce: limit how often a function fires
 */
function debounce(fn, wait = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ── NAVBAR ─────────────────────────────────────────────────

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu?.querySelectorAll('.nav-link, .btn');

  if (!navbar) return;

  // Scroll behavior: add glass effect when scrolled
  const handleScroll = () => {
    const scrolled = window.scrollY > 20;
    navbar.classList.toggle('scrolled', scrolled);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Run on init

  // Mobile toggle
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close on link click
    mobileLinks?.forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && mobileMenu.classList.contains('open')) {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

// ── SCROLL REVEAL ───────────────────────────────────────────

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) return;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);

        setTimeout(() => {
          el.classList.add('visible');
        }, delay);

        observer.unobserve(el);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
}

// ── SMOOTH SCROLL ───────────────────────────────────────────

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const navHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
        10
      ) || 64;

      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ── CONTACT FORM ────────────────────────────────────────────

function initContactForm() {
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.form-submit');
    const formData = new FormData(form);

    // Basic validation
    const name    = formData.get('name')?.trim();
    const email   = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();

    if (!name || !email || !message) {
      showFormError(form, 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormError(form, 'Please enter a valid email address.');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      // Simulate send (replace with actual endpoint in production)
      await simulateSend();

      form.reset();
      if (successMsg) {
        successMsg.textContent = 'Message sent! I\'ll be in touch soon.';
        setTimeout(() => { successMsg.textContent = ''; }, 6000);
      }
    } catch {
      if (successMsg) {
        successMsg.textContent = 'Something went wrong. Please try again.';
        successMsg.style.color = '#dc2626';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8l10-5-4 5 4 5-10-5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    }
  });
}

function showFormError(form, message) {
  const successMsg = document.getElementById('formSuccess');
  if (successMsg) {
    successMsg.textContent = message;
    successMsg.style.color = '#dc2626';
    setTimeout(() => { successMsg.textContent = ''; }, 5000);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function simulateSend() {
  return new Promise((resolve) => setTimeout(resolve, 1200));
}

// ── CARD TILT ───────────────────────────────────────────────
// Subtle 3D tilt effect on work cards (desktop only)

function initCardTilt() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.work-card, .lab-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width  / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const maxTilt = 3;

      card.style.transform = `
        translateY(-3px)
        rotateX(${-dy * maxTilt}deg)
        rotateY(${dx * maxTilt}deg)
      `;
      card.style.transition = 'transform 0.1s ease-out';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

// ── ACTIVE NAV LINK ─────────────────────────────────────────

function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      });
    },
    {
      threshold: 0.4,
      rootMargin: `-${64}px 0px -40% 0px`,
    }
  );

  sections.forEach(s => observer.observe(s));
}

// ── HERO TEXT ENTRANCE ──────────────────────────────────────
// Staggered character-level animation for hero name

function initHeroEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hero elements animate via CSS .reveal — no extra work needed.
  // This function is a hook for future enhancements.
}

// ── CURSOR TRAIL (subtle, premium) ──────────────────────────

function initCursorGlow() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: left 0.6s cubic-bezier(0.16, 1, 0.3, 1), top 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: left, top;
    opacity: 0;
  `;
  document.body.appendChild(glow);

  let visible = false;
  let raf;

  document.addEventListener('mousemove', (e) => {
    if (!visible) {
      glow.style.opacity = '1';
      visible = true;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
    visible = false;
  });
}

// ── NUMBER COUNTER ──────────────────────────────────────────
// Animate stat numbers when they come into view

function initCounters() {
  // Placeholder for numeric stats if added in the future
}

// ── INIT ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initSmoothScroll();
  initContactForm();
  initCardTilt();
  initActiveNavLink();
  initHeroEntrance();
  initCursorGlow();
  initCounters();
});

// Expose for potential external use
window.PB = {
  reinitReveal: initScrollReveal,
};
