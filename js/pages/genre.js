// Genre detail page — /genre/:slug
window.DH = window.DH || {};
DH.pages = DH.pages || {};

var GENRE_PAGE_SIZE = 12;

// Find the GENRE entry whose slug matches (case-insensitive).
function findGenreByName(name) {
  if (!name) return null;
  var lower = name.toLowerCase();
  // Try exact match first
  var direct = (DH.GENRES || []).find(function (g) { return g.name.toLowerCase() === lower; });
  if (direct) return direct;
  // Try INFO key match
  var key = Object.keys(DH.GENRE_INFO || {}).find(function (k) {
    var info = DH.GENRE_INFO[k];
    return k.toLowerCase() === lower || (info.slug && info.slug.toLowerCase() === lower);
  });
  if (key) return { name: key, icon: '', count: (DH.GENRES.find(function (g) { return g.name === key; }) || {}).count || 0 };
  return null;
}

// Filler grooves so the grid always has 12+ cards even if the genre has few real ones.
function fillerGroovesFor(genreName) {
  var titles = ['Pocket Groove', 'Open Highway', 'Late Night', 'Backbeat', 'Steppers', 'Cold Sweat', 'Tight Pocket', 'Smooth Ride', 'Deep Cut', 'Soft Touch', 'Roll Out', 'After Hours'];
  var authors = ['drummaster', 'funkybones', 'jazzcat', 'beatmaker', 'roots_r', 'zep_fan', 'samba_b', 'bernardp', 'drumqueen'];
  return titles.map(function (t, i) {
    var bpm = 75 + ((i * 13) % 80);
    var lvl = ['Básico', 'Intermedio', 'Avanzado'][i % 3];
    return {
      id: 'demo-' + genreName + '-' + i,
      slug: t.toLowerCase().replace(/\s+/g, '-') + '-' + genreName.toLowerCase() + '-' + i,
      title: t, author: authors[i % authors.length],
      genre: genreName, bpm: bpm, level: lvl,
      likes: 50 + ((i * 37) % 280),
      plays: 300 + ((i * 89) % 1800),
      pattern: {
        hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
        snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        kick:  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]
      }
    };
  });
}

DH.pages.genre = function (params, query) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;

  var genre = findGenreByName(params.slug);
  if (!genre) {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Género no encontrado</h4><p>Probá con: Rock, Funk, Jazz, Metal, Reggae, Latin.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
    return;
  }

  var info = (DH.GENRE_INFO && DH.GENRE_INFO[genre.name]) || DH.DEFAULT_GENRE_INFO;
  var color = info.color || 'var(--accent)';
  DH.Router.setTitle(genre.name + ' · Grooves');

  // Grooves del género: reales del mock + user-uploaded + fillers si hay <12
  var realGrooves = DH.Store.allGrooves().filter(function (g) { return g.genre === genre.name; });
  var fillers = realGrooves.length >= GENRE_PAGE_SIZE
    ? []
    : fillerGroovesFor(genre.name).slice(0, GENRE_PAGE_SIZE - realGrooves.length);
  var grooves = realGrooves.concat(fillers);

  var featured = grooves.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];

  var page = parseInt(query.page, 10) || 1;
  var totalPages = Math.max(1, Math.ceil(grooves.length / GENRE_PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  app.innerHTML = ''
    + '<div class="genre-hero" style="--genre-color:' + color + '">'
    +   '<div class="genre-hero-bg" id="genre-hero-bg"></div>'
    +   '<div class="genre-hero-fade"></div>'
    +   '<div class="genre-hero-mark">' + DH.genreIconSvg(genre.name, { size: 320, color: color, strokeWidth: 1 }) + '</div>'
    +   '<div class="genre-hero-inner">'
    +     '<div class="breadcrumb">'
    +       '<a data-go="/">Inicio</a><span>/</span>'
    +       '<a data-go="/genres">Géneros</a><span>/</span>'
    +       esc(genre.name)
    +     '</div>'
    +     '<h1 class="genre-title">' + esc(genre.name.toUpperCase()) + '</h1>'
    +     '<div class="genre-meta">'
    +       '<span><em>' + (genre.count || grooves.length) + '</em> grooves</span>'
    +       '<span class="dot">·</span>'
    +       '<span>' + esc(info.level) + '</span>'
    +       '<span class="dot">·</span>'
    +       '<span>' + info.bpmMin + '–' + info.bpmMax + ' BPM</span>'
    +     '</div>'
    +     '<p class="genre-desc">' + esc(info.description) + '</p>'
    +     (info.subgenres && info.subgenres.length
        ? '<div class="genre-subgenres">'
          + info.subgenres.map(function (s) { return '<span class="sub-tag" data-search="' + esc(s) + '">' + esc(s) + '</span>'; }).join('')
          + '</div>'
        : '')
    +   '</div>'
    + '</div>'

    + '<div class="main2">'
    +   '<div class="col-left">'

    +     (featured
        ? '<div class="genre-featured" data-go="/groove/' + esc(featured.slug) + '">'
          + '<div class="gf-label">🏆 Groove más popular del género</div>'
          + '<div class="gf-top">'
          +   '<div>'
          +     '<div class="gf-genre">' + esc(featured.genre) + '</div>'
          +     '<div class="gf-title">' + esc(featured.title) + '</div>'
          +     '<div class="gf-meta">por <span>' + esc(featured.author) + '</span> · ' + featured.bpm + ' BPM · ' + esc(featured.level) + '</div>'
          +   '</div>'
          +   '<div class="gf-stats">'
          +     '<div class="gf-stat"><div class="n">' + (featured.plays || 0) + '</div><div class="l">Plays</div></div>'
          +     '<div class="gf-stat"><div class="n">' + (featured.likes || 0) + '</div><div class="l">Likes</div></div>'
          +     '<div class="gf-stat"><div class="n">' + Math.round((featured.likes || 0) / 6) + '</div><div class="l">Saved</div></div>'
          +   '</div>'
          + '</div>'
          + DH.UI.miniGrid(featured.pattern)
          + '</div>'
        : '')

    +     '<div class="section-block">'
    +       '<div class="section-head"><div><div class="section-eyebrow"><em>[ 01 ]</em> ' + esc(genre.name) + ' grooves</div><div class="section-title">Todos los <em>grooves</em></div></div></div>'
    +       '<div class="groove-grid groove-grid-6" id="genre-grid"></div>'
    +       '<div class="pagination" id="genre-pagination"></div>'
    +     '</div>'

    +     (info.drummers && info.drummers.length
        ? '<div class="section-block">'
          + '<div class="section-head"><div><div class="section-eyebrow"><em>[ 02 ]</em> Referentes</div><div class="section-title">Bateristas <em>' + esc(genre.name) + '</em></div></div></div>'
          + '<div class="drummer-ref-row" id="drummer-refs"></div>'
          + '</div>'
        : '')

    +   '</div>'

    +   '<div class="sidebar-col">'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Info del <em>género</em></div>'
    +       '<div class="info-list">'
    +         '<div class="info-item"><span class="info-key">BPM típico</span><span class="info-val"><em>' + info.bpmMin + '–' + info.bpmMax + '</em></span></div>'
    +         '<div class="info-item"><span class="info-key">Compás</span><span class="info-val">' + esc(info.timeSig) + '</span></div>'
    +         '<div class="info-item"><span class="info-key">Nivel</span><span class="info-val"><em>' + esc(info.level) + '</em></span></div>'
    +         '<div class="info-item"><span class="info-key">Grooves</span><span class="info-val"><em>' + (genre.count || grooves.length) + '</em></span></div>'
    +       '</div>'
    +     '</div>'

    +     (info.subgenres && info.subgenres.length
        ? '<div class="sidebar-card-v2">'
          + '<div class="section-title-sm">Sub-<em>géneros</em></div>'
          + '<div class="subgenre-list">'
          + info.subgenres.map(function (s) { return '<div class="sub-link" data-search="' + esc(s) + '">' + esc(s) + ' <span>→</span></div>'; }).join('')
          + '</div>'
          + '</div>'
        : '')

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Géneros <em>similares</em></div>'
    +       '<div class="related-genres" id="related-genres"></div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Top 5 <em>esta semana</em></div>'
    +       '<div class="top-week" id="top-week"></div>'
    +     '</div>'

    +   '</div>'
    + '</div>';

  // ── Animated bg (same as home) ──
  DH.UI.heroBg(document.getElementById('genre-hero-bg'));

  // ── Grid + pagination ──
  var grid = document.getElementById('genre-grid');
  var start = (page - 1) * GENRE_PAGE_SIZE;
  grooves.slice(start, start + GENRE_PAGE_SIZE).forEach(function (g) { grid.appendChild(DH.UI.grooveCard(g)); });

  var pg = document.getElementById('genre-pagination');
  if (totalPages > 1) {
    var prev = document.createElement('button');
    prev.className = 'page-btn' + (page === 1 ? ' disabled' : '');
    prev.innerHTML = '← Anterior';
    prev.addEventListener('click', function () { if (page > 1) DH.Router.go('/genre/' + (info.slug || genre.name.toLowerCase()) + '?page=' + (page - 1)); });
    pg.appendChild(prev);
    for (var p = 1; p <= totalPages; p++) {
      var b = document.createElement('button');
      b.className = 'page-btn page-num' + (page === p ? ' active' : '');
      b.textContent = p;
      (function (target) { b.addEventListener('click', function () { DH.Router.go('/genre/' + (info.slug || genre.name.toLowerCase()) + '?page=' + target); }); })(p);
      pg.appendChild(b);
    }
    var next = document.createElement('button');
    next.className = 'page-btn' + (page === totalPages ? ' disabled' : '');
    next.innerHTML = 'Siguiente →';
    next.addEventListener('click', function () { if (page < totalPages) DH.Router.go('/genre/' + (info.slug || genre.name.toLowerCase()) + '?page=' + (page + 1)); });
    pg.appendChild(next);
  }

  // ── Drummer references ──
  if (info.drummers && info.drummers.length) {
    var dr = document.getElementById('drummer-refs');
    info.drummers.forEach(function (d) {
      var el = document.createElement('div'); el.className = 'drummer-ref-card';
      el.innerHTML = ''
        + '<div class="dref-avatar" style="background:' + d.color + '20;color:' + d.color + ';border-color:' + d.color + '">' + esc(d.init) + '</div>'
        + '<div class="dref-name">' + esc(d.name) + '</div>'
        + '<div class="dref-role">' + esc(d.role) + '</div>'
        + '<div class="dref-grooves"><em>' + d.grooves + '</em> grooves</div>';
      dr.appendChild(el);
    });
  }

  // ── Related genres ──
  var rg = document.getElementById('related-genres');
  (info.related || []).forEach(function (name) {
    var rGenre = DH.GENRE_INFO[name] || {};
    var rCount = (DH.GENRES.find(function (gg) { return gg.name === name; }) || {}).count || 0;
    var el = document.createElement('div'); el.className = 'related-genre-row';
    el.innerHTML = '<span class="rg-name" style="color:' + (rGenre.color || 'var(--text)') + '">' + esc(name) + '</span><span class="rg-count">' + rCount + '</span>';
    el.addEventListener('click', function () { DH.Router.go('/genre/' + (rGenre.slug || name.toLowerCase())); });
    rg.appendChild(el);
  });

  // ── Top 5 of the week (just top 5 of the genre by likes) ──
  var tw = document.getElementById('top-week');
  grooves.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); }).slice(0, 5).forEach(function (g, i) {
    var el = document.createElement('div'); el.className = 'top-week-row';
    el.innerHTML = '<span class="tw-rank">' + String(i + 1).padStart(2, '0') + '</span><span class="tw-title">' + esc(g.title) + '</span><span class="tw-likes">♥ ' + (g.likes || 0) + '</span>';
    el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
    tw.appendChild(el);
  });

  // ── Sub-genre / subgenre tag → search query ──
  app.querySelectorAll('[data-search]').forEach(function (el) {
    el.addEventListener('click', function () {
      DH.Router.go('/search?q=' + encodeURIComponent(el.getAttribute('data-search')));
    });
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
