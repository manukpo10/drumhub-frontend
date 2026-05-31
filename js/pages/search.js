// Search results page — filters: q, genre, level, tags, bpm range + sort + pagination + sidebar.
// State is synced to the URL hash on every change (back/forward funcionan, search results bookmarkeables).
window.DH = window.DH || {};
DH.pages = DH.pages || {};

var PAGE_SIZE = 12;

DH.pages.search = function (_params, query) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Explorar grooves');

  var storedView = null;
  try { storedView = localStorage.getItem('dh.searchView'); } catch (e) {}
  var state = {
    q: query.q || '',
    genre: query.genre || '',
    level: query.level || '',
    tags: query.tags ? query.tags.split(',').filter(Boolean) : [],
    sort: query.sort || 'trending',
    bpmMin: parseInt(query.bpmMin, 10) || 40,
    bpmMax: parseInt(query.bpmMax, 10) || 200,
    page: parseInt(query.page, 10) || 1,
    view: storedView === 'list' ? 'list' : 'grid'
  };

  // Server-side pagination state
  var totalPages = 1;
  var totalElements = 0;
  // In-flight debounce timer for text search
  var debounceTimer = null;
  // Last rendered in-memory grooves (for sidebar facets when API is used)
  var lastApiGrooves = null;

  var sortLabels = { trending: 'Tendencia', likes: 'Mas likes', new: 'Mas nuevos', bpm: 'BPM' };

  // ── URL state sync: actualiza el hash sin disparar hashchange ──
  function syncUrl() {
    var params = [];
    if (state.q) params.push('q=' + encodeURIComponent(state.q));
    if (state.genre) params.push('genre=' + encodeURIComponent(state.genre));
    if (state.level) params.push('level=' + encodeURIComponent(state.level));
    if (state.tags && state.tags.length) params.push('tags=' + encodeURIComponent(state.tags.join(',')));
    if (state.sort && state.sort !== 'trending') params.push('sort=' + encodeURIComponent(state.sort));
    if (state.bpmMin !== 40) params.push('bpmMin=' + state.bpmMin);
    if (state.bpmMax !== 200) params.push('bpmMax=' + state.bpmMax);
    if (state.page > 1) params.push('page=' + state.page);
    var qs = params.length ? '?' + params.join('&') : '';
    var newHash = '#/search' + qs;
    if (location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  // Resolve genre name -> slug using DH.GENRES (loaded at boot from backend).
  // Falls back to the name itself if not found (graceful degradation).
  function genreNameToSlug(name) {
    if (!name) return '';
    var genres = DH.GENRES || [];
    for (var i = 0; i < genres.length; i++) {
      if (genres[i].name === name) return genres[i].slug;
    }
    return name;
  }

  app.innerHTML = ''
    + '<div class="search-header">'
    +   '<div class="search-header-bg" id="search-header-bg"></div>'
    +   '<div class="search-header-inner">'
    +     '<div class="page-eyebrow">/ Explorar</div>'
    +     '<h1 class="search-title">Explorar <em>grooves</em></h1>'
    +     '<p class="search-sub">Filtra por genero, dificultad, BPM o palabras clave.</p>'
    +     '<div class="search-counter" id="search-counter">- resultados</div>'
    +   '</div>'
    + '</div>'

    + '<button class="mobile-filter-toggle" id="mobile-filter-toggle" type="button">'
    +   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>'
    +   '<span>Filtros <em id="mobile-filter-count">0</em></span>'
    + '</button>'

    + '<div class="search-filters-v2" id="search-filters-v2">'
    +   '<form class="search-top" id="s-form" style="background:var(--surface);border:1px solid var(--border);border-radius:4px;">'
    +     '<div class="search-input-wrap">'
    +       '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +       '<input type="text" id="s-q" placeholder="Buscar por titulo, autor, genero o BPM..." value="' + esc(state.q) + '">'
    +     '</div>'
    +     '<div class="search-divider"></div>'
    +     '<button class="btn-search" type="submit">Buscar</button>'
    +   '</form>'

    +   '<div class="filter-row">'
    +     '<div class="filter-row-label">Genero</div>'
    +     '<div class="chips chips-scroll" id="s-genre"></div>'
    +   '</div>'

    +   '<div class="filter-row">'
    +     '<div class="filter-row-label">Tags</div>'
    +     '<div class="chips chips-scroll" id="s-tags"></div>'
    +   '</div>'

    +   '<div class="filter-row filter-row-multi">'
    +     '<div class="filter-block">'
    +       '<div class="filter-row-label">Nivel</div>'
    +       '<div class="chips" id="s-level"></div>'
    +     '</div>'
    +     '<div class="filter-block">'
    +       '<div class="filter-row-label">Orden</div>'
    +       '<select id="s-sort" class="filter-select">'
    +         '<option value="trending"' + (state.sort === 'trending' ? ' selected' : '') + '>Tendencia</option>'
    +         '<option value="likes"' + (state.sort === 'likes' ? ' selected' : '') + '>Mas likes</option>'
    +         '<option value="new"' + (state.sort === 'new' ? ' selected' : '') + '>Mas nuevos</option>'
    +         '<option value="bpm"' + (state.sort === 'bpm' ? ' selected' : '') + '>BPM</option>'
    +       '</select>'
    +     '</div>'
    +     '<div class="filter-block filter-block-bpm">'
    +       '<div class="filter-row-label">BPM <span id="bpm-label">' + state.bpmMin + ' - ' + state.bpmMax + '</span></div>'
    +       '<div class="bpm-presets" id="bpm-presets">'
    +         '<button class="bpm-preset" data-bpm="40-90">Slow</button>'
    +         '<button class="bpm-preset" data-bpm="90-120">Medio</button>'
    +         '<button class="bpm-preset" data-bpm="120-160">Rapido</button>'
    +         '<button class="bpm-preset" data-bpm="160-200">Extremo</button>'
    +       '</div>'
    +       '<div class="bpm-dual">'
    +         '<input type="range" id="bpm-min" min="40" max="200" value="' + state.bpmMin + '">'
    +         '<input type="range" id="bpm-max" min="40" max="200" value="' + state.bpmMax + '">'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    + '<div class="search-main">'
    +   '<div class="col-results">'
    +     '<div class="trending-strip-wrap" id="trending-strip-wrap"></div>'
    +     '<div class="results-toolbar">'
    +       '<div class="results-toolbar-left" id="results-count-inline"></div>'
    +       '<div class="view-toggle" id="view-toggle">'
    +         '<button data-view="grid" class="' + (state.view === 'grid' ? 'active' : '') + '" title="Vista grilla">'
    +           '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
    +         '</button>'
    +         '<button data-view="list" class="' + (state.view === 'list' ? 'active' : '') + '" title="Vista lista">'
    +           '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div class="results-host" id="s-grid"></div>'
    +     '<div class="pagination" id="s-pagination"></div>'
    +   '</div>'
    +   '<div class="col-search-sidebar">'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Filtros <em>activos</em></div>'
    +       '<div class="active-filters" id="active-filters"></div>'
    +     '</div>'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Te puede <em>gustar</em></div>'
    +       '<div class="suggestions-list" id="suggestions-list"></div>'
    +     '</div>'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Generos <em>populares</em></div>'
    +       '<div class="popular-genres" id="popular-genres"></div>'
    +     '</div>'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Bateristas <em>activos</em></div>'
    +       '<div class="followers-grid" id="active-drummers"></div>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  DH.UI.heroBg(document.getElementById('search-header-bg'));

  // ── View toggle (grid / list) ──
  document.getElementById('view-toggle').querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.getAttribute('data-view');
      try { localStorage.setItem('dh.searchView', state.view); } catch (e) {}
      render();
    });
  });

  // ── Mobile filter drawer toggle ──
  var filtersWrap = document.getElementById('search-filters-v2');
  var toggleBtn = document.getElementById('mobile-filter-toggle');
  toggleBtn.addEventListener('click', function () {
    filtersWrap.classList.toggle('open');
    toggleBtn.classList.toggle('open');
  });
  function updateMobileFilterCount() {
    var n = 0;
    if (state.q) n++;
    if (state.genre) n++;
    if (state.level) n++;
    n += state.tags.length;
    if (state.bpmMin !== 40 || state.bpmMax !== 200) n++;
    if (state.sort !== 'trending') n++;
    document.getElementById('mobile-filter-count').textContent = n;
    toggleBtn.classList.toggle('has-filters', n > 0);
  }

  var genreHost = document.getElementById('s-genre');
  var levelHost = document.getElementById('s-level');
  var tagHost = document.getElementById('s-tags');

  // ── BPM dual slider ──
  var bpmMinEl = document.getElementById('bpm-min');
  var bpmMaxEl = document.getElementById('bpm-max');
  var bpmLabel = document.getElementById('bpm-label');
  function syncBpm() {
    var lo = parseInt(bpmMinEl.value, 10);
    var hi = parseInt(bpmMaxEl.value, 10);
    if (lo > hi) { var t = lo; lo = hi; hi = t; }
    state.bpmMin = lo; state.bpmMax = hi;
    bpmLabel.textContent = lo + ' - ' + hi;
    state.page = 1;
    render();
  }
  bpmMinEl.addEventListener('input', syncBpm);
  bpmMaxEl.addEventListener('input', syncBpm);

  // BPM presets
  function refreshBpmPresetActive() {
    document.querySelectorAll('.bpm-preset').forEach(function (b) {
      var p = b.getAttribute('data-bpm').split('-');
      var lo = parseInt(p[0], 10), hi = parseInt(p[1], 10);
      b.classList.toggle('active', state.bpmMin === lo && state.bpmMax === hi);
    });
  }
  document.querySelectorAll('.bpm-preset').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-bpm').split('-');
      var lo = parseInt(p[0], 10), hi = parseInt(p[1], 10);
      state.bpmMin = lo; state.bpmMax = hi;
      bpmMinEl.value = lo; bpmMaxEl.value = hi;
      bpmLabel.textContent = lo + ' - ' + hi;
      state.page = 1;
      render();
    });
  });

  // Submit: immediate (no debounce — user explicitly clicked Buscar)
  document.getElementById('s-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    state.q = document.getElementById('s-q').value.trim();
    state.page = 1;
    render();
  });

  // Text input: debounced 400ms
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

  document.getElementById('s-sort').addEventListener('change', function (e) {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });

  // Object.assign polyfill ligero (IE11 compat)
  if (!Object.assign) {
    Object.assign = function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i]; if (!src) continue;
        for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
      }
      return target;
    };
  }

  // ── Client-side facet counting for chips (uses in-memory boot data as proxy) ──
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

  function renderChips(host, options, activeValue, activeClass, onPick, countSkip, allGrooves) {
    host.innerHTML = '';
    options.forEach(function (opt) {
      var label = opt.label || opt;
      var value = opt.value !== undefined ? opt.value : opt;
      var isAll = value === 'Todos';
      var c = document.createElement('span');
      c.className = 'chip' + ((activeValue || 'Todos') === value ? ' ' + activeClass : '');
      var count;
      if (isAll) {
        count = countWith(allGrooves, null, countSkip);
      } else {
        var sim = Object.assign({}, state);
        sim[countSkip] = (countSkip === 'tags') ? [value] : value;
        count = countWith(allGrooves, sim, null);
      }
      c.innerHTML = esc(label) + ' <span class="chip-count">' + count + '</span>';
      c.addEventListener('click', function () { onPick(value); });
      host.appendChild(c);
    });
  }

  function renderTagChips(host, tagsByCount) {
    host.innerHTML = '';
    if (!tagsByCount.length) {
      host.innerHTML = '<span style="font-size:0.65rem;color:var(--muted);font-family:DM Mono,monospace;">Sin tags disponibles.</span>';
      return;
    }
    tagsByCount.forEach(function (entry) {
      var tag = entry.tag, count = entry.count;
      var active = state.tags.indexOf(tag) !== -1;
      var c = document.createElement('span');
      c.className = 'chip chip-tag' + (active ? ' active' : '');
      c.innerHTML = esc(tag) + ' <span class="chip-count">' + count + '</span>';
      c.addEventListener('click', function () {
        if (active) state.tags = state.tags.filter(function (t) { return t !== tag; });
        else state.tags = state.tags.concat([tag]);
        state.page = 1;
        render();
      });
      host.appendChild(c);
    });
  }

  // ── Build API params from current state ──
  function buildApiParams() {
    var params = {
      page: state.page - 1,   // Spring Data is 0-indexed
      size: PAGE_SIZE,
      sort: state.sort
    };
    if (state.q) params.q = state.q;
    if (state.genre) params.genre = genreNameToSlug(state.genre);
    if (state.level) params.level = state.level;           // backend expects 'Basico' / 'Intermedio' / 'Avanzado'
    if (state.tags && state.tags.length) params.tag = state.tags[0];  // backend param is singular 'tag'
    if (state.bpmMin !== 40)  params.bpmMin = state.bpmMin;
    if (state.bpmMax !== 200) params.bpmMax = state.bpmMax;
    return params;
  }

  // ── Core render: calls API, falls back to in-memory on error ──
  function render() {
    syncUrl();
    refreshBpmPresetActive();
    updateMobileFilterCount();

    // Show loading state while API is in flight
    var grid = document.getElementById('s-grid');
    grid.className = state.view === 'list' ? 'results-host results-list' : 'results-host groove-grid groove-grid-6';
    grid.innerHTML = '<div class="empty"><p>Buscando...</p></div>';

    var params = buildApiParams();

    DH.Api.getGrooves(params).then(function (page) {
      var grooves = (page && page.content) ? page.content.map(DH.Adapter.groove) : [];
      totalPages = (page && page.totalPages) ? page.totalPages : 1;
      totalElements = (page && page.totalElements) ? page.totalElements : grooves.length;
      lastApiGrooves = grooves;
      renderResults(grooves);
    }).catch(function () {
      // Fallback: filter in-memory boot data
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
    var word = totalElements === 1 ? 'groove encontrado' : 'grooves encontrados';
    var counterEl = document.getElementById('search-counter');
    if (counterEl) counterEl.innerHTML = '<em>' + totalElements + '</em> ' + word;

    // Use boot data for chips facet counts (cheaper than extra API calls)
    var all = DH.Store.allGrooves();

    // ── Chips with facet counts ──
    var genreOpts = ['Todos'].concat(DH.GENRES_LIST);
    renderChips(genreHost, genreOpts, state.genre, 'active', function (v) {
      state.genre = v === 'Todos' ? '' : v;
      state.page = 1; render();
    }, 'genre', all);

    var levelOpts = ['Todos'].concat(DH.LEVELS);
    renderChips(levelHost, levelOpts, state.level, 'active2', function (v) {
      state.level = v === 'Todos' ? '' : v;
      state.page = 1; render();
    }, 'level', all);

    // Tags: top 12 from boot data
    var tagCounts = {};
    all.forEach(function (g) { (g.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
    var topTags = Object.keys(tagCounts)
      .map(function (t) { return { tag: t, count: tagCounts[t] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 12);
    renderTagChips(tagHost, topTags);

    // ── Grid / List ──
    var grid = document.getElementById('s-grid');
    grid.className = state.view === 'list' ? 'results-host results-list' : 'results-host groove-grid groove-grid-6';
    grid.innerHTML = '';

    var inline = document.getElementById('results-count-inline');
    if (inline) inline.innerHTML = '<em>' + totalElements + '</em> ' + (totalElements === 1 ? 'resultado' : 'resultados') + (state.page > 1 ? ' - pagina ' + state.page + '/' + totalPages : '');
    document.querySelectorAll('#view-toggle button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });

    if (!grooves.length) {
      grid.appendChild(buildSmartEmpty(all));
    } else {
      if (state.view === 'list') {
        grooves.forEach(function (g) { grid.appendChild(buildListRow(g)); });
      } else {
        grooves.forEach(function (g) { grid.appendChild(DH.UI.grooveCard(g)); });
        if (state.page === totalPages && grooves.length < PAGE_SIZE) {
          var plus = document.createElement('div');
          plus.className = 'gcard gcard-plus';
          plus.innerHTML = '<div class="plus-icon">+</div><div class="plus-text">Subi <em>tu groove</em></div>';
          plus.addEventListener('click', function () { DH.Router.go('/upload'); });
          grid.appendChild(plus);
        }
      }
    }

    // ── Real pagination (server-side) ──
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

      // Show at most 7 page buttons, centered around current page
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
    renderSidebar(grooves, all);
  }

  function renderTrendingStrip(all) {
    var host = document.getElementById('trending-strip-wrap');
    var pool = state.genre ? all.filter(function (g) { return g.genre === state.genre; }) : all;
    var top = pool.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); }).slice(0, 8);
    if (top.length < 4) { host.innerHTML = ''; return; }
    var subLabel = state.genre ? ('Top ' + state.genre + ' de la semana') : 'Trending esta semana';
    host.innerHTML = ''
      + '<div class="trending-strip">'
      +   '<div class="trending-strip-head"><div class="trending-strip-eyebrow"><em>[ ]</em> ' + esc(subLabel) + '</div></div>'
      +   '<div class="trending-strip-scroll" id="trending-strip-scroll"></div>'
      + '</div>';
    var scroll = document.getElementById('trending-strip-scroll');
    top.forEach(function (g, i) {
      var el = document.createElement('div'); el.className = 'trending-card';
      el.innerHTML = ''
        + '<div class="tr-rank">' + (i + 1 < 10 ? '0' + (i + 1) : String(i + 1)) + '</div>'
        + '<div class="tr-body">'
        +   '<div class="tr-genre">' + esc(g.genre) + '</div>'
        +   '<div class="tr-title">' + esc(g.title) + '</div>'
        +   '<div class="tr-meta">' + g.bpm + ' BPM - <span>&#9829; ' + (g.likes || 0) + '</span></div>'
        + '</div>'
        + '<button class="btn-play-sm tr-play" data-play="1" title="Preview"><svg class="ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="5" y="5" width="14" height="14" rx="1"/></svg></button>';
      var playBtn = el.querySelector('.tr-play');
      var icoPlay = playBtn.querySelector('.ico-play');
      var icoStop = playBtn.querySelector('.ico-stop');
      var token = null;
      function setPlaying(on) {
        playBtn.classList.toggle('playing', on);
        el.classList.toggle('previewing', on);
        icoPlay.style.display = on ? 'none' : '';
        icoStop.style.display = on ? '' : 'none';
      }
      playBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (token && DH.PreviewPlayer.isPlaying(token)) { DH.PreviewPlayer.stop(); setPlaying(false); token = null; return; }
        setPlaying(true);
        token = DH.PreviewPlayer.play(g.pattern, g.bpm, function () { setPlaying(false); token = null; }, g.kit, g.timeSig);
      });
      el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
      scroll.appendChild(el);
    });
  }

  // Vista lista: una fila densa por groove con mini-grid horizontal compacta + meta
  function buildListRow(g) {
    var el = document.createElement('div'); el.className = 'list-row';
    el.innerHTML = ''
      + '<div class="lr-genre">' + esc(g.genre) + '</div>'
      + '<div class="lr-title">' + esc(g.title) + '</div>'
      + '<div class="lr-author">por ' + esc(g.author) + '</div>'
      + '<div class="lr-mini">' + DH.UI.miniGrid(g.pattern) + '</div>'
      + '<div class="lr-bpm">' + g.bpm + ' BPM</div>'
      + '<div class="lr-level">' + esc(g.level) + '</div>'
      + '<div class="lr-likes">&#9829; ' + (g.likes || 0) + '</div>'
      + '<button class="btn-play-sm lr-play" data-play="1" title="Preview"><svg class="ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="5" y="5" width="14" height="14" rx="1"/></svg></button>';
    var playBtn = el.querySelector('.lr-play');
    var icoPlay = playBtn.querySelector('.ico-play');
    var icoStop = playBtn.querySelector('.ico-stop');
    var token = null;
    function setPlaying(on) {
      playBtn.classList.toggle('playing', on);
      el.classList.toggle('previewing', on);
      icoPlay.style.display = on ? 'none' : '';
      icoStop.style.display = on ? '' : 'none';
    }
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (token && DH.PreviewPlayer.isPlaying(token)) { DH.PreviewPlayer.stop(); setPlaying(false); token = null; return; }
      setPlaying(true);
      token = DH.PreviewPlayer.play(g.pattern, g.bpm, function () { setPlaying(false); token = null; }, g.kit, g.timeSig);
    });
    el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
    return el;
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
      + (activeChips.length ? '<div class="empty-suggestions"><div class="empty-suggestions-label">Proba quitar:</div><div class="empty-suggestions-row" id="empty-sugg"></div></div>' : '<button class="btn-primary" data-clear-all>Reset</button>');

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
            bpmMinEl.value = 40; bpmMaxEl.value = 200; bpmLabel.textContent = '40 - 200';
            document.getElementById('s-q').value = '';
            state.page = 1; render();
          });
          host.appendChild(clearAll);
        }
        wrap.querySelectorAll('[data-clear-all]').forEach(function (b) {
          b.addEventListener('click', function () {
            state.q = ''; state.genre = ''; state.level = ''; state.tags = []; state.bpmMin = 40; state.bpmMax = 200;
            bpmMinEl.value = 40; bpmMaxEl.value = 200; bpmLabel.textContent = '40 - 200';
            document.getElementById('s-q').value = '';
            state.page = 1; render();
          });
        });
      }, 0);
    }
    return wrap;
  }

  function renderSidebar(grooves, all) {
    var af = document.getElementById('active-filters');
    af.innerHTML = '';
    var chips = [];
    if (state.q) chips.push({ key: 'q', label: '"' + state.q + '"' });
    if (state.genre) chips.push({ key: 'genre', label: state.genre });
    if (state.level) chips.push({ key: 'level', label: state.level });
    state.tags.forEach(function (t) { chips.push({ key: 'tag:' + t, label: '#' + t }); });
    if (state.bpmMin !== 40 || state.bpmMax !== 200) chips.push({ key: 'bpm', label: state.bpmMin + '-' + state.bpmMax + ' BPM' });
    if (state.sort !== 'trending') chips.push({ key: 'sort', label: 'Orden: ' + sortLabels[state.sort] });

    if (!chips.length) {
      af.innerHTML =
        '<span class="active-filter-chip demo">Funk <button data-demo-close="1" aria-label="Quitar">x</button></span>' +
        '<span class="active-filter-chip demo">Avanzado <button data-demo-close="1" aria-label="Quitar">x</button></span>';
      af.querySelectorAll('[data-demo-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { btn.parentElement.remove(); });
      });
    } else {
      chips.forEach(function (c) {
        var el = document.createElement('span'); el.className = 'active-filter-chip';
        el.innerHTML = esc(c.label) + ' <button data-clear="' + c.key + '" aria-label="Quitar">x</button>';
        af.appendChild(el);
      });
      af.querySelectorAll('[data-clear]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var k = btn.getAttribute('data-clear');
          if (k === 'q') { state.q = ''; document.getElementById('s-q').value = ''; }
          else if (k === 'genre') { state.genre = ''; }
          else if (k === 'level') { state.level = ''; }
          else if (k.indexOf('tag:') === 0) { var t = k.slice(4); state.tags = state.tags.filter(function (x) { return x !== t; }); }
          else if (k === 'bpm') { state.bpmMin = 40; state.bpmMax = 200; bpmMinEl.value = 40; bpmMaxEl.value = 200; bpmLabel.textContent = '40 - 200'; }
          else if (k === 'sort') { state.sort = 'trending'; document.getElementById('s-sort').value = 'trending'; }
          state.page = 1;
          render();
        });
      });
    }

    // Popular genres — from boot data corpus
    var pgHost = document.getElementById('popular-genres');
    pgHost.innerHTML = '';
    var byGenre = {};
    all.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
    var ranked = Object.keys(byGenre)
      .map(function (k) { return { name: k, count: byGenre[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 6);
    ranked.forEach(function (g) {
      var el = document.createElement('div'); el.className = 'pop-genre-row';
      el.innerHTML = '<span class="pop-genre-name">' + esc(g.name) + '</span><span class="pop-genre-count">' + g.count + '</span>';
      el.addEventListener('click', function () { state.genre = g.name; state.page = 1; render(); });
      pgHost.appendChild(el);
    });

    // Active drummers: DH.DRUMMERS ranked by groove count from DH.GROOVES (boot data)
    var ad = document.getElementById('active-drummers');
    ad.innerHTML = '';
    var allGroovesForCount = DH.GROOVES || [];
    var groovesByUser = {};
    allGroovesForCount.forEach(function (g) {
      var u = g.author || g.authorUsername;
      if (u) groovesByUser[u] = (groovesByUser[u] || 0) + 1;
    });
    var rankedDrummers = (DH.DRUMMERS || []).map(function (d) {
      return { d: d, count: groovesByUser[d.user] || 0 };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 4);
    rankedDrummers.forEach(function (item) {
      var d = item.d;
      var el = document.createElement('div'); el.className = 'follower-item';
      el.innerHTML = '<div class="follower-avatar" style="background:' + d.color + '20;color:' + d.color + '">' + esc(d.init) + '</div><span class="follower-name">' + esc(d.user) + '</span>';
      el.addEventListener('click', function () { DH.Router.go('/profile/' + d.user); });
      ad.appendChild(el);
    });

    renderSuggestions(all);
  }

  // Smart suggestions: scoring por overlap de genre + tags con favoritos del usuario.
  // Cold start (sin favs): top-trending de los ultimos segun likes y plays.
  function renderSuggestions(all) {
    var host = document.getElementById('suggestions-list');
    host.innerHTML = '';
    var favIds = DH.Store.getFavorites();
    var favs = favIds.map(function (id) { return DH.Store.findAnyGroove(id); }).filter(Boolean);

    var suggestions;
    if (favs.length) {
      var genreScore = {}, tagScore = {};
      favs.forEach(function (g) {
        genreScore[g.genre] = (genreScore[g.genre] || 0) + 3;
        (g.tags || []).forEach(function (t) { tagScore[t] = (tagScore[t] || 0) + 1; });
      });
      var scored = all
        .filter(function (g) { return favIds.indexOf(g.id) === -1; })
        .map(function (g) {
          var score = (genreScore[g.genre] || 0);
          (g.tags || []).forEach(function (t) { score += (tagScore[t] || 0); });
          return { g: g, score: score };
        })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 5);
      suggestions = scored.map(function (x) { return x.g; });
    }
    if (!suggestions || !suggestions.length) {
      suggestions = all.slice().sort(function (a, b) {
        return (b.likes || 0) * 2 + (b.plays || 0) - ((a.likes || 0) * 2 + (a.plays || 0));
      }).slice(0, 5);
    }

    if (!suggestions.length) {
      host.innerHTML = '<div style="font-size:0.7rem;color:var(--muted);font-weight:300;">Cuando guardes favoritos van a aparecer recomendaciones aca.</div>';
      return;
    }

    var label = favs.length
      ? '<div class="sugg-source">Basado en tus favoritos</div>'
      : '<div class="sugg-source">Top trending de la semana</div>';
    host.insertAdjacentHTML('beforeend', label);

    suggestions.forEach(function (g) {
      var el = document.createElement('div'); el.className = 'sugg-item';
      el.innerHTML = ''
        + '<div class="sugg-body">'
        +   '<div class="sugg-genre">' + esc(g.genre) + '</div>'
        +   '<div class="sugg-title">' + esc(g.title) + '</div>'
        +   '<div class="sugg-meta">' + g.bpm + ' BPM - &#9829; ' + (g.likes || 0) + '</div>'
        + '</div>'
        + '<button class="btn-play-sm sugg-play" data-play="1"><svg class="ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="5" y="5" width="14" height="14" rx="1"/></svg></button>';
      var playBtn = el.querySelector('.sugg-play');
      var icoPlay = playBtn.querySelector('.ico-play');
      var icoStop = playBtn.querySelector('.ico-stop');
      var token = null;
      function setPlaying(on) {
        playBtn.classList.toggle('playing', on);
        icoPlay.style.display = on ? 'none' : '';
        icoStop.style.display = on ? '' : 'none';
      }
      playBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (token && DH.PreviewPlayer.isPlaying(token)) { DH.PreviewPlayer.stop(); setPlaying(false); token = null; return; }
        setPlaying(true);
        token = DH.PreviewPlayer.play(g.pattern, g.bpm, function () { setPlaying(false); token = null; }, g.kit, g.timeSig);
      });
      el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
      host.appendChild(el);
    });
  }

  render();
};
