// History API router. Routes: "/", "/groove/:slug", "/profile/:user", "/upload", "/search", etc.
window.DH = window.DH || {};

DH.Router = (function () {
  var routes = [];
  var currentPlayer = null;

  function add(pattern, handler) {
    var keys = [];
    var rx = new RegExp('^' + pattern.replace(/:[\w]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ rx: rx, keys: keys, handler: handler });
  }

  function parsePath() {
    var path = location.pathname || '/';
    var query = {};
    var qs = location.search.slice(1);
    if (qs) {
      qs.split('&').forEach(function (kv) {
        var p = kv.split('='); if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    return { path: path, query: query };
  }

  function resolve() {
    var parsed = parsePath();
    for (var i = 0; i < routes.length; i++) {
      var m = parsed.path.match(routes[i].rx);
      if (m) {
        var params = {};
        routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
        if (currentPlayer && currentPlayer.destroy) { try { currentPlayer.destroy(); } catch (e) {} currentPlayer = null; }
        if (DH.PreviewPlayer && DH.PreviewPlayer.isPlaying()) { try { DH.PreviewPlayer.stop(); } catch (e) {} }
        if (DH.UI && DH.UI.stopAllHeroIntervals) DH.UI.stopAllHeroIntervals();
        setTitle('');
        window.scrollTo(0, 0);
        routes[i].handler(params, parsed.query);
        DH.UI && DH.UI.updateNav && DH.UI.updateNav(parsed.path);
        return;
      }
    }
    document.getElementById('app').innerHTML = ''
      + '<div class="page">'
      +   '<div class="empty empty-v2">'
      +     '<div class="empty-code">404</div>'
      +     '<div class="empty-title">Página <em>no encontrada</em></div>'
      +     '<div class="empty-sub">El link que seguiste no existe o fue removido.</div>'
      +     '<div class="empty-actions">'
      +       '<button class="btn-primary" onclick="DH.Router.go(\'/\')">Ir al inicio</button>'
      +       '<button class="btn-outline" onclick="DH.Router.go(\'/search\')">Explorar grooves</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  function go(path) {
    history.pushState(null, '', path);
    resolve();
  }

  function setPlayer(p) { currentPlayer = p; }
  function setTitle(t) { document.title = t ? (t + ' — DrumHub') : 'DrumHub'; }

  function start() {
    // Backwards compatibility: silently redirect old hash-based links (#/path → /path).
    // Handles bookmarks, shared links, and the MP back_url window during deploy.
    if (location.hash && location.hash.slice(0, 2) === '#/') {
      history.replaceState(null, '', location.hash.slice(1) + location.search);
    }

    window.addEventListener('popstate', resolve);

    // Global click intercept: SPA-navigate all internal <a href="/..."> links
    // without requiring each link to call DH.Router.go() explicitly.
    // External links (http/https/mailto/tel) and assets are left untouched.
    document.body.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) !== '/' || href.slice(0, 2) === '//') return;
      e.preventDefault();
      go(href);
    });

    resolve();
  }

  return { add: add, start: start, go: go, setPlayer: setPlayer, setTitle: setTitle };
})();
