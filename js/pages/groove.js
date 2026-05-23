// Groove detail — visual layout aligned with mock/drumhub-groove.html
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.groove = function (params) {
  var app = document.getElementById('app');
  var g = DH.Store.findAnyGroove(params.slug);
  if (!g) {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Groove no encontrado</h4><p>El groove que buscás no existe o fue eliminado.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
    return;
  }

  var esc = DH.UI.escape;
  DH.Router.setTitle(g.title + ' · ' + g.genre);
  var author = DH.UI.drummerOrFallback(g.author);
  var isFav = DH.Store.isFavorite(g.id);
  var session = DH.Store.getUser();
  var canEdit = session && session.user === g.author && DH.Store.getUserGrooves().some(function (x) { return x.id === g.id; });
  var related = DH.GROOVES.filter(function (x) { return x.genre === g.genre && x.id !== g.id; }).slice(0, 3);
  if (related.length < 3) {
    related = related.concat(DH.GROOVES.filter(function (x) { return x.id !== g.id && related.indexOf(x) === -1; }).slice(0, 3 - related.length));
  }
  var comments = DH.Store.getComments(g.id);

  // Difficulty pips count
  var diffMap = { 'Básico': 2, 'Intermedio': 3, 'Avanzado': 5 };
  var diffPips = diffMap[g.level] || 3;

  // Pretty plays
  function pretty(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  app.innerHTML = ''
    + '<div class="breadcrumb">'
    +   '<a data-go="/">Inicio</a><span>/</span>'
    +   '<a data-go="/search?genre=' + encodeURIComponent(g.genre) + '">' + esc(g.genre) + '</a><span>/</span>'
    +   esc(g.title)
    + '</div>'

    + '<div class="main2">'

    +   '<div class="col-left">'

    +     '<div class="groove-hero-v2">'
    +       '<div class="groove-top">'
    +         '<div>'
    +           '<div class="groove-genre-tag">' + esc(g.genre) + '</div>'
    +           '<div class="groove-title-v2">' + esc(g.title) + '</div>'
    +           '<div class="groove-author-v2">por <a data-go="/profile/' + esc(g.author) + '">' + esc(g.author) + '</a></div>'
    +           '<div class="groove-tags-v2">'
    +             '<span class="gtag-v2">' + esc(g.genre) + '</span>'
    +             '<span class="gtag-v2">' + g.bpm + ' BPM</span>'
    +             '<span class="gtag-v2">' + esc(g.level) + '</span>'
    +             '<span class="gtag-v2">4/4</span>'
    +             '<span class="gtag-v2">16 pasos</span>'
    +           '</div>'
    +         '</div>'
    +         '<div class="groove-stats-inline">'
    +           '<div class="gstat"><div class="gstat-num">' + pretty(g.plays || 0) + '</div><div class="gstat-label">Reproduc.</div></div>'
    +           '<div class="gstat"><div class="gstat-num">' + (g.likes || 0) + '</div><div class="gstat-label">Likes</div></div>'
    +           '<div class="gstat"><div class="gstat-num">' + Math.round((g.likes || 0) / 6) + '</div><div class="gstat-label">Guardados</div></div>'
    +         '</div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="player-section-v2">'
    +       '<div class="kit-bar">'
    +         '<div class="kit-bar-label">▸ Kit de batería</div>'
    +         '<select id="g-kit-select" class="kit-bar-select"></select>'
    +         '<span class="kit-bar-hint" id="g-kit-hint"></span>'
    +       '</div>'
    +       '<div class="player-header-v2">'
    +         '<div class="player-label">▸ Reproducir groove</div>'
    +         '<div class="bpm-ctrl-inline">'
    +           '<div class="bpm-num-inline" id="g-bpm-display">' + g.bpm + '<span>BPM</span></div>'
    +           '<input type="range" id="g-bpm-range" min="40" max="220" value="' + g.bpm + '">'
    +         '</div>'
    +       '</div>'
    +       '<div id="player-host"></div>'
    +       '<div class="player-controls-v2">'
    +         '<button class="btn-play-v2" id="g-btn-play">'
    +           '<svg id="g-ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
    +           '<svg id="g-ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'
    +         '</button>'
    +         '<span class="play-status" id="g-status">Tocá Play</span>'
    +         '<div class="player-actions">'
    +           '<button class="btn-action ' + (isFav ? 'liked' : '') + '" id="g-like">♥ ' + (g.likes || 0) + '</button>'
    +           '<button class="btn-action ' + (isFav ? 'saved' : '') + '" id="g-save">' + (isFav ? '✓ Guardado' : '⊕ Guardar') + '</button>'
    +           '<button class="btn-action" id="g-share">↗ Compartir</button>'
    +         '</div>'
    +       '</div>'
    +     '</div>'

    +     (g.desc
        ? '<div class="desc-section-v2">'
          + '<div class="section-title-sm">Sobre este <em>groove</em></div>'
          + '<p class="desc-text">' + esc(g.desc) + '</p>'
          + '<div class="desc-tags">'
          +   '<span class="dtag">' + esc(g.genre) + '</span>'
          +   '<span class="dtag">' + esc(g.level) + '</span>'
          +   '<span class="dtag">' + g.bpm + ' bpm</span>'
          +   '<span class="dtag">16 pasos</span>'
          + '</div>'
          + '</div>'
        : '')

    +     (related.length
        ? '<div class="related-section-v2">'
          + '<div class="section-title-sm">Grooves <em>relacionados</em></div>'
          + '<div class="related-list" id="related-list"></div>'
          + '</div>'
        : '')

    +     '<div class="comments-section-v2">'
    +       '<div class="section-title-sm">Comentarios <em>(' + comments.length + ')</em></div>'
    +       '<div id="comment-form-host"></div>'
    +       '<div class="comments-list-v2" id="comments-list"></div>'
    +     '</div>'

    +   '</div>'

    +   '<div class="sidebar-col">'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">El <em>baterista</em></div>'
    +       '<div class="author-top">'
    +         '<div class="author-avatar-v2" style="background:' + author.color + '20;color:' + author.color + '">' + esc(author.init) + '</div>'
    +         '<div>'
    +           '<div class="author-name-v2" data-go="/profile/' + esc(author.user) + '">' + esc(author.user) + '</div>'
    +           '<div class="author-handle-v2">@' + esc(author.user) + '</div>'
    +         '</div>'
    +       '</div>'
    +       '<p class="author-bio-v2">' + esc(author.bio || 'Sin bio.') + '</p>'
    +       '<div class="author-stats-v2">'
    +         '<div class="astat"><div class="astat-num">' + (author.grooves || 0) + '</div><div class="astat-label">Grooves</div></div>'
    +         '<div class="astat"><div class="astat-num">' + pretty(author.likes || 0) + '</div><div class="astat-label">Likes</div></div>'
    +         '<div class="astat"><div class="astat-num">' + (author.followers || Math.max(20, Math.round((author.likes || 0) / 5))) + '</div><div class="astat-label">Seguid.</div></div>'
    +       '</div>'
    +       '<button class="btn-follow-block" id="follow-btn">+ Seguir</button>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Info del <em>groove</em></div>'
    +       '<div class="info-list">'
    +         '<div class="info-item"><span class="info-key">Género</span><span class="info-val">' + esc(g.genre) + '</span></div>'
    +         '<div class="info-item"><span class="info-key">Tempo</span><span class="info-val"><em>' + g.bpm + '</em> BPM</span></div>'
    +         '<div class="info-item"><span class="info-key">Compás</span><span class="info-val">4/4</span></div>'
    +         '<div class="info-item"><span class="info-key">Pasos</span><span class="info-val">16</span></div>'
    +         '<div class="info-item"><span class="info-key">Dificultad</span><div class="diff-bar" id="diff-bar"></div></div>'
    +         '<div class="info-item"><span class="info-key">Subido</span><span class="info-val">' + (g.createdAt ? new Date(g.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'hace 3 días') + '</span></div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Leyenda <em>de colores</em></div>'
    +       '<div class="legend" id="legend"></div>'
    +     '</div>'

    +     (canEdit
        ? '<div class="sidebar-card-v2 owner-card">'
          + '<div class="section-title-sm">Es <em>tuyo</em></div>'
          + '<p style="font-size:0.75rem;color:var(--muted);font-weight:300;margin-bottom:12px;">Este groove lo subiste vos. Podés editarlo o eliminarlo.</p>'
          + '<button class="btn-upload" data-go="/groove/' + esc(g.slug) + '/edit" style="width:100%;padding:10px;margin-bottom:8px;">✎ Editar groove</button>'
          + '<button class="btn-ghost" id="g-delete" style="width:100%;padding:10px;border-color:var(--accent2);color:var(--accent2);">🗑 Eliminar</button>'
          + '</div>'
        : '')

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Compartir <em>groove</em></div>'
    +       '<div class="share-btns">'
    +         '<button class="btn-share-row" data-share="copy"><span class="btn-share-icon">📋</span>Copiar enlace</button>'
    +         '<button class="btn-share-row" data-share="whatsapp"><span class="btn-share-icon">💬</span>WhatsApp</button>'
    +         '<button class="btn-share-row" data-share="instagram"><span class="btn-share-icon">📸</span>Instagram</button>'
    +       '</div>'
    +     '</div>'

    +   '</div>'
    + '</div>';

  // ── Mount minimal player — rows come from the currently selected kit so the grid
  //    changes when the user picks a different kit (CR-78 = 4 rows, Pearl = up to 11).
  var player = null;
  function buildPlayer(bpmOverride) {
    if (player) { try { player.destroy(); } catch (e) {} }
    player = DH.createPlayer({
      container: document.getElementById('player-host'),
      pattern: g.pattern,
      bpm: bpmOverride != null ? bpmOverride : g.bpm,
      editable: false,
      chrome: 'minimal',
      rows: DH.Audio.getKitPieces(DH.Audio.getKit()),
      idPrefix: 'gpv2',
      onPlayStateChange: function (playing) {
        var btn = document.getElementById('g-btn-play');
        var st = document.getElementById('g-status');
        btn.classList.toggle('on', playing);
        document.getElementById('g-ico-play').style.display = playing ? 'none' : '';
        document.getElementById('g-ico-stop').style.display = playing ? '' : 'none';
        st.textContent = playing ? 'Reproduciendo' : 'Detenido';
        st.className = playing ? 'play-status on' : 'play-status';
      }
    });
    DH.Router.setPlayer(player);
  }
  buildPlayer();

  document.getElementById('g-btn-play').addEventListener('click', function () { player.toggle(); });
  document.getElementById('g-bpm-range').addEventListener('input', function () {
    var b = parseInt(this.value, 10);
    player.setBpm(b);
    document.getElementById('g-bpm-display').innerHTML = b + '<span>BPM</span>';
  });

  // ── Kit selector: persist choice across grooves via localStorage ──
  var kitSelect = document.getElementById('g-kit-select');
  var kitHint = document.getElementById('g-kit-hint');
  var KIT_HINTS = {
    pearl: 'Batería acústica real',
    tr909: 'Máquina Roland TR-909 · techno/house',
    lm2:   'LinnDrum · sonido 80s',
    cr78:  'Roland CR-78 · vintage analógica'
  };
  var storedKit = null;
  try { storedKit = localStorage.getItem('dh.selectedKit'); } catch (e) {}
  if (storedKit && DH.Audio.setKit(storedKit)) { /* applied */ } else { storedKit = DH.Audio.getKit(); }
  DH.Audio.listKits().forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.label + ' · ' + k.tag;
    if (k.id === storedKit) opt.selected = true;
    kitSelect.appendChild(opt);
  });
  if (kitHint) kitHint.textContent = KIT_HINTS[storedKit] || '';
  kitSelect.addEventListener('change', function () {
    DH.Audio.setKit(this.value);
    if (kitHint) kitHint.textContent = KIT_HINTS[this.value] || '';
    try { localStorage.setItem('dh.selectedKit', this.value); } catch (e) {}
    // Rebuild the grid so it shows ONLY the pieces this kit has (CR-78=4, Pearl=11).
    var currentBpm = player ? player.getBpm() : g.bpm;
    buildPlayer(currentBpm);
  });

  // ── Difficulty pips ──
  var diffBar = document.getElementById('diff-bar');
  for (var i = 0; i < 5; i++) {
    var p = document.createElement('div');
    p.className = 'diff-pip' + (i < diffPips ? ' on' : '');
    diffBar.appendChild(p);
  }

  // ── Legend ──
  var legend = document.getElementById('legend');
  DH.ROWS.forEach(function (row) {
    var item = document.createElement('div'); item.className = 'legend-item';
    item.innerHTML = '<div class="legend-dot" style="background:var(--' + row.color + ')"></div>' + esc(row.name);
    legend.appendChild(item);
  });

  // ── Related ──
  if (related.length) {
    var rl = document.getElementById('related-list');
    related.forEach(function (rg) {
      var hihat = (rg.pattern && rg.pattern.hihat) || new Array(16).fill(0);
      var snare = (rg.pattern && rg.pattern.snare) || new Array(16).fill(0);
      var kick  = (rg.pattern && rg.pattern.kick)  || new Array(16).fill(0);
      var mini = '<div class="rc-mini">';
      hihat.forEach(function (s) { mini += '<div class="rcm' + (s ? ' on' : '') + '"></div>'; });
      mini += '</div><div class="rc-mini">';
      snare.forEach(function (s) { mini += '<div class="rcm' + (s ? ' on s' : '') + '"></div>'; });
      mini += '</div><div class="rc-mini">';
      kick.forEach(function (s) { mini += '<div class="rcm' + (s ? ' on k' : '') + '"></div>'; });
      mini += '</div>';
      var el = document.createElement('div'); el.className = 'related-card';
      el.innerHTML = '<div><div class="rc-genre">' + esc(rg.genre) + '</div><div class="rc-title">' + esc(rg.title) + '</div><div class="rc-meta">por ' + esc(rg.author) + ' · ' + rg.bpm + ' BPM</div>' + mini + '</div><button class="rc-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></button>';
      el.addEventListener('click', function () { DH.Router.go('/groove/' + rg.slug); });
      rl.appendChild(el);
    });
  }

  // ── Comments ──
  var listEl = document.getElementById('comments-list');
  function renderComments() {
    var cs = DH.Store.getComments(g.id);
    listEl.innerHTML = '';
    if (!cs.length) {
      listEl.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);font-weight:300;">Sé el primero en comentar este groove.</div>';
      return;
    }
    cs.forEach(function (c, i) {
      var d = DH.UI.drummerOrFallback(c.user);
      var el = document.createElement('div'); el.className = 'comment-v2';
      el.innerHTML = ''
        + '<div class="comment-avatar" style="background:' + d.color + '20;color:' + d.color + '">' + esc(d.init) + '</div>'
        + '<div class="comment-body">'
        +   '<div class="comment-header"><span class="comment-user">' + esc(c.user) + '</span><span class="comment-time">' + esc(c.time) + '</span></div>'
        +   '<div class="comment-text-v2">' + esc(c.text) + '</div>'
        +   '<div class="comment-actions"><button class="comment-action" data-cmt-like="1">♥ Me sirve</button><button class="comment-action" data-cmt-reply="' + esc(c.user) + '">↩ Responder</button></div>'
        + '</div>';
      listEl.appendChild(el);
      if (i < cs.length - 1) { var hr = document.createElement('hr'); hr.className = 'comment-divider'; listEl.appendChild(hr); }
    });
    // Comment action handlers (Me sirve = toggle local; Responder = pre-rellena el textarea con @user)
    listEl.querySelectorAll('[data-cmt-like]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.toggle('liked');
        b.style.color = b.classList.contains('liked') ? 'var(--accent2)' : '';
      });
    });
    listEl.querySelectorAll('[data-cmt-reply]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ta = document.querySelector('#comment-form textarea');
        if (!ta) { DH.UI.openModal('login'); return; }
        var mention = '@' + b.getAttribute('data-cmt-reply') + ' ';
        ta.value = mention + ta.value.replace(/^@\S+\s/, '');
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      });
    });
  }
  var formHost = document.getElementById('comment-form-host');
  if (session) {
    var meInit = (session.init || (session.user[0] || 'V').toUpperCase());
    formHost.innerHTML = ''
      + '<form class="comment-form-v2" id="comment-form">'
      +   '<div class="comment-avatar-me">' + esc(meInit) + '</div>'
      +   '<div class="comment-input-wrap">'
      +     '<textarea class="comment-input" rows="2" placeholder="Dejá tu comentario, pregunta o aporte..." required></textarea>'
      +     '<button class="btn-comment" type="submit">Comentar</button>'
      +   '</div>'
      + '</form>';
    document.getElementById('comment-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var ta = e.target.querySelector('textarea');
      var text = ta.value.trim(); if (!text) return;
      DH.Store.addComment(g.id, { user: session.user, text: text, time: 'recién' });
      ta.value = '';
      renderComments();
    });
  } else {
    formHost.innerHTML = '<div style="background:var(--surface2);border:1px solid var(--border);padding:16px;border-radius:2px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><span style="font-size:0.78rem;color:var(--muted);">Ingresá para dejar tu comentario.</span><button class="btn-cta" id="cmt-login">Ingresar</button></div>';
    document.getElementById('cmt-login').addEventListener('click', function () { DH.UI.openModal('login'); });
  }
  renderComments();

  // ── Actions ──
  var likeBtn = document.getElementById('g-like');
  var saveBtn = document.getElementById('g-save');
  function refreshFav() {
    var fav = DH.Store.isFavorite(g.id);
    likeBtn.classList.toggle('liked', fav);
    saveBtn.classList.toggle('saved', fav);
    saveBtn.textContent = fav ? '✓ Guardado' : '⊕ Guardar';
    likeBtn.textContent = '♥ ' + ((g.likes || 0) + (fav ? 1 : 0));
  }
  function doFav() {
    if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
    DH.Store.toggleFavorite(g.id);
    refreshFav();
  }
  likeBtn.addEventListener('click', doFav);
  saveBtn.addEventListener('click', doFav);

  var delBtn = document.getElementById('g-delete');
  if (delBtn) {
    delBtn.addEventListener('click', function () {
      if (!confirm('¿Eliminar "' + g.title + '"? Esta acción no se puede deshacer.')) return;
      DH.Store.deleteUserGroove(g.id);
      DH.Router.go('/profile/' + g.author);
    });
  }
  document.getElementById('g-share').addEventListener('click', function () {
    var url = location.origin + location.pathname + '#/groove/' + g.slug;
    try { navigator.clipboard.writeText(url); alert('Link copiado al portapapeles'); }
    catch (e) { prompt('Link al groove:', url); }
  });
  app.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#/groove/' + g.slug;
      var kind = b.getAttribute('data-share');
      if (kind === 'copy') { try { navigator.clipboard.writeText(url); alert('Link copiado'); } catch (e) { prompt('Link:', url); } }
      else if (kind === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(g.title + ' — ' + url), '_blank');
      else if (kind === 'instagram') { try { navigator.clipboard.writeText(url); alert('Link copiado — pegalo en tu historia de Instagram'); } catch (e) { prompt('Link:', url); } }
    });
  });

  document.getElementById('follow-btn').addEventListener('click', function (e) {
    e.target.classList.toggle('following');
    e.target.textContent = e.target.classList.contains('following') ? '✓ Siguiendo' : '+ Seguir';
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (ev) { ev.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
