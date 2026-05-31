// HTTP client for the DrumHub Spring Boot backend.
// All methods return Promises. Token management via localStorage.
window.DH = window.DH || {};

DH.Api = (function () {
  var BASE = 'http://localhost:8080';

  function getToken() { return localStorage.getItem('dh.token'); }
  function setToken(t) { localStorage.setItem('dh.token', t); }
  function clearToken() { localStorage.removeItem('dh.token'); }

  function request(method, path, body, auth) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth) {
      var token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }
    var opts = { method: method, headers: headers };
    if (body != null) opts.body = JSON.stringify(body);
    return fetch(BASE + path, opts).then(function (res) {
      if (res.status === 204) return null;
      return res.json().then(function (json) {
        if (!res.ok) {
          var err = new Error(json.message || 'Error ' + res.status);
          err.status = res.status;
          throw err;
        }
        return json.data !== undefined ? json.data : json;
      });
    });
  }

  function buildQuery(params) {
    var q = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] != null && params[k] !== '') q.set(k, params[k]);
    });
    return q.toString();
  }

  return {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,

    // Auth
    login: function (username, password) {
      return request('POST', '/api/auth/login', { username: username, password: password });
    },
    register: function (username, name, email, password, avatarSeed) {
      return request('POST', '/api/auth/register', { username: username, name: name, email: email, password: password, avatarSeed: avatarSeed });
    },

    // Grooves
    getGrooves: function (params) {
      var q = buildQuery(params || {});
      return request('GET', '/api/grooves' + (q ? '?' + q : ''));
    },
    getFeaturedGroove: function () { return request('GET', '/api/grooves/featured'); },
    getGroove: function (slug) { return request('GET', '/api/grooves/' + slug); },
    createGroove: function (data) { return request('POST', '/api/grooves', data, true); },
    updateGroove: function (id, data) { return request('PUT', '/api/grooves/' + id, data, true); },
    deleteGroove: function (id) { return request('DELETE', '/api/grooves/' + id, null, true); },
    incrementPlays: function (id) { return request('POST', '/api/grooves/' + id + '/plays', null, false); },

    // Genres
    getGenres: function () { return request('GET', '/api/genres'); },
    getGenre: function (slug) { return request('GET', '/api/genres/' + slug); },

    // Users
    getUsers: function (params) {
      var q = buildQuery(params || {});
      return request('GET', '/api/users' + (q ? '?' + q : ''));
    },
    getUser: function (username) { return request('GET', '/api/users/' + username); },
    getMe: function () { return request('GET', '/api/users/me', null, true); },
    updateProfile: function (data) { return request('PUT', '/api/users/me', data, true); },
    updateEmail: function (data) { return request('PUT', '/api/users/me/email', data, true); },
    updatePassword: function (data) { return request('PUT', '/api/users/me/password', data, true); },
    updateAvatar: function (avatarSeed) { return request('PUT', '/api/users/me/avatar', { avatarSeed: avatarSeed }, true); },
    updatePlan: function (plan) { return request('PUT', '/api/users/me/plan', { plan: plan }, true); },

    // Favorites
    getFavorites: function (page) {
      return request('GET', '/api/users/me/favorites?page=' + (page || 0) + '&size=100', null, true);
    },
    getFavoriteStatus: function (grooveId) { return request('GET', '/api/users/me/favorites/' + grooveId + '/status', null, true); },
    addFavorite: function (grooveId) { return request('POST', '/api/users/me/favorites/' + grooveId, null, true); },
    removeFavorite: function (grooveId) { return request('DELETE', '/api/users/me/favorites/' + grooveId, null, true); },

    // Comments
    getComments: function (grooveId) { return request('GET', '/api/grooves/' + grooveId + '/comments?size=50'); },
    addComment: function (grooveId, text) { return request('POST', '/api/grooves/' + grooveId + '/comments', { text: text }, true); },

    // Follows
    follow: function (username) { return request('POST', '/api/users/' + username + '/follow', null, true); },
    unfollow: function (username) { return request('DELETE', '/api/users/' + username + '/follow', null, true); },
    getFollowers: function (username) { return request('GET', '/api/users/' + username + '/followers?size=50'); },
    getFollowing: function (username) { return request('GET', '/api/users/' + username + '/following?size=50'); },
    getFollowStatus: function (username) { return request('GET', '/api/users/' + username + '/follow/status', null, true); },

    // Notifications
    getNotifications: function () { return request('GET', '/api/notifications?size=20', null, true); },
    getUnreadCount: function () { return request('GET', '/api/notifications/unread-count', null, true); },
    markAllRead: function () { return request('PUT', '/api/notifications/read-all', null, true); }
  };
})();
