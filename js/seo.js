// Client-side SEO helpers — updates meta tags and JSON-LD on SPA navigation.
// Called by each page function so social shares and browser extensions see
// the correct data even after client-side routing.
window.DH = window.DH || {};

DH.Seo = (function () {
  var SITE = 'https://drumhub.io';

  function setMeta(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }

  function update(opts) {
    var title       = opts.title       || 'DrumHub — La biblioteca de grooves';
    var description = opts.description || 'DrumHub — La biblioteca de grooves para bateristas. Explorá, practicá y compartí patrones de batería organizados por género, tempo y dificultad.';
    var canonical   = opts.canonical   || SITE + '/';
    var ogType      = opts.ogType      || 'website';

    document.title = title;
    setMeta('meta[name="description"]',         'content', description);
    setMeta('link[rel="canonical"]',            'href',    canonical);
    setMeta('meta[property="og:title"]',        'content', title);
    setMeta('meta[property="og:description"]',  'content', description);
    setMeta('meta[property="og:url"]',          'content', canonical);
    setMeta('meta[property="og:type"]',         'content', ogType);
    setMeta('meta[name="twitter:title"]',       'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }

  // Replaces any previously injected dynamic JSON-LD blocks (data-dh-ld),
  // leaving the static Organization and WebSite blocks in place.
  function injectJsonLd(schemas) {
    document.querySelectorAll('script[data-dh-ld]').forEach(function (s) { s.remove(); });
    if (!Array.isArray(schemas)) schemas = [schemas];
    schemas.forEach(function (schema) {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-dh-ld', '1');
      s.textContent = JSON.stringify(schema);
      document.head.appendChild(s);
    });
  }

  return { update: update, injectJsonLd: injectJsonLd, SITE: SITE };
})();
