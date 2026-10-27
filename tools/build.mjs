// Optional generator for paolabramlett.com. The site deploys as plain static
// files; run `node tools/build.mjs` only after editing the content below.
// It writes the home and service pages (EN + ES) and syncs the shared nav,
// footer and head assets into the case studies, 404 and /thanks/.
// No dependencies (Node 18+).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.paolabramlett.com';
const LASTMOD = '2026-10-27';
const WA = 'https://wa.link/8polhi';
const V = '5';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = s => esc(s);

/* ── Routes ──────────────────────────────────────────── */
const ROUTES = {
  home: { en: '/', es: '/es/' },
  website: { en: '/services/website-design/', es: '/es/servicios/disenio-de-sitios-web/' },
  webapp: { en: '/services/web-app-design-development/', es: '/es/servicios/disenio-y-desarrollo-de-web-apps/' },
  firstapp: { en: '/services/first-app-mvp/', es: '/es/servicios/primera-app-mvp/' },
  finish: { en: '/services/finish-your-ai-built-app/', es: '/es/servicios/termina-tu-app-hecha-con-ia/' },
};
const SERVICE_KEYS = ['website', 'webapp', 'firstapp', 'finish'];

/* ── Shared UI strings ───────────────────────────────── */
const UI = {
  en: {
    skip: 'Skip to content', home: 'Paola Bramlett, home', menu: 'Menu', mainNav: 'Main',
    services: 'Services', work: 'Work', how: 'How it works', about: 'About', faq: 'FAQ', contact: 'Contact',
    start: 'Start a project', language: 'Language',
    svc: {
      website: ['Websites', 'Landing pages and business sites'],
      webapp: ['Web apps', 'Portals, bookings, dashboards'],
      firstapp: ['First app / MVP', 'From idea to launch'],
      finish: ['Finish your AI-built app', 'Lovable, Bolt and similar tools'],
    },
    footerRole: 'Senior Product Designer · Oaxaca, MX', footerNav: 'Footer', siteCol: 'Site',
    rights: 'All rights reserved.', where: 'Oaxaca, Mexico · Working worldwide',
    learn: 'Learn more', read: 'Read case study', nda: 'Concept visualization · real screens under NDA',
    role: 'Role', domain: 'Domain', status: 'Status',
    form: {
      title: 'Start a project', name: 'Name', namePh: 'Your name', email: 'Email', emailPh: 'you@company.com',
      project: 'Project', projectPh: 'e.g. A website for my clinic', need: 'What do you need?',
      chips: [['Website', 'Website'], ['Web app', 'Web app'], ['First app / MVP', 'First app / MVP'], ['Finish my AI-built app', 'Finish my AI-built app'], ['Not sure yet', 'Not sure yet']],
      message: 'Message', messagePh: 'Where are you now, and what do you need?', send: 'Send message', sent: 'Message sent',
      honeypot: 'Don’t fill this out:',
    },
  },
  es: {
    skip: 'Saltar al contenido', home: 'Paola Bramlett, inicio', menu: 'Menú', mainNav: 'Principal',
    services: 'Servicios', work: 'Proyectos', how: 'Cómo trabajo', about: 'Sobre mí', faq: 'Preguntas', contact: 'Contacto',
    start: 'Empieza un proyecto', language: 'Idioma',
    svc: {
      website: ['Sitios web', 'Landing pages y sitios para negocios'],
      webapp: ['Web apps', 'Portales, reservas, dashboards'],
      firstapp: ['Primera app / MVP', 'De la idea al lanzamiento'],
      finish: ['Termina tu app hecha con IA', 'Lovable, Bolt y herramientas similares'],
    },
    footerRole: 'Senior Product Designer · Oaxaca, México', footerNav: 'Pie de página', siteCol: 'Sitio',
    rights: 'Todos los derechos reservados.', where: 'Oaxaca, México · Trabajo con clientes de todo el mundo',
    learn: 'Ver más', read: 'Ver caso de estudio', nda: 'Visualización de concepto · pantallas reales bajo NDA',
    role: 'Rol', domain: 'Industria', status: 'Estado',
    form: {
      title: 'Empieza un proyecto', name: 'Nombre', namePh: 'Tu nombre', email: 'Correo', emailPh: 'tu@empresa.com',
      project: 'Proyecto', projectPh: 'Ej. Un sitio web para mi consultorio', need: '¿Qué necesitas?',
      chips: [['Sitio web', 'Website'], ['Web app', 'Web app'], ['Primera app / MVP', 'First app / MVP'], ['Terminar mi app hecha con IA', 'Finish my AI-built app'], ['Aún no sé', 'Not sure yet']],
      message: 'Mensaje', messagePh: '¿En qué punto estás y qué necesitas?', send: 'Enviar mensaje', sent: 'Mensaje enviado',
      honeypot: 'No llenes este campo:',
    },
  },
};

const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const waBtn = (label, extra = '') => `<a class="btn btn--secondary${extra}" href="${WA}" target="_blank" rel="noopener">${WA_ICON}<span>${esc(label)}</span></a>`;
const arrow = '<span class="arrow" aria-hidden="true">→</span>';
const faqIcon = '<span class="faq__icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="v" d="M6 1v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>';
const AURORA = n => `<div class="aurora" aria-hidden="true"><div class="aurora__layer" data-aurora>${'<i class="aurora__glow"></i>'.repeat(n)}</div></div>`;

/* ── Case studies (shared data) ──────────────────────── */
const CASES = {
  genogram: {
    url: '/work/genogram-tool-for-therapists/', img: 'case-genogram',
    en: { title: 'A genogram tool therapists actually want to use', desc: 'Existing tools were cluttered and slow. I designed a modern canvas that makes a patient’s family system readable at a glance.', role: 'UX/UI Designer', domain: 'Mental health', status: 'Live · in use', alt: 'Concept visualization of a light genogram canvas on a laptop, mapping three generations of a family' },
    es: { title: 'Una herramienta de genogramas que los terapeutas sí quieren usar', desc: 'Las herramientas existentes eran saturadas y lentas. Diseñé un canvas moderno que hace legible de un vistazo el sistema familiar de un paciente.', role: 'Diseñadora UX/UI', domain: 'Salud mental', status: 'En uso', alt: 'Visualización de concepto de un canvas de genograma claro en una laptop, con tres generaciones de una familia' },
    live: true,
  },
  kids: {
    url: '/work/kids-emotional-learning-app/', img: 'case-kids-emotions',
    en: { title: 'Helping kids understand their emotions, and parents understand their kids', desc: 'Games, journaling and daily check-ins for kids, plus an AI-powered parent view with concrete ways to connect.', role: 'UX/UI Designer', domain: 'Kids · Mental health · AI', status: 'In development', alt: 'Concept visualization of two phones: a playful emotions map for kids and a parent view with weekly moods' },
    es: { title: 'Ayudar a los niños a entender sus emociones, y a los padres a entender a sus hijos', desc: 'Juegos, journaling y check-ins diarios para niños, más una vista para padres con IA y formas concretas de conectar.', role: 'Diseñadora UX/UI', domain: 'Niños · Salud mental · IA', status: 'En desarrollo', alt: 'Visualización de concepto de dos teléfonos: un mapa de emociones para niños y una vista para padres con el ánimo de la semana' },
  },
  fleet: {
    url: '/work/ai-fleet-maintenance-platform/', img: 'case-fleet',
    en: { title: 'Predicting truck failures, starting with data drivers will actually log', desc: 'Quick manual logs plus data from connected tools, so AI can flag failures before they happen.', role: 'Senior Product Designer', domain: 'Logistics · AI', status: 'In development', alt: 'Concept visualization of a fleet maintenance dashboard on a tablet, with truck health and an alert' },
    es: { title: 'Predecir fallas en camiones, empezando por datos que los conductores sí van a registrar', desc: 'Registros manuales rápidos más datos de herramientas conectadas, para que la IA anticipe fallas antes de que sucedan.', role: 'Senior Product Designer', domain: 'Logística · IA', status: 'En desarrollo', alt: 'Visualización de concepto de un dashboard de mantenimiento de flotillas en una tablet, con el estado de los camiones y una alerta' },
  },
};
const ARCHIVE = {
  exploretogether: { url: '/work/exploretogether/', img: '/img/work/exploretogether-hero', en: ['ExploreTogether', 'Travel recommendations built on trust signals.'], es: ['ExploreTogether', 'Recomendaciones de viaje basadas en señales de confianza.'] },
  eventflow: { url: '/work/eventflow/', img: '/img/work/eventflow-hero', en: ['EventFlow', 'Invitations, RSVPs and updates in one place.'], es: ['EventFlow', 'Invitaciones, RSVPs y avisos en un solo lugar.'] },
  mindspace: { url: '/work/mindspace/', img: '/img/work/mindspace-hero', en: ['MindSpace', 'A guided check-in from “I feel off” to support.'], es: ['MindSpace', 'Un check-in guiado de “me siento raro” al apoyo correcto.'] },
};

const img = (base, alt, { sizes = '(max-width: 900px) 100vw, 400px', priority = false, lazy = true } = {}) =>
  `<img src="${base}-800.webp" srcset="${base}-800.webp 800w, ${base}-1536.webp 1536w" sizes="${sizes}" alt="${attr(alt)}" width="1536" height="1024"${priority ? ' fetchpriority="high"' : ''}${lazy && !priority ? ' loading="lazy"' : ''} />`;

/* ── Chrome: head assets, nav, footer ────────────────── */
const HEAD_ASSETS = `  <!-- head:assets -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Montserrat:wght@600;700&amp;display=swap" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Montserrat:wght@600;700&amp;display=swap" /></noscript>
  <link rel="stylesheet" href="/styles.css?v=${V}" />
  <script>document.documentElement.classList.add('js');setTimeout(function(){if(!window.__pb)document.documentElement.classList.remove('js')},4000)</script>
  <!-- /head:assets -->`;

// mode: 'en' | 'es' (real URLs) or 'toggle' (English page with data-es)
function tx(mode, key, sub) {
  const pick = l => (sub ? UI[l][key][sub] : UI[l][key]);
  return mode === 'toggle' ? { text: pick('en'), es: pick('es') } : { text: pick(mode) };
}
const T = (mode, tag, key, cls = '', extra = '') => {
  const v = tx(mode, key);
  return `<${tag}${cls ? ` class="${cls}"` : ''}${v.es ? ` data-es="${attr(v.es)}"` : ''}${extra}>${esc(v.text)}</${tag}>`;
};

function nav(mode, page) {
  const L = mode === 'toggle' ? 'en' : mode;
  const r = k => ROUTES[k][L];
  const homeHref = L === 'es' ? '/es/' : '/';
  const anchor = id => `${homeHref}#${id}`;
  const esA = (k, sub) => (mode === 'toggle' ? ` data-es="${attr(sub ? UI.es[k][sub][0] : UI.es[k])}"` : '');
  const svcItems = SERVICE_KEYS.map(k => {
    const [name, d] = UI[L].svc[k];
    const es = UI.es.svc[k];
    return `<a href="${r(k)}"${mode === 'toggle' ? ` data-es-html="${attr(`${esc(es[0])}<span>${esc(es[1])}</span>`)}"` : ''}>${esc(name)}<span>${esc(d)}</span></a>`;
  }).join('');
  let lang;
  if (mode === 'toggle') {
    lang = `<div class="lang" role="group" aria-label="Language" data-es-aria="Idioma"><button type="button" data-lang="en" aria-pressed="true">EN</button><span class="lang__sep" aria-hidden="true">/</span><button type="button" data-lang="es" aria-pressed="false">ES</button></div>`;
  } else {
    const other = page && ROUTES[page] ? ROUTES[page] : ROUTES.home;
    const enCur = L === 'en' ? ' aria-current="true"' : '';
    const esCur = L === 'es' ? ' aria-current="true"' : '';
    lang = `<div class="lang" role="group" aria-label="${UI[L].language}"><a href="${other.en}" hreflang="en" lang="en"${enCur} aria-label="English">EN</a><span class="lang__sep" aria-hidden="true">/</span><a href="${other.es}" hreflang="es" lang="es"${esCur} aria-label="Español">ES</a></div>`;
  }
  const t = k => esc(UI[L][k]);
  const sheetSvc = SERVICE_KEYS.map((k, i) => `<a class="small" href="${r(k)}" style="--i:${i + 1}"${mode === 'toggle' ? ` data-es="${attr(UI.es.svc[k][0])}"` : ''}>${esc(UI[L].svc[k][0])}</a>`).join('\n    ');
  return `  <!-- chrome:nav -->
  <a class="skip-link" href="#main"${esA('skip')}>${t('skip')}</a>
  <header class="nav">
    <nav class="wrap nav__inner" aria-label="${t('mainNav')}"${mode === 'toggle' ? ' data-es-aria="Principal"' : ''}>
      <a class="nav__logo" href="${homeHref}" aria-label="${t('home')}"${mode === 'toggle' ? ` data-es-aria="${UI.es.home}"` : ''}><img src="/img/logo-p.webp" alt="" width="125" height="96" />Paola Bramlett</a>
      <ul class="nav__links">
        <li class="nav__dd"><button type="button" class="nav__dd-btn" aria-expanded="false" aria-controls="nav-services"><span${esA('services')}>${t('services')}</span><svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <div class="nav__menu" id="nav-services">${svcItems}</div></li>
        <li><a href="${anchor('work')}"${esA('work')}>${t('work')}</a></li>
        <li><a href="${anchor('how-it-works')}"${esA('how')}>${t('how')}</a></li>
        <li><a href="${anchor('about')}"${esA('about')}>${t('about')}</a></li>
        <li><a href="${anchor('faq')}"${esA('faq')}>${t('faq')}</a></li>
      </ul>
      <div class="nav__actions">
        ${lang}
        <a class="btn btn--primary btn--sm" href="${anchor('contact')}"${esA('start')}>${t('start')}</a>
        <button class="nav__menu-btn" type="button" aria-expanded="false" aria-controls="nav-sheet" aria-label="${t('menu')}"${mode === 'toggle' ? ' data-es-aria="Menú"' : ''}><span></span><span></span></button>
      </div>
    </nav>
  </header>
  <div class="nav__sheet" id="nav-sheet">
    <p class="nav__sheet-label" style="--i:0"${esA('services')}>${t('services')}</p>
    ${sheetSvc}
    <p class="nav__sheet-label" style="--i:5" aria-hidden="true">&nbsp;</p>
    <a class="big" href="${anchor('work')}" style="--i:6"${esA('work')}>${t('work')}</a>
    <a class="big" href="${anchor('how-it-works')}" style="--i:7"${esA('how')}>${t('how')}</a>
    <a class="big" href="${anchor('about')}" style="--i:8"${esA('about')}>${t('about')}</a>
    <a class="big" href="${anchor('faq')}" style="--i:9"${esA('faq')}>${t('faq')}</a>
    <a class="btn btn--primary" href="${anchor('contact')}" style="--i:10"${esA('start')}>${t('start')}</a>
  </div>
  <!-- /chrome:nav -->`;
}

function footer(mode) {
  const L = mode === 'toggle' ? 'en' : mode;
  const homeHref = L === 'es' ? '/es/' : '/';
  const esA = k => (mode === 'toggle' ? ` data-es="${attr(UI.es[k])}"` : '');
  const t = k => esc(UI[L][k]);
  const svc = SERVICE_KEYS.map(k => `<a href="${ROUTES[k][L]}"${mode === 'toggle' ? ` data-es="${attr(UI.es.svc[k][0])}"` : ''}>${esc(UI[L].svc[k][0])}</a>`).join('\n          ');
  return `  <!-- chrome:footer -->
  <footer class="footer">
    <div class="wrap footer__top">
      <div class="footer__brand">
        <strong>Paola Bramlett</strong>
        <span${esA('footerRole')}>${t('footerRole')}</span>
      </div>
      <nav class="footer__nav" aria-label="${t('footerNav')}"${mode === 'toggle' ? ` data-es-aria="${UI.es.footerNav}"` : ''}>
        <div class="footer__col">
          <h2${esA('services')}>${t('services')}</h2>
          ${svc}
        </div>
        <div class="footer__col">
          <h2${esA('siteCol')}>${t('siteCol')}</h2>
          <a href="${homeHref}#work"${esA('work')}>${t('work')}</a>
          <a href="${homeHref}#about"${esA('about')}>${t('about')}</a>
          <a href="${homeHref}#contact"${esA('contact')}>${t('contact')}</a>
        </div>
        <div class="footer__col">
          <h2>Social</h2>
          <a href="https://www.linkedin.com/in/paolabramlett" rel="me noopener" target="_blank">LinkedIn ↗</a>
          <a href="https://github.com/paolabramlett" rel="me noopener" target="_blank">GitHub ↗</a>
          <a href="https://www.instagram.com/paolabramlett" rel="me noopener" target="_blank">Instagram ↗</a>
        </div>
      </nav>
    </div>
    <div class="wrap footer__bottom">
      <span>© <span data-year>2026</span> Paola Bramlett. <span${esA('rights')}>${t('rights')}</span></span>
      <span${esA('where')}>${t('where')}</span>
    </div>
  </footer>
  <!-- /chrome:footer -->`;
}

function form(L) {
  const f = UI[L].form;
  const chips = f.chips.map(([label, value]) => `<button type="button" class="chip" aria-pressed="false" data-value="${attr(value)}">${esc(label)}</button>`).join('\n              ');
  return `          <form class="form-card reveal" style="--d:120" id="contactForm" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="${L === 'es' ? '/thanks/?lang=es' : '/thanks/'}" novalidate aria-labelledby="form-title" data-contact>
            <input type="hidden" name="form-name" value="contact" />
            <input type="hidden" name="needs" value="" data-needs />
            <input type="hidden" name="lang" value="${L}" />
            <p class="hp" aria-hidden="true"><label>${esc(f.honeypot)} <input type="text" name="bot-field" tabindex="-1" autocomplete="off" /></label></p>
            <h3 class="form-card__head" id="form-title">${esc(f.title)}</h3>
            <div class="form-card__body">
              <div class="field"><label for="name">${esc(f.name)}</label><input id="name" name="name" type="text" autocomplete="name" required placeholder="${attr(f.namePh)}" /></div>
              <div class="field"><label for="email">${esc(f.email)}</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="${attr(f.emailPh)}" /></div>
              <div class="field"><label for="project">${esc(f.project)}</label><input id="project" name="project" type="text" placeholder="${attr(f.projectPh)}" /></div>
              <fieldset class="chips">
                <legend>${esc(f.need)}</legend>
              ${chips}
              </fieldset>
              <div class="field field--area"><label class="sr-only" for="message">${esc(f.message)}</label><textarea id="message" name="message" required rows="4" placeholder="${attr(f.messagePh)}"></textarea></div>
              <p class="form__note" role="status" aria-live="polite"></p>
            </div>
            <div class="form-card__foot">
              <button class="btn btn--primary btn--sm send-btn" type="submit"><span class="send-btn__idle">${esc(f.send)}</span><span class="send-btn__done">${esc(f.sent)}</span></button>
            </div>
          </form>`;
}

function head({ L, page, title, desc, jsonld, preload = '' }) {
  const url = SITE + ROUTES[page][L];
  return `<!DOCTYPE html>
<html lang="${L}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="en" href="${SITE}${ROUTES[page].en}" />
  <link rel="alternate" hreflang="es" href="${SITE}${ROUTES[page].es}" />
  <link rel="alternate" hreflang="x-default" href="${SITE}${ROUTES[page].en}" />
  <meta name="author" content="Paola Bramlett" />
  <meta name="theme-color" content="#ffffff" />
  <meta name="robots" content="index, follow, max-image-preview:large" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Paola Bramlett" />
  <meta property="og:title" content="${attr(title)}" />
  <meta property="og:description" content="${attr(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${L === 'es' ? 'es_MX' : 'en_US'}" />
  <meta property="og:locale:alternate" content="${L === 'es' ? 'en_US' : 'es_MX'}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attr(title)}" />
  <meta name="twitter:description" content="${attr(desc)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.jpg" />

  <link rel="icon" href="/assets/icon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/icon-180.png" />
  <link rel="alternate" type="text/plain" title="LLM summary" href="/llms.txt" />

${HEAD_ASSETS}${preload}
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>`;
}

const foot = `\n  <script src="/script.js?v=${V}" defer></script>\n</body>\n</html>\n`;

/* ── JSON-LD shared nodes ────────────────────────────── */
const PERSON = {
  '@type': 'Person', '@id': `${SITE}/#paola`, name: 'Paola Bramlett', alternateName: 'Pao Bramlett',
  jobTitle: 'Senior Product Designer',
  description: 'Senior product designer with 7+ years of experience who also codes. Based in Oaxaca, Mexico, she designs, builds and launches websites, web apps and first apps (MVPs) for businesses in any industry, and maintains them after launch.',
  url: `${SITE}/`, image: `${SITE}/img/paola-bramlett.webp`, email: 'mailto:paolabramlett@gmail.com', telephone: '+52 951 408 2852',
  address: { '@type': 'PostalAddress', addressLocality: 'Oaxaca de Juárez', addressRegion: 'Oaxaca', addressCountry: 'MX' },
  knowsLanguage: ['en', 'es'],
  knowsAbout: ['Website design', 'Web development', 'Landing pages', 'Web app design', 'MVP design', 'Mobile app design', 'Product design', 'UX design', 'UI design', 'Design systems', 'Prototyping', 'Front-end development', 'AI-assisted development', 'SEO', 'Generative engine optimization', 'Stripe payments', 'Netlify'],
  sameAs: ['https://www.linkedin.com/in/paolabramlett', 'https://github.com/paolabramlett', 'https://www.instagram.com/paolabramlett'],
};
const BUSINESS = L => ({
  '@type': 'ProfessionalService', '@id': `${SITE}/#business`, name: 'Paola Bramlett, website and app design and development',
  url: `${SITE}/`, image: `${SITE}/assets/og-image.jpg`, founder: { '@id': `${SITE}/#paola` },
  description: L === 'es'
    ? 'Diseño y desarrollo de sitios web, web apps y primeras apps (MVP) para negocios de cualquier industria, desde Oaxaca, México. Cotización a precio fijo después de una llamada gratuita, con hosting y mantenimiento después del lanzamiento.'
    : 'Design and development of websites, web apps and first apps (MVPs) for businesses in any industry, from Oaxaca, Mexico. Fixed-price quote after a free call, with hosting and care after launch.',
  telephone: '+52 951 408 2852', email: 'paolabramlett@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Oaxaca de Juárez', addressRegion: 'Oaxaca', addressCountry: 'MX' },
  areaServed: ['Mexico', 'United States', 'Canada', 'Europe', 'Worldwide'], availableLanguage: ['English', 'Spanish'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: L === 'es' ? 'Servicios' : 'Services',
    itemListElement: SERVICE_KEYS.map(k => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: SERVICES[k][L].name, url: SITE + ROUTES[k][L], provider: { '@id': `${SITE}/#paola` } } })),
  },
});
const faqLd = (faqs, url) => ({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });

function faqList(faqs, name) {
  return faqs.map(([q, a], i) => `          <details name="${name}" class="reveal" style="--d:${i * 40}">
            <summary><span class="faq__q">${esc(q)}</span>${faqIcon}</summary>
            <div class="faq__a"><p>${a}</p></div>
          </details>`).join('\n');
}

/* ══ Content: home ══════════════════════════════════════ */
const HOME = {
  en: {
    title: 'Paola Bramlett | Website, Web App & First App Design and Development',
    desc: 'Senior product designer who codes. I design, build and launch websites, web apps and first apps for businesses in any industry, and stay with you after launch. From Oaxaca, Mexico.',
    h1: ['Your website, web app', 'or first app,', 'designed, built &amp; launched.'],
    h1sr: 'Your website, web app or first app, designed, built and launched.',
    lead: 'I’m Paola, a senior product designer with 7+ years of experience who also codes. From Oaxaca, Mexico, I take your idea from the first sketch to a live product and stay with you after launch. I’m currently taking new projects, in English or Spanish.',
    cta: 'Tell me about your project',
    paths: [
      ['website', 'Website', 'A website that brings you clients', 'Landing pages and business websites, designed, built and ready to be found by search engines and AI assistants.', 'Businesses &amp; personal brands', 'Landing in 3–7 days', 'Laptop and phone showing a modern business website in soft pastel colors'],
      ['webapp', 'Web app', 'A web app your clients or team use every day', 'Portals, memberships, bookings and dashboards, from UX to working code.', 'Businesses ready to digitize', 'Scoped on a free call', 'Desktop monitor and phone showing a pastel web app dashboard'],
      ['firstapp', 'First app', 'Your first app, from idea to launch', 'For founders and experts with an idea: we define the MVP, design it and build it.', 'Founders &amp; first-time builders', 'UX/UI in 2–6 weeks', 'Three phones showing the screens of a new mobile app in pastel tones'],
    ],
    forL: 'For', timeL: 'Time',
    marquee: ['Websites', 'Web apps', 'First apps', 'Travel', 'Mental health', 'Kids &amp; families', 'Logistics', 'Events'],
    band: 'Lovable, Bolt and other AI builders are a great start. But at some point you get stuck, after paying a lot to get there. I take your project to the finish line.',
    bandAccent: 'finish|line', bandCta: 'Finish my project', bandSub: 'An honest audit, the right technology and a launch. A product that is yours, independent and ready to grow.',
    howH: 'From idea to live,<br />without surprises.', howLead: 'A fixed-price quote before we start, clear deliverables at every step, and someone to call after launch.',
    steps: [
      ['Free call', 'We talk about your idea, your goals and your budget. No jargon, no commitment.', 'A clear next step'],
      ['Plan &amp; quote', 'I define the scope and send a fixed-price quote, so you know exactly what you’ll get.', 'Scope, timeline, fixed price'],
      ['Design &amp; build', 'I design it, you review it, then I build it, with check-ins so nothing surprises you.', 'Designs + working product'],
      ['Launch &amp; care', 'We go live, and I stay with you. Websites have an annual hosting &amp; care plan; apps get a care plan quoted per project.', 'Live site or app + support'],
    ],
    workH: 'Different industries.<br />Same process.', workLead: 'Real client projects in mental health, education and logistics, shared without names to respect confidentiality.',
    chips: ['Mental health', 'Kids &amp; families', 'Logistics', 'Travel', 'Events'], chipYou: '+ your industry', chipsLabel: 'Industries I’ve worked in',
    whyH: 'One person, start to finish.',
    why: [
      ['Design + code', 'I design it and I build it. No hand-offs between a designer and a developer, nothing lost in between.'],
      ['7+ years of experience', 'Senior product design for startups and businesses, the same process behind the projects above.'],
      ['English &amp; Spanish', 'Work with me in your language, from Mexico, the US, Canada or Europe.'],
      ['Your code and domain are yours', 'What we build belongs to you. If you ever want to move, I hand everything over.'],
      ['I stay after launch', 'Websites get my hosting &amp; care plan, with bug fixes and small data changes included. For apps, the care plan is quoted per project.'],
      ['Built to be found', 'SEO and GEO from day one, so search engines and AI assistants can find and understand your business.'],
    ],
    archH: 'Earlier work &amp; experiments.', prev: 'Previous', next: 'Next', archLabel: 'Earlier work and experiments',
    arch: { exploretogether: 'UX/UI · iOS, Android &amp; Web · 12 weeks', eventflow: 'Product design · Mobile &amp; Web · 10 weeks', mindspace: 'UX concept · 4 weeks' },
    archAlt: { exploretogether: 'ExploreTogether mobile screens for discovering and sharing travel destinations', eventflow: 'EventFlow event planning screens on mobile and desktop', mindspace: 'MindSpace mental health support platform on desktop and mobile' },
    lab: [['LAB · AI-assisted build', 'World Cup 2026 pool', 'Designed and shipped end to end.', 'https://quiniela-mundial-2026.netlify.app/', '#8b5cf6'], ['LAB · Product prototype', 'Situationship Clarity Score', 'A small experiment in flow and first impressions.', 'https://situationship-clarity-score.netlify.app/', '#e879f9']],
    tryIt: 'Try it live',
    aboutH: 'Hi, I’m Pao.<br />Designer and developer.',
    about: [
      'I’m Paola Bramlett, a senior product designer based in Oaxaca, Mexico. For 7+ years I’ve designed products for startups and businesses in Mexico, the US, Canada and Europe.',
      'I’ve designed for therapists, for children and their parents, and for truck drivers and fleet managers: people with very different needs and very little patience for confusing software.',
      'I also code. With Figma and AI-assisted development, I take projects from the first sketch to a live website or app, and I stay around after launch to keep it running.',
    ],
    facts: [['Languages', 'English · Spanish'], ['I build', 'Websites · Web apps · First apps'], ['Tools', 'Figma · Claude Code']],
    photoAlt: 'Portrait of Paola Bramlett, senior product designer',
    faqH: 'Questions people ask me.', faqAsk: 'Can’t find yours? Ask me directly',
    faqs: [
      ['How much does a website or app cost?', 'It depends on what you need, so I don’t publish fixed prices. After a free call, I send you a fixed-price quote with the scope, timeline and everything included, so you know the full investment before we start.'],
      ['How long does it take?', 'A landing page or a simple prototype takes 3–7 days. A full UX/UI design for an app usually takes 2–6 weeks. For web apps, we define the timeline together on the free call, because it depends on what the app needs to do.'],
      ['What do I need to get started?', 'Just your idea and a few minutes to tell me about it. If you have a logo, photos, texts or examples you like, great, but they’re not required. I’ll guide you through the rest.'],
      ['I started my app in Lovable or Bolt, can you take it over?', 'Yes. Those tools are a great way to start. I audit what you built and move it to the technology it needs, free from the tool’s plans. Sometimes parts need to be rebuilt, but you end up with a working product that is yours, independent and ready to grow.'],
      ['Do you build it, or only design it?', 'Both. I design in Figma and build with HTML, CSS and JavaScript, using AI-assisted development to move fast. If your project needs a more complex back end, I’ll tell you on the first call and plan the best way to handle it with you.'],
      ['Do I own the code?', 'Yes. Your code and domain are yours. I host projects on my Netlify account so I can keep them running and fix things fast, and if you ever want to move, I hand everything over.'],
      ['Do you maintain it after launch?', 'Yes. Websites have an annual hosting and care plan on Netlify that includes hosting, bug fixes and small data changes, like a new phone number or opening hours. New content or new sections are quoted separately. For web apps and apps, the care plan is quoted per project.'],
      ['Do you work with businesses in any industry?', 'Yes. I’ve worked in mental health, education, logistics, travel and events, and the process is the same in any industry: understand your clients, then design and build something they get right away.'],
      ['Do you work with clients outside Mexico?', 'Yes. Most of my clients are in the US, Canada and Europe. Everything is remote, in English or Spanish, across time zones.'],
      ['How do I get started?', `Send me a message with the form below or on <a href="${WA}" target="_blank" rel="noopener">WhatsApp (+52 951 408 2852)</a> with a few lines about your project. I reply within 24 hours, and the first call is free.`],
    ],
    contactH: 'Tell me about<br />your project.', contactLead: 'A website, a web app or your first app, or something you started and got stuck on. I reply within 24 hours, and the first call is free.',
    waLong: 'Message me on WhatsApp', emailL: 'Email',
  },
  es: {
    title: 'Paola Bramlett | Diseño y desarrollo de páginas web y apps en México',
    desc: 'Diseño y desarrollo de páginas web, web apps y tu primera app, desde Oaxaca, México. Una sola persona de la idea al lanzamiento, con mantenimiento después. Cotización a precio fijo.',
    h1: ['Tu sitio web, web app', 'o primera app:', 'diseño, desarrollo', 'y lanzamiento.'],
    h1sr: 'Tu sitio web, web app o primera app: diseño, desarrollo y lanzamiento.',
    lead: 'Soy Paola, senior product designer con más de 7 años de experiencia que también programa. Desde Oaxaca, México, llevo tu idea del primer boceto a un producto en línea y me quedo contigo después del lanzamiento. Estoy tomando proyectos nuevos, en español o inglés.',
    cta: 'Cuéntame de tu proyecto',
    paths: [
      ['website', 'Sitio web', 'Un sitio web que te trae clientes', 'Landing pages y sitios para negocios, diseñados, construidos y listos para que buscadores y asistentes de IA los encuentren.', 'Negocios y marcas personales', 'Landing en 3–7 días', 'Laptop y teléfono con un sitio web moderno para un negocio en colores pastel'],
      ['webapp', 'Web app', 'Una web app que tus clientes o tu equipo usan todos los días', 'Portales, membresías, reservas y dashboards, del UX al código funcionando.', 'Negocios listos para digitalizarse', 'Se define en la llamada gratuita', 'Monitor y teléfono con el dashboard de una web app en tonos pastel'],
      ['firstapp', 'Primera app', 'Tu primera app, de la idea al lanzamiento', 'Para founders y expertos con una idea: definimos el MVP, lo diseñamos y lo construimos.', 'Founders y quien crea su primera app', 'UX/UI en 2–6 semanas', 'Tres teléfonos con las pantallas de una app móvil nueva en tonos pastel'],
    ],
    forL: 'Para', timeL: 'Tiempo',
    marquee: ['Sitios web', 'Web apps', 'Primeras apps', 'Viajes', 'Salud mental', 'Niños y familias', 'Logística', 'Eventos'],
    band: 'Lovable, Bolt y otras herramientas de IA son un gran inicio. Pero en algún punto te atoras, después de pagar mucho para llegar ahí. Yo llevo tu proyecto a la línea final.',
    bandAccent: 'línea|final', bandCta: 'Termina mi proyecto', bandSub: 'Una auditoría honesta, la tecnología correcta y un lanzamiento. Un producto tuyo, independiente y listo para crecer.',
    howH: 'De la idea a en línea,<br />sin sorpresas.', howLead: 'Una cotización a precio fijo antes de empezar, entregables claros en cada paso y alguien a quien llamar después del lanzamiento.',
    steps: [
      ['Llamada gratuita', 'Platicamos de tu idea, tus metas y tu presupuesto. Sin tecnicismos y sin compromiso.', 'Un siguiente paso claro'],
      ['Plan y cotización', 'Defino el alcance y te mando una cotización a precio fijo, para que sepas exactamente qué vas a recibir.', 'Alcance, tiempos, precio fijo'],
      ['Diseño y desarrollo', 'Lo diseño, tú lo revisas y luego lo construyo, con revisiones para que nada te sorprenda.', 'Diseños + producto funcionando'],
      ['Lanzamiento y cuidado', 'Salimos en línea y me quedo contigo. Los sitios web tienen un plan anual de hosting y cuidado; las apps, un plan de cuidado que se cotiza por proyecto.', 'Sitio o app en línea + soporte'],
    ],
    workH: 'Industrias distintas.<br />El mismo proceso.', workLead: 'Proyectos reales con clientes en salud mental, educación y logística, sin nombres por respeto a su confidencialidad.',
    chips: ['Salud mental', 'Niños y familias', 'Logística', 'Viajes', 'Eventos'], chipYou: '+ tu industria', chipsLabel: 'Industrias en las que he trabajado',
    whyH: 'Una sola persona, de principio a fin.',
    why: [
      ['Diseño + código', 'Lo diseño y lo construyo. Sin pasar el proyecto de un diseñador a un programador, sin que nada se pierda en el camino.'],
      ['Más de 7 años de experiencia', 'Diseño de producto senior para startups y negocios, el mismo proceso detrás de los proyectos de arriba.'],
      ['Español e inglés', 'Trabaja conmigo en tu idioma, desde México, Estados Unidos, Canadá o Europa.'],
      ['Tu código y tu dominio son tuyos', 'Lo que construimos te pertenece. Si algún día quieres cambiarte, te entrego todo.'],
      ['Me quedo después del lanzamiento', 'Los sitios web tienen mi plan de hosting y cuidado, con corrección de errores y pequeños cambios de datos incluidos. Para apps, el plan de cuidado se cotiza por proyecto.'],
      ['Hecho para que te encuentren', 'SEO y GEO desde el primer día, para que buscadores y asistentes de IA puedan encontrar y entender tu negocio.'],
    ],
    archH: 'Trabajo anterior y experimentos.', prev: 'Anterior', next: 'Siguiente', archLabel: 'Trabajo anterior y experimentos',
    arch: { exploretogether: 'UX/UI · iOS, Android y Web · 12 semanas', eventflow: 'Diseño de producto · Móvil y Web · 10 semanas', mindspace: 'Concepto UX · 4 semanas' },
    archAlt: { exploretogether: 'Pantallas móviles de ExploreTogether para descubrir y compartir destinos de viaje', eventflow: 'Pantallas de planeación de eventos de EventFlow en móvil y escritorio', mindspace: 'Plataforma de apoyo en salud mental MindSpace en escritorio y móvil' },
    lab: [['LAB · Construido con IA', 'Quiniela Mundial 2026', 'Diseñada y lanzada de principio a fin.', 'https://quiniela-mundial-2026.netlify.app/', '#8b5cf6'], ['LAB · Prototipo de producto', 'Situationship Clarity Score', 'Un pequeño experimento de flujo y primera impresión.', 'https://situationship-clarity-score.netlify.app/', '#e879f9']],
    tryIt: 'Pruébalo',
    aboutH: 'Hola, soy Pao.<br />Diseño y programo.',
    about: [
      'Soy Paola Bramlett, senior product designer desde Oaxaca, México. Por más de 7 años he diseñado productos para startups y negocios en México, Estados Unidos, Canadá y Europa.',
      'He diseñado para terapeutas, para niños y sus papás, y para conductores y gerentes de flotillas: personas con necesidades muy distintas y muy poca paciencia para software confuso.',
      'También programo. Con Figma y desarrollo asistido por IA, llevo los proyectos del primer boceto a un sitio o app en línea, y me quedo después del lanzamiento para mantenerlo funcionando.',
    ],
    facts: [['Idiomas', 'Español · Inglés'], ['Hago', 'Sitios web · Web apps · Primeras apps'], ['Herramientas', 'Figma · Claude Code']],
    photoAlt: 'Retrato de Paola Bramlett, senior product designer',
    faqH: 'Lo que más me preguntan.', faqAsk: '¿No encuentras la tuya? Pregúntame directo',
    faqs: [
      ['¿Cuánto cuesta una página web o una app en México?', 'Depende de lo que necesites, por eso no publico precios fijos. Después de una llamada gratuita te mando una cotización a precio fijo con el alcance, los tiempos y todo lo que incluye, para que conozcas la inversión completa antes de empezar.'],
      ['¿Cuánto tiempo tarda?', 'Una landing page o un prototipo sencillo toma de 3 a 7 días. El diseño UX/UI completo de una app normalmente toma de 2 a 6 semanas. En las web apps definimos los tiempos juntos en la llamada gratuita, porque dependen de lo que la app necesita hacer.'],
      ['¿Qué necesito para empezar?', 'Solo tu idea y unos minutos para contármela. Si tienes logo, fotos, textos o ejemplos que te gusten, qué bien, pero no son necesarios. Yo te guío con el resto.'],
      ['Empecé mi app en Lovable o Bolt, ¿puedes continuarla?', 'Sí. Esas herramientas son una gran forma de empezar. Audito lo que construiste y lo paso a la tecnología que necesita, libre de los planes de la herramienta. A veces hay que rehacer partes, pero al final tienes un producto funcional, tuyo, independiente y listo para crecer.'],
      ['¿Tú la construyes o solo la diseñas?', 'Las dos cosas. Diseño en Figma y programo con HTML, CSS y JavaScript, con desarrollo asistido por IA para avanzar rápido. Si tu proyecto necesita un back end más complejo, te lo digo desde la primera llamada y planeamos juntos la mejor forma de resolverlo.'],
      ['¿El código es mío?', 'Sí. Tu código y tu dominio son tuyos. Alojo los proyectos en mi cuenta de Netlify para mantenerlos funcionando y resolver cualquier cosa rápido, y si algún día quieres cambiarte, te entrego todo.'],
      ['¿Das mantenimiento después del lanzamiento?', 'Sí. Los sitios web tienen un plan anual de hosting y cuidado en Netlify que incluye hosting, corrección de errores y pequeños cambios de datos, como un teléfono o un horario nuevo. El contenido nuevo o las secciones nuevas se cotizan aparte. Para web apps y apps, el plan de cuidado se cotiza por proyecto.'],
      ['¿Trabajas con negocios de cualquier industria?', 'Sí. He trabajado en salud mental, educación, logística, viajes y eventos, y el proceso es el mismo en cualquier industria: entender a tus clientes y luego diseñar y construir algo que entiendan desde el primer momento.'],
      ['¿Trabajas con clientes de todo México y de otros países?', 'Sí. Trabajo de forma remota desde Oaxaca con clientes en todo México, Estados Unidos, Canadá y Europa, en español o inglés.'],
      ['¿Cómo empezamos?', `Mándame un mensaje con el formulario de abajo o por <a href="${WA}" target="_blank" rel="noopener">WhatsApp (+52 951 408 2852)</a> con unas líneas sobre tu proyecto. Te respondo en menos de 24 horas y la primera llamada es gratis.`],
    ],
    contactH: 'Cuéntame de<br />tu proyecto.', contactLead: 'Un sitio web, una web app o tu primera app, o algo que empezaste y donde te atoraste. Te respondo en menos de 24 horas y la primera llamada es gratis.',
    waLong: 'Escríbeme por WhatsApp', emailL: 'Correo',
  },
};

/* ══ Content: services ═════════════════════════════════ */
const SERVICES = {
  website: {
    related: null,
    en: {
      name: 'Website design and development', title: 'Website Design & Development for Businesses | Paola Bramlett',
      desc: 'Landing pages and business websites for any industry, designed, built and launched by one person. SEO and GEO included, plus WhatsApp, forms and Stripe payments when you need them.',
      crumb: 'Websites', h1: ['Website design &amp; development', 'that brings you clients.'],
      lead: 'Landing pages and business websites for any industry, designed, built and launched by one person, with SEO and GEO from day one so search engines and AI assistants like ChatGPT can find and understand your business. In English or Spanish.',
      cta: 'Get a fixed-price quote',
      facts: [['Timeline', 'Landing in 3–7 days'], ['Price', 'Fixed quote after a free call'], ['Includes', 'Design, code, launch, SEO/GEO'], ['After launch', 'Hosting &amp; care plan']],
      whoH: 'A website that works as hard as you do.', whoLead: '',
      who: [['Small businesses', 'You need a site that explains what you do in seconds and turns visits into calls or WhatsApp messages.'], ['Personal brands &amp; professionals', 'Coaches, consultants, creatives: a site that feels like you and makes people trust you.'], ['Launches &amp; events', 'A landing page for a product, service or event, live fast and built to convert.']],
      incH: 'Everything to go live, and stay live.',
      inc: [['Strategy &amp; structure', 'What to say, and in what order, for your clients.'], ['Design in Figma', 'A design you review and approve before any code.'], ['Development', 'Fast, clean code, no bloated templates.'], ['SEO + GEO', 'Structured data and clear content, so search engines and AI assistants can understand your business.'], ['Forms &amp; integrations', 'Contact forms, WhatsApp and payments with Stripe when you need them.'], ['Hosting &amp; care', 'Optional annual plan on Netlify: hosting, bug fixes and small data changes.']],
      relH: 'Projects like yours.', relNote: 'The same process behind my product work applies to every website: understand your clients first, then design and build something they get right away.', relLink: 'See my work',
      faqH: 'Questions about websites.',
      faqs: [
        ['How much does a website cost?', 'Every website is different, so I quote each one at a fixed price after a free call. You’ll know the scope, the timeline and the full investment before we start.'],
        ['Can you help me get recommended by ChatGPT?', 'No one can promise that, and I won’t. What I do is build your site so search engines and AI assistants can find it, read it and understand what you offer: clear content, structured data, fast pages and the right technical setup.'],
        ['Can I update the content myself?', 'Small data changes, like a phone number or opening hours, are included in the care plan. If you want to edit content often yourself, we’ll talk on the call about the best setup for you.'],
        ['What if I already have a website?', 'I can redesign it or rebuild it. I start by reviewing what works and what doesn’t, so we keep what’s worth keeping.'],
        ['How long does it take?', 'A landing page takes 3–7 days. A larger business website depends on the number of pages, and I’ll give you a clear timeline in the quote.'],
      ],
      ctaH: 'Ready for a website that brings you clients?',
    },
    es: {
      name: 'Diseño y desarrollo de sitios web', title: 'Diseño de páginas web en México para negocios | Paola Bramlett',
      desc: 'Diseño y desarrollo de páginas web y landing pages en México, desde Oaxaca. SEO y GEO incluidos, WhatsApp, formularios y pagos con Stripe. Cotización a precio fijo tras una llamada gratuita.',
      crumb: 'Sitios web', h1: ['Diseño y desarrollo de sitios web', 'que te traen clientes.'],
      lead: 'Landing pages y sitios web para negocios de cualquier industria en México y el mundo, diseñados, construidos y lanzados por una sola persona, con SEO y GEO desde el primer día para que buscadores y asistentes de IA como ChatGPT puedan encontrar y entender tu negocio. En español o inglés.',
      cta: 'Pide una cotización a precio fijo',
      facts: [['Tiempo', 'Landing en 3–7 días'], ['Precio', 'Cotización fija tras una llamada gratuita'], ['Incluye', 'Diseño, código, lanzamiento, SEO/GEO'], ['Después del lanzamiento', 'Plan de hosting y cuidado']],
      whoH: 'Un sitio web que trabaja tanto como tú.', whoLead: '',
      who: [['Pequeños negocios', 'Necesitas un sitio que explique lo que haces en segundos y convierta visitas en llamadas o mensajes de WhatsApp.'], ['Marcas personales y profesionales', 'Coaches, consultores, creativos: un sitio que se sienta como tú y genere confianza.'], ['Lanzamientos y eventos', 'Una landing page para un producto, servicio o evento, en línea rápido y hecha para convertir.']],
      incH: 'Todo para salir en línea, y quedarte ahí.',
      inc: [['Estrategia y estructura', 'Qué decir, y en qué orden, pensando en tus clientes.'], ['Diseño en Figma', 'Un diseño que revisas y apruebas antes de programar.'], ['Desarrollo', 'Código rápido y limpio, sin plantillas pesadas.'], ['SEO + GEO', 'Datos estructurados y contenido claro, para que buscadores y asistentes de IA entiendan tu negocio.'], ['Formularios e integraciones', 'Formularios de contacto, WhatsApp y pagos con Stripe cuando los necesites.'], ['Hosting y cuidado', 'Plan anual opcional en Netlify: hosting, corrección de errores y pequeños cambios de datos.']],
      relH: 'Proyectos como el tuyo.', relNote: 'El mismo proceso de mis proyectos de producto aplica a cada sitio web: primero entender a tus clientes, luego diseñar y construir algo que entiendan desde el primer momento.', relLink: 'Ver mis proyectos',
      faqH: 'Preguntas sobre sitios web.',
      faqs: [
        ['¿Cuánto cuesta hacer una página web en México?', 'Cada sitio es distinto, por eso no publico precios: después de una llamada gratuita te mando una cotización a precio fijo con el alcance, los tiempos y todo lo que incluye. Así conoces la inversión completa antes de empezar.'],
        ['¿Quién me puede hacer una página web en Oaxaca?', 'Yo trabajo desde Oaxaca con negocios de todo México y de otros países. Diseño y programo tu sitio de principio a fin, y me quedo contigo después del lanzamiento con un plan de hosting y cuidado.'],
        ['¿Me puedes ayudar a que ChatGPT me recomiende?', 'Nadie puede prometer eso, y yo tampoco. Lo que sí hago es construir tu sitio para que buscadores y asistentes de IA puedan encontrarlo, leerlo y entender qué ofreces: contenido claro, datos estructurados, páginas rápidas y la configuración técnica correcta.'],
        ['¿Puedo actualizar el contenido por mi cuenta?', 'Los cambios pequeños de datos, como un teléfono o un horario, están incluidos en el plan de cuidado. Si quieres editar contenido seguido, lo platicamos en la llamada para encontrar la mejor opción para ti.'],
        ['¿Qué pasa si ya tengo un sitio web?', 'Puedo rediseñarlo o reconstruirlo. Empiezo revisando qué funciona y qué no, para quedarnos con lo que vale la pena.'],
        ['¿Cuánto tiempo tarda?', 'Una landing page toma de 3 a 7 días. Un sitio más grande depende del número de páginas, y te doy tiempos claros en la cotización.'],
      ],
      ctaH: '¿Quieres un sitio web que te traiga clientes?',
    },
  },
  webapp: {
    related: ['genogram', 'fleet'],
    en: {
      name: 'Web app design and development', title: 'Web App Design & Development for Businesses | Paola Bramlett',
      desc: 'Custom web apps for businesses: portals, memberships, bookings and dashboards. Designed and built by a senior product designer who codes. Fixed quote after a free call.',
      crumb: 'Web apps', h1: ['Web app design &amp; development', 'your clients and team will use.'],
      lead: 'A web app built around how your business actually works, from the first flow to working code, by one senior product designer who also codes. In English or Spanish.',
      cta: 'Get a fixed-price quote',
      facts: [['Timeline', 'Scoped on a free call'], ['Price', 'Fixed quote after a free call'], ['Includes', 'UX, UI, code, launch'], ['After launch', 'Care plan quoted per project']],
      whoH: 'Built around how you work.', whoLead: 'Portals, memberships, bookings and dashboards are examples of what a web app can be. On the free call we define what yours needs.',
      who: [['Businesses ready to digitize', 'Spreadsheets, WhatsApp threads and paper forms that should be one simple tool.'], ['Service businesses', 'A place where your clients book, pay, log in or follow their progress.'], ['Teams with a process', 'An internal dashboard that keeps everyone on the same page.']],
      incH: 'From the first flow to working code.',
      inc: [['Discovery &amp; flows', 'We map who uses the app and what they need to get done.'], ['UX/UI design', 'Screens designed as a system, reviewed and approved before any code.'], ['Prototype', 'A clickable prototype to test the idea before building it.'], ['Development', 'Working front-end, built with modern tools and AI-assisted development.'], ['Payments &amp; integrations', 'Stripe payments, email, forms and the tools you already use.'], ['Launch &amp; care', 'Launch on Netlify, with a care plan quoted per project.']],
      relH: 'Related work.', relNote: '', relLink: 'See all my work',
      faqH: 'Questions about web apps.',
      faqs: [
        ['How much does a web app cost?', 'It depends on what the app needs to do, so I quote each one at a fixed price after a free call. You’ll know the scope, the timeline and the full investment before we start.'],
        ['How long does a web app take?', 'We define the timeline together on the free call, because it depends on the features. The UX/UI design for an app usually takes 2–6 weeks.'],
        ['Can it take payments?', 'Yes. I integrate payments with Stripe when your app needs them.'],
        ['Do you also build the back end?', 'I design the whole product and build the front-end. If your app needs a more complex back end, I’ll tell you on the first call and plan the best way to handle it with you.'],
        ['Do I own the code?', 'Yes. Your code and domain are yours. If you ever want to move, I hand everything over.'],
      ],
      ctaH: 'Have a web app in mind?',
    },
    es: {
      name: 'Diseño y desarrollo de web apps', title: 'Diseño y desarrollo de web apps en México | Paola Bramlett',
      desc: 'Web apps a la medida para negocios: portales, membresías, reservas y dashboards. Diseñadas y programadas por una senior product designer desde Oaxaca, México. Cotización a precio fijo.',
      crumb: 'Web apps', h1: ['Diseño y desarrollo de web apps', 'que tus clientes y tu equipo sí usan.'],
      lead: 'Una web app hecha alrededor de cómo funciona tu negocio, del primer flujo al código funcionando, por una senior product designer que también programa. En español o inglés.',
      cta: 'Pide una cotización a precio fijo',
      facts: [['Tiempo', 'Se define en la llamada gratuita'], ['Precio', 'Cotización fija tras una llamada gratuita'], ['Incluye', 'UX, UI, código, lanzamiento'], ['Después del lanzamiento', 'Plan de cuidado cotizado por proyecto']],
      whoH: 'Hecha a la medida de cómo trabajas.', whoLead: 'Portales, membresías, reservas y dashboards son ejemplos de lo que puede ser una web app. En la llamada gratuita definimos lo que la tuya necesita.',
      who: [['Negocios listos para digitalizarse', 'Hojas de cálculo, chats de WhatsApp y formatos en papel que deberían ser una sola herramienta sencilla.'], ['Negocios de servicios', 'Un lugar donde tus clientes reservan, pagan, inician sesión o siguen su avance.'], ['Equipos con un proceso', 'Un dashboard interno para que todos estén en la misma página.']],
      incH: 'Del primer flujo al código funcionando.',
      inc: [['Descubrimiento y flujos', 'Mapeamos quién usa la app y qué necesita lograr.'], ['Diseño UX/UI', 'Pantallas diseñadas como sistema, revisadas y aprobadas antes de programar.'], ['Prototipo', 'Un prototipo navegable para probar la idea antes de construirla.'], ['Desarrollo', 'Front-end funcional, con herramientas modernas y desarrollo asistido por IA.'], ['Pagos e integraciones', 'Pagos con Stripe, correo, formularios y las herramientas que ya usas.'], ['Lanzamiento y cuidado', 'Lanzamiento en Netlify, con un plan de cuidado que se cotiza por proyecto.']],
      relH: 'Proyectos relacionados.', relNote: '', relLink: 'Ver todos mis proyectos',
      faqH: 'Preguntas sobre web apps.',
      faqs: [
        ['¿Cuánto cuesta desarrollar una web app en México?', 'Depende de lo que la app necesita hacer, por eso cotizo cada una a precio fijo después de una llamada gratuita. Conoces el alcance, los tiempos y la inversión completa antes de empezar.'],
        ['¿Cuánto tiempo tarda hacer una web app?', 'Definimos los tiempos juntos en la llamada gratuita, porque dependen de las funciones. El diseño UX/UI de una app normalmente toma de 2 a 6 semanas.'],
        ['¿Puede cobrar en línea?', 'Sí. Integro pagos con Stripe cuando tu app los necesita.'],
        ['¿También haces el back end?', 'Diseño todo el producto y construyo el front-end. Si tu app necesita un back end más complejo, te lo digo desde la primera llamada y planeamos juntos la mejor forma de resolverlo.'],
        ['¿El código es mío?', 'Sí. Tu código y tu dominio son tuyos. Si algún día quieres cambiarte, te entrego todo.'],
      ],
      ctaH: '¿Tienes una web app en mente?',
    },
  },
  firstapp: {
    related: ['kids', 'mindspace', 'exploretogether'],
    en: {
      name: 'First app and MVP design and development', title: 'First App & MVP Design and Development | Paola Bramlett',
      desc: 'Turn your idea into your first app. I help founders define the MVP, design it and build it, from the first sketch to launch. UX/UI in 2–6 weeks, fixed quote after a free call.',
      crumb: 'First app', h1: ['Your first app,', 'from idea to launch.'],
      lead: 'For founders and experts with an idea and no tech team. Together we define the MVP, the smallest version worth launching, then I design it and build it. One person from the first sketch to a live product, in English or Spanish.',
      cta: 'Get a fixed-price quote',
      facts: [['Timeline', 'UX/UI in 2–6 weeks'], ['Price', 'Fixed quote after a free call'], ['Includes', 'MVP scope, UX/UI, code, launch'], ['After launch', 'Care plan quoted per project']],
      whoH: 'For people with an idea worth building.', whoLead: '',
      who: [['First-time founders', 'You have the idea and the drive, and need someone to turn it into a real product.'], ['Domain experts', 'Therapists, coaches, operators: you know the problem better than anyone, and I turn it into software.'], ['Startups testing an idea', 'You want to launch something small, learn fast and grow from real users.']],
      incH: 'From the first sketch to launch.',
      inc: [['Define the MVP', 'What to build first and what can wait, so you launch sooner.'], ['User flows', 'How people move through your app, step by step.'], ['UX/UI design', 'Mobile and web screens you review before any code.'], ['Clickable prototype', 'Test the idea with real people before building it.'], ['Development', 'Working front-end, built with AI-assisted development.'], ['Launch &amp; care', 'Go live, with a care plan quoted per project to keep it running.']],
      relH: 'Apps I’ve designed.', relNote: '', relLink: 'See all my work',
      faqH: 'Questions about first apps.',
      faqs: [
        ['What do I need to create my first app?', 'An idea and the problem it solves. You don’t need a business plan, designs or technical knowledge. On the free call we figure out the rest together.'],
        ['How much does it cost to build my first app?', 'It depends on the scope of your MVP, so I quote it at a fixed price after a free call. You’ll know the full investment before we start.'],
        ['What is an MVP?', 'The smallest version of your app that solves the main problem for your first users. It lets you launch sooner, spend less and learn from real people.'],
        ['Mobile app or web app?', 'It depends on your users. Many first apps start as a web app that works great on phones, and become native apps later. We decide together on the call.'],
        ['How long does it take?', 'The UX/UI design of an app usually takes 2–6 weeks. Development time depends on the scope, and you’ll get a clear timeline in the quote.'],
      ],
      ctaH: 'Have an idea for your first app?',
    },
    es: {
      name: 'Diseño y desarrollo de tu primera app o MVP', title: 'Crea tu primera app o MVP | Paola Bramlett',
      desc: 'Convierte tu idea en tu primera app. Te ayudo a definir el MVP, diseñarlo y construirlo, del primer boceto al lanzamiento. UX/UI en 2–6 semanas, cotización fija tras una llamada gratuita.',
      crumb: 'Primera app', h1: ['Tu primera app,', 'de la idea al lanzamiento.'],
      lead: 'Para founders y expertos con una idea y sin equipo técnico. Juntos definimos el MVP, la versión más pequeña que vale la pena lanzar, y luego la diseño y la construyo. Una sola persona del primer boceto al producto en línea, en español o inglés.',
      cta: 'Pide una cotización a precio fijo',
      facts: [['Tiempo', 'UX/UI en 2–6 semanas'], ['Precio', 'Cotización fija tras una llamada gratuita'], ['Incluye', 'Alcance del MVP, UX/UI, código, lanzamiento'], ['Después del lanzamiento', 'Plan de cuidado cotizado por proyecto']],
      whoH: 'Para quien tiene una idea que vale la pena construir.', whoLead: '',
      who: [['Founders primerizos', 'Tienes la idea y las ganas, y necesitas a alguien que la convierta en un producto real.'], ['Expertos en su área', 'Terapeutas, coaches, gente de operaciones: conoces el problema mejor que nadie, y yo lo convierto en software.'], ['Startups probando una idea', 'Quieres lanzar algo pequeño, aprender rápido y crecer con usuarios reales.']],
      incH: 'Del primer boceto al lanzamiento.',
      inc: [['Definir el MVP', 'Qué construir primero y qué puede esperar, para lanzar antes.'], ['Flujos de usuario', 'Cómo se mueve la gente dentro de tu app, paso a paso.'], ['Diseño UX/UI', 'Pantallas móviles y web que revisas antes de programar.'], ['Prototipo navegable', 'Prueba la idea con personas reales antes de construirla.'], ['Desarrollo', 'Front-end funcional, con desarrollo asistido por IA.'], ['Lanzamiento y cuidado', 'Sal en línea, con un plan de cuidado que se cotiza por proyecto para mantenerla funcionando.']],
      relH: 'Apps que he diseñado.', relNote: '', relLink: 'Ver todos mis proyectos',
      faqH: 'Preguntas sobre tu primera app.',
      faqs: [
        ['¿Qué necesito para crear mi primera app?', 'Una idea y el problema que resuelve. No necesitas plan de negocios, diseños ni conocimientos técnicos. En la llamada gratuita resolvemos el resto juntos.'],
        ['¿Cuánto cuesta hacer una app en México?', 'Depende del alcance de tu MVP, por eso la cotizo a precio fijo después de una llamada gratuita. Conoces la inversión completa antes de empezar.'],
        ['¿Qué es un MVP?', 'La versión más pequeña de tu app que resuelve el problema principal de tus primeros usuarios. Te permite lanzar antes, gastar menos y aprender de personas reales.'],
        ['¿App móvil o web app?', 'Depende de tus usuarios. Muchas primeras apps empiezan como una web app que funciona muy bien en el teléfono, y después se vuelven apps nativas. Lo decidimos juntos en la llamada.'],
        ['¿Cuánto tiempo tarda?', 'El diseño UX/UI de una app normalmente toma de 2 a 6 semanas. El desarrollo depende del alcance, y te doy tiempos claros en la cotización.'],
      ],
      ctaH: '¿Tienes una idea para tu primera app?',
    },
  },
  finish: {
    related: null,
    en: {
      name: 'Finish your AI-built app', title: 'Finish Your Lovable or Bolt App | Paola Bramlett',
      desc: 'Started your app in Lovable, Bolt or another AI builder and got stuck? I audit what you built and move it to the technology it needs, free from those tools’ plans. You end up with a working product you own, ready to grow.',
      crumb: 'Finish your AI-built app', h1: ['Started with AI and got stuck?', 'I’ll take it to the finish line.'],
      lead: 'Lovable, Bolt and other AI builders are a great start. At some point, though, things break, every fix costs more credits and you depend on the tool’s plan. I audit what you built and move it to the technology your product really needs. Sometimes that means rebuilding parts of it, but you end up with a working product that is yours, independent and ready to grow.',
      cta: 'Finish my project',
      facts: [['Timeline', 'Defined after the audit'], ['Price', 'Fixed quote after a free call'], ['Includes', 'Audit, design, code, launch'], ['After launch', 'Care plan quoted per project']],
      whoH: 'Sound familiar?', whoLead: '',
      who: [['Stuck at 80%', 'It almost works, but the last details keep breaking.'], ['Tied to the tool', 'Every change costs credits, and you can’t grow without paying for a bigger plan.'], ['Ready to launch for real', 'You need a product that works, looks professional and can grow with your users.']],
      incH: 'From prototype to a product you own.',
      inc: [['Honest audit', 'I review what you built and tell you clearly what to keep, what to move and what to rebuild.'], ['The right technology', 'I move your product to a setup that fits what it needs, free from the AI builder’s plans and credits.'], ['Design cleanup', 'Consistent screens, clear flows and a look your users trust.'], ['Solid code', 'Clean, maintainable code. When rebuilding is the better option, I tell you why before we start.'], ['Payments &amp; integrations', 'Stripe, forms, email and the tools you need to go live.'], ['Launch &amp; care', 'A proper launch, with a care plan quoted per project.']],
      relH: 'How I work.', relNote: 'Every project follows the same clear process: a free call, a fixed-price quote, design and build with check-ins, and care after launch.', relLink: 'See how it works',
      faqH: 'Questions about finishing your app.',
      faqs: [
        ['I started my app in Lovable or Bolt, can you take it over?', 'Yes. Those tools are a great way to start. I audit what you built, keep what works and move your product to the technology it needs, so it no longer depends on the tool.'],
        ['Will you have to rebuild it?', 'Sometimes, partly or completely. It depends on how it was built and what your product needs to grow. I tell you after the audit, before you commit to anything.'],
        ['Will I still need my Lovable or Bolt plan?', 'No. The goal is a product that works on its own, free from those tools’ plans, with code and a domain that are yours.'],
        ['How much does it cost to finish my app?', 'It depends on what the audit finds. After a free call and the audit, I send you a fixed-price quote.'],
        ['How long does it take?', 'It depends on what’s left to build or rebuild. After the audit you get a clear timeline in the quote.'],
      ],
      ctaH: 'Ready to take your app to the finish line?',
    },
    es: {
      name: 'Termina tu app hecha con IA', title: 'Termina tu app hecha con Lovable o Bolt | Paola Bramlett',
      desc: '¿Empezaste tu app en Lovable, Bolt u otra herramienta de IA y te atoraste? Audito lo que construiste y lo paso a la tecnología que necesita, libre de los planes de esas herramientas. Terminas con un producto funcional, tuyo y listo para crecer.',
      crumb: 'Termina tu app hecha con IA', h1: ['¿Empezaste con IA y te atoraste?', 'Yo la llevo a la línea final.'],
      lead: 'Lovable, Bolt y otras herramientas de IA son un gran inicio. Pero en algún punto algo se rompe, cada arreglo cuesta más créditos y dependes del plan de la herramienta. Audito lo que construiste y lo paso a la tecnología que tu producto realmente necesita. A veces eso implica rehacer partes, pero al final tienes un producto funcional, tuyo, independiente y listo para crecer.',
      cta: 'Termina mi proyecto',
      facts: [['Tiempo', 'Se define después de la auditoría'], ['Precio', 'Cotización fija tras una llamada gratuita'], ['Incluye', 'Auditoría, diseño, código, lanzamiento'], ['Después del lanzamiento', 'Plan de cuidado cotizado por proyecto']],
      whoH: '¿Te suena familiar?', whoLead: '',
      who: [['Atorado en el 80%', 'Casi funciona, pero los últimos detalles se siguen rompiendo.'], ['Amarrado a la herramienta', 'Cada cambio cuesta créditos y no puedes crecer sin pagar un plan más grande.'], ['Listo para lanzar en serio', 'Necesitas un producto que funcione, se vea profesional y pueda crecer con tus usuarios.']],
      incH: 'De prototipo a un producto que es tuyo.',
      inc: [['Auditoría honesta', 'Reviso lo que construiste y te digo con claridad qué conservar, qué migrar y qué rehacer.'], ['La tecnología correcta', 'Paso tu producto a una base que se ajuste a lo que necesita, libre de los planes y créditos de la herramienta de IA.'], ['Limpieza de diseño', 'Pantallas consistentes, flujos claros y un aspecto que genera confianza.'], ['Código sólido', 'Código limpio y fácil de mantener. Cuando conviene rehacer, te explico por qué antes de empezar.'], ['Pagos e integraciones', 'Stripe, formularios, correo y las herramientas que necesitas para salir en línea.'], ['Lanzamiento y cuidado', 'Un lanzamiento bien hecho, con un plan de cuidado que se cotiza por proyecto.']],
      relH: 'Cómo trabajo.', relNote: 'Cada proyecto sigue el mismo proceso claro: llamada gratuita, cotización a precio fijo, diseño y desarrollo con revisiones, y cuidado después del lanzamiento.', relLink: 'Ver cómo trabajo',
      faqH: 'Preguntas sobre terminar tu app.',
      faqs: [
        ['Empecé mi app en Lovable o Bolt, ¿puedes continuarla?', 'Sí. Esas herramientas son una gran forma de empezar. Audito lo que construiste, conservo lo que funciona y paso tu producto a la tecnología que necesita, para que ya no dependa de la herramienta.'],
        ['¿Vas a tener que rehacerla?', 'A veces, en parte o completa. Depende de cómo se construyó y de lo que tu producto necesita para crecer. Te lo digo después de la auditoría, antes de que te comprometas a nada.'],
        ['¿Voy a seguir necesitando mi plan de Lovable o Bolt?', 'No. La meta es un producto que funcione por sí solo, libre de los planes de esas herramientas, con código y dominio que son tuyos.'],
        ['¿Cuánto cuesta terminar mi app?', 'Depende de lo que encuentre la auditoría. Después de una llamada gratuita y la auditoría, te mando una cotización a precio fijo.'],
        ['¿Cuánto tiempo tarda?', 'Depende de lo que falte por construir o rehacer. Después de la auditoría te doy tiempos claros en la cotización.'],
      ],
      ctaH: '¿Listo para llevar tu app a la línea final?',
    },
  },
};

/* ══ Renderers ═════════════════════════════════════════ */
function homePage(L) {
  const c = HOME[L];
  const u = UI[L];
  const url = SITE + ROUTES.home[L];
  const caseKeys = ['genogram', 'kids', 'fleet'];
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Paola Bramlett', inLanguage: ['en', 'es'], publisher: { '@id': `${SITE}/#paola` } },
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: c.title, inLanguage: L, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#business` } },
      PERSON, BUSINESS(L),
      { '@type': 'ItemList', '@id': `${url}#work`, name: L === 'es' ? 'Casos de estudio' : 'Selected case studies', itemListElement: caseKeys.map((k, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + CASES[k].url, name: CASES[k][L].title })) },
      faqLd(c.faqs, url),
    ],
  };
  const paths = c.paths.map(([k, label, title, desc, forV, time, alt], i) => `          <article class="path reveal" style="--d:${i * 80}">
            <div class="path__media">${img(`/img/mockups/hero-${k === 'webapp' ? 'web-app' : k === 'firstapp' ? 'first-app' : 'website'}`, alt, { sizes: '(max-width: 600px) 100vw, (max-width: 1040px) 38vw, 386px', priority: i === 0 })}</div>
            <div class="path__body">
              <p class="kicker">${label}</p>
              <h3><a href="${ROUTES[k][L]}">${title}</a></h3>
              <p>${desc}</p>
              <dl class="rows"><div><dt>${c.forL}</dt><dd>${forV}</dd></div><div><dt>${c.timeL}</dt><dd>${time}</dd></div></dl>
              <span class="link-arrow" aria-hidden="true">${u.learn} ${arrow}</span>
            </div>
          </article>`).join('\n');
  const mq = list => list.map(m => `<li>${m}</li><li class="star" aria-hidden="true">✦</li>`).join('');
  const steps = c.steps.map(([h, p, o]) => `            <li class="step"><h3>${h}</h3><p>${p}</p><p class="step__out">${o}</p></li>`).join('\n');
  const caseCards = caseKeys.map(k => {
    const cs = CASES[k], d = cs[L];
    const state = cs.live ? 'live' : 'dev';
    return `          <article class="case-card" data-stack-card>
            <div class="case-card__info">
              <h3><a href="${cs.url}">${d.title}</a></h3>
              <p class="case-card__desc">${d.desc}</p>
              <span class="case-card__spacer"></span>
              <dl class="spec">
                <div><dt>${u.role}</dt><dd>${d.role}</dd></div>
                <div><dt>${u.domain}</dt><dd>${d.domain}</dd></div>
                <div><dt>${u.status}</dt><dd class="state--${state}"><span class="dot dot--${state}" aria-hidden="true"></span>${d.status}</dd></div>
              </dl>
              <span class="case-card__cta" aria-hidden="true">${u.read}<span class="arrow-chip">→</span></span>
            </div>
            <figure class="case-card__art">${img(`/img/mockups/${cs.img}`, d.alt, { sizes: '(max-width: 900px) 100vw, 730px' })}<figcaption class="caption-pill">${u.nda}</figcaption></figure>
            <span class="case-card__dim" aria-hidden="true"></span>
          </article>`;
  }).join('\n');
  const why = c.why.map(([h, p], i) => `          <article class="card reveal" style="--d:${i * 60}"><span class="card__dot" aria-hidden="true"></span><h3>${h}</h3><p>${p}</p></article>`).join('\n');
  const rail = Object.entries(ARCHIVE).map(([k, a]) => `        <article class="rail-card">
          <div class="rail-card__media"><img src="${a.img}-800.webp" srcset="${a.img}-800.webp 800w, ${a.img}-1600.webp 1600w" sizes="(max-width: 500px) 82vw, 400px" alt="${attr(c.archAlt[k])}" width="800" height="487" loading="lazy" draggable="false" /></div>
          <div class="rail-card__body">
            <span class="rail-card__kicker">${c.arch[k]}</span>
            <h3><a href="${a.url}">${a[L][0]}</a></h3>
            <p>${a[L][1]}</p>
            <span class="link-arrow" aria-hidden="true">${u.read} ${arrow}</span>
          </div>
        </article>`).concat(c.lab.map(([kick, title, desc, href, color]) => `        <article class="rail-card">
          <div class="rail-card__media"><div class="rail-card__art" style="--a:${color}" aria-hidden="true">✦</div></div>
          <div class="rail-card__body">
            <span class="rail-card__kicker">${kick}</span>
            <h3><a href="${href}" target="_blank" rel="noopener">${title}</a></h3>
            <p>${desc}</p>
            <span class="link-arrow" aria-hidden="true">${c.tryIt} ↗</span>
          </div>
        </article>`)).join('\n');

  return `${head({ L, page: 'home', title: c.title, desc: c.desc, jsonld, preload: `\n  <link rel="preload" as="image" href="/img/mockups/hero-website-800.webp" imagesrcset="/img/mockups/hero-website-800.webp 800w, /img/mockups/hero-website-1536.webp 1536w" imagesizes="(max-width: 600px) 100vw, (max-width: 1040px) 38vw, 386px" />` })}
<body>
${nav(L, 'home')}

  <main id="main">
    <section class="hero" id="top" data-hero>
      <div class="grid-bg" aria-hidden="true"></div>
      ${AURORA(4)}
      <div class="wrap">
        <h1 class="hero__title rise">
          <span class="sr-only">${c.h1sr}</span>
${c.h1.map((t, i) => `          <span class="line" style="--i:${i}" aria-hidden="true"><span${i >= 2 ? ' class="gradient-text"' : ''}>${t}</span></span>`).join('\n')}
        </h1>
        <div class="hero__row">
          <p class="lead hero__lead reveal" style="--d:380">${c.lead}</p>
          <div class="hero__ctas reveal" style="--d:480">
            <a class="btn btn--primary" href="#contact">${c.cta}</a>
            ${waBtn('WhatsApp')}
          </div>
        </div>
        <div class="paths" id="services">
          <h2 class="sr-only">${u.services}</h2>
${paths}
        </div>
      </div>
    </section>

    <div class="marquee" data-marquee>
      <div class="marquee__track">
        <ul class="marquee__list">${mq(c.marquee)}</ul>
        <ul class="marquee__list" aria-hidden="true">${mq(c.marquee)}</ul>
      </div>
    </div>

    <section class="band band--pinned" data-words-host aria-label="${L === 'es' ? 'Termina tu app hecha con IA' : 'Finish your AI-built app'}">
      <div class="band__inner">
        <div class="wrap">
          <div class="band__row">
            <span class="band__bar" aria-hidden="true"><i data-words-bar></i></span>
            <p class="band__text" data-words data-accent="${c.bandAccent}">${c.band}</p>
          </div>
          <div class="band__cta">
            <a class="btn btn--primary" href="${ROUTES.finish[L]}">${c.bandCta}</a>
            <p>${c.bandSub}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section process process--pinned" id="how-it-works" aria-labelledby="how-title" data-process>
      <div class="process__sticky">
        <div class="wrap">
          <div class="section-head">
            <h2 class="h2 reveal" id="how-title">${c.howH}</h2>
            <p class="body-lg reveal" style="--d:120">${c.howLead}</p>
          </div>
          <div class="timeline" aria-hidden="true"><span class="timeline__track"><span class="timeline__fill" data-process-fill></span></span><span class="timeline__nodes"><i></i><i></i><i></i><i></i></span></div>
          <ol class="steps" data-process-steps>
${steps}
          </ol>
        </div>
      </div>
    </section>

    <section class="section" id="work" aria-labelledby="work-title">
      <div class="wrap">
        <div class="section-head">
          <h2 class="h2 h2--xl reveal" id="work-title">${c.workH}</h2>
          <p class="body-lg reveal" style="--d:120">${c.workLead}</p>
        </div>
        <ul class="chip-row work-chips reveal">${c.chips.map(x => `<li>${x}</li>`).join('')}<li class="is-you">${c.chipYou}</li></ul>
        <div class="stack">
${caseCards}
          <!-- Website case studies go here once they are live and approved by the client. -->
        </div>
      </div>
    </section>

    <section class="section section--alt" id="why" aria-labelledby="why-title">
      <div class="wrap">
        <h2 class="h2 reveal" id="why-title" style="margin-bottom:56px">${c.whyH}</h2>
        <div class="card-grid">
${why}
        </div>
      </div>
    </section>

    <section class="section" id="more-work" aria-labelledby="archive-title" data-rail-section>
      <div class="wrap">
        <div class="section-head">
          <h2 class="h2 h2--sm reveal" id="archive-title">${c.archH}</h2>
          <div class="rail-controls">
            <button class="rail-btn" type="button" data-rail-prev aria-label="${c.prev}"><span aria-hidden="true">←</span></button>
            <button class="rail-btn" type="button" data-rail-next aria-label="${c.next}"><span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>
      <div class="rail" tabindex="0" role="region" aria-label="${c.archLabel}" data-rail>
${rail}
      </div>
    </section>

    <section class="section section--alt" id="about" aria-labelledby="about-title">
      <div class="wrap about">
        <figure class="portrait reveal"><img src="/img/paola-bramlett.webp" alt="${attr(c.photoAlt)}" width="720" height="719" loading="lazy" /></figure>
        <div class="about__copy">
          <h2 class="h2 h2--md reveal" id="about-title">${c.aboutH}</h2>
${c.about.map((p, i) => `          <p class="reveal" style="--d:${100 + i * 40}">${p}</p>`).join('\n')}
          <dl class="facts reveal" style="--d:240">${c.facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
        </div>
      </div>
    </section>

    <section class="section" id="faq" aria-labelledby="faq-title">
      <div class="wrap faq-layout">
        <div class="faq-layout__side">
          <h2 class="h2 h2--sm reveal" id="faq-title">${c.faqH}</h2>
          <a class="link-accent link-arrow reveal" style="--d:100" href="#contact">${c.faqAsk} ${arrow}</a>
        </div>
        <div class="faq">
${faqList(c.faqs, 'faq')}
        </div>
      </div>
    </section>

    <section class="section section--alt contact" id="contact" aria-labelledby="contact-title">
      <span class="contact__glow" aria-hidden="true"></span>
      <div class="wrap contact__grid">
        <div class="contact__intro">
          <h2 class="h2 contact__title reveal" id="contact-title">${c.contactH}</h2>
          <p class="body-lg reveal" style="--d:100">${c.contactLead}</p>
          <div class="reveal" style="--d:160">${waBtn(c.waLong)}</div>
          <div class="contact__links reveal" style="--d:200">
            <a href="mailto:paolabramlett@gmail.com">paolabramlett@gmail.com <span>${c.emailL}</span></a>
            <a href="https://www.linkedin.com/in/paolabramlett" target="_blank" rel="me noopener">linkedin.com/in/paolabramlett <span>LinkedIn</span></a>
          </div>
        </div>
${form(L)}
      </div>
    </section>
  </main>

${footer(L)}
${foot}`;
}

function servicePage(key, L) {
  const s = SERVICES[key][L];
  const u = UI[L];
  const url = SITE + ROUTES[key][L];
  const homeHref = ROUTES.home[L];
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service', '@id': `${url}#service`, name: s.name, serviceType: s.name, url, description: s.desc, inLanguage: L,
        provider: { '@id': `${SITE}/#paola` }, brand: { '@id': `${SITE}/#business` },
        areaServed: ['Mexico', 'United States', 'Canada', 'Europe', 'Worldwide'], availableLanguage: ['English', 'Spanish'],
      },
      faqLd(s.faqs.map(([q, a]) => [q.replace(/&amp;/g, '&'), a]), url),
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: L === 'es' ? 'Inicio' : 'Home', item: SITE + homeHref },
          { '@type': 'ListItem', position: 2, name: u.services, item: `${SITE}${homeHref}#services` },
          { '@type': 'ListItem', position: 3, name: s.crumb, item: url },
        ],
      },
      PERSON,
    ],
  };
  const cards = (list, soft = true) => list.map(([h, p], i) => `          <article class="card${soft ? ' card--soft' : ''} reveal" style="--d:${i * 60}"><h3>${h}</h3><p>${p}</p></article>`).join('\n');
  const rel = SERVICES[key].related;
  let related;
  if (rel) {
    related = `        <div class="related">\n${rel.map((k, i) => {
      if (CASES[k]) {
        const cs = CASES[k];
        return `          <article class="related-card reveal" style="--d:${i * 60}"><figure class="related-card__media">${img(`/img/mockups/${cs.img}`, cs[L].alt, { sizes: '(max-width: 900px) 100vw, 390px' })}<figcaption class="caption-pill">${u.nda}</figcaption></figure><div class="related-card__body"><h3><a href="${cs.url}">${cs[L].title}</a></h3><span class="link-arrow" aria-hidden="true">${u.read} ${arrow}</span></div></article>`;
      }
      const a = ARCHIVE[k];
      return `          <article class="related-card reveal" style="--d:${i * 60}"><div class="related-card__media"><img src="${a.img}-800.webp" srcset="${a.img}-800.webp 800w, ${a.img}-1600.webp 1600w" sizes="(max-width: 900px) 100vw, 390px" alt="${attr(HOME[L].archAlt[k])}" width="800" height="487" loading="lazy" /></div><div class="related-card__body"><h3><a href="${a.url}">${a[L][0]}: ${a[L][1].replace(/\.$/, '')}</a></h3><span class="link-arrow" aria-hidden="true">${u.read} ${arrow}</span></div></article>`;
    }).join('\n')}\n        </div>\n        <p style="margin-top:24px"><a class="link-arrow" href="${homeHref}#work">${s.relLink} ${arrow}</a></p>`;
  } else {
    const target = key === 'finish' ? `${homeHref}#how-it-works` : `${homeHref}#work`;
    related = `        <!-- ${key === 'website' ? 'Website' : 'Finished AI-built app'} case studies go here once they are live and approved by the client. -->\n        <div class="related-note reveal"><p>${s.relNote}</p><a class="link-arrow" href="${target}">${s.relLink} ${arrow}</a></div>`;
  }

  return `${head({ L, page: key, title: s.title, desc: s.desc, jsonld })}
<body>
${nav(L, key)}

  <main id="main">
    <section class="sv-hero" data-hero>
      ${AURORA(3)}
      <div class="wrap">
        <nav class="crumbs reveal" aria-label="${L === 'es' ? 'Ruta' : 'Breadcrumb'}"><a href="${homeHref}">${L === 'es' ? 'Inicio' : 'Home'}</a><span class="sep" aria-hidden="true">/</span><a href="${homeHref}#services">${u.services}</a><span class="sep" aria-hidden="true">/</span><span aria-current="page">${s.crumb}</span></nav>
        <h1 class="rise"><span class="line" style="--i:0"><span>${s.h1[0]}</span></span> <span class="line" style="--i:1"><span class="gradient-text">${s.h1[1]}</span></span></h1>
        <p class="lead reveal" style="--d:300">${s.lead}</p>
        <div class="sv-hero__ctas reveal" style="--d:380">
          <a class="btn btn--primary" href="${homeHref}#contact">${s.cta}</a>
          ${waBtn('WhatsApp')}
        </div>
        <dl class="key-facts reveal" style="--d:440">${s.facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      </div>
    </section>

    <div class="wrap sv-body">
      <section class="sv-block" aria-labelledby="who-title">
        <h2 class="h2 h2--sm reveal" id="who-title">${s.whoH}</h2>${s.whoLead ? `\n        <p class="body-lg reveal">${s.whoLead}</p>` : ''}
        <div class="card-grid">
${cards(s.who)}
        </div>
      </section>
      <section class="sv-block" aria-labelledby="inc-title">
        <h2 class="h2 h2--sm reveal" id="inc-title">${s.incH}</h2>
        <div class="card-grid">
${cards(s.inc)}
        </div>
      </section>
      <section class="sv-block" aria-labelledby="rel-title">
        <h2 class="h2 h2--sm reveal" id="rel-title">${s.relH}</h2>
${related}
      </section>
      <section class="sv-block" id="faq" aria-labelledby="faq-title">
        <h2 class="h2 h2--sm reveal" id="faq-title">${s.faqH}</h2>
        <div class="faq">
${faqList(s.faqs, 'svc-faq')}
        </div>
      </section>
    </div>

    <section class="cta-band" aria-labelledby="cta-title">
      <div class="wrap">
        <h2 class="h2 reveal" id="cta-title">${s.ctaH}</h2>
        <p class="reveal" style="--d:80">${L === 'es' ? 'Llamada gratuita · cotización a precio fijo · respuesta en 24 horas' : 'Free call · fixed-price quote · reply within 24 hours'}</p>
        <div class="cta-band__ctas reveal" style="--d:140">
          <a class="btn btn--primary" href="${homeHref}#contact">${HOME[L].cta}</a>
          ${waBtn('WhatsApp')}
        </div>
      </div>
    </section>
  </main>

${footer(L)}
${foot}`;
}

/* ── Sync chrome into hand-edited pages ──────────────── */
function syncChrome(file) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  const swap = (name, block) => {
    const re = new RegExp(`  <!-- ${name} -->[\\s\\S]*?<!-- /${name} -->`);
    if (!re.test(html)) throw new Error(`${file}: missing ${name} markers`);
    html = html.replace(re, block.trimEnd());
  };
  swap('head:assets', HEAD_ASSETS);
  swap('chrome:nav', nav('toggle'));
  swap('chrome:footer', footer('toggle'));
  html = html.replace(/\/script\.js\?v=\d+/, `/script.js?v=${V}`);
  fs.writeFileSync(p, html);
}

/* ── Sitemap ─────────────────────────────────────────── */
function sitemap() {
  const alt = k => ['en', 'es'].map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${ROUTES[k][l]}" />`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${ROUTES[k].en}" />`;
  const entries = [];
  for (const k of Object.keys(ROUTES)) for (const l of ['en', 'es']) entries.push(`  <url>\n    <loc>${SITE}${ROUTES[k][l]}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n${alt(k)}\n  </url>`);
  for (const d of fs.readdirSync(path.join(ROOT, 'work')).sort()) entries.push(`  <url>\n    <loc>${SITE}/work/${d}/</loc>\n    <lastmod>${LASTMOD}</lastmod>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

/* ── Write ───────────────────────────────────────────── */
const write = (rel, html) => {
  const p = path.join(ROOT, rel.replace(/^\//, ''), rel.endsWith('/') ? 'index.html' : '');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
  console.log('wrote', path.relative(ROOT, p));
};
for (const L of ['en', 'es']) {
  write(ROUTES.home[L], homePage(L));
  for (const k of SERVICE_KEYS) write(ROUTES[k][L], servicePage(k, L));
}
for (const f of ['404.html', 'thanks/index.html', ...fs.readdirSync(path.join(ROOT, 'work')).map(d => `work/${d}/index.html`)]) {
  if (process.argv.includes('--no-sync')) break;
  syncChrome(f);
  console.log('synced', f);
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap());
console.log('wrote sitemap.xml');
