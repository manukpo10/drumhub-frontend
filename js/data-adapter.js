// Normalizes backend API responses to the shape the frontend pages expect.
// All functions are pure — no side effects, no async.
window.DH = window.DH || {};

DH.Adapter = (function () {

  function groove(g) {
    if (!g) return null;
    return {
      id: String(g.id),
      slug: g.slug,
      title: g.title,
      author: g.authorUsername,
      authorName: g.authorName,
      authorAvatarSeed: g.authorAvatarSeed || null,
      authorAvatarUrl: g.authorAvatarUrl || null,
      genre: g.genre,
      genreSlug: g.genreSlug,
      bpm: g.bpm,
      level: g.level,
      likes: g.likes || 0,
      plays: g.plays || 0,
      featured: g.featured || false,
      tags: g.tags || [],
      desc: g.description || '',
      pattern: g.pattern || {},
      timeSig: g.timeSig || '4/4',
      bars: g.bars || 1,
      kit: g.kit || 'pearl',
      createdAt: g.createdAt
    };
  }

  function genre(g) {
    return {
      name: g.name,
      slug: g.slug,
      icon: g.icon,
      color: g.color,
      count: g.grooveCount || 0,
      bpmMin: g.bpmMin,
      bpmMax: g.bpmMax,
      level: g.level,
      timeSig: g.timeSig
    };
  }

  function user(u) {
    if (!u) return null;
    return {
      user: u.username,
      name: u.name,
      bio: u.bio || '',
      email: u.email || '',
      grooves: 0,
      likes: 0,
      color: u.color || '#e8ff00',
      init: u.init || (u.name ? u.name[0].toUpperCase() : '?'),
      avatar: u.avatarSeed || 'bonham',
      avatarUrl: u.avatarUrl || null,
      plan: u.plan || 'free'
    };
  }

  function comment(c) {
    var d = new Date(c.createdAt);
    var diffMs = Date.now() - d.getTime();
    var diffMin = Math.floor(diffMs / 60000);
    var time;
    if (diffMin < 1) time = 'ahora mismo';
    else if (diffMin < 60) time = 'hace ' + diffMin + ' min';
    else if (diffMin < 1440) time = 'hace ' + Math.floor(diffMin / 60) + ' h';
    else time = 'hace ' + Math.floor(diffMin / 1440) + ' días';
    return { user: c.authorUsername, text: c.text, time: time };
  }

  // authResponse = { token, tokenType, user: UserResponse }
  function sessionFromAuth(authResponse) {
    var u = user(authResponse.user);
    u.email = authResponse.user.email || '';
    return u;
  }

  return {
    groove: groove,
    genre: genre,
    user: user,
    comment: comment,
    sessionFromAuth: sessionFromAuth
  };
})();
