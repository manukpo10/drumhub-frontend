// Static pages template — /page/:slug
// Documentos largos (about, FAQ, terms, privacy, contact, contribute) renderizados desde un dict de markdown ligero.
window.DH = window.DH || {};
DH.pages = DH.pages || {};

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
      { type: 'h', text: 'Quién está detrás' },
      { type: 'p', text: 'Un baterista que se cansó de no encontrar grooves en formato decente. El proyecto es open source y el código vive en GitHub.' }
    ]
  },
  faq: {
    title: 'Preguntas frecuentes',
    eyebrow: 'FAQ',
    blocks: [
      { type: 'q', q: '¿Es gratis?', a: 'Sí. Sin paywalls, sin trials, sin premium. La idea es que la comunidad tenga una herramienta libre.' },
      { type: 'q', q: '¿Necesito crear cuenta?', a: 'Solo si querés guardar favoritos, comentar o subir tus propios grooves. Para escuchar y explorar, no.' },
      { type: 'q', q: '¿Qué kits de batería puedo usar?', a: 'Cuatro kits incluidos por default: Pearl Master Studio (acústico), TR-909 Detroit, LinnDrum LM-2 y CR-78. Se cambian desde el selector en el player.' },
      { type: 'q', q: '¿Cómo subo mi primer groove?', a: 'Click en "+ Subir" en el nav. Vas al editor, armás el patrón en la grilla de 16 pasos, ponele título, género, BPM y dificultad, y publicás.' },
      { type: 'q', q: '¿Puedo editar un groove después de subirlo?', a: 'Sí. Entrá al groove, en el sidebar vas a ver "Editar groove" si sos el autor.' },
      { type: 'q', q: '¿Mis grooves se sincronizan entre dispositivos?', a: 'No todavía — esta versión usa localStorage del navegador. Estamos trabajando en un backend para sumar sincronización real.' },
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
      { type: 'p', text: 'Si tenés feedback, encontraste un bug, querés colaborar o solo querés saludar, te escuchamos.' },
      { type: 'h', text: 'Canales' },
      { type: 'ul', items: [
        'Email: hola@drumhub.local (mock)',
        'GitHub: github.com/drumhub/drumhub (mock)',
        'Instagram: @drumhub.app (mock)',
        'YouTube: youtube.com/@drumhub (mock)'
      ] },
      { type: 'p', text: 'Para reportes de bug, lo más útil es un screenshot + el navegador que usás + qué pasos seguiste. Te respondemos en 1-2 días.' }
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
      { type: 'p', text: 'El código vive en GitHub. Aceptamos pull requests para bugs, features nuevas, traducciones, mejoras de accesibilidad. Mirá el archivo CONTRIBUTING para empezar.' },
      { type: 'h', text: 'Para diseñadores' },
      { type: 'p', text: 'Si tenés ideas visuales o querés mejorar el sistema de diseño, abrí un issue con mockups. Toda mano sirve.' },
      { type: 'h', text: 'Donaciones' },
      { type: 'p', text: 'El proyecto se autofinancia. Si querés invitarnos un café, no lo aceptamos — pero compartí DrumHub con otro baterista y eso vale doble.' }
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
    return '';
  }).join('');

  app.innerHTML = ''
    + '<div class="static-page">'
    +   '<div class="breadcrumb"><a data-go="/">Inicio</a><span>/</span>' + esc(page.title) + '</div>'
    +   '<div class="page-eyebrow">/ ' + esc(page.eyebrow) + '</div>'
    +   '<h1 class="static-title">' + esc(page.title) + '</h1>'
    +   '<div class="static-body">' + bodyHtml + '</div>'
    + '</div>';

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
