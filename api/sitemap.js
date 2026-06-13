'use strict';

const { fetchJson, SITE, BACKEND } = require('./_lib');

const STATIC_URLS = [
  { loc: `${SITE}/`,           lastmod: '2026-06-13', changefreq: 'weekly',  priority: '1.0' },
  { loc: `${SITE}/search`,     lastmod: '2026-06-13', changefreq: 'daily',   priority: '0.9' },
  { loc: `${SITE}/genres`,     lastmod: '2026-06-13', changefreq: 'weekly',  priority: '0.8' },
  { loc: `${SITE}/drummers`,   lastmod: '2026-06-13', changefreq: 'weekly',  priority: '0.7' },
  { loc: `${SITE}/pricing`,    lastmod: '2026-06-13', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/page/about`, lastmod: '2026-06-13', changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE}/page/faq`,   lastmod: '2026-06-13', changefreq: 'monthly', priority: '0.5' },
];

function buildUrl({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod    ? `    <lastmod>${lastmod}</lastmod>`       : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority   ? `    <priority>${priority}</priority>`   : '',
    '  </url>',
  ].filter(Boolean).join('\n');
}

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  let grooveUrls = [];
  let genreUrls  = [];

  try {
    const [groovesJson, genresJson] = await Promise.all([
      fetchJson(`${BACKEND}/api/grooves?size=1000&sort=createdAt,desc`),
      fetchJson(`${BACKEND}/api/genres`),
    ]);

    const grooves = groovesJson?.data?.content ?? groovesJson?.content ?? [];
    grooveUrls = grooves
      .filter(g => g.slug)
      .map(g => buildUrl({
        loc:        `${SITE}/groove/${g.slug}`,
        lastmod:    g.updatedAt ? String(g.updatedAt).slice(0, 10) : today,
        changefreq: 'monthly',
        priority:   '0.7',
      }));

    const genres = Array.isArray(genresJson?.data) ? genresJson.data
      : Array.isArray(genresJson) ? genresJson
      : [];
    genreUrls = genres
      .filter(g => g.slug)
      .map(g => buildUrl({
        loc:        `${SITE}/genre/${g.slug}`,
        lastmod:    today,
        changefreq: 'weekly',
        priority:   '0.8',
      }));
  } catch (err) {
    // Serve static-only sitemap if the backend is unreachable
    console.error('[sitemap] backend unavailable:', err.message);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_URLS.map(buildUrl),
    ...genreUrls,
    ...grooveUrls,
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
