// Home page — matches the DrumHub mock 1:1 (sections, featured, grid, ticker).
window.DH = window.DH || {};

DH.pages = DH.pages || {};

DH.pages.home = function () {
  var app = document.getElementById('app');
  DH.Router.setTitle('La biblioteca de grooves');
  // Rank all grooves by real likes. NOTE: likes are a cumulative count with no per-like
  // timestamp, so "de la semana" is most-liked overall (we can't filter a real 7-day window).
  var byLikes = DH.GROOVES.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
  var featured = byLikes[0] || DH.GROOVES[0];          // Groove de la semana = el más likeado
  var sideGrooves = byLikes.slice(1, 4);               // los 3 que le siguen (a la derecha)
  var trending = byLikes.slice(4, 10);                 // tendencia: continúa después del bloque destacado (sin repetir)
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
    +       '<div class="stat"><div class="stat-num" id="hs-grooves">' + (DH.GROOVES || []).length + '</div><div class="stat-label">Grooves</div></div>'
    +       '<div class="stat"><div class="stat-num" id="hs-users">' + (DH.DRUMMERS || []).length + '</div><div class="stat-label">Bateristas</div></div>'
    +       '<div class="stat"><div class="stat-num" id="hs-genres">' + (DH.GENRES || []).length + '</div><div class="stat-label">Géneros</div></div>'
    +       '<div class="stat"><div class="stat-num" id="hs-plays">—</div><div class="stat-label">Reproducciones</div></div>'
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
    +   '<div class="featured-main">'
    +     '<div class="featured-badge">⭐ Groove de la semana</div>'
    +     '<div class="featured-title" id="feat-title">' + esc(featured.title) + '</div>'
    +     '<div class="featured-author">por <a href="#/profile/' + esc(featured.author) + '">' + esc(featured.author) + '</a></div>'
    +     '<div class="featured-tags">'
    +       '<span class="ftag">' + esc(featured.genre) + '</span>'
    +       '<span class="ftag">' + featured.bpm + ' BPM</span>'
    +       '<span class="ftag">' + esc(featured.level) + '</span>'
    +       '<span class="ftag">4/4</span>'
    +     '</div>'
    +     '<p class="featured-desc">' + esc(featured.desc) + '</p>'
    +     '<div id="feat-player-host"></div>'
    +     '<div class="featured-actions">'
    +       '<button class="btn-sm btn-play-feat" id="feat-play">▶ Escuchar</button>'
    +       '<button class="btn-sm btn-save-feat" id="feat-save">♥ Guardar</button>'
    +       '<button class="btn-sm btn-share-feat" id="feat-share">↗ Compartir</button>'
    +       '<a class="btn-sm" data-go="/groove/' + esc(featured.slug) + '" style="text-decoration:none;cursor:pointer">Ver más →</a>'
    +     '</div>'
    +   '</div>'
    +   '<div class="featured-runners" id="featured-runners"></div>'
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

    + '<section class="section plans-section" id="plans-section">'
    +   '<div class="section-head"><div><div class="section-eyebrow"><em>[ 07 ]</em> Planes</div><div class="section-title">Elegí tu <em>plan.</em></div></div></div>'
    +   '<div class="plans-toggle-wrap">'
    +     '<span class="plans-period-label" id="plans-lbl-monthly">Mensual</span>'
    +     '<button class="plans-toggle" id="plans-toggle" aria-pressed="false">'
    +       '<span class="plans-toggle-thumb"></span>'
    +     '</button>'
    +     '<span class="plans-period-label" id="plans-lbl-annual">Anual</span>'
    +     '<span class="plans-save-badge visible" id="plans-save-badge">Ahorrás 19% pagando anual</span>'
    +   '</div>'
    +   '<div class="plans-grid">'

    +     '<div class="plan-card free">'
    +       '<div class="plan-name">Gratis</div>'
    +       '<div class="plan-price-wrap">'
    +         '<div class="plan-price">$0</div>'
    +         '<div class="plan-period">para siempre</div>'
    +       '</div>'
    +       '<div class="plan-desc">Para empezar a explorar y practicar.</div>'
    +       '<ul class="plan-features">'
    +         '<li class="plan-feature">Explorar y escuchar grooves ilimitado</li>'
    +         '<li class="plan-feature">Guardar hasta 20 favoritos</li>'
    +         '<li class="plan-feature">Subir hasta 5 grooves</li>'
    +         '<li class="plan-feature">Exportar JSON</li>'
    +         '<li class="plan-feature excluded">Badge de perfil</li>'
    +         '<li class="plan-feature excluded">Exportar MIDI, PDF y MP3</li>'
    +         '<li class="plan-feature excluded">Estadísticas de grooves</li>'
    +         '<li class="plan-feature excluded">API pública</li>'
    +       '</ul>'
    +       '<button class="plan-btn" id="plan-btn-free">Crear cuenta gratis</button>'
    +     '</div>'

    +     '<div class="plan-card pro">'
    +       '<div class="plan-popular">MÁS POPULAR</div>'
    +       '<div class="plan-name">Pro</div>'
    +       '<div class="plan-price-wrap">'
    +         '<div class="plan-price-old" id="plan-price-old-pro"></div>'
    +         '<div class="plan-price" id="plan-price-pro">USD 5</div>'
    +         '<div class="plan-period" id="plan-period-pro">/ mes</div>'
    +       '</div>'
    +       '<div class="plan-price-ref" id="plan-price-ref-pro"></div>'
    +       '<div class="plan-desc">Para bateristas que practican en serio.</div>'
    +       '<ul class="plan-features">'
    +         '<li class="plan-feature">Todo lo del plan Gratis</li>'
    +         '<li class="plan-feature">Grooves ilimitados</li>'
    +         '<li class="plan-feature">Favoritos ilimitados</li>'
    +         '<li class="plan-feature">Exportar MIDI, PDF y MP3</li>'
    +         '<li class="plan-feature">Estadísticas de tus grooves</li>'
    +         '<li class="plan-feature">Badge PRO en el perfil</li>'
    +         '<li class="plan-feature excluded">API pública</li>'
    +         '<li class="plan-feature excluded">Grooves privados</li>'
    +       '</ul>'
    +       '<button class="plan-btn pro" id="plan-btn-pro">Empezar prueba gratis</button>'
    +     '</div>'

    +     '<div class="plan-card studio coming-soon">'
    +       '<div class="plan-coming-badge">Próximamente</div>'
    +       '<div class="plan-name">Estudio</div>'
    +       '<div class="plan-price-wrap">'
    +         '<div class="plan-price-old" id="plan-price-old-studio"></div>'
    +         '<div class="plan-price" id="plan-price-studio">USD 12</div>'
    +         '<div class="plan-period" id="plan-period-studio">/ mes</div>'
    +       '</div>'
    +       '<div class="plan-price-ref" id="plan-price-ref-studio"></div>'
    +       '<div class="plan-desc">Para estudios, docentes y profesionales.</div>'
    +       '<ul class="plan-features">'
    +         '<li class="plan-feature">Todo lo del plan Pro</li>'
    +         '<li class="plan-feature">Acceso a API pública</li>'
    +         '<li class="plan-feature">Grooves privados</li>'
    +         '<li class="plan-feature">Soporte prioritario</li>'
    +         '<li class="plan-feature">Badge ESTUDIO en el perfil</li>'
    +         '<li class="plan-feature">Hasta 5 cuentas colaboradoras</li>'
    +       '</ul>'
    +       '<button class="plan-btn studio" id="plan-btn-studio">Contactar</button>'
    +     '</div>'

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

  // ── Plans toggle ──
  var plansAnnual = false;
  var toggle = document.getElementById('plans-toggle');
  var saveBadge = document.getElementById('plans-save-badge');
  var lblMonthly = document.getElementById('plans-lbl-monthly');
  var lblAnnual = document.getElementById('plans-lbl-annual');
  function applyPrices() {
    var period = plansAnnual ? 'annual' : 'monthly';

    var proCard    = DH.Pricing.getCard('pro', period);
    var studioCard = DH.Pricing.getCard('studio', period);

    function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val || ''; }

    set('plan-price-pro',     proCard.main);
    set('plan-period-pro',    proCard.period);
    set('plan-price-old-pro', proCard.old);
    set('plan-price-ref-pro', proCard.ref);

    set('plan-price-studio',     studioCard.main);
    set('plan-period-studio',    studioCard.period);
    set('plan-price-old-studio', studioCard.old);
    set('plan-price-ref-studio', studioCard.ref);

    // Toggle UI
    toggle.classList.toggle('on', plansAnnual);
    toggle.setAttribute('aria-pressed', String(plansAnnual));
    saveBadge.textContent = plansAnnual ? 'Ahorrando 19%' : 'Ahorrás 19% pagando anual';
    if (lblMonthly) lblMonthly.classList.toggle('active', !plansAnnual);
    if (lblAnnual)  lblAnnual.classList.toggle('active',   plansAnnual);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      plansAnnual = !plansAnnual;
      applyPrices();
    });
  }

  // Show USD immediately as placeholder, then update when rates load
  applyPrices();
  DH.Pricing.onReady(applyPrices);
  DH.Pricing.load();
  var planBtnFree = document.getElementById('plan-btn-free');
  var planBtnPro  = document.getElementById('plan-btn-pro');
  var planBtnStudio = document.getElementById('plan-btn-studio');
  if (planBtnFree)   planBtnFree.addEventListener('click',   function () { DH.UI.openModal('register'); });
  if (planBtnPro)    planBtnPro.addEventListener('click',    function () { DH.UI.openModal('register'); });
  if (planBtnStudio) planBtnStudio.addEventListener('click', function () { alert('Escribinos a hola@drumhub.com'); });

  // ── Hero BG ──
  DH.UI.heroBg(document.getElementById('hero-bg'));

  // ── Ticker ── real recent uploads (newest grooves from the backend), not hardcoded.
  var tt = document.getElementById('ticker-track');
  var tickerSource = (DH.GROOVES || []).slice().sort(function (a, b) {
    return (b.createdAt || 0) - (a.createdAt || 0);
  }).slice(0, 10).map(function (g) {
    return { text: g.author + ' subió', groove: g.title };
  });
  // Fallback to mock only if there are no real grooves yet (empty backend).
  if (!tickerSource.length) tickerSource = DH.TICKER;
  // Duplicate the list so the marquee loops seamlessly.
  tickerSource.concat(tickerSource).forEach(function (item) {
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

  // ── Featured groove player ──
  var featPlayer = null;
  var featPlayBtn = document.getElementById('feat-play');
  if (DH.createPlayer && featured.pattern) {
    featPlayer = DH.createPlayer({
      container: document.getElementById('feat-player-host'),
      pattern: featured.pattern,
      bpm: featured.bpm,
      editable: false,
      chrome: 'minimal',
      idPrefix: 'feat',
      onPlayStateChange: function (playing) {
        featPlayBtn.textContent = playing ? '■ Detener' : '▶ Escuchar';
        featPlayBtn.classList.toggle('on', playing);
      }
    });
    DH.Router.setPlayer(featPlayer);
  }

  // ── Runners-up (2nd–4th) as full social cards, same as the trending grid ──
  var fr = document.getElementById('featured-runners');
  sideGrooves.forEach(function (g) { fr.appendChild(DH.UI.grooveCard(g)); });

  // ── Featured actions ──
  document.getElementById('feat-title').addEventListener('click', function () { DH.Router.go('/groove/' + featured.slug); });
  featPlayBtn.addEventListener('click', function () {
    if (featPlayer) { featPlayer.toggle(); }
    else { DH.Router.go('/groove/' + featured.slug); }
  });
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

  // ── Drummers (real stats computed from loaded grooves) ──
  var dl = document.getElementById('drummers-list');
  var homeStatsMap = {};
  (DH.GROOVES || []).forEach(function (g) {
    if (!homeStatsMap[g.author]) homeStatsMap[g.author] = { grooves: 0, likes: 0 };
    homeStatsMap[g.author].grooves++;
    homeStatsMap[g.author].likes += (g.likes || 0);
  });
  var withStats = (DH.DRUMMERS || []).map(function (d) {
    var s = homeStatsMap[d.user] || { grooves: 0, likes: 0 };
    return Object.assign({}, d, { grooves: s.grooves, likes: s.likes });
  });
  // Combined ranking score: 70% popularity (likes) + 30% activity (grooves count),
  // each normalized 0..1 so the very different scales (likes in thousands, grooves single-digit)
  // are comparable. A drummer who is both prolific and liked rises; a single-hit one doesn't dominate.
  var maxL = withStats.reduce(function (m, d) { return Math.max(m, d.likes || 0); }, 0) || 1;
  var maxG = withStats.reduce(function (m, d) { return Math.max(m, d.grooves || 0); }, 0) || 1;
  withStats.forEach(function (d) {
    d.score = 0.7 * ((d.likes || 0) / maxL) + 0.3 * ((d.grooves || 0) / maxG);
  });
  var rankedDrummers = withStats.sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  var maxScore = rankedDrummers.length ? (rankedDrummers[0].score || 1) : 1;
  rankedDrummers.forEach(function (d, i) {
    var rank = String(i + 1).padStart(2, '0');
    var el = document.createElement('div'); el.className = 'rank-row';
    el.innerHTML = ''
      + '<div class="rank-num">' + rank + '</div>'
      + '<div class="rank-avatar" style="background:' + d.color + '20;color:' + d.color + ';border-color:' + d.color + '">' + esc(d.init) + '</div>'
      + '<div class="rank-info">'
      +   '<div class="rank-name">' + esc(d.user) + '</div>'
      +   '<div class="rank-meta"><em>' + d.grooves + '</em> grooves · <em>' + d.likes + '</em> likes</div>'
      + '</div>'
      + '<div class="rank-bar"><div class="rank-bar-fill" style="width:' + Math.round((d.score || 0) / maxScore * 100) + '%;background:' + d.color + '"></div></div>'
      + '<button class="btn-follow" type="button">+ Seguir</button>';
    el.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-follow')) { e.stopPropagation(); return; }
      DH.Router.go('/profile/' + d.user);
    });
    dl.appendChild(el);
  });

  // ── Activity feed — fetched from /api/activity/feed ──
  var af = document.getElementById('activity-feed');

  function homeRelTime(ms) {
    var diff = Date.now() - ms, min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora mismo';
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var d = Math.floor(h / 24);
    return 'hace ' + d + (d === 1 ? ' día' : ' días');
  }

  // Icon + text per event type
  var ACT_TYPE = {
    upload:  { icon: '↑', label: 'subió' },
    comment: { icon: '💬', label: 'comentó en' },
    like:    { icon: '♥', label: 'marcó como favorito' },
    follow:  { icon: '→', label: 'empezó a seguir a' }
  };

  function renderActivityItems(events) {
    af.innerHTML = '';
    if (!events || !events.length) return;
    events.forEach(function (ev) {
      var meta = ACT_TYPE[ev.type] || ACT_TYPE.upload;
      var d = DH.UI.drummerOrFallback(ev.actor);
      var timeStr = ev.createdAt ? homeRelTime(new Date(ev.createdAt).getTime()) : '';

      var actionHtml;
      if (ev.type === 'follow') {
        actionHtml = '<a class="act-actor" href="/profile/' + esc(ev.actor) + '">' + esc(ev.actor) + '</a> '
          + meta.label + ' <a href="/profile/' + esc(ev.targetUser) + '">@' + esc(ev.targetUser) + '</a>';
      } else {
        actionHtml = '<a class="act-actor" href="/profile/' + esc(ev.actor) + '">' + esc(ev.actor) + '</a> '
          + meta.label + ' <a href="/groove/' + esc(ev.grooveSlug) + '">' + esc(ev.grooveTitle) + '</a>';
      }

      var el = document.createElement('div'); el.className = 'activity-item';
      el.innerHTML = ''
        + '<div class="act-avatar" style="background:' + d.color + '20;color:' + d.color + '">'
        +   esc(d.init)
        + '</div>'
        + '<div class="act-text">' + actionHtml + '</div>'
        + (timeStr ? '<div class="act-time">' + timeStr + '</div>' : '');
      af.appendChild(el);
    });
  }

  // Seed with local groove uploads for instant render (no network wait)
  var seedGrooves = (DH.GROOVES || [])
    .filter(function (g) { return g.createdAt; })
    .slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, 8);
  renderActivityItems(seedGrooves.map(function (g) {
    return { type: 'upload', actor: g.author, grooveSlug: g.slug, grooveTitle: g.title, createdAt: g.createdAt };
  }));

  // Replace with real mixed feed from the API (public endpoint, no auth needed)
  fetch('https://drumhub-backend.onrender.com/api/activity/feed?size=20')
    .then(function (r) { return r.json(); })
    .then(function (json) {
      var events = (json && json.data) || [];
      if (events.length) renderActivityItems(events);
    })
    .catch(function () {});

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

  // Fetch real totals and update hero stats.
  // Grooves are fetched in full (size:1000) so we can sum REAL plays across ALL grooves,
  // not just the ~50 loaded at boot. Users only need the count (size:1 → totalElements).
  Promise.all([
    DH.Api.getGrooves({ size: 1000 }),
    DH.Api.getUsers({ size: 1 })
  ]).then(function (results) {
    var groovesPage = results[0];
    var usersPage   = results[1];

    var elG = document.getElementById('hs-grooves');
    var elU = document.getElementById('hs-users');
    var elP = document.getElementById('hs-plays');

    if (elG && groovesPage && groovesPage.totalElements != null) {
      var total = groovesPage.totalElements;
      // Format: 1234 → "1.234", 12000 → "12K"
      elG.textContent = total >= 1000
        ? (total / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
        : total.toLocaleString('es-AR');
    }
    if (elU && usersPage && usersPage.totalElements != null) {
      elU.textContent = usersPage.totalElements;
    }
    // Total plays: sum the REAL plays from every groove returned by the backend.
    if (elP) {
      var allGrooves = (groovesPage && groovesPage.content) || [];
      var totalPlays = allGrooves.reduce(function (a, g) { return a + (g.plays || 0); }, 0);
      elP.innerHTML = totalPlays >= 1000
        ? (totalPlays / 1000).toFixed(1).replace(/\.0$/, '') + '<em>K</em>'
        : String(totalPlays);
    }
  }).catch(function () {});
};
