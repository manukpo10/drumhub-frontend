// Settings page
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.settings = function () {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Configuración');

  if (!DH.Store.isLoggedIn()) {
    app.innerHTML = '<div class="page"><div class="empty"><h4>Necesitás una cuenta</h4><p>Para acceder a la configuración tenés que estar logueado.</p><button class="btn-primary" id="s-login">Ingresar</button></div></div>';
    document.getElementById('s-login').addEventListener('click', function () { DH.UI.openModal('login'); });
    return;
  }

  var u = DH.Store.getUser();

  app.innerHTML = ''
    + '<div class="breadcrumb"><a data-go="/">Inicio</a><span>/</span><a data-go="/profile/' + esc(u.user) + '">Mi perfil</a><span>/</span>Configuración</div>'

    + '<div class="page-header-v2">'
    +   '<div class="page-title-v2">Configuración de <em>cuenta</em></div>'
    +   '<div class="page-sub-v2">Editá tu perfil, tu bio y la información de tu cuenta.</div>'
    + '</div>'

    + '<div class="main2">'
    +   '<div class="col-left">'

        // ── Profile section ──
    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="20" cy="11" rx="12" ry="2.5"/><rect x="8" y="11" width="24" height="18" rx="1"/><ellipse cx="20" cy="29" rx="12" ry="2.5"/><line x1="8" y1="20" x2="32" y2="20"/></svg></div>Perfil <em>público</em></div>'
    +       '<form id="settings-profile-form">'
    +         '<div class="field">'
    +           '<label>Nombre visible</label>'
    +           '<input type="text" name="name" id="s-name" value="' + esc(u.name || u.user) + '" placeholder="Tu nombre o apodo" maxlength="40">'
    +           '<div class="field-hint">Este es el nombre que ven otros bateristas.</div>'
    +         '</div>'
    +         '<div class="field">'
    +           '<label>Bio</label>'
    +           '<textarea name="bio" id="s-bio" maxlength="200" placeholder="Contá quién sos, qué estilo tocás, con quiénes...">' + esc(u.bio || '') + '</textarea>'
    +           '<div class="char-count" id="s-bio-count">' + (u.bio || '').length + ' / 200</div>'
    +         '</div>'
    +         '<div class="field">'
    +           '<label>Avatar</label>'
    +           '<div style="display:flex;align-items:center;gap:14px">'
    +             '<div id="s-avatar-preview">' + DH.UI.drummerAvatar(u, { size: 48 }) + '</div>'
    +             '<button type="button" class="btn-draft" id="s-change-avatar">Cambiar avatar</button>'
    +           '</div>'
    +         '</div>'
    +         '<button class="btn-publish" type="submit" id="s-save-profile">Guardar perfil →</button>'
    +       '</form>'
    +     '</div>'

        // ── Account section ──
    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8"/><circle cx="20" cy="20" r="2.5" fill="currentColor" stroke="none"/></svg></div>Cuenta</div>'
    +       '<div class="field">'
    +         '<label>Usuario</label>'
    +         '<input type="text" value="@' + esc(u.user) + '" disabled style="opacity:0.5;cursor:not-allowed">'
    +         '<div class="field-hint">El nombre de usuario no se puede cambiar por ahora.</div>'
    +       '</div>'
    +       '<div class="field">'
    +         '<label>Email</label>'
    +         '<input type="email" id="s-email" value="' + esc(u.email || '') + '" placeholder="tu@email.com">'
    +       '</div>'
    +       '<button class="btn-draft" type="button" id="s-save-email">Guardar email</button>'
    +     '</div>'

        // ── Password section ──
    +     '<div class="card-v2">'
    +       '<div class="card-title-v2"><div class="card-icon"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="20" cy="11" rx="13" ry="3"/><ellipse cx="20" cy="19" rx="10" ry="2.5"/><line x1="20" y1="22" x2="20" y2="36"/><line x1="13" y1="36" x2="27" y2="36"/></svg></div>Cambiar <em>contraseña</em></div>'
    +       '<form id="settings-pass-form">'
    +         '<div class="field"><label>Contraseña actual</label><input type="password" name="current" id="s-pass-current" placeholder="••••••••" required></div>'
    +         '<div class="field"><label>Nueva contraseña</label><input type="password" name="new1" id="s-pass-new1" placeholder="••••••••" required minlength="6"></div>'
    +         '<div class="field"><label>Repetir nueva contraseña</label><input type="password" name="new2" id="s-pass-new2" placeholder="••••••••" required minlength="6"></div>'
    +         '<div class="field-hint" id="s-pass-msg" style="color:var(--accent2);display:none"></div>'
    +         '<button class="btn-publish" type="submit">Cambiar contraseña →</button>'
    +       '</form>'
    +       '<p style="font-size:0.68rem;color:var(--muted);margin-top:12px;font-weight:300">La gestión real de contraseñas se activará cuando el backend esté listo.</p>'
    +     '</div>'

        // ── Danger zone ──
    +     '<div class="card-v2" style="border-color:rgba(255,77,0,0.3)">'
    +       '<div class="card-title-v2" style="color:var(--accent2)"><div class="card-icon" style="border-color:rgba(255,77,0,0.3);background:rgba(255,77,0,0.06)"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="var(--accent2)" stroke-width="1.8"><ellipse cx="20" cy="20" rx="16" ry="3" transform="rotate(-20 20 20)"/><circle cx="20" cy="20" r="3" fill="var(--accent2)" stroke="none"/><line x1="20" y1="4" x2="20" y2="11" stroke-width="2.2"/></svg></div>Zona de <em>peligro</em></div>'
    +       '<p style="font-size:0.78rem;color:var(--muted);margin-bottom:16px;font-weight:300">Estas acciones son permanentes y no se pueden deshacer.</p>'
    +       '<button class="btn-draft" type="button" id="s-logout-all" style="border-color:rgba(255,77,0,0.4);color:var(--accent2)">Cerrar todas las sesiones</button>'
    +     '</div>'

    +   '</div>'

    +   '<div class="sidebar-col">'
    +     '<div class="sidebar-card-v2">'
    +       '<div class="section-title-sm">Tu <em>perfil</em> actual</div>'
    +       '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:8px 0">'
    +         '<div id="s-sidebar-avatar">' + DH.UI.drummerAvatar(u, { size: 64 }) + '</div>'
    +         '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.3rem;letter-spacing:0.06em" id="s-sidebar-name">' + esc(u.name || u.user) + '</div>'
    +         '<div style="font-size:0.65rem;color:var(--muted);font-family:\'DM Mono\',monospace">@' + esc(u.user) + '</div>'
    +         '<div style="font-size:0.72rem;color:var(--muted);text-align:center;line-height:1.5;margin-top:4px" id="s-sidebar-bio">' + esc(u.bio || 'Sin bio todavía.') + '</div>'
    +       '</div>'
    +       '<button class="btn-draft" style="width:100%;margin-top:12px" data-go="/profile/' + esc(u.user) + '">Ver mi perfil</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  // ── Profile form ──
  var bioInput = document.getElementById('s-bio');
  var bioCount = document.getElementById('s-bio-count');
  bioInput.addEventListener('input', function () {
    bioCount.textContent = bioInput.value.length + ' / 200';
    document.getElementById('s-sidebar-bio').textContent = bioInput.value || 'Sin bio todavía.';
  });
  document.getElementById('s-name').addEventListener('input', function () {
    document.getElementById('s-sidebar-name').textContent = this.value || u.user;
  });

  document.getElementById('settings-profile-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('s-name').value.trim() || u.user;
    var bio  = document.getElementById('s-bio').value.trim();
    u.name = name;
    u.bio  = bio;
    try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (err) {}
    var btn = document.getElementById('s-save-profile');
    var orig = btn.textContent;
    btn.textContent = '✓ Guardado';
    btn.style.background = '#22c55e';
    btn.style.color = '#000';
    setTimeout(function () { btn.textContent = orig; btn.style.background = ''; btn.style.color = ''; }, 1800);
    if (DH.UI.renderNav) DH.UI.renderNav();
  });

  // ── Email save ──
  document.getElementById('s-save-email').addEventListener('click', function () {
    u.email = document.getElementById('s-email').value.trim();
    try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (err) {}
    var btn = this; var orig = btn.textContent;
    btn.textContent = '✓ Guardado';
    setTimeout(function () { btn.textContent = orig; }, 1800);
  });

  // ── Avatar change ──
  document.getElementById('s-change-avatar').addEventListener('click', function () {
    DH.UI.openAvatarPicker(function (seed) {
      u.avatar = seed;
      DH.Store.updateAvatar(seed);
      ['s-avatar-preview', 's-sidebar-avatar'].forEach(function (id) {
        document.getElementById(id).innerHTML = DH.UI.drummerAvatar(u, { size: id === 's-sidebar-avatar' ? 64 : 48 });
      });
      if (DH.UI.renderNav) DH.UI.renderNav();
    });
  });

  // ── Password form (stub — real backend later) ──
  document.getElementById('settings-pass-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var n1 = document.getElementById('s-pass-new1').value;
    var n2 = document.getElementById('s-pass-new2').value;
    var msg = document.getElementById('s-pass-msg');
    if (n1 !== n2) { msg.textContent = 'Las contraseñas no coinciden.'; msg.style.display = ''; return; }
    msg.style.display = 'none';
    var btn = e.target.querySelector('[type="submit"]');
    btn.textContent = '✓ Contraseña actualizada';
    btn.style.background = '#22c55e';
    btn.style.color = '#000';
    setTimeout(function () { btn.textContent = 'Cambiar contraseña →'; btn.style.background = ''; btn.style.color = ''; e.target.reset(); }, 2000);
  });

  // ── Logout all sessions ──
  document.getElementById('s-logout-all').addEventListener('click', function () {
    if (!confirm('¿Cerrar todas las sesiones? Vas a tener que volver a ingresar.')) return;
    DH.Store.logout();
    DH.UI.renderNav();
    DH.Router.go('/');
  });

  // ── Navigation ──
  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
