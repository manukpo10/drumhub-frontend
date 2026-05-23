// Home page — matches the DrumHub mock 1:1 (sections, featured, grid, ticker).
window.DH = window.DH || {};

DH.pages = DH.pages || {};

DH.pages.home = function () {
  var app = document.getElementById('app');
  DH.Router.setTitle('La biblioteca de grooves');
  var featured = DH.GROOVES.find(function (g) { return g.featured; }) || DH.GROOVES[0];
  var trending = DH.GROOVES.filter(function (g) { return g.id !== featured.id; }).slice(0, 6);
  var sideGrooves = DH.GROOVES.filter(function (g) { return g.id !== featured.id; }).slice(0, 3);
  var esc = DH.UI.escape;

  app.innerHTML = ''
    + '<section class="hero">'
    +   '<div class="hero-bg" id="hero-bg"></div>'
    +   '<div class="hero-grad"></div>'
    +   '<div class="hero-content">'
    +     '<div class="hero-eyebrow">La biblioteca de grooves para bateristas</div>'
    +     '<h1 class="hero-title">Encontrá<br><em>tu groove.</em><span>Explorá · Practicá · Compartí</span></h1>'
    +     '<p class="hero-sub">Miles de patrones organizados por <strong>género, tempo y dificultad</strong>. Escuchalos en el browser, practicá a tu ritmo, y subí los tuyos para que otros los descubran.</p>'
    +     '<div class="hero-actions">'
    +       '<button class="btn-primary" id="hero-explore">Explorar Grooves</button>'
    +       '<button class="btn-outline" id="hero-register">Crear cuenta gratis</button>'
    +     '</div>'
    +     '<div class="hero-stats">'
    +       '<div class="stat"><div class="stat-num">4<em>.</em>200</div><div class="stat-label">Grooves</div></div>'
    +       '<div class="stat"><div class="stat-num">830</div><div class="stat-label">Bateristas</div></div>'
    +       '<div class="stat"><div class="stat-num">18</div><div class="stat-label">Géneros</div></div>'
    +       '<div class="stat"><div class="stat-num">12<em>K</em></div><div class="stat-label">Reproducciones</div></div>'
    +     '</div>'
    +   '</div>'
    + '</section>'

    + '<div class="ticker"><div class="ticker-track" id="ticker-track"></div></div>'

    + '<div class="search-section">'
    +   '<div class="search-box">'
    +     '<form class="search-top" id="home-search-form">'
    +       '<div class="search-input-wrap">'
    +         '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +         '<input type="text" id="home-search-input" placeholder="ej: funk shuffle 100bpm, one drop reggae, metal double bass...">'
    +       '</div>'
    +       '<div class="search-divider"></div>'
    +       '<button class="btn-search" type="submit">Buscar</button>'
    +     '</form>'
    +     '<div class="search-filters">'
    +       '<div class="filter-group"><span class="filter-label">Género</span><div class="chips" id="home-genre-chips"></div></div>'
    +       '<div class="filter-group"><span class="filter-label">Nivel</span><div class="chips" id="home-level-chips"></div></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    + '<section class="section">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 01 ]</em> Pick of the week</div><div class="section-title">Groove <em>destacado</em></div></div></div>'
    +   '<div class="featured-wrap">'
    +     '<div class="featured-main">'
    +       '<div class="featured-badge">⭐ Groove de la semana</div>'
    +       '<div class="featured-title" id="feat-title">' + esc(featured.title) + '</div>'
    +       '<div class="featured-author">por <a href="#/profile/' + esc(featured.author) + '">' + esc(featured.author) + '</a></div>'
    +       '<div class="featured-tags">'
    +         '<span class="ftag">' + esc(featured.genre) + '</span>'
    +         '<span class="ftag">' + featured.bpm + ' BPM</span>'
    +         '<span class="ftag">' + esc(featured.level) + '</span>'
    +         '<span class="ftag">4/4</span>'
    +       '</div>'
    +       '<p class="featured-desc">' + esc(featured.desc) + '</p>'
    +       '<div class="featured-groove" id="featured-groove"></div>'
    +       '<div class="featured-actions">'
    +         '<button class="btn-sm btn-play-feat" id="feat-play">▶ Escuchar</button>'
    +         '<button class="btn-sm btn-save-feat" id="feat-save">♥ Guardar</button>'
    +         '<button class="btn-sm btn-share-feat" id="feat-share">↗ Compartir</button>'
    +       '</div>'
    +     '</div>'
    +     '<div class="featured-side" id="featured-side"></div>'
    +   '</div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 02 ]</em> Trending now</div><div class="section-title">Tendencia <em>esta semana</em></div></div><a class="section-link" data-go="/search?sort=likes">Ver todos</a></div>'
    +   '<div class="groove-grid" id="groove-grid"></div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 03 ]</em> By genre</div><div class="section-title">Explorar por <em>género</em></div></div><a class="section-link" data-go="/search">Ver todos</a></div>'
    +   '<div class="genre-grid" id="genre-grid"></div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 04 ]</em> Community chart</div><div class="section-title">Top <em>bateristas</em></div></div><a class="section-link" data-go="/search">Ver todos</a></div>'
    +   '<div class="drummers-rank" id="drummers-list"></div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 05 ]</em> Live feed</div><div class="section-title">Actividad <em>reciente</em></div></div></div>'
    +   '<div class="activity-feed" id="activity-feed"></div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 06 ]</em> Manual</div><div class="section-title">¿Cómo <em>funciona?</em></div></div></div>'
    +   '<div class="how-grid">'
    +     '<div class="how-card"><div class="how-num">01</div><div class="how-title">Buscá tu <em>groove</em></div><p class="how-desc">Filtrá por género, BPM o dificultad. Encontrá el patrón que querés practicar hoy.</p></div>'
    +     '<div class="how-card"><div class="how-num">02</div><div class="how-title"><em>Escuchalo</em> online</div><p class="how-desc">Reproducilo directo en el browser. Ajustá el BPM para practicar lento y subir la velocidad.</p></div>'
    +     '<div class="how-card"><div class="how-num">03</div><div class="how-title">Guardá tus <em>favoritos</em></div><p class="how-desc">Creá tu biblioteca personal. Organizá los grooves que estás trabajando.</p></div>'
    +     '<div class="how-card"><div class="how-num">04</div><div class="how-title">Subí los <em>tuyos</em></div><p class="how-desc">Compartí tus grooves con la comunidad. Ayudá a otros bateristas a crecer.</p></div>'
    +   '</div>'
    + '</section>'

    + '<section class="section" style="padding-top:0;">'
    +   '<div class="upload-cta">'
    +     '<div class="upload-cta-bg">SHARE<br>YOUR<br>GROOVE</div>'
    +     '<div>'
    +       '<div class="cta-eyebrow">¿Ya tenés cuenta?</div>'
    +       '<div class="cta-title">Tu groove puede<br>ayudar a <em>miles.</em></div>'
    +       '<p class="cta-desc">Subí tus patrones, construí tu perfil, y formá parte de la comunidad de bateristas más grande de habla hispana.</p>'
    +     '</div>'
    +     '<div class="upload-btns">'
    +       '<button class="btn-upload" id="cta-upload">+ Subir mi groove</button>'
    +       '<button class="btn-signup-cta" id="cta-register">Crear cuenta gratis</button>'
    +     '</div>'
    +   '</div>'
    + '</section>';

  // ── Hero BG ──
  DH.UI.heroBg(document.getElementById('hero-bg'));

  // ── Ticker ──
  var tt = document.getElementById('ticker-track');
  var items = DH.TICKER.concat(DH.TICKER);
  items.forEach(function (item) {
    var el = document.createElement('div'); el.className = 'ticker-item';
    el.innerHTML = '<div class="ticker-dot"></div>' + esc(item.text) + ' <em>' + esc(item.groove) + '</em>';
    tt.appendChild(el);
  });

  // ── Search chips ──
  var gcontainer = document.getElementById('home-genre-chips');
  ['Todos'].concat(DH.GENRES.map(function (g) { return g.name; }).slice(0, 6)).forEach(function (g, i) {
    var c = document.createElement('span');
    c.className = 'chip' + (i === 0 ? ' active' : '');
    c.textContent = g;
    c.addEventListener('click', function () {
      gcontainer.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
    });
    gcontainer.appendChild(c);
  });
  var lcontainer = document.getElementById('home-level-chips');
  ['Todos'].concat(DH.LEVELS).forEach(function (l, i) {
    var c = document.createElement('span');
    c.className = 'chip' + (i === 0 ? ' active2' : '');
    c.textContent = l;
    c.addEventListener('click', function () {
      lcontainer.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active2'); });
      c.classList.add('active2');
    });
    lcontainer.appendChild(c);
  });
  document.getElementById('home-search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = document.getElementById('home-search-input').value.trim();
    var genreEl = gcontainer.querySelector('.chip.active');
    var levelEl = lcontainer.querySelector('.chip.active2');
    var qs = [];
    if (q) qs.push('q=' + encodeURIComponent(q));
    if (genreEl && genreEl.textContent !== 'Todos') qs.push('genre=' + encodeURIComponent(genreEl.textContent));
    if (levelEl && levelEl.textContent !== 'Todos') qs.push('level=' + encodeURIComponent(levelEl.textContent));
    DH.Router.go('/search' + (qs.length ? '?' + qs.join('&') : ''));
  });

  // ── Featured groove visual rows ──
  var fg = document.getElementById('featured-groove');
  ['crash', 'hihat', 'snare', 'kick'].forEach(function (key) {
    var labels = { crash: 'Crash', hihat: 'Hi-Hat', snare: 'Redob.', kick: 'Bombo' };
    var arr = (featured.pattern && featured.pattern[key]) || new Array(16).fill(0);
    var row = document.createElement('div'); row.className = 'frow';
    var lbl = document.createElement('div'); lbl.className = 'frow-label'; lbl.textContent = labels[key];
    row.appendChild(lbl);
    arr.forEach(function (s) {
      var c = document.createElement('div');
      c.className = 'fcell' + (s ? ' on ' + key : '');
      row.appendChild(c);
    });
    fg.appendChild(row);
  });

  // ── Featured side ──
  var fs = document.getElementById('featured-side');
  sideGrooves.forEach(function (g) {
    var el = document.createElement('div'); el.className = 'side-card';
    el.innerHTML = ''
      + '<div class="side-genre">' + esc(g.genre) + '</div>'
      + '<div class="side-title">' + esc(g.title) + '</div>'
      + '<div class="side-meta">por ' + esc(g.author) + ' · ' + g.bpm + ' BPM</div>'
      + DH.UI.miniGrid(g.pattern)
      + '<div class="side-bottom"><div class="side-likes"><em>♥</em> ' + g.likes + '</div>'
      + '<button class="btn-play-sm"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button></div>';
    el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
    fs.appendChild(el);
  });

  // ── Featured actions ──
  document.getElementById('feat-title').addEventListener('click', function () { DH.Router.go('/groove/' + featured.slug); });
  document.getElementById('feat-play').addEventListener('click', function () { DH.Router.go('/groove/' + featured.slug); });
  var saveBtn = document.getElementById('feat-save');
  function refreshSave() { saveBtn.classList.toggle('saved', DH.Store.isFavorite(featured.id)); saveBtn.textContent = DH.Store.isFavorite(featured.id) ? '♥ Guardado' : '♥ Guardar'; }
  refreshSave();
  saveBtn.addEventListener('click', function () {
    if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
    DH.Store.toggleFavorite(featured.id); refreshSave();
  });
  document.getElementById('feat-share').addEventListener('click', function () {
    var url = location.origin + location.pathname + '#/groove/' + featured.slug;
    try { navigator.clipboard.writeText(url); alert('Link copiado: ' + url); }
    catch (e) { prompt('Link al groove:', url); }
  });

  // ── Trending grid ──
  var gg = document.getElementById('groove-grid');
  trending.forEach(function (g) { gg.appendChild(DH.UI.grooveCard(g)); });

  // ── Genres ──
  var genreHost = document.getElementById('genre-grid');
  DH.GENRES.forEach(function (g) {
    var info = (DH.GENRE_INFO && DH.GENRE_INFO[g.name]) || DH.DEFAULT_GENRE_INFO;
    var color = info.color || 'var(--text)';
    var svg = DH.genreIconSvg(g.name, { size: 40, color: color });
    var el = document.createElement('div'); el.className = 'genre-card';
    el.innerHTML = '<div class="genre-icon">' + svg + '</div><div class="genre-name">' + esc(g.name) + '</div><div class="genre-count">' + g.count + ' grooves</div>';
    el.addEventListener('click', function () {
      DH.Router.go('/genre/' + ((info && info.slug) || g.name.toLowerCase()));
    });
    genreHost.appendChild(el);
  });

  // ── Drummers (editorial ranking) ──
  var dl = document.getElementById('drummers-list');
  DH.DRUMMERS.slice(0, 8).forEach(function (d, i) {
    var rank = String(i + 1).padStart(2, '0');
    var el = document.createElement('div'); el.className = 'rank-row';
    el.innerHTML = ''
      + '<div class="rank-num">' + rank + '</div>'
      + '<div class="rank-avatar" style="background:' + d.color + '20;color:' + d.color + ';border-color:' + d.color + '">' + esc(d.init) + '</div>'
      + '<div class="rank-info">'
      +   '<div class="rank-name">' + esc(d.user) + '</div>'
      +   '<div class="rank-meta"><em>' + d.grooves + '</em> grooves · <em>' + d.likes + '</em> likes</div>'
      + '</div>'
      + '<div class="rank-bar"><div class="rank-bar-fill" style="width:' + Math.min(100, Math.round(d.likes / 1240 * 100)) + '%;background:' + d.color + '"></div></div>'
      + '<button class="btn-follow" type="button">+ Seguir</button>';
    el.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-follow')) { e.stopPropagation(); return; }
      DH.Router.go('/profile/' + d.user);
    });
    dl.appendChild(el);
  });

  // ── Activity ──
  var af = document.getElementById('activity-feed');
  DH.ACTIVITY.forEach(function (a) {
    var d = DH.UI.drummerOrFallback(a.user);
    var el = document.createElement('div'); el.className = 'activity-item';
    el.innerHTML = ''
      + '<div class="act-avatar" style="background:' + d.color + '20;color:' + d.color + '">' + esc(d.init) + '</div>'
      + '<div class="act-text"><strong>' + esc(a.user) + '</strong> ' + esc(a.action) + ' <a href="#/groove/' + esc(a.targetSlug) + '">' + esc(a.target) + '</a></div>'
      + '<div class="act-time">' + esc(a.time) + '</div>';
    af.appendChild(el);
  });

  // ── CTA wiring ──
  document.getElementById('hero-explore').addEventListener('click', function () { DH.Router.go('/search'); });
  document.getElementById('hero-register').addEventListener('click', function () { DH.UI.openModal('register'); });
  document.getElementById('cta-upload').addEventListener('click', function () {
    if (!DH.Store.isLoggedIn()) DH.UI.openModal('login'); else DH.Router.go('/upload');
  });
  document.getElementById('cta-register').addEventListener('click', function () { DH.UI.openModal('register'); });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function () { DH.Router.go(el.getAttribute('data-go')); });
  });
};
