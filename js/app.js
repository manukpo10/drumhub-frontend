// App bootstrap: render shell, wire routes, kick off the router.
(function () {
  // Restore last selected kit before any audio fires.
  try {
    var savedKit = localStorage.getItem('dh.selectedKit');
    if (savedKit) DH.Audio.setKit(savedKit);
  } catch (e) {}

  DH.UI.renderNav();
  DH.UI.renderFooter();

  DH.Router.add('/',                  function ()       { DH.pages.home(); });
  DH.Router.add('/groove/:slug',      function (p)      { DH.pages.groove(p); });
  DH.Router.add('/profile/:user',     function (p)      { DH.pages.profile(p); });
  DH.Router.add('/upload',            function ()       { DH.pages.editor(); });
  DH.Router.add('/groove/:slug/edit', function (p)      { DH.pages.editor(p); });
  DH.Router.add('/search',            function (p, q)   { DH.pages.search(p, q); });
  DH.Router.add('/genres',            function ()       { DH.pages.genres(); });
  DH.Router.add('/genre/:slug',       function (p, q)   { DH.pages.genre(p, q); });
  DH.Router.add('/drummers',          function (p, q)   { DH.pages.drummers(p, q); });
  DH.Router.add('/page/:slug',        function (p)      { DH.pages.staticPage(p); });

  DH.Router.start();

  // Hide splash once the first route has rendered.
  var splash = document.getElementById('splash');
  if (splash) {
    setTimeout(function () {
      splash.classList.add('hide');
      setTimeout(function () { splash.remove(); }, 500);
    }, 400);
  }

  // Demo banner — solo se muestra si nunca fue cerrado.
  try {
    if (!localStorage.getItem('dh.demoBannerDismissed')) {
      var banner = document.getElementById('demo-banner');
      if (banner) {
        setTimeout(function () { banner.style.display = 'flex'; banner.classList.add('show'); }, 1200);
        document.getElementById('demo-banner-close').addEventListener('click', function () {
          banner.classList.remove('show');
          setTimeout(function () { banner.style.display = 'none'; }, 300);
          try { localStorage.setItem('dh.demoBannerDismissed', '1'); } catch (e) {}
        });
      }
    }
  } catch (e) {}
})();
