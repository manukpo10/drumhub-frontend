'use strict';

const { esc, fetchJson, readIndex, patchHtml, SITE, BACKEND } = require('./_lib');

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) { res.status(400).end(); return; }

  const base = readIndex();
  if (!base) { res.status(503).end('index.html not found'); return; }

  let genre;
  try {
    const json = await fetchJson(`${BACKEND}/api/genres/${encodeURIComponent(slug)}`);
    genre = json.data ?? json;
    if (!genre?.name) throw new Error('empty genre');
  } catch (_) {
    // Backend unavailable — serve SPA shell with correct canonical so Google doesn't Soft 404
    const fallbackHtml = patchHtml(base, {
      title: `Grooves de ${decodeURIComponent(slug)} — DrumHub`,
      description: 'DrumHub — La biblioteca de grooves para bateristas.',
      canonical: `${SITE}/genre/${slug}`,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(fallbackHtml);
  }

  const canonical = `${SITE}/genre/${genre.slug || slug}`;
  const bpmRange  = genre.bpmMin && genre.bpmMax ? ` entre ${genre.bpmMin}–${genre.bpmMax} BPM` : '';
  const levelHint = genre.level ? `, nivel ${genre.level}` : '';
  const count     = genre.grooveCount || 0;

  const title = `Grooves de ${genre.name} — DrumHub`;
  const desc  = genre.description
    ? genre.description.slice(0, 155)
    : `Explorá ${count > 0 ? count + ' grooves' : 'grooves'} de ${genre.name}${bpmRange}${levelHint}. Reproducí y practicá patrones de batería en DrumHub.`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Grooves de ${genre.name}`,
      url: canonical,
      description: desc,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DrumHub',  item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Géneros',  item: `${SITE}/genres` },
        { '@type': 'ListItem', position: 3, name: genre.name, item: canonical },
      ],
    },
  ];

  const appContent = `
<div class="page">
  <div style="max-width:900px;margin:0 auto;padding:2rem 1rem 4rem">
    <nav style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem">
      <a href="/" style="color:var(--muted)">DrumHub</a> ›
      <a href="/genres" style="color:var(--muted)">Géneros</a>
    </nav>
    <h1 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,3rem);margin:0 0 .5rem;line-height:1">
      ${genre.icon ? `${genre.icon} ` : ''}${esc(genre.name)}
    </h1>
    ${bpmRange ? `<p style="color:var(--muted);margin:.5rem 0">${genre.bpmMin}–${genre.bpmMax} BPM${levelHint}</p>` : ''}
    ${genre.description ? `<p style="max-width:65ch;line-height:1.6;margin:.75rem 0">${esc(genre.description)}</p>` : ''}
    ${count > 0 ? `<p style="color:var(--muted);font-size:.9rem">${count} grooves disponibles</p>` : ''}
  </div>
</div>`;

  const html = patchHtml(base, { title, description: desc, canonical, jsonLd, appContent });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=7200');
  res.status(200).send(html);
};
