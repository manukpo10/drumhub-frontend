// Pricing page — checkout flow and trial activation
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.pricing = function () {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Planes y Precios');

  var isLoggedIn = DH.Store.isLoggedIn();
  var u = isLoggedIn ? DH.Store.getUser() : null;
  var currentPlan = (u && u.plan) ? u.plan.toLowerCase() : 'free';

  function renderPage(period) {
    period = period || 'monthly';
    var proCard = DH.Pricing.getCard('pro', period);
    var studioCard = DH.Pricing.getCard('studio', period);

    app.innerHTML = ''
      + '<div class="page">'
      + '<div class="page-header-v2">'
      +   '<div class="page-title-v2">Planes y <em>Precios</em></div>'
      +   '<div class="page-sub-v2">Elegí el plan que mejor se adapta a tu forma de crear.</div>'
      + '</div>'

      // Period toggle
      + '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:28px">'
      +   '<button class="btn-draft' + (period === 'monthly' ? ' active' : '') + '" id="period-monthly">Mensual</button>'
      +   '<button class="btn-draft' + (period === 'annual' ? ' active' : '') + '" id="period-annual">Anual <span style="font-size:0.68rem;color:var(--accent);margin-left:4px">-20%</span></button>'
      + '</div>'

      // Plan cards
      + '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin-bottom:40px">'

      // FREE card
      + '<div class="card-v2" style="min-width:240px;max-width:300px;flex:1">'
      +   '<div class="card-title-v2">Free</div>'
      +   '<div style="font-size:1.8rem;font-family:\'Bebas Neue\',sans-serif;margin:12px 0">$ 0</div>'
      +   '<ul style="font-size:0.75rem;color:var(--muted);list-style:none;padding:0;margin:0 0 16px;line-height:2">'
      +     '<li>20 grooves</li>'
      +     '<li>5 favoritos</li>'
      +     '<li>Reproducción ilimitada</li>'
      +   '</ul>'
      +   (currentPlan === 'free'
          ? '<button class="btn-draft" disabled style="width:100%;opacity:0.5;cursor:not-allowed">Plan actual</button>'
          : '<button class="btn-draft" style="width:100%" data-go="/settings">Tu plan actual: ' + currentPlan.toUpperCase() + '</button>'
        )
      + '</div>'

      // PRO card
      + '<div class="card-v2" style="min-width:240px;max-width:300px;flex:1;border-color:var(--accent)">'
      +   '<div class="card-title-v2">Pro <span style="font-size:0.65rem;background:var(--accent);color:#000;padding:2px 8px;border-radius:2px;margin-left:8px">POPULAR</span></div>'
      +   '<div style="font-size:1.8rem;font-family:\'Bebas Neue\',sans-serif;margin:12px 0" id="price-pro">' + proCard.main + '</div>'
      +   '<div style="font-size:0.65rem;color:var(--muted);margin-bottom:12px">'
      +     proCard.period
      +     (proCard.ref ? ' &nbsp;·&nbsp; <span>' + proCard.ref + '</span>' : '')
      +   '</div>'
      +   '<ul style="font-size:0.75rem;color:var(--muted);list-style:none;padding:0;margin:0 0 16px;line-height:2">'
      +     '<li>Grooves ilimitados</li>'
      +     '<li>Favoritos ilimitados</li>'
      +     '<li>Exportación MIDI / PDF</li>'
      +     '<li>Badge PRO</li>'
      +   '</ul>'
      +   '<div style="display:flex;flex-direction:column;gap:8px">'
      +     (currentPlan === 'pro'
            ? '<button class="btn-draft" disabled style="width:100%;opacity:0.5;cursor:not-allowed">Plan actual</button>'
            : '<button class="btn-primary" id="checkout-pro" data-plan="pro" data-period="' + period + '" style="width:100%">Suscribirse</button>'
          )
      +     (currentPlan === 'free'
            ? '<button class="btn-draft" id="trial-pro" style="width:100%;font-size:0.72rem">Probar 7 días gratis</button>'
            : ''
          )
      +   '</div>'
      + '</div>'

      // STUDIO card
      + '<div class="card-v2" style="min-width:240px;max-width:300px;flex:1">'
      +   '<div class="card-title-v2">Studio</div>'
      +   '<div style="font-size:1.8rem;font-family:\'Bebas Neue\',sans-serif;margin:12px 0" id="price-studio">' + studioCard.main + '</div>'
      +   '<div style="font-size:0.65rem;color:var(--muted);margin-bottom:12px">'
      +     studioCard.period
      +     (studioCard.ref ? ' &nbsp;·&nbsp; <span>' + studioCard.ref + '</span>' : '')
      +   '</div>'
      +   '<ul style="font-size:0.75rem;color:var(--muted);list-style:none;padding:0;margin:0 0 16px;line-height:2">'
      +     '<li>Todo lo de Pro</li>'
      +     '<li>Exportación MP3</li>'
      +     '<li>Exportación PDF con partitura</li>'
      +     '<li>Hasta 5 colaboradores</li>'
      +     '<li>Badge STUDIO</li>'
      +   '</ul>'
      +   (currentPlan === 'studio'
          ? '<button class="btn-draft" disabled style="width:100%;opacity:0.5;cursor:not-allowed">Plan actual</button>'
          : '<button class="btn-draft" id="checkout-studio" data-plan="studio" data-period="' + period + '" style="width:100%">Suscribirse</button>'
        )
      + '</div>'

      + '</div>' // end cards

      + '<div id="pricing-msg" style="text-align:center;min-height:24px;font-size:0.8rem;color:var(--accent2)"></div>'

      + '</div>'; // end page

    // Period toggle
    var btnMonthly = document.getElementById('period-monthly');
    var btnAnnual  = document.getElementById('period-annual');
    if (btnMonthly) {
      btnMonthly.addEventListener('click', function () { renderPage('monthly'); });
    }
    if (btnAnnual) {
      btnAnnual.addEventListener('click', function () { renderPage('annual'); });
    }

    // Checkout buttons
    var checkoutPro    = document.getElementById('checkout-pro');
    var checkoutStudio = document.getElementById('checkout-studio');

    function handleCheckout(btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (!isLoggedIn) { DH.UI.openModal('login'); return; }
        var plan   = btn.getAttribute('data-plan');
        var p      = btn.getAttribute('data-period');
        var msg    = document.getElementById('pricing-msg');
        if (msg) msg.textContent = 'Redirigiendo a Mercado Pago...';
        btn.disabled = true;

        DH.Api.checkoutPlan(plan, p).then(function (data) {
          var url = data && data.checkoutUrl ? data.checkoutUrl : data;
          if (url) {
            window.location.href = url;
          } else {
            if (msg) msg.textContent = 'No se pudo iniciar el pago. Intentá de nuevo.';
            btn.disabled = false;
          }
        }).catch(function (err) {
          if (msg) msg.textContent = (err && err.message) || 'Error al iniciar el pago.';
          btn.disabled = false;
        });
      });
    }

    handleCheckout(checkoutPro);
    handleCheckout(checkoutStudio);

    // Trial button
    var trialBtn = document.getElementById('trial-pro');
    if (trialBtn) {
      trialBtn.addEventListener('click', function () {
        if (!isLoggedIn) { DH.UI.openModal('login'); return; }
        var msg = document.getElementById('pricing-msg');
        trialBtn.disabled = true;

        DH.Api.activateTrial().then(function (data) {
          // Update local session plan
          if (u) {
            u.plan = 'pro';
            try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (e) {}
          }
          if (DH.UI.renderNav) DH.UI.renderNav();
          if (msg) msg.textContent = '';
          DH.UI.toast('Trial activado. Tenés 7 dias de Pro gratis!', 'success');
          // Re-render page to reflect new plan
          currentPlan = 'pro';
          renderPage(period);
        }).catch(function (err) {
          trialBtn.disabled = false;
          var status = err && err.status;
          if (status === 409) {
            if (msg) msg.textContent = 'Ya tenés un plan o trial activo.';
          } else {
            if (msg) msg.textContent = (err && err.message) || 'Error al activar el trial.';
          }
        });
      });
    }

    // data-go navigation
    app.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        DH.Router.go(el.getAttribute('data-go'));
      });
    });
  }

  // Load pricing data then render
  DH.Pricing.onReady(function () { renderPage('monthly'); });

  // Show a loading state while waiting
  if (!app.innerHTML || app.innerHTML === '') {
    app.innerHTML = '<div class="page"><div class="empty"><p style="color:var(--muted)">Cargando precios...</p></div></div>';
  }
};
