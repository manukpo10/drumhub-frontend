// Profile — visual layout aligned with mock/drumhub-perfil.html
window.DH = window.DH || {};
DH.pages = DH.pages || {};

// 6 fictional grooves used to fill out the grid when the user has fewer than 6 real ones.
// Mini-grid only renders hihat/snare/kick so we only need those three rows in the pattern.
function fictionalGrooves(author) {
  var base = [
    { genre: 'Funk',   title: 'Pocket Shuffle',  bpm: 94,  level: 'Intermedio', likes: 312,
      hihat:[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0] },
    { genre: 'Rock',   title: 'Open Highway',    bpm: 110, level: 'Básico',     likes: 187,
      hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0] },
    { genre: 'Jazz',   title: 'Brushes at Dawn', bpm: 124, level: 'Avanzado',   likes: 96,
      hihat:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], snare:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0] },
    { genre: 'Reggae', title: 'Steppers Drop',   bpm: 78,  level: 'Básico',     likes: 142,
      hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], kick:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
    { genre: 'Metal',  title: 'Wall of Toms',    bpm: 168, level: 'Avanzado',   likes: 76,
      hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { genre: 'Latin',  title: 'Clave Mood',      bpm: 102, level: 'Intermedio', likes: 134,
      hihat:[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0], snare:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0], kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] }
  ];
  return base.map(function (g, i) {
    return {
      id: 'demo-' + author + '-' + i,
      slug: g.title.toLowerCase().replace(/\s+/g, '-') + '-' + author,
      title: g.title,
      author: author,
      genre: g.genre,
      bpm: g.bpm,
      level: g.level,
      likes: g.likes,
      plays: g.likes * 7,
      pattern: { hihat: g.hihat, snare: g.snare, kick: g.kick }
    };
  });
}

DH.pages.profile = function (params) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('@' + params.user);
  var session = DH.Store.getUser();
  var isMe = session && session.user === params.user;
  var d = DH.findDrummer(params.user) || (isMe ? session : DH.UI.drummerOrFallback(params.user));

  var fromMock = DH.GROOVES.filter(function (g) { return g.author === d.user; });
  var fromUser = isMe ? DH.Store.getUserGrooves().filter(function (g) { return g.author === d.user; }) : [];
  var realGrooves = fromUser.concat(fromMock);
  // Always show at least 6 cards. Fill the gap with fictional examples (tagged so we know they're demo).
  var fillers = realGrooves.length >= 6 ? [] : fictionalGrooves(d.user).slice(0, 6 - realGrooves.length);
  var grooves = realGrooves.concat(fillers);

  // Favoritos: usa los reales del usuario (DH.Store.getFavorites). Si no tiene ninguno,
  // muestra un set demo tomado de DH.GROOVES (con slugs válidos) para no romper la navegación.
  var realFavs = isMe
    ? DH.Store.getFavorites().map(function (id) { return DH.Store.findAnyGroove(id); }).filter(Boolean)
    : [];
  var favs = realFavs.length
    ? realFavs
    : (isMe ? DH.GROOVES.slice(0, 8) : []);

  function pretty(n) { if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; return String(n); }

  // Stats reales (con fallback a mockup cuando el user no tiene datos propios).
  var realTotalLikes = realGrooves.reduce(function (acc, g) { return acc + (g.likes || 0); }, 0);
  var realTotalPlays = realGrooves.reduce(function (acc, g) { return acc + (g.plays || 0); }, 0);
  var hasRealData = realGrooves.length > 0;
  var STATS = hasRealData
    ? { grooves: grooves.length, likes: realTotalLikes, followers: d.followers || Math.max(20, Math.round(realTotalLikes / 5)), following: 12, plays: realTotalPlays }
    : { grooves: 12, likes: 847, followers: 224, following: 84, plays: 3200 };

  // Top groove (use real first; if none, use the best filler).
  var top = grooves.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];

  // Genre breakdown — distinct colors per genre
  var byGenre = {};
  grooves.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
  var genreEntries = Object.keys(byGenre).map(function (k) { return { name: k, count: byGenre[k] }; }).sort(function (a, b) { return b.count - a.count; });
  var genreColorMap = { Funk: '#ff4d00', Jazz: '#00c9ff', Rock: '#e8ff00', Metal: '#a855f7', Reggae: '#22c55e', Bossa: '#f43f5e', Blues: '#fb923c', Pop: '#84cc16', Soul: '#38bdf8', 'Hip-Hop': '#ffaa00', 'R&B': '#fb7185', Latin: '#22c55e' };

  // Followers / following pools
  var others = DH.DRUMMERS.filter(function (x) { return x.user !== d.user; });
  var followers = others.slice(0, 8);
  var following = others.slice(2, 6);

  // Activity — at least 5 items
  var activity = [
    { color: '#e8ff00', text: 'Subió <a data-go="/groove/' + esc(grooves[0].slug) + '">' + esc(grooves[0].title) + '</a>', time: 'hace 2 días' },
    { color: '#ff4d00', text: '<strong>jazzcat</strong> dejó un comentario en <a data-go="/groove/' + esc(grooves[0].slug) + '">' + esc(grooves[0].title) + '</a>', time: 'hace 3 días' },
    { color: '#00c9ff', text: 'Guardó <a data-go="/search">Double Bass 16th</a> de blastking', time: 'hace 4 días' },
    { color: '#e8ff00', text: 'Subió <a data-go="/groove/' + esc((grooves[1] || grooves[0]).slug) + '">' + esc((grooves[1] || grooves[0]).title) + '</a>', time: 'hace 5 días' },
    { color: '#a855f7', text: '<strong>drummaster</strong> empezó a seguirte', time: 'hace 1 semana' },
    { color: '#ff4d00', text: '<strong>funkybones</strong> le dio like a <a data-go="/groove/' + esc(grooves[0].slug) + '">' + esc(grooves[0].title) + '</a>', time: 'hace 1 semana' }
  ];

  var badges = '';
  badges += '<span class="badge top">⭐ Top Contribuidor</span>';
  if (DH.findDrummer(d.user)) badges += '<span class="badge verified">✓ Verificado</span>';
  genreEntries.slice(0, 2).forEach(function (g) { badges += '<span class="badge genre">' + esc(g.name) + '</span>'; });

  app.innerHTML = ''
    + '<div class="profile-hero-v2">'
    +   '<div class="profile-hero-bg" id="profile-hero-bg"></div>'
    +   '<div class="profile-hero-fade"></div>'
    +   '<div class="profile-hero-inner">'
    +     '<div class="profile-top">'
    +       DH.UI.drummerAvatar(d, { size: 100, color: d.color, ring: 3 })
    +       '<div class="profile-info-v2">'
    +         '<div class="profile-name-v2">' + esc(d.user) + '</div>'
    +         '<div class="profile-handle-v2">@' + esc(d.user) + ' · ' + esc(d.location || 'Buenos Aires, Argentina') + '</div>'
    +         '<div class="profile-bio-v2">' + esc(d.bio || 'Baterista hace varios años. Subo grooves que aprendí de mis favoritos y algunos propios.') + '</div>'
    +         '<div class="profile-badges">' + badges + '</div>'
    +       '</div>'
    +       '<div class="profile-actions-v2">'
    +         (isMe
          ? '<button class="btn-follow-lg" data-go="/upload">+ Subir groove</button><button class="btn-msg" id="change-avatar-btn" title="Cambiar avatar">✎ Avatar</button>'
          : '<button class="btn-follow-lg" id="profile-follow">+ Seguir</button><button class="btn-msg coming-soon" title="Próximamente — la mensajería está en desarrollo">✉ Mensaje</button>')
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="stats-bar">'
    +     '<div class="stat-cell"><div class="stat-num">' + STATS.grooves + '</div><div class="stat-label">Grooves</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + STATS.likes + '</div><div class="stat-label">Likes</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + STATS.followers + '</div><div class="stat-label">Seguidores</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + STATS.following + '</div><div class="stat-label">Siguiendo</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + pretty(STATS.plays) + '</div><div class="stat-label">Reproduc.</div></div>'
    +   '</div>'
    + '</div>'

    + '<div class="profile-tabs">'
    +   '<button class="profile-tab active" data-tab="grooves">Grooves (' + STATS.grooves + ')</button>'
    +   (isMe ? '<button class="profile-tab" data-tab="favs">Favoritos (8)</button>' : '')
    +   '<button class="profile-tab" data-tab="activity">Actividad</button>'
    +   '<button class="profile-tab" data-tab="followers">Seguidores (' + STATS.followers + ')</button>'
    + '</div>'

    + '<div class="main2">'
    +   '<div class="col-left">'

    +     (top
        ? '<div class="top-groove" data-go="/groove/' + esc(top.slug) + '">'
          + '<div class="tg-label">🏆 Groove más popular</div>'
          + '<div class="tg-title">' + esc(top.title) + '</div>'
          + '<div class="tg-meta">' + esc(top.genre) + ' · ' + top.bpm + ' BPM · ' + esc(top.level) + '</div>'
          + '<div class="tg-stats">'
          +   '<span class="tg-stat"><em>' + pretty(top.plays || 0) + '</em> reproduc.</span>'
          +   '<span class="tg-stat"><em>' + (top.likes || 0) + '</em> likes</span>'
          +   '<span class="tg-stat"><em>' + Math.round((top.likes || 0) / 6) + '</em> guardados</span>'
          + '</div>'
          + DH.UI.miniGrid({
              hihat: [1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0],
              snare: [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
              kick:  [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]
            })
          + '</div>'
        : '')

    +     '<div id="tab-content"></div>'

    +   '</div>'

    +   '<div class="sidebar-col">'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Grooves por <em>género</em></div>'
    +       '<div class="genre-breakdown" id="genre-breakdown"></div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Actividad <em>reciente</em></div>'
    +       '<div class="activity-list-v2" id="activity-side"></div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Bateristas que <em>sigue</em></div>'
    +       '<div class="followers-grid" id="following-grid"></div>'
    +     '</div>'

    +   '</div>'
    + '</div>';

  // ── Animated hero background grid (same as home) ──
  DH.UI.heroBg(document.getElementById('profile-hero-bg'));

  // ── Genre breakdown ──
  var gbHost = document.getElementById('genre-breakdown');
  if (!genreEntries.length) {
    gbHost.innerHTML = '<div style="font-size:0.72rem;color:var(--muted);font-weight:300;">Sin grooves todavía.</div>';
  } else {
    genreEntries.forEach(function (g) {
      var pct = Math.round((g.count / STATS.grooves) * 100);
      var color = genreColorMap[g.name] || '#6b6860';
      var el = document.createElement('div'); el.className = 'gb-item';
      el.innerHTML = '<span class="gb-name">' + esc(g.name) + '</span><div class="gb-bar"><div class="gb-fill" style="width:' + pct + '%;background:' + color + '"></div></div><span class="gb-count">' + g.count + '</span>';
      gbHost.appendChild(el);
    });
  }

  // ── Activity ──
  var actHost = document.getElementById('activity-side');
  activity.forEach(function (a) {
    var el = document.createElement('div'); el.className = 'act-item-v2';
    el.innerHTML = '<div class="act-dot" style="background:' + a.color + '"></div><div><div class="act-text-v2">' + a.text + '</div><div class="act-time-v2">' + esc(a.time) + '</div></div>';
    actHost.appendChild(el);
  });

  // ── Following (4 avatars) ──
  var followGrid = document.getElementById('following-grid');
  following.slice(0, 4).forEach(function (p) {
    var el = document.createElement('div'); el.className = 'follower-item';
    el.innerHTML = '<div class="follower-avatar" style="background:' + p.color + '20;color:' + p.color + '">' + esc(p.init) + '</div><span class="follower-name">' + esc(p.user) + '</span>';
    el.addEventListener('click', function () { DH.Router.go('/profile/' + p.user); });
    followGrid.appendChild(el);
  });

  // ── Tabs ──
  var content = document.getElementById('tab-content');
  function renderTab(name) {
    content.innerHTML = '';
    if (name === 'grooves') {
      var grid = document.createElement('div'); grid.className = 'groove-grid';
      grooves.forEach(function (g) { grid.appendChild(DH.UI.grooveCard(g)); });
      content.appendChild(grid);
    } else if (name === 'favs') {
      if (!favs.length) {
        content.innerHTML = '<div class="empty"><h4>Sin favoritos</h4><p>Guardá los grooves que estás practicando.</p><button class="btn-primary" onclick="DH.Router.go(\'/search\')">Explorar grooves</button></div>';
        return;
      }
      var list = document.createElement('div'); list.style.display = 'flex'; list.style.flexDirection = 'column'; list.style.gap = '2px';
      favs.forEach(function (f) {
        var el = document.createElement('div'); el.className = 'fav-item';
        el.innerHTML = '<div><div class="fav-genre">' + esc(f.genre) + '</div><div class="fav-title">' + esc(f.title) + '</div><div class="fav-meta">por ' + esc(f.author) + ' · ' + f.bpm + ' BPM · ' + esc(f.level) + '</div></div><button class="rc-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
        el.addEventListener('click', function () { DH.Router.go('/groove/' + f.slug); });
        list.appendChild(el);
      });
      content.appendChild(list);
    } else if (name === 'activity') {
      var wrap = document.createElement('div'); wrap.className = 'sidebar-card-v2'; wrap.style.padding = '24px';
      wrap.innerHTML = '<div class="section-title-sm">Toda la <em>actividad</em></div><div class="activity-list-v2" id="act-main"></div>';
      content.appendChild(wrap);
      var actMain = wrap.querySelector('#act-main');
      activity.forEach(function (a) {
        var el = document.createElement('div'); el.className = 'act-item-v2';
        el.innerHTML = '<div class="act-dot" style="background:' + a.color + '"></div><div><div class="act-text-v2">' + a.text + '</div><div class="act-time-v2">' + esc(a.time) + '</div></div>';
        actMain.appendChild(el);
      });
      actMain.querySelectorAll('[data-go]').forEach(function (el) { el.addEventListener('click', function () { DH.Router.go(el.getAttribute('data-go')); }); });
    } else if (name === 'followers') {
      var wrap2 = document.createElement('div'); wrap2.className = 'sidebar-card-v2'; wrap2.style.padding = '24px';
      wrap2.innerHTML = '<div class="section-title-sm">Seguidores</div><div class="followers-grid" id="follow-main" style="grid-template-columns:repeat(auto-fill,minmax(80px,1fr));"></div>';
      content.appendChild(wrap2);
      var fm = wrap2.querySelector('#follow-main');
      followers.forEach(function (p) {
        var el = document.createElement('div'); el.className = 'follower-item';
        el.innerHTML = '<div class="follower-avatar" style="background:' + p.color + '20;color:' + p.color + '">' + esc(p.init) + '</div><span class="follower-name">' + esc(p.user) + '</span>';
        el.addEventListener('click', function () { DH.Router.go('/profile/' + p.user); });
        fm.appendChild(el);
      });
    }
  }
  renderTab('grooves');
  app.querySelectorAll('.profile-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      app.querySelectorAll('.profile-tab').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      renderTab(t.getAttribute('data-tab'));
    });
  });

  var fb = document.getElementById('profile-follow');
  if (fb) fb.addEventListener('click', function () {
    fb.classList.toggle('following');
    fb.textContent = fb.classList.contains('following') ? '✓ Siguiendo' : '+ Seguir';
  });

  var changeAv = document.getElementById('change-avatar-btn');
  if (changeAv) changeAv.addEventListener('click', function () {
    DH.UI.openAvatarPicker(function () { DH.Router.go('/profile/' + DH.Store.getUser().user); });
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
