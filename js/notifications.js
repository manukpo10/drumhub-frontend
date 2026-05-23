// Notifications: dropdown en el nav con eventos para el usuario logueado.
// Para el mock, generamos un set inicial de notifs simuladas y las guardamos en localStorage.
// Cuando haya backend real, este módulo solo cambia su fuente (fetch en vez de generador).
window.DH = window.DH || {};

DH.Notifications = (function () {
  var KEY = 'dh.notifications';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function saveAll(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function unreadCount() { return loadAll().filter(function (n) { return !n.read; }).length; }
  function getAll() { return loadAll().sort(function (a, b) { return b.time - a.time; }); }
  function markAllRead() {
    var list = loadAll().map(function (n) { return Object.assign({}, n, { read: true }); });
    saveAll(list);
  }
  function push(notif) {
    var list = loadAll();
    list.unshift(Object.assign({ id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5), time: Date.now(), read: false }, notif));
    saveAll(list);
  }

  // Genera 5-6 notifs de demo si el usuario está logueado y no tiene ninguna.
  function seedDemo(username) {
    if (!username) return;
    var existing = loadAll();
    if (existing.length) return;
    var grooves = (DH.GROOVES || []).slice();
    var drummers = (DH.DRUMMERS || []).filter(function (d) { return d.user !== username; });
    if (!grooves.length || !drummers.length) return;
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var now = Date.now();
    var demos = [
      { type: 'like',    user: pick(drummers).user, grooveSlug: pick(grooves).slug, grooveTitle: pick(grooves).title, time: now - 1000 * 60 * 23 },
      { type: 'comment', user: pick(drummers).user, grooveSlug: pick(grooves).slug, grooveTitle: pick(grooves).title, snippet: 'Buenísimo, lo voy a probar con doble pedal', time: now - 1000 * 60 * 60 * 2 },
      { type: 'follow',  user: pick(drummers).user, time: now - 1000 * 60 * 60 * 6 },
      { type: 'like',    user: pick(drummers).user, grooveSlug: pick(grooves).slug, grooveTitle: pick(grooves).title, time: now - 1000 * 60 * 60 * 24 },
      { type: 'mention', user: pick(drummers).user, grooveSlug: pick(grooves).slug, grooveTitle: pick(grooves).title, snippet: '@' + username + ' coincido con tu apreciación', time: now - 1000 * 60 * 60 * 24 * 2 },
      { type: 'follow',  user: pick(drummers).user, time: now - 1000 * 60 * 60 * 24 * 3, read: true }
    ];
    saveAll(demos.map(function (d) { return Object.assign({ id: 'n-seed-' + Math.random().toString(36).slice(2, 7), read: false }, d); }));
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  return { getAll: getAll, unreadCount: unreadCount, markAllRead: markAllRead, push: push, seedDemo: seedDemo, clear: clear };
})();
