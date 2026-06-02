// Payment result pages — shown after MP redirects back to the app
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.paymentSuccess = function () {
  var app = document.getElementById('app');
  DH.Router.setTitle('Pago exitoso');

  app.innerHTML = ''
    + '<div class="page">'
    + '<div class="empty empty-v2" style="max-width:480px;margin:80px auto;text-align:center">'
    +   '<div style="font-size:3rem;margin-bottom:12px">✓</div>'
    +   '<div class="empty-title" style="color:var(--accent)">Pago <em>exitoso</em></div>'
    +   '<div class="empty-sub" style="margin:12px 0 24px" id="ps-sub">Tu suscripción fue activada. Ya podés usar todas las funciones de tu nuevo plan.</div>'
    +   '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    +     '<button class="btn-primary" id="ps-go-home">Ir al inicio</button>'
    +     '<button class="btn-draft" id="ps-go-settings">Ver mi plan</button>'
    +   '</div>'
    + '</div>'
    + '</div>';

  document.getElementById('ps-go-home').addEventListener('click', function () {
    DH.Router.go('/');
  });
  document.getElementById('ps-go-settings').addEventListener('click', function () {
    DH.Router.go('/settings');
  });

  // Refresh plan from API — the webhook may arrive a few seconds after the redirect.
  // Poll twice (at 3s and 8s) so the UI reflects the updated plan without requiring re-login.
  function refreshPlan() {
    if (!DH.Store.isLoggedIn()) return;
    DH.Api.getMe().then(function (userData) {
      if (!userData) return;
      var freshPlan = (userData.plan || 'free').toLowerCase();
      var session = DH.Store.getUser();
      if (session && session.plan !== freshPlan) {
        session.plan = freshPlan;
        try { localStorage.setItem('dh.session', JSON.stringify(session)); } catch (e) {}
        if (DH.UI && DH.UI.renderNav) DH.UI.renderNav();
        var sub = document.getElementById('ps-sub');
        if (sub) sub.textContent = 'Tu plan ' + freshPlan.toUpperCase() + ' fue activado. Ya podés usar todas las funciones.';
      }
    }).catch(function () {});
  }

  setTimeout(refreshPlan, 3000);
  setTimeout(refreshPlan, 8000);
};

DH.pages.paymentFailure = function () {
  var app = document.getElementById('app');
  DH.Router.setTitle('Pago no completado');

  app.innerHTML = ''
    + '<div class="page">'
    + '<div class="empty empty-v2" style="max-width:480px;margin:80px auto;text-align:center">'
    +   '<div style="font-size:3rem;margin-bottom:12px;color:var(--accent2)">✗</div>'
    +   '<div class="empty-title">Pago <em>no completado</em></div>'
    +   '<div class="empty-sub" style="margin:12px 0 24px">El pago no fue procesado. Podés intentarlo de nuevo o elegir otro método de pago.</div>'
    +   '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    +     '<button class="btn-primary" id="pf-retry">Intentar de nuevo</button>'
    +     '<button class="btn-draft" id="pf-go-home">Ir al inicio</button>'
    +   '</div>'
    + '</div>'
    + '</div>';

  document.getElementById('pf-retry').addEventListener('click', function () {
    DH.Router.go('/pricing');
  });
  document.getElementById('pf-go-home').addEventListener('click', function () {
    DH.Router.go('/');
  });
};

DH.pages.paymentPending = function () {
  var app = document.getElementById('app');
  DH.Router.setTitle('Pago pendiente');

  app.innerHTML = ''
    + '<div class="page">'
    + '<div class="empty empty-v2" style="max-width:480px;margin:80px auto;text-align:center">'
    +   '<div style="font-size:3rem;margin-bottom:12px;color:#f59e0b">⏳</div>'
    +   '<div class="empty-title">Pago <em>pendiente</em></div>'
    +   '<div class="empty-sub" style="margin:12px 0 24px">Tu pago está siendo procesado. Cuando se confirme, tu plan será activado automáticamente.</div>'
    +   '<button class="btn-primary" id="pp-go-home">Ir al inicio</button>'
    + '</div>'
    + '</div>';

  document.getElementById('pp-go-home').addEventListener('click', function () {
    DH.Router.go('/');
  });
};
