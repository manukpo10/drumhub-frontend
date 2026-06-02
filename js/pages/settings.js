// Settings page
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.settings = function () {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Configuración');

  if (!DH.Store.isLoggedIn()) {
    app.innerHTML = ''
      + '<div class="page">'
      + '<div class="empty">'
      + '<h4>Necesitás una cuenta</h4>'
      + '<p>Para acceder a la configuración tenés que estar logueado.</p>'
      + '<button class="btn-primary" id="s-login">Ingresar</button>'
      + '</div></div>';
    document.getElementById('s-login').addEventListener('click', function () { DH.UI.openModal('login'); });
    return;
  }

  var u = DH.Store.getUser();

  // Plan display helpers
  var PLAN_META = {
    pro:    { label: 'PRO',    color: 'var(--accent)',  bg: 'rgba(232,255,0,0.08)',  border: 'rgba(232,255,0,0.3)'  },
    studio: { label: 'STUDIO', color: 'var(--accent2)', bg: 'rgba(255,77,0,0.08)',   border: 'rgba(255,77,0,0.3)'   },
    free:   { label: 'FREE',   color: 'var(--muted)',   bg: 'transparent',           border: 'var(--border2)'        }
  };
  var planMeta = PLAN_META[u.plan] || PLAN_META.free;

  // Stats from local grooves (quick, no API call needed for the render)
  var myGrooveCount = (DH.GROOVES || []).filter(function (g) { return g.author === u.user; }).length;
  var myLikes = (DH.GROOVES || []).filter(function (g) { return g.author === u.user; })
    .reduce(function (a, g) { return a + (g.likes || 0); }, 0);

  app.innerHTML = ''

    // ── Page header ──
    + '<div class="page-header-v2" style="padding-bottom:4px">'
    +   '<div class="section-eyebrow" style="margin-bottom:8px">/ Mi cuenta</div>'
    +   '<div class="page-title-v2">Configuración</div>'
    + '</div>'

    + '<div class="main2">'
    +   '<div class="col-left">'

        // ── [ 01 ] Perfil público ──
    +     '<div class="card-v2">'
    +       '<div class="section-eyebrow" style="margin-bottom:14px"><em>[ 01 ]</em> Perfil público</div>'
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

        // ── [ 02 ] Cuenta ──
    +     '<div class="card-v2">'
    +       '<div class="section-eyebrow" style="margin-bottom:14px"><em>[ 02 ]</em> Datos de cuenta</div>'
    +       '<div class="field">'
    +         '<label>Usuario</label>'
    +         '<input type="text" value="@' + esc(u.user) + '" disabled style="opacity:0.4;cursor:not-allowed">'
    +         '<div class="field-hint">El nombre de usuario no se puede cambiar por ahora.</div>'
    +       '</div>'
    +       '<div class="field">'
    +         '<label>Email</label>'
    +         '<input type="email" id="s-email" value="' + esc(u.email || '') + '" placeholder="tu@email.com">'
    +       '</div>'
    +       '<button class="btn-draft" type="button" id="s-save-email">Guardar email</button>'
    +     '</div>'

        // ── [ 03 ] Contraseña ──
    +     '<div class="card-v2">'
    +       '<div class="section-eyebrow" style="margin-bottom:14px"><em>[ 03 ]</em> Contraseña</div>'
    +       '<form id="settings-pass-form">'
    +         '<div class="field"><label>Contraseña actual</label><input type="password" name="current" id="s-pass-current" placeholder="••••••••" required></div>'
    +         '<div class="field"><label>Nueva contraseña</label><input type="password" name="new1" id="s-pass-new1" placeholder="••••••••" required minlength="6"></div>'
    +         '<div class="field"><label>Repetir nueva contraseña</label><input type="password" name="new2" id="s-pass-new2" placeholder="••••••••" required></div>'
    +         '<div class="field-hint" id="s-pass-msg" style="color:var(--accent2);display:none;margin-bottom:12px"></div>'
    +         '<button class="btn-publish" type="submit">Cambiar contraseña →</button>'
    +       '</form>'
    +     '</div>'

        // ── [ 04 ] Plan ──
    +     '<div class="card-v2">'
    +       '<div class="section-eyebrow" style="margin-bottom:14px"><em>[ 04 ]</em> Suscripción</div>'
    +       '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:20px;background:var(--surface2);border:1px solid var(--border);margin-bottom:16px">'
    +         '<div>'
    +           '<div style="font-family:\'DM Mono\',monospace;font-size:0.55rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Plan activo</div>'
    +           '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:2rem;letter-spacing:0.08em;color:' + planMeta.color + '">' + planMeta.label + '</div>'
    +         '</div>'
    +         '<div style="text-align:right">'
    +           (u.plan !== 'free'
              ? '<div style="font-family:\'DM Mono\',monospace;font-size:0.58rem;color:var(--muted);line-height:1.6">Exportación MIDI · PDF · MP3<br>Grooves ilimitados · Badge en perfil</div>'
              : '<div style="font-family:\'DM Mono\',monospace;font-size:0.58rem;color:var(--muted);line-height:1.6">Hasta 20 grooves · 5 favoritos<br>Reproducción ilimitada</div>'
            )
    +         '</div>'
    +       '</div>'
    +       '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +         '<button class="btn-primary" style="padding:10px 20px;font-size:0.65rem" data-go="/pricing">'
    +           (u.plan === 'free' ? 'Ver planes y precios →' : 'Gestionar suscripción →')
    +         '</button>'
    +       '</div>'
    +       '<p style="font-size:0.62rem;color:var(--muted2);margin-top:12px;font-weight:300;font-family:\'DM Mono\',monospace">Pro y Studio desbloquean exportación MIDI / PDF / MP3 y más.</p>'
    +     '</div>'

        // ── [ 05 ] Zona de peligro ──
    +     '<div class="card-v2" style="border-color:rgba(255,77,0,0.25)">'
    +       '<div class="section-eyebrow" style="margin-bottom:14px;color:var(--accent2)"><em style="color:var(--accent2)">[ 05 ]</em> Zona de peligro</div>'
    +       '<p style="font-size:0.75rem;color:var(--muted);margin-bottom:16px;font-weight:300;line-height:1.6">Estas acciones son permanentes y no se pueden deshacer.</p>'
    +       '<button class="btn-draft" type="button" id="s-logout-all" style="border-color:rgba(255,77,0,0.4);color:var(--accent2)">Cerrar todas las sesiones</button>'
    +     '</div>'

    +   '</div>' // end col-left

        // ── Sidebar ──
    +   '<div class="sidebar-col">'
    +     '<div class="sidebar-card-v2" style="text-align:center">'
    +       '<div style="font-family:\'DM Mono\',monospace;font-size:0.52rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:16px">Tu perfil</div>'
    +       '<div id="s-sidebar-avatar" style="display:flex;justify-content:center;margin-bottom:12px">' + DH.UI.drummerAvatar(u, { size: 72 }) + '</div>'
    +       '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.5rem;letter-spacing:0.06em;line-height:1" id="s-sidebar-name">' + esc(u.name || u.user) + '</div>'
    +       '<div style="font-family:\'DM Mono\',monospace;font-size:0.6rem;color:var(--muted);margin:4px 0 12px">@' + esc(u.user) + '</div>'
    +       '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:' + planMeta.bg + ';border:1px solid ' + planMeta.border + ';border-radius:2px;margin-bottom:16px">'
    +         '<span style="font-family:\'DM Mono\',monospace;font-size:0.52rem;letter-spacing:0.14em;text-transform:uppercase;color:' + planMeta.color + '">' + planMeta.label + '</span>'
    +       '</div>'
    +       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:16px">'
    +         '<div style="background:var(--surface2);padding:10px;text-align:center">'
    +           '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.4rem;color:var(--accent)" id="s-stat-grooves">' + myGrooveCount + '</div>'
    +           '<div style="font-family:\'DM Mono\',monospace;font-size:0.48rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)">Grooves</div>'
    +         '</div>'
    +         '<div style="background:var(--surface2);padding:10px;text-align:center">'
    +           '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.4rem;color:var(--accent)">' + myLikes + '</div>'
    +           '<div style="font-family:\'DM Mono\',monospace;font-size:0.48rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)">Likes</div>'
    +         '</div>'
    +       '</div>'
    +       '<div style="font-size:0.68rem;color:var(--muted);text-align:left;line-height:1.6;margin-bottom:16px" id="s-sidebar-bio">' + esc(u.bio || 'Sin bio todavía.') + '</div>'
    +       '<button class="btn-draft" style="width:100%" data-go="/profile/' + esc(u.user) + '">Ver mi perfil →</button>'
    +     '</div>'
    +   '</div>'

    + '</div>'; // end main2

  // ── Profile form ──
  var bioInput = document.getElementById('s-bio');
  var bioCount = document.getElementById('s-bio-count');
  bioInput.addEventListener('input', function () {
    bioCount.textContent = bioInput.value.length + ' / 200';
    var sidebarBio = document.getElementById('s-sidebar-bio');
    if (sidebarBio) sidebarBio.textContent = bioInput.value || 'Sin bio todavía.';
  });
  document.getElementById('s-name').addEventListener('input', function () {
    var el = document.getElementById('s-sidebar-name');
    if (el) el.textContent = this.value || u.user;
  });

  document.getElementById('settings-profile-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('s-name').value.trim() || u.user;
    var bio  = document.getElementById('s-bio').value.trim();
    u.name = name;
    u.bio  = bio;
    try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (err) {}
    DH.Api.updateProfile({ name: name, bio: bio }).catch(function () {});
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
    var newEmail = document.getElementById('s-email').value.trim();
    if (!newEmail) return;
    if (newEmail === (u.email || '')) { DH.UI.toast('Ese ya es tu email actual', 'info'); return; }
    var pwd = prompt('Ingresá tu contraseña actual para confirmar el cambio de email:');
    if (!pwd) return;
    var btn = this; var orig = btn.textContent;
    DH.Api.updateEmail({ email: newEmail, currentPassword: pwd }).then(function () {
      u.email = newEmail;
      try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (err) {}
      btn.textContent = '✓ Guardado';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    }).catch(function (err) {
      DH.UI.toast((err && err.message) || 'Error al guardar el email', 'error');
    });
  });

  // ── Avatar change ──
  document.getElementById('s-change-avatar').addEventListener('click', function () {
    DH.UI.openAvatarPicker(function () {
      setTimeout(function () { DH.pages.settings(); }, 50);
    });
  });

  // ── Password form ──
  document.getElementById('settings-pass-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var current = document.getElementById('s-pass-current').value;
    var n1 = document.getElementById('s-pass-new1').value;
    var n2 = document.getElementById('s-pass-new2').value;
    var msg = document.getElementById('s-pass-msg');
    if (n1 !== n2) { msg.textContent = 'Las contraseñas no coinciden.'; msg.style.display = ''; return; }
    msg.style.display = 'none';
    DH.Api.updatePassword({ currentPassword: current, newPassword: n1 }).then(function () {
      DH.UI.toast('Contraseña actualizada correctamente', 'success');
      e.target.reset();
    }).catch(function (err) {
      DH.UI.toast((err && err.message) || 'Error al cambiar la contraseña', 'error');
    });
  });

  // ── Logout all sessions ──
  document.getElementById('s-logout-all').addEventListener('click', function () {
    if (!confirm('¿Cerrar todas las sesiones? Vas a tener que volver a ingresar.')) return;
    DH.Store.logout();
    if (DH.UI.renderNav) DH.UI.renderNav();
    DH.Router.go('/');
  });

  // ── Navigation ──
  app.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); DH.Router.go(el.getAttribute('data-go')); });
  });
};
