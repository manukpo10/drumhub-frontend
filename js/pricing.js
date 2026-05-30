window.DH = window.DH || {};

DH.Pricing = (function () {

  // ── USD base prices ──
  var USD = {
    pro:    { monthly: 5,  annual: 48,  annualFull: 60  },
    studio: { monthly: 12, annual: 116, annualFull: 144 }
  };

  var _mep      = null;   // ARS per USD (MEP venta)
  var _isAR     = true;   // default: assume Argentina
  var _ready    = false;
  var _cbs      = [];

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
    var mepOk = false, geoOk = false;

    function check() {
      if (mepOk && geoOk) { _ready = true; _resolve(); }
    }

    // MEP rate
    fetch('https://dolarapi.com/v1/dolares/bolsa')
      .then(function (r) { return r.json(); })
      .then(function (d) { _mep = d.venta || d.compra || null; })
      .catch(function () { _mep = null; })
      .then(function () { mepOk = true; check(); });

    // Geo — fallback: assume AR if request fails
    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) { _isAR = d.country_code === 'AR'; })
      .catch(function () { _isAR = true; })
      .then(function () { geoOk = true; check(); });

    // Hard timeout: 5 s — proceed with whatever we have
    setTimeout(function () {
      if (!mepOk) { mepOk = true; check(); }
      if (!geoOk) { geoOk = true; check(); }
    }, 5000);
  }

  // Round ARS to nearest 100 for clean display
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
   * @param {'pro'|'studio'} plan
   * @param {'monthly'|'annual'} period
   * @returns {{ main: string, period: string, old: string|null, ref: string|null }}
   */
  function getCard(plan, period) {
    var u    = period === 'annual' ? USD[plan].annual     : USD[plan].monthly;
    var uOld = period === 'annual' ? USD[plan].annualFull : null;
    var suffix = period === 'annual' ? '/ año' : '/ mes';

    if (_isAR && _mep) {
      return {
        main:   fmtARS(toARS(u)),
        period: suffix,
        old:    uOld ? fmtARS(toARS(uOld)) : null,
        ref:    fmtUSD(u)
      };
    }
    // International: show USD, ARS as reference if rate available
    return {
      main:   fmtUSD(u),
      period: suffix,
      old:    uOld ? fmtUSD(uOld) : null,
      ref:    (_mep ? '≈ ' + fmtARS(toARS(u)) : null)
    };
  }

  return { load: load, onReady: onReady, getCard: getCard, USD: USD };
})();
