// Compare grooves side-by-side. Stateful selection + floating button + overlay modal.
window.DH = window.DH || {};

DH.Compare = (function () {
  var selected = [];        // array of groove objects
  var listeners = [];       // suscriptores que se redibujan ante cambios (cards, fab)
  var MAX = 3;
  var esc = function (s) { return DH.UI.escape(s); };

  function notify() {
    // Auto-prune: si la función subscriber tiene .el y ese elemento ya no está en el DOM, la quitamos.
    listeners = listeners.filter(function (fn) {
      if (fn.el && !document.body.contains(fn.el)) return false;
      try { fn(selected.slice()); } catch (e) { return false; }
      return true;
    });
  }
  function subscribe(fn, el) {
    if (el) fn.el = el;
    listeners.push(fn);
    fn(selected.slice());
    return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
  }

  function isSelected(id) { return selected.some(function (g) { return g.id === id; }); }
  function toggle(g) {
    if (isSelected(g.id)) selected = selected.filter(function (x) { return x.id !== g.id; });
    else if (selected.length < MAX) selected.push(g);
    notify();
    renderFab();
  }
  function clear() { selected = []; notify(); renderFab(); closeOverlay(); }

  // Floating action button — sólo visible cuando hay >=2 seleccionados
  function renderFab() {
    var fab = document.getElementById('compare-fab');
    if (!selected.length) { if (fab) fab.remove(); return; }
    if (!fab) {
      fab = document.createElement('div');
      fab.id = 'compare-fab';
      fab.className = 'compare-fab';
      document.body.appendChild(fab);
    }
    fab.innerHTML = ''
      + '<div class="compare-fab-count"><em>' + selected.length + '</em> / ' + MAX + ' seleccionados</div>'
      + '<div class="compare-fab-btns">'
      +   '<button class="compare-fab-open"' + (selected.length < 2 ? ' disabled' : '') + '>Comparar →</button>'
      +   '<button class="compare-fab-clear" title="Limpiar">×</button>'
      + '</div>';
    fab.querySelector('.compare-fab-open').addEventListener('click', function () {
      if (selected.length >= 2) openOverlay();
    });
    fab.querySelector('.compare-fab-clear').addEventListener('click', clear);
  }

  function openOverlay() {
    closeOverlay();
    var overlay = document.createElement('div');
    overlay.id = 'compare-overlay';
    overlay.className = 'compare-overlay';

    var rows = (window.DH && DH.ROWS) || [];
    var visibleRows = rows.filter(function (r) {
      // Solo filas que tengan al menos un hit en algún groove seleccionado
      return selected.some(function (g) {
        var arr = g.pattern && g.pattern[r.id];
        return arr && arr.some(function (v) { return !!v; });
      });
    });

    var html = '<div class="compare-modal">'
      + '<div class="compare-modal-head">'
      +   '<div class="compare-modal-title">Comparar <em>' + selected.length + ' grooves</em></div>'
      +   '<button class="compare-modal-close" aria-label="Cerrar">×</button>'
      + '</div>'
      + '<div class="compare-grid" style="grid-template-columns:repeat(' + selected.length + ', 1fr);">';
    selected.forEach(function (g) {
      html += '<div class="compare-col">'
        + '<div class="cc-genre">' + esc(g.genre) + '</div>'
        + '<div class="cc-title">' + esc(g.title) + '</div>'
        + '<div class="cc-meta">por ' + esc(g.author) + ' · ' + g.bpm + ' BPM · ' + esc(g.level) + '</div>'
        + '<div class="cc-pattern" id="cc-pat-' + g.id + '"></div>'
        + '<div class="cc-actions">'
        +   '<button class="btn-sm btn-play-feat cc-play" data-gid="' + esc(g.id) + '">▶ Preview</button>'
        +   '<button class="btn-sm btn-share-feat cc-open" data-slug="' + esc(g.slug) + '">Ver detalle →</button>'
        + '</div>'
      + '</div>';
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Render the pattern visualization for each column
    selected.forEach(function (g) {
      var host = document.getElementById('cc-pat-' + g.id);
      visibleRows.forEach(function (row) {
        var arr = (g.pattern && g.pattern[row.id]) || new Array(16).fill(0);
        var line = document.createElement('div'); line.className = 'cc-row';
        line.innerHTML = '<span class="cc-row-name" style="color:var(--' + row.color + ')">' + esc(row.name) + '</span><div class="cc-row-cells">'
          + arr.map(function (v) { return '<div class="cc-cell ' + row.color + (v ? ' on' : '') + '"></div>'; }).join('')
          + '</div>';
        host.appendChild(line);
      });
    });

    overlay.querySelector('.compare-modal-close').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    overlay.querySelectorAll('.cc-play').forEach(function (btn) {
      var gid = btn.getAttribute('data-gid');
      var g = selected.find(function (x) { return x.id === gid; });
      var token = null;
      btn.addEventListener('click', function () {
        if (token && DH.PreviewPlayer.isPlaying(token)) { DH.PreviewPlayer.stop(); btn.textContent = '▶ Preview'; token = null; return; }
        btn.textContent = '⏹ Stop';
        token = DH.PreviewPlayer.play(g.pattern, g.bpm, function () { btn.textContent = '▶ Preview'; token = null; }, g.kit, g.timeSig);
      });
    });
    overlay.querySelectorAll('.cc-open').forEach(function (btn) {
      btn.addEventListener('click', function () { var slug = btn.getAttribute('data-slug'); closeOverlay(); DH.Router.go('/groove/' + slug); });
    });
  }
  function closeOverlay() {
    var ov = document.getElementById('compare-overlay'); if (ov) ov.remove();
    if (DH.PreviewPlayer && DH.PreviewPlayer.isPlaying()) DH.PreviewPlayer.stop();
  }

  // Escape closes the overlay
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('compare-overlay')) closeOverlay();
  });

  return { toggle: toggle, isSelected: isSelected, subscribe: subscribe, clear: clear, getSelected: function () { return selected.slice(); } };
})();
