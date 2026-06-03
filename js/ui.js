// Global UI: nav, footer, modal, mini-grids and shared card renderers.
window.DH = window.DH || {};

DH.UI = (function () {
  function avatarColor(seed) {
    var palette = ['#ff4d00', '#e8ff00', '#00c9ff', '#a855f7', '#22c55e', '#f43f5e', '#ffaa00', '#fb923c', '#84cc16', '#38bdf8'];
    var n = 0; for (var i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % palette.length;
    return palette[n];
  }

  // Drummer avatar: usa drummer.avatar (seed elegida o URL) si existe; si no, seed = user.
  // Guardamos solo el seed en localStorage → al migrar a Supabase, una columna varchar(32) y listo.
  // opts: { size, color, ring }
  function drummerAvatar(drummer, opts) {
    opts = opts || {};
    var size = opts.size || 64;
    var color = opts.color || drummer.color || avatarColor(drummer.user);
    var ringPx = opts.ring || 2;
    var bg = color + '20';
    var url = DH.avatarUrl(drummer.avatar || drummer.user);
    return '<span class="drummer-portrait" style="width:' + size + 'px;height:' + size + 'px;background:' + bg + ';border:' + ringPx + 'px solid ' + color + ';">'
      + '<img src="' + url + '" alt="' + escape(drummer.name || drummer.user) + '" loading="lazy">'
      + '</span>';
  }
  function drummerOrFallback(user) {
    return DH.findDrummer(user) || { user: user, name: user, init: (user[0] || 'D').toUpperCase(), color: avatarColor(user), grooves: 0, likes: 0, bio: '' };
  }
  function escape(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  // ── NAV ──
  function renderNav() {
    var nav = document.getElementById('nav');
    var u = DH.Store.getUser();
    nav.innerHTML = ''
      + '<a class="nav-logo" href="/">Drum<em>Hub</em></a>'
      + '<div class="nav-center">'
      +   '<a href="/search" data-route="/search">Explorar</a>'
      +   '<a href="/genres" data-route="/genres">Géneros</a>'
      +   '<a href="/drummers" data-route="/drummers">Bateristas</a>'
      +   '<a href="/page/about" data-route="/page/about">Sobre</a>'
      + '</div>'
      + '<div class="nav-right">'
      +   '<form class="nav-search" id="nav-search-form">'
      +     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
      +     '<input type="text" placeholder="Buscar grooves..." id="nav-search-input">'
      +   '</form>'
      +   (u
          ? '<button class="btn-ghost" data-action="upload">+ Subir</button>'
          + '<div class="nav-notif-wrap" id="nav-notif-wrap"><button class="nav-notif-btn" id="nav-notif-btn" aria-label="Notificaciones"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="nav-notif-badge" id="nav-notif-badge"></span></button></div>'
          + '<div class="nav-user" data-action="profile">'
          +   '<div class="nav-user-avatar" style="background:' + u.color + '20;color:' + u.color + '">' + escape(u.init) + '</div>'
          +   '<span class="nav-user-name">' + escape(u.user) + '</span>'
          + '</div>'
          + '<button class="btn-ghost" data-action="settings" title="Configuración">⚙</button>'
          + '<button class="btn-ghost" data-action="logout">Salir</button>'
          : '<button class="btn-ghost" data-action="login">Ingresar</button>'
          + '<button class="btn-cta" data-action="register">Registrarse</button>'
        )
      + '</div>'
      + '<button class="nav-burger" id="nav-burger" aria-label="Menú"><span></span><span></span><span></span></button>';

    // Inject mobile drawer (remove previous if re-rendered)
    var oldDrawer = document.getElementById('nav-drawer');
    if (oldDrawer) oldDrawer.remove();
    var oldOverlay = document.getElementById('nav-drawer-overlay');
    if (oldOverlay) oldOverlay.remove();

    var drawer = document.createElement('div');
    drawer.id = 'nav-drawer';
    drawer.className = 'nav-drawer';
    var drawerLinks = [
      { icon: '▶', label: 'Explorar', href: '#/search' },
      { icon: '♩', label: 'Géneros', href: '#/genres' },
      { icon: '🥁', label: 'Bateristas', href: '#/drummers' },
      { icon: '◉', label: 'Sobre', href: '#/page/about' }
    ];
    var userNow = DH.Store.getUser();
    if (userNow) {
      drawerLinks.push({ icon: '◎', label: 'Mi perfil', href: '#/profile/' + userNow.user });
      drawerLinks.push({ icon: '⚙', label: 'Configuración', href: '#/settings' });
      drawerLinks.push({ icon: '▲', label: 'Subir groove', href: '#/upload' });
    }
    drawer.innerHTML = '<div class="nav-drawer-inner">'
      + '<div class="nav-drawer-logo">Drum<em>Hub</em></div>'
      + drawerLinks.map(function(l) { return '<a class="nav-drawer-link" href="' + l.href + '"><span class="nd-icon">' + l.icon + '</span>' + l.label + '</a>'; }).join('')
      + (userNow ? '<button class="nav-drawer-logout" id="nav-drawer-logout"><span class="nd-icon">←</span>Cerrar sesión</button>' : '<button class="nav-drawer-cta" id="nav-drawer-register">✦ Crear cuenta gratis</button>')
      + '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'nav-drawer-overlay';
    overlay.className = 'nav-drawer-overlay';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function openDrawer() { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

    var burger = document.getElementById('nav-burger');
    if (burger) burger.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('.nav-drawer-link').forEach(function(a) { a.addEventListener('click', closeDrawer); });
    var drawerLogout = document.getElementById('nav-drawer-logout');
    if (drawerLogout) drawerLogout.addEventListener('click', function() { DH.Store.logout(); closeDrawer(); renderNav(); DH.Router.go('/'); });
    var drawerRegister = document.getElementById('nav-drawer-register');
    if (drawerRegister) drawerRegister.addEventListener('click', function() { closeDrawer(); openModal('register'); });

    document.getElementById('nav-search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = document.getElementById('nav-search-input').value.trim();
      DH.Router.go('/search' + (q ? '?q=' + encodeURIComponent(q) : ''));
    });
    nav.querySelectorAll('[data-action]').forEach(function (el) {
      el.addEventListener('click', function () {
        var a = el.getAttribute('data-action');
        if (a === 'login') openModal('login');
        else if (a === 'register') openModal('register');
        else if (a === 'settings') DH.Router.go('/settings');
        else if (a === 'logout') { DH.Store.logout(); DH.Notifications && DH.Notifications.clear(); renderNav(); DH.Router.go('/'); }
        else if (a === 'profile') DH.Router.go('/profile/' + u.user);
        else if (a === 'upload') {
          if (!DH.Store.isLoggedIn()) openModal('login');
          else DH.Router.go('/upload');
        }
      });
    });

    if (u && DH.Notifications) {
      // No seedDemo: notifications come from the backend only. An empty panel shows
      // "Sin notificaciones todavía." instead of injecting fake demo entries.
      mountNotifsDropdown(u);
    }
  }

  function mountNotifsDropdown(u) {
    var btn = document.getElementById('nav-notif-btn');
    var badge = document.getElementById('nav-notif-badge');
    var wrap = document.getElementById('nav-notif-wrap');
    if (!btn) return;

    function refreshBadge() {
      var n = DH.Notifications.unreadCount();
      badge.textContent = n > 9 ? '9+' : (n || '');
      badge.classList.toggle('on', n > 0);
    }
    refreshBadge();

    var open = false;
    function close() {
      var dd = document.getElementById('nav-notif-dd');
      if (dd) dd.remove();
      open = false;
      document.removeEventListener('click', outside, true);
    }
    function outside(e) { if (!wrap.contains(e.target)) close(); }
    function relTime(ts) {
      var s = (Date.now() - ts) / 1000;
      if (s < 60) return 'hace ' + Math.floor(s) + 's';
      if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
      if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
      return 'hace ' + Math.floor(s / 86400) + ' d';
    }
    function renderItem(n) {
      var who = '<strong>' + escape(n.user) + '</strong>';
      var body = '';
      if (n.type === 'like') body = who + ' le dio like a <a data-go="/groove/' + escape(n.grooveSlug) + '">' + escape(n.grooveTitle) + '</a>';
      else if (n.type === 'comment') body = who + ' comentó en <a data-go="/groove/' + escape(n.grooveSlug) + '">' + escape(n.grooveTitle) + '</a>' + (n.snippet ? '<div class="ndd-snippet">"' + escape(n.snippet) + '"</div>' : '');
      else if (n.type === 'follow') body = who + ' empezó a seguirte';
      else if (n.type === 'mention') body = who + ' te mencionó en <a data-go="/groove/' + escape(n.grooveSlug) + '">' + escape(n.grooveTitle) + '</a>' + (n.snippet ? '<div class="ndd-snippet">"' + escape(n.snippet) + '"</div>' : '');
      var d = DH.findDrummer(n.user) || { color: '#6b6860', init: n.user.charAt(0).toUpperCase() };
      var icon = { like: '♥', comment: '💬', follow: '+', mention: '@' }[n.type] || '•';
      return '<div class="ndd-item' + (n.read ? '' : ' unread') + '">'
        + '<div class="ndd-avatar" style="background:' + d.color + '20;color:' + d.color + ';">' + escape(d.init) + '</div>'
        + '<div class="ndd-body"><div class="ndd-text">' + body + '</div><div class="ndd-time">' + escape(relTime(n.time)) + '</div></div>'
        + '<span class="ndd-icon">' + icon + '</span>'
        + '</div>';
    }
    function toggle() {
      if (open) { close(); return; }
      open = true;
      var items = DH.Notifications.getAll();
      var dd = document.createElement('div');
      dd.id = 'nav-notif-dd';
      dd.className = 'nav-notif-dd';
      dd.innerHTML = ''
        + '<div class="ndd-head">'
        +   '<div class="ndd-title">Notificaciones</div>'
        +   (items.some(function (n) { return !n.read; }) ? '<button class="ndd-mark" id="ndd-mark">Marcar todas leídas</button>' : '')
        + '</div>'
        + '<div class="ndd-list">'
        + (items.length ? items.map(renderItem).join('') : '<div class="ndd-empty">Sin notificaciones todavía.</div>')
        + '</div>'
        + '<div class="ndd-foot">DrumHub te avisa cuando hay actividad nueva sobre tus grooves.</div>';
      wrap.appendChild(dd);
      dd.querySelectorAll('[data-go]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); close(); DH.Router.go(a.getAttribute('data-go')); }); });
      var mark = dd.querySelector('#ndd-mark');
      if (mark) mark.addEventListener('click', function () { DH.Notifications.markAllRead(); refreshBadge(); close(); });
      setTimeout(function () { document.addEventListener('click', outside, true); }, 0);
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
  }
  function updateNav(path) {
    document.querySelectorAll('#nav .nav-center a').forEach(function (a) {
      a.classList.remove('active');
      var route = a.getAttribute('data-route') || '';
      // Match parcial: /search?genre=Rock matchea route /search, /genre/funk matchea /genres, etc.
      if (route && (path === route || path.indexOf(route) === 0)) a.classList.add('active');
      if (route === '/genres' && path.indexOf('/genre') === 0) a.classList.add('active');
    });
  }

  // ── FOOTER ──
  function renderFooter() {
    document.getElementById('footer').innerHTML = ''
      + '<div class="footer-top">'
      +   '<div class="footer-brand">'
      +     '<div class="logo"><img src="/imagenes/logo.png" alt="DrumHub" style="height:80px;width:auto;filter:brightness(1.5)"></div>'
      +     '<p>La biblioteca de grooves para bateristas. Explorá, practicá y compartí patrones con la comunidad.</p>'
      +   '</div>'
      +   '<div class="footer-col"><h4>Explorar</h4>'
      +     '<a href="/search">Todos los grooves</a>'
      +     '<a href="/genres">Por género</a>'
      +     '<a href="/search?sort=likes">Tendencias</a>'
      +     '<a href="/search?sort=new">Nuevos</a>'
      +   '</div>'
      +   '<div class="footer-col"><h4>Comunidad</h4>'
      +     '<a href="/drummers">Bateristas</a>'
      +     '<a href="/groove/purdie-shuffle">Groove del mes</a>'
      +     '<a href="/page/contribute">Contribuir</a>'
      +     '<a href="/page/faq">FAQ</a>'
      +   '</div>'
      +   '<div class="footer-col"><h4>Proyecto</h4>'
      +     '<a href="/page/about">Sobre DrumHub</a>'
      +     '<a href="/page/contact">Contacto</a>'
      +     '<a href="/page/terms">Términos</a>'
      +     '<a href="/page/privacy">Privacidad</a>'
      +   '</div>'
      + '</div>'
      + '<div class="footer-bottom">'
      +   '<div class="footer-copy">© 2026 DrumHub · Hecho para bateristas 🥁 · Samples: Pearl Master Studio by enoe (<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" style="color:inherit;text-decoration:underline;">CC-BY 3.0</a>)</div>'
      +   '<div class="footer-socials"><a href="/page/contact" title="Contactanos">Instagram</a><a href="/page/contact" title="Contactanos">YouTube</a><a href="/page/contribute" title="Contribuir">GitHub</a></div>'
      + '</div>';
  }

  // ── MODAL ──
  function openModal(tab) {
    var ov = document.getElementById('modal-overlay');
    var box = document.getElementById('modal-box');
    box.innerHTML = ''
      + '<button class="modal-close" data-close="1">✕</button>'
      + '<div class="modal-tabs">'
      +   '<button type="button" class="modal-tab" data-tab="login">Ingresar</button>'
      +   '<button type="button" class="modal-tab" data-tab="register">Registrarse</button>'
      + '</div>'
      + '<div id="modal-pane-login">'
      +   '<div class="modal-title">Bienvenido de vuelta</div>'
      +   '<div class="modal-sub">Ingresá para acceder a tus grooves y favoritos.</div>'
      +   '<form id="form-login">'
      +     '<div class="modal-field"><label>Email o usuario</label><input type="text" name="email" placeholder="tu@email.com o user" required></div>'
      +     '<div class="modal-field"><label>Contraseña</label><input type="password" name="password" placeholder="••••••••" required></div>'
      +     '<div style="text-align:right;margin-bottom:8px;"><a data-action="forgot" style="font-size:0.62rem;color:var(--muted);font-family:DM Mono,monospace;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">¿Olvidaste tu contraseña?</a></div>'
      +     '<button class="btn-modal-submit" type="submit">Ingresar</button>'
      +   '</form>'
      +   '<div class="modal-or"><span>o</span></div>'
      +   '<button type="button" class="btn-google-signin" id="btn-google-login"><svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg> Continuar con Google</button>'
      +   '<div class="modal-divider">¿No tenés cuenta? <a data-tab="register">Registrate gratis</a></div>'
      + '</div>'
      + '<div id="modal-pane-register" style="display:none;">'
      +   '<div class="modal-title">Creá tu cuenta</div>'
      +   '<div class="modal-sub">Gratis para siempre. Sin tarjeta de crédito.</div>'
      +   '<form id="form-register">'
      +     '<div class="modal-field"><label>Elegí tu avatar</label>'
      +       '<div class="avatar-picker" id="avatar-picker"></div>'
      +       '<input type="hidden" name="avatar" id="avatar-selected" value="">'
      +     '</div>'
      +     '<div class="modal-field"><label>Usuario</label><input type="text" name="username" placeholder="tu_nombre_baterista" required></div>'
      +     '<div class="modal-field"><label>Email</label><input type="email" name="email" placeholder="tu@email.com" required></div>'
      +     '<div class="modal-field"><label>Contraseña</label><input type="password" name="password" placeholder="••••••••" required></div>'
      +     '<button class="btn-modal-submit" type="submit">Crear cuenta</button>'
      +   '</form>'
      +   '<div class="modal-or"><span>o</span></div>'
      +   '<button type="button" class="btn-google-signin" id="btn-google-register"><svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg> Continuar con Google</button>'
      +   '<div class="modal-divider">¿Ya tenés cuenta? <a data-tab="login">Ingresá</a></div>'
      + '</div>'
      + '<div id="modal-pane-forgot" style="display:none;">'
      +   '<div class="modal-title">Recuperar <em>contraseña</em></div>'
      +   '<div class="modal-sub">Ingresá tu email y te enviamos las instrucciones.</div>'
      +   '<form id="modal-forgot-form">'
      +     '<div class="modal-field"><label>Email</label><input type="email" name="email" id="modal-forgot-email" placeholder="tu@email.com" required></div>'
      +     '<button class="btn-modal-submit" type="submit">Enviar instrucciones</button>'
      +   '</form>'
      +   '<div id="modal-forgot-success" style="display:none;text-align:center;padding:16px 0">'
      +     '<div style="font-size:1.8rem;margin-bottom:8px">📬</div>'
      +     '<div style="font-size:0.9rem;font-weight:600;color:var(--text);margin-bottom:6px">Revisá tu bandeja</div>'
      +     '<div style="font-size:0.78rem;color:var(--muted);font-weight:300">Si el email está registrado, recibirás las instrucciones para recuperar tu contraseña.</div>'
      +   '</div>'
      +   '<div class="modal-divider"><a data-tab="login">← Volver al inicio de sesión</a></div>'
      + '</div>';
    ov.classList.add('open');
    switchTab(tab || 'login');

    box.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    box.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.getAttribute('data-tab')); }); });
    var forgot = box.querySelector('[data-action="forgot"]');
    if (forgot) forgot.addEventListener('click', function () {
      box.querySelector('#modal-pane-login').style.display = 'none';
      box.querySelector('#modal-pane-register').style.display = 'none';
      box.querySelector('#modal-pane-forgot').style.display = '';
      box.querySelectorAll('.modal-tab').forEach(function (t) { t.style.display = 'none'; });
    });
    var forgotForm = box.querySelector('#modal-forgot-form');
    if (forgotForm) forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      forgotForm.style.display = 'none';
      box.querySelector('#modal-forgot-success').style.display = '';
    });
    // Google Sign-In buttons
    var gLogin = box.querySelector('#btn-google-login');
    var gRegister = box.querySelector('#btn-google-register');
    function triggerGoogle() {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        // Use FedCM-compatible prompt — no deprecated notification callbacks
        google.accounts.id.prompt();
      } else {
        if (DH.UI && DH.UI.toast) DH.UI.toast('Google Sign-In no disponible. Recargá la página.', 'error');
      }
    }
    if (gLogin) gLogin.addEventListener('click', triggerGoogle);
    if (gRegister) gRegister.addEventListener('click', triggerGoogle);

    box.querySelector('#form-login').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var id = (fd.get('email') || '').toString().trim();
      var pw = (fd.get('password') || '').toString();
      if (id.length < 3) { alert('Ingresá un usuario o email válido (mínimo 3 caracteres).'); return; }
      if (pw.length < 4) { alert('La contraseña debe tener al menos 4 caracteres.'); return; }
      var username = id.indexOf('@') !== -1 ? id.split('@')[0] : id;
      var submitBtn = e.target.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      DH.Store.login(username, pw).then(function (u) {
        closeModal(); renderNav();
        DH.Router.go('/profile/' + u.user);
      }).catch(function (err) {
        if (submitBtn) submitBtn.disabled = false;
        var errEl = e.target.querySelector('.modal-error');
        if (!errEl) {
          errEl = document.createElement('p');
          errEl.className = 'modal-error';
          errEl.style.cssText = 'color:#ff4d4d;font-size:0.85rem;margin:0.5rem 0 0';
          e.target.appendChild(errEl);
        }
        errEl.textContent = (err && err.message) || 'Usuario o contraseña incorrectos';
      });
    });
    // Avatar picker: galería de 24 seeds curadas, default a uno random para que arranque elegido.
    var picker = box.querySelector('#avatar-picker');
    var hidden = box.querySelector('#avatar-selected');
    var seeds = DH.AVATAR_SEEDS || [];
    var initialSeed = seeds[Math.floor(Math.random() * seeds.length)];
    hidden.value = initialSeed;
    seeds.forEach(function (seed) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (seed === initialSeed ? ' selected' : '');
      btn.setAttribute('data-seed', seed);
      btn.title = seed;
      btn.innerHTML = '<img src="' + DH.avatarUrl(seed) + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () {
        picker.querySelectorAll('.avatar-option').forEach(function (x) { x.classList.remove('selected'); });
        btn.classList.add('selected');
        hidden.value = seed;
      });
      picker.appendChild(btn);
    });

    box.querySelector('#form-register').addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = e.target.querySelector('[type="submit"]');
      if (submitBtn && submitBtn.disabled) return; // guard: prevent double submit
      var fd = new FormData(e.target);
      var username    = (fd.get('username') || '').toString().trim();
      var email       = (fd.get('email')    || '').toString().trim();
      var pw          = (fd.get('password') || '').toString();
      var avatarSeed  = (fd.get('avatar')   || '').toString();
      if (username.length < 3) { alert('El usuario debe tener al menos 3 caracteres.'); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) { alert('El usuario solo puede tener letras, números y guión bajo.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Ingresá un email válido.'); return; }
      if (pw.length < 8) { alert('La contraseña debe tener al menos 8 caracteres.'); return; }
      if (submitBtn) submitBtn.disabled = true;
      DH.Store.login(username, pw, username, email, avatarSeed).then(function (u) {
        closeModal();
        renderNav();
        showWelcome(u);
      }).catch(function (err) {
        if (submitBtn) submitBtn.disabled = false;
        var errEl = e.target.querySelector('.modal-error');
        if (!errEl) {
          errEl = document.createElement('p');
          errEl.className = 'modal-error';
          errEl.style.cssText = 'color:#ff4d4d;font-size:0.85rem;margin:0.5rem 0 0';
          e.target.appendChild(errEl);
        }
        errEl.textContent = (err && err.message) || 'Error al crear la cuenta';
      });
    });
  }
  function showWelcome(u) {
    var ov = document.createElement('div');
    ov.id = 'welcome-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML = ''
      + '<div class="welcome-box">'
      +   '<div class="welcome-logo"><svg width="52" height="52" viewBox="0 0 40 40" fill="none" stroke="var(--accent)" stroke-width="1.8"><circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="8"/><circle cx="20" cy="20" r="2.5" fill="var(--accent)" stroke="none"/></svg></div>'
      +   '<div class="welcome-title">¡Bienvenido, <em>' + DH.UI.escape(u.user) + '</em>!</div>'
      +   '<div class="welcome-sub">Tu cuenta está lista. ¿Por dónde querés empezar?</div>'
      +   '<div class="welcome-steps">'
      +     '<button class="welcome-step" id="wc-explore"><div class="wc-icon"><svg width="20" height="20" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="7"/><circle cx="20" cy="20" r="2.5" fill="currentColor" stroke="none"/></svg></div><div><div class="wc-label">Explorar grooves</div><div class="wc-hint">Buscá patrones por género o BPM</div></div></button>'
      +     '<button class="welcome-step" id="wc-upload"><div class="wc-icon"><svg width="20" height="20" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="9" width="7" height="7" rx="1"/><rect x="16" y="9" width="7" height="7" rx="1"/><rect x="26" y="9" width="7" height="7" rx="1"/><rect x="6" y="22" width="7" height="7" rx="1" fill="currentColor" stroke="none"/><rect x="16" y="22" width="7" height="7" rx="1"/><rect x="26" y="22" width="7" height="7" rx="1" fill="currentColor" stroke="none"/></svg></div><div><div class="wc-label">Subir mi primer groove</div><div class="wc-hint">Compartí un patrón con la comunidad</div></div></button>'
      +     '<button class="welcome-step" id="wc-profile"><div class="wc-icon"><svg width="20" height="20" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="20" cy="11" rx="12" ry="2.5"/><rect x="8" y="11" width="24" height="18" rx="1"/><ellipse cx="20" cy="29" rx="12" ry="2.5"/><line x1="8" y1="20" x2="32" y2="20"/></svg></div><div><div class="wc-label">Completar mi perfil</div><div class="wc-hint">Agregá tu bio y elegí tu avatar</div></div></button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(ov);
    function closeWelcome() { ov.remove(); }
    document.getElementById('wc-explore').addEventListener('click', function() { closeWelcome(); DH.Router.go('/search'); });
    document.getElementById('wc-upload').addEventListener('click', function() { closeWelcome(); DH.Router.go('/upload'); });
    document.getElementById('wc-profile').addEventListener('click', function() { closeWelcome(); DH.Router.go('/settings'); });
    ov.addEventListener('click', function(e) { if (e.target === ov) closeWelcome(); });
  }
  function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

  // Modal independiente para cambiar el avatar después de creada la cuenta
  function openAvatarPicker(onPick) {
    var ov = document.getElementById('modal-overlay');
    var box = document.getElementById('modal-box');
    var u = DH.Store.getUser(); if (!u) return;
    var current = u.avatar || u.user;
    box.innerHTML = ''
      + '<button class="modal-close" data-close-avatar="1">✕</button>'
      + '<div class="modal-title">Cambiá tu <em style="color:var(--accent);font-style:normal;">avatar</em></div>'
      + '<div class="modal-sub">Elegí uno de la galería. El cambio es inmediato.</div>'
      + '<div class="avatar-picker" id="avatar-picker-modal"></div>'
      + '<button class="btn-modal-submit" id="avatar-confirm" style="margin-top:14px;">Guardar avatar</button>';
    ov.classList.add('open');

    var picker = box.querySelector('#avatar-picker-modal');
    var selected = current;
    (DH.AVATAR_SEEDS || []).forEach(function (seed) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (seed === current ? ' selected' : '');
      btn.title = seed;
      btn.innerHTML = '<img src="' + DH.avatarUrl(seed) + '" alt="" loading="lazy">';
      btn.addEventListener('click', function () {
        picker.querySelectorAll('.avatar-option').forEach(function (x) { x.classList.remove('selected'); });
        btn.classList.add('selected');
        selected = seed;
      });
      picker.appendChild(btn);
    });

    box.querySelector('[data-close-avatar]').addEventListener('click', closeModal);
    box.querySelector('#avatar-confirm').addEventListener('click', function () {
      DH.Store.updateAvatar(selected);
      closeModal();
      renderNav();
      if (onPick) onPick(selected);
    });
  }
  function switchTab(tab) {
    var box = document.getElementById('modal-box');
    var forgotPane = box.querySelector('#modal-pane-forgot');
    if (forgotPane) forgotPane.style.display = 'none';
    box.querySelectorAll('.modal-tab').forEach(function (t) { t.style.display = ''; t.classList.toggle('active', t.getAttribute('data-tab') === tab); });
    box.querySelector('#modal-pane-login').style.display = tab === 'login' ? '' : 'none';
    box.querySelector('#modal-pane-register').style.display = tab === 'register' ? '' : 'none';
  }

  // ── MINI GRID (3-row visualization for cards) ──
  function miniGrid(pattern, extraClass) {
    var html = '<div class="mini-grid ' + (extraClass || '') + '">';
    var rows = [
      { id: 'hihat', cls: '' },
      { id: 'snare', cls: ' s' },
      { id: 'kick',  cls: ' k' }
    ];
    rows.forEach(function (r) {
      var arr = (pattern && pattern[r.id]) || new Array(16).fill(0);
      for (var i = 0; i < 16; i++) html += '<div class="mc' + (arr[i] ? ' on' + r.cls : '') + '"></div>';
    });
    html += '</div>';
    return html;
  }

  function grooveCard(g) {
    var el = document.createElement('div');
    el.className = 'gcard';
    el.innerHTML = ''
      + '<button class="gc-compare" title="Comparar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg></button>'
      + '<div class="gc-genre">' + escape(g.genre) + '</div>'
      + '<div class="gc-title">' + escape(g.title) + '</div>'
      + '<div class="gc-author">por <span>' + escape(g.author) + '</span></div>'
      + miniGrid(g.pattern, 'gc-mini')
      + '<div class="gc-footer">'
      +   '<div class="gc-tags"><span class="gc-tag">' + g.bpm + ' BPM</span><span class="gc-tag">' + escape(g.level) + '</span></div>'
      +   '<div class="gc-right">'
      +     '<div class="gc-likes"><em>♥</em> ' + g.likes + '</div>'
      +     '<button class="btn-play-sm" data-play="1" title="Preview"><svg class="ico-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="ico-stop" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="5" y="5" width="14" height="14" rx="1"/></svg></button>'
      +   '</div>'
      + '</div>';

    var cmpBtn = el.querySelector('.gc-compare');
    function refreshCmpVisual() { cmpBtn.classList.toggle('selected', DH.Compare && DH.Compare.isSelected(g.id)); }
    refreshCmpVisual();
    cmpBtn.addEventListener('click', function (e) { e.stopPropagation(); if (DH.Compare) { DH.Compare.toggle(g); refreshCmpVisual(); } });
    if (DH.Compare) DH.Compare.subscribe(refreshCmpVisual, el);

    var playBtn = el.querySelector('.btn-play-sm');
    var icoPlay = playBtn.querySelector('.ico-play');
    var icoStop = playBtn.querySelector('.ico-stop');
    var token = null;
    function setPlaying(on) {
      playBtn.classList.toggle('playing', on);
      el.classList.toggle('previewing', on);
      icoPlay.style.display = on ? 'none' : '';
      icoStop.style.display = on ? '' : 'none';
    }
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();  // no navegar al groove
      if (token && DH.PreviewPlayer.isPlaying(token)) {
        DH.PreviewPlayer.stop();
        setPlaying(false);
        token = null;
        return;
      }
      setPlaying(true);
      token = DH.PreviewPlayer.play(g.pattern, g.bpm, function () { setPlaying(false); token = null; }, g.kit, g.timeSig);
    });
    el.addEventListener('click', function () { DH.Router.go('/groove/' + g.slug); });
    return el;
  }

  // ── Hero animated background ──
  // Hero animated cells. Registra el interval globalmente para que el router lo cancele al navegar.
  var _activeHeroIntervals = [];
  function stopAllHeroIntervals() {
    _activeHeroIntervals.forEach(function (iv) { clearInterval(iv); });
    _activeHeroIntervals = [];
  }
  function heroBg(host) {
    var HCOLS = 16, HROWS = 7;
    var hPattern = [
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      [0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];
    var hColors = ['lit', 'lit', 'lit2', 'lit', '', 'lit2', ''];
    var cells = [];
    for (var r = 0; r < HROWS; r++) for (var c = 0; c < HCOLS; c++) {
      var el = document.createElement('div');
      el.className = 'hero-cell' + (hPattern[r][c] ? ' ' + hColors[r] : '');
      host.appendChild(el);
      cells.push({ el: el, row: r, col: c, on: !!hPattern[r][c] });
    }
    var step = 0;
    var iv = setInterval(function () {
      cells.forEach(function (c) { if (c.col === step && c.on) { c.el.style.opacity = '0.7'; setTimeout(function () { c.el.style.opacity = ''; }, 120); } });
      step = (step + 1) % HCOLS;
    }, 120);
    _activeHeroIntervals.push(iv);
    return iv;
  }

  return {
    escape: escape, avatarColor: avatarColor, drummerOrFallback: drummerOrFallback,
    drummerAvatar: drummerAvatar,
    renderNav: renderNav, updateNav: updateNav, renderFooter: renderFooter,
    openModal: openModal, closeModal: closeModal,
    miniGrid: miniGrid, grooveCard: grooveCard,
    heroBg: heroBg, stopAllHeroIntervals: stopAllHeroIntervals,
    openAvatarPicker: openAvatarPicker,
    toast: toast
  };

  function toast(message, type, action) {
    var existing = document.getElementById('dh-toast');
    if (existing) existing.remove();

    var colors = {
      success: { bg: '#22c55e', color: '#000' },
      error:   { bg: '#ef4444', color: '#fff' },
      info:    { bg: '#3b82f6', color: '#fff' }
    };
    var c = colors[type] || colors.info;

    var el = document.createElement('div');
    el.id = 'dh-toast';
    el.style.cssText = [
      'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%) translateY(-80px)',
      'background:' + c.bg, 'color:' + c.color,
      'padding:14px 24px', 'border-radius:10px',
      'font-family:Barlow,sans-serif', 'font-size:0.95rem', 'font-weight:600',
      'display:flex', 'align-items:center', 'gap:12px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.35)',
      'z-index:99999', 'max-width:90vw',
      'transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
    ].join(';');

    var icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    el.innerHTML = '<span style="font-size:1.1rem">' + icon + '</span><span>' + message + '</span>';

    if (action) {
      var btn = document.createElement('a');
      btn.textContent = action.label;
      btn.href = '#' + action.href;
      btn.style.cssText = 'margin-left:8px;text-decoration:underline;cursor:pointer;white-space:nowrap;color:inherit;opacity:0.85';
      btn.addEventListener('click', function() { el.remove(); });
      el.appendChild(btn);
    }

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;opacity:0.7;margin-left:4px;padding:0 2px;line-height:1';
    closeBtn.addEventListener('click', function() { el.remove(); });
    el.appendChild(closeBtn);

    document.body.appendChild(el);
    // Animate in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { el.style.transform = 'translateX(-50%) translateY(0)'; });
    });
    // Auto-dismiss
    setTimeout(function() {
      if (el.parentNode) {
        el.style.transform = 'translateX(-50%) translateY(-80px)';
        setTimeout(function() { if (el.parentNode) el.remove(); }, 350);
      }
    }, type === 'error' ? 5000 : 3500);
  }
})();

// Global escape to close modal
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') DH.UI && DH.UI.closeModal && DH.UI.closeModal();
});
// Clicking outside the modal box no longer closes it — avoids accidental dismissal during login/register.
