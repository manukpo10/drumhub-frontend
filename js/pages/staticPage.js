// Static pages template — /page/:slug
// Documentos largos (about, FAQ, terms, privacy, contact, contribute) renderizados desde un dict de markdown ligero.
window.DH = window.DH || {};
DH.pages = DH.pages || {};

// Web3Forms access key for the contact form. Get one free at https://web3forms.com
// (enter your email → they send the key). Safe to expose in the frontend: it only allows
// sending TO the configured inbox, it cannot read anything. Replace the placeholder below.
var WEB3FORMS_ACCESS_KEY = '7f6332be-2358-4b1e-8caf-201cd7aa3421';

DH.STATIC_PAGES = {
  about: {
    title: 'Sobre DrumHub',
    eyebrow: 'Quiénes somos',
    blocks: [
      { type: 'p', text: 'DrumHub es la biblioteca de grooves para bateristas de habla hispana. Nació como un proyecto para que los bateristas tengamos un lugar donde compartir, escuchar y practicar patrones sin tener que volver a YouTube cada vez.' },
      { type: 'h', text: 'Por qué existe' },
      { type: 'p', text: 'Aprender batería es difícil porque el conocimiento está disperso: tutoriales en video, transcripciones en PDF, grabaciones en SoundCloud. Cada formato tiene su fricción. DrumHub junta todo en un solo lugar — el patrón se ve como grilla, se reproduce en el browser y se puede modificar.' },
      { type: 'h', text: 'Cómo se construye' },
      { type: 'p', text: 'La plataforma se nutre de la comunidad. Los bateristas suben sus grooves, los etiquetan por género, dificultad y BPM, y otros los descubren, escuchan, guardan y aprenden. Sin paywalls, sin algoritmos opacos.' },
      { type: 'h', text: 'Más que on/off' },
      { type: 'p', text: 'A diferencia de otros step sequencers web, DrumHub soporta notación real: ghost notes (notas fantasma, muy suaves y apagadas) y flams (gracia note + golpe principal) en todos los kits. Esos matices son los que separan un patrón mecánico de un groove que realmente suena a batería.' },
      { type: 'h', text: 'Quién está detrás' },
      { type: 'p', text: 'Un baterista que se cansó de no encontrar grooves en formato decente y decidió construir la herramienta que le hubiera gustado tener. Es un proyecto independiente, hecho con cuidado para la comunidad. ¿Querés sumarte? Escribinos desde la página de contacto.' }
    ]
  },
  faq: {
    title: 'Preguntas frecuentes',
    eyebrow: 'FAQ',
    blocks: [
      { type: 'q', q: '¿Es gratis?', a: 'Lo esencial sí: explorar, escuchar, guardar favoritos, comentar y subir tus propios grooves no cuesta nada. Las exportaciones avanzadas (MIDI, PDF y MP3) son parte del plan Pro; el plan Estudio agrega API y grooves privados.' },
      { type: 'q', q: '¿Necesito crear cuenta?', a: 'Solo si querés guardar favoritos, comentar o subir tus propios grooves. Para escuchar y explorar, no.' },
      { type: 'q', q: '¿Qué kits de batería puedo usar?', a: 'Cuatro kits incluidos: Pearl Master Studio (acústico), TR-909 Detroit, LinnDrum LM-2 y CR-78. Se cambian desde el selector en el player. Todos los kits incluyen ghost notes y flam.' },
      { type: 'q', q: '¿Qué son las ghost notes y el flam?', a: 'Las ghost notes son golpes muy suaves y apagados en el redoblante — esas notas casi inaudibles que le dan swing y textura a un groove. El flam es un rudimento clásico: una gracia note muy suave justo antes del golpe principal, que le da un ataque más gordo y expresivo. Ambas técnicas están disponibles como filas independientes en todos los kits, para que puedas notarlas y escucharlas con precisión.' },
      { type: 'q', q: '¿Qué géneros hay?', a: 'Rock, funk, jazz, metal, latin, reggae, blues, pop, soul, R&B, hip-hop, bossa y los más nuevos: trap y rap, fuertes en la escena urbana argentina. La lista crece con la comunidad.' },
      { type: 'q', q: '¿Cómo subo mi primer groove?', a: 'Click en "+ Subir" en el nav. Vas al editor, armás el patrón en la grilla de 16 pasos, ponele título, género, BPM y dificultad, y publicás.' },
      { type: 'q', q: '¿Puedo editar un groove después de subirlo?', a: 'Sí. Entrá al groove y, si sos el autor, vas a ver "Editar groove" en el sidebar. Como tus grooves viven en tu cuenta, podés editarlos desde cualquier navegador o dispositivo.' },
      { type: 'q', q: '¿Mis grooves se sincronizan entre dispositivos?', a: 'Sí. Si iniciás sesión, tus grooves, favoritos, likes y perfil se guardan en el servidor y los tenés disponibles en cualquier navegador o dispositivo donde entres con tu cuenta.' },
      { type: 'q', q: '¿Me entero si alguien interactúa con mis grooves?', a: 'Sí. Te llega una notificación cuando alguien le da like o comenta uno de tus grooves, o cuando alguien empieza a seguirte. Las ves en la campanita del nav.' },
      { type: 'q', q: '¿Qué pasa si encuentro un bug?', a: 'Abrí un issue en GitHub o mandanos un mail desde la página de contacto. Respondemos rápido.' }
    ]
  },
  terms: {
    title: 'Términos y condiciones',
    eyebrow: 'Legal',
    blocks: [
      { type: 'p', text: 'Última actualización: 23 de mayo de 2026.' },
      { type: 'h', text: '1. Uso de la plataforma' },
      { type: 'p', text: 'DrumHub se ofrece "tal cual es", sin garantía de disponibilidad. Podés usarla para uso personal o educativo sin restricciones.' },
      { type: 'h', text: '2. Contenido subido por usuarios' },
      { type: 'p', text: 'Vos sos responsable del contenido que subís. Al publicar un groove le otorgás a DrumHub una licencia no exclusiva para mostrarlo en la plataforma. Mantenés todos los derechos.' },
      { type: 'h', text: '3. Conducta' },
      { type: 'p', text: 'No spam, no acoso, no contenido ofensivo. Reservamos el derecho a moderar comentarios y suspender cuentas que violen estas normas.' },
      { type: 'h', text: '4. Samples de audio' },
      { type: 'p', text: 'Los samples de Pearl Master Studio son CC-BY 3.0 by enoe. Los kits de drum machines (TR-909, LM-2, CR-78) son Public Domain. Si vas a redistribuir grabaciones que generaste con DrumHub, atribuí donde corresponda.' }
    ]
  },
  privacy: {
    title: 'Política de privacidad',
    eyebrow: 'Privacidad',
    blocks: [
      { type: 'p', text: 'DrumHub respeta tu privacidad. Esta versión no envía datos a ningún servidor — todo lo que guardás (sesión, favoritos, grooves subidos, comentarios, kit seleccionado) vive en el localStorage de tu navegador.' },
      { type: 'h', text: 'Datos que almacenamos localmente' },
      { type: 'p', text: 'Usuario y email del registro · Avatar elegido · Lista de favoritos · Grooves que subiste · Comentarios que dejaste · Preferencias (kit seleccionado, vista de búsqueda).' },
      { type: 'h', text: 'Cookies' },
      { type: 'p', text: 'No usamos cookies de tracking. Tampoco analytics de terceros.' },
      { type: 'h', text: 'Servicios externos' },
      { type: 'p', text: 'Cargamos Google Fonts (Bebas Neue, Barlow, DM Mono) y DiceBear API para generar avatares. Ambos servicios pueden registrar tu IP cuando se cargan sus recursos.' }
    ]
  },
  contact: {
    title: 'Contacto',
    eyebrow: 'Hablanos',
    blocks: [
      { type: 'p', text: 'Si tenés feedback, encontraste un bug, querés colaborar o solo querés saludar, escribinos desde acá. Te respondemos en 1-2 días.' },
      { type: 'contactForm' },
      { type: 'h', text: 'O por mail directo' },
      { type: 'links', items: [
        { label: 'manuu.robles@gmail.com', href: 'mailto:manuu.robles@gmail.com' }
      ] },
      { type: 'p', text: 'Para reportes de bug, lo más útil es contarnos qué navegador usás y qué pasos seguiste. Si podés, sumá un screenshot.' }
    ]
  },
  contribute: {
    title: 'Contribuir',
    eyebrow: 'Sumate',
    blocks: [
      { type: 'p', text: 'DrumHub es open source. Hay varias formas de ayudar a que crezca.' },
      { type: 'h', text: 'Para bateristas' },
      { type: 'p', text: 'Subí tus grooves. Comentá los de otros. Compartí la plataforma con bateristas que conozcas. Cuanto más contenido, mejor para todos.' },
      { type: 'h', text: 'Para desarrolladores' },
      { type: 'p', text: 'Si sos dev y querés sumarte, escribinos por mail y coordinamos. Por ahora el repositorio es privado y las contribuciones son por invitación.' },
      { type: 'h', text: 'Para diseñadores' },
      { type: 'p', text: 'Si tenés ideas visuales o querés mejorar el sistema de diseño, mandanos un mail con tus mockups. Toda mano sirve.' },
      { type: 'h', text: 'Donaciones' },
      { type: 'p', text: 'Si DrumHub te sirve y querés bancar el proyecto, podés invitarnos un cafecito o transferir por Mercado Pago. Cada aporte ayuda a mantener los servidores y seguir sumando features.' },
      { type: 'links', items: [
        { label: '☕ Donar por Cafecito', href: 'https://cafecito.app/drumhub' }
      ] },
      { type: 'p', text: 'Mercado Pago — alias: manu.bata.it' }
    ]
  }
};

DH.pages.staticPage = function (params) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  var page = DH.STATIC_PAGES[params.slug];
  if (page) DH.Router.setTitle(page.title);
  if (!page) {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Página no encontrada</h4><p>El recurso que buscás no existe.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
    return;
  }

  var bodyHtml = page.blocks.map(function (b) {
    if (b.type === 'h') return '<h3 class="sp-h">' + esc(b.text) + '</h3>';
    if (b.type === 'p') return '<p class="sp-p">' + esc(b.text) + '</p>';
    if (b.type === 'q') return '<div class="sp-q"><div class="sp-q-title">' + esc(b.q) + '</div><div class="sp-q-body">' + esc(b.a) + '</div></div>';
    if (b.type === 'ul') return '<ul class="sp-ul">' + b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    if (b.type === 'links') return '<ul class="sp-ul sp-links">' + b.items.map(function (i) {
      var external = i.href.indexOf('http') === 0;
      return '<li><a href="' + esc(i.href) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(i.label) + '</a></li>';
    }).join('') + '</ul>';
    if (b.type === 'contactForm') return ''
      + '<form class="contact-form" id="contact-form">'
      +   '<div class="cf-head">'
      +     '<div class="cf-head-title">Mandanos un <em>mensaje</em></div>'
      +     '<div class="cf-head-hint">Respondemos en 1-2 días</div>'
      +   '</div>'
      +   '<div class="cf-deco">' + DH.UI.miniGrid({ hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick: [1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0] }, 'cf-deco-grid') + '</div>'
      +   '<input type="hidden" name="access_key" value="' + esc(WEB3FORMS_ACCESS_KEY) + '">'
      +   '<div class="cf-grid">'
      +     '<div class="cf-field"><label class="cf-label">Nombre</label><input class="cf-input" type="text" name="name" placeholder="Tu nombre" required></div>'
      +     '<div class="cf-field"><label class="cf-label">Email</label><input class="cf-input" type="email" name="email" placeholder="tu@email.com" required></div>'
      +   '</div>'
      +   '<div class="cf-field"><label class="cf-label">Asunto <span class="cf-opt">opcional</span></label><input class="cf-input" type="text" name="subject" placeholder="¿De qué se trata?"></div>'
      +   '<div class="cf-field"><label class="cf-label">Mensaje</label><textarea class="cf-input cf-textarea" name="message" rows="5" placeholder="Contanos qué encontraste, qué proponés o en qué querés ayudar..." required></textarea></div>'
      +   '<button class="cf-submit" type="submit" id="cf-submit"><span class="cf-submit-label">Enviar mensaje</span><svg class="cf-submit-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>'
      +   '<div class="cf-status" id="cf-status"></div>'
      + '</form>';
    return '';
  }).join('');

  app.innerHTML = ''
    + '<div class="static-page">'
    +   '<div class="static-hero-bg" id="static-hero-bg"></div>'
    +   '<div class="breadcrumb"><a data-go="/">Inicio</a><span>/</span>' + esc(page.title) + '</div>'
    +   '<div class="page-eyebrow">/ ' + esc(page.eyebrow) + '</div>'
    +   '<h1 class="static-title">' + esc(page.title) + '</h1>'
    +   '<div class="static-body">' + bodyHtml + '</div>'
    + '</div>';

  // Branded sequencer background behind the header — same identity as every other page hero.
  var staticBg = document.getElementById('static-hero-bg');
  if (staticBg && DH.UI && DH.UI.heroBg) DH.UI.heroBg(staticBg);

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });

  // ── Contact form (Web3Forms) ── posts to the service, which forwards to the configured inbox.
  var cf = document.getElementById('contact-form');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var statusEl = document.getElementById('cf-status');
      var btn = document.getElementById('cf-submit');
      var label = btn.querySelector('.cf-submit-label');
      var key = cf.querySelector('[name=access_key]').value;
      if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        statusEl.className = 'cf-status err';
        statusEl.textContent = 'El formulario todavía no está configurado. Escribinos por mail mientras tanto.';
        return;
      }
      var payload = {
        access_key: key,
        from_name: 'DrumHub — Contacto',
        subject: cf.querySelector('[name=subject]').value || 'Mensaje desde DrumHub',
        name: cf.querySelector('[name=name]').value,
        email: cf.querySelector('[name=email]').value,
        message: cf.querySelector('[name=message]').value
      };
      btn.disabled = true;
      btn.classList.add('loading');
      if (label) label.textContent = 'Enviando...';
      statusEl.className = 'cf-status';
      statusEl.textContent = '';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.success) {
          cf.reset();
          statusEl.className = 'cf-status ok';
          statusEl.textContent = '¡Mensaje enviado! Te respondemos en 1-2 días.';
        } else {
          statusEl.className = 'cf-status err';
          statusEl.textContent = 'Hubo un problema al enviar. Probá de nuevo o escribinos por mail.';
        }
      }).catch(function () {
        statusEl.className = 'cf-status err';
        statusEl.textContent = 'No se pudo enviar. Revisá tu conexión o escribinos por mail.';
      }).then(function () {
        btn.disabled = false;
        btn.classList.remove('loading');
        if (label) label.textContent = 'Enviar mensaje';
      });
    });
  }
};
