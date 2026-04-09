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

document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  })
  .then(() => {
    document.getElementById('formSuccess').textContent = "Message sent! I'll be in touch soon.";
    form.reset();
  })
  .catch(() => {
    document.getElementById('formSuccess').textContent = 'Something went wrong. Please try again.';
  });
});

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

// ── FAQ ACCORDION ───────────────────────────────────────────

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      // Close all others
      document.querySelectorAll('.faq-question').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswer = document.getElementById(other.getAttribute('aria-controls'));
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      // Toggle current
      btn.setAttribute('aria-expanded', String(!expanded));
      if (answer) answer.hidden = expanded;
    });
  });
}

// ── i18N / LANGUAGE SWITCH ──────────────────────────────────

const translations = {
  en: {
    'nav-work': 'Work', 'nav-labs': 'Labs', 'nav-about': 'About', 'nav-contact': 'Contact', 'nav-cta': "Let's Build",
    'hero-badge': 'Available for select projects',
    'hero-title-html': 'Product Designer<br /><em>&amp; Vibe Coder</em>',
    'hero-subheadline-html': 'I design, prototype, and ship modern digital products<br class="br-desktop" /> with clarity, speed, and strong visual taste.',
    'hero-body': 'From UX systems to AI-powered interfaces, I help transform ideas into polished digital experiences that feel intuitive, refined, and ready to launch.',
    'hero-view-work': 'View Work', 'hero-explore-labs': 'Explore Labs',
    'hero-caption': 'Designing across UX, UI, product thinking, rapid prototyping, and AI-assisted development.',
    'hero-scroll': 'Scroll',
    'value-label': 'What I bring',
    'value-heading-html': 'Built for founders,<br />teams, and ambitious<br />products.',
    'value-body-1': 'I work at the intersection of product thinking, interface design, and rapid prototyping. That means I can help shape the experience, design the interface, and bring ideas closer to launch. Not just make things look good.',
    'value-body-2': 'My work focuses on creating digital products that feel clear, intentional, and visually refined.',
    'cap-uxui': 'UX/UI Design', 'cap-product': 'Product Thinking', 'cap-proto': 'Rapid Prototyping',
    'cap-systems': 'Design Systems', 'cap-vibe': 'Vibe Coding', 'cap-web': 'Modern Web Interfaces',
    'work-label': 'Selected Work', 'work-heading': 'Case Studies',
    'work-body': 'A curated selection of product design, UX/UI, and digital experiences focused on usability, clarity, and modern interface design. Each case study shows the thinking behind the interface — from research and structure to final product experience.',
    'card1-type': 'UX/UI · Mobile Platform', 'card1-title': 'ExploreTogether',
    'card1-desc': 'A crowdsourced travel platform designed to help users discover authentic destinations through community-driven recommendations.',
    'card-cta': 'View Case Study',
    'card2-type': 'Product Design · Mobile/Web', 'card2-title': 'Event Planning & RSVP Platform',
    'card2-desc': 'A digital product focused on simplifying event coordination and improving guest interactions from invitation to attendance.',
    'card3-type': 'UX Design · Concept', 'card3-title': 'Mental Health Support Platform',
    'card3-desc': 'A concept platform designed to make emotional support tools more accessible, structured, and easy to navigate for people seeking help.',
    'labs-label': 'Labs', 'labs-heading': 'Experiments',
    'labs-body': 'The Lab is where I explore new interface ideas, rapid product prototypes, and AI-assisted workflows. Some experiments begin as design explorations. Others evolve into functional prototypes and product concepts.',
    'lab1-title': 'AI Interface Experiments',
    'lab1-desc': 'Exploring how AI-native interactions reshape the visual language of interfaces and user flows.',
    'lab2-title': 'Product Prototypes',
    'lab2-desc': 'Rapid product concepts built to explore feasibility, flow, and first-impression experience.',
    'labs-explore': 'Explore the Lab',
    'lab3-title': 'Interaction Experiments',
    'lab3-desc': 'Micro-interactions, transitions, and motion design studies pushing the edges of UI behavior.',
    'lab4-title': 'Design + Code Explorations',
    'lab4-desc': 'Projects where Figma and code blur together — vibe-coded interfaces brought to life with AI-assisted development.',
    'phil-label': 'Design Philosophy', 'phil-quote': 'Good design creates momentum.',
    'phil-body-1': 'Strong digital products are built through clarity, not noise. The best interfaces simplify complexity, guide users naturally, and create trust through thoughtful details.',
    'phil-body-2': 'My approach combines visual restraint, product logic, and fast iteration — allowing ideas to move from concept to usable interface quickly.',
    'about-label': 'About',
    'about-heading-html': 'Designing at the edge of<br />design and development.',
    'stat-location': 'Mexico', 'stat-location-label': 'Based in',
    'stat-focus': 'UX + UI', 'stat-focus-label': 'Primary focus',
    'stat-workflow': 'AI-first', 'stat-workflow-label': 'Workflow',
    'about-p1': "I'm a Product Designer and UX/UI designer based in Mexico, focused on building digital products that feel modern, intuitive, and visually elevated.",
    'about-p2': 'My work combines product thinking, interface design, and rapid prototyping to transform ideas into experiences that are both usable and memorable.',
    'about-p3': "I'm particularly interested in the space where design and development start to merge — where designers can think through systems, prototype interactions quickly, and bring ideas closer to real products.",
    'about-p4': 'Through vibe coding and AI-assisted workflows, I explore faster ways of shaping and building digital experiences.',
    'services-label': 'Collaboration', 'services-heading': 'How I Can Help',
    'services-body': 'I collaborate with founders, startups, and teams that want to move quickly from idea to product.',
    'svc1-title': 'UX/UI Design for Digital Products',
    'svc1-desc': 'End-to-end interface design from research and wireframes to polished, production-ready UI.',
    'svc2-title': 'Product Interface Design',
    'svc2-desc': 'Designing core product interfaces that guide users with clarity and build lasting trust.',
    'svc3-title': 'Rapid Prototyping',
    'svc3-desc': 'Fast, high-fidelity prototypes that validate ideas before a single line of production code is written.',
    'svc4-title': 'Design Systems',
    'svc4-desc': 'Scalable component libraries and token-based design systems that keep teams moving in sync.',
    'svc5-title': 'Vibe Coding & AI-Assisted Development',
    'svc5-desc': 'Using AI-powered workflows to prototype and build functional interfaces faster than traditional design-dev handoffs allow.',
    'svc6-title': 'Modern Marketing & Product Websites',
    'svc6-desc': 'High-conversion marketing sites and product landing pages with premium visual design and refined interactions.',
    'cta-heading-html': "Let's build something<br />people remember.",
    'cta-body': "If you're working on a product and need help shaping the experience, refining the interface, or building modern digital interactions, I'd love to hear about it.",
    'cta-btn': 'Get in Touch',
    'cta-caption': 'Available for select freelance projects, collaborations, and in-house opportunities.',
    'contact-label': 'Contact',
    'contact-heading-html': 'Start a<br />conversation.',
    'contact-body-html': "Have a project, role, or collaboration in mind?<br />Send a message and let's talk.",
    'form-name-label': 'Name', 'form-name-placeholder': 'Your name',
    'form-email-label': 'Email',
    'form-project-label': 'Project', 'form-project-placeholder': 'What are you working on?',
    'form-message-label': 'Message', 'form-message-placeholder': 'Tell me about your project or opportunity...',
    'form-submit': 'Send Message',
    'footer-role': 'Product Designer & Vibe Coder',
    'footer-tagline': 'Designing modern digital experiences with clarity and taste.',
    'footer-copy': '© 2026 Paola Bramlett. All rights reserved.',
    // FAQ
    'faq-label': 'FAQ',
    'faq-heading': 'Common Questions',
    'faq-sub': 'Straight answers to the questions people ask before reaching out.',
    'faq-q1': 'How much do you charge for design and development work?',
    'faq-a1': 'Hourly rates run $35–$45 USD depending on the type of work. Most projects land between $1,000–$5,000 USD total. Flat-rate project quotes are available on request.',
    'faq-q2': 'How long does a typical project take?',
    'faq-a2': 'A landing page or simple prototype takes 3–7 days. A full UX/UI design for an app typically runs 2–6 weeks. Timeline depends on scope and whether development is included.',
    'faq-q3': 'Do you work with clients outside Mexico?',
    'faq-a3': 'Yes. Most clients are in the US, Canada, and Europe. All work is done remotely. Communication in English or Spanish, across any time zone.',
    'faq-q4': 'What makes you different from other designers?',
    'faq-a4': 'I cover strategy, design, and development. Most designers hand off to a developer — I can take a project from wireframe to working front-end, removing the gap between design and launch.',
    'faq-q5': 'What is Vibe Coding and how does it help my project?',
    'faq-a5': "Vibe Coding is an AI-assisted workflow using tools like Claude Code to build functional interfaces faster than traditional development. The output is real, production-quality code — not a mockup. It's how I can deliver in days what normally takes weeks.",
    'faq-q6': 'What kinds of projects do you take on?',
    'faq-a6': 'Startups building a first product, founders launching a website or app, and teams that need a design system or rapid prototype. I work best on projects where both design quality and delivery speed matter.',
    'faq-q7': 'Do you handle development or just design?',
    'faq-a7': 'Both. I design in Figma and build using HTML, CSS, JavaScript, and AI-assisted tools. You can get design files, a working prototype, or production-ready front-end code — or all three.',
    'faq-q8': 'What tools do you use?',
    'faq-a8': 'Figma for design and prototyping, Claude Code for AI-assisted development, Adobe Illustrator for brand and visual work, and HTML, CSS, and JavaScript for front-end builds.',
    'faq-q9': 'When is the right time to bring you into a project?',
    'faq-a9': 'As early as possible. Design decisions made before development starts prevent expensive rework later. I can join at the idea stage, mid-project, or as an ongoing design partner for an existing team.',
    'faq-q10': 'How do I get started?',
    'faq-a10': 'Send a message through the contact form or call +52 951 408 2852. Describe your project in a few sentences. Expect a reply within 24 hours. Initial consultations are free.',
  },
  es: {
    'nav-work': 'Trabajo', 'nav-labs': 'Labs', 'nav-about': 'Sobre mí', 'nav-contact': 'Contacto', 'nav-cta': 'Construyamos',
    'hero-badge': 'Disponible para proyectos selectos',
    'hero-title-html': 'Diseñadora de Producto<br /><em>&amp; Vibe Coder</em>',
    'hero-subheadline-html': 'Diseño, prototipo y construyo productos digitales modernos<br class="br-desktop" /> con claridad, velocidad y gusto visual.',
    'hero-body': 'Desde sistemas de UX hasta interfaces con IA, ayudo a transformar ideas en experiencias digitales pulidas que se sienten intuitivas, refinadas y listas para lanzar.',
    'hero-view-work': 'Ver Trabajo', 'hero-explore-labs': 'Explorar Labs',
    'hero-caption': 'Diseñando en UX, UI, pensamiento de producto, prototipado rápido y desarrollo asistido por IA.',
    'hero-scroll': 'Scroll',
    'value-label': 'Lo que aporto',
    'value-heading-html': 'Hecho para founders,<br />equipos y productos<br />ambiciosos.',
    'value-body-1': 'Trabajo en la intersección del pensamiento de producto, el diseño de interfaces y el prototipado rápido. Eso significa que puedo ayudar a dar forma a la experiencia, diseñar la interfaz y acercar las ideas al lanzamiento. No solo hacer que las cosas se vean bien.',
    'value-body-2': 'Mi trabajo se centra en crear productos digitales que se sientan claros, intencionales y visualmente refinados.',
    'cap-uxui': 'Diseño UX/UI', 'cap-product': 'Pensamiento de Producto', 'cap-proto': 'Prototipado Rápido',
    'cap-systems': 'Sistemas de Diseño', 'cap-vibe': 'Vibe Coding', 'cap-web': 'Interfaces Web Modernas',
    'work-label': 'Trabajo Selecto', 'work-heading': 'Casos de Estudio',
    'work-body': 'Una selección de diseño de producto, UX/UI y experiencias digitales enfocadas en usabilidad, claridad y diseño de interfaces modernas. Cada caso de estudio muestra el pensamiento detrás de la interfaz — desde la investigación y la estructura hasta la experiencia final del producto.',
    'card1-type': 'UX/UI · Plataforma Móvil', 'card1-title': 'ExploreTogether',
    'card1-desc': 'Una plataforma de viajes colaborativa diseñada para ayudar a los usuarios a descubrir destinos auténticos a través de recomendaciones impulsadas por la comunidad.',
    'card-cta': 'Ver Caso de Estudio',
    'card2-type': 'Diseño de Producto · Móvil/Web', 'card2-title': 'Plataforma de Eventos y RSVP',
    'card2-desc': 'Un producto digital enfocado en simplificar la coordinación de eventos y mejorar las interacciones de los invitados desde la invitación hasta la asistencia.',
    'card3-type': 'Diseño UX · Concepto', 'card3-title': 'Plataforma de Apoyo en Salud Mental',
    'card3-desc': 'Una plataforma conceptual diseñada para hacer que las herramientas de apoyo emocional sean más accesibles, estructuradas y fáciles de navegar para personas que buscan ayuda.',
    'labs-label': 'Labs', 'labs-heading': 'Experimentos',
    'labs-body': 'El Lab es donde exploro nuevas ideas de interfaces, prototipos de productos rápidos y flujos de trabajo asistidos por IA. Algunos experimentos comienzan como exploraciones de diseño. Otros evolucionan en prototipos funcionales y conceptos de producto.',
    'lab1-title': 'Experimentos de Interfaces con IA',
    'lab1-desc': 'Explorando cómo las interacciones nativas de IA reconfiguran el lenguaje visual de las interfaces y los flujos de usuario.',
    'lab2-title': 'Prototipos de Producto',
    'lab2-desc': 'Conceptos de producto rápidos construidos para explorar viabilidad, flujo y experiencia de primera impresión.',
    'labs-explore': 'Explorar el Lab',
    'lab3-title': 'Experimentos de Interacción',
    'lab3-desc': 'Micro-interacciones, transiciones y estudios de diseño en movimiento que empujan los límites del comportamiento de UI.',
    'lab4-title': 'Exploraciones de Diseño + Código',
    'lab4-desc': 'Proyectos donde Figma y el código se fusionan — interfaces vibe-coded cobradas vida con desarrollo asistido por IA.',
    'phil-label': 'Filosofía de Diseño', 'phil-quote': 'El buen diseño crea impulso.',
    'phil-body-1': 'Los productos digitales sólidos se construyen con claridad, no con ruido. Las mejores interfaces simplifican la complejidad, guían a los usuarios de forma natural y generan confianza a través de detalles reflexivos.',
    'phil-body-2': 'Mi enfoque combina sobriedad visual, lógica de producto e iteración rápida — permitiendo que las ideas pasen del concepto a una interfaz utilizable rápidamente.',
    'about-label': 'Sobre mí',
    'about-heading-html': 'Diseñando en la frontera<br />del diseño y el desarrollo.',
    'stat-location': 'México', 'stat-location-label': 'Ubicada en',
    'stat-focus': 'UX + UI', 'stat-focus-label': 'Enfoque principal',
    'stat-workflow': 'IA primero', 'stat-workflow-label': 'Flujo de trabajo',
    'about-p1': 'Soy Diseñadora de Producto y diseñadora UX/UI basada en México, enfocada en construir productos digitales que se sientan modernos, intuitivos y visualmente elevados.',
    'about-p2': 'Mi trabajo combina pensamiento de producto, diseño de interfaces y prototipado rápido para transformar ideas en experiencias que son tanto utilizables como memorables.',
    'about-p3': 'Me interesa especialmente el espacio donde el diseño y el desarrollo comienzan a fusionarse — donde los diseñadores pueden pensar en sistemas, prototipar interacciones rápidamente y acercar las ideas a productos reales.',
    'about-p4': 'A través del vibe coding y los flujos de trabajo asistidos por IA, exploro formas más rápidas de dar forma y construir experiencias digitales.',
    'services-label': 'Colaboración', 'services-heading': 'Cómo Puedo Ayudar',
    'services-body': 'Colaboro con founders, startups y equipos que quieren pasar rápidamente de la idea al producto.',
    'svc1-title': 'Diseño UX/UI para Productos Digitales',
    'svc1-desc': 'Diseño de interfaz de extremo a extremo, desde investigación y wireframes hasta una UI pulida y lista para producción.',
    'svc2-title': 'Diseño de Interfaz de Producto',
    'svc2-desc': 'Diseño de interfaces de producto principales que guían a los usuarios con claridad y generan confianza duradera.',
    'svc3-title': 'Prototipado Rápido',
    'svc3-desc': 'Prototipos rápidos y de alta fidelidad que validan ideas antes de escribir una sola línea de código de producción.',
    'svc4-title': 'Sistemas de Diseño',
    'svc4-desc': 'Bibliotecas de componentes escalables y sistemas de diseño basados en tokens que mantienen a los equipos sincronizados.',
    'svc5-title': 'Vibe Coding y Desarrollo Asistido por IA',
    'svc5-desc': 'Usando flujos de trabajo impulsados por IA para prototipar y construir interfaces funcionales más rápido que los handoffs tradicionales de diseño y desarrollo.',
    'svc6-title': 'Sitios Web de Marketing y Producto Modernos',
    'svc6-desc': 'Sitios de marketing de alta conversión y landing pages de producto con diseño visual premium e interacciones refinadas.',
    'cta-heading-html': 'Construyamos algo que<br />la gente recuerde.',
    'cta-body': 'Si estás trabajando en un producto y necesitas ayuda para dar forma a la experiencia, refinar la interfaz o construir interacciones digitales modernas, me encantaría escuchar sobre ello.',
    'cta-btn': 'Ponte en Contacto',
    'cta-caption': 'Disponible para proyectos freelance selectos, colaboraciones y oportunidades en empresa.',
    'contact-label': 'Contacto',
    'contact-heading-html': 'Inicia una<br />conversación.',
    'contact-body-html': '¿Tienes un proyecto, rol o colaboración en mente?<br />Envía un mensaje y hablemos.',
    'form-name-label': 'Nombre', 'form-name-placeholder': 'Tu nombre',
    'form-email-label': 'Correo electrónico',
    'form-project-label': 'Proyecto', 'form-project-placeholder': '¿En qué estás trabajando?',
    'form-message-label': 'Mensaje', 'form-message-placeholder': 'Cuéntame sobre tu proyecto u oportunidad...',
    'form-submit': 'Enviar Mensaje',
    'footer-role': 'Diseñadora de Producto & Vibe Coder',
    'footer-tagline': 'Diseñando experiencias digitales modernas con claridad y gusto.',
    'footer-copy': '© 2026 Paola Bramlett. Todos los derechos reservados.',
    // FAQ
    'faq-label': 'Preguntas',
    'faq-heading': 'Preguntas Frecuentes',
    'faq-sub': 'Respuestas directas a las preguntas que la gente hace antes de contactarme.',
    'faq-q1': '¿Cuánto cobras por trabajo de diseño y desarrollo?',
    'faq-a1': 'Las tarifas por hora van de $35 a $45 USD según el tipo de trabajo. La mayoría de proyectos están entre $1,000 y $5,000 USD en total. Se pueden hacer cotizaciones a precio fijo bajo pedido.',
    'faq-q2': '¿Cuánto tarda un proyecto típico?',
    'faq-a2': 'Una landing page o prototipo sencillo tarda 3–7 días. Un diseño UX/UI completo para una app normalmente toma 2–6 semanas. El tiempo depende del alcance y de si se incluye desarrollo.',
    'faq-q3': '¿Trabajas con clientes fuera de México?',
    'faq-a3': 'Sí. La mayoría de mis clientes están en EE.UU., Canadá y Europa. Todo el trabajo se hace de forma remota. Me comunico en inglés o español, en cualquier zona horaria.',
    'faq-q4': '¿Qué te diferencia de otros diseñadores?',
    'faq-a4': 'Cubro estrategia, diseño y desarrollo. La mayoría de los diseñadores entregan a un desarrollador — yo puedo llevar un proyecto desde wireframe hasta front-end funcional, eliminando la brecha entre diseño y lanzamiento.',
    'faq-q5': '¿Qué es el Vibe Coding y cómo ayuda a mi proyecto?',
    'faq-a5': 'El Vibe Coding es un flujo de trabajo asistido por IA usando herramientas como Claude Code para construir interfaces funcionales más rápido que el desarrollo tradicional. El resultado es código real y de calidad, no una maqueta. Así puedo entregar en días lo que normalmente toma semanas.',
    'faq-q6': '¿Qué tipo de proyectos aceptas?',
    'faq-a6': 'Startups construyendo su primer producto, founders lanzando un sitio o app, y equipos que necesitan un sistema de diseño o prototipo rápido. Trabajo mejor en proyectos donde importan tanto la calidad del diseño como la velocidad de entrega.',
    'faq-q7': '¿Te encargas del desarrollo o solo del diseño?',
    'faq-a7': 'Ambos. Diseño en Figma y construyo con HTML, CSS, JavaScript y herramientas asistidas por IA. Puedes obtener archivos de diseño, un prototipo funcional o código front-end listo para producción — o los tres.',
    'faq-q8': '¿Qué herramientas usas?',
    'faq-a8': 'Figma para diseño y prototipado, Claude Code para desarrollo asistido por IA, Adobe Illustrator para trabajo de marca y visual, y HTML, CSS y JavaScript para desarrollo front-end.',
    'faq-q9': '¿Cuándo es el momento ideal para incorporarte a un proyecto?',
    'faq-a9': 'Lo antes posible. Las decisiones de diseño tomadas antes del desarrollo evitan retrabajos costosos más adelante. Puedo unirme en la etapa de idea, a mitad del proyecto, o como socia de diseño continua para un equipo existente.',
    'faq-q10': '¿Cómo empiezo?',
    'faq-a10': 'Envía un mensaje por el formulario de contacto o llama al +52 951 408 2852. Describe tu proyecto en pocas frases. Recibirás una respuesta en 24 horas. Las consultas iniciales son gratuitas.',
  }
};

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('lang', lang);
}

function initLanguageSwitch() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  const saved = localStorage.getItem('lang');
  if (saved && translations[saved]) applyLanguage(saved);
}

// ── INIT ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initSmoothScroll();
  initCardTilt();
  initActiveNavLink();
  initHeroEntrance();
  initCursorGlow();
  initCounters();
  initFAQ();
  initLanguageSwitch();
});

// Expose for potential external use
window.PB = {
  reinitReveal: initScrollReveal,
};
