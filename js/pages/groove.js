// Groove detail — visual layout aligned with mock/drumhub-groove.html
window.DH = window.DH || {};
DH.pages = DH.pages || {};

if (DH.shakeEnabled === undefined) {
  DH.shakeEnabled = localStorage.getItem('dh-shake') !== '0';
}

DH.pages.groove = function (params) {
  var app = document.getElementById('app');
  var g = DH.Store.findAnyGroove(params.slug);
  if (!g) {
    // Fallback: fetch from API (handles direct links, shared URLs, and freshly published grooves)
    app.innerHTML = '<div class="page"><div class="empty"><p style="color:var(--muted)">Cargando groove...</p></div></div>';
    DH.Api.getGroove(params.slug).then(function(apiGroove) {
      if (!apiGroove) throw new Error('not found');
      var adapted = DH.Adapter.groove(apiGroove);
      DH.GROOVES.unshift(adapted);
      DH.pages.groove(params); // re-render with the fetched groove
    }).catch(function() {
      app.innerHTML = '<div class="page"><div class="empty"><h4>Groove no encontrado</h4><p>El groove que buscás no existe o fue eliminado.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
    });
    return;
  }

  var esc = DH.UI.escape;
  DH.Router.setTitle(g.title + ' · ' + g.genre);
  if (DH.Seo) DH.Seo.update({
    title: g.title + ' · ' + g.genre + ' — DrumHub',
    description: [
      'Groove de ' + g.genre + ' a ' + g.bpm + ' BPM, nivel ' + g.level + '.',
      g.authorName && ('Por ' + g.authorName + '.'),
      g.desc && g.desc.slice(0, 80),
      'DrumHub — La biblioteca de grooves para bateristas.'
    ].filter(Boolean).join(' '),
    canonical: 'https://drumhub.io/groove/' + g.slug,
    ogType: 'music.song'
  });
  var author = DH.UI.drummerOrFallback(g.author);
  var isFav = DH.Store.isFavorite(g.id);
  var session = DH.Store.getUser();
  // Author owns it AND it's persistable: a numeric backend id (editable from any browser,
  // backend revalidates ownership) or a local-only groove present in my storage.
  var gHasBackendId = !isNaN(parseInt(g.id, 10));
  var canEdit = session && session.user === g.author &&
    (gHasBackendId || DH.Store.getUserGrooves().some(function (x) { return x.id === g.id; }));
  var related = DH.GROOVES.filter(function (x) { return x.genre === g.genre && x.id !== g.id; }).slice(0, 3);
  if (related.length < 3) {
    related = related.concat(DH.GROOVES.filter(function (x) { return x.id !== g.id && related.indexOf(x) === -1; }).slice(0, 3 - related.length));
  }
  var comments = DH.Store.getComments(g.id);
  var genreInfo = DH.GENRE_INFO && DH.GENRE_INFO[g.genre];
  var genreColor = (genreInfo && genreInfo.color) || 'var(--accent2)';

  // Difficulty pips count
  var diffMap = { 'Básico': 2, 'Intermedio': 3, 'Avanzado': 5 };
  var diffPips = diffMap[g.level] || 3;

  // Pretty plays
  function pretty(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  // Resolve time-sig display values (falls back to 4/4 / 16 for grooves without metadata)
  var gDisplayTimeSig = g.timeSig || '4/4';
  var gDisplayTimeSigConf = DH.TIME_SIGS
    ? (DH.TIME_SIGS.find(function (t) { return t.id === gDisplayTimeSig; }) || DH.TIME_SIGS[0])
    : null;
  var gDisplaySteps = gDisplayTimeSigConf
    ? gDisplayTimeSigConf.stepsPerBar * (g.bars || 1)
    : 16;

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
    +           '<div class="groove-genre-tag" style="color:' + genreColor + ';border-color:' + genreColor + '55">' + esc(g.genre) + '</div>'
    +           '<div class="groove-title-v2">' + esc(g.title) + '</div>'
    +           '<div class="groove-author-v2">por <a data-go="/profile/' + esc(g.author) + '">' + esc(g.author) + '</a></div>'
    +           '<div class="groove-tags-v2">'
    +             '<span class="gtag-v2">' + esc(g.genre) + '</span>'
    +             '<span class="gtag-v2">' + g.bpm + ' BPM</span>'
    +             '<span class="gtag-v2">' + esc(g.level) + '</span>'
    +             '<span class="gtag-v2">' + gDisplayTimeSig + '</span>'
    +             '<span class="gtag-v2">' + gDisplaySteps + ' pasos</span>'
    +           '</div>'
    +         '</div>'
    +         '<div class="groove-stats-inline">'
    +           '<div class="gstat"><div class="gstat-num">' + pretty(g.plays || 0) + '</div><div class="gstat-label">Reproduc.</div></div>'
    +           '<div class="gstat"><div class="gstat-num">' + (g.likes || 0) + '</div><div class="gstat-label">Likes</div></div>'
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
    +           '<div class="bpm-stepper">'
    +             '<button class="bpm-step-btn" id="g-bpm-down">−</button>'
    +             '<div class="bpm-num-inline" id="g-bpm-display">' + g.bpm + '<span>BPM</span></div>'
    +             '<button class="bpm-step-btn" id="g-bpm-up">+</button>'
    +           '</div>'
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
    +           '<button class="btn-shake" id="g-shake"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M2 12c1-3 2-5 2-5s1 2 2 5-1 5-2 5-2-2-2-5z"/><path d="M10 12c1-4 2-7 2-7s1 3 2 7-1 7-2 7-2-3-2-7z"/><path d="M18 12c1-3 2-5 2-5s1 2 2 5-1 5-2 5-2-2-2-5z"/></svg>Vibrar</button>'
    +         '</div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="export-section" id="export-section">'
    +       '<div class="export-title">Exportar</div>'
    +       '<div class="export-btns">'
    +         '<button class="export-btn" id="exp-json" title="Gratis">JSON</button>'
    +         '<button class="export-btn pro-gate" id="exp-midi" title="Plan Pro">MIDI</button>'
    +         '<button class="export-btn pro-gate" id="exp-pdf"  title="Plan Pro">PDF</button>'
    +         '<button class="export-btn pro-gate" id="exp-mp3"  title="Plan Pro">MP3</button>'
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
          +   '<span class="dtag">' + gDisplaySteps + ' pasos</span>'
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
    +         '<div class="astat"><div class="astat-num">' + (author.followers || 0) + '</div><div class="astat-label">Seguid.</div></div>'
    +       '</div>'
    +       '<button class="btn-follow-block" id="follow-btn">+ Seguir</button>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Info del <em>groove</em></div>'
    +       '<div class="info-list">'
    +         '<div class="info-item"><span class="info-key">Género</span><span class="info-val">' + esc(g.genre) + '</span></div>'
    +         '<div class="info-item"><span class="info-key">Tempo</span><span class="info-val"><em>' + g.bpm + '</em> BPM</span></div>'
    +         '<div class="info-item"><span class="info-key">Compás</span><span class="info-val">' + gDisplayTimeSig + '</span></div>'
    +         '<div class="info-item"><span class="info-key">Pasos</span><span class="info-val">' + gDisplaySteps + '</span></div>'
    +         '<div class="info-item"><span class="info-key">Dificultad</span><div class="diff-bar" id="diff-bar"></div></div>'
    +         (g.createdAt ? '<div class="info-item"><span class="info-key">Subido</span><span class="info-val">' + new Date(g.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) + '</span></div>' : '')
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
    + '</div>'

    + '<div class="upgrade-modal-bg" id="upgrade-modal-bg" style="display:none">'
    +   '<div class="upgrade-modal">'
    +     '<button class="upgrade-close" id="upgrade-close">×</button>'
    +     '<div class="upgrade-icon">🔒</div>'
    +     '<div class="upgrade-title">Función <em>Pro</em></div>'
    +     '<div class="upgrade-sub">Esta exportación está disponible en el plan Pro o Estudio.</div>'
    +     '<div class="upgrade-plans">'
    +       '<div class="upgrade-plan">'
    +         '<div class="upgrade-plan-name">Pro</div>'
    +         '<div class="upgrade-plan-price">$5.990/mes</div>'
    +         '<div class="upgrade-plan-features">MIDI · PDF · MP3 · Stats</div>'
    +         '<button class="upgrade-btn-pro" id="upgrade-btn-pro">Obtener Pro</button>'
    +       '</div>'
    +       '<div class="upgrade-plan studio">'
    +         '<div class="upgrade-plan-name">Estudio</div>'
    +         '<div class="upgrade-plan-price">$14.990/mes</div>'
    +         '<div class="upgrade-plan-features">Todo Pro + API + Privados</div>'
    +         '<button class="upgrade-btn-studio" id="upgrade-btn-studio">Obtener Estudio</button>'
    +       '</div>'
    +     '</div>'
    +     '<button class="upgrade-btn-demo" id="upgrade-btn-demo">Simular Pro (demo)</button>'
    +   '</div>'
    + '</div>';

  // ── Apply the groove's saved kit so the player loads with the author's intended sound ──
  if (g.kit) { DH.Audio.setKit(g.kit); }

  // ── Mount minimal player — rows come from the currently selected kit so the grid
  //    changes when the user picks a different kit (CR-78 = 4 rows, Pearl = up to 11).
  var player = null;
  function buildPlayer(bpmOverride) {
    if (player) { try { player.destroy(); } catch (e) {} }
    var gTimeSigConf = (DH.TIME_SIGS && g.timeSig)
      ? (DH.TIME_SIGS.find(function (t) { return t.id === g.timeSig; }) || DH.TIME_SIGS[0])
      : null;
    var gSteps = gTimeSigConf ? gTimeSigConf.stepsPerBar * (g.bars || 1) : DH.STEPS;
    var gStepsPerBeat = gTimeSigConf ? gTimeSigConf.stepsPerBeat : 4;
    player = DH.createPlayer({
      container: document.getElementById('player-host'),
      pattern: g.pattern,
      bpm: bpmOverride != null ? bpmOverride : g.bpm,
      editable: false,
      chrome: 'minimal',
      rows: DH.Audio.getKitPieces(DH.Audio.getKit()),
      idPrefix: 'gpv2',
      steps: gSteps,
      stepsPerBeat: gStepsPerBeat,
      timeSig: g.timeSig || '4/4',
      onPlayStateChange: function (playing) {
        var btn = document.getElementById('g-btn-play');
        var st = document.getElementById('g-status');
        btn.classList.toggle('on', playing);
        document.getElementById('g-ico-play').style.display = playing ? 'none' : '';
        document.getElementById('g-ico-stop').style.display = playing ? '' : 'none';
        st.textContent = playing ? 'Reproduciendo' : 'Detenido';
        st.className = playing ? 'play-status on' : 'play-status';
        // Count every time playback starts (each Play press), even from the same client.
        if (playing && !isNaN(numGrooveId)) {
          DH.Api.incrementPlays(numGrooveId).catch(function () {});
          g.plays = (g.plays || 0) + 1;
          var playsStat = app.querySelector('.groove-stats-inline .gstat-num');
          if (playsStat) playsStat.textContent = pretty(g.plays);
        }
      }
    });
    DH.Router.setPlayer(player);
  }
  buildPlayer();

  document.getElementById('g-btn-play').addEventListener('click', function () { player.toggle(); });
  function setGrooveBpm(b) {
    b = Math.max(40, Math.min(220, b));
    player.setBpm(b);
    document.getElementById('g-bpm-display').innerHTML = b + '<span>BPM</span>';
    document.getElementById('g-bpm-range').value = b;
  }
  document.getElementById('g-bpm-range').addEventListener('input', function () {
    setGrooveBpm(parseInt(this.value, 10));
  });
  document.getElementById('g-bpm-down').addEventListener('click', function () {
    setGrooveBpm(parseInt(document.getElementById('g-bpm-range').value, 10) - 1);
  });
  document.getElementById('g-bpm-up').addEventListener('click', function () {
    setGrooveBpm(parseInt(document.getElementById('g-bpm-range').value, 10) + 1);
  });

  // ── Kit selector: start with the groove's saved kit; user can still override ──
  var kitSelect = document.getElementById('g-kit-select');
  var kitHint = document.getElementById('g-kit-hint');
  var KIT_HINTS = {
    pearl: 'Batería acústica real',
    tr909: 'Máquina Roland TR-909 · techno/house',
    lm2:   'LinnDrum · sonido 80s',
    cr78:  'Roland CR-78 · vintage analógica'
  };
  // The groove's kit was already applied above; getKit() returns the active one.
  var activeKit = DH.Audio.getKit();
  DH.Audio.listKits().forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.label + ' · ' + k.tag;
    if (k.id === activeKit) opt.selected = true;
    kitSelect.appendChild(opt);
  });
  if (kitHint) kitHint.textContent = KIT_HINTS[activeKit] || '';
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

  // ── numGrooveId used by fav sync and comment fetch ──
  var numGrooveId = parseInt(g.id, 10);

  // ── Sync favorite state for THIS groove via dedicated status endpoint ──
  // Uses /api/users/me/favorites/{id}/status — returns { favorited, totalFavorites }
  // for exactly this groove. No pagination, no field-name ambiguity.
  // Guard: if the user already clicked the heart, their action is authoritative —
  // a late-arriving status response (issued before the click) must NOT overwrite it.
  var userToggledFav = false;
  var favSyncPending = DH.Store.isLoggedIn() && !isNaN(numGrooveId);
  if (favSyncPending) {
    DH.Api.getFavoriteStatus(numGrooveId).then(function (res) {
      // Re-enable the heart buttons now that backend state is known (see disable below).
      enableFavButtons();
      if (userToggledFav) return; // user already acted; ignore stale sync
      var status = res && (res.data || res);
      if (!status || typeof status.favorited === 'undefined') return;
      var grooveIdStr = String(g.id);
      var isInBackend = !!status.favorited;
      var isInLocal   = DH.Store.isFavorite(g.id);
      if (isInBackend !== isInLocal) {
        var favs = DH.Store.getFavorites();
        if (isInBackend) {
          if (favs.indexOf(grooveIdStr) === -1) favs.push(grooveIdStr);
        } else {
          favs = favs.filter(function (id) { return id !== grooveIdStr; });
        }
        localStorage.setItem('dh.favorites', JSON.stringify(favs));
        refreshFav();
      }
    }).catch(function () { enableFavButtons(); });
  }

  // ── Fetch real author stats from API and update the sidebar ──
  Promise.all([
    DH.Api.getUser(g.author),
    DH.Api.getFollowers(g.author),
    DH.Api.getGrooves({ size: 1000 })
  ]).then(function (results) {
    var apiUser      = results[0];
    var followersPage = results[1];
    var allGroovesPage = results[2];
    if (!apiUser) return;

    var authorGrooves = ((allGroovesPage && allGroovesPage.content) || [])
      .filter(function (ag) { return ag.authorUsername === g.author; });
    var totalLikes = authorGrooves.reduce(function (acc, ag) { return acc + (ag.likes || 0); }, 0);
    var followersCount = (followersPage && followersPage.totalElements) ||
      ((followersPage && followersPage.content && followersPage.content.length) || 0);

    var bioEl = app.querySelector('.author-bio-v2');
    if (bioEl && apiUser.bio) bioEl.textContent = apiUser.bio;

    var statNums = app.querySelectorAll('.astat-num');
    if (statNums[0]) statNums[0].textContent = authorGrooves.length;
    if (statNums[1]) statNums[1].textContent = pretty(totalLikes);
    if (statNums[2]) statNums[2].textContent = followersCount;
  }).catch(function () {});


  // ── Fetch API comments and merge after initial render ──
  if (!isNaN(numGrooveId)) {
    DH.Api.getComments(numGrooveId).then(function (page) {
      var apiComments = ((page && page.content) || []).map(DH.Adapter.comment);
      if (!apiComments.length) return;
      // Merge: local comments first, then API comments (dedup by user+text not feasible — just append)
      var localComments = DH.Store.getComments(g.id);
      var combined = localComments.slice();
      apiComments.forEach(function (ac) {
        var alreadyLocal = combined.some(function (lc) { return lc.user === ac.user && lc.text === ac.text; });
        if (!alreadyLocal) combined.push(ac);
      });
      // Update comments section title with real count
      var cmtTitle = app.querySelector('.comments-section-v2 .section-title-sm');
      if (cmtTitle) cmtTitle.innerHTML = 'Comentarios <em>(' + combined.length + ')</em>';
      // Re-render with merged list
      listEl.innerHTML = '';
      if (!combined.length) {
        listEl.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);font-weight:300;">Sé el primero en comentar este groove.</div>';
        return;
      }
      combined.forEach(function (c, i) {
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
        if (i < combined.length - 1) { var hr = document.createElement('hr'); hr.className = 'comment-divider'; listEl.appendChild(hr); }
      });
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
    }).catch(function () {});
  }

  // ── Actions ──
  var likeBtn = document.getElementById('g-like');
  var saveBtn = document.getElementById('g-save');
  function enableFavButtons() {
    if (likeBtn) likeBtn.disabled = false;
    if (saveBtn) saveBtn.disabled = false;
  }
  // Disable the heart buttons until the status sync confirms the real backend state.
  // This prevents a click on stale local state from sending a redundant POST → 409.
  // The status endpoint is a single-row lookup, so this window is imperceptible.
  if (favSyncPending) {
    if (likeBtn) likeBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
  }
  function refreshFav() {
    var fav = DH.Store.isFavorite(g.id);
    likeBtn.classList.toggle('liked', fav);
    saveBtn.classList.toggle('saved', fav);
    saveBtn.textContent = fav ? '✓ Guardado' : '⊕ Guardar';
    // g.likes is the single source of truth (mutated optimistically in doFav).
    // Show it directly — no "+1 if fav", that double-counted against doFav's mutation.
    likeBtn.textContent = '♥ ' + (g.likes || 0);
    var likesStat = app.querySelectorAll('.groove-stats-inline .gstat-num')[1];
    if (likesStat) likesStat.textContent = g.likes || 0;
  }
  function doFav() {
    if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
    userToggledFav = true; // mark interaction so the async status sync won't clobber local state
    var added = DH.Store.toggleFavorite(g.id);
    var delta = added ? 1 : -1;
    g.likes = Math.max(0, (g.likes || 0) + delta);
    var grooveInMem = DH.GROOVES.filter(function (x) { return String(x.id) === String(g.id); })[0];
    if (grooveInMem) grooveInMem.likes = g.likes;
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
  // ── Shake toggle ──
  var shakeBtn = document.getElementById('g-shake');
  function updateGrooveShakeBtn() {
    shakeBtn.classList.toggle('shake-off', !DH.shakeEnabled);
    shakeBtn.title = DH.shakeEnabled ? 'Vibración activada' : 'Vibración desactivada';
  }
  updateGrooveShakeBtn();
  shakeBtn.addEventListener('click', function () {
    DH.shakeEnabled = !DH.shakeEnabled;
    localStorage.setItem('dh-shake', DH.shakeEnabled ? '1' : '0');
    updateGrooveShakeBtn();
  });

  document.getElementById('g-share').addEventListener('click', function () {
    var url = location.origin + '/groove/' + g.slug;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { DH.UI.toast('Link copiado al portapapeles', 'success'); })
        .catch(function () { prompt('Copiá el link al groove:', url); });
    } else { prompt('Copiá el link al groove:', url); }
  });
  app.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.origin + '/groove/' + g.slug;
      var kind = b.getAttribute('data-share');
      if (kind === 'copy') { try { navigator.clipboard.writeText(url); alert('Link copiado'); } catch (e) { prompt('Link:', url); } }
      else if (kind === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(g.title + ' — ' + url), '_blank');
      else if (kind === 'instagram') { try { navigator.clipboard.writeText(url); alert('Link copiado — pegalo en tu historia de Instagram'); } catch (e) { prompt('Link:', url); } }
    });
  });

  document.getElementById('follow-btn').addEventListener('click', function (e) {
    if (!DH.Store.isLoggedIn()) { DH.UI.openModal('login'); return; }
    var btn = e.currentTarget;
    var isFollowing = btn.classList.contains('following');
    var action = isFollowing ? DH.Api.unfollow(g.author) : DH.Api.follow(g.author);
    action.then(function () {
      btn.classList.toggle('following');
      btn.textContent = btn.classList.contains('following') ? '✓ Siguiendo' : '+ Seguir';
    }).catch(function (err) {
      DH.UI.toast((err && err.message) || 'Error', 'error');
    });
  });

  // ── Sync initial follow state from API ──
  if (DH.Store.isLoggedIn() && DH.Store.getUser().user !== g.author) {
    DH.Api.getFollowStatus(g.author).then(function (st) {
      if (st && st.following) {
        var fb = document.getElementById('follow-btn');
        if (fb) { fb.classList.add('following'); fb.textContent = '✓ Siguiendo'; }
      }
    }).catch(function () {});
  }

  // ── Export ──
  function openUpgradeModal() {
    var m = document.getElementById('upgrade-modal-bg');
    if (m) m.style.display = 'flex';
  }
  function closeUpgradeModal() {
    var m = document.getElementById('upgrade-modal-bg');
    if (m) m.style.display = 'none';
  }
  var expJson = document.getElementById('exp-json');
  var expMidi = document.getElementById('exp-midi');
  var expPdf  = document.getElementById('exp-pdf');
  var expMp3  = document.getElementById('exp-mp3');
  if (expJson) expJson.addEventListener('click', function() { DH.Export.json(g); });
  if (expMidi) expMidi.addEventListener('click', function() {
    if (!DH.Store.isPro()) { openUpgradeModal(); return; }
    DH.Export.midi(g);
  });
  if (expPdf) expPdf.addEventListener('click', function() {
    if (!DH.Store.isPro()) { openUpgradeModal(); return; }
    DH.Export.pdf(g);
  });
  if (expMp3) expMp3.addEventListener('click', function() {
    if (!DH.Store.isPro()) { openUpgradeModal(); return; }
    expMp3.textContent = 'Renderizando...';
    expMp3.disabled = true;
    DH.Export.mp3(g);
    setTimeout(function() { if(expMp3){ expMp3.textContent = 'MP3'; expMp3.disabled = false; } }, 8000);
  });
  var closeBtn = document.getElementById('upgrade-close');
  var modalBg  = document.getElementById('upgrade-modal-bg');
  if (closeBtn) closeBtn.addEventListener('click', closeUpgradeModal);
  if (modalBg)  modalBg.addEventListener('click', function(e) { if (e.target === modalBg) closeUpgradeModal(); });
  var demoPro   = document.getElementById('upgrade-btn-demo');
  var upgPro    = document.getElementById('upgrade-btn-pro');
  var upgStudio = document.getElementById('upgrade-btn-studio');
  if (demoPro) demoPro.addEventListener('click', function() {
    DH.Store.setPlan('pro');
    closeUpgradeModal();
    document.querySelectorAll('.export-btn.pro-gate').forEach(function(b) { b.classList.add('unlocked'); });
    alert('Plan Pro activado (modo demo).');
  });
  if (upgPro)    upgPro.addEventListener('click',    function() { DH.UI.openModal('register'); closeUpgradeModal(); });
  if (upgStudio) upgStudio.addEventListener('click', function() { DH.UI.openModal('register'); closeUpgradeModal(); });

  // Update button styles based on current plan
  if (DH.Store.isPro()) {
    document.querySelectorAll('.export-btn.pro-gate').forEach(function(b) { b.classList.add('unlocked'); });
  }

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (ev) { ev.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });

  // If we arrived from a card's comment icon, scroll straight to the comments section.
  if (DH.focusComments) {
    DH.focusComments = false;
    setTimeout(function () {
      var cs = app.querySelector('.comments-section-v2');
      if (cs) cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }
};
