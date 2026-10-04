// Verificador SEO: comprueba lo que de verdad sirve la web, no lo que creemos que sirve.
//
// Uso:
//   node scripts/verificar-seo.mjs --local                        (revisa dist/, sin red)
//   node scripts/verificar-seo.mjs https://spritedex.gg           (revisa lo publicado)
//   node scripts/verificar-seo.mjs https://spritedex.gg --todas   (las 569 URLs del sitemap)
//
// Comprueba: robots.txt, sitemap, y por cada pagina su estado, canonical autorreferente,
// titulo, h1 y hreflang. Ademas sigue los enlaces de pagina y las imagenes para cazar rotos.
// En modo --local no abre puertos: lee dist/ directamente y compara contra el dominio real,
// que es el que aparece en los canonical.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DOMINIO = 'https://spritedex.gg';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.ico': 'image/x-icon', '.otf': 'font/otf', '.mp3': 'audio/mpeg'
};

const argumentos = process.argv.slice(2);
const local = argumentos.includes('--local');
const todas = argumentos.includes('--todas');
const baseArg = argumentos.find((a) => a.startsWith('http'));
const base = local ? DOMINIO : (baseArg || '').replace(/\/$/, '');

const ESPECIALES = ['/', '/en', '/amigos', '/en/amigos', '/espiritus', '/en/espiritus',
  '/guia-espiritus', '/en/guia-espiritus', '/novedades', '/en/novedades',
  '/acerca', '/en/acerca', '/privacidad'];

// Rutas que sirve la SPA: su contenido (incluido el h1) lo pinta React en el navegador, asi que
// no se les puede exigir h1 en el HTML. El resto de la fase 1 y 2 si lo lleva escrito.
const RUTAS_APP = new Set(['/', '/en', '/amigos', '/en/amigos']);

const fallos = [];
let revisadas = 0;

function archivoLocal(ruta) {
  const limpia = ruta.split('?')[0].replace(/^\//, '');
  for (const candidato of [path.join(DIST, limpia), path.join(DIST, limpia, 'index.html'), path.join(DIST, limpia + '.html')]) {
    if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
  }
  return null;
}

async function pedir(ruta) {
  if (!local) {
    try {
      const respuesta = await fetch(base + ruta, { redirect: 'follow', headers: { 'user-agent': 'spritedex-verificador/1.0' } });
      return { estado: respuesta.status, tipo: respuesta.headers.get('content-type') || '', cuerpo: await respuesta.text() };
    } catch (error) {
      return { estado: 0, tipo: '', cuerpo: '', error: error.message };
    }
  }
  const archivo = archivoLocal(ruta);
  if (!archivo) return { estado: 404, tipo: '', cuerpo: '' };
  const tipo = MIME[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
  const esTexto = tipo.startsWith('text/') || /xml|json|javascript/.test(tipo);
  return { estado: 200, tipo, cuerpo: esTexto ? fs.readFileSync(archivo, 'utf8') : '' };
}

const dato = (html, patron) => {
  const m = html.match(patron);
  return m ? m[1] : null;
};

async function revisarPagina(ruta) {
  const r = await pedir(ruta);
  revisadas++;
  if (r.estado !== 200) { fallos.push(ruta + ': HTTP ' + (r.error || r.estado)); return { enlaces: [], imagenes: [] }; }
  if (!r.tipo.includes('text/html')) { fallos.push(ruta + ': content-type ' + r.tipo); return { enlaces: [], imagenes: [] }; }
  const html = r.cuerpo;
  const titulo = dato(html, /<title>([^<]*)<\/title>/);
  const h1 = (html.match(/<h1[ >]/g) || []).length;
  const canon = dato(html, /<link rel="canonical" href="([^"]+)"/);
  const hreflang = (html.match(/<link rel="alternate" hreflang=/g) || []).length;
  const esperado = base + (ruta === '/' ? '/' : ruta);
  if (!titulo) fallos.push(ruta + ': sin title');
  if (!RUTAS_APP.has(ruta) && h1 !== 1) fallos.push(ruta + ': ' + h1 + ' h1 (deberia ser 1)');
  if (!canon) fallos.push(ruta + ': sin canonical');
  else if (canon.replace(/\/$/, '') !== esperado.replace(/\/$/, '')) fallos.push(ruta + ': canonical ' + canon + ' (esperaba ' + esperado + ')');
  if (ruta !== '/privacidad' && hreflang !== 3) fallos.push(ruta + ': ' + hreflang + ' hreflang (deberian ser 3)');
  const enlaces = [...new Set([...html.matchAll(/href="(\/[^"#]*?)"/g)].map((m) => m[1]))]
    .filter((h) => !path.extname(h) && !h.includes('?'));
  const imagenes = [...new Set([...html.matchAll(/src="(\/[^"]+)"/g)].map((m) => m[1]))];
  return { enlaces, imagenes };
}

async function main() {
  if (local && !fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Falta dist/. Corre el build antes: pnpm build');
    process.exit(1);
  }
  if (!local && !baseArg) {
    console.error('Dime la base: node scripts/verificar-seo.mjs https://spritedex.gg (o --local)');
    process.exit(1);
  }

  const robots = await pedir('/robots.txt');
  if (robots.estado !== 200) fallos.push('robots.txt: HTTP ' + robots.estado);
  else if (!/Sitemap:/i.test(robots.cuerpo)) fallos.push('robots.txt: no declara el sitemap');

  const mapa = await pedir('/sitemap.xml');
  if (mapa.estado !== 200) fallos.push('sitemap.xml: HTTP ' + mapa.estado);
  const urls = [...mapa.cuerpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(DOMINIO, ''));
  if (urls.length < 10) fallos.push('sitemap.xml: solo ' + urls.length + ' URLs');
  console.log('sitemap: ' + urls.length + ' URLs | revisando ' + (local ? 'dist/ (local)' : base));

  const espiritus = urls.filter((u) => u.includes('/espiritu/'));
  const paso = Math.max(1, Math.floor(espiritus.length / 10));
  const muestra = todas ? espiritus : espiritus.filter((_, i) => i % paso === 0).slice(0, 10);
  const aRevisar = [...ESPECIALES, ...muestra];

  const enlaces = [];
  const imagenes = [];
  for (const ruta of aRevisar) {
    const r = await revisarPagina(ruta);
    enlaces.push(...r.enlaces);
    imagenes.push(...r.imagenes);
  }

  const visitadas = new Set(aRevisar);
  for (const destino of [...new Set(enlaces)].filter((h) => !visitadas.has(h))) {
    const r = await pedir(destino);
    if (r.estado !== 200) fallos.push('enlace roto: ' + destino + ' -> HTTP ' + (r.error || r.estado));
  }
  for (const imagen of [...new Set(imagenes)]) {
    const r = await pedir(imagen);
    if (r.estado !== 200) fallos.push('imagen rota: ' + imagen + ' -> HTTP ' + (r.error || r.estado));
  }

  console.log('paginas revisadas: ' + revisadas + ' | enlaces: ' + new Set(enlaces).size + ' | imagenes: ' + new Set(imagenes).size);

  if (fallos.length) {
    console.error('\nFALLO (' + fallos.length + ')');
    fallos.slice(0, 25).forEach((f) => console.error(' - ' + f));
    process.exit(1);
  }
  console.log('\nOK: sin fallos.');
}

main().catch((e) => { console.error('FALLO: ' + e.message); process.exit(1); });
