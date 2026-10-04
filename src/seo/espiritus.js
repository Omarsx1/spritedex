// Paginas de espiritu: la ficha de cada uno con su contenido propio.
//
// Vive separado y sin dependencias (como rutas.js) porque lo usan el generador del build y
// las pruebas con Node. Aqui no hay datos: las funciones reciben la ficha ya resuelta y el
// idioma, y devuelven etiquetas, JSON-LD y HTML. La traduccion de los textos del juego la
// hace la app (pickTexto), no este modulo.
//
// Por que existe: los 278 espiritus solo vivian dentro de la SPA (el detalle se abria en un
// modal por estado, sin URL). Todo su contenido unico era invisible para un buscador.

import { SITIO, IMAGEN_REDES } from './rutas.js';

const RUTA_HUB = '/espiritus';

// El id del catalogo ya es unico y estable: solo hay que cambiar el guion bajo por guion, que
// es lo que piden las URLs. No se usa el nombre visible a proposito: si algun dia se corrige
// un nombre, las URLs no se rompen.
export function slugDeEspiritu(id) {
  return String(id || '').replace(/_/g, '-');
}

export function rutaEspiritu(id) {
  return '/espiritu/' + slugDeEspiritu(id);
}

export function rutaHubEspiritus() {
  return RUTA_HUB;
}

export function rutaConIdiomaEspiritu(ruta, lang) {
  // La raiz no lleva barra final: /en, no /en/ (que seria otra URL para el mismo contenido).
  const limpia = ruta === '/' ? '' : ruta;
  if (lang === 'en') return '/en' + limpia;
  return limpia || '/';
}

export function canonicalEspiritu(id, lang) {
  return SITIO + rutaConIdiomaEspiritu(rutaEspiritu(id), lang);
}

export function alternatesDeEspiritu(id) {
  return [
    { hreflang: 'es', href: canonicalEspiritu(id, 'es') },
    { hreflang: 'en', href: canonicalEspiritu(id, 'en') },
    { hreflang: 'x-default', href: canonicalEspiritu(id, 'es') }
  ];
}

function recortar(texto, maximo) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maximo) return limpio;
  // Los tres puntos cuentan dentro del limite: recortar a maximo - 1 y añadirlos daba uno de mas.
  const corte = limpio.slice(0, maximo - 3).replace(/[\s,;:.]+[^\s]*$/, '');
  return corte + '...';
}

// Un nombre con "</script>" dentro del JSON-LD cerraria la etiqueta antes de tiempo y romperia
// la pagina. En JSON, \u003c es el mismo caracter y el consumidor lo lee igual.
function jsonSeguro(datos) {
  return JSON.stringify(datos).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

const ZONA = { es: 'Espíritu de Fortnite', en: 'Fortnite Sprite' };

export function etiquetasEspiritu(ficha, lang) {
  const datos = ficha[lang];
  const completo = datos.nombre + ' — ' + ZONA[lang] + ' | Spritedex';
  const titulo = completo.length <= 60 ? completo : recortar(datos.nombre + ' — ' + ZONA[lang], 60);
  const descripcion = lang === 'en'
    ? recortar('Fortnite sprite ' + datos.nombre + ': ' + datos.familia + ' family, ' + datos.variante + ' variant, ' + ficha.rareza + ' rarity, ' + ficha.drop + ' drop chance. Where to find it and what it does.', 160)
    : recortar('Espíritu ' + datos.nombre + ' de Fortnite: familia ' + datos.familia + ', variante ' + datos.variante + ', rareza ' + ficha.rareza + ' y ' + ficha.drop + ' de probabilidad. Dónde aparece y qué hace.', 160);
  return {
    lang,
    titulo,
    descripcion,
    canonical: canonicalEspiritu(ficha.id, lang),
    alternates: alternatesDeEspiritu(ficha.id)
  };
}

export function etiquetasHubEspiritus(total, lang) {
  const titulo = lang === 'en'
    ? 'All Fortnite sprites — Spritedex'
    : 'Todos los espíritus de Fortnite — Spritedex';
  const descripcion = lang === 'en'
    ? recortar('Full list of the ' + total + ' Fortnite sprites by family and variant, with rarity, drop chance and a page for each one.', 160)
    : recortar('Lista completa de los ' + total + ' espíritus de Fortnite por familia y variante, con rareza, probabilidad de drop y su ficha.', 160);
  return {
    lang,
    titulo,
    descripcion,
    canonical: SITIO + rutaConIdiomaEspiritu(RUTA_HUB, lang),
    alternates: [
      { hreflang: 'es', href: SITIO + RUTA_HUB },
      { hreflang: 'en', href: SITIO + '/en' + RUTA_HUB },
      { hreflang: 'x-default', href: SITIO + RUTA_HUB }
    ]
  };
}

function propiedad(nombre, valor) {
  return { '@type': 'PropertyValue', name: nombre, value: valor };
}

export function jsonLdEspiritu(ficha, lang) {
  const etiquetas = etiquetasEspiritu(ficha, lang);
  const datos = ficha[lang];
  const enIngles = lang === 'en';
  const propiedades = [
    propiedad(enIngles ? 'Family' : 'Familia', datos.familia),
    propiedad(enIngles ? 'Variant' : 'Variante', datos.variante),
    propiedad(enIngles ? 'Rarity' : 'Rareza', ficha.rareza),
    propiedad(enIngles ? 'Generation' : 'Generación', String(ficha.generacion)),
    propiedad(enIngles ? 'Drop chance' : 'Probabilidad', ficha.drop)
  ];
  if (datos.costo) propiedades.push(propiedad(enIngles ? 'Summon cost' : 'Costo de invocación', datos.costo));
  if (datos.ubicacion) propiedades.push(propiedad(enIngles ? 'Location' : 'Ubicación', datos.ubicacion));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': etiquetas.canonical + '#webpage',
        url: etiquetas.canonical,
        name: etiquetas.titulo,
        description: etiquetas.descripcion,
        inLanguage: lang,
        isPartOf: { '@id': SITIO + '/#website' },
        mainEntity: {
          '@type': 'Product',
          name: datos.nombre,
          ...(ficha.thumb ? { image: SITIO + ficha.thumb } : {}),
          description: datos.habilidad || etiquetas.descripcion,
          category: enIngles ? 'Fortnite sprite' : 'Espíritu de Fortnite',
          additionalProperty: propiedades
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: enIngles ? 'Home' : 'Inicio', item: SITIO + (enIngles ? '/en' : '/') },
          { '@type': 'ListItem', position: 2, name: enIngles ? 'Sprites' : 'Espíritus', item: SITIO + rutaConIdiomaEspiritu(RUTA_HUB, lang) },
          { '@type': 'ListItem', position: 3, name: datos.nombre, item: etiquetas.canonical }
        ]
      }
    ]
  };
}

export function jsonLdHubEspiritus(fichas, lang) {
  const etiquetas = etiquetasHubEspiritus(fichas.length, lang);
  const enIngles = lang === 'en';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': etiquetas.canonical + '#webpage',
        url: etiquetas.canonical,
        name: etiquetas.titulo,
        description: etiquetas.descripcion,
        inLanguage: lang,
        isPartOf: { '@id': SITIO + '/#website' }
      },
      {
        '@type': 'ItemList',
        numberOfItems: fichas.length,
        itemListElement: fichas.map((f, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: f[lang].nombre,
          url: canonicalEspiritu(f.id, lang)
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: enIngles ? 'Home' : 'Inicio', item: SITIO + (enIngles ? '/en' : '/') },
          { '@type': 'ListItem', position: 2, name: enIngles ? 'Sprites' : 'Espíritus', item: etiquetas.canonical }
        ]
      }
    ]
  };
}

const escapar = (texto) => String(texto === undefined || texto === null ? '' : texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ETIQUETAS = {
  es: { rareza: 'Rareza', generacion: 'Generación', variante: 'Variante', familia: 'Familia', drop: 'Probabilidad (cofre de espíritu)', costo: 'Costo de invocación', ubicacion: 'Dónde aparece', lanzamiento: 'Lanzamiento', habilidad: 'Habilidad', perk: 'Extra exclusivo', otras: 'Otras variantes de', todos: 'Ver todos los espíritus', cta: 'Rastrea tu colección en Spritedex', inicio: 'Inicio', espiritus: 'Espíritus', aviso: 'Proyecto de fans sin relación con Epic Games.', privacidad: 'Privacidad', sinImagen: 'Todavía no tenemos imagen de este espíritu.' },
  en: { rareza: 'Rarity', generacion: 'Generation', variante: 'Variant', familia: 'Family', drop: 'Drop chance (sprite chest)', costo: 'Summon cost', ubicacion: 'Where to find it', lanzamiento: 'Release', habilidad: 'Ability', perk: 'Exclusive perk', otras: 'Other', todos: 'See all sprites', cta: 'Track your collection on Spritedex', inicio: 'Home', espiritus: 'Sprites', aviso: 'Fan project, not affiliated with Epic Games.', privacidad: 'Privacy', sinImagen: 'We do not have an image for this sprite yet.' }
};

const CSS = [
  ':root { color-scheme: dark; --fondo: #060714; --panel: #101324; --borde: rgba(0,240,232,.28); --acento: #00F0E8; --texto: #e8ecf8; --apagado: #9aa4bd; }',
  '* { box-sizing: border-box; }',
  'body { margin: 0; background: var(--fondo); color: var(--texto); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }',
  'a { color: var(--acento); }',
  '.envoltura { max-width: 880px; margin: 0 auto; padding: 20px 18px 56px; }',
  'header.marca { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0 18px; }',
  'header.marca a { font-weight: 800; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }',
  'nav.migas { font-size: 13px; color: var(--apagado); margin-bottom: 14px; }',
  'nav.migas ol { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; }',
  'nav.migas li + li::before { content: "›"; margin-right: 6px; color: var(--apagado); }',
  'h1 { font-size: clamp(26px, 5vw, 40px); line-height: 1.15; margin: 0 0 6px; }',
  '.lead { color: var(--apagado); margin: 0 0 20px; }',
  '.ficha { display: grid; gap: 24px; grid-template-columns: minmax(0, 320px) minmax(0, 1fr); align-items: start; }',
  '@media (max-width: 700px) { .ficha { grid-template-columns: 1fr; } }',
  '.arte { background: radial-gradient(circle at 50% 40%, rgba(0,240,232,.10), transparent 65%); border: 1px solid var(--borde); border-radius: 16px; padding: 12px; margin: 0; }',
  '.arte img { width: 100%; height: auto; display: block; }',
  'dl.datos { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 0; }',
  'dl.datos dt { color: var(--apagado); font-size: 14px; }',
  'dl.datos dd { margin: 0; font-weight: 600; }',
  'h2 { font-size: 20px; margin: 28px 0 8px; }',
  'ul.variantes { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 0; }',
  'ul.variantes a { border: 1px solid var(--borde); border-radius: 999px; padding: 6px 12px; text-decoration: none; font-size: 14px; }',
  'ul.variantes span { border: 1px solid rgba(255,255,255,.08); border-radius: 999px; padding: 6px 12px; font-size: 14px; color: var(--apagado); }',
  '.cta { margin: 30px 0 0; display: flex; flex-wrap: wrap; gap: 12px; }',
  '.cta a { border-radius: 10px; padding: 11px 18px; text-decoration: none; font-weight: 700; }',
  '.cta a.principal { background: var(--acento); color: #04121a; }',
  '.cta a.secundario { border: 1px solid var(--borde); }',
  'footer.pie { border-top: 1px solid rgba(255,255,255,.08); margin-top: 40px; padding-top: 16px; color: var(--apagado); font-size: 13px; }',
  'ul.indice { list-style: none; padding: 0; columns: 2; column-gap: 28px; }',
  '@media (max-width: 640px) { ul.indice { columns: 1; } }',
  'ul.indice li { break-inside: avoid; margin-bottom: 6px; }',
  'h3 { margin: 22px 0 8px; font-size: 17px; color: var(--apagado); text-transform: uppercase; letter-spacing: .08em; }'
].join('\n');

function headHtml(etiquetas, ogImage) {
  return [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<title>' + escapar(etiquetas.titulo) + '</title>',
    '<meta name="description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<link rel="canonical" href="' + etiquetas.canonical + '" />',
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    ...etiquetas.alternates.map((a) => '<link rel="alternate" hreflang="' + a.hreflang + '" href="' + a.href + '" />'),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Spritedex" />',
    '<meta property="og:url" content="' + etiquetas.canonical + '" />',
    '<meta property="og:title" content="' + escapar(etiquetas.titulo) + '" />',
    '<meta property="og:description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<meta property="og:image" content="' + (ogImage || IMAGEN_REDES) + '" />',
    '<meta property="og:locale" content="' + (etiquetas.lang === 'en' ? 'en_US' : 'es_MX') + '" />',
    '<meta property="og:locale:alternate" content="' + (etiquetas.lang === 'en' ? 'es_MX' : 'en_US') + '" />',
    '<meta name="twitter:card" content="summary" />',
    '<meta name="twitter:title" content="' + escapar(etiquetas.titulo) + '" />',
    '<meta name="twitter:description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<meta name="twitter:image" content="' + (ogImage || IMAGEN_REDES) + '" />',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '<style>' + CSS + '</style>'
  ].join('\n    ');
}

function migas(items) {
  return '<nav class="migas" aria-label="Ruta"><ol>' + items.map((i) => (
    i.href ? '<li><a href="' + i.href + '">' + escapar(i.nombre) + '</a></li>' : '<li>' + escapar(i.nombre) + '</li>'
  )).join('') + '</ol></nav>';
}

function pieDePagina(lang) {
  const t = ETIQUETAS[lang];
  const inicio = rutaConIdiomaEspiritu('/', lang);
  return '<footer class="pie"><p>' + escapar(t.aviso) + ' <a href="' + inicio + 'privacidad">' + escapar(t.privacidad) + '</a></p></footer>';
}

export function htmlPaginaEspiritu(ficha, lang) {
  const etiquetas = etiquetasEspiritu(ficha, lang);
  const t = ETIQUETAS[lang];
  const d = ficha[lang];
  const base = rutaConIdiomaEspiritu('/', lang);
  const hub = rutaConIdiomaEspiritu(RUTA_HUB, lang);
  const filas = [
    [t.rareza, ficha.rareza],
    [t.generacion, String(ficha.generacion)],
    [t.variante, d.variante],
    [t.familia, d.familia],
    [t.drop, ficha.drop],
    [t.costo, d.costo],
    [t.ubicacion, d.ubicacion],
    [t.lanzamiento, ficha.lanzamiento]
  ].filter(([, valor]) => valor);
  const hermanas = (ficha.hermanas || []).map((h) => (
    h.id === ficha.id
      ? '<li><span aria-current="page">' + escapar(h[lang].nombre) + '</span></li>'
      : '<li><a href="' + rutaConIdiomaEspiritu(rutaEspiritu(h.id), lang) + '">' + escapar(h[lang].nombre) + '</a></li>'
  )).join('');
  return [
    '<!doctype html>',
    '<html lang="' + lang + '">',
    '<head>',
    '    ' + headHtml(etiquetas, SITIO + ficha.thumb),
    '    <script type="application/ld+json">' + jsonSeguro(jsonLdEspiritu(ficha, lang)) + '</script>',
    '</head>',
    '<body>',
    '<div class="envoltura">',
    '<header class="marca"><a href="' + base + '">Spritedex</a><a href="' + hub + '">' + escapar(t.todos) + '</a></header>',
    migas([{ nombre: t.inicio, href: base }, { nombre: t.espiritus, href: hub }, { nombre: d.nombre }]),
    '<main>',
    '<h1>' + escapar(d.nombre) + '</h1>',
    '<p class="lead">' + escapar(ZONA[lang] + ' · ' + d.familia + ' · ' + d.variante) + '</p>',
    '<div class="ficha">',
    ficha.thumb
      ? '<figure class="arte"><img src="' + ficha.thumb + '" alt="' + escapar(d.nombre) + '" width="448" height="448" fetchpriority="high" decoding="async" /></figure>'
      : '<figure class="arte"><p class="lead">' + escapar(t.sinImagen) + '</p></figure>',
    '<div><dl class="datos">',
    filas.map(([clave, valor]) => '<dt>' + escapar(clave) + '</dt><dd>' + escapar(valor) + '</dd>').join(''),
    '</dl></div>',
    '</div>',
    d.habilidad ? '<h2>' + escapar(t.habilidad) + '</h2><p>' + escapar(d.habilidad) + '</p>' : '',
    d.perk ? '<h2>' + escapar(t.perk) + '</h2><p>' + escapar(d.perk) + '</p>' : '',
    '<h2>' + escapar(t.otras + ' ' + d.familia) + '</h2>',
    '<ul class="variantes">' + hermanas + '</ul>',
    '<p class="cta"><a class="principal" href="' + base + '?s=' + slugDeEspiritu(ficha.id) + '">' + escapar(t.cta) + '</a><a class="secundario" href="' + hub + '">' + escapar(t.todos) + '</a></p>',
    '</main>',
    pieDePagina(lang),
    '</div>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

export function htmlHubEspiritus(fichas, lang) {
  const etiquetas = etiquetasHubEspiritus(fichas.length, lang);
  const t = ETIQUETAS[lang];
  const base = rutaConIdiomaEspiritu('/', lang);
  const porFamilia = new Map();
  for (const f of fichas) {
    const clave = f[lang].familia;
    if (!porFamilia.has(clave)) porFamilia.set(clave, []);
    porFamilia.get(clave).push(f);
  }
  const bloques = [...porFamilia.entries()].map(([familia, lista]) => (
    '<h3>' + escapar(familia) + '</h3><ul class="indice">' + lista.map((f) => (
      '<li><a href="' + rutaConIdiomaEspiritu(rutaEspiritu(f.id), lang) + '">' + escapar(f[lang].nombre) + '</a></li>'
    )).join('') + '</ul>'
  )).join('');
  return [
    '<!doctype html>',
    '<html lang="' + lang + '">',
    '<head>',
    '    ' + headHtml(etiquetas),
    '    <script type="application/ld+json">' + jsonSeguro(jsonLdHubEspiritus(fichas, lang)) + '</script>',
    '</head>',
    '<body>',
    '<div class="envoltura">',
    '<header class="marca"><a href="' + base + '">Spritedex</a></header>',
    migas([{ nombre: t.inicio, href: base }, { nombre: t.espiritus }]),
    '<main>',
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    bloques,
    '<p class="cta"><a class="principal" href="' + base + '">' + escapar(t.cta) + '</a></p>',
    '</main>',
    pieDePagina(lang),
    '</div>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}
