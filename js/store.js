// State management: session, favorites, user grooves, comments, plan.
// login/addUserGroove/updateAvatar are async; all reads remain synchronous.
window.DH = window.DH || {};

DH.Store = (function () {
  var KEY_SESSION      = 'dh.session';
  var KEY_FAVS         = 'dh.favorites';
  var KEY_USER_GROOVES = 'dh.userGrooves';
  var KEY_COMMENTS     = 'dh.comments';

  function read(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  // ── session ──
  function getUser() { return read(KEY_SESSION, null); }
  function _saveUser(u) { write(KEY_SESSION, u); }

  // Async — calls backend login or register, stores token + session.
  function login(username, password, name, email, avatarSeed) {
    var apiCall;
    if (name && email) {
      // Register then auto-login to get the JWT token
      apiCall = DH.Api.register(username, name, email, password, avatarSeed || 'bonham')
        .then(function () { return DH.Api.login(username, password); });
    } else {
      // Login flow — password is the second argument
      apiCall = DH.Api.login(username, password || email);
    }
    return apiCall.then(function (authData) {
      DH.Api.setToken(authData.token);
      var sessionUser = DH.Adapter.sessionFromAuth(authData);
      _saveUser(sessionUser);
      // Load favorites into local cache (non-blocking on failure)
      return DH.Api.getFavorites().then(function (favPage) {
        var favIds = ((favPage && favPage.content) || []).map(function (f) { return String(f.grooveId); });
        localStorage.setItem(KEY_FAVS, JSON.stringify(favIds));
      }).catch(function () {}).then(function () {
        return sessionUser;
      });
    });
  }

  // Used by OAuth flows (Google Sign-In) that already have a JWT from the backend.
  function loginWithAuth(authData) {
    DH.Api.setToken(authData.token);
    var sessionUser = DH.Adapter.sessionFromAuth(authData);
    _saveUser(sessionUser);
    return DH.Api.getFavorites().then(function (favPage) {
      var favIds = ((favPage && favPage.content) || []).map(function (f) { return String(f.grooveId); });
      localStorage.setItem(KEY_FAVS, JSON.stringify(favIds));
    }).catch(function () {}).then(function () { return sessionUser; });
  }

  function logout() {
    localStorage.removeItem(KEY_SESSION);
    DH.Api.clearToken();
    localStorage.removeItem(KEY_FAVS);
    localStorage.removeItem(KEY_USER_GROOVES);
  }

  function isLoggedIn() { return !!getUser() && !!DH.Api.getToken(); }

  // Async — persists to API then updates local session.
  function updateAvatar(seed) {
    var u = getUser();
    if (u) { u.avatar = seed; _saveUser(u); }
    if (isLoggedIn()) {
      DH.Api.updateAvatar(seed).catch(function () {});
    }
    return Promise.resolve(u);
  }

  // ── favorites ──
  function getFavorites() { return read(KEY_FAVS, []); }
  function isFavorite(grooveId) { return getFavorites().indexOf(String(grooveId)) !== -1; }

  function toggleFavorite(grooveId) {
    var id = String(grooveId);
    var favs = getFavorites();
    var idx = favs.indexOf(id);
    var added;
    if (idx === -1) { favs.push(id); added = true; }
    else            { favs.splice(idx, 1); added = false; }
    write(KEY_FAVS, favs);
    // Sync to API (fire-and-forget)
    if (isLoggedIn()) {
      var numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        if (added) {
          DH.Api.addFavorite(numId).catch(function (err) {
            if (err && err.status === 409) {
              // Backend already has it — local state is already correct (optimistic add above).
              // Ensure the id is present in case a bad sync wiped it from localStorage.
              var current = getFavorites();
              if (current.indexOf(id) === -1) { current.push(id); write(KEY_FAVS, current); }
            }
          });
        } else {
          DH.Api.removeFavorite(numId).catch(function () {});
        }
      }
    }
    return added;
  }

  // ── user grooves ──
  function getUserGrooves() { return read(KEY_USER_GROOVES, []); }

  // Async — creates via API when logged in, falls back to local-only.
  function addUserGroove(groove) {
    if (isLoggedIn()) {
      // Genre name → slug: backend expects slug ("funk"), editor stores name ("Funk")
      var genreObj = (DH.GENRES || []).find(function(g) { return g.name === groove.genre; });
      var genreSlug = genreObj ? genreObj.slug
        : groove.genre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      return DH.Api.createGroove({
        title: groove.title,
        genre: genreSlug,
        bpm: groove.bpm,
        level: groove.level,
        description: groove.desc,
        tags: groove.tags || [],
        pattern: groove.pattern,
        timeSig: groove.timeSig || '4/4',
        bars: groove.bars || 1
      }).then(function (apiGroove) {
        var adapted = DH.Adapter.groove(apiGroove);
        DH.GROOVES.unshift(adapted);
        // Persist locally so the edit/delete ownership guards recognize it after a reload.
        // Without this, an API-created groove is missing from userGrooves and canEdit/isInMyStorage fail.
        var owned = getUserGrooves();
        owned.unshift(adapted);
        write(KEY_USER_GROOVES, owned);
        return adapted;
      }).catch(function (e) {
        console.error('Failed to create groove via API:', e);
        // Fallback to local
        var list = getUserGrooves();
        list.unshift(groove);
        write(KEY_USER_GROOVES, list);
        DH.GROOVES.unshift(groove);
        return groove;
      });
    }
    // Offline / not logged in — local only
    var list = getUserGrooves();
    list.unshift(groove);
    write(KEY_USER_GROOVES, list);
    DH.GROOVES.unshift(groove);
    return Promise.resolve(groove);
  }

  function updateUserGroove(id, changes) {
    // Update local array
    var list = getUserGrooves();
    var idx = list.findIndex(function (g) { return g.id === id; });
    if (idx !== -1) {
      list[idx] = Object.assign({}, list[idx], changes, { updatedAt: Date.now() });
      write(KEY_USER_GROOVES, list);
    }
    // Update in DH.GROOVES
    var gi = -1;
    for (var i = 0; i < DH.GROOVES.length; i++) { if (String(DH.GROOVES[i].id) === String(id)) { gi = i; break; } }
    if (gi !== -1) DH.GROOVES[gi] = Object.assign({}, DH.GROOVES[gi], changes);
    // Sync to API if logged in and id is numeric (backend id)
    var numId = parseInt(id, 10);
    if (isLoggedIn() && !isNaN(numId) && DH.Api) {
      var genreObj = (DH.GENRES || []).filter(function (g) { return g.name === changes.genre; })[0];
      var genreSlug = genreObj ? genreObj.slug : (changes.genre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      DH.Api.updateGroove(numId, {
        title: changes.title,
        genre: genreSlug,
        bpm: changes.bpm,
        level: changes.level,
        description: changes.desc,
        tags: changes.tags || [],
        pattern: changes.pattern,
        timeSig: changes.timeSig || '4/4',
        bars: changes.bars || 1
      }).catch(function (e) { console.error('Failed to update groove via API:', e); });
    }
    return idx !== -1 ? list[idx] : null;
  }

  function deleteUserGroove(id) {
    var list = getUserGrooves().filter(function (g) { return g.id !== id; });
    write(KEY_USER_GROOVES, list);
    var gi = DH.GROOVES.findIndex(function (g) { return String(g.id) === String(id); });
    if (gi !== -1) DH.GROOVES.splice(gi, 1);
    if (isLoggedIn()) {
      var numId = parseInt(id, 10);
      if (!isNaN(numId)) DH.Api.deleteGroove(numId).catch(function () {});
    }
  }

  function allGrooves() {
    return DH.GROOVES.slice();
  }

  function findAnyGroove(idOrSlug) {
    return DH.GROOVES.find(function (g) {
      return String(g.id) === String(idOrSlug) || g.slug === idOrSlug;
    }) || null;
  }

  // ── plan ──
  function getPlan() {
    var u = getUser();
    return u ? (u.plan || 'free') : 'free';
  }
  function setPlan(plan) {
    var u = getUser();
    if (u) { u.plan = plan; _saveUser(u); }
    if (isLoggedIn()) DH.Api.updatePlan(plan).catch(function () {});
  }
  function isPro()    { var p = getPlan(); return p === 'pro' || p === 'studio'; }
  function isStudio() { return getPlan() === 'studio'; }

  // ── comments ──
  // Returns local comments + any from mock data (DH.COMMENTS).
  // API comments are merged asynchronously in groove.js after page render.
  function getComments(grooveId) {
    var stored = read(KEY_COMMENTS, {});
    var base   = (DH.COMMENTS && DH.COMMENTS[grooveId]) ? DH.COMMENTS[grooveId].slice() : [];
    var extra  = stored[grooveId] || [];
    return extra.concat(base);
  }

  function addComment(grooveId, comment) {
    // Optimistic local save
    var stored = read(KEY_COMMENTS, {});
    if (!stored[grooveId]) stored[grooveId] = [];
    stored[grooveId].unshift(comment);
    write(KEY_COMMENTS, stored);
    // API sync (fire-and-forget)
    var numId = parseInt(grooveId, 10);
    if (isLoggedIn() && !isNaN(numId)) {
      DH.Api.addComment(numId, comment.text).catch(function () {});
    }
  }

  return {
    getUser: getUser,
    login: login,
    loginWithAuth: loginWithAuth,
    logout: logout,
    isLoggedIn: isLoggedIn,
    updateAvatar: updateAvatar,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getUserGrooves: getUserGrooves,
    addUserGroove: addUserGroove,
    updateUserGroove: updateUserGroove,
    deleteUserGroove: deleteUserGroove,
    allGrooves: allGrooves,
    findAnyGroove: findAnyGroove,
    getPlan: getPlan,
    setPlan: setPlan,
    isPro: isPro,
    isStudio: isStudio,
    getComments: getComments,
    addComment: addComment
  };
})();
