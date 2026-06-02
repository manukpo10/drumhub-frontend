window.DH = window.DH || {};

DH.Pricing = (function () {

  // ── USD base prices (kept for fallback and international display) ──
  var USD = {
    pro:    { monthly: 5,  annual: 48,  annualFull: 60  },
    studio: { monthly: 12, annual: 116, annualFull: 144 }
  };

  var _mep      = null;   // ARS per USD (MEP venta) — used as fallback
  var _isAR     = true;   // default: assume Argentina
  var _ready    = false;
  var _cbs      = [];

  // Backend-sourced ARS prices: keyed by plan id, matching PricingTier shape.
  // { pro: { monthlyArs: N, annualArs: N, annualFullArs: N }, studio: { ... } }
  var _backendArs = null;

  function onReady(fn) {
    if (_ready) { fn(); return; }
    _cbs.push(fn);
  }

  function _resolve() {
    if (!_ready) return;
    _cbs.forEach(function (fn) { try { fn(); } catch (e) {} });
    _cbs = [];
  }

  function load() {
    var plansOk = false, geoOk = false;

    function check() {
      if (plansOk && geoOk) { _ready = true; _resolve(); }
    }

    // Primary: backend GET /api/pricing/plans — provides both USD and live ARS.
    // Fallback: if it fails, fetch the MEP rate directly from dolarapi.com.
    DH.Api.getPlans()
      .then(function (plans) {
        if (!plans || !plans.length) throw new Error('empty plans');
        var map = {};
        plans.forEach(function (p) {
          if (p.pricing) map[p.id] = p.pricing;
        });
        _backendArs = map;
        // Also seed _mep from the backend if we can back-calculate it
        // (optional, only for the international ref line).
        var pro = map['pro'];
        if (pro && pro.monthlyArs && pro.monthly) {
          _mep = pro.monthlyArs / pro.monthly;
        }
      })
      .catch(function () {
        // Backend unavailable — fall back to fetching MEP directly.
        _backendArs = null;
        fetch('https://dolarapi.com/v1/dolares/bolsa')
          .then(function (r) { return r.json(); })
          .then(function (d) { _mep = d.venta || d.compra || null; })
          .catch(function () { _mep = null; });
      })
      .then(function () { plansOk = true; check(); });

    // Geo — fallback: assume AR if request fails
    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) { _isAR = d.country_code === 'AR'; })
      .catch(function () { _isAR = true; })
      .then(function () { geoOk = true; check(); });

    // Hard timeout: 5 s — proceed with whatever we have
    setTimeout(function () {
      if (!plansOk) { plansOk = true; check(); }
      if (!geoOk)   { geoOk   = true; check(); }
    }, 5000);
  }

  // Round ARS to nearest 100 for clean display (fallback path only)
  function toARS(usd) {
    return Math.round(usd * _mep / 100) * 100;
  }

  function fmtARS(n) {
    return '$ ' + n.toLocaleString('es-AR') + ' ARS';
  }

  function fmtUSD(n) {
    return 'USD ' + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  /**
   * Returns display data for a plan+period combination.
   * Uses backend ARS prices when available (ensures display == charged amount).
   * Falls back to local USD × MEP computation if the backend is unreachable.
   *
   * @param {'pro'|'studio'} plan
   * @param {'monthly'|'annual'} period
   * @returns {{ main: string, period: string, old: string|null, ref: string|null }}
   */
  function getCard(plan, period) {
    var uBase = period === 'annual' ? USD[plan].annual     : USD[plan].monthly;
    var uOld  = period === 'annual' ? USD[plan].annualFull : null;
    var suffix = period === 'annual' ? '/ año' : '/ mes';

    if (_isAR) {
      // Primary: use backend-provided ARS (same value the payment will charge)
      var bk = _backendArs && _backendArs[plan];
      if (bk) {
        var arsMain = period === 'annual' ? bk.annualArs    : bk.monthlyArs;
        var arsOld  = period === 'annual' ? bk.annualFullArs : null;
        return {
          main:   fmtARS(arsMain),
          period: suffix,
          old:    arsOld ? fmtARS(arsOld) : null,
          ref:    fmtUSD(uBase)
        };
      }
      // Fallback: USD × locally-fetched MEP rate
      if (_mep) {
        return {
          main:   fmtARS(toARS(uBase)),
          period: suffix,
          old:    uOld ? fmtARS(toARS(uOld)) : null,
          ref:    fmtUSD(uBase)
        };
      }
    }

    // International (or no rate at all): show USD, ARS as reference if rate available
    return {
      main:   fmtUSD(uBase),
      period: suffix,
      old:    uOld ? fmtUSD(uOld) : null,
      ref:    (_mep ? '≈ ' + fmtARS(toARS(uBase)) : null)
    };
  }

  return { load: load, onReady: onReady, getCard: getCard, USD: USD };
})();
