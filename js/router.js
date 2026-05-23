// Hash-based router. Routes: "/", "/groove/:slug", "/profile/:user", "/upload", "/search"
window.DH = window.DH || {};

DH.Router = (function () {
  var routes = [];
  var currentPlayer = null;

  function add(pattern, handler) {
    var keys = [];
    var rx = new RegExp('^' + pattern.replace(/:[\w]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ rx: rx, keys: keys, handler: handler });
  }

  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qIdx = h.indexOf('?');
    var path = qIdx === -1 ? h : h.slice(0, qIdx);
    var query = {};
    if (qIdx !== -1) {
      h.slice(qIdx + 1).split('&').forEach(function (kv) {
        var p = kv.split('='); if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    return { path: path, query: query };
  }

  function resolve() {
    var parsed = parseHash();
    for (var i = 0; i < routes.length; i++) {
      var m = parsed.path.match(routes[i].rx);
      if (m) {
        var params = {};
        routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
        if (currentPlayer && currentPlayer.destroy) { try { currentPlayer.destroy(); } catch (e) {} currentPlayer = null; }
        // Cualquier preview de audio (hover sobre baterista, click en ▶ de card) se corta en cada navegación.
        if (DH.PreviewPlayer && DH.PreviewPlayer.isPlaying()) { try { DH.PreviewPlayer.stop(); } catch (e) {} }
        // Apagar todos los intervals de hero animations (cada página los recrea si los necesita)
        if (DH.UI && DH.UI.stopAllHeroIntervals) DH.UI.stopAllHeroIntervals();
        // Title default; cada página puede sobreescribirlo via DH.Router.setTitle()
        setTitle('');
        window.scrollTo(0, 0);
        routes[i].handler(params, parsed.query);
        DH.UI && DH.UI.updateNav && DH.UI.updateNav(parsed.path);
        return;
      }
    }
    document.getElementById('app').innerHTML = '<div class="page"><div class="empty empty-with-logo"><img class="empty-logo" src="imagenes/logo.png" alt="DrumHub"><h4>404</h4><p>No encontramos esa página.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
  }

  function go(path) { location.hash = path; }
  function setPlayer(p) { currentPlayer = p; }
  // Helper para que cada página actualice el title del browser
  function setTitle(t) { document.title = t ? (t + ' — DrumHub') : 'DrumHub'; }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { add: add, start: start, go: go, setPlayer: setPlayer, setTitle: setTitle };
})();
