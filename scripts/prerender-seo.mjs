// Prerender del <head> por ruta + sitemap, despues de "vite build".
//
// La app es una SPA y todas las URLs servian el mismo HTML: mismo titulo, misma descripcion y
// el canonical de la home. Con eso, /en se canonicalizaba a la raiz (lo que suprime el ingles
// y, segun Google, invalida todo el hreflang) y /amigos tampoco se indexaba. Este paso escribe
// un HTML por ruta con sus etiquetas y genera el sitemap desde la MISMA tabla, de modo que no
// puedan desincronizarse.
//
// No renderiza el cuerpo: la app sigue siendo SPA. Lo que se arregla aqui es el <head>, que es
// lo que el buscador lee antes de ejecutar nada.
import fs from 'node:fs';
import path from 'node:path';
import { RUTAS, SITIO, IMAGEN_REDES, canonicalDe, alternatesDe, etiquetasSeo, jsonLdDe } from '../src/seo/rutas.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

const LIMPIAR = [
  /<title>[\s\S]*?<\/title>\s*/g,
  /<meta name="description"[^>]*>\s*/g,
  /<link rel="canonical"[^>]*>\s*/g,
  /<meta name="robots"[^>]*>\s*/g,
  /<meta property="og:[^"]*"[^>]*>\s*/g,
  /<meta name="twitter:[^"]*"[^>]*>\s*/g,
  /<link rel="alternate"[^>]*>\s*/g,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g
];

const escapar = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function bloqueHead(entrada) {
  const { lang, titulo, descripcion, canonical, alternates } = etiquetasSeo(entrada);
  const jsonLd = jsonLdDe(entrada);
  const locale = lang === 'en' ? 'en_US' : 'es_MX';
  const lineas = [
    '<title>' + escapar(titulo) + '</title>',
    '<meta name="description" content="' + escapar(descripcion) + '" />',
    '<link rel="canonical" href="' + canonical + '" />',
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    ...alternates.map((a) => '<link rel="alternate" hreflang="' + a.hreflang + '" href="' + a.href + '" />'),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Spritedex" />',
    '<meta property="og:url" content="' + canonical + '" />',
    '<meta property="og:title" content="' + escapar(titulo) + '" />',
    '<meta property="og:description" content="' + escapar(descripcion) + '" />',
    '<meta property="og:image" content="' + IMAGEN_REDES + '" />',
    '<meta property="og:locale" content="' + locale + '" />',
    alternates.length ? '<meta property="og:locale:alternate" content="' + (lang === 'en' ? 'es_MX' : 'en_US') + '" />' : '',
    '<meta name="twitter:card" content="summary" />',
    '<meta name="twitter:title" content="' + escapar(titulo) + '" />',
    '<meta name="twitter:description" content="' + escapar(descripcion) + '" />',
    '<meta name="twitter:image" content="' + IMAGEN_REDES + '" />',
    jsonLd ? '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>' : ''
  ];
  return lineas.filter(Boolean).join('\n    ');
}

function sitemap() {
  const filas = [];
  for (const entrada of RUTAS) {
    const multilingue = entrada.idiomas.length > 1;
    for (const lang of entrada.idiomas) {
      const loc = canonicalDe(entrada.ruta, multilingue ? lang : entrada.idiomas[0]);
      const alternates = alternatesDe(entrada.ruta);
      filas.push([
        '  <url>',
        '    <loc>' + loc + '</loc>',
        ...alternates.map((a) => '    <xhtml:link rel="alternate" hreflang="' + a.hreflang + '" href="' + a.href + '" />'),
        '    <changefreq>' + entrada.frecuencia + '</changefreq>',
        '    <priority>' + entrada.prioridad.toFixed(1) + '</priority>',
        '  </url>'
      ].join('\n'));
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...filas,
    '</urlset>',
    ''
  ].join('\n');
}

function main() {
  const fuente = path.join(DIST, 'index.html');
  if (!fs.existsSync(fuente)) {
    console.error('Falta dist/index.html. Corre el build antes: pnpm build');
    process.exit(1);
  }

  // Se limpia UNA vez: si no, cada ruta acumularia las etiquetas de la anterior.
  let base = fs.readFileSync(fuente, 'utf8');
  for (const re of LIMPIAR) base = base.replace(re, '');

  const escritas = [];
  for (const entrada of RUTAS) {
    if (entrada.archivo) continue;
    for (const lang of entrada.idiomas) {
      const conIdioma = canonicalDe(entrada.ruta, lang).slice(SITIO.length);
      const destino = conIdioma === '/' ? fuente : path.join(DIST, conIdioma.slice(1), 'index.html');
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, base.replace('</head>', '    ' + bloqueHead({ ...entrada, lang }) + '\n  </head>'));
      escritas.push(conIdioma);
    }
  }

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap());
  console.log('SEO: HTML por ruta -> ' + escritas.join(', '));
  console.log('SEO: sitemap con ' + RUTAS.reduce((n, r) => n + r.idiomas.length, 0) + ' URLs (desde la tabla de rutas)');
}

main();
