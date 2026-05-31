// Profile — visual layout aligned with mock/drumhub-perfil.html
window.DH = window.DH || {};
DH.pages = DH.pages || {};


DH.pages.profile = function (params) {
  var app = document.getElementById('app');
  var username = params.user;

  // Show loading state while fetching
  app.innerHTML = '<div class="page"><div class="empty"><p style="color:var(--muted)">Cargando perfil...</p></div></div>';
  DH.Router.setTitle('@' + username);

  // Fetch user + their grooves + followers/following in parallel
  Promise.all([
    DH.Api.getUser(username),
    DH.Api.getGrooves({ size: 100 }),
    DH.Api.getFollowers(username),
    DH.Api.getFollowing(username)
  ]).then(function (results) {
    var apiUser = results[0];
    var groovesPage = results[1];
    var followersPage = results[2];
    var followingPage = results[3];

    if (!apiUser) {
      app.innerHTML = '<div class="page"><div class="empty"><h4>Perfil no encontrado</h4><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver</button></div></div>';
      return;
    }

    var d = DH.Adapter.user(apiUser);
    var allApiGrooves = (groovesPage && groovesPage.content || []).map(DH.Adapter.groove);
    var apiUserGrooves = allApiGrooves.filter(function (g) { return g.author === username; });
    var followersCount = (followersPage && followersPage.totalElements) || (followersPage && followersPage.content && followersPage.content.length) || 0;
    var followingCount = (followingPage && followingPage.totalElements) || (followingPage && followingPage.content && followingPage.content.length) || 0;
    var followersUsers = (followersPage && followersPage.content) || [];
    var followingUsers = (followingPage && followingPage.content) || [];

    _renderProfile(app, d, apiUserGrooves, followersCount, followingCount, followersUsers, followingUsers, params);
  }).catch(function () {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Error cargando perfil</h4><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver</button></div></div>';
  });
};

function _renderProfile(app, d, apiGrooves, followersCount, followingCount, followersUsers, followingUsers, params) {
  var esc = DH.UI.escape;
  var session = DH.Store.getUser();
  var isMe = session && session.user === d.user;
  // Am I already following this profile? Derive it from its followers list (already fetched) —
  // no extra request needed. The followers come from the backend as raw UserResponse (.username).
  var iFollow = !!session && !isMe && (followersUsers || []).some(function (fu) {
    return (fu.username || fu.user) === session.user;
  });

  // Merge API grooves with any locally-stored grooves for the current user
  var fromUser = isMe ? DH.Store.getUserGrooves().filter(function (g) { return g.author === d.user; }) : [];
  var realGrooves = fromUser.concat(apiGrooves.filter(function (ag) {
    return !fromUser.some(function (ug) { return String(ug.id) === String(ag.id); });
  }));

  var grooves = realGrooves;

  // Favorites: real from localStorage for current user
  var realFavs = isMe
    ? DH.Store.getFavorites().map(function (id) { return DH.Store.findAnyGroove(id); }).filter(Boolean)
    : [];
  var favs = realFavs;

  function pretty(n) { if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; return String(n); }

  var realTotalLikes = realGrooves.reduce(function (acc, g) { return acc + (g.likes || 0); }, 0);
  var realTotalPlays = realGrooves.reduce(function (acc, g) { return acc + (g.plays || 0); }, 0);
  var STATS = { grooves: realGrooves.length, likes: realTotalLikes, followers: followersCount, following: followingCount, plays: realTotalPlays };

  // Top groove
  var top = grooves.length ? grooves.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0] : null;

  // Genre breakdown
  var byGenre = {};
  grooves.forEach(function (g) { byGenre[g.genre] = (byGenre[g.genre] || 0) + 1; });
  var genreEntries = Object.keys(byGenre).map(function (k) { return { name: k, count: byGenre[k] }; }).sort(function (a, b) { return b.count - a.count; });
  var genreColorMap = { Funk: '#ff4d00', Jazz: '#00c9ff', Rock: '#e8ff00', Metal: '#a855f7', Reggae: '#22c55e', Bossa: '#f43f5e', Blues: '#fb923c', Pop: '#84cc16', Soul: '#38bdf8', 'Hip-Hop': '#ffaa00', 'R&B': '#fb7185', Latin: '#22c55e' };

  // Followers / following — prefer API data, fall back to mock pool
  var followersDisplay = followersUsers.length
    ? followersUsers.map(function (u) { return DH.Adapter.user(u); })
    : DH.DRUMMERS.filter(function (x) { return x.user !== d.user; }).slice(0, 8);
  var followingDisplay = followingUsers.length
    ? followingUsers.map(function (u) { return DH.Adapter.user(u); })
    : DH.DRUMMERS.filter(function (x) { return x.user !== d.user; }).slice(2, 6);

  function relTime(ms) {
    var diff = Date.now() - ms;
    var min = Math.floor(diff / 60000);
    if (min < 1)   return 'ahora mismo';
    if (min < 60)  return 'hace ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24)    return 'hace ' + h + ' h';
    var days = Math.floor(h / 24);
    if (days < 7)  return 'hace ' + days + (days === 1 ? ' día' : ' días');
    var weeks = Math.floor(days / 7);
    if (weeks < 5) return 'hace ' + weeks + (weeks === 1 ? ' semana' : ' semanas');
    return 'hace ' + Math.floor(days / 30) + ' meses';
  }

  // Groove publication events — available for any profile, derived from createdAt
  var grooveEvents = realGrooves
    .filter(function (g) { return g.createdAt; })
    .slice()
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .map(function (g) {
      return {
        color: '#e8ff00',
        text: (isMe ? 'Subiste' : 'Subió') + ' <a data-go="/groove/' + esc(g.slug) + '">' + esc(g.title) + '</a>',
        time: relTime(new Date(g.createdAt).getTime()),
        _ts: new Date(g.createdAt).getTime()
      };
    });

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
    +         '<div class="profile-handle-v2">@' + esc(d.user) + (d.location ? ' · ' + esc(d.location) : '') + '</div>'
    +         (d.bio ? '<div class="profile-bio-v2">' + esc(d.bio) + '</div>' : '')
    +         '<div class="profile-badges">' + badges + '</div>'
    +       '</div>'
    +       '<div class="profile-actions-v2">'
    +         (isMe
          ? '<button class="btn-follow-lg" data-go="/upload">+ Subir groove</button><button class="btn-msg" id="change-avatar-btn" title="Cambiar avatar">✎ Avatar</button>'
          : '<button class="btn-follow-lg' + (iFollow ? ' following' : '') + '" id="profile-follow">' + (iFollow ? '✓ Siguiendo' : '+ Seguir') + '</button><button class="btn-msg coming-soon" title="Próximamente — la mensajería está en desarrollo">✉ Mensaje</button>')
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="stats-bar">'
    +     '<div class="stat-cell stat-clickable" data-go-tab="grooves"><div class="stat-num">' + STATS.grooves + '</div><div class="stat-label">Grooves</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + STATS.likes + '</div><div class="stat-label">Likes</div></div>'
    +     '<div class="stat-cell stat-clickable" data-go-tab="followers"><div class="stat-num">' + STATS.followers + '</div><div class="stat-label">Seguidores</div></div>'
    +     '<div class="stat-cell stat-clickable" data-go-tab="following"><div class="stat-num">' + STATS.following + '</div><div class="stat-label">Siguiendo</div></div>'
    +     '<div class="stat-cell"><div class="stat-num">' + pretty(STATS.plays) + '</div><div class="stat-label">Reproduc.</div></div>'
    +   '</div>'
    + '</div>'

    + '<div class="profile-tabs">'
    +   '<button class="profile-tab active" data-tab="grooves">Grooves (' + STATS.grooves + ')</button>'
    +   (isMe ? '<button class="profile-tab" data-tab="favs">Favoritos (' + DH.Store.getFavorites().length + ')</button>' : '')
    +   '<button class="profile-tab" data-tab="activity">Actividad</button>'
    +   '<button class="profile-tab" data-tab="followers">Seguidores (' + STATS.followers + ')</button>'
    +   '<button class="profile-tab" data-tab="following">Siguiendo (' + STATS.following + ')</button>'
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

  // ── Activity sidebar (groove publications only — sync, no fetch needed) ──
  var actHost = document.getElementById('activity-side');
  var sideEvents = grooveEvents.slice(0, 5);
  if (!sideEvents.length) {
    actHost.innerHTML = '<div style="font-size:0.72rem;color:var(--muted);font-weight:300;">Sin actividad reciente.</div>';
  } else {
    sideEvents.forEach(function (a) {
      var el = document.createElement('div'); el.className = 'act-item-v2';
      el.innerHTML = '<div class="act-dot" style="background:' + a.color + '"></div><div><div class="act-text-v2">' + a.text + '</div><div class="act-time-v2">' + esc(a.time) + '</div></div>';
      actHost.appendChild(el);
    });
  }

  // ── Following (4 avatars) ──
  var followGrid = document.getElementById('following-grid');
  followingDisplay.slice(0, 4).forEach(function (p) {
    var el = document.createElement('div'); el.className = 'follower-item';
    el.innerHTML = '<div class="follower-avatar" style="background:' + (p.color || '#6b6860') + '20;color:' + (p.color || '#6b6860') + '">' + esc(p.init || (p.user || '?')[0].toUpperCase()) + '</div><span class="follower-name">' + esc(p.user) + '</span>';
    el.addEventListener('click', function () { DH.Router.go('/profile/' + p.user); });
    followGrid.appendChild(el);
  });

  // ── Tabs ──
  var content = document.getElementById('tab-content');
  function renderTab(name) {
    content.innerHTML = '';
    if (name === 'grooves') {
      if (!grooves.length) {
        content.innerHTML = '<div class="empty"><h4>Sin grooves todavía</h4><p>Este baterista no subió grooves aún.</p>'
          + (isMe ? '<button class="btn-primary" onclick="DH.Router.go(\'/upload\')">+ Subir groove</button>' : '')
          + '</div>';
        return;
      }
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
      wrap.innerHTML = '<div class="section-title-sm">Actividad <em>reciente</em></div>'
        + '<div class="activity-list-v2" id="act-main"><p style="font-size:0.78rem;color:var(--muted);font-weight:300;">Cargando...</p></div>';
      content.appendChild(wrap);
      var actMain = wrap.querySelector('#act-main');

      function renderActivityItems(items) {
        actMain.innerHTML = '';
        if (!items.length) {
          actMain.innerHTML = '<p style="font-size:0.78rem;color:var(--muted);font-weight:300;">Sin actividad reciente.</p>';
          return;
        }
        items.forEach(function (a) {
          var el = document.createElement('div'); el.className = 'act-item-v2';
          el.innerHTML = '<div class="act-dot" style="background:' + a.color + '"></div><div><div class="act-text-v2">' + a.text + '</div><div class="act-time-v2">' + esc(a.time) + '</div></div>';
          actMain.appendChild(el);
        });
        actMain.querySelectorAll('[data-go]').forEach(function (lnk) {
          lnk.addEventListener('click', function () { DH.Router.go(lnk.getAttribute('data-go')); });
        });
      }

      if (isMe) {
        DH.Notifications.refresh().then(function (notifs) {
          var notifEvents = notifs.slice(0, 20).map(function (n) {
            var who = '<strong>' + esc(n.user || '?') + '</strong>';
            var gl = n.grooveSlug ? ' <a data-go="/groove/' + esc(n.grooveSlug) + '">' + esc(n.grooveTitle || 'groove') + '</a>' : '';
            var color, text;
            if (n.type === 'like') {
              color = '#ff4d00'; text = who + ' le dio like a' + gl;
            } else if (n.type === 'comment') {
              color = '#00c9ff'; text = who + ' comentó en' + gl + (n.snippet ? '<div class="ndd-snippet">"' + esc(n.snippet) + '"</div>' : '');
            } else if (n.type === 'follow') {
              color = '#a855f7'; text = who + ' empezó a seguirte';
            } else if (n.type === 'mention') {
              color = '#22c55e'; text = who + ' te mencionó en' + gl;
            } else {
              color = '#6b6860'; text = who + ' interactuó con tu perfil';
            }
            return { color: color, text: text, time: relTime(n.time), _ts: n.time };
          });
          // Merge notifications + groove publications, sort newest first
          var all = notifEvents.concat(grooveEvents).sort(function (a, b) { return (b._ts || 0) - (a._ts || 0); });
          renderActivityItems(all.slice(0, 25));
        }).catch(function () { renderActivityItems(grooveEvents); });
      } else {
        // Other profiles: only their groove publications (no access to their notifications)
        renderActivityItems(grooveEvents);
      }
    } else if (name === 'followers') {
      var wrap2 = document.createElement('div'); wrap2.className = 'sidebar-card-v2'; wrap2.style.padding = '24px';
      wrap2.innerHTML = '<div class="section-title-sm">Seguidores</div>'
        + (!followersDisplay.length ? '<p style="font-size:0.78rem;color:var(--muted);font-weight:300;">Todavía nadie sigue a este baterista.</p>' : '')
        + '<div class="followers-grid" id="follow-main" style="grid-template-columns:repeat(auto-fill,minmax(80px,1fr));"></div>';
      content.appendChild(wrap2);
      var fm = wrap2.querySelector('#follow-main');
      followersDisplay.forEach(function (p) {
        var el = document.createElement('div'); el.className = 'follower-item';
        el.innerHTML = '<div class="follower-avatar" style="background:' + (p.color || '#6b6860') + '20;color:' + (p.color || '#6b6860') + '">' + esc(p.init || (p.user || '?')[0].toUpperCase()) + '</div><span class="follower-name">' + esc(p.user) + '</span>';
        el.addEventListener('click', function () { DH.Router.go('/profile/' + p.user); });
        fm.appendChild(el);
      });
    } else if (name === 'following') {
      var wrap3 = document.createElement('div'); wrap3.className = 'sidebar-card-v2'; wrap3.style.padding = '24px';
      wrap3.innerHTML = '<div class="section-title-sm">Siguiendo</div>'
        + (!followingDisplay.length ? '<p style="font-size:0.78rem;color:var(--muted);font-weight:300;">Este baterista no sigue a nadie todavía.</p>' : '')
        + '<div class="followers-grid" id="following-main" style="grid-template-columns:repeat(auto-fill,minmax(80px,1fr));"></div>';
      content.appendChild(wrap3);
      var fm3 = wrap3.querySelector('#following-main');
      followingDisplay.forEach(function (p) {
        var el = document.createElement('div'); el.className = 'follower-item';
        el.innerHTML = '<div class="follower-avatar" style="background:' + (p.color || '#6b6860') + '20;color:' + (p.color || '#6b6860') + '">' + esc(p.init || (p.user || '?')[0].toUpperCase()) + '</div><span class="follower-name">' + esc(p.user) + '</span>';
        el.addEventListener('click', function () { DH.Router.go('/profile/' + p.user); });
        fm3.appendChild(el);
      });
    }
  }
  function activateTab(name) {
    app.querySelectorAll('.profile-tab').forEach(function (x) { x.classList.remove('active'); });
    var target = app.querySelector('.profile-tab[data-tab="' + name + '"]');
    if (target) target.classList.add('active');
    renderTab(name);
  }

  renderTab('grooves');
  app.querySelectorAll('.profile-tab').forEach(function (t) {
    t.addEventListener('click', function () { activateTab(t.getAttribute('data-tab')); });
  });

  // Stat cells with data-go-tab navigate to the matching tab when clicked
  app.querySelectorAll('.stat-clickable[data-go-tab]').forEach(function (cell) {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', function () { activateTab(cell.getAttribute('data-go-tab')); });
  });

  var fb = document.getElementById('profile-follow');
  if (fb) fb.addEventListener('click', function () {
    if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
    var isFollowing = fb.classList.contains('following');
    var action = isFollowing ? DH.Api.unfollow(d.user) : DH.Api.follow(d.user);
    action.then(function () {
      fb.classList.toggle('following');
      fb.textContent = fb.classList.contains('following') ? '✓ Siguiendo' : '+ Seguir';
    }).catch(function (err) {
      DH.UI.toast((err && err.message) || 'Error', 'error');
    });
  });

  var changeAv = document.getElementById('change-avatar-btn');
  if (changeAv) changeAv.addEventListener('click', function () {
    DH.UI.openAvatarPicker(function (seed) {
      // Paint the hero portrait directly from the chosen seed. We must NOT re-fetch the
      // profile: the API avatar update is fire-and-forget and async, so a re-fetch races
      // it and usually returns the OLD seed. The local session is the source of truth the
      // moment the user picks, so update the DOM straight from it (works even offline).
      var newSeed = seed || (DH.Store.getUser() && DH.Store.getUser().avatar);
      var img = app.querySelector('.profile-top .drummer-portrait img');
      if (img && newSeed) img.src = DH.avatarUrl(newSeed);
    });
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
