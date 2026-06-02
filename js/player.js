// Reusable 16-step sequencer/player. Renders into a container.
// chrome: 'full' (default) renders header+grid+vol+controls;
// chrome: 'minimal' renders only beat-nums + drum-grid + step-row,
// letting the page provide its own header/BPM/controls (use setBpm, toggle, etc.)
window.DH = window.DH || {};

DH.createPlayer = function (opts) {
  var ROWS = opts.rows || DH.ROWS;
  var STEPS = opts.steps || DH.STEPS;
  var stepsPerBeat = opts.stepsPerBeat || 4;
  var grid = {};
  ROWS.forEach(function (r) { grid[r.id] = (opts.pattern && opts.pattern[r.id]) ? opts.pattern[r.id].map(Boolean) : new Array(STEPS).fill(false); });
  var vols = {}; Object.keys(DH.DEFAULT_VOLS).forEach(function (k) { vols[k] = DH.DEFAULT_VOLS[k]; });

  var bpm = opts.bpm || 90;
  var editable = opts.editable !== false;
  var presets = opts.presets || [];
  var idPrefix = opts.idPrefix || ('p' + Math.random().toString(36).slice(2, 7));
  var chrome = opts.chrome || 'full';
  var minimal = chrome === 'minimal';

  var isPlaying = false, curStep = 0, nextTime = 0, timerID = null;
  var LOOKAHEAD = 0.1, SCHEDULE = 0.2;
  var kickRowId = (function() { var id = null; (opts.rows || DH.ROWS).forEach(function(r) { if (r.id === 'kick') id = r.id; }); return id; })();

  var root = opts.container;
  root.innerHTML = '';

  var html;
  if (minimal) {
    html = ''
      + '<div class="grid-scroll">'
      +   '<div class="beat-nums" id="' + idPrefix + '-beat-nums"><div></div></div>'
      +   '<div class="drum-grid" id="' + idPrefix + '-drum-grid"></div>'
      +   '<div class="step-row" id="' + idPrefix + '-step-row"><div></div></div>'
      + '</div>';
  } else {
    html = ''
      + '<div class="player-card">'
      +   '<div class="player-header">'
      +     '<div class="player-meta">'
      +       '<h2 id="' + idPrefix + '-title">' + (opts.title || 'Mi Groove') + '</h2>'
      +       '<div class="tags">'
      +         '<span class="tag genre" id="' + idPrefix + '-genre">' + (opts.genre || 'Rock') + '</span>'
      +         '<span class="tag level" id="' + idPrefix + '-level">' + (opts.level || 'Básico') + '</span>'
      +         '<span class="tag">' + (opts.timeSig || '4/4') + '</span>'
      +       '</div>'
      +     '</div>'
      +     '<div class="bpm-ctrl">'
      +       '<div class="bpm-num" id="' + idPrefix + '-bpm-display">' + bpm + '<span>BPM</span></div>'
      +       '<input type="range" id="' + idPrefix + '-bpm-range" min="40" max="220" value="' + bpm + '">'
      +     '</div>'
      +   '</div>'
      +   '<div class="grid-wrap">'
      +     '<div class="beat-nums" id="' + idPrefix + '-beat-nums"><div></div></div>'
      +     '<div class="drum-grid" id="' + idPrefix + '-drum-grid"></div>'
      +   '</div>'
      +   '<div class="step-wrap"><div class="step-row" id="' + idPrefix + '-step-row"><div></div></div></div>'
      +   '<div class="vol-row" id="' + idPrefix + '-vol-row"></div>'
      +   '<div class="controls">'
      +     '<button class="btn-play" id="' + idPrefix + '-btn-play">'
      +       '<svg id="' + idPrefix + '-ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'
      +       '<svg id="' + idPrefix + '-ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'
      +     '</button>'
      +     '<span class="status" id="' + idPrefix + '-status">Tocá Play</span>'
      +     (editable ? '<button class="btn-clear" id="' + idPrefix + '-btn-clear">Limpiar</button>' : '')
      +     (presets.length ? '<div class="presets" id="' + idPrefix + '-presets"></div>' : '')
      +   '</div>'
      + '</div>';
  }
  root.innerHTML = html;
  root.style.setProperty('--grid-steps', STEPS);

  var $ = function (s) { return document.getElementById(idPrefix + '-' + s); };

  // ── Build cells ──
  var bn = $('beat-nums'), sr = $('step-row'), dg = $('drum-grid');
  for (var s = 0; s < STEPS; s++) {
    var n = document.createElement('div');
    n.className = 'beat-num' + (s % stepsPerBeat === 0 ? ' dn' : '');
    n.textContent = s % stepsPerBeat === 0 ? (s / stepsPerBeat + 1) : '·';
    bn.appendChild(n);
    var dot = document.createElement('div'); dot.className = 'sdot'; dot.id = idPrefix + '-dot-' + s;
    sr.appendChild(dot);
  }
  ROWS.forEach(function (row) {
    var lbl = document.createElement('div'); lbl.className = 'row-lbl';
    lbl.innerHTML = '<div class="row-dot" style="background:var(--' + row.color + ')"></div><span class="row-name">' + row.name + '</span>';
    lbl.id = idPrefix + '-lbl-' + row.id;
    lbl.style.setProperty('--rc', 'var(--' + row.color + ')');
    dg.appendChild(lbl);
    for (var s = 0; s < STEPS; s++) {
      (function (rowId, rowColor, step) {
        var cell = document.createElement('div');
        cell.className = 'cell ' + rowColor;
        cell.id = idPrefix + '-c-' + rowId + '-' + step;
        cell.style.setProperty('--rc', 'var(--' + rowColor + ')');
        if (grid[rowId][step]) cell.classList.add('active');
        if (editable) {
          cell.addEventListener('click', function () {
            grid[rowId][step] = !grid[rowId][step];
            cell.classList.toggle('active', grid[rowId][step]);
            if (opts.onPatternChange) opts.onPatternChange(getPattern());
          });
        }
        dg.appendChild(cell);
      })(row.id, row.color, s);
    }
  });

  // ── Playhead + column glow (smooth rAF draw loop) ──
  var vQueue = [], lastDrawStep = -1, lastStepTime = 0, rafID = null;
  var phCont = document.createElement('div'); phCont.className = 'ph-container';
  var cgEl = document.createElement('div'); cgEl.className = 'col-glow';
  var phEl = document.createElement('div'); phEl.className = 'playhead';
  phCont.appendChild(cgEl); phCont.appendChild(phEl);
  dg.appendChild(phCont);

  // ── Volume sliders (only in full chrome) ──
  if (!minimal) {
    var vr = $('vol-row');
    vr.innerHTML = '<span style="font-size:0.52rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-right:4px;font-family:DM Mono,monospace">Vol</span>';
    ROWS.forEach(function (row) {
      var item = document.createElement('div'); item.className = 'vol-item';
      var inp = document.createElement('input');
      inp.type = 'range'; inp.className = 'vol';
      inp.min = 0; inp.max = 1.5; inp.step = 0.05;
      inp.value = vols[row.id];
      (function (id) { inp.addEventListener('input', function () { vols[id] = parseFloat(this.value); }); })(row.id);
      item.innerHTML = '<span class="vol-lbl" style="color:var(--' + row.color + ')">' + row.name + '</span>';
      item.appendChild(inp);
      vr.appendChild(item);
    });

    if (presets.length) {
      var pc = $('presets');
      presets.forEach(function (p, i) {
        var b = document.createElement('button');
        b.className = 'btn-pre' + (i === 0 ? ' active' : '');
        b.textContent = p.label;
        b.addEventListener('click', function () {
          pc.querySelectorAll('.btn-pre').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          loadPreset(p.key);
        });
        pc.appendChild(b);
      });
    }

    $('bpm-range').addEventListener('input', function () {
      bpm = parseInt(this.value, 10);
      $('bpm-display').innerHTML = bpm + '<span>BPM</span>';
      if (opts.onBpmChange) opts.onBpmChange(bpm);
    });
    $('btn-play').addEventListener('click', toggle);
    if (editable) $('btn-clear').addEventListener('click', clearGrid);
  }

  function scheduler() {
    var ctx = DH.Audio.getCtx();
    while (nextTime < ctx.currentTime + SCHEDULE) {
      ROWS.forEach(function (r) {
        if (grid[r.id][curStep]) DH.Audio.trigger(r.id, nextTime, vols[r.id]);
      });
      var step = curStep, time = nextTime;
      vQueue.push({ step: step, time: time });
      setTimeout(function () { if (isPlaying) highlight(step); }, Math.max(0, (time - ctx.currentTime) * 1000));
      nextTime += 60 / bpm / 4;
      curStep = (curStep + 1) % STEPS;
    }
    timerID = setTimeout(scheduler, LOOKAHEAD * 1000);
  }
  function highlight(step) {
    var prev = (step - 1 + STEPS) % STEPS;
    var dp = document.getElementById(idPrefix + '-dot-' + prev); if (dp) dp.classList.remove('active');
    var dc = document.getElementById(idPrefix + '-dot-' + step); if (dc) dc.classList.add('active');
    // Beat number pulse on main beats (beat-nums children: [0]=spacer, [1..16]=steps)
    if (step % stepsPerBeat === 0) {
      var bnHost = document.getElementById(idPrefix + '-beat-nums');
      if (bnHost && bnHost.children[step + 1]) {
        var bnDiv = bnHost.children[step + 1];
        bnDiv.classList.remove('beat-pulse'); void bnDiv.offsetWidth; bnDiv.classList.add('beat-pulse');
      }
    }
    // Cell glow — void offsetWidth forces reflow so animation restarts on consecutive hits
    ROWS.forEach(function (r) {
      if (grid[r.id][step]) {
        var c = document.getElementById(idPrefix + '-c-' + r.id + '-' + step);
        if (c) {
          c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit');
          var lblEl = document.getElementById(idPrefix + '-lbl-' + r.id);
          if (lblEl) { lblEl.classList.remove('lbl-hit'); void lblEl.offsetWidth; lblEl.classList.add('lbl-hit'); }
        }
      }
    });
    // Micro-shake on kick
    if (kickRowId && grid[kickRowId] && grid[kickRowId][step]) {
      var shakeTarget = root.querySelector('.player-card') || root;
      shakeTarget.classList.remove('card-shake'); void shakeTarget.offsetWidth; shakeTarget.classList.add('card-shake');
    }
  }
  // rAF draw loop — sub-step smooth playhead interpolation via AudioContext time
  function draw() {
    if (!isPlaying) return;
    var now = DH.Audio.getCtx().currentTime;
    while (vQueue.length && vQueue[0].time <= now) {
      lastDrawStep = vQueue[0].step; lastStepTime = vQueue[0].time; vQueue.shift();
    }
    if (lastDrawStep >= 0) {
      var stepDur = 60 / bpm / 4;
      var frac = Math.min(1, Math.max(0, (now - lastStepTime) / stepDur));
      var pos = (lastDrawStep + frac) / STEPS * 100;
      phEl.style.left = pos + '%';
      cgEl.style.left  = (lastDrawStep / STEPS * 100) + '%';
      cgEl.style.width = (100 / STEPS) + '%';
      phEl.classList.add('live'); cgEl.classList.add('live');
    }
    rafID = requestAnimationFrame(draw);
  }
  function start() {
    var ctx = DH.Audio.getCtx();
    isPlaying = true; curStep = 0; nextTime = ctx.currentTime + 0.05;
    vQueue.length = 0; lastDrawStep = -1;
    scheduler(); requestAnimationFrame(draw);
    if (!minimal) {
      $('btn-play').classList.add('on');
      $('ico-play').style.display = 'none';
      $('ico-stop').style.display = '';
      $('status').textContent = 'Reproduciendo';
      $('status').className = 'status on';
    }
    if (opts.onPlayStateChange) opts.onPlayStateChange(true);
  }
  function stop() {
    isPlaying = false; clearTimeout(timerID);
    if (!minimal) {
      $('btn-play').classList.remove('on');
      $('ico-play').style.display = '';
      $('ico-stop').style.display = 'none';
      $('status').textContent = 'Detenido';
      $('status').className = 'status';
    }
    vQueue.length = 0;
    phEl.classList.remove('live'); cgEl.classList.remove('live');
    for (var s = 0; s < STEPS; s++) {
      var d = document.getElementById(idPrefix + '-dot-' + s); if (d) d.classList.remove('active');
      ROWS.forEach(function (r) { var c = document.getElementById(idPrefix + '-c-' + r.id + '-' + s); if (c) c.classList.remove('hit'); });
    }
    curStep = 0;
    if (opts.onPlayStateChange) opts.onPlayStateChange(false);
  }
  function toggle() { if (isPlaying) stop(); else start(); }
  function clearGrid() {
    ROWS.forEach(function (r) {
      grid[r.id] = new Array(STEPS).fill(false);
      for (var s = 0; s < STEPS; s++) {
        var c = document.getElementById(idPrefix + '-c-' + r.id + '-' + s);
        if (c) c.classList.remove('active');
      }
    });
    if (opts.onPatternChange) opts.onPatternChange(getPattern());
  }
  function applyPatternToCells(p) {
    ROWS.forEach(function (r) {
      grid[r.id] = (p[r.id] || new Array(STEPS).fill(0)).map(Boolean);
      for (var s = 0; s < STEPS; s++) {
        var c = document.getElementById(idPrefix + '-c-' + r.id + '-' + s);
        if (c) c.classList.toggle('active', grid[r.id][s]);
      }
    });
  }
  function loadPreset(key) {
    var p = DH.PRESETS[key]; if (!p) return;
    var was = isPlaying; if (was) stop();
    if (!minimal) {
      $('title').textContent = p.title;
      $('genre').textContent = p.genre;
      $('level').textContent = p.level;
    }
    setBpm(p.bpm);
    applyPatternToCells(p);
    if (opts.onPatternChange) opts.onPatternChange(getPattern());
    if (opts.onPresetLoad) opts.onPresetLoad(p);
    if (was) setTimeout(start, 80);
  }
  function loadPattern(p) {
    var was = isPlaying; if (was) stop();
    applyPatternToCells(p);
    if (opts.onPatternChange) opts.onPatternChange(getPattern());
    if (was) setTimeout(start, 80);
  }
  function getPattern() {
    var p = {};
    ROWS.forEach(function (r) { p[r.id] = grid[r.id].map(function (x) { return x ? 1 : 0; }); });
    return p;
  }
  function setMeta(meta) {
    if (minimal) return;
    if (meta.title) $('title').textContent = meta.title;
    if (meta.genre) $('genre').textContent = meta.genre;
    if (meta.level) $('level').textContent = meta.level;
  }
  function setBpm(b) {
    b = parseInt(b, 10); if (isNaN(b)) return;
    bpm = Math.max(40, Math.min(220, b));
    if (!minimal) {
      $('bpm-range').value = bpm;
      $('bpm-display').innerHTML = bpm + '<span>BPM</span>';
    }
  }

  return {
    start: start, stop: stop, toggle: toggle,
    clearGrid: clearGrid, loadPreset: loadPreset, loadPattern: loadPattern,
    getPattern: getPattern, getBpm: function () { return bpm; },
    isPlaying: function () { return isPlaying; },
    setMeta: setMeta, setBpm: setBpm,
    destroy: function () { stop(); root.innerHTML = ''; }
  };
};
