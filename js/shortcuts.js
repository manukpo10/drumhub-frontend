// Global keyboard shortcuts.
// `/` enfoca la búsqueda · `←/→` pagina · `?` muestra/oculta help · `Esc` cierra modal/preview/help
window.DH = window.DH || {};

DH.Shortcuts = (function () {
  function isTypingInInput(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function showHelp() {
    if (document.getElementById('kb-help')) return;
    var help = document.createElement('div');
    help.id = 'kb-help';
    help.className = 'kb-help';
    help.innerHTML = ''
      + '<div class="kb-help-card">'
      +   '<div class="kb-help-title">Atajos de teclado</div>'
      +   '<div class="kb-help-row"><kbd>/</kbd><span>Enfocar búsqueda</span></div>'
      +   '<div class="kb-help-row"><kbd>←</kbd> <kbd>→</kbd><span>Página anterior · siguiente</span></div>'
      +   '<div class="kb-help-row"><kbd>g</kbd> <kbd>h</kbd><span>Ir al home</span></div>'
      +   '<div class="kb-help-row"><kbd>g</kbd> <kbd>s</kbd><span>Ir al buscador</span></div>'
      +   '<div class="kb-help-row"><kbd>g</kbd> <kbd>u</kbd><span>Ir a subir groove</span></div>'
      +   '<div class="kb-help-row"><kbd>p</kbd><span>Detener preview de audio</span></div>'
      +   '<div class="kb-help-row"><kbd>?</kbd><span>Mostrar / ocultar esta ayuda</span></div>'
      +   '<div class="kb-help-row"><kbd>Esc</kbd><span>Cerrar modal / preview / esta ayuda</span></div>'
      +   '<div class="kb-help-foot">Click afuera o <kbd>Esc</kbd> para cerrar</div>'
      + '</div>';
    help.addEventListener('click', function (e) { if (e.target === help) hideHelp(); });
    document.body.appendChild(help);
  }
  function hideHelp() {
    var el = document.getElementById('kb-help');
    if (el) el.remove();
  }

  // "g" prefix para "go to": espera segunda tecla por ~800ms
  var pendingPrefix = null;
  var pendingTimer = null;
  function setPrefix(p) {
    pendingPrefix = p;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(function () { pendingPrefix = null; }, 800);
  }

  document.addEventListener('keydown', function (e) {
    // Mientras escribís en un input, solo Esc funciona (desenfocar)
    if (isTypingInInput(document.activeElement)) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // 2nd key of a "g X" navigation prefix
    if (pendingPrefix === 'g') {
      pendingPrefix = null;
      if (e.key === 'h') { e.preventDefault(); DH.Router && DH.Router.go('/'); return; }
      if (e.key === 's') { e.preventDefault(); DH.Router && DH.Router.go('/search'); return; }
      if (e.key === 'u') { e.preventDefault(); DH.Router && DH.Router.go('/upload'); return; }
      if (e.key === 'g') { e.preventDefault(); DH.Router && DH.Router.go('/genres'); return; }
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      var inp = document.getElementById('s-q') || document.getElementById('nav-search-input');
      if (inp) { inp.focus(); inp.select && inp.select(); }
      return;
    }
    if (e.key === '?') { e.preventDefault(); document.getElementById('kb-help') ? hideHelp() : showHelp(); return; }
    if (e.key === 'Escape') {
      if (document.getElementById('kb-help')) { hideHelp(); return; }
      if (DH.PreviewPlayer && DH.PreviewPlayer.isPlaying()) DH.PreviewPlayer.stop();
      var modal = document.getElementById('modal-overlay');
      if (modal && modal.classList.contains('open')) DH.UI.closeModal();
      return;
    }
    if (e.key === 'p') { if (DH.PreviewPlayer && DH.PreviewPlayer.isPlaying()) { e.preventDefault(); DH.PreviewPlayer.stop(); } return; }
    if (e.key === 'g') { setPrefix('g'); return; }

    // Pagination only when on /search (or any page that has .pagination)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var pg = document.querySelector('.pagination');
      if (!pg) return;
      var btn = e.key === 'ArrowLeft' ? pg.querySelector('button:first-child') : pg.querySelector('button:last-child');
      if (btn && !btn.classList.contains('disabled')) { e.preventDefault(); btn.click(); }
    }
  });

  // Hint discreto en el footer del help
  return { showHelp: showHelp, hideHelp: hideHelp };
})();
