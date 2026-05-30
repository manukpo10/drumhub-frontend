// localStorage wrapper: session, favorites, user-uploaded grooves.
window.DH = window.DH || {};

DH.Store = (function () {
  var KEY_SESSION = 'dh.session';
  var KEY_FAVS    = 'dh.favorites';
  var KEY_USER_GROOVES = 'dh.userGrooves';
  var KEY_COMMENTS = 'dh.comments';
  var KEY_PLAN = 'dh.plan';

  function read(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  // ── session ──
  function getUser() { return read(KEY_SESSION, null); }
  function login(username, email, avatarSeed) {
    var existing = DH.findDrummer(username);
    var u = existing || {
      user: username,
      name: username,
      bio: 'Nuevo en DrumHub. Subiendo mis primeros grooves.',
      grooves: 0, likes: 0,
      color: '#e8ff00',
      init: (username[0] || 'D').toUpperCase(),
      email: email || ''
    };
    if (avatarSeed) u.avatar = avatarSeed; // se guarda el seed (string corto) — Supabase-friendly
    write(KEY_SESSION, u);
    return u;
  }
  // Permite que el usuario cambie de avatar después de creada la cuenta.
  function updateAvatar(seed) {
    var u = getUser(); if (!u) return null;
    u.avatar = seed; write(KEY_SESSION, u); return u;
  }
  function logout() { localStorage.removeItem(KEY_SESSION); }
  function isLoggedIn() { return !!getUser(); }

  // ── favorites ──
  function getFavorites() { return read(KEY_FAVS, []); }
  function isFavorite(grooveId) { return getFavorites().indexOf(grooveId) !== -1; }
  function toggleFavorite(grooveId) {
    var favs = getFavorites();
    var idx = favs.indexOf(grooveId);
    if (idx === -1) favs.push(grooveId);
    else favs.splice(idx, 1);
    write(KEY_FAVS, favs);
    return idx === -1;
  }

  // ── user-uploaded grooves ──
  function getUserGrooves() { return read(KEY_USER_GROOVES, []); }
  function addUserGroove(groove) {
    var list = getUserGrooves();
    list.unshift(groove);
    write(KEY_USER_GROOVES, list);
  }
  function updateUserGroove(id, changes) {
    var list = getUserGrooves();
    var idx = list.findIndex(function (g) { return g.id === id; });
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], changes, { updatedAt: Date.now() });
    write(KEY_USER_GROOVES, list);
    return list[idx];
  }
  function deleteUserGroove(id) {
    var list = getUserGrooves().filter(function (g) { return g.id !== id; });
    write(KEY_USER_GROOVES, list);
  }
  function allGrooves() {
    return getUserGrooves().concat(DH.GROOVES);
  }
  function findAnyGroove(idOrSlug) {
    var all = allGrooves();
    return all.find(function (g) { return g.id === idOrSlug || g.slug === idOrSlug; });
  }

  // ── plan ──
  function getPlan() {
    var u = getUser();
    if (!u) return 'free';
    return read(KEY_PLAN, 'free');
  }
  function setPlan(plan) {
    write(KEY_PLAN, plan);
  }
  function isPro() {
    var p = getPlan();
    return p === 'pro' || p === 'studio';
  }
  function isStudio() {
    return getPlan() === 'studio';
  }

  // ── comments (extra to mock data) ──
  function getComments(grooveId) {
    var stored = read(KEY_COMMENTS, {});
    var base = (DH.COMMENTS[grooveId] || []).slice();
    var extra = stored[grooveId] || [];
    return extra.concat(base);
  }
  function addComment(grooveId, comment) {
    var stored = read(KEY_COMMENTS, {});
    if (!stored[grooveId]) stored[grooveId] = [];
    stored[grooveId].unshift(comment);
    write(KEY_COMMENTS, stored);
  }

  return {
    getUser: getUser, login: login, logout: logout, isLoggedIn: isLoggedIn,
    updateAvatar: updateAvatar,
    getFavorites: getFavorites, isFavorite: isFavorite, toggleFavorite: toggleFavorite,
    getUserGrooves: getUserGrooves, addUserGroove: addUserGroove, updateUserGroove: updateUserGroove, deleteUserGroove: deleteUserGroove,
    allGrooves: allGrooves, findAnyGroove: findAnyGroove,
    getComments: getComments, addComment: addComment,
    getPlan: getPlan, setPlan: setPlan, isPro: isPro, isStudio: isStudio
  };
})();
