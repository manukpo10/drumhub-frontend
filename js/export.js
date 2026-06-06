window.DH = window.DH || {};

DH.Export = (function () {

  // ── Helpers ──
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }

  function slugify(title) {
    return (title || 'groove').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 40);
  }

  // ── JSON ──
  function exportJSON(groove) {
    var data = {
      title: groove.title,
      genre: groove.genre,
      bpm: groove.bpm,
      level: groove.level,
      timeSig: groove.timeSig || '4/4',
      bars: groove.bars || 1,
      pattern: groove.pattern,
      exportedAt: new Date().toISOString(),
      source: 'DrumHub'
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, slugify(groove.title) + '.json');
  }

  // ── MIDI ──
  // GM drum note map (channel 10, 0-indexed = channel 9)
  var MIDI_NOTES = {
    kick: 36, snare: 38, snare_ghost: 38, snare_flam: 38, hihat: 42, hihat_open: 46,
    crash: 49, ride: 51, ride_bell: 53, splash: 55,
    china: 52, tom1: 50, tom2: 47, tom3: 43,
    clap: 39, cowbell: 56, cabasa: 70, tamb: 54, conga: 63
  };

  function vlq(value) {
    var bytes = [value & 0x7F];
    value >>>= 7;
    while (value > 0) { bytes.unshift((value & 0x7F) | 0x80); value >>>= 7; }
    return bytes;
  }

  function uint32be(n) { return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]; }
  function uint16be(n) { return [(n >>> 8) & 0xFF, n & 0xFF]; }

  function exportMIDI(groove) {
    var bpm = groove.bpm || 90;
    var TICKS_PER_BEAT = 480;
    var TICKS_PER_STEP = TICKS_PER_BEAT / 4; // 16th notes = 120 ticks
    var microsPerBeat = Math.round(60000000 / bpm);

    var steps = 16;
    if (groove.timeSig && DH.TIME_SIGS) {
      var tsConf = DH.TIME_SIGS.find(function(t) { return t.id === groove.timeSig; });
      if (tsConf) steps = tsConf.stepsPerBar * (groove.bars || 1);
    }

    var events = [];
    // Tempo meta-event at tick 0
    events.push({ tick: 0, bytes: [0xFF, 0x51, 0x03, (microsPerBeat >>> 16) & 0xFF, (microsPerBeat >>> 8) & 0xFF, microsPerBeat & 0xFF] });

    // Collect all note-on and note-off events
    var rows = DH.ROWS || [];
    for (var s = 0; s < steps; s++) {
      var tick = s * TICKS_PER_STEP;
      rows.forEach(function(row) {
        var note = MIDI_NOTES[row.id];
        if (!note) return;
        var arr = groove.pattern && groove.pattern[row.id];
        if (!arr || !arr[s]) return;
        var vel = Math.round((DH.DEFAULT_VOLS[row.id] || 0.8) * 100);
        events.push({ tick: tick,     bytes: [0x99, note, vel] }); // note on  ch10
        events.push({ tick: tick + 1, bytes: [0x89, note, 0x40] }); // note off ch10
      });
    }
    // End of track
    var totalTicks = steps * TICKS_PER_STEP;
    events.push({ tick: totalTicks, bytes: [0xFF, 0x2F, 0x00] });

    // Sort events by tick
    events.sort(function(a, b) { return a.tick - b.tick || 0; });

    // Encode track data with delta times
    var trackData = [];
    var prevTick = 0;
    events.forEach(function(ev) {
      var delta = ev.tick - prevTick;
      prevTick = ev.tick;
      vlq(delta).forEach(function(b) { trackData.push(b); });
      ev.bytes.forEach(function(b) { trackData.push(b); });
    });

    // Assemble MIDI file
    var header = [].concat(
      [0x4D, 0x54, 0x68, 0x64], // "MThd"
      uint32be(6),               // header length
      uint16be(0),               // format 0 (single track)
      uint16be(1),               // 1 track
      uint16be(TICKS_PER_BEAT)   // ticks per quarter note
    );
    var trackHeader = [].concat(
      [0x4D, 0x54, 0x72, 0x6B], // "MTrk"
      uint32be(trackData.length)
    );
    var midiBytes = header.concat(trackHeader).concat(trackData);
    var blob = new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' });
    downloadBlob(blob, slugify(groove.title) + '.mid');
  }

  // ── PDF — DrumHub professional score ──
  function exportPDF(groove) {
    var timeSig = groove.timeSig || '4/4';
    var bars    = groove.bars || 1;
    var steps   = 16, stepsPerBeat = 4;
    if (DH.TIME_SIGS) {
      var tsConf = DH.TIME_SIGS.find(function(t) { return t.id === timeSig; });
      if (tsConf) { steps = tsConf.stepsPerBar * bars; stepsPerBeat = tsConf.stepsPerBeat; }
    }
    var stepsPerBar = steps / bars;
    var CELL = steps > 24 ? 18 : steps > 16 ? 22 : 26;
    var LBL  = 82;

    var rows = (DH.ROWS || []).filter(function(r) {
      var arr = groove.pattern && groove.pattern[r.id];
      return arr && arr.some(function(v) { return !!v; });
    });

    // Instrument colors (print-safe, vivid on white)
    var COLORS = {
      china:'#e8622a', crash:'#9b59b6', splash:'#c8a000', ride:'#16a085',
      ride_bell:'#1abc9c', hihat:'#d4a000', hihat_open:'#e67e22',
      snare:'#e74c3c', snare_ghost:'#e74c3c', snare_flam:'#e74c3c', clap:'#e74c3c', stick:'#5d8aa8',
      cowbell:'#c0980a', cabasa:'#5d8aa8', tamb:'#e67e22',
      conga:'#8e44ad', tom1:'#27ae60', tom2:'#1e8449', tom3:'#196f3d',
      kick:'#2980b9'
    };

    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function clr(r) { return COLORS[r.color] || COLORS[r.id] || '#555'; }

    // ── Beat header row ──
    var beatRow = '<tr><td class="lbl-col"></td>';
    for (var s = 0; s < steps; s++) {
      var isBt = s % stepsPerBeat === 0;
      var isNB = s > 0 && s % stepsPerBar === 0;
      beatRow += '<td class="bcell' + (isBt?' beat':'') + (isNB?' nbar':'') + '">'
        + (isBt ? (s/stepsPerBeat+1) : '·') + '</td>';
    }
    beatRow += '</tr>';

    // ── Bar header row (multi-bar) ──
    var barRow = '';
    if (bars > 1) {
      barRow = '<tr><td class="lbl-col"></td>';
      for (var b = 0; b < bars; b++)
        barRow += '<td class="bar-hdr" colspan="' + stepsPerBar + '">Compás ' + (b+1) + '</td>';
      barRow += '</tr>';
    }

    // ── Visual grid rows (colored cells with step number) ──
    var gridRows = '';
    rows.forEach(function(r) {
      var arr = groove.pattern[r.id] || [];
      var c = clr(r);
      var cells = '';
      for (var s = 0; s < steps; s++) {
        var isNB = s > 0 && s % stepsPerBar === 0;
        var hit  = !!arr[s];
        var gcBg = '', gcTxt = '';
        if (hit) {
          if (r.id === 'snare_ghost') { gcBg = 'background:' + c + '55;color:#fff;border-color:' + c; gcTxt = '(' + (s+1) + ')'; }
          else if (r.id === 'snare_flam') { gcBg = 'background:' + c + ';color:#fff;border-color:' + c; gcTxt = 'f' + (s+1); }
          else { gcBg = 'background:' + c + ';color:#fff;border-color:' + c; gcTxt = String(s+1); }
        }
        cells += '<td class="gcell' + (hit?' hit':'') + (isNB?' nbar':'') + '"'
          + (hit ? ' style="' + gcBg + '"' : '') + '>'
          + gcTxt + '</td>';
      }
      gridRows += '<tr>'
        + '<td class="lbl-col"><span class="dot" style="background:' + c + '"></span>' + esc(r.name) + '</td>'
        + cells + '</tr>';
    });

    // ── Detail table rows (dots) ──
    var detailHead = '<tr><th class="dth">Instrumento</th>';
    for (var s = 0; s < steps; s++) detailHead += '<th class="dth sth">' + (s+1) + '</th>';
    detailHead += '</tr>';

    var detailRows = '';
    rows.forEach(function(r) {
      var arr = groove.pattern[r.id] || [];
      var c = clr(r);
      var cells = '';
      for (var s = 0; s < steps; s++) {
        var dDot = '';
        if (arr[s]) {
          if (r.id === 'snare_ghost') dDot = '<span style="font-size:9px;color:' + c + ';opacity:0.55">(&#9679;)</span>';
          else if (r.id === 'snare_flam') dDot = '<span class="ddot" style="background:' + c + ';font-size:8px;padding:0 2px">f&#9679;</span>';
          else dDot = '<span class="ddot" style="background:' + c + '">&#9679;</span>';
        }
        cells += '<td class="dtd' + (arr[s]?' dhit':'') + '">' + dDot + '</td>';
      }
      detailRows += '<tr>'
        + '<td class="dtd dlbl"><span class="dot sm" style="background:' + c + '"></span>' + esc(r.name) + '</td>'
        + cells + '</tr>';
    });

    // ── Practice notes (auto-generated) ──
    var startBpm = Math.round(groove.bpm * 0.6);
    var practiceNotes = [
      'Comenzá el patrón a ' + startBpm + ' BPM hasta que fluya de forma natural.',
      'Incorporá cada instrumento de a uno, empezando por el bombo y el hi-hat.',
      'Subí de a 5 BPM hasta llegar al tempo objetivo de ' + groove.bpm + ' BPM.',
      'Grabate y escuchate — el groove tiene que sonar sólido antes de subir el tempo.'
    ];
    if (groove.tags && groove.tags.length)
      practiceNotes.push('Referencias de estilo: ' + groove.tags.join(', ') + '.');
    if (groove.desc)
      practiceNotes.push(groove.desc);

    var notesHtml = practiceNotes.map(function(n) {
      return '<li>' + esc(n) + '</li>';
    }).join('');

    // ── Reference table ──
    var DIFF_MAP = { 'Básico':1, 'Intermedio':2, 'Avanzado':3 };
    var refCols = [
      { lbl:'GÉNERO',    val: groove.genre || '—' },
      { lbl:'BPM',       val: groove.bpm },
      { lbl:'NIVEL',     val: groove.level || '—' },
      { lbl:'COMPÁS',    val: timeSig },
      { lbl:'PASOS',     val: steps },
      { lbl:'AUTOR',     val: groove.author || '—' }
    ];
    var refHeads = refCols.map(function(c) { return '<th class="rth">' + c.lbl + '</th>'; }).join('');
    var refVals  = refCols.map(function(c) { return '<td class="rtd">' + esc(c.val) + '</td>'; }).join('');

    var dateStr = new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'2-digit',year:'numeric'});

    // ── Section title helper ──
    function sec(title) {
      return '<div class="sec-title">' + title + '</div>';
    }

    // ── Staff SVG builder ──
    var buildStaffSVG = function(groove, activeRows, steps, stepsPerBar, stepsPerBeat, bars) {
      var G = 7, STEP_W = 28, CLEF_W = 52, STAFF_TOP = 52;

      var NOTE_POS = {
        china: -3.5*G, crash: -2.5*G, splash: -2*G, ride: -1.5*G,
        hihat_open: -G, hihat: -G, ride_bell: -0.5*G, cowbell: -0.5*G,
        tamb: -2*G, stick: 3*G, cabasa: 3.5*G,
        tom1: 0.5*G, snare: 1.5*G, snare_ghost: 1.5*G, snare_flam: 1.5*G, clap: 1.5*G,
        tom2: 2.5*G, conga: 3*G, tom3: 3.5*G, kick: 4.5*G
      };

      var X_HEADS = { china:1, crash:1, splash:1, ride:1, hihat_open:1, hihat:1,
                      ride_bell:1, cowbell:1, tamb:1, stick:1, cabasa:1 };

      var SVG_W = CLEF_W + steps * STEP_W + 12;
      var SVG_H = STAFF_TOP + 4*G + 3*G + 20;
      var beamY     = STAFF_TOP - 3*G;
      var beamYdown = STAFF_TOP + 4*G + 3*G;

      var o = [];
      o.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + SVG_W + '" height="' + SVG_H + '" style="overflow:visible">');

      // Staff lines
      for (var li = 0; li < 5; li++) {
        var ly = STAFF_TOP + li * G;
        o.push('<line x1="0" y1="' + ly + '" x2="' + (SVG_W-12) + '" y2="' + ly + '" stroke="#000" stroke-width="1"/>');
      }

      // Drum clef
      var clefYt = STAFF_TOP - 1, clefYb = STAFF_TOP + 4*G + 1, clefH = clefYb - clefYt;
      o.push('<rect x="8" y="' + clefYt + '" width="4" height="' + clefH + '" fill="#000"/>');
      o.push('<rect x="15" y="' + clefYt + '" width="4" height="' + clefH + '" fill="#000"/>');

      // Time signature
      var tsN = Math.round(stepsPerBar / stepsPerBeat);
      var tsX = 34;
      o.push('<text x="' + tsX + '" y="' + (STAFF_TOP + 1.5*G) + '" text-anchor="middle" font-size="' + Math.round(2*G) + '" font-weight="bold" font-family="serif" fill="#000">' + tsN + '</text>');
      o.push('<text x="' + tsX + '" y="' + (STAFF_TOP + 3.5*G) + '" text-anchor="middle" font-size="' + Math.round(2*G) + '" font-weight="bold" font-family="serif" fill="#000">4</text>');

      // Collect hits per step
      var stepHits = [];
      for (var si = 0; si < steps; si++) {
        stepHits[si] = { up: [], down: [] };
        activeRows.forEach(function(r) {
          var arr = groove.pattern && groove.pattern[r.id];
          if (arr && arr[si]) {
            var dy = NOTE_POS[r.id] !== undefined ? NOTE_POS[r.id] : 2*G;
            var y = STAFF_TOP + dy;
            if (r.id === 'kick') stepHits[si].down.push({ r: r, y: y });
            else stepHits[si].up.push({ r: r, y: y });
          }
        });
        // Sort up hits by y descending (highest y = lowest note drawn first)
        stepHits[si].up.sort(function(a,b){ return b.y - a.y; });
      }

      // Bar lines
      for (var bar = 1; bar <= bars; bar++) {
        var bx = CLEF_W + bar * stepsPerBar * STEP_W;
        if (bar < bars) {
          o.push('<line x1="' + bx + '" y1="' + (STAFF_TOP-1) + '" x2="' + bx + '" y2="' + (STAFF_TOP+4*G+1) + '" stroke="#000" stroke-width="1.2"/>');
        } else {
          o.push('<line x1="' + bx + '" y1="' + (STAFF_TOP-2) + '" x2="' + bx + '" y2="' + (STAFF_TOP+4*G+2) + '" stroke="#000" stroke-width="1.5"/>');
          o.push('<line x1="' + (bx+4) + '" y1="' + (STAFF_TOP-2) + '" x2="' + (bx+4) + '" y2="' + (STAFF_TOP+4*G+2) + '" stroke="#000" stroke-width="3.5"/>');
        }
      }

      // Draw beams and notes per beat
      var numBeats = Math.ceil(steps / stepsPerBeat);
      for (var beat = 0; beat < numBeats; beat++) {
        var bs = beat * stepsPerBeat;
        var be = Math.min(bs + stepsPerBeat, steps);

        // Collect step indices with up/down hits in this beat
        var upIdx = [], downIdx = [];
        for (var s = bs; s < be; s++) {
          if (stepHits[s].up.length)   upIdx.push(s);
          if (stepHits[s].down.length) downIdx.push(s);
        }

        // Draw up-stem beams
        if (upIdx.length >= 2) {
          var x1b = CLEF_W + upIdx[0] * STEP_W + STEP_W/2 + 3;
          var x2b = CLEF_W + upIdx[upIdx.length-1] * STEP_W + STEP_W/2 + 3;
          o.push('<line x1="' + x1b + '" y1="' + beamY + '" x2="' + x2b + '" y2="' + beamY + '" stroke="#000" stroke-width="3"/>');
          o.push('<line x1="' + x1b + '" y1="' + (beamY-7) + '" x2="' + x2b + '" y2="' + (beamY-7) + '" stroke="#000" stroke-width="3"/>');
        }

        // Draw down-stem beams (kick)
        if (downIdx.length >= 2) {
          var xd1 = CLEF_W + downIdx[0] * STEP_W + STEP_W/2 - 3;
          var xd2 = CLEF_W + downIdx[downIdx.length-1] * STEP_W + STEP_W/2 - 3;
          o.push('<line x1="' + xd1 + '" y1="' + beamYdown + '" x2="' + xd2 + '" y2="' + beamYdown + '" stroke="#000" stroke-width="3"/>');
          o.push('<line x1="' + xd1 + '" y1="' + (beamYdown+7) + '" x2="' + xd2 + '" y2="' + (beamYdown+7) + '" stroke="#000" stroke-width="3"/>');
        }

        // Draw notes for each step in this beat
        for (var s = bs; s < be; s++) {
          var cx = CLEF_W + s * STEP_W + STEP_W/2;

          // UP-stem notes
          if (stepHits[s].up.length > 0) {
            var lowestY = stepHits[s].up[0].y; // sorted: highest y (lowest note) is first
            var stemTopY = (upIdx.length >= 2) ? beamY : lowestY - 28;
            // Stem
            o.push('<line x1="' + (cx+3) + '" y1="' + lowestY + '" x2="' + (cx+3) + '" y2="' + stemTopY + '" stroke="#000" stroke-width="1.2"/>');
            // All note heads on this step
            stepHits[s].up.forEach(function(h) {
              var isX = !!X_HEADS[h.r.id];
              if (isX) {
                var hs = 4;
                o.push('<line x1="' + (cx-hs) + '" y1="' + (h.y-hs) + '" x2="' + (cx+hs) + '" y2="' + (h.y+hs) + '" stroke="#000" stroke-width="1.8"/>');
                o.push('<line x1="' + (cx+hs) + '" y1="' + (h.y-hs) + '" x2="' + (cx-hs) + '" y2="' + (h.y+hs) + '" stroke="#000" stroke-width="1.8"/>');
                if (h.r.id === 'hihat_open') {
                  o.push('<circle cx="' + cx + '" cy="' + (h.y-8) + '" r="3" fill="none" stroke="#000" stroke-width="1.2"/>');
                }
              } else if (h.r.id === 'snare_ghost') {
                o.push('<text x="' + (cx-7) + '" y="' + (h.y+4) + '" font-size="11" font-family="serif" fill="#000">(</text>');
                o.push('<ellipse cx="' + cx + '" cy="' + h.y + '" rx="4" ry="2.8" fill="#888" transform="rotate(-15 ' + cx + ' ' + h.y + ')"/>');
                o.push('<text x="' + (cx+3) + '" y="' + (h.y+4) + '" font-size="11" font-family="serif" fill="#000">)</text>');
              } else if (h.r.id === 'snare_flam') {
                var flamGx = cx - 9;
                o.push('<ellipse cx="' + flamGx + '" cy="' + (h.y-3) + '" rx="3" ry="2" fill="#000"/>');
                o.push('<line x1="' + (flamGx+3) + '" y1="' + (h.y-3) + '" x2="' + (flamGx+3) + '" y2="' + (h.y-14) + '" stroke="#000" stroke-width="1"/>');
                o.push('<line x1="' + flamGx + '" y1="' + (h.y-12) + '" x2="' + (flamGx+7) + '" y2="' + (h.y-15) + '" stroke="#000" stroke-width="1.2"/>');
                o.push('<ellipse cx="' + cx + '" cy="' + h.y + '" rx="5" ry="3.5" fill="#000" transform="rotate(-15 ' + cx + ' ' + h.y + ')"/>');
              } else {
                o.push('<ellipse cx="' + cx + '" cy="' + h.y + '" rx="5" ry="3.5" fill="#000" transform="rotate(-15 ' + cx + ' ' + h.y + ')"/>');
              }
              // Ledger lines above staff
              var ledgerStart = STAFF_TOP - G;
              while (ledgerStart >= h.y - 1) {
                o.push('<line x1="' + (cx-8) + '" y1="' + ledgerStart + '" x2="' + (cx+8) + '" y2="' + ledgerStart + '" stroke="#000" stroke-width="1"/>');
                ledgerStart -= G;
              }
            });
          }

          // DOWN-stem notes (kick)
          stepHits[s].down.forEach(function(h) {
            // Ledger line below staff
            o.push('<line x1="' + (cx-8) + '" y1="' + (STAFF_TOP+5*G) + '" x2="' + (cx+8) + '" y2="' + (STAFF_TOP+5*G) + '" stroke="#000" stroke-width="1"/>');
            // Stem
            var stemBotY = (downIdx.length >= 2) ? beamYdown : h.y + 28;
            o.push('<line x1="' + (cx-3) + '" y1="' + h.y + '" x2="' + (cx-3) + '" y2="' + stemBotY + '" stroke="#000" stroke-width="1.2"/>');
            // Note head
            o.push('<ellipse cx="' + cx + '" cy="' + h.y + '" rx="5" ry="3.5" fill="#000" transform="rotate(-15 ' + cx + ' ' + h.y + ')"/>');
          });
        }
      }

      o.push('</svg>');
      return o.join('\n');
    };

    var css = ''
      + '* { box-sizing:border-box; margin:0; padding:0; }'
      + 'body { font-family:"DM Mono","Courier New",monospace; background:#fff; color:#111;'
      +        '-webkit-print-color-adjust:exact; print-color-adjust:exact; font-size:11px; }'

      // Doc header (dark bar)
      + '.doc-hdr { background:#0a0a08; color:#e8e8e0; display:flex; align-items:center;'
      +            'justify-content:space-between; padding:14px 28px; }'
      + '.logo { font-family:"Bebas Neue",Impact,sans-serif; font-size:22px; letter-spacing:0.1em; color:#e8e8e0; line-height:1; }'
      + '.logo em { color:#e8ff00; font-style:normal; }'
      + '.logo-url { font-size:9px; letter-spacing:0.12em; color:#888; margin-left:6px; vertical-align:middle; }'
      + '.pro-badge { background:#e8ff00; color:#0a0a08; font-family:"Bebas Neue",Impact,sans-serif;'
      +              'font-size:11px; letter-spacing:0.18em; padding:4px 10px; text-align:right; }'
      + '.pro-sub { font-size:7.5px; letter-spacing:0.12em; color:#888; margin-top:2px; }'

      // Title area
      + '.title-area { padding:20px 28px 16px; border-bottom:1px solid #eee; }'
      + '.groove-title { font-family:"Bebas Neue",Impact,sans-serif; font-size:40px; letter-spacing:0.04em;'
      +                  'line-height:1; color:#0a0a08; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }'
      + '.genre-pill { font-family:"DM Mono","Courier New",monospace; font-size:10px; letter-spacing:0.14em;'
      +               'text-transform:uppercase; background:#0a0a08; color:#e8ff00; padding:4px 10px;'
      +               'vertical-align:middle; display:inline-block; }'
      + '.meta-line { font-size:10px; color:#555; margin-top:8px; letter-spacing:0.04em; }'
      + '.meta-line em { color:#0a0a08; font-style:normal; font-weight:500; }'
      + '.desc-line { font-size:10px; color:#777; margin-top:6px; font-style:italic; line-height:1.5; }'

      // Body
      + '.body { padding:0 28px 24px; }'

      // Section titles
      + '.sec-title { font-family:"Bebas Neue",Impact,sans-serif; font-size:13px; letter-spacing:0.2em;'
      +              'color:#0a0a08; border-left:3px solid #e8ff00; padding-left:8px;'
      +              'margin:22px 0 12px; text-transform:uppercase; }'

      // Visual grid
      + '.grid-wrap { overflow-x:auto; margin-bottom:4px; }'
      + '.grid-tbl { border-collapse:collapse; }'
      + '.lbl-col { min-width:' + LBL + 'px; width:' + LBL + 'px; font-size:9px; letter-spacing:0.06em;'
      +            'text-transform:uppercase; color:#444; white-space:nowrap; padding-right:8px;'
      +            'text-align:right; vertical-align:middle; }'
      + '.dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px; vertical-align:middle; flex-shrink:0; }'
      + '.dot.sm { width:7px; height:7px; margin-right:4px; }'
      + '.bcell { width:' + CELL + 'px; min-width:' + CELL + 'px; text-align:center; font-size:8px;'
      +          'color:#ccc; padding-bottom:4px; }'
      + '.bcell.beat { color:#0a0a08; font-weight:600; font-size:9px; }'
      + '.bcell.nbar,.gcell.nbar { border-left:2px solid #999 !important; }'
      + '.bar-hdr { font-size:7.5px; letter-spacing:0.14em; text-transform:uppercase; color:#aaa;'
      +            'padding:0 0 5px 3px; border-left:2px solid #ccc; text-align:left; }'
      + '.gcell { width:' + CELL + 'px; height:' + CELL + 'px; border:1px solid #e8e8e8; background:#f6f6f6;'
      +          'text-align:center; font-size:8px; font-weight:600; color:#fff; vertical-align:middle; }'
      + '.gcell.hit { border-radius:2px; }'
      + 'tr:nth-child(even) .gcell:not(.hit) { background:#f0f0f0; }'

      // Detail table
      + '.dtbl { border-collapse:collapse; width:100%; margin-bottom:4px; }'
      + '.dth { font-size:8px; letter-spacing:0.1em; text-transform:uppercase; color:#888;'
      +        'font-weight:500; padding:4px 3px; border-bottom:2px solid #e8e8e8; text-align:center; }'
      + '.dth:first-child { text-align:left; min-width:' + LBL + 'px; }'
      + '.sth { width:' + CELL + 'px; min-width:' + CELL + 'px; }'
      + '.dtd { text-align:center; padding:3px 2px; border:1px solid #f0f0f0; vertical-align:middle; }'
      + '.dtd.dlbl { text-align:left; font-size:9px; text-transform:uppercase; letter-spacing:0.04em; color:#333; white-space:nowrap; padding-right:8px; }'
      + '.ddot { font-size:10px; }'

      // Practice notes
      + '.notes-list { list-style:none; display:flex; flex-direction:column; gap:7px; }'
      + '.notes-list li { font-size:10px; color:#333; line-height:1.5; padding-left:18px; position:relative; }'
      + '.notes-list li::before { content:"→"; position:absolute; left:0; color:#c8a000; font-weight:600; }'

      // Reference table
      + '.ref-tbl { border-collapse:collapse; width:100%; }'
      + '.rth { font-size:8px; letter-spacing:0.18em; text-transform:uppercase; color:#e8ff00;'
      +        'background:#0a0a08; padding:8px 14px; text-align:center; font-weight:500; }'
      + '.rtd { font-family:"Bebas Neue",Impact,sans-serif; font-size:20px; letter-spacing:0.04em;'
      +        'color:#0a0a08; background:#f8f8f8; padding:10px 14px; text-align:center;'
      +        'border:1px solid #e8e8e8; border-top:3px solid #e8ff00; }'

      // Doc footer (dark bar)
      + '.doc-ftr { background:#0a0a08; color:#888; display:flex; align-items:center;'
      +            'justify-content:space-between; padding:10px 28px; margin-top:24px; }'
      + '.doc-ftr .logo { font-size:14px; }'
      + '.ftr-right { font-size:9px; letter-spacing:0.06em; text-align:right; }'

      // Notation legend
      + '.nota-legend { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px 16px; margin-bottom:4px; }'
      + '.nl-item { display:flex; align-items:center; gap:8px; }'
      + '.nl-txt { display:flex; flex-direction:column; gap:1px; }'
      + '.nl-name { font-size:9.5px; font-weight:600; color:#111; letter-spacing:0.04em; text-transform:uppercase; }'
      + '.nl-pos { font-size:8.5px; color:#666; font-style:italic; }'

      // Print
      + '@media print {'
      + '  body { font-size:9.5px; }'
      + '  .body { padding:0 16px 16px; }'
      + '  .title-area { padding:14px 16px 12px; }'
      + '  .doc-hdr,.doc-ftr { padding:10px 16px; }'
      + '  .grid-wrap { overflow:visible; }'
      + '  @page { margin:0.8cm; }'
      + '}';

    var html = '<!DOCTYPE html><html lang="es"><head>'
      + '<meta charset="utf-8">'
      + '<title>' + esc(groove.title) + ' — DrumHub</title>'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">'
      + '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;family=DM+Mono:wght@400;500&amp;display=swap" rel="stylesheet">'
      + '<style>' + css + '</style>'
      + '</head><body>'

      // ── Doc Header ──
      + '<div class="doc-hdr">'
      +   '<div style="display:flex;align-items:center;gap:12px">'
      +     '<img src="' + window.location.origin + '/imagenes/logo.png" height="52" width="52" style="display:block;border-radius:4px" alt="DrumHub"/>'
      +     '<div>'
      +       '<div class="logo">DRUM<em>HUB</em></div>'
      +       '<div class="logo-url">drumhub.com</div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="text-align:right">'
      +     '<div class="pro-badge">PLAN PRO</div>'
      +     '<div class="pro-sub">Exportado desde DrumHub</div>'
      +   '</div>'
      + '</div>'

      // ── Title area ──
      + '<div class="title-area">'
      +   '<div class="groove-title">'
      +     esc(groove.title)
      +     '<span class="genre-pill">' + esc(groove.genre || '—') + '</span>'
      +   '</div>'
      +   '<div class="meta-line">por <em>' + esc(groove.author || 'DrumHub') + '</em>'
      +     ' &nbsp;·&nbsp; ' + esc(groove.bpm) + ' BPM'
      +     ' &nbsp;·&nbsp; ' + esc(groove.level || '—')
      +     ' &nbsp;·&nbsp; ' + esc(timeSig)
      +     ' &nbsp;·&nbsp; ' + steps + ' pasos'
      +   '</div>'
      +   (groove.desc ? '<div class="desc-line">' + esc(groove.desc) + '</div>' : '')
      + '</div>'

      + '<div class="body">'

      // ── Partitura ──
      + sec('Partitura · ' + timeSig + ' · ' + esc(String(groove.bpm)) + ' BPM')
      + '<div style="overflow-x:auto;margin-bottom:4px;padding:10px 0;">'
      +   buildStaffSVG(groove, rows, steps, stepsPerBar, stepsPerBeat, bars)
      + '</div>'

      // ── Leyenda de notación ──
      + sec('Leyenda de notación')
      + '<div class="nota-legend">'
      + (function() {
          var NOTA_DESC = {
            china:      { pos: 'Por encima del pentagrama (muy alto)', x: true },
            crash:      { pos: 'Por encima del pentagrama (alto)', x: true },
            splash:     { pos: 'Por encima del pentagrama', x: true },
            ride:       { pos: 'Por encima del pentagrama', x: true },
            ride_bell:  { pos: 'Borde superior del pentagrama', x: true },
            hihat_open: { pos: 'Por encima del pentagrama (hi-hat abierto)', x: true, open: true },
            hihat:      { pos: 'Por encima del pentagrama (hi-hat cerrado)', x: true },
            cowbell:    { pos: 'Borde superior del pentagrama', x: true },
            tamb:       { pos: 'Por encima del pentagrama', x: true },
            stick:      { pos: 'Línea 2 del pentagrama', x: true },
            cabasa:     { pos: 'Línea 1 (inferior) del pentagrama', x: true },
            tom1:       { pos: 'Espacio 4 — tom agudo', x: false },
            snare:      { pos: 'Espacio 3 — posición estándar del redoblante', x: false },
            clap:       { pos: 'Espacio 3 — mismo que redoblante', x: false },
            tom2:       { pos: 'Espacio 2 — tom medio', x: false },
            conga:      { pos: 'Línea 2 del pentagrama', x: false },
            tom3:       { pos: 'Espacio 1 — tom grave / chancha', x: false },
            kick:       { pos: 'Línea auxiliar inferior — bombo', x: false },
            snare_ghost: { pos: 'Espacio 3 — ghost note (suave, entre paréntesis)', x: false, ghost: true },
            snare_flam:  { pos: 'Espacio 3 — flam (apoyatura + nota principal)', x: false, flam: true }
          };
          return rows.map(function(r) {
            var info = NOTA_DESC[r.id] || { pos: 'Pentagrama', x: false };
            var c = clr(r);
            var sym = '';
            if (info.x) {
              sym = '<svg width="16" height="16" style="vertical-align:middle;flex-shrink:0">'
                + '<line x1="2" y1="2" x2="14" y2="14" stroke="' + c + '" stroke-width="2.2"/>'
                + '<line x1="14" y1="2" x2="2" y2="14" stroke="' + c + '" stroke-width="2.2"/>'
                + (info.open ? '<circle cx="8" cy="-1" r="3" fill="none" stroke="' + c + '" stroke-width="1.4"/>' : '')
                + '</svg>';
            } else if (info.ghost) {
              sym = '<svg width="20" height="16" style="vertical-align:middle;flex-shrink:0">'
                + '<text x="1" y="12" font-size="11" font-family="serif" fill="' + c + '">(</text>'
                + '<ellipse cx="10" cy="9" rx="4" ry="2.8" fill="' + c + '" opacity="0.55" transform="rotate(-15 10 9)"/>'
                + '<text x="13" y="12" font-size="11" font-family="serif" fill="' + c + '">)</text>'
                + '</svg>';
            } else if (info.flam) {
              sym = '<svg width="20" height="16" style="vertical-align:middle;flex-shrink:0">'
                + '<ellipse cx="4" cy="6" rx="2.5" ry="1.8" fill="' + c + '"/>'
                + '<line x1="6.5" y1="6" x2="6.5" y2="1" stroke="' + c + '" stroke-width="1"/>'
                + '<line x1="4" y1="3" x2="9" y2="1" stroke="' + c + '" stroke-width="1.2"/>'
                + '<ellipse cx="14" cy="9" rx="5" ry="3.5" fill="' + c + '" transform="rotate(-15 14 9)"/>'
                + '</svg>';
            } else {
              sym = '<svg width="16" height="16" style="vertical-align:middle;flex-shrink:0">'
                + '<ellipse cx="8" cy="9" rx="6" ry="4" fill="' + c + '" transform="rotate(-15 8 9)"/>'
                + '</svg>';
            }
            return '<div class="nl-item">'
              + sym
              + '<div class="nl-txt">'
              + '<span class="nl-name">' + esc(r.name) + '</span>'
              + '<span class="nl-pos">' + esc(info.pos) + '</span>'
              + '</div>'
              + '</div>';
          }).join('');
        })()
      + '</div>'

      // ── Grilla visual ──
      + sec('Grilla de ' + steps + ' pasos · ' + timeSig)
      + '<div class="grid-wrap"><table class="grid-tbl">'
      + barRow
      + beatRow
      + gridRows
      + '</table></div>'

      // ── Tabla detallada ──
      + sec('Tabla detallada de pasos')
      + '<div class="grid-wrap"><table class="dtbl">'
      + detailHead
      + detailRows
      + '</table></div>'

      // ── Notas de práctica ──
      + sec('Notas de práctica')
      + '<ul class="notes-list">' + notesHtml + '</ul>'

      // ── Referencia ──
      + sec('Referencia')
      + '<table class="ref-tbl">'
      +   '<thead><tr>' + refHeads + '</tr></thead>'
      +   '<tbody><tr>' + refVals  + '</tr></tbody>'
      + '</table>'

      + '</div>'

      // ── Doc Footer ──
      + '<div class="doc-ftr">'
      +   '<div class="logo">DRUM<em>HUB</em> &nbsp;<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#555;letter-spacing:0.1em">· drumhub.com · La biblioteca de grooves para bateristas</span></div>'
      +   '<div class="ftr-right">' + esc(groove.title) + ' &nbsp;·&nbsp; ' + esc(groove.genre||'') + ' &nbsp;·&nbsp; ' + esc(groove.bpm) + ' BPM &nbsp;·&nbsp; Plan PRO</div>'
      + '</div>'

      + '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},700);});<\/script>'
      + '</body></html>';

    var w = window.open('', '_blank', 'width=1000,height=800');
    if (w) { w.document.write(html); w.document.close(); }
    else { alert('Habilitá las ventanas emergentes para exportar a PDF.'); }
  }

  // ── MP3 (OfflineAudioContext + lamejs) ──
  function exportMP3(groove) {
    var bpm = groove.bpm || 90;
    var steps = 16;
    if (groove.timeSig && DH.TIME_SIGS) {
      var tsConf = DH.TIME_SIGS.find(function(t) { return t.id === groove.timeSig; });
      if (tsConf) steps = tsConf.stepsPerBar * (groove.bars || 1);
    }

    var LOOPS = 2;
    var stepDuration = 60 / bpm / 4; // seconds per 16th note
    var totalDuration = steps * stepDuration * LOOPS;
    var sampleRate = 44100;

    // Check lamejs is loaded
    if (typeof lamejs === 'undefined') {
      alert('Cargando encoder de MP3, intentá de nuevo en un segundo...');
      return;
    }

    // Get current kit buffers (already loaded AudioBuffers)
    var kitBuffers = DH.Audio.getBuffers();
    var rows = DH.ROWS || [];
    var defaultVols = DH.Audio.getDefaultVols ? DH.Audio.getDefaultVols() : DH.DEFAULT_VOLS;

    var offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    // Master gain
    var masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(offlineCtx.destination);

    function cloneBuffer(srcBuf) {
      var dst = offlineCtx.createBuffer(srcBuf.numberOfChannels, srcBuf.length, srcBuf.sampleRate);
      for (var c = 0; c < srcBuf.numberOfChannels; c++) {
        dst.getChannelData(c).set(srcBuf.getChannelData(c));
      }
      return dst;
    }

    // Synth fallbacks for offline context (mirror of audio.js)
    function noise(dur) {
      var n = Math.ceil(offlineCtx.sampleRate * dur);
      var buf = offlineCtx.createBuffer(1, n, offlineCtx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    function synthKickOff(t, vol) {
      var sub = offlineCtx.createOscillator(), sg = offlineCtx.createGain();
      sub.connect(sg); sg.connect(masterGain); sub.type = 'sine';
      sub.frequency.setValueAtTime(160, t); sub.frequency.exponentialRampToValueAtTime(40, t+0.08);
      sg.gain.setValueAtTime(vol*1.2, t); sg.gain.exponentialRampToValueAtTime(0.001, t+0.45);
      sub.start(t); sub.stop(t+0.5);
    }
    function synthSnareOff(t, vol) {
      var body = offlineCtx.createOscillator(), bg = offlineCtx.createGain();
      body.connect(bg); bg.connect(masterGain); body.type = 'triangle';
      body.frequency.setValueAtTime(220, t); body.frequency.exponentialRampToValueAtTime(100, t+0.05);
      bg.gain.setValueAtTime(vol*0.7, t); bg.gain.exponentialRampToValueAtTime(0.001, t+0.12);
      body.start(t); body.stop(t+0.15);
      var sn = offlineCtx.createBufferSource(); sn.buffer = noise(0.22);
      var hp = offlineCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      var sg = offlineCtx.createGain();
      sn.connect(hp); hp.connect(sg); sg.connect(masterGain);
      sg.gain.setValueAtTime(vol*0.9, t); sg.gain.exponentialRampToValueAtTime(0.001, t+0.22);
      sn.start(t); sn.stop(t+0.25);
    }
    function synthHihatOff(t, vol, open) {
      var dur = open ? 0.35 : 0.08;
      var ns = offlineCtx.createBufferSource(); ns.buffer = noise(dur);
      var hp = offlineCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
      var g = offlineCtx.createGain();
      ns.connect(hp); hp.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(vol*(open?0.45:0.55), t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
      ns.start(t); ns.stop(t+dur+0.02);
    }
    function synthCymbalOff(t, vol, hpFreq, dur) {
      var ns = offlineCtx.createBufferSource(); ns.buffer = noise(dur);
      var hp = offlineCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
      var g = offlineCtx.createGain();
      ns.connect(hp); hp.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(vol*0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
      ns.start(t); ns.stop(t+dur+0.05);
    }
    function synthTomOff(t, vol, freq, decay) {
      var osc = offlineCtx.createOscillator(), og = offlineCtx.createGain();
      osc.connect(og); og.connect(masterGain); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq*1.8, t); osc.frequency.exponentialRampToValueAtTime(freq*0.7, t+0.04);
      og.gain.setValueAtTime(vol, t); og.gain.exponentialRampToValueAtTime(0.001, t+decay);
      osc.start(t); osc.stop(t+decay+0.05);
    }
    function synthOff(id, t, vol) {
      if (id==='kick')       return synthKickOff(t, vol);
      if (id==='snare')      return synthSnareOff(t, vol);
      if (id==='hihat')      return synthHihatOff(t, vol, false);
      if (id==='hihat_open') return synthHihatOff(t, vol, true);
      if (id==='ride')       return synthCymbalOff(t, vol, 3500, 0.5);
      if (id==='crash')      return synthCymbalOff(t, vol, 4000, 1.2);
      if (id==='splash')     return synthCymbalOff(t, vol, 6000, 0.18);
      if (id==='tom1')       return synthTomOff(t, vol, 180, 0.3);
      if (id==='tom2')       return synthTomOff(t, vol, 110, 0.35);
      if (id==='tom3')       return synthTomOff(t, vol, 75, 0.45);
    }

    function triggerOff(id, t, vol) {
      var pool = kitBuffers[id];
      if (pool && pool.length && pool[0]) {
        var src = offlineCtx.createBufferSource();
        src.buffer = cloneBuffer(pool[0]);
        var g = offlineCtx.createGain(); g.gain.value = vol;
        src.connect(g); g.connect(masterGain);
        src.start(t);
      } else {
        synthOff(id, t, vol);
      }
    }

    // Schedule all steps x LOOPS
    for (var loop = 0; loop < LOOPS; loop++) {
      for (var s = 0; s < steps; s++) {
        var t = (loop * steps + s) * stepDuration;
        rows.forEach(function(row) {
          var arr = groove.pattern && groove.pattern[row.id];
          if (arr && arr[s]) {
            var vol = (defaultVols && defaultVols[row.id]) || 0.8;
            triggerOff(row.id, t, vol);
          }
        });
      }
    }

    offlineCtx.startRendering().then(function(audioBuffer) {
      // Convert to interleaved Int16 stereo PCM
      var left  = audioBuffer.getChannelData(0);
      var right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
      var samples = left.length;

      var mp3enc = new lamejs.Mp3Encoder(2, sampleRate, 128);
      var mp3Data = [];
      var BLOCK = 1152;

      for (var i = 0; i < samples; i += BLOCK) {
        var leftChunk  = new Int16Array(BLOCK);
        var rightChunk = new Int16Array(BLOCK);
        for (var j = 0; j < BLOCK && (i+j) < samples; j++) {
          leftChunk[j]  = Math.max(-32768, Math.min(32767, left[i+j]  * 32767));
          rightChunk[j] = Math.max(-32768, Math.min(32767, right[i+j] * 32767));
        }
        var buf = mp3enc.encodeBuffer(leftChunk, rightChunk);
        if (buf.length > 0) mp3Data.push(buf);
      }
      var end = mp3enc.flush();
      if (end.length > 0) mp3Data.push(end);

      var blob = new Blob(mp3Data, { type: 'audio/mp3' });
      downloadBlob(blob, slugify(groove.title) + '.mp3');
    });
  }

  return { json: exportJSON, midi: exportMIDI, pdf: exportPDF, mp3: exportMP3 };
})();
