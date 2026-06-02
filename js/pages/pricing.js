// Pricing page — checkout flow and trial activation.
// Uses the same plan-card / plans-grid design as the home "Planes" section
// (defined in main.css) for visual consistency, with the real checkout + trial logic.
window.DH = window.DH || {};
DH.pages = DH.pages || {};

DH.pages.pricing = function () {
  var app = document.getElementById('app');
  var esc = DH.UI.escape;
  DH.Router.setTitle('Planes y Precios');

  var isLoggedIn = DH.Store.isLoggedIn();
  var u = isLoggedIn ? DH.Store.getUser() : null;
  var currentPlan = (u && u.plan) ? u.plan.toLowerCase() : 'free';

  // Feature lists mirror the home "Planes" section for consistency.
  var FEATURES = {
    free: [
      { text: 'Explorar y escuchar grooves ilimitado' },
      { text: 'Guardar hasta 20 favoritos' },
      { text: 'Subir hasta 5 grooves' },
      { text: 'Exportar JSON' },
      { text: 'Badge de perfil', excluded: true },
      { text: 'Exportar MIDI, PDF y MP3', excluded: true },
      { text: 'Estadísticas de grooves', excluded: true },
      { text: 'API pública', excluded: true }
    ],
    pro: [
      { text: 'Todo lo del plan Gratis' },
      { text: 'Grooves ilimitados' },
      { text: 'Favoritos ilimitados' },
      { text: 'Exportar MIDI, PDF y MP3' },
      { text: 'Estadísticas de tus grooves' },
      { text: 'Badge PRO en el perfil' },
      { text: 'API pública', excluded: true },
      { text: 'Grooves privados', excluded: true }
    ],
    studio: [
      { text: 'Todo lo del plan Pro' },
      { text: 'Acceso a API pública' },
      { text: 'Grooves privados' },
      { text: 'Soporte prioritario' },
      { text: 'Badge ESTUDIO en el perfil' },
      { text: 'Hasta 5 cuentas colaboradoras' }
    ]
  };

  function featuresHtml(list) {
    return list.map(function (f) {
      return '<li class="plan-feature' + (f.excluded ? ' excluded' : '') + '">' + esc(f.text) + '</li>';
    }).join('');
  }

  // Builds the action button(s) for a paid plan card, honoring the current plan state.
  function paidActions(plan, period, btnClass) {
    if (currentPlan === plan) {
      return '<button class="plan-btn" disabled style="opacity:0.5;cursor:not-allowed">Plan actual</button>';
    }
    var html = '<button class="plan-btn ' + btnClass + '" id="checkout-' + plan + '" '
      + 'data-plan="' + plan + '" data-period="' + period + '">Suscribirse</button>';
    // Trial only offered to free users, on the Pro card.
    if (plan === 'pro' && currentPlan === 'free') {
      html += '<button class="plan-btn" id="trial-pro" style="margin-top:8px">Probar 7 días gratis</button>';
    }
    return html;
  }

  function renderPage(period) {
    period = period || 'monthly';
    var annual = period === 'annual';
    var proCard = DH.Pricing.getCard('pro', period);
    var studioCard = DH.Pricing.getCard('studio', period);

    app.innerHTML = ''
      + '<div class="page">'
      + '<div class="page-header-v2">'
      +   '<div class="page-title-v2">Planes y <em>Precios</em></div>'
      +   '<div class="page-sub-v2">Elegí el plan que mejor se adapta a tu forma de crear.</div>'
      + '</div>'

      // Period toggle (same switch as home)
      + '<div class="plans-toggle-wrap">'
      +   '<span class="plans-period-label' + (!annual ? ' active' : '') + '">Mensual</span>'
      +   '<button class="plans-toggle' + (annual ? ' on' : '') + '" id="pricing-toggle" aria-pressed="' + annual + '">'
      +     '<span class="plans-toggle-thumb"></span>'
      +   '</button>'
      +   '<span class="plans-period-label' + (annual ? ' active' : '') + '">Anual</span>'
      +   '<span class="plans-save-badge visible">' + (annual ? 'Ahorrando 19%' : 'Ahorrás 19% pagando anual') + '</span>'
      + '</div>'

      + '<div class="plans-grid">'

      // FREE
      +   '<div class="plan-card free">'
      +     '<div class="plan-name">Gratis</div>'
      +     '<div class="plan-price-wrap">'
      +       '<div class="plan-price">$0</div>'
      +       '<div class="plan-period">para siempre</div>'
      +     '</div>'
      +     '<div class="plan-price-ref"></div>'
      +     '<div class="plan-desc">Para empezar a explorar y practicar.</div>'
      +     '<ul class="plan-features">' + featuresHtml(FEATURES.free) + '</ul>'
      +     (currentPlan === 'free'
            ? '<button class="plan-btn" disabled style="opacity:0.5;cursor:not-allowed">Plan actual</button>'
            : '<button class="plan-btn" data-go="/settings">Ver mi cuenta</button>'
          )
      +   '</div>'

      // PRO
      +   '<div class="plan-card pro">'
      +     '<div class="plan-popular">Más popular</div>'
      +     '<div class="plan-name">Pro</div>'
      +     '<div class="plan-price-wrap">'
      +       '<div class="plan-price-old">' + (proCard.old || '') + '</div>'
      +       '<div class="plan-price">' + proCard.main + '</div>'
      +       '<div class="plan-period">' + proCard.period + '</div>'
      +     '</div>'
      +     '<div class="plan-price-ref">' + (proCard.ref || '') + '</div>'
      +     '<div class="plan-desc">Para bateristas que practican en serio.</div>'
      +     '<ul class="plan-features">' + featuresHtml(FEATURES.pro) + '</ul>'
      +     paidActions('pro', period, 'pro')
      +   '</div>'

      // STUDIO
      +   '<div class="plan-card studio">'
      +     '<div class="plan-name">Estudio</div>'
      +     '<div class="plan-price-wrap">'
      +       '<div class="plan-price-old">' + (studioCard.old || '') + '</div>'
      +       '<div class="plan-price">' + studioCard.main + '</div>'
      +       '<div class="plan-period">' + studioCard.period + '</div>'
      +     '</div>'
      +     '<div class="plan-price-ref">' + (studioCard.ref || '') + '</div>'
      +     '<div class="plan-desc">Para estudios, docentes y profesionales.</div>'
      +     '<ul class="plan-features">' + featuresHtml(FEATURES.studio) + '</ul>'
      +     paidActions('studio', period, 'studio')
      +   '</div>'

      + '</div>' // end plans-grid

      + '<div id="pricing-msg" style="text-align:center;min-height:24px;font-size:0.8rem;color:var(--accent2);margin-top:24px"></div>'
      + '</div>'; // end page

    wireEvents(period);
  }

  function wireEvents(period) {
    // Period toggle — re-render with the opposite period
    var toggle = document.getElementById('pricing-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        renderPage(period === 'annual' ? 'monthly' : 'annual');
      });
    }

    // Checkout buttons
    function handleCheckout(btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (!isLoggedIn) { DH.UI.openModal('login'); return; }
        var plan = btn.getAttribute('data-plan');
        var p = btn.getAttribute('data-period');
        var msg = document.getElementById('pricing-msg');
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
    handleCheckout(document.getElementById('checkout-pro'));
    handleCheckout(document.getElementById('checkout-studio'));

    // Trial button
    var trialBtn = document.getElementById('trial-pro');
    if (trialBtn) {
      trialBtn.addEventListener('click', function () {
        if (!isLoggedIn) { DH.UI.openModal('login'); return; }
        var msg = document.getElementById('pricing-msg');
        trialBtn.disabled = true;

        DH.Api.activateTrial().then(function () {
          if (u) {
            u.plan = 'pro';
            try { localStorage.setItem('dh.session', JSON.stringify(u)); } catch (e) {}
          }
          if (DH.UI.renderNav) DH.UI.renderNav();
          if (msg) msg.textContent = '';
          DH.UI.toast('Trial activado. Tenés 7 días de Pro gratis!', 'success');
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

  // Loading state while waiting for rates
  app.innerHTML = '<div class="page"><div class="empty"><p style="color:var(--muted)">Cargando precios...</p></div></div>';

  // Render once pricing data is ready, and kick off the load in case we landed
  // here directly (e.g. deep link or post-payment redirect) without visiting home first.
  DH.Pricing.onReady(function () { renderPage('monthly'); });
  DH.Pricing.load();
};
