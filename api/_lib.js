'use strict';

const path = require('path');
const fs   = require('fs');

const SITE    = 'https://drumhub.io';
const BACKEND = 'https://drumhub-backend.onrender.com';

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function readIndex() {
  const candidates = [
    path.join(__dirname, '..', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, 'utf-8'); } catch (_) { /* try next */ }
  }
  return null;
}

/**
 * Patches index.html with per-page SEO data.
 * - Replaces title, description, canonical, og/twitter tags
 * - Strips existing JSON-LD blocks and injects the provided ones
 * - Injects pre-rendered HTML into <main id="app"> if appContent is given
 */
function patchHtml(base, { title, description, canonical, ogType = 'website', jsonLd = [], appContent = '' }) {
  let html = base;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(description)}"`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*"/,       `$1${canonical}"`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)}"`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(description)}"`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*"/,  `$1${canonical}"`);
  html = html.replace(/(<meta property="og:type" content=")[^"]*"/, `$1${ogType}"`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(title)}"`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(description)}"`);

  // Strip existing JSON-LD blocks, then inject new ones before </head>
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const ldBlocks = jsonLd
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n');
  html = html.replace('</head>', `${ldBlocks}\n</head>`);

  if (appContent) {
    html = html.replace('<main id="app"></main>', `<main id="app">${appContent}</main>`);
  }

  return html;
}

module.exports = { esc, fetchJson, readIndex, patchHtml, SITE, BACKEND };
