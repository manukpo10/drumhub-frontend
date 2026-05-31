// Genres index page — /genres
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.genres = function () {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Géneros');

  // Real per-genre counts from the grooves already in memory (avoids depending on
  // backend grooveCount field, which may not be implemented yet).
  var countByGenre = {};
  (DH.GROOVES || []).forEach(function (g) {
    countByGenre[g.genre] = (countByGenre[g.genre] || 0) + 1;
  });
  var genres = (DH.GENRES || []).map(function (g) {
    return Object.assign({}, g, { count: countByGenre[g.name] || 0 });
  });
  var totalGrooves = (DH.GROOVES || []).length;

  // Pre-compute featured groove per genre (highest-likes real groove of that genre, if any)
  var featuredByGenre = {};
  (DH.GROOVES || []).forEach(function (g) {
    var prev = featuredByGenre[g.genre];
    if (!prev || (g.likes || 0) > (prev.likes || 0)) featuredByGenre[g.genre] = g;
  });

  app.innerHTML = ''
    + '<div class="genres-hero">'
    +   '<div class="genres-hero-bg" id="genres-hero-bg"></div>'
    +   '<div class="genres-hero-fade"></div>'
    +   '<div class="genres-hero-inner">'
    +     '<div class="breadcrumb"><a data-go="/">Inicio</a><span>/</span>Géneros</div>'
    +     '<div class="page-eyebrow">/ Directorio</div>'
    +     '<h1 class="genres-title">Explorá por <em>género</em></h1>'
    +     '<p class="genres-sub">Cada género tiene su sonido, sus técnicas y sus referentes. Elegí uno para ver patrones, bateristas y sub-géneros relacionados.</p>'
    +     '<div class="genres-stats">'
    +       '<div class="g-stat"><div class="g-stat-num">' + genres.length + '</div><div class="g-stat-label">Géneros</div></div>'
    +       '<div class="g-stat"><div class="g-stat-num" id="gstat-grooves">' + totalGrooves.toLocaleString('es-AR') + '</div><div class="g-stat-label">Grooves totales</div></div>'
    +       '<div class="g-stat"><div class="g-stat-num" id="gstat-users">' + (DH.DRUMMERS || []).length + '</div><div class="g-stat-label">Bateristas</div></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    + '<div class="page">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 01 ]</em> Todos los géneros</div><div class="section-title">Elegí <em>tu sonido</em></div></div></div>'
    +   '<div class="genres-index-grid" id="genres-index-grid"></div>'
    + '</div>';

  DH.UI.heroBg(document.getElementById('genres-hero-bg'));

  var grid = document.getElementById('genres-index-grid');
  genres.forEach(function (g, i) {
    var info = (DH.GENRE_INFO && DH.GENRE_INFO[g.name]) || DH.DEFAULT_GENRE_INFO;
    var color = info.color || 'var(--accent)';
    var slug = info.slug || g.name.toLowerCase();
    var featured = featuredByGenre[g.name];
    var topDrummer = (info.drummers && info.drummers[0]) || null;

    var el = document.createElement('div');
    el.className = 'genre-index-card';
    el.style.setProperty('--gx-color', color);
    el.innerHTML = ''
      + '<div class="gx-watermark">' + DH.genreIconSvg(g.name, { size: 200, color: color, strokeWidth: 1 }) + '</div>'
      + '<div class="gx-rank">' + String(i + 1).padStart(2, '0') + '</div>'
      + '<div class="gx-body">'
      +   '<div class="gx-genre-tag" style="color:' + color + '">' + esc(g.name) + '</div>'
      +   '<div class="gx-name">' + esc(g.name.toUpperCase()) + '</div>'
      +   '<div class="gx-count"><em>' + (g.count || 0).toLocaleString('es-AR') + '</em> grooves</div>'
      +   '<p class="gx-desc">' + esc((info.description || '').slice(0, 130) + ((info.description || '').length > 130 ? '…' : '')) + '</p>'
      +   '<div class="gx-meta">'
      +     '<span class="gx-meta-pill">' + info.bpmMin + '–' + info.bpmMax + ' BPM</span>'
      +     '<span class="gx-meta-pill">' + esc(info.level) + '</span>'
      +     (info.subgenres && info.subgenres.length ? '<span class="gx-meta-pill">' + info.subgenres.length + ' sub-géneros</span>' : '')
      +   '</div>'
      +   (featured ? '<div class="gx-featured">▸ Más popular: <strong>' + esc(featured.title) + '</strong> por ' + esc(featured.author) + '</div>' : '')
      +   (topDrummer ? '<div class="gx-drummer"><span class="gx-drummer-avatar" style="background:' + color + '20;color:' + color + ';border-color:' + color + '">' + esc(topDrummer.init) + '</span><span><strong>' + esc(topDrummer.name) + '</strong> · ' + esc(topDrummer.role) + '</span></div>' : '')
      + '</div>'
      + '<div class="gx-cta">Ver género <span>→</span></div>';
    el.addEventListener('click', function () { DH.Router.go('/genre/' + slug); });
    grid.appendChild(el);
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });

  // Fetch real totals from the backend (size:1 = minimal payload, we only need totalElements)
  Promise.all([
    DH.Api.getGrooves({ size: 1 }),
    DH.Api.getUsers({ size: 1 })
  ]).then(function (results) {
    var groovesPage = results[0];
    var usersPage   = results[1];
    var elG = document.getElementById('gstat-grooves');
    var elU = document.getElementById('gstat-users');
    if (elG && groovesPage && groovesPage.totalElements != null) {
      elG.textContent = Number(groovesPage.totalElements).toLocaleString('es-AR');
    }
    if (elU && usersPage && usersPage.totalElements != null) {
      elU.textContent = usersPage.totalElements;
    }
  }).catch(function () {});
};
