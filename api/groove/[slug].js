'use strict';

const { esc, fetchJson, readIndex, patchHtml, SITE, BACKEND } = require('../_lib');

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) { res.status(400).end(); return; }

  const base = readIndex();
  if (!base) { res.status(503).end('index.html not found'); return; }

  let groove;
  try {
    const json = await fetchJson(`${BACKEND}/api/grooves/${encodeURIComponent(slug)}`);
    groove = json.data ?? json;
    if (!groove?.slug) throw new Error('empty groove');
  } catch (_) {
    // Backend unavailable — serve SPA shell with correct canonical so Google doesn't Soft 404
    const fallbackHtml = patchHtml(base, {
      title: `${decodeURIComponent(slug)} — DrumHub`,
      description: 'DrumHub — La biblioteca de grooves para bateristas.',
      canonical: `${SITE}/groove/${slug}`,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(fallbackHtml);
  }

  const canonical   = `${SITE}/groove/${groove.slug}`;
  const authorName  = groove.authorName || groove.authorUsername || '';
  const genreSlug   = groove.genreSlug  || groove.genre.toLowerCase().replace(/\s+/g, '-');
  const tags        = Array.isArray(groove.tags) ? groove.tags : [];

  const title = `${groove.title} · ${groove.genre} — DrumHub`;
  const desc  = [
    `Groove de ${groove.genre} a ${groove.bpm} BPM, nivel ${groove.level}.`,
    authorName && `Por ${authorName}.`,
    groove.description && groove.description.slice(0, 100),
    'DrumHub — La biblioteca de grooves para bateristas.',
  ].filter(Boolean).join(' ');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      name: groove.title,
      genre: groove.genre,
      url: canonical,
      description: desc,
      composer: { '@type': 'Person', name: authorName },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DrumHub',    item: SITE },
        { '@type': 'ListItem', position: 2, name: groove.genre, item: `${SITE}/genre/${genreSlug}` },
        { '@type': 'ListItem', position: 3, name: groove.title, item: canonical },
      ],
    },
  ];

  const appContent = `
<div class="page">
  <div style="max-width:900px;margin:0 auto;padding:2rem 1rem 4rem">
    <nav style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem">
      <a href="/" style="color:var(--muted)">DrumHub</a> ›
      <a href="/genre/${esc(genreSlug)}" style="color:var(--muted)">${esc(groove.genre)}</a>
    </nav>
    <h1 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,5vw,3rem);margin:0 0 .5rem;line-height:1">${esc(groove.title)}</h1>
    <p style="color:var(--muted);margin:.5rem 0 1.5rem">${esc(groove.genre)} · ${groove.bpm} BPM · ${esc(groove.level)}</p>
    ${groove.description ? `<p style="max-width:65ch;line-height:1.6;margin-bottom:1rem">${esc(groove.description)}</p>` : ''}
    ${tags.length ? `<p style="color:var(--muted);font-size:.85rem">Tags: ${tags.map(esc).join(', ')}</p>` : ''}
    <p style="color:var(--muted);font-size:.8rem;margin-top:1.5rem">Por <strong>${esc(authorName)}</strong></p>
  </div>
</div>`;

  const html = patchHtml(base, { title, description: desc, canonical, ogType: 'music.song', jsonLd, appContent });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(html);
};
