// Multi-kit audio engine. Samples from oramics.github.io/sampled.
// Pearl Master Studio CC-BY 3.0 by enoe. TR-909/LM-2/CR-78 Public Domain.
// API: getCtx(), trigger(id, t, vol), setKit(name), getKit(), listKits().
window.DH = window.DH || {};

DH.Audio = (function () {
  var actx = null;
  var masterGain = null;
  var buffers = {};   // { kitName: { pieceId: [AudioBuffer, ...] } }
  var rrIdx   = {};   // { kitName: { pieceId: rotation counter } }

  // Each kit declares which samples it has. Missing pieces fall back to synth.
  var KITS = {
    pearl: {
      label: 'Pearl Master Studio',
      tag: 'acoustic',
      basePath: 'audio/pearl/',
      samples: {
        kick:       ['kick-01.ogg'],
        snare:      ['snare-01.ogg', 'snare-02.ogg', 'snare-03.ogg'],
        hihat:      ['hihat-closed.ogg'],
        hihat_open: ['hihat-open.ogg'],
        ride:       ['ride-01.ogg'],
        ride_bell:  ['ride-02.ogg'],
        crash:      ['crash-01.ogg', 'crash-02.ogg'],
        splash:     ['splash-01.ogg', 'splash-02.ogg'],
        tom1:       ['tom-01.ogg'],
        tom2:       ['tom-02.ogg'],
        tom3:       ['tom-03.ogg']
      }
    },
    tr909: {
      label: 'TR-909 Detroit',
      tag: 'electronic',
      basePath: 'audio/tr909/',
      samples: {
        kick:       ['kick.ogg', 'kick-short.ogg'],
        snare:      ['snare.ogg'],
        hihat:      ['hihat-closed.ogg'],
        hihat_open: ['hihat-open-1.ogg', 'hihat-open-2.ogg'],
        ride:       ['ride.ogg'],
        crash:      ['cymbal.ogg'],
        tom1:       ['tom-h.ogg'],
        tom2:       ['tom-l.ogg'],
        clap:       ['clap-1.ogg', 'clap-2.ogg']
      }
    },
    lm2: {
      label: 'LinnDrum LM-2',
      tag: '80s',
      basePath: 'audio/lm2/',
      samples: {
        kick:       ['kick.ogg', 'kick-alt.ogg'],
        snare:      ['snare-m.ogg', 'snare-h.ogg', 'snare-l.ogg'],
        hihat:      ['hihat-closed.ogg', 'hihat-closed-long.ogg', 'hihat-closed-short.ogg'],
        hihat_open: ['hihat-open.ogg'],
        ride:       ['ride.ogg'],
        crash:      ['crash.ogg'],
        tom1:       ['tom-h.ogg', 'tom-hh.ogg'],
        tom2:       ['tom-m.ogg'],
        tom3:       ['tom-l.ogg', 'tom-ll.ogg'],
        clap:       ['clap.ogg'],
        conga:      ['conga-h.ogg', 'conga-hh.ogg', 'conga-m.ogg', 'conga-l.ogg', 'conga-ll.ogg', 'conga-lll.ogg'],
        cowbell:    ['cowb.ogg'],
        cabasa:     ['cabasa.ogg'],
        tamb:       ['tamb.ogg'],
        stick:      ['stick-h.ogg', 'stick-m.ogg', 'stick-l.ogg']
      }
    },
    cr78: {
      label: 'CR-78',
      tag: 'vintage',
      basePath: 'audio/cr78/',
      samples: {
        kick:       ['kick.ogg', 'kick-accent.ogg'],
        snare:      ['snare.ogg', 'snare-accent.ogg'],
        hihat:      ['hihat.ogg'],
        hihat_open: ['hihat-metal.ogg'],
        stick:      ['rim.ogg']
      }
    }
  };

  var currentKit = 'pearl';

  // Display info per piece (name + CSS color class). Used to render the kit's grid.
  var PIECE_INFO = {
    china:      { name: 'China',        color: 'china'      },
    crash:      { name: 'Crash',        color: 'crash'      },
    splash:     { name: 'Splash',       color: 'splash'     },
    ride:       { name: 'Ride',         color: 'ride'       },
    ride_bell:  { name: 'Ride campana', color: 'ride_bell'  },
    hihat:      { name: 'Hi-Hat',       color: 'hihat'      },
    hihat_open: { name: 'Hi-Hat open',  color: 'hihat_open' },
    snare:      { name: 'Redob.',       color: 'snare'      },
    clap:       { name: 'Clap',         color: 'clap'       },
    stick:      { name: 'Stick',        color: 'stick'      },
    cowbell:    { name: 'Cowbell',      color: 'cowbell'    },
    cabasa:     { name: 'Cabasa',       color: 'cabasa'     },
    tamb:       { name: 'Tamburina',    color: 'tamb'       },
    conga:      { name: 'Conga',        color: 'conga'      },
    tom1:       { name: 'Tom hi',       color: 'tom1'       },
    tom2:       { name: 'Tom mid',      color: 'tom2'       },
    tom3:       { name: 'Tom lo',       color: 'tom3'       },
    kick:       { name: 'Bombo',        color: 'kick'       }
  };
  // Top-to-bottom display order (cymbals → drums → percussion → toms → kick).
  var PIECE_ORDER = [
    'china', 'crash', 'splash', 'ride', 'ride_bell',
    'hihat', 'hihat_open',
    'snare', 'clap', 'stick',
    'cowbell', 'cabasa', 'tamb', 'conga',
    'tom1', 'tom2', 'tom3', 'kick'
  ];

  function getCtx() {
    if (!actx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      actx = new Ctx();
      masterGain = actx.createGain();
      masterGain.gain.value = 0.85;
      masterGain.connect(actx.destination);
      // Warm every kit, not just the current one: card previews can use any kit and
      // must play real samples immediately instead of racing the async load (synth fallback).
      Object.keys(KITS).forEach(preloadKit);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function loadOne(kit, file) {
    return fetch(KITS[kit].basePath + file)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + file); return r.arrayBuffer(); })
      .then(function (ab) { return actx.decodeAudioData(ab); })
      .catch(function (err) { console.warn('DH.Audio: could not load', kit, file, err); return null; });
  }
  function preloadKit(kit) {
    if (!KITS[kit]) return;
    if (buffers[kit]) return; // already loaded / loading
    buffers[kit] = {};
    rrIdx[kit] = {};
    var map = KITS[kit].samples;
    Object.keys(map).forEach(function (id) {
      buffers[kit][id] = [];
      rrIdx[kit][id] = 0;
      map[id].forEach(function (file, i) {
        loadOne(kit, file).then(function (buf) {
          if (buf) buffers[kit][id][i] = buf;
        });
      });
    });
  }

  function setKit(name) {
    if (!KITS[name]) return false;
    currentKit = name;
    if (actx) preloadKit(name);
    return true;
  }
  function getKit() { return currentKit; }
  function listKits() {
    return Object.keys(KITS).map(function (k) { return { id: k, label: KITS[k].label, tag: KITS[k].tag }; });
  }
  // Returns the {id, name, color} rows that the given kit actually has samples for, ordered top-to-bottom.
  function getKitPieces(kit) {
    var k = KITS[kit] || KITS[currentKit]; if (!k) return [];
    var samples = k.samples;
    return PIECE_ORDER
      .filter(function (id) { return samples[id]; })
      .map(function (id) { return { id: id, name: PIECE_INFO[id].name, color: PIECE_INFO[id].color }; });
  }
  // Special override for Pearl: keep the user's preferred labels (Tom 12" / Tom 13" / Chancha 16").
  var PEARL_OVERRIDES = { tom1: 'Tom 12"', tom2: 'Tom 13"', tom3: 'Chancha 16"' };
  var _origGetKitPieces = getKitPieces;
  getKitPieces = function (kit) {
    var rows = _origGetKitPieces(kit);
    if ((kit || currentKit) === 'pearl') {
      rows.forEach(function (r) { if (PEARL_OVERRIDES[r.id]) r.name = PEARL_OVERRIDES[r.id]; });
    }
    return rows;
  };

  function playSample(id, t, vol, kit) {
    var k = kit || currentKit;
    var pool = buffers[k] && buffers[k][id];
    if (!pool || !pool.length) return false;
    var n = pool.length;
    if (!rrIdx[k]) rrIdx[k] = {};
    var start = (rrIdx[k][id] || 0) % n;
    var buf = null;
    for (var i = 0; i < n; i++) {
      var idx = (start + i) % n;
      if (pool[idx]) { buf = pool[idx]; rrIdx[k][id] = (idx + 1) % n; break; }
    }
    if (!buf) return false;
    var src = actx.createBufferSource();
    src.buffer = buf;
    var g = actx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(masterGain);
    src.start(t);
    return true;
  }

  // ── Synth fallback (used when sample missing or not loaded yet) ──
  function noise(ctx, dur) {
    var n = Math.ceil(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function synthKick(t, vol) {
    var ctx = actx; var out = ctx.createGain(); out.connect(masterGain);
    var sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.connect(sg); sg.connect(out); sub.type = 'sine';
    sub.frequency.setValueAtTime(160, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    sg.gain.setValueAtTime(vol * 1.2, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    sub.start(t); sub.stop(t + 0.5);
    var clk = ctx.createOscillator(), cg = ctx.createGain();
    clk.connect(cg); cg.connect(out); clk.type = 'sine';
    clk.frequency.setValueAtTime(800, t);
    clk.frequency.exponentialRampToValueAtTime(60, t + 0.015);
    cg.gain.setValueAtTime(vol * 0.8, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    clk.start(t); clk.stop(t + 0.025);
  }
  function synthSnare(t, vol) {
    var ctx = actx; var out = ctx.createGain(); out.connect(masterGain);
    var body = ctx.createOscillator(), bg = ctx.createGain();
    body.connect(bg); bg.connect(out); body.type = 'triangle';
    body.frequency.setValueAtTime(220, t);
    body.frequency.exponentialRampToValueAtTime(100, t + 0.05);
    bg.gain.setValueAtTime(vol * 0.7, t);
    bg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    body.start(t); body.stop(t + 0.15);
    var sn = ctx.createBufferSource(); sn.buffer = noise(ctx, 0.22);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    var sg = ctx.createGain();
    sn.connect(hp); hp.connect(sg); sg.connect(out);
    sg.gain.setValueAtTime(vol * 0.9, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    sn.start(t); sn.stop(t + 0.25);
  }
  function synthHihat(t, vol, open) {
    var ctx = actx;
    var dur = open ? 0.35 : 0.08;
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, dur);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * (open ? 0.45 : 0.55), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.start(t); ns.stop(t + dur + 0.02);
  }
  function synthCymbal(t, vol, hpFreq, dur) {
    var ctx = actx;
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, dur);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.start(t); ns.stop(t + dur + 0.05);
  }
  function synthTom(t, vol, freq, decay) {
    var ctx = actx; var out = ctx.createGain(); out.connect(masterGain);
    var osc = ctx.createOscillator(), og = ctx.createGain();
    osc.connect(og); og.connect(out); osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.04);
    og.gain.setValueAtTime(vol, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.start(t); osc.stop(t + decay + 0.05);
  }
  function synthChina(t, vol) {
    var ctx = actx;
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.6);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 0.6;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(bp); bp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    ns.start(t); ns.stop(t + 0.6);
    var osc = ctx.createOscillator(), og = ctx.createGain();
    osc.connect(og); og.connect(masterGain);
    osc.type = 'sawtooth'; osc.frequency.value = 220;
    og.gain.setValueAtTime(vol * 0.12, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.12);
  }
  function synthBell(t, vol) {
    var ctx = actx;
    var osc = ctx.createOscillator(), og = ctx.createGain();
    osc.connect(og); og.connect(masterGain);
    osc.type = 'sine'; osc.frequency.value = 1100;
    og.gain.setValueAtTime(vol * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t); osc.stop(t + 0.45);
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.04);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    ns.start(t); ns.stop(t + 0.05);
  }
  function synthClap(t, vol) {
    var ctx = actx;
    // 3 bursts de ruido espaciados ~10ms simulan el "splat" del clap
    [0, 0.012, 0.024].forEach(function (off) {
      var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.05);
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 2;
      var g = ctx.createGain();
      ns.connect(hp); hp.connect(bp); bp.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(vol * 0.6, t + off);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.05);
      ns.start(t + off); ns.stop(t + off + 0.06);
    });
  }
  function synthCowbell(t, vol) {
    var ctx = actx; var out = ctx.createGain(); out.connect(masterGain);
    // Cowbell clásico: dos squares a 540 y 800Hz (proporción de Mu Tron)
    [540, 800].forEach(function (freq) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(out); o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol * 0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.35);
    });
  }
  function synthCabasa(t, vol) {
    var ctx = actx;
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.08);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ns.start(t); ns.stop(t + 0.1);
  }
  function synthTamb(t, vol) {
    var ctx = actx;
    // Ruido brillante + tono de cascabel
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.25);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    ns.start(t); ns.stop(t + 0.27);
    var osc = ctx.createOscillator(), og = ctx.createGain();
    osc.connect(og); og.connect(masterGain); osc.type = 'triangle'; osc.frequency.value = 6500;
    og.gain.setValueAtTime(vol * 0.15, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.18);
  }
  function synthStick(t, vol) {
    var ctx = actx;
    var ns = ctx.createBufferSource(); ns.buffer = noise(ctx, 0.025);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
    var g = ctx.createGain();
    ns.connect(hp); hp.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol * 0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    ns.start(t); ns.stop(t + 0.03);
  }
  function synthConga(t, vol) {
    // Conga: tono mid + click corto
    synthTom(t, vol, 220, 0.25);
  }

  function synthFallback(id, t, vol) {
    if (id === 'kick')        return synthKick(t, vol);
    if (id === 'snare')       return synthSnare(t, vol);
    if (id === 'hihat')       return synthHihat(t, vol, false);
    if (id === 'hihat_open')  return synthHihat(t, vol, true);
    if (id === 'ride')        return synthCymbal(t, vol, 3500, 0.5);
    if (id === 'ride_bell')   return synthBell(t, vol);
    if (id === 'crash')       return synthCymbal(t, vol, 4000, 1.2);
    if (id === 'splash')      return synthCymbal(t, vol, 6000, 0.18);
    if (id === 'china')       return synthChina(t, vol);
    if (id === 'tom1')        return synthTom(t, vol, 180, 0.3);
    if (id === 'tom2')        return synthTom(t, vol, 110, 0.35);
    if (id === 'tom3')        return synthTom(t, vol, 75,  0.45);
    if (id === 'clap')        return synthClap(t, vol);
    if (id === 'stick')       return synthStick(t, vol);
    if (id === 'cowbell')     return synthCowbell(t, vol);
    if (id === 'cabasa')      return synthCabasa(t, vol);
    if (id === 'tamb')        return synthTamb(t, vol);
    if (id === 'conga')       return synthConga(t, vol);
  }

  function trigger(id, t, vol, kit) {
    if (vol == null) vol = 0.8;
    if (!playSample(id, t, vol, kit)) synthFallback(id, t, vol);
  }

  return {
    getCtx: getCtx, trigger: trigger,
    setKit: setKit, getKit: getKit, listKits: listKits, getKitPieces: getKitPieces,
    preloadKit: preloadKit,
    getBuffers: function(kitId) { return buffers[kitId || currentKit] || {}; },
    getKitConfig: function(kitId) { return KITS[kitId || currentKit] || null; },
    getDefaultVols: function() { return DH.DEFAULT_VOLS; }
  };
})();

// One-shot preview player — itera el patrón paso a paso con setInterval para que stop() corte al instante.
// (Pre-schedulear todos los notes futuros al Web Audio los hace incancelables: por eso usamos un stepper.)
// Mutually exclusive: empezar una nueva preview detiene la anterior.
DH.PreviewPlayer = (function () {
  var current = null;
  var MIN_STEPS = 32; // patrones cortos se repiten hasta cubrir al menos esto

  function stop() {
    if (!current) return;
    var token = current;
    current = null;
    if (token.intervalId) clearInterval(token.intervalId);
    if (token.onStop) { try { token.onStop(); } catch (e) {} }
  }

  // Reproduce el groove COMPLETO: todas las piezas del patrón (no solo DH.ROWS) y todos
  // los compases (el largo sale del propio array, no de un 16×2 fijo). timeSig define la
  // grilla (16avos vs 8avos) para que el tempo de compases impares sea correcto.
  function play(pattern, bpm, onStop, kit, timeSig) {
    stop();
    bpm = bpm || 90;
    DH.Audio.getCtx(); // asegurar context
    if (kit) DH.Audio.preloadKit(kit);

    var tsConf = (window.DH && DH.TIME_SIGS && timeSig)
      ? DH.TIME_SIGS.find(function (t) { return t.id === timeSig; })
      : null;
    var stepsPerBeat = tsConf ? tsConf.stepsPerBeat : 4;
    var stepMs = 60 / bpm / stepsPerBeat * 1000;

    // Largo real del patrón = longitud de sus arrays (stepsPerBar × bars).
    var pieceIds = pattern ? Object.keys(pattern) : [];
    var len = 0;
    for (var i = 0; i < pieceIds.length; i++) {
      var a = pattern[pieceIds[i]];
      if (a && a.length > len) len = a.length;
    }
    if (!len) { if (onStop) { try { onStop(); } catch (e) {} } return null; }
    // Patrones largos suenan una vez completos; los cortos se repiten para que el preview dure.
    var total = len >= MIN_STEPS ? len : len * Math.ceil(MIN_STEPS / len);

    var step = 0;
    var token = { onStop: onStop, intervalId: null, kit: kit || null };
    current = token;

    function tick() {
      if (current !== token) return; // alguien llamó stop()
      var t = DH.Audio.getCtx().currentTime + 0.005;
      var idx = step % len;
      for (var r = 0; r < pieceIds.length; r++) {
        var id = pieceIds[r];
        var arr = pattern[id];
        if (arr && arr[idx]) DH.Audio.trigger(id, t, undefined, token.kit);
      }
      step++;
      if (step >= total) {
        // Llegamos al final natural → cleanup como si fuera stop()
        clearInterval(token.intervalId);
        if (current === token) { current = null; if (onStop) { try { onStop(); } catch (e) {} } }
      }
    }

    tick(); // primer step inmediato (sin esperar el intervalo)
    token.intervalId = setInterval(tick, stepMs);
    return token;
  }
  function isPlaying(token) { return !!current && (!token || current === token); }
  return { play: play, stop: stop, isPlaying: isPlaying };
})();

// Warm the audio engine on the first user interaction (browsers require a gesture to
// create an AudioContext). This kicks off loading of every kit's samples before the
// user hits a preview, so previews play real samples instead of the thin synth fallback.
(function () {
  function warm() {
    document.removeEventListener('pointerdown', warm, true);
    document.removeEventListener('keydown', warm, true);
    try { DH.Audio.getCtx(); } catch (e) {}
  }
  document.addEventListener('pointerdown', warm, true);
  document.addEventListener('keydown', warm, true);
})();
