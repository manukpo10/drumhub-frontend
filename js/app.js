// App bootstrap: prefetch data from backend, render shell, wire routes.
window.DH = window.DH || {};

DH.GOOGLE_CLIENT_ID = '431278406816-9iq60ns1ro7pmbo6ji2j0j849n93avcs.apps.googleusercontent.com';

// Called by Google Identity Services when the library loads
window.onGoogleLibraryLoad = function() {
  if (typeof google === 'undefined' || !google.accounts) return;
  google.accounts.id.initialize({
    client_id: DH.GOOGLE_CLIENT_ID,
    callback: function(response) {
      DH.Auth.handleGoogleCredential(response.credential);
    }
  });
};

DH.Auth = DH.Auth || {};
DH.Auth.handleGoogleCredential = function(credential) {
  DH.Api.googleSignIn(credential).then(function(data) {
    DH.Store.setUser({
      user: data.user.username,
      name: data.user.name,
      email: data.user.email,
      plan: (data.user.plan || 'free').toLowerCase(),
      avatar: data.user.avatarSeed,
      init: data.user.init,
      color: data.user.color,
      token: data.token
    });
    if (DH.UI && DH.UI.closeModal) DH.UI.closeModal();
    if (DH.UI && DH.UI.renderNav) DH.UI.renderNav();
    DH.Router.go('/');
  }).catch(function(err) {
    if (DH.UI && DH.UI.toast) DH.UI.toast((err && err.message) || 'Error al iniciar sesión con Google', 'error');
  });
};

(function () {
  // Restore last selected kit before any audio fires.
  try {
    var savedKit = localStorage.getItem('dh.selectedKit');
    if (savedKit) DH.Audio.setKit(savedKit);
  } catch (e) {}

  // Fetch grooves, genres and users from backend; fall back to mock data if unavailable.
  var dataReady = Promise.all([
    DH.Api.getGrooves({ size: 50, sort: 'createdAt,desc' }),
    DH.Api.getGenres()
  ]).then(function (results) {
    var groovesPage = results[0];
    var genresData  = results[1];

    if (groovesPage && groovesPage.content && groovesPage.content.length > 0) {
      DH.GROOVES = groovesPage.content.map(DH.Adapter.groove);
    }
    if (genresData && genresData.length > 0) {
      DH.GENRES     = genresData.map(DH.Adapter.genre);
      DH.GENRES_LIST = DH.GENRES.map(function (g) { return g.name; });
    }

    return DH.Api.getUsers({ size: 50 });
  }).then(function (usersPage) {
    if (usersPage && usersPage.content && usersPage.content.length > 0) {
      DH.DRUMMERS = usersPage.content.map(DH.Adapter.user);
    }
  }).catch(function (e) {
    console.warn('Backend unavailable, using mock data:', e.message);
  });

  // If already logged in, refresh session and favorites.
  var sessionReady = dataReady.then(function () {
    if (!DH.Store.isLoggedIn()) return;
    return DH.Api.getMe().then(function (me) {
      var sessionUser = DH.Adapter.user(me);
      sessionUser.email = me.email || '';
      localStorage.setItem('dh.session', JSON.stringify(sessionUser));
      return DH.Api.getFavorites();
    }).then(function (favPage) {
      var content = (favPage && favPage.content) || [];
      // Only overwrite localStorage when the API returned a real page object.
      // An empty or malformed response must NOT wipe existing local favorites.
      if (!favPage || !Array.isArray(content)) return;
      var favIds = content
        .map(function (f) { return String(f.grooveId || f.id || ''); })
        .filter(Boolean);
      localStorage.setItem('dh.favorites', JSON.stringify(favIds));
    }).catch(function (e) {
      if (e && (e.status === 401 || e.status === 403)) {
        DH.Store.logout();
      }
    });
  });

  // Boot the UI once data is ready.
  sessionReady.then(function () {
    DH.UI.renderNav();
    DH.UI.renderFooter();

    DH.Router.add('/',                  function ()       { DH.pages.home(); });
    DH.Router.add('/groove/:slug',      function (p)      { DH.pages.groove(p); });
    DH.Router.add('/profile/:user',     function (p)      { DH.pages.profile(p); });
    DH.Router.add('/upload',            function ()       { DH.pages.editor(); });
    DH.Router.add('/groove/:slug/edit', function (p)      { DH.pages.editor(p); });
    DH.Router.add('/search',            function (p, q)   { DH.pages.search(p, q); });
    DH.Router.add('/genres',            function ()       { DH.pages.genres(); });
    DH.Router.add('/genre/:slug',       function (p, q)   { DH.pages.genre(p, q); });
    DH.Router.add('/drummers',          function (p, q)   { DH.pages.drummers(p, q); });
    DH.Router.add('/page/:slug',        function (p)      { DH.pages.staticPage(p); });
    DH.Router.add('/settings',          function ()       { DH.pages.settings(); });
    DH.Router.add('/pricing',           function ()       { DH.pages.pricing(); });
    DH.Router.add('/payment-success',   function ()       { DH.pages.paymentSuccess(); });
    DH.Router.add('/payment-failure',   function ()       { DH.pages.paymentFailure(); });
    DH.Router.add('/payment-pending',   function ()       { DH.pages.paymentPending(); });

    DH.Router.start();

    // Notification polling: fetch from API every 30s when logged in, update nav badge.
    function refreshNotifications() {
      if (!DH.Store.isLoggedIn()) return;
      DH.Notifications.refresh(function () {
        // Re-render only the notification badge, not the whole nav
        var badge = document.getElementById('nav-notif-badge');
        var count = DH.Notifications.unreadCount();
        if (badge) {
          badge.textContent = count > 9 ? '9+' : String(count);
          badge.style.display = count > 0 ? '' : 'none';
        }
      });
    }
    // First fetch right after login/load
    refreshNotifications();
    // Poll every 30 seconds
    setInterval(refreshNotifications, 30000);

    // Hide splash once the first route has rendered.
    var splash = document.getElementById('splash');
    if (splash) {
      setTimeout(function () {
        splash.classList.add('hide');
        setTimeout(function () { splash.remove(); }, 500);
      }, 400);
    }

    // Demo banner — only shown if never dismissed.
    try {
      if (!localStorage.getItem('dh.demoBannerDismissed')) {
        var banner = document.getElementById('demo-banner');
        if (banner) {
          setTimeout(function () { banner.style.display = 'flex'; banner.classList.add('show'); }, 1200);
          document.getElementById('demo-banner-close').addEventListener('click', function () {
            banner.classList.remove('show');
            setTimeout(function () { banner.style.display = 'none'; }, 300);
            try { localStorage.setItem('dh.demoBannerDismissed', '1'); } catch (e) {}
          });
        }
      }
    } catch (e) {}
  });
})();
