// Drummers index page — /drummers
// Lista la comunidad de bateristas con filtros por género + búsqueda + orden.
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.drummers = function (_params, query) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Bateristas');

  var state = {
    q: query.q || '',
    genre: query.genre || '',
    sort: query.sort || 'grooves'  // grooves | likes | name
  };

  // Working list — starts as mock data for instant render, replaced with real API data
  var drummersList = DH.DRUMMERS.slice();

  // Which usernames the current user already follows. Filled async; until then buttons
  // stay at their default "+ Seguir" and get corrected once the fetch resolves.
  var myFollowing = null;
  function applyFollowStates() {
    if (!myFollowing) return;
    app.querySelectorAll('[data-follow]').forEach(function (b) {
      var following = myFollowing.indexOf(b.getAttribute('data-follow')) !== -1;
      b.classList.toggle('following', following);
      b.textContent = following ? '✓ Siguiendo' : '+ Seguir';
    });
  }
  if (DH.Store.isLoggedIn()) {
    DH.Api.getFollowing(DH.Store.getUser().user).then(function (page) {
      myFollowing = ((page && page.content) || []).map(function (fu) { return fu.username; });
      applyFollowStates();
    }).catch(function () { myFollowing = []; });
  }

  // Calcula géneros que toca cada baterista basado en sus grooves
  function genresOf(user) {
    var seen = {};
    DH.GROOVES.forEach(function (g) {
      if (g.author === user) seen[g.genre] = (seen[g.genre] || 0) + 1;
    });
    return Object.keys(seen).map(function (k) { return { name: k, count: seen[k] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function syncUrl() {
    var params = [];
    if (state.q) params.push('q=' + encodeURIComponent(state.q));
    if (state.genre) params.push('genre=' + encodeURIComponent(state.genre));
    if (state.sort && state.sort !== 'grooves') params.push('sort=' + encodeURIComponent(state.sort));
    var qs = params.length ? '?' + params.join('&') : '';
    var newHash = '#/drummers' + qs;
    if (location.hash !== newHash) history.replaceState(null, '', newHash);
  }

  var totalGrooves = drummersList.reduce(function (a, d) { return a + (d.grooves || 0); }, 0);
  var totalLikes = drummersList.reduce(function (a, d) { return a + (d.likes || 0); }, 0);

  app.innerHTML = ''
    + '<div class="drummers-hero">'
    +   '<div class="drummers-hero-bg" id="drummers-hero-bg"></div>'
    +   '<div class="drummers-hero-fade"></div>'
    +   '<div class="drummers-hero-inner">'
    +     '<div class="breadcrumb"><a data-go="/">Inicio</a><span>/</span>Bateristas</div>'
    +     '<div class="page-eyebrow">/ Comunidad</div>'
    +     '<h1 class="drummers-title">La <em>comunidad</em></h1>'
    +     '<p class="drummers-sub">Bateristas que comparten sus grooves con la plataforma. Filtrá por género o buscá por nombre para encontrar a quién seguir.</p>'
    +     '<div class="drummers-stats">'
    +       '<div class="g-stat"><div class="g-stat-num" id="dh-stat-count">—</div><div class="g-stat-label">Bateristas</div></div>'
    +       '<div class="g-stat"><div class="g-stat-num" id="dh-stat-grooves">—</div><div class="g-stat-label">Grooves subidos</div></div>'
    +       '<div class="g-stat"><div class="g-stat-num" id="dh-stat-likes">—</div><div class="g-stat-label">Likes totales</div></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    + '<div class="search-filters-v2">'
    +   '<form class="search-top" id="d-form" style="background:var(--surface);border:1px solid var(--border);border-radius:4px;">'
    +     '<div class="search-input-wrap">'
    +       '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +       '<input type="text" id="d-q" placeholder="Buscar baterista por nombre o usuario..." value="' + esc(state.q) + '">'
    +     '</div>'
    +     '<div class="search-divider"></div>'
    +     '<button class="btn-search" type="submit">Buscar</button>'
    +   '</form>'
    +   '<div class="filter-row">'
    +     '<div class="filter-row-label">Género</div>'
    +     '<div class="chips chips-scroll" id="d-genre"></div>'
    +   '</div>'
    +   '<div class="filter-row filter-row-multi">'
    +     '<div class="filter-block">'
    +       '<div class="filter-row-label">Orden</div>'
    +       '<select id="d-sort" class="filter-select">'
    +         '<option value="grooves"' + (state.sort === 'grooves' ? ' selected' : '') + '>Más grooves</option>'
    +         '<option value="likes"' + (state.sort === 'likes' ? ' selected' : '') + '>Más likes</option>'
    +         '<option value="name"' + (state.sort === 'name' ? ' selected' : '') + '>Alfabético</option>'
    +       '</select>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    + '<div class="search-main">'
    +   '<div class="col-results">'
    +     '<div class="featured-banner" id="featured-banner"></div>'
    +     '<div class="results-toolbar">'
    +       '<div class="results-toolbar-left" id="d-count"></div>'
    +     '</div>'
    +     '<div class="drummers-index-grid" id="drummers-grid"></div>'
    +   '</div>'

    +   '<div class="col-search-sidebar">'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Baterista <em>destacado</em></div>'
    +       '<div id="featured-drummer"></div>'
    +     '</div>'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Géneros <em>cubiertos</em></div>'
    +       '<div class="popular-genres" id="d-genre-stats"></div>'
    +     '</div>'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Subidas <em>recientes</em></div>'
    +       '<div class="activity-list-v2" id="d-activity"></div>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  DH.UI.heroBg(document.getElementById('drummers-hero-bg'));
  buildFeaturedBanner();

  function buildFeaturedBanner() {
    var banner = document.getElementById('featured-banner');
    if (!banner) return;
    // Construyo 4 slides con criterios distintos
    var byLikes = drummersList.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    var byGrooves = drummersList.slice().sort(function (a, b) { return (b.grooves || 0) - (a.grooves || 0); });
    var slides = [
      { tag: '🏆 Top del mes',       drummer: byLikes[0],      hint: 'El baterista más likeado de la comunidad' },
      { tag: '🔥 Más activo',         drummer: byGrooves[0],    hint: 'Quien más grooves subió últimamente' },
      { tag: '🆕 Recién unido',       drummer: drummersList[drummersList.length - 1], hint: 'Acaba de sumarse a la plataforma' },
      { tag: '🎓 Para principiantes', drummer: byGrooves[2] || byLikes[2], hint: 'Sube grooves accesibles para arrancar' }
    ].filter(function (s) { return !!s.drummer; });

    banner.innerHTML = ''
      + '<div class="fb-slides" id="fb-slides">'
      + slides.map(function (s, idx) {
          var d = s.drummer;
          var top = DH.GROOVES.filter(function (g) { return g.author === d.user; })
            .sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];
          return '<div class="fb-slide' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '" style="--fb-color:' + d.color + '">'
            + '<div class="fb-tag">' + s.tag + '</div>'
            + '<div class="fb-body">'
            +   DH.UI.drummerAvatar(d, { size: 96, color: d.color, ring: 3 })
            +   '<div class="fb-info">'
            +     '<div class="fb-name">' + esc(d.name || d.user) + '</div>'
            +     '<div class="fb-handle">@' + esc(d.user) + '</div>'
            +     '<div class="fb-hint">' + esc(s.hint) + '</div>'
            +     '<div class="fb-stats">'
            +       '<span><em>' + (d.grooves || 0) + '</em> grooves</span>'
            +       '<span><em>' + (d.likes || 0) + '</em> likes</span>'
            +       (top ? '<span>▸ ' + esc(top.title) + '</span>' : '')
            +     '</div>'
            +   '</div>'
            +   '<button class="fb-cta" data-go="/profile/' + esc(d.user) + '">Ver perfil →</button>'
            + '</div>'
            + '</div>';
        }).join('')
      + '</div>'
      + '<div class="fb-dots" id="fb-dots">'
      + slides.map(function (_, idx) { return '<button class="fb-dot' + (idx === 0 ? ' active' : '') + '" data-go-slide="' + idx + '" aria-label="Slide ' + (idx + 1) + '"></button>'; }).join('')
      + '</div>';

    var current = 0;
    var dots = banner.querySelectorAll('.fb-dot');
    var slidesEls = banner.querySelectorAll('.fb-slide');
    var autoTimer = null;

    function goTo(idx) {
      current = (idx + slides.length) % slides.length;
      slidesEls.forEach(function (s, i) { s.classList.toggle('active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }
    function autoplay() {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(function () { goTo(current + 1); autoplay(); }, 5000);
    }
    // Expongo el cleanup vía DH.Router.setPlayer (que el router invoca con destroy en cada nav)
    DH.Router.setPlayer({ destroy: function () { clearTimeout(autoTimer); } });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-go-slide'), 10);
        goTo(idx); autoplay();
      });
    });
    banner.addEventListener('mouseenter', function () { clearTimeout(autoTimer); });
    banner.addEventListener('mouseleave', autoplay);
    banner.querySelectorAll('[data-go]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); DH.Router.go(btn.getAttribute('data-go')); });
    });
    autoplay();
  }

  var genreHost = document.getElementById('d-genre');

  // ── Genre chips ──
  function renderGenreChips() {
    genreHost.innerHTML = '';
    ['Todos'].concat(DH.GENRES_LIST).forEach(function (g) {
      var c = document.createElement('span');
      c.className = 'chip' + ((state.genre || 'Todos') === g ? ' active' : '');
      var cnt;
      if (g === 'Todos') cnt = drummersList.length;
      else cnt = drummersList.filter(function (d) { return genresOf(d.user).some(function (x) { return x.name === g; }); }).length;
      c.innerHTML = esc(g) + ' <span class="chip-count">' + cnt + '</span>';
      c.addEventListener('click', function () {
        state.genre = g === 'Todos' ? '' : g;
        render();
      });
      genreHost.appendChild(c);
    });
  }

  document.getElementById('d-form').addEventListener('submit', function (e) {
    e.preventDefault();
    state.q = document.getElementById('d-q').value.trim();
    render();
  });
  document.getElementById('d-sort').addEventListener('change', function (e) {
    state.sort = e.target.value;
    render();
  });

  function render() {
    syncUrl();
    var q = state.q.toLowerCase();
    var results = drummersList.filter(function (d) {
      if (state.genre && !genresOf(d.user).some(function (x) { return x.name === state.genre; })) return false;
      if (q) {
        var hay = (d.user + ' ' + d.name + ' ' + (d.bio || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (state.sort === 'likes')      results.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    else if (state.sort === 'name')  results.sort(function (a, b) { return a.user.localeCompare(b.user); });
    else                              results.sort(function (a, b) { return (b.grooves || 0) - (a.grooves || 0); });

    document.getElementById('d-count').innerHTML = '<em>' + results.length + '</em> ' + (results.length === 1 ? 'baterista' : 'bateristas');
    renderGenreChips();

    var grid = document.getElementById('drummers-grid');
    grid.innerHTML = '';
    if (!results.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;"><h4>Sin resultados</h4><p>Probá quitar el filtro o cambiar la búsqueda.</p></div>';
    } else {
      results.forEach(function (d, i) {
        var topGenres = genresOf(d.user).slice(0, 3);
        var isTop = (d.grooves || 0) >= 25;
        var rank = String(i + 1).padStart(2, '0');
        // Top groove del baterista (el de más likes que subió)
        var topGroove = DH.GROOVES.filter(function (g) { return g.author === d.user; })
          .sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];

        var el = document.createElement('div');
        el.className = 'drummer-index-card';
        el.style.setProperty('--dx-color', d.color);
        el.innerHTML = ''
          + '<div class="dx-rank">' + rank + '</div>'
          + DH.UI.drummerAvatar(d, { size: 64, color: d.color, ring: 2 })
          + '<div class="dx-body">'
          +   '<div class="dx-head">'
          +     '<div>'
          +       '<div class="dx-name">' + esc(d.name || d.user) + '</div>'
          +       '<div class="dx-handle">@' + esc(d.user) + (d.location ? ' · ' + esc(d.location) : '') + '</div>'
          +     '</div>'
          +     '<div class="dx-badges">'
          +       (isTop ? '<span class="badge top">⭐ Top</span>' : '')
          +     '</div>'
          +   '</div>'
          +   (d.bio ? '<p class="dx-bio">' + esc(d.bio) + '</p>' : '')
          +   (topGroove
              ? '<div class="dx-top-groove" data-go="/groove/' + esc(topGroove.slug) + '">'
                + '<div class="dx-top-label">▸ <strong>' + esc(topGroove.title) + '</strong> · ' + topGroove.bpm + ' BPM</div>'
                + DH.UI.miniGrid(topGroove.pattern, 'dx-mini')
                + '</div>'
              : '')
          +   '<div class="dx-footer">'
          +     '<div class="dx-genres">' + topGenres.map(function (g) {
                  var color = (DH.GENRE_INFO[g.name] && DH.GENRE_INFO[g.name].color) || 'var(--muted)';
                  return '<span class="dx-genre-pill" style="color:' + color + ';border-color:' + color + '40">' + esc(g.name) + ' · ' + g.count + '</span>';
                }).join('') + '</div>'
          +     '<div class="dx-stats">'
          +       '<div class="dx-stat"><em>' + (d.grooves || 0) + '</em> grooves</div>'
          +       '<div class="dx-stat"><em>' + (d.likes || 0) + '</em> likes</div>'
          +     '</div>'
          +   '</div>'
          +   '<div class="dx-actions">'
          +     '<button class="btn-follow dx-follow" type="button" data-follow="' + esc(d.user) + '">+ Seguir</button>'
          +     '<button class="btn-action dx-view" data-go="/profile/' + esc(d.user) + '">Ver perfil →</button>'
          +   '</div>'
          + '</div>';

        // Hover preview: arranca después de 250ms para evitar disparar en pase rápido del mouse
        if (topGroove) {
          var hoverTimer = null, previewToken = null;
          el.addEventListener('mouseenter', function () {
            hoverTimer = setTimeout(function () {
              el.classList.add('previewing');
              previewToken = DH.PreviewPlayer.play(topGroove.pattern, topGroove.bpm, function () {
                el.classList.remove('previewing'); previewToken = null;
              }, topGroove.kit);
            }, 250);
          });
          el.addEventListener('mouseleave', function () {
            if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
            if (previewToken && DH.PreviewPlayer.isPlaying(previewToken)) {
              DH.PreviewPlayer.stop();
            }
            el.classList.remove('previewing');
          });
        }

        el.addEventListener('click', function (e) {
          if (e.target.closest('[data-follow]')) return;
          if (e.target.closest('.dx-top-groove')) return; // su propio handler
          DH.Router.go('/profile/' + d.user);
        });
        grid.appendChild(el);
      });
    }

    renderSidebar();

    app.querySelectorAll('[data-follow]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var targetUser = b.getAttribute('data-follow');
        if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
        var isFollowing = b.classList.contains('following');
        var action = isFollowing ? DH.Api.unfollow(targetUser) : DH.Api.follow(targetUser);
        action.then(function () {
          b.classList.toggle('following');
          b.textContent = b.classList.contains('following') ? '✓ Siguiendo' : '+ Seguir';
        }).catch(function (err) {
          DH.UI.toast((err && err.message) || 'Error', 'error');
        });
      });
    });
    applyFollowStates();
    app.querySelectorAll('.dx-view').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); DH.Router.go(b.getAttribute('data-go')); });
    });
  }

  function renderSidebar() {
    // Featured: top drummer by likes
    var top = drummersList.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];
    var topGenres = genresOf(top.user).slice(0, 2);
    var featured = document.getElementById('featured-drummer');
    featured.innerHTML = ''
      + '<div class="featured-drummer">'
      +   '<div class="fd-top">'
      +     DH.UI.drummerAvatar(top, { size: 48, color: top.color, ring: 2 })
      +     '<div>'
      +       '<div class="fd-name">' + esc(top.name || top.user) + '</div>'
      +       '<div class="fd-handle">@' + esc(top.user) + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<p class="fd-bio">' + esc(top.bio || '') + '</p>'
      +   '<div class="fd-stats"><span><em>' + (top.grooves || 0) + '</em> grooves</span><span><em>' + (top.likes || 0) + '</em> likes</span></div>'
      +   '<button class="btn-follow-block" data-go="/profile/' + esc(top.user) + '">Ver perfil →</button>'
      + '</div>';

    // Genre stats
    var gh = document.getElementById('d-genre-stats');
    gh.innerHTML = '';
    var byGenre = {};
    DH.GROOVES.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
    Object.keys(byGenre).map(function (k) { return { name: k, count: byGenre[k] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 6).forEach(function (g) {
      var color = (DH.GENRE_INFO[g.name] && DH.GENRE_INFO[g.name].color) || 'var(--text)';
      var el = document.createElement('div'); el.className = 'pop-genre-row';
      el.innerHTML = '<span class="pop-genre-name" style="color:' + color + '">' + esc(g.name) + '</span><span class="pop-genre-count">' + g.count + '</span>';
      el.addEventListener('click', function () { state.genre = g.name; render(); });
      gh.appendChild(el);
    });

    // Recent activity (real: latest grooves sorted by createdAt)
    var ah = document.getElementById('d-activity');
    ah.innerHTML = '';
    function dRelTime(ms) {
      var diff = Date.now() - ms, min = Math.floor(diff / 60000);
      if (min < 1) return 'ahora mismo';
      if (min < 60) return 'hace ' + min + ' min';
      var h = Math.floor(min / 60);
      if (h < 24) return 'hace ' + h + ' h';
      var d = Math.floor(h / 24);
      return 'hace ' + d + (d === 1 ? ' día' : ' días');
    }
    var recentG = (DH.GROOVES || [])
      .filter(function (g) { return g.createdAt; })
      .slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 6);
    if (!recentG.length) recentG = (DH.GROOVES || []).slice(0, 6);
    recentG.forEach(function (g) {
      var dr = DH.findDrummer(g.author) || { color: '#6b6860', init: (g.author || '?')[0].toUpperCase() };
      var timeStr = g.createdAt ? dRelTime(new Date(g.createdAt).getTime()) : '';
      var el = document.createElement('div'); el.className = 'act-item-v2';
      el.innerHTML = '<div class="act-dot" style="background:' + dr.color + '"></div>'
        + '<div><div class="act-text-v2"><strong>' + esc(g.author) + '</strong> subió <a data-go="/groove/' + esc(g.slug) + '">' + esc(g.title) + '</a></div>'
        + (timeStr ? '<div class="act-time-v2">' + timeStr + '</div>' : '') + '</div>';
      ah.appendChild(el);
    });

    app.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); DH.Router.go(el.getAttribute('data-go')); });
    });
  }

  render();

  // Enrich drummersList with real API data: actual grooves count, total likes, real bio.
  // Runs after the initial render so the page is never blocked waiting for the API.
  Promise.all([
    DH.Api.getUsers({ size: 1000 }),
    DH.Api.getGrooves({ size: 1000 })
  ]).then(function (results) {
    var apiUsers  = (results[0] && results[0].content) || [];
    var apiGrooves = (results[1] && results[1].content) || [];

    // Real grooves count + total likes per author
    var statsMap = {};
    apiGrooves.forEach(function (g) {
      var u = g.authorUsername;
      if (!statsMap[u]) statsMap[u] = { grooves: 0, likes: 0 };
      statsMap[u].grooves++;
      statsMap[u].likes += (g.likes || 0);
    });

    // Build enriched list from API users, falling back to mock for color/init
    var enriched = apiUsers.map(function (au) {
      var mock  = DH.findDrummer(au.username) || {};
      var stats = statsMap[au.username] || { grooves: 0, likes: 0 };
      return {
        user:     au.username,
        name:     au.name     || mock.name     || au.username,
        bio:      au.bio      || mock.bio      || '',
        grooves:  stats.grooves,
        likes:    stats.likes,
        color:    mock.color  || '#6b6860',
        init:     mock.init   || (au.name ? au.name[0] : au.username[0]).toUpperCase(),
        location: mock.location || ''
      };
    });

    // Append mock-only entries not in the API (legacy / demo drummers)
    DH.DRUMMERS.forEach(function (d) {
      if (!enriched.some(function (x) { return x.user === d.user; })) enriched.push(d);
    });

    drummersList = enriched;

    // Update hero stats
    var realTotal = drummersList.reduce(function (a, d) { return a + (d.grooves || 0); }, 0);
    var realLikes = drummersList.reduce(function (a, d) { return a + (d.likes  || 0); }, 0);
    var elCount   = document.getElementById('dh-stat-count');
    var elGrooves = document.getElementById('dh-stat-grooves');
    var elLikes   = document.getElementById('dh-stat-likes');
    if (elCount)   elCount.textContent   = drummersList.length;
    if (elGrooves) elGrooves.textContent = realTotal;
    if (elLikes)   elLikes.innerHTML     = (realLikes / 1000).toFixed(1).replace(/\.0$/, '') + '<em>K</em>';

    render();
  }).catch(function () {});
};
