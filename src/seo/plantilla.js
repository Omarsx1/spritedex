// Armazon de las paginas estaticas de contenido (fichas de espiritu, guia, acerca, novedades).
//
// Antes vivia dentro de espiritus.js; se extrajo al aparecer las paginas de contenido, para
// que la cabecera, las migas, el pie y los estilos sean los mismos en todas. Sin dependencias.

import { SITIO, IMAGEN_REDES } from './rutas.js';
import { conIdioma, IDIOMAS } from '../i18n/core.js';
import { NOMBRE_IDIOMA, lineasOgLocale, porIdioma } from './idioma.js';

export const ZONA = {
  es: 'Espíritu de Fortnite',
  en: 'Fortnite Sprite',
  'pt-BR': 'Espírito de Fortnite'
};

export const escapar = (texto) => String(texto === undefined || texto === null ? '' : texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Un nombre con "</script>" dentro del JSON-LD cerraria la etiqueta antes de tiempo y romperia
// la pagina. En JSON, \u003c es el mismo caracter y el consumidor lo lee igual.
export function jsonSeguro(datos) {
  return JSON.stringify(datos).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function recortar(texto, maximo) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maximo) return limpio;
  const corte = limpio.slice(0, maximo - 3).replace(/[\s,;:.]+[^\s]*$/, '');
  return corte + '...';
}

export const TEXTO = {
  es: {
    rareza: 'Rareza', generacion: 'Generación', variante: 'Variante', familia: 'Familia',
    drop: 'Probabilidad (cofre de espíritu)', costo: 'Costo de invocación', ubicacion: 'Dónde aparece',
    lanzamiento: 'Lanzamiento', habilidad: 'Habilidad', perk: 'Extra exclusivo',
    otras: 'Otras variantes de', todos: 'Ver todos los espíritus', guia: 'Guía de espíritus',
    cta: 'Rastrea tu colección en Spritedex', inicio: 'Inicio', espiritus: 'Espíritus',
    novedades: 'Novedades', acerca: 'Acerca de', aviso: 'Proyecto de fans sin relación con Epic Games.',
    privacidad: 'Privacidad', sinImagen: 'Todavía no tenemos imagen de este espíritu.',
    idioma: 'Idioma', ruta: 'Ruta de navegación', saltar: 'Saltar al contenido'
  },
  en: {
    rareza: 'Rarity', generacion: 'Generation', variante: 'Variant', familia: 'Family',
    drop: 'Drop chance (sprite chest)', costo: 'Summon cost', ubicacion: 'Where to find it',
    lanzamiento: 'Release', habilidad: 'Ability', perk: 'Exclusive perk',
    otras: 'Other', todos: 'See all sprites', guia: 'Sprite guide',
    cta: 'Track your collection on Spritedex', inicio: 'Home', espiritus: 'Sprites',
    novedades: 'Updates', acerca: 'About', aviso: 'Fan project, not affiliated with Epic Games.',
    // La politica de privacidad solo existe en español: se dice, en vez de enlazar a una
    // traduccion que no hay.
    privacidad: 'Privacy (Spanish)', sinImagen: 'We do not have an image for this sprite yet.',
    idioma: 'Language', ruta: 'Breadcrumb', saltar: 'Skip to content'
  },
  'pt-BR': {
    rareza: 'Raridade', generacion: 'Geração', variante: 'Variante', familia: 'Família',
    drop: 'Probabilidade (baú de espírito)', costo: 'Custo de invocação', ubicacion: 'Onde aparece',
    lanzamiento: 'Lançamento', habilidad: 'Habilidade', perk: 'Extra exclusivo',
    otras: 'Outras variantes de', todos: 'Ver todos os espíritos', guia: 'Guia de espíritos',
    cta: 'Acompanhe sua coleção no Spritedex', inicio: 'Início', espiritus: 'Espíritos',
    novedades: 'Novidades', acerca: 'Sobre', aviso: 'Projeto de fãs sem relação com a Epic Games.',
    privacidad: 'Privacidade (em espanhol)', sinImagem: 'Ainda não temos imagem deste espírito.',
    idioma: 'Idioma', ruta: 'Navegação estrutural', saltar: 'Pular para o conteúdo'
  }
};

// El destino del enlace de salto. tabindex="-1" deja caer el foco en el main sin sumarlo al
// recorrido del tabulador, y el id es la misma ancla en las 570 paginas.
export const ABRIR_MAIN = '<main id="contenido" tabindex="-1">';

export const RUTA_PRIVACIDAD = '/privacidad';

export const RUTAS_CONTENIDO = {
  guia: '/guia-espiritus',
  acerca: '/acerca',
  novedades: '/novedades'
};

// La raiz no lleva barra final: /en, no /en/ (que seria otra URL para el mismo contenido). La
// forma de cada prefijo la decide i18n/core.js, igual que en la app.
export function conIdiomaRuta(ruta, lang) {
  return conIdioma(ruta, lang);
}

const CSS = [
  // Sistema: un solo acento (el cian de la marca), un unico fondo con tinte azul muy oscuro en
  // vez de negro puro, y una sola direccion de luz en las sombras.
  ':root { color-scheme: dark; --fondo: #060714; --panel: #0e1222; --borde: rgba(0,240,232,.28); --borde-suave: rgba(255,255,255,.09); --acento: #00F0E8; --acento-tenue: rgba(0,240,232,.12); --texto: #e8ecf8; --apagado: #9aa4bd; --display: "Burbank Big Condensed", system-ui, sans-serif; --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --radio-l: 22px; --radio-m: 14px; --radio-s: 10px; --sombra: 0 40px 80px -56px rgba(0,0,0,.95); }',

  // La Burbank viaja en public/ (la misma que usa la app) y se precarga desde el head. Cero
  // peticiones externas: es lo que mantiene en pie los Core Web Vitals de la fase 3 del SEO.
  '@font-face { font-family: "Burbank Big Condensed"; src: url("/BurbankBigCondensed-Black.woff2") format("woff2"), url("/Burbank Big Condensed Black.otf") format("opentype"); font-weight: 900; font-style: normal; font-display: swap; }',

  '* { box-sizing: border-box; }',

  // Un unico resplandor de acento arriba. Sin background-attachment fixed (en iOS se repinta mal)
  // y sin capas fijas de grano: esto se repinta en cada scroll y el movil es la mayoria del trafico.
  'body { margin: 0; min-height: 100dvh; background-color: var(--fondo); background-image: radial-gradient(1200px 560px at 50% -14%, rgba(0,240,232,.09), transparent 62%); background-repeat: no-repeat; background-size: 100% 660px; color: var(--texto); font: 16px/1.7 var(--sans); -webkit-font-smoothing: antialiased; }',

  'a { color: var(--acento); text-underline-offset: 3px; }',
  'a:hover { color: #7ef7f2; }',

  // Prosa y datos no comparten medida: el texto se queda en ~66 caracteres y la tabla puede usar
  // todo el ancho.
  '.envoltura { max-width: 1040px; margin: 0 auto; padding: 22px clamp(16px, 4vw, 40px) 72px; }',

  // Cabecera: el logotipo pasa a la fuente de la marca, como en la app.
  'header.marca { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 2px 0 26px; }',
  'header.marca a { font-family: var(--display); font-size: 1.6rem; font-weight: 900; letter-spacing: .07em; line-height: 1; text-decoration: none; text-transform: uppercase; color: var(--texto); }',
  'header.marca a:hover { color: var(--acento); }',
  'header.marca span { display: inline-flex; align-items: baseline; gap: 18px; }',
  'header.marca span a { font-family: var(--sans); font-size: .84rem; font-weight: 600; letter-spacing: .01em; text-transform: none; color: var(--apagado); }',
  'header.marca span a:hover { color: var(--acento); }',

  'nav.idiomas { display: flex; flex-wrap: wrap; gap: 6px; font-size: 14px; }',
  'nav.idiomas [aria-current] { color: var(--apagado); font-weight: 700; }',

  'nav.migas { font-size: 13px; color: var(--apagado); margin-bottom: 22px; }',
  'nav.migas ol { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; }',
  'nav.migas li + li::before { content: "›"; margin-right: 6px; color: rgba(154,164,189,.55); }',
  'nav.migas a { color: var(--apagado); text-decoration: none; }',
  'nav.migas a:hover { color: var(--acento); text-decoration: underline; }',

  // Titulos en la fuente de la marca: misma regla que la guia dentro de la app, para que las dos
  // caras de la misma pagina no puedan divergir.
  'h1 { font-family: var(--display); font-size: clamp(2.2rem, 6.4vw, 3.4rem); font-weight: 900; line-height: 1.02; letter-spacing: .015em; text-transform: uppercase; text-wrap: balance; margin: 0 0 12px; }',
  'h2 { font-family: var(--display); font-size: clamp(1.4rem, 3.6vw, 1.95rem); font-weight: 900; line-height: 1.08; letter-spacing: .03em; text-transform: uppercase; text-wrap: balance; margin: 42px 0 10px; }',
  'h3 { font-family: var(--sans); margin: 30px 0 10px; font-size: .8rem; font-weight: 700; color: var(--apagado); text-transform: uppercase; letter-spacing: .12em; }',

  '.lead { color: var(--apagado); font-size: 1.05rem; line-height: 1.65; max-width: 66ch; margin: 0 0 28px; }',
  'main > p { max-width: 66ch; }',

  // Ficha de espiritu
  '.ficha { display: grid; gap: 30px; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); align-items: start; }',
  '@media (max-width: 700px) { .ficha { grid-template-columns: 1fr; } }',
  '.arte { background: radial-gradient(circle at 50% 38%, rgba(0,240,232,.12), transparent 66%), var(--panel); border: 1px solid var(--borde-suave); border-radius: var(--radio-l); padding: 14px; margin: 0; box-shadow: var(--sombra); }',
  '.arte img { width: 100%; height: auto; display: block; }',

  'dl.datos { display: grid; grid-template-columns: auto 1fr; gap: 10px 18px; margin: 0; }',
  'dl.datos dt { color: var(--apagado); font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; padding-top: 3px; }',
  'dl.datos dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }',

  'ul.variantes { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 0; }',
  'ul.variantes a { display: inline-flex; align-items: center; min-height: 24px; border: 1px solid var(--borde); border-radius: 999px; padding: 7px 14px; text-decoration: none; font-size: 14px; transition: background-color .2s ease, border-color .2s ease; }',
  'ul.variantes a:hover { background: var(--acento-tenue); border-color: var(--acento); }',
  'ul.variantes span { display: inline-flex; align-items: center; min-height: 24px; background: var(--panel); border: 1px solid var(--borde-suave); border-radius: 999px; padding: 7px 14px; font-size: 14px; color: var(--apagado); }',
  'ul.indice { list-style: none; padding: 0; columns: 2; column-gap: 34px; }',
  '@media (max-width: 640px) { ul.indice { columns: 1; } }',
  'ul.indice li { break-inside: avoid; margin-bottom: 8px; }',

  // Tablas: una superficie con titulo, no una rejilla de lineas sueltas.
  'table.tabla { width: 100%; border-collapse: separate; border-spacing: 0; margin: 18px 0; font-size: 15px; background: var(--panel); border: 1px solid var(--borde-suave); border-radius: var(--radio-m); overflow: hidden; }',
  'table.tabla caption { padding: 16px 18px 0; text-align: left; color: var(--apagado); font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; }',
  'table.tabla th, table.tabla td { padding: 12px 18px; text-align: left; border-bottom: 1px solid var(--borde-suave); }',
  'table.tabla thead th { color: var(--apagado); font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; }',
  'table.tabla tbody th { font-weight: 600; }',
  'table.tabla tbody tr:last-child th, table.tabla tbody tr:last-child td { border-bottom: 0; }',
  'table.tabla tbody tr:hover { background: rgba(255,255,255,.03); }',
  'table.tabla td:not(:first-child) { font-variant-numeric: tabular-nums; }',

  // FAQ: sigue siendo <details> nativo y sin JS. El triangulo del navegador se cambia por un
  // signo propio, que se lee mejor y no depende del motor.
  'details.faq { border-bottom: 1px solid var(--borde-suave); }',
  'details.faq:first-of-type { border-top: 1px solid var(--borde-suave); }',
  'details.faq summary { position: relative; cursor: pointer; font-weight: 700; font-size: 1rem; line-height: 1.45; padding: 15px 36px 15px 0; list-style: none; transition: color .2s ease; }',
  'details.faq summary::-webkit-details-marker { display: none; }',
  'details.faq summary::after { content: "+"; position: absolute; right: 6px; top: 50%; transform: translateY(-50%); color: var(--acento); font-size: 1.3rem; font-weight: 400; line-height: 1; }',
  'details.faq[open] summary::after { content: "−"; }',
  'details.faq summary:hover { color: var(--acento); }',
  'details.faq p { margin: 0 0 18px; color: var(--apagado); max-width: 66ch; }',

  '.nota { border-left: 2px solid rgba(0,240,232,.35); padding: 2px 0 2px 16px; color: var(--apagado); font-size: .9rem; max-width: 66ch; }',

  '.cta { margin: 38px 0 0; display: flex; flex-wrap: wrap; gap: 12px; }',
  '.cta a { display: inline-flex; align-items: center; min-height: 44px; border-radius: var(--radio-s); padding: 13px 22px; text-decoration: none; font-weight: 700; font-size: .95rem; transition: transform .18s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease; }',
  '.cta a.principal { background: var(--acento); color: #04121a; box-shadow: 0 12px 30px -14px rgba(0,240,232,.6); }',
  '.cta a.principal:hover { background: #5cf5ef; }',
  '.cta a.secundario { border: 1px solid var(--borde); color: var(--acento); }',
  '.cta a.secundario:hover { background: var(--acento-tenue); border-color: var(--acento); }',
  '.cta a:active { transform: translateY(1px); }',

  'footer.pie { border-top: 1px solid var(--borde-suave); margin-top: 60px; padding-top: 20px; color: var(--apagado); font-size: 13px; }',
  'footer.pie nav { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 10px; }',
  'footer.pie a { color: var(--apagado); text-decoration: none; }',
  'footer.pie a:hover { color: var(--acento); text-decoration: underline; }',
  // Accesibilidad. El foco se pinta con el acento sobre el fondo oscuro (contraste 13.96:1) y
  // con separacion del borde, para que se vea tanto en enlaces como en el summary del FAQ.
  ':focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; border-radius: 4px; }',
  // Enlace de salto: fuera de pantalla hasta que recibe foco (criterio 2.4.1). Asi quien navega
  // con teclado no atraviesa la cabecera y el conmutador de idioma en cada pagina.
  '.saltar { position: absolute; top: 0; left: -9999px; z-index: 20; }',
  '.saltar:focus { position: fixed; top: 12px; left: 12px; background: var(--acento); color: #04121a; padding: 10px 16px; border-radius: 10px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 30px rgba(0,0,0,.45); }',
  'html { scroll-behavior: smooth; }',
  // 2.4.11: el encabezado enfocado no queda pegado al borde superior.
  ':target { scroll-margin-top: 24px; }',
  // 2.5.8: los enlaces del conmutador de idioma son objetivos reales y llegan a 24x24 px.
  'nav.idiomas a, nav.idiomas span { display: inline-flex; align-items: center; min-height: 24px; padding: 4px 10px; border-radius: 8px; text-decoration: none; }',
  'nav.idiomas a { transition: background-color .2s ease, color .2s ease; }',
  'nav.idiomas a:hover { background: var(--acento-tenue); color: #7ef7f2; }',

  // Un solo bloque de movimiento reducido. El signo del FAQ y el estado abierto siguen cambiando
  // (son contenido, no adorno): lo unico que se apaga son las transiciones y el scroll suave.
  '@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } a, summary, .cta a, ul.variantes a { transition: none; } }'
].join('\n');

export function headHtml(etiquetas, ogImage) {
  const imagen = ogImage || IMAGEN_REDES;
  return [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
    '<title>' + escapar(etiquetas.tituloDocumento || etiquetas.titulo) + '</title>',
    '<meta name="description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<link rel="canonical" href="' + etiquetas.canonical + '" />',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
    // El mismo color de lienzo que usa la app, para que la barra del navegador movil no corte.
    '<meta name="theme-color" content="#060714" />',
    ...etiquetas.alternates.map((a) => '<link rel="alternate" hreflang="' + a.hreflang + '" href="' + a.href + '" />'),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Spritedex" />',
    '<meta property="og:url" content="' + etiquetas.canonical + '" />',
    '<meta property="og:title" content="' + escapar(etiquetas.titulo) + '" />',
    '<meta property="og:description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<meta property="og:image" content="' + imagen + '" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    ...lineasOgLocale(etiquetas.lang, etiquetas.alternates.length > 1),
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="' + escapar(etiquetas.titulo) + '" />',
    '<meta name="twitter:description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<meta name="twitter:image" content="' + imagen + '" />',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />',
    // La Burbank se precarga para que los titulos no parpadeen con la fuente del sistema. Pesa
    // 35 KB, es del mismo origen y no bloquea el render: no toca los Core Web Vitals.
    '<link rel="preload" as="font" type="font/woff2" href="/BurbankBigCondensed-Black.woff2" crossorigin />',
    '<style>' + CSS + '</style>'
  ].filter(Boolean).join('\n    ');
}

// El aria-label viaja en el idioma de la pagina. Con "Ruta" fijo, las versiones inglesa y
// portuguesa anunciaban al lector de pantalla una palabra en español (criterio 3.1.2). Recibe el
// idioma y no la etiqueta ya resuelta, para que una llamada nueva no pueda olvidarla.
export function migas(items, lang) {
  return '<nav class="migas" aria-label="' + escapar(TEXTO[lang].ruta) + '"><ol>' + items.map((i) => (
    i.href ? '<li><a href="' + i.href + '">' + escapar(i.nombre) + '</a></li>' : '<li>' + escapar(i.nombre) + '</li>'
  )).join('') + '</ol></nav>';
}

export function pieDePagina(lang) {
  const t = TEXTO[lang];
  const enlaces = [
    { href: conIdiomaRuta('/guia-espiritus', lang), nombre: t.guia },
    { href: conIdiomaRuta('/espiritus', lang), nombre: t.todos },
    { href: RUTA_PRIVACIDAD, nombre: t.privacidad }
  ];
  return '<footer class="pie"><p>' + escapar(t.aviso) + '</p><nav aria-label="' + escapar(porIdioma(lang, { es: 'Sitio', en: 'Site', 'pt-BR': 'Site' })) + '">'
    + enlaces.map((e) => '<a href="' + e.href + '">' + escapar(e.nombre) + '</a>').join('') + '</nav></footer>';
}

// Conmutador de idioma: el hreflang le dice a Google cual es cada version, pero quien lee la
// pagina tambien tiene derecho a cambiarla sin volver a la home. Ofrece las versiones del
// cluster; la actual va sin enlace.
export function conmutadorIdioma(etiquetas, lang) {
  const alternos = etiquetas.alternates || [];
  if (alternos.length < 2) return '';
  const opciones = IDIOMAS.filter((l) => alternos.some((a) => a.hreflang === l)).map((l) => {
    const nombre = escapar(NOMBRE_IDIOMA[l]);
    if (l === lang) return '<span aria-current="true">' + nombre + '</span>';
    const alterno = alternos.find((a) => a.hreflang === l);
    return '<a href="' + alterno.href.replace(SITIO, '') + '" hreflang="' + l + '">' + nombre + '</a>';
  });
  return '<nav class="idiomas" aria-label="' + escapar(TEXTO[lang].idioma) + '">' + opciones.join('') + '</nav>';
}

export function documento({ lang, etiquetas, jsonLd, cuerpo, ogImage, conCabecera = true }) {
  const inicio = conIdiomaRuta('/', lang);
  const t = TEXTO[lang];
  const cabecera = conCabecera
    ? '<header class="marca"><a href="' + inicio + '">Spritedex</a><span>'
      + '<a href="' + conIdiomaRuta('/espiritus', lang) + '">' + escapar(t.todos) + '</a></span>'
      + conmutadorIdioma(etiquetas, lang) + '</header>'
    : '';
  return [
    '<!doctype html>',
    '<html lang="' + lang + '">',
    '<head>',
    '    ' + headHtml(etiquetas, ogImage),
    jsonLd ? '    <script type="application/ld+json">' + jsonSeguro(jsonLd) + '</script>' : '',
    '</head>',
    '<body>',
    // Lo primero del body: el destino es el main de la propia pagina (ABRIR_MAIN).
    '<a class="saltar" href="#contenido">' + escapar(TEXTO[lang].saltar) + '</a>',
    '<div class="envoltura">',
    cabecera,
    cuerpo,
    pieDePagina(lang),
    '</div>',
    '</body>',
    '</html>',
    ''
  ].filter(Boolean).join('\n');
}

export function ctaHtml(lang, { conEnlace = '' } = {}) {
  const t = TEXTO[lang];
  const inicio = conIdiomaRuta('/', lang);
  return '<p class="cta"><a class="principal" href="' + inicio + conEnlace + '">' + escapar(t.cta)
    + '</a><a class="secundario" href="' + conIdiomaRuta('/espiritus', lang) + '">' + escapar(t.todos) + '</a></p>';
}

export const SITIO_URL = SITIO;
