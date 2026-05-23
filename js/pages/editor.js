// Editor — visual layout aligned with mock/drumhub-editor.html
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.editor = function (params) {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle(params && params.slug ? 'Editar groove' : 'Subir groove');

  if (!DH.Store.isLoggedIn()) {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Necesitás una cuenta</h4><p>Para subir grooves tenés que ingresar o crear una cuenta gratis.</p><button class="btn-primary" id="ed-login">Ingresar</button></div></div>';
    document.getElementById('ed-login').addEventListener('click', function () { DH.UI.openModal('login'); });
    return;
  }

  var session = DH.Store.getUser();

  // Modo edición si vino slug en la URL: cargamos el groove existente y pre-llenamos el state.
  var editingGroove = null;
  if (params && params.slug) {
    editingGroove = DH.Store.findAnyGroove(params.slug);
    if (!editingGroove) {
      app.innerHTML = '<div class="page"><div class="empty"><h4>Groove no encontrado</h4><p>El groove que querés editar no existe.</p><button class="btn-primary" onclick="DH.Router.go(\'/\')">Volver al inicio</button></div></div>';
      return;
    }
    if (editingGroove.author !== session.user) {
      app.innerHTML = '<div class="page"><div class="empty"><h4>No tenés permisos</h4><p>Solo el autor del groove puede editarlo.</p><button class="btn-primary" onclick="DH.Router.go(\'/groove/' + editingGroove.slug + '\')">Volver al groove</button></div></div>';
      return;
    }
    // Guard adicional: solo permito editar grooves que efectivamente están en mi userGrooves storage.
    // Los del mock global no deberían ser editables porque updateUserGroove fallaría en silencio.
    var isInMyStorage = DH.Store.getUserGrooves().some(function (g) { return g.id === editingGroove.id; });
    if (!isInMyStorage) {
      app.innerHTML = '<div class="page"><div class="empty"><h4>Este groove no se puede editar</h4><p>Es un groove de la biblioteca base de DrumHub. Si querés una variante, podés subir uno nuevo basado en este patrón.</p><button class="btn-primary" onclick="DH.Router.go(\'/upload\')">+ Subir mi versión</button></div></div>';
      return;
    }
  }
  var levelToCode = { 'Básico': 'b', 'Intermedio': 'i', 'Avanzado': 'a' };

  var state = editingGroove ? {
    title: editingGroove.title || '',
    genre: editingGroove.genre || '',
    bpm: editingGroove.bpm || 90,
    level: editingGroove.level || 'Básico',
    levelCode: levelToCode[editingGroove.level] || 'b',
    desc: editingGroove.desc || '',
    tags: (editingGroove.tags || []).slice(),
    pattern: editingGroove.pattern || DH.PRESETS.rock
  } : {
    title: '',
    genre: '',
    bpm: 90,
    level: 'Básico',
    levelCode: 'b',
    desc: '',
    tags: ['shuffle', 'ghost notes'],
    pattern: DH.PRESETS.rock
  };

  app.innerHTML = ''
    + '<div class="breadcrumb">'
    +   '<a data-go="/">Inicio</a><span>/</span>'
    +   '<a data-go="/profile/' + esc(session.user) + '">Mi perfil</a><span>/</span>'
    +   'Subir groove'
    + '</div>'

    + '<div class="page-header-v2">'
    +   '<div class="page-title-v2">' + (editingGroove ? 'Editar <em>groove</em>' : 'Subir un <em>groove</em>') + '</div>'
    +   '<div class="page-sub-v2">' + (editingGroove ? 'Ajustá el patrón, los datos o la descripción. Guardás los cambios al final.' : 'Compartí tu patrón con la comunidad. Tardás menos de 5 minutos.') + '</div>'
    + '</div>'

    + '<div class="steps-bar">'
    +   '<div class="step-item done"><div class="step-num">01</div><span>Info</span></div>'
    +   '<div class="step-item active"><div class="step-num">02</div><span>Editor</span></div>'
    +   '<div class="step-item"><div class="step-num">03</div><span>Preview</span></div>'
    +   '<div class="step-item"><div class="step-num">04</div><span>Publicar</span></div>'
    + '</div>'

    + '<div class="main2">'
    +   '<div class="col-left">'

    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon">📝</div>Información del <em>groove</em></div>'
    +       '<form id="upload-form">'
    +         '<div class="field">'
    +           '<label>Nombre del groove *</label>'
    +           '<input type="text" name="title" placeholder="ej: Basic Rock Variation, One Drop Funky..." value="' + esc(state.title) + '" required>'
    +           '<div class="field-hint">Elegí un nombre descriptivo que ayude a otros bateristas a encontrarlo.</div>'
    +         '</div>'
    +         '<div class="field-row">'
    +           '<div class="field">'
    +             '<label>Género *</label>'
    +             '<select name="genre" required>'
    +               '<option value="">Seleccioná un género</option>'
    +               DH.GENRES_LIST.map(function (g) { return '<option' + (g === state.genre ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('')
    +             '</select>'
    +           '</div>'
    +           '<div class="field">'
    +             '<label>Tempo (BPM) *</label>'
    +             '<input type="number" name="bpm" min="40" max="220" value="' + state.bpm + '" id="form-bpm" required>'
    +             '<div class="field-hint">BPM sugerido para practicar.</div>'
    +           '</div>'
    +         '</div>'
    +         '<div class="field">'
    +           '<label>Dificultad *</label>'
    +           '<div class="diff-selector">'
    +             '<button type="button" class="diff-btn b' + (state.levelCode === 'b' ? ' active' : '') + '" data-diff="b" data-label="Básico">Básico</button>'
    +             '<button type="button" class="diff-btn i' + (state.levelCode === 'i' ? ' active' : '') + '" data-diff="i" data-label="Intermedio">Intermedio</button>'
    +             '<button type="button" class="diff-btn a' + (state.levelCode === 'a' ? ' active' : '') + '" data-diff="a" data-label="Avanzado">Avanzado</button>'
    +           '</div>'
    +         '</div>'
    +         '<div class="field">'
    +           '<label>Descripción</label>'
    +           '<textarea name="desc" id="form-desc" maxlength="500" placeholder="Contá de qué se trata el groove, cómo practicarlo, en qué canciones aparece...">' + esc(state.desc) + '</textarea>'
    +           '<div class="char-count" id="char-count">0 / 500</div>'
    +         '</div>'
    +         '<div class="field">'
    +           '<label>Etiquetas</label>'
    +           '<div class="tags-input" id="tags-input">'
    +             state.tags.map(function (t) { return '<span class="tag-chip">' + esc(t) + ' <button type="button" data-remove="1">×</button></span>'; }).join('')
    +             '<input type="text" class="tag-text-input" id="tag-input" placeholder="Agregá etiquetas...">'
    +           '</div>'
    +           '<div class="field-hint">Presioná Enter o coma para agregar. Máximo 8 etiquetas.</div>'
    +         '</div>'
    +       '</form>'
    +     '</div>'

    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon">🥁</div>Editor de <em>patrón</em></div>'
    +       '<div class="kit-bar">'
    +         '<div class="kit-bar-label">▸ Kit de batería</div>'
    +         '<select id="ed-kit-select" class="kit-bar-select"></select>'
    +         '<span class="kit-bar-hint" id="ed-kit-hint"></span>'
    +       '</div>'
    +       '<div class="editor-toolbar">'
    +         '<button class="tool-btn" data-tpl="rock">Rock</button>'
    +         '<button class="tool-btn" data-tpl="funk">Funk</button>'
    +         '<button class="tool-btn" data-tpl="reggae">Reggae</button>'
    +         '<button class="tool-btn" data-tpl="bossa">Bossa</button>'
    +         '<button class="tool-btn" data-tpl="jazz">Jazz</button>'
    +         '<button class="tool-btn" data-tpl="metal">Metal</button>'
    +         '<div class="tool-sep"></div>'
    +         '<button class="tool-btn danger" id="btn-clear">Limpiar</button>'
    +         '<div class="bpm-wrap-toolbar">'
    +           '<span class="bpm-label">BPM</span>'
    +           '<div class="bpm-val" id="bpm-val">' + state.bpm + '</div>'
    +           '<input type="range" class="bpm-range-sm" id="bpm-range" min="40" max="220" value="' + state.bpm + '">'
    +         '</div>'
    +       '</div>'
    +       '<div id="player-host"></div>'
    +       '<div class="player-ctrl-editor">'
    +         '<button class="btn-play-sm-editor" id="ed-play">'
    +           '<svg id="ed-ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
    +           '<svg id="ed-ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'
    +         '</button>'
    +         '<span class="play-status" id="ed-status">Escuchá tu groove</span>'
    +       '</div>'
    +     '</div>'

    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon">👁</div>Preview del <em>groove</em></div>'
    +       '<p style="font-size:0.78rem;color:var(--muted);margin-bottom:20px;font-weight:300">Así va a verse tu groove en la plataforma cuando otros bateristas lo busquen.</p>'
    +       '<div class="preview-box">'
    +         '<div class="preview-genre" id="prev-genre">' + esc(state.genre || '—') + '</div>'
    +         '<div class="preview-title" id="prev-title">Mi groove</div>'
    +         '<div class="preview-author">por <span>' + esc(session.user) + '</span></div>'
    +         '<div class="preview-grid-rows" id="preview-rows"></div>'
    +         '<div class="preview-tags">'
    +           '<span class="preview-tag" id="prev-bpm">' + state.bpm + ' BPM</span>'
    +           '<span class="preview-tag" id="prev-diff">' + esc(state.level) + '</span>'
    +         '</div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="submit-area">'
    +       '<div class="submit-left">'
    +         '<div class="submit-title">¿Todo listo para <em>publicar?</em></div>'
    +         '<div class="submit-sub">Tu groove va a estar disponible para toda la comunidad.</div>'
    +       '</div>'
    +       '<div class="submit-btns">'
    +         '<button class="btn-draft" type="button" id="btn-draft">Guardar borrador</button>'
    +         '<button class="btn-publish" id="btn-publish" type="button">' + (editingGroove ? 'Guardar cambios →' : 'Publicar groove →') + '</button>'
    +       '</div>'
    +     '</div>'

    +   '</div>'

    +   '<div class="sidebar-col">'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Progreso del <em>formulario</em></div>'
    +       '<div class="progress-list" id="progress-list">'
    +         '<div class="progress-item"><span class="progress-label">Nombre</span><div class="progress-bar"><div class="progress-fill partial" id="prog-title" style="width:0%"></div></div></div>'
    +         '<div class="progress-item"><span class="progress-label">Género</span><div class="progress-bar"><div class="progress-fill partial" id="prog-genre" style="width:0%"></div></div></div>'
    +         '<div class="progress-item"><span class="progress-label">BPM</span><div class="progress-bar"><div class="progress-fill" id="prog-bpm" style="width:100%"></div></div></div>'
    +         '<div class="progress-item"><span class="progress-label">Dificultad</span><div class="progress-bar"><div class="progress-fill" id="prog-diff" style="width:100%"></div></div></div>'
    +         '<div class="progress-item"><span class="progress-label">Descripción</span><div class="progress-bar"><div class="progress-fill partial" id="prog-desc" style="width:0%"></div></div></div>'
    +         '<div class="progress-item"><span class="progress-label">Patrón</span><div class="progress-bar"><div class="progress-fill" id="prog-pattern" style="width:50%"></div></div></div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Consejos para un <em>buen groove</em></div>'
    +       '<div class="tips-list">'
    +         '<div class="tip-item"><div class="tip-icon">🎯</div><div class="tip-text"><strong>Nombre descriptivo:</strong> incluí el estilo o la técnica. "Funk Ghost Note" es mejor que "Mi groove".</div></div>'
    +         '<div class="tip-item"><div class="tip-icon">📝</div><div class="tip-text"><strong>Describí el contexto:</strong> en qué canciones aparece, qué técnica requiere, cómo practicarlo.</div></div>'
    +         '<div class="tip-item"><div class="tip-icon">🎚️</div><div class="tip-text"><strong>BPM honesto:</strong> poné el tempo al que el groove "suena bien", no el máximo que podés tocar.</div></div>'
    +         '<div class="tip-item"><div class="tip-icon">🏷️</div><div class="tip-text"><strong>Etiquetas útiles:</strong> pensá cómo lo buscaría otro baterista.</div></div>'
    +       '</div>'
    +     '</div>'

    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Colores de <em>instrumentos</em></div>'
    +       '<div class="legend" id="legend-editor"></div>'
    +     '</div>'

    +   '</div>'
    + '</div>';

  // ── Legend ──
  var legend = document.getElementById('legend-editor');
  DH.ROWS.forEach(function (row) {
    var item = document.createElement('div'); item.className = 'legend-item';
    item.innerHTML = '<div class="legend-dot" style="background:var(--' + row.color + ')"></div>' + esc(row.name);
    legend.appendChild(item);
  });

  // ── Player (minimal chrome) — grid rows come from the selected kit, rebuilds on kit change ──
  var player = null;
  function buildEditorPlayer() {
    if (player) { try { player.destroy(); } catch (e) {} }
    player = DH.createPlayer({
      container: document.getElementById('player-host'),
      pattern: state.pattern,
      bpm: state.bpm,
      editable: true,
      chrome: 'minimal',
      rows: DH.Audio.getKitPieces(DH.Audio.getKit()),
      idPrefix: 'edv2',
      onPatternChange: function (p) { state.pattern = p; updatePreview(); updatePatternProgress(); },
      onPlayStateChange: function (playing) {
        var b = document.getElementById('ed-play');
        var st = document.getElementById('ed-status');
        b.classList.toggle('on', playing);
        document.getElementById('ed-ico-play').style.display = playing ? 'none' : '';
        document.getElementById('ed-ico-stop').style.display = playing ? '' : 'none';
        st.textContent = playing ? 'Reproduciendo' : 'Detenido';
        st.className = playing ? 'play-status on' : 'play-status';
      }
    });
    DH.Router.setPlayer(player);
  }
  buildEditorPlayer();

  document.getElementById('ed-play').addEventListener('click', function () { player.toggle(); });

  // ── Kit selector — comparte localStorage.dh.selectedKit con la página de groove ──
  var kitSelect = document.getElementById('ed-kit-select');
  var kitHint = document.getElementById('ed-kit-hint');
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
    // Capture current bpm so the rebuild doesn't reset it
    state.bpm = player ? player.getBpm() : state.bpm;
    buildEditorPlayer();
  });

  // ── BPM sync (range + form input) ──
  function setBpmAll(b) {
    b = Math.max(40, Math.min(220, parseInt(b, 10) || 90));
    state.bpm = b;
    document.getElementById('bpm-val').textContent = b;
    document.getElementById('bpm-range').value = b;
    document.getElementById('form-bpm').value = b;
    document.getElementById('prev-bpm').textContent = b + ' BPM';
    player.setBpm(b);
  }
  document.getElementById('bpm-range').addEventListener('input', function () { setBpmAll(this.value); });
  document.getElementById('form-bpm').addEventListener('input', function () { setBpmAll(this.value); });

  // ── Templates / clear ──
  function patternHasHits(p) {
    if (!p) return false;
    for (var k in p) { if (p[k] && p[k].some && p[k].some(function (v) { return !!v; })) return true; }
    return false;
  }
  app.querySelectorAll('[data-tpl]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-tpl');
      var p = DH.PRESETS[key]; if (!p) return;
      if (patternHasHits(state.pattern) && !confirm('Esto reemplaza el patrón actual con el template "' + b.textContent + '". ¿Seguir?')) return;
      player.loadPattern(p);
      setBpmAll(p.bpm);
      state.pattern = p;
      updatePreview();
      updatePatternProgress();
    });
  });
  document.getElementById('btn-clear').addEventListener('click', function () {
    player.clearGrid();
    state.pattern = player.getPattern();
    updatePreview();
    updatePatternProgress();
  });

  // ── Difficulty selector ──
  app.querySelectorAll('.diff-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      app.querySelectorAll('.diff-btn').forEach(function (x) { x.classList.remove('active', 'b', 'i', 'a'); x.classList.add(x.getAttribute('data-diff')); });
      b.classList.add('active');
      state.levelCode = b.getAttribute('data-diff');
      state.level = b.getAttribute('data-label');
      document.getElementById('prev-diff').textContent = state.level;
    });
  });

  // ── Form ──
  var form = document.getElementById('upload-form');
  var titleInput = form.querySelector('[name="title"]');
  var genreSelect = form.querySelector('[name="genre"]');
  var descInput = document.getElementById('form-desc');
  var charCount = document.getElementById('char-count');

  titleInput.addEventListener('input', function () {
    state.title = this.value;
    document.getElementById('prev-title').textContent = state.title || 'Mi groove';
    setProg('prog-title', state.title.length > 0 ? 100 : 0);
  });
  genreSelect.addEventListener('change', function () {
    state.genre = this.value;
    document.getElementById('prev-genre').textContent = state.genre || '—';
    setProg('prog-genre', state.genre ? 100 : 0);
  });
  descInput.addEventListener('input', function () {
    state.desc = this.value;
    charCount.textContent = state.desc.length + ' / 500';
    setProg('prog-desc', Math.min(100, Math.round(state.desc.length / 5)));
  });

  function setProg(id, pct) {
    var el = document.getElementById(id); if (!el) return;
    el.style.width = pct + '%';
    el.className = 'progress-fill' + (pct >= 100 ? '' : ' partial');
  }
  function updatePatternProgress() {
    var hits = 0;
    DH.ROWS.forEach(function (r) {
      var row = state.pattern[r.id]; if (!row) return;
      row.forEach(function (v) { if (v) hits++; });
    });
    var pct = Math.min(100, Math.round(hits / 8 * 100));
    setProg('prog-pattern', pct);
  }

  // ── Preview rows ──
  var prevHost = document.getElementById('preview-rows');
  function updatePreview() {
    prevHost.innerHTML = '';
    var rows = [
      { id: 'hihat', label: 'Hi-Hat' },
      { id: 'snare', label: 'Redob.' },
      { id: 'kick',  label: 'Bombo'  }
    ];
    rows.forEach(function (r) {
      var arr = state.pattern[r.id] || new Array(16).fill(0);
      var row = document.createElement('div'); row.className = 'prev-row';
      var lbl = document.createElement('div'); lbl.className = 'prev-lbl'; lbl.textContent = r.label;
      var cells = document.createElement('div'); cells.className = 'prev-cells';
      arr.forEach(function (v) {
        var c = document.createElement('div');
        var cls = 'prev-cell';
        if (v) cls += ' on' + (r.id === 'snare' ? ' snare' : r.id === 'kick' ? ' kick' : '');
        c.className = cls;
        cells.appendChild(c);
      });
      row.appendChild(lbl); row.appendChild(cells);
      prevHost.appendChild(row);
    });
  }
  updatePreview();
  updatePatternProgress();

  // ── Tags input ──
  var tagsInput = document.getElementById('tags-input');
  var tagText = document.getElementById('tag-input');
  function bindRemove(scope) {
    (scope || tagsInput).querySelectorAll('[data-remove]').forEach(function (b) {
      if (b.dataset.bound) return;
      b.dataset.bound = '1';
      b.addEventListener('click', function () {
        var chip = b.parentElement;
        state.tags = state.tags.filter(function (t) { return t !== chip.textContent.replace('×', '').trim(); });
        chip.remove();
      });
    });
  }
  bindRemove();
  tagsInput.addEventListener('click', function () { tagText.focus(); });
  tagText.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      var val = tagText.value.replace(',', '').trim();
      if (!val) return;
      if (state.tags.length >= 8) return;
      if (state.tags.indexOf(val) !== -1) { tagText.value = ''; return; }
      state.tags.push(val);
      var chip = document.createElement('span'); chip.className = 'tag-chip';
      chip.innerHTML = esc(val) + ' <button type="button" data-remove="1">×</button>';
      tagsInput.insertBefore(chip, tagText);
      bindRemove();
      tagText.value = '';
    }
  });

  // ── Guardar borrador (a localStorage simple) ──
  var DRAFT_KEY = 'dh.editorDraft' + (editingGroove ? '.' + editingGroove.id : '');
  document.getElementById('btn-draft').addEventListener('click', function () {
    var draft = {
      title: state.title, genre: state.genre, level: state.level, bpm: state.bpm,
      desc: state.desc, tags: state.tags.slice(), pattern: player.getPattern(), savedAt: Date.now()
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) {}
    var btn = this; var orig = btn.textContent;
    btn.textContent = '✓ Borrador guardado'; btn.style.borderColor = 'var(--accent)'; btn.style.color = 'var(--accent)';
    setTimeout(function () { btn.textContent = orig; btn.style.borderColor = ''; btn.style.color = ''; }, 1500);
  });

  // ── Publish / Update ──
  document.getElementById('btn-publish').addEventListener('click', function () {
    if (!state.title.trim()) { alert('Falta el nombre del groove.'); titleInput.focus(); return; }
    if (!state.genre) { alert('Elegí un género.'); genreSelect.focus(); return; }
    var btn = this;
    btn.textContent = editingGroove ? 'Guardando...' : 'Publicando...';
    btn.style.background = 'var(--muted)';

    var changes = {
      title: state.title.trim(),
      genre: state.genre,
      level: state.level,
      bpm: state.bpm,
      desc: state.desc.trim(),
      tags: state.tags.slice(),
      pattern: player.getPattern()
    };

    if (editingGroove) {
      DH.Store.updateUserGroove(editingGroove.id, changes);
      setTimeout(function () {
        btn.textContent = '✓ Cambios guardados';
        btn.style.background = '#22c55e';
        btn.style.color = '#000';
        setTimeout(function () { DH.Router.go('/groove/' + editingGroove.slug); }, 600);
      }, 400);
    } else {
      var slug = state.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now().toString(36);
      var newGroove = Object.assign({
        id: 'u-' + Date.now(),
        slug: slug,
        author: session.user,
        likes: 0, plays: 0,
        createdAt: Date.now()
      }, changes);
      DH.Store.addUserGroove(newGroove);
      setTimeout(function () {
        btn.textContent = '✓ Publicado';
        btn.style.background = '#22c55e';
        btn.style.color = '#000';
        setTimeout(function () { DH.Router.go('/groove/' + slug); }, 600);
      }, 600);
    }
  });

  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
