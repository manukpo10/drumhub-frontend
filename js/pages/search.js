// Search results page — filters: q, genre, level, tags, bpm range + sort + pagination + sidebar.
// State is synced to the URL hash on every change (back/forward funcionan, search results bookmarkeables).
window.DH = window.DH || {};
DH.pages = DH.pages || {};

var PAGE_SIZE = 12;

DH.pages.search = function (_params, query) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Explorar grooves');

  var state = {
    q: query.q || '',
    genre: query.genre || '',
    level: query.level || '',
    tags: query.tags ? query.tags.split(',').filter(Boolean) : [],
    sort: query.sort || 'new',
    bpmMin: parseInt(query.bpmMin, 10) || 40,
    bpmMax: parseInt(query.bpmMax, 10) || 200,
    page: parseInt(query.page, 10) || 1
  };

  // Server-side pagination state
  var totalPages = 1;
  var totalElements = 0;
  // In-flight debounce timer for text search
  var debounceTimer = null;
  // Last rendered in-memory grooves (for sidebar facets when API is used)
  var lastApiGrooves = null;
  // Auto-rotation timer for the trending strip (cleared on re-render / navigation)
  var trendingTimer = null;
  // Cached real per-level totals from the backend (one lazy fetch per level).
  var levelCountCache = null;

  var sortLabels = { trending: 'Tendencia', likes: 'Mas likes', new: 'Recientes', bpm: 'BPM' };

  // ── URL state sync ──
  function syncUrl() {
    var params = [];
    if (state.q) params.push('q=' + encodeURIComponent(state.q));
    if (state.genre) params.push('genre=' + encodeURIComponent(state.genre));
    if (state.level) params.push('level=' + encodeURIComponent(state.level));
    if (state.tags && state.tags.length) params.push('tags=' + encodeURIComponent(state.tags.join(',')));
    if (state.sort && state.sort !== 'new') params.push('sort=' + encodeURIComponent(state.sort));
    if (state.bpmMin !== 40) params.push('bpmMin=' + state.bpmMin);
    if (state.bpmMax !== 200) params.push('bpmMax=' + state.bpmMax);
    if (state.page > 1) params.push('page=' + state.page);
    var qs = params.length ? '?' + params.join('&') : '';
    var newPath = '/search' + qs;
    if (location.pathname + location.search !== newPath) {
      history.replaceState(null, '', newPath);
    }
  }

  // Resolve genre name -> slug
  function genreNameToSlug(name) {
    if (!name) return '';
    var genres = DH.GENRES || [];
    for (var i = 0; i < genres.length; i++) {
      if (genres[i].name === name) return genres[i].slug;
    }
    return name;
  }

  // ── New 3-column explore layout ──
  app.innerHTML = ''
    + '<div class="explore-layout">'

    // LEFT SIDEBAR
    + '  <aside class="explore-sidebar-left" id="explore-sidebar-left">'
    +   '<div class="explore-drawer-grab"></div>'
    +   '<div class="explore-drawer-head">'
    +     '<div class="explore-drawer-title">Filtros</div>'
    +     '<button class="explore-drawer-close" id="drawer-close" type="button" aria-label="Cerrar">&times;</button>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Ordenar <em>por</em></div>'
    +     '<div class="esb-group" id="esb-sort"></div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Por <em>género</em></div>'
    +     '<div class="esb-group" id="esb-genre"></div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Por <em>dificultad</em></div>'
    +     '<div class="esb-group" id="esb-level"></div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Tempo <em>BPM</em></div>'
    +     '<div class="esb-bpm-wrap">'
    +       '<div class="esb-bpm-range"><span>40</span><span id="bpm-label">&le; ' + state.bpmMax + '</span></div>'
    +       '<input type="range" class="esb-slider" id="bpm-max" min="40" max="240" value="' + state.bpmMax + '">'
    +     '</div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section" id="esb-tags-section">'
    +     '<div class="section-title-sm">Tags <em>populares</em></div>'
    +     '<div class="esb-tags" id="esb-tags"></div>'
    +   '</div>'
    + '</aside>'

    // MAIN FEED
    + '<main class="explore-main">'
    +   '<div class="explore-search-bar">'
    +     '<form id="s-form">'
    +       '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.3"/><line x1="9" y1="9" x2="12.5" y2="12.5" stroke="currentColor" stroke-width="1.3"/></svg>'
    +       '<input type="text" id="s-q" placeholder="Buscar grooves, bateristas..." value="' + esc(state.q) + '">'
    +     '</form>'
    +   '</div>'
    +   '<div class="explore-trending" id="trending-strip-wrap"></div>'
    +   '<div class="explore-tabs">'
    +     '<div class="explore-tab' + (state.sort === 'new' ? ' active' : '') + '" data-tab="new">Recientes</div>'
    +     '<div class="explore-tab' + (state.sort === 'likes' ? ' active' : '') + '" data-tab="likes">Más likes</div>'
    +   '</div>'
    +   '<div class="explore-active-filters" id="active-filters-bar">'
    +     '<div class="explore-results-count" id="results-count-inline"></div>'
    +   '</div>'
    +   '<div class="feed" id="s-grid"></div>'
    +   '<div class="pagination" id="s-pagination"></div>'
    + '</main>'

    // RIGHT SIDEBAR
    + '<aside class="explore-sidebar-right">'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Sugeridos para <em>seguir</em></div>'
    +     '<div id="suggested-users"></div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Géneros <em>populares</em></div>'
    +     '<div class="esb-genre-pills" id="popular-genres"></div>'
    +   '</div>'
    +   '<div class="sidebar-card-v2 esb-section">'
    +     '<div class="section-title-sm">Stats de <em>hoy</em></div>'
    +     '<div id="explore-stats"></div>'
    +   '</div>'
    + '</aside>'

    // Mobile filter button
    + '<button class="explore-mobile-filter-btn" id="mobile-filter-toggle" type="button">'
    +   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>'
    +   'Filtros'
    + '</button>'

    // Drawer overlay (mobile only)
    + '<div class="explore-drawer-overlay" id="drawer-overlay"></div>'

    + '</div>'; // .explore-layout

  // Object.assign polyfill (IE11 compat)
  if (!Object.assign) {
    Object.assign = function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i]; if (!src) continue;
        for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
      }
      return target;
    };
  }

  // ── Mobile filter bottom sheet ──
  var drawer = document.getElementById('explore-sidebar-left');
  var overlay = document.getElementById('drawer-overlay');
  function openDrawer() { drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('open'); }
  document.getElementById('mobile-filter-toggle').addEventListener('click', openDrawer);
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // ── Feed tabs ──
  document.querySelectorAll('.explore-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.sort = tab.getAttribute('data-tab');
      state.page = 1;
      document.querySelectorAll('.explore-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      render();
    });
  });

  // ── BPM max slider ──
  document.getElementById('bpm-max').addEventListener('input', function (e) {
    state.bpmMax = parseInt(e.target.value, 10);
    document.getElementById('bpm-label').textContent = '≤ ' + state.bpmMax;
    // Update slider gradient
    var pct = Math.round((state.bpmMax - 40) / (240 - 40) * 100);
    e.target.style.background = 'linear-gradient(to right, var(--accent) ' + pct + '%, var(--border2) ' + pct + '%)';
    state.page = 1;
    render();
  });

  // ── Search form ──
  document.getElementById('s-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    state.q = document.getElementById('s-q').value.trim();
    state.page = 1;
    render();
  });

  document.getElementById('s-q').addEventListener('input', function (e) {
    var val = e.target.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      state.q = val;
      state.page = 1;
      render();
    }, 400);
  });

  // ── Client-side facet counting ──
  function countWith(all, override, skip) {
    var s = override || state;
    var q = (s.q || '').toLowerCase();
    return all.filter(function (g) {
      if (skip !== 'genre' && s.genre && g.genre !== s.genre) return false;
      if (skip !== 'level' && s.level && g.level !== s.level) return false;
      if (skip !== 'tags' && s.tags && s.tags.length) {
        var gt = g.tags || [];
        if (!s.tags.every(function (t) { return gt.indexOf(t) !== -1; })) return false;
      }
      if (skip !== 'bpm' && (g.bpm < s.bpmMin || g.bpm > s.bpmMax)) return false;
      if (skip !== 'q' && q) {
        var hay = (g.title + ' ' + g.author + ' ' + g.genre + ' ' + (g.desc || '') + ' ' + g.bpm + 'bpm').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).length;
  }

  // ── Left sidebar filter rendering ──
  function renderSidebarFilters(all) {
    // Sort options
    var sortHost = document.getElementById('esb-sort');
    var sortOptions = [
      { label: 'Recientes', value: 'new' },
      { label: 'Mas likes', value: 'likes' }
    ];
    sortHost.innerHTML = '';
    sortOptions.forEach(function (opt) {
      var el = document.createElement('div');
      el.className = 'esb-item' + (state.sort === opt.value ? ' active' : '');
      el.textContent = opt.label;
      el.addEventListener('click', function () {
        state.sort = opt.value;
        state.page = 1;
        // Sync tabs
        document.querySelectorAll('.explore-tab').forEach(function (t) {
          t.classList.toggle('active', t.getAttribute('data-tab') === opt.value);
        });
        render();
      });
      sortHost.appendChild(el);
    });

    // Genre options
    var genreHost = document.getElementById('esb-genre');
    genreHost.innerHTML = '';
    var genres = DH.GENRES || [];
    genres.forEach(function (g) {
      // Real backend total per genre (DH.GENRES carries grooveCount from the API).
      var count = (typeof g.count === 'number')
        ? g.count
        : countWith(all, Object.assign({}, state, { genre: g.name }), null);
      var el = document.createElement('div');
      el.className = 'esb-item' + (state.genre === g.name ? ' active' : '');
      el.innerHTML = '<span>' + esc(g.name) + '</span><span class="esb-item-count">' + count + '</span>';
      el.addEventListener('click', function () {
        state.genre = (state.genre === g.name) ? '' : g.name;
        state.page = 1;
        render();
      });
      genreHost.appendChild(el);
    });
    // "All genres" clear option at top
    if (state.genre) {
      var clearEl = document.createElement('div');
      clearEl.className = 'esb-item';
      clearEl.innerHTML = '<span style="color:var(--accent)">Todos los géneros</span>';
      clearEl.addEventListener('click', function () { state.genre = ''; state.page = 1; render(); });
      genreHost.insertBefore(clearEl, genreHost.firstChild);
    }

    // Level options
    var levelHost = document.getElementById('esb-level');
    levelHost.innerHTML = '';
    var levelColors = { 'Basico': 'var(--accent3)', 'Intermedio': 'var(--accent)', 'Avanzado': 'var(--accent2)' };
    var levels = DH.LEVELS || ['Basico', 'Intermedio', 'Avanzado'];
    levels.forEach(function (lv) {
      var color = levelColors[lv] || 'var(--muted)';
      // Real backend total per level, lazily fetched and cached. Blank until it loads.
      var count = (levelCountCache && typeof levelCountCache[lv] === 'number') ? levelCountCache[lv] : '';
      var el = document.createElement('div');
      el.className = 'esb-item' + (state.level === lv ? ' active' : '');
      el.innerHTML = '<span style="display:flex;align-items:center;gap:7px"><span class="esb-dot" style="background:' + color + '"></span>' + esc(lv) + '</span><span class="esb-item-count" data-level-count="' + esc(lv) + '">' + count + '</span>';
      el.addEventListener('click', function () {
        state.level = (state.level === lv) ? '' : lv;
        state.page = 1;
        render();
      });
      levelHost.appendChild(el);
    });
    loadLevelCounts(levels);

    // Tags: top 8
    var tagHost = document.getElementById('esb-tags');
    tagHost.innerHTML = '';
    var tagCounts = {};
    all.forEach(function (g) { (g.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
    var topTags = Object.keys(tagCounts)
      .map(function (t) { return { tag: t, count: tagCounts[t] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 8);
    topTags.forEach(function (entry) {
      var active = state.tags.indexOf(entry.tag) !== -1;
      var el = document.createElement('span');
      el.className = 'esb-tag-chip' + (active ? ' active' : '');
      el.textContent = '#' + entry.tag;
      el.addEventListener('click', function () {
        if (active) state.tags = state.tags.filter(function (t) { return t !== entry.tag; });
        else state.tags = state.tags.concat([entry.tag]);
        state.page = 1;
        render();
      });
      tagHost.appendChild(el);
    });
  }

  // Fetch the real total per difficulty level once (size=1, read totalElements),
  // cache it, and fill in the sidebar counts when they arrive.
  function loadLevelCounts(levels) {
    if (levelCountCache) return;
    Promise.all(levels.map(function (lv) {
      return DH.Api.getGrooves({ size: 1, level: lv })
        .then(function (p) { return { lv: lv, n: (p && typeof p.totalElements === 'number') ? p.totalElements : 0 }; })
        .catch(function () { return { lv: lv, n: null }; });
    })).then(function (results) {
      var cache = {};
      var anyResolved = false;
      results.forEach(function (r) { if (r.n !== null) { cache[r.lv] = r.n; anyResolved = true; } });
      if (!anyResolved) return; // backend unavailable — leave blank, retry on next render
      levelCountCache = cache;
      // Patch the counts into the DOM without a full re-render.
      Object.keys(cache).forEach(function (lv) {
        var span = document.querySelector('[data-level-count="' + lv.replace(/"/g, '') + '"]');
        if (span) span.textContent = cache[lv];
      });
    });
  }

  // ── Build API params ──
  function buildApiParams() {
    var params = {
      page: state.page - 1,
      size: PAGE_SIZE,
      sort: state.sort
    };
    if (state.q) params.q = state.q;
    if (state.genre) params.genre = genreNameToSlug(state.genre);
    if (state.level) params.level = state.level;
    if (state.tags && state.tags.length) params.tag = state.tags[0];
    if (state.bpmMin !== 40)  params.bpmMin = state.bpmMin;
    if (state.bpmMax !== 200) params.bpmMax = state.bpmMax;
    return params;
  }

  // ── Core render ──
  function render() {
    syncUrl();

    var grid = document.getElementById('s-grid');
    grid.innerHTML = '<div class="empty"><p>Buscando...</p></div>';

    var params = buildApiParams();

    DH.Api.getGrooves(params).then(function (page) {
      var grooves = (page && page.content) ? page.content.map(DH.Adapter.groove) : [];
      totalPages = (page && page.totalPages) ? page.totalPages : 1;
      totalElements = (page && page.totalElements) ? page.totalElements : grooves.length;
      lastApiGrooves = grooves;
      renderResults(grooves);
    }).catch(function () {
      var all = DH.Store.allGrooves();
      var q = state.q.toLowerCase();
      var grooves = all.filter(function (g) {
        if (state.genre && g.genre !== state.genre) return false;
        if (state.level && g.level !== state.level) return false;
        if (state.tags.length) {
          var gt = g.tags || [];
          if (!state.tags.every(function (t) { return gt.indexOf(t) !== -1; })) return false;
        }
        if (g.bpm < state.bpmMin || g.bpm > state.bpmMax) return false;
        if (q) {
          var hay = (g.title + ' ' + g.author + ' ' + g.genre + ' ' + (g.desc || '') + ' ' + g.bpm + 'bpm').toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      if (state.sort === 'likes') grooves.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
      else if (state.sort === 'new') grooves.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      else if (state.sort === 'bpm') grooves.sort(function (a, b) { return a.bpm - b.bpm; });
      else grooves.sort(function (a, b) { return (b.plays || 0) + (b.likes || 0) * 2 - ((a.plays || 0) + (a.likes || 0) * 2); });
      totalElements = grooves.length;
      totalPages = Math.max(1, Math.ceil(grooves.length / PAGE_SIZE));
      var start = (state.page - 1) * PAGE_SIZE;
      lastApiGrooves = grooves.slice(start, start + PAGE_SIZE);
      renderResults(lastApiGrooves);
    });
  }

  function renderResults(grooves) {
    var all = DH.Store.allGrooves();

    // Render left sidebar filters
    renderSidebarFilters(all);

    // Active filters bar
    renderActiveFilters();

    // Results count
    var inline = document.getElementById('results-count-inline');
    if (inline) {
      inline.innerHTML = '<strong>' + totalElements + '</strong> ' + (totalElements === 1 ? 'resultado' : 'resultados') + (state.page > 1 ? ' — p. ' + state.page + '/' + totalPages : '');
    }

    // Feed cards
    var grid = document.getElementById('s-grid');
    grid.innerHTML = '';

    if (!grooves.length) {
      grid.appendChild(buildSmartEmpty(all));
    } else {
      var isMobile = window.innerWidth <= 768;
      grooves.forEach(function (g, i) {
        grid.appendChild(DH.UI.grooveCard(g));
        if (isMobile) {
          if (i === 2) { grid.appendChild(buildSuggestedUsersCard(all)); }
          if (i === 6) { grid.appendChild(buildPopularGenresCard(all)); }
        }
      });
    }

    // Pagination
    var pg = document.getElementById('s-pagination');
    pg.innerHTML = '';
    if (totalPages > 1) {
      var prev = document.createElement('button');
      prev.className = 'page-btn' + (state.page === 1 ? ' disabled' : '');
      prev.innerHTML = 'Anterior';
      prev.addEventListener('click', function () {
        if (state.page > 1) { state.page--; render(); window.scrollTo(0, 0); }
      });
      pg.appendChild(prev);

      var start = Math.max(1, state.page - 3);
      var end = Math.min(totalPages, start + 6);
      if (end - start < 6) start = Math.max(1, end - 6);
      for (var p = start; p <= end; p++) {
        var btn = document.createElement('button');
        btn.className = 'page-btn page-num' + (state.page === p ? ' active' : '');
        btn.textContent = p;
        (function (target) {
          btn.addEventListener('click', function () { state.page = target; render(); window.scrollTo(0, 0); });
        })(p);
        pg.appendChild(btn);
      }

      var next = document.createElement('button');
      next.className = 'page-btn' + (state.page === totalPages ? ' disabled' : '');
      next.innerHTML = 'Siguiente';
      next.addEventListener('click', function () {
        if (state.page < totalPages) { state.page++; render(); window.scrollTo(0, 0); }
      });
      pg.appendChild(next);
    }

    renderTrendingStrip(all);
    renderRightSidebar(grooves, all);
  }

  // ── Active filters bar ──
  function renderActiveFilters() {
    var bar = document.getElementById('active-filters-bar');
    // Remove all chips (but keep results-count)
    var countEl = document.getElementById('results-count-inline');
    bar.innerHTML = '';
    bar.appendChild(countEl || document.createElement('div'));

    var chips = [];
    if (state.q) chips.push({ key: 'q', label: '"' + state.q + '"' });
    if (state.genre) chips.push({ key: 'genre', label: state.genre });
    if (state.level) chips.push({ key: 'level', label: state.level });
    state.tags.forEach(function (t) { chips.push({ key: 'tag:' + t, label: '#' + t }); });
    if (state.bpmMin !== 40 || state.bpmMax !== 200) chips.push({ key: 'bpm', label: '≤ ' + state.bpmMax + ' BPM' });

    chips.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'explore-filter-chip';
      el.innerHTML = esc(c.label) + ' <button data-clear="' + c.key + '" aria-label="Quitar">&times;</button>';
      el.querySelector('button').addEventListener('click', function (e) {
        e.stopPropagation();
        var k = c.key;
        if (k === 'q') { state.q = ''; document.getElementById('s-q').value = ''; }
        else if (k === 'genre') { state.genre = ''; }
        else if (k === 'level') { state.level = ''; }
        else if (k.indexOf('tag:') === 0) { var t = k.slice(4); state.tags = state.tags.filter(function (x) { return x !== t; }); }
        else if (k === 'bpm') { state.bpmMax = 200; document.getElementById('bpm-max').value = 200; document.getElementById('bpm-label').textContent = '≤ 200'; }
        state.page = 1;
        render();
      });
      bar.insertBefore(el, bar.firstChild);
    });
  }

  function renderTrendingStrip(all) {
    // Clear any rotation timer from a previous render before rebuilding the strip.
    if (trendingTimer) { clearInterval(trendingTimer); trendingTimer = null; }

    var host = document.getElementById('trending-strip-wrap');
    var pool = state.genre ? all.filter(function (g) { return g.genre === state.genre; }) : all;
    var top = pool.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); }).slice(0, 10);
    if (top.length < 4) { host.innerHTML = ''; return; }
    var subLabel = state.genre ? ('Top ' + state.genre + ' de la semana') : 'Trending esta semana';

    host.innerHTML = ''
      + '<div class="explore-trending-header">'
      +   '<div class="explore-trending-dot"></div>'
      +   '<div class="explore-trending-label">' + esc(subLabel) + '</div>'
      + '</div>'
      + '<div class="explore-trending-cards" id="trending-strip-scroll"></div>';

    var scroll = document.getElementById('trending-strip-scroll');
    top.forEach(function (g, i) {
      var genreObj = DH.GENRES && DH.GENRES.filter(function (gen) { return gen.name === g.genre; })[0];
      var genreColor = genreObj ? genreObj.color : 'var(--muted)';
      var el = document.createElement('div');
      el.className = 'explore-trending-card';
      el.innerHTML = ''
        + '<div class="explore-trending-num">' + (i + 1 < 10 ? '0' + (i + 1) : String(i + 1)) + '</div>'
        + '<div class="explore-trending-genre" style="color:' + genreColor + '">' + esc(g.genre) + '</div>'
        + '<div class="explore-trending-name">' + esc(g.title) + '</div>'
        + '<div class="explore-trending-meta"><span>' + g.bpm + ' BPM</span><span>&middot;</span><span>&#9829; ' + (g.likes || 0) + '</span></div>';
      el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
      scroll.appendChild(el);
    });

    // ── Auto-rotate the trending strip ──
    // Advances one card every few seconds, looping back to the start at the end.
    // Pauses while hovered; self-cancels once the strip leaves the DOM (navigation).
    // Scroll is animated manually (not behavior:'smooth') so it runs everywhere.
    var paused = false;
    scroll.addEventListener('mouseenter', function () { paused = true; });
    scroll.addEventListener('mouseleave', function () { paused = false; });

    function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function animateScrollTo(el, target, duration) {
      var startLeft = el.scrollLeft;
      var change = target - startLeft;
      var startTime = Date.now();
      // setInterval (not requestAnimationFrame) so the animation also runs while
      // the tab is backgrounded and in headless contexts.
      var anim = setInterval(function () {
        if (!document.body.contains(el)) { clearInterval(anim); return; }
        var t = Math.min(1, (Date.now() - startTime) / duration);
        el.scrollLeft = startLeft + change * easeInOutQuad(t);
        if (t >= 1) clearInterval(anim);
      }, 16);
    }

    trendingTimer = setInterval(function () {
      if (!document.body.contains(scroll)) { clearInterval(trendingTimer); trendingTimer = null; return; }
      if (paused) return;
      var maxScroll = scroll.scrollWidth - scroll.clientWidth;
      if (maxScroll <= 0) return; // everything fits, nothing to rotate
      var firstCard = scroll.firstChild;
      var step = firstCard ? firstCard.getBoundingClientRect().width + 8 : 160;
      var target = (scroll.scrollLeft >= maxScroll - 2) ? 0 : Math.min(maxScroll, scroll.scrollLeft + step);
      animateScrollTo(scroll, target, 550);
    }, 2800);
  }

  function buildSmartEmpty(all) {
    var wrap = document.createElement('div');
    wrap.className = 'empty empty-smart';
    wrap.style.gridColumn = '1 / -1';

    var activeChips = [];
    if (state.q)     activeChips.push('"' + state.q + '"');
    if (state.genre) activeChips.push(state.genre);
    if (state.level) activeChips.push(state.level);
    state.tags.forEach(function (t) { activeChips.push('#' + t); });
    if (state.bpmMin !== 40 || state.bpmMax !== 200) activeChips.push(state.bpmMin + '-' + state.bpmMax + ' BPM');

    var headerText = activeChips.length
      ? 'Sin resultados con <strong>' + activeChips.map(esc).join('</strong> - <strong>') + '</strong>'
      : 'Sin resultados';

    wrap.innerHTML = ''
      + '<h4>Nada por aca</h4>'
      + '<p>' + headerText + '</p>'
      + (activeChips.length
          ? '<div class="empty-suggestions"><div class="empty-suggestions-label">Proba quitar:</div><div class="empty-suggestions-row" id="empty-sugg"></div></div>'
          : '<button class="btn-primary" data-clear-all>Reset</button>');

    if (activeChips.length) {
      var suggestions = [];
      function suggest(label, key, applyRemoval) {
        var sim = Object.assign({}, state); applyRemoval(sim);
        var count = countWith(all, sim, null);
        if (count > 0) suggestions.push({ label: label, count: count, apply: applyRemoval });
      }
      if (state.q)     suggest('Sin "' + state.q + '"',          'q',     function (s) { s.q = ''; });
      if (state.genre) suggest('Sin genero ' + state.genre,      'genre', function (s) { s.genre = ''; });
      if (state.level) suggest('Sin nivel ' + state.level,        'level', function (s) { s.level = ''; });
      state.tags.forEach(function (t) {
        suggest('Sin tag #' + t, 'tag', function (s) { s.tags = s.tags.filter(function (x) { return x !== t; }); });
      });
      if (state.bpmMin !== 40 || state.bpmMax !== 200) {
        suggest('Sin rango BPM', 'bpm', function (s) { s.bpmMin = 40; s.bpmMax = 200; });
      }
      suggestions.sort(function (a, b) { return b.count - a.count; });

      setTimeout(function () {
        var host = document.getElementById('empty-sugg'); if (!host) return;
        if (!suggestions.length) {
          host.innerHTML = '<button class="btn-primary" data-clear-all>Limpiar todos los filtros</button>';
        } else {
          suggestions.forEach(function (s) {
            var b = document.createElement('button'); b.className = 'empty-sugg-btn';
            b.innerHTML = esc(s.label) + ' <span class="esc">- <em>' + s.count + '</em> resultados</span>';
            b.addEventListener('click', function () { s.apply(state); state.page = 1; render(); });
            host.appendChild(b);
          });
          var clearAll = document.createElement('button'); clearAll.className = 'empty-sugg-btn empty-sugg-reset';
          clearAll.innerHTML = 'Limpiar todos';
          clearAll.addEventListener('click', function () {
            state.q = ''; state.genre = ''; state.level = ''; state.tags = []; state.bpmMin = 40; state.bpmMax = 200;
            document.getElementById('bpm-max').value = 200;
            document.getElementById('bpm-label').textContent = '≤ 200';
            document.getElementById('s-q').value = '';
            state.page = 1; render();
          });
          host.appendChild(clearAll);
        }
        wrap.querySelectorAll('[data-clear-all]').forEach(function (b) {
          b.addEventListener('click', function () {
            state.q = ''; state.genre = ''; state.level = ''; state.tags = []; state.bpmMin = 40; state.bpmMax = 200;
            document.getElementById('bpm-max').value = 200;
            document.getElementById('bpm-label').textContent = '≤ 200';
            document.getElementById('s-q').value = '';
            state.page = 1; render();
          });
        });
      }, 0);
    }
    return wrap;
  }

  // ── Feed-interspersed card: suggested users to follow (mobile only) ──
  function buildSuggestedUsersCard(all) {
    var card = document.createElement('div');
    card.className = 'feed-insert-card';
    card.innerHTML = '<div class="fic-title">Sugeridos para seguir</div><div class="fic-users"></div>';
    var host = card.querySelector('.fic-users');
    var rankedDrummers = (DH.DRUMMERS || []).slice(0, 5);
    rankedDrummers.forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'explore-user-row';
      el.innerHTML = ''
        + '<div class="explore-u-avatar" style="color:' + (d.color || 'var(--accent)') + ';border-color:' + (d.color || 'var(--accent)') + '44">' + esc(d.init) + '</div>'
        + '<div class="explore-u-info">'
        +   '<div class="explore-u-name">' + esc(d.user) + '</div>'
        +   '<div class="explore-u-sub">baterista</div>'
        + '</div>'
        + '<button class="explore-follow-btn">+ Seguir</button>';
      el.addEventListener('click', function () { DH.Router.go('/profile/' + d.user); });
      el.querySelector('.explore-follow-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        this.textContent = this.textContent === '+ Seguir' ? 'Siguiendo' : '+ Seguir';
      });
      host.appendChild(el);
    });
    return card;
  }

  // ── Feed-interspersed card: popular genres (mobile only) ──
  function buildPopularGenresCard(all) {
    var card = document.createElement('div');
    card.className = 'feed-insert-card';
    card.innerHTML = '<div class="fic-title">Géneros populares</div><div class="esb-genre-pills fic-genres"></div>';
    var host = card.querySelector('.fic-genres');
    var genres = DH.GENRES || [];
    var byGenre = {};
    all.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
    var ranked = Object.keys(byGenre)
      .map(function (k) { return { name: k, count: byGenre[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 8);
    ranked.forEach(function (g) {
      var genreObj = genres.filter(function (gen) { return gen.name === g.name; })[0];
      var color = genreObj ? genreObj.color : '#6b6860';
      var el = document.createElement('span');
      el.className = 'esb-genre-pill';
      el.style.color = color;
      el.style.borderColor = color + '44';
      el.style.background = color + '18';
      el.textContent = g.name;
      el.addEventListener('click', function () {
        state.genre = (state.genre === g.name) ? '' : g.name;
        state.page = 1;
        render();
      });
      host.appendChild(el);
    });
    return card;
  }

  // ── Right sidebar ──
  function renderRightSidebar(grooves, all) {
    renderSuggestions(all);
    renderPopularGenres(all);
    renderStats(all);
  }

  function renderSuggestions(all) {
    var host = document.getElementById('suggested-users');
    host.innerHTML = '';
    var rankedDrummers = (DH.DRUMMERS || []).slice(0, 5);
    rankedDrummers.forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'explore-user-row';
      el.innerHTML = ''
        + '<div class="explore-u-avatar" style="color:' + (d.color || 'var(--accent)') + ';border-color:' + (d.color || 'var(--accent)') + '44">' + esc(d.init) + '</div>'
        + '<div class="explore-u-info">'
        +   '<div class="explore-u-name">' + esc(d.user) + '</div>'
        +   '<div class="explore-u-sub">baterista</div>'
        + '</div>'
        + '<button class="explore-follow-btn">+ Seguir</button>';
      el.addEventListener('click', function () { DH.Router.go('/profile/' + d.user); });
      el.querySelector('.explore-follow-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        this.textContent = this.textContent === '+ Seguir' ? 'Siguiendo' : '+ Seguir';
      });
      host.appendChild(el);
    });
  }

  function renderPopularGenres(all) {
    var host = document.getElementById('popular-genres');
    host.innerHTML = '';
    var genres = DH.GENRES || [];
    var byGenre = {};
    all.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
    var ranked = Object.keys(byGenre)
      .map(function (k) { return { name: k, count: byGenre[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 8);
    ranked.forEach(function (g) {
      var genreObj = genres.filter(function (gen) { return gen.name === g.name; })[0];
      var color = genreObj ? genreObj.color : '#6b6860';
      var el = document.createElement('span');
      el.className = 'esb-genre-pill';
      el.style.color = color;
      el.style.borderColor = color + '44';
      el.style.background = color + '18';
      el.textContent = g.name;
      el.addEventListener('click', function () {
        state.genre = (state.genre === g.name) ? '' : g.name;
        state.page = 1;
        render();
      });
      host.appendChild(el);
    });
  }

  function renderStats(all) {
    var host = document.getElementById('explore-stats');
    host.innerHTML = '';
    var totalGrooves = (DH.GROOVES || all).length;
    var totalDrummers = (DH.DRUMMERS || []).length;
    var stats = [
      { label: 'Total grooves', val: totalGrooves > 1000 ? (totalGrooves / 1000).toFixed(1) + 'k' : String(totalGrooves) },
      { label: 'Bateristas', val: String(totalDrummers) },
      { label: 'Generos', val: String((DH.GENRES || []).length) }
    ];
    stats.forEach(function (s) {
      var el = document.createElement('div');
      el.className = 'explore-stat-row';
      el.innerHTML = '<span class="explore-stat-label">' + esc(s.label) + '</span><span class="explore-stat-val">' + esc(s.val) + '</span>';
      host.appendChild(el);
    });
  }

  render();
};
