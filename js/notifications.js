// Notifications: fetches from backend API when logged in, falls back to localStorage demo data.
window.DH = window.DH || {};

DH.Notifications = (function () {
  var KEY = 'dh.notifications';
  var _cache = null;

  function _save(list) {
    _cache = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  function _local() {
    if (_cache) return _cache;
    try { _cache = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { _cache = []; }
    return _cache;
  }

  // Fetch from API and update cache, returns Promise<list>
  function _fetchFromApi() {
    if (!DH.Store || !DH.Store.isLoggedIn() || !DH.Api) return Promise.resolve(_local());
    return DH.Api.getNotifications().then(function (page) {
      var list = ((page && page.content) || []).map(function (n) {
        return {
          id: String(n.id),
          // Backend sends the enum uppercase (LIKE/COMMENT/FOLLOW); the UI renders by
          // lowercase type, so normalize here or real notifications render with an empty body.
          type: (n.type || '').toLowerCase(),
          user: n.triggeredBy,
          time: new Date(n.createdAt).getTime(),
          read: n.read,
          grooveSlug: n.grooveSlug || null,
          grooveTitle: n.grooveTitle || null,
          snippet: n.snippet || null
        };
      });
      _save(list);
      return list;
    }).catch(function () { return _local(); });
  }

  function getAll() { return _local().sort(function (a, b) { return b.time - a.time; }); }

  function unreadCount() { return _local().filter(function (n) { return !n.read; }).length; }

  function markAllRead() {
    var list = _local().map(function (n) { return Object.assign({}, n, { read: true }); });
    _save(list);
    if (DH.Store && DH.Store.isLoggedIn() && DH.Api) {
      DH.Api.markAllRead().catch(function () {});
    }
  }

  function push(notif) {
    var list = _local();
    list.unshift(Object.assign({
      id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      time: Date.now(),
      read: false
    }, notif));
    _save(list);
  }

  function clear() {
    _cache = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // Refresh from API and update nav badge — call this on login and via polling
  function refresh(onUpdate) {
    return _fetchFromApi().then(function (list) {
      if (onUpdate) onUpdate(list);
      return list;
    });
  }

  // Kept for compatibility — no-op if user already has real notifications
  function seedDemo(username) {
    if (!username) return;
    if (_local().length) return;
    // If no API data yet, generate demo data so the UI isn't empty on first load
    var grooves = (DH.GROOVES || []).slice();
    var drummers = (DH.DRUMMERS || []).filter(function (d) { return d.user !== username; });
    if (!grooves.length || !drummers.length) return;
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var now = Date.now();
    var demos = [
      { type: 'like',    user: (pick(drummers)||{}).user, grooveSlug: (pick(grooves)||{}).slug, grooveTitle: (pick(grooves)||{}).title, time: now - 1000 * 60 * 23 },
      { type: 'comment', user: (pick(drummers)||{}).user, grooveSlug: (pick(grooves)||{}).slug, grooveTitle: (pick(grooves)||{}).title, snippet: 'Buenísimo, lo voy a probar con doble pedal', time: now - 1000 * 60 * 60 * 2 },
      { type: 'follow',  user: (pick(drummers)||{}).user, time: now - 1000 * 60 * 60 * 6 }
    ];
    _save(demos.map(function (d) {
      return Object.assign({ id: 'n-seed-' + Math.random().toString(36).slice(2, 7), read: false }, d);
    }));
  }

  return { getAll: getAll, unreadCount: unreadCount, markAllRead: markAllRead, push: push, seedDemo: seedDemo, clear: clear, refresh: refresh };
})();
