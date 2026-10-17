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
  ':root { color-scheme: dark; --fondo: #060714; --panel: #101324; --borde: rgba(0,240,232,.28); --acento: #00F0E8; --texto: #e8ecf8; --apagado: #9aa4bd; }',
  '* { box-sizing: border-box; }',
  'body { margin: 0; background: var(--fondo); color: var(--texto); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }',
  'a { color: var(--acento); }',
  '.envoltura { max-width: 880px; margin: 0 auto; padding: 20px 18px 56px; }',
  'header.marca { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0 18px; }',
  'header.marca a { font-weight: 800; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }',
  'header.marca span { display: inline-flex; align-items: baseline; gap: 14px; }',
  'header.marca span a:last-child { color: var(--apagado); font-weight: 600; }',
  'nav.idiomas { display: flex; flex-wrap: wrap; gap: 10px; font-size: 14px; }',
  'nav.idiomas [aria-current] { color: var(--apagado); font-weight: 700; }',
  'nav.migas { font-size: 13px; color: var(--apagado); margin-bottom: 14px; }',
  'nav.migas ol { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; }',
  'nav.migas li + li::before { content: "›"; margin-right: 6px; color: var(--apagado); }',
  'h1 { font-size: clamp(26px, 5vw, 40px); line-height: 1.15; margin: 0 0 6px; }',
  'h2 { font-size: 20px; margin: 28px 0 8px; }',
  'h3 { margin: 22px 0 8px; font-size: 17px; color: var(--apagado); text-transform: uppercase; letter-spacing: .08em; }',
  '.lead { color: var(--apagado); margin: 0 0 20px; }',
  '.ficha { display: grid; gap: 24px; grid-template-columns: minmax(0, 320px) minmax(0, 1fr); align-items: start; }',
  '@media (max-width: 700px) { .ficha { grid-template-columns: 1fr; } }',
  '.arte { background: radial-gradient(circle at 50% 40%, rgba(0,240,232,.10), transparent 65%); border: 1px solid var(--borde); border-radius: 16px; padding: 12px; margin: 0; }',
  '.arte img { width: 100%; height: auto; display: block; }',
  'dl.datos { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 0; }',
  'dl.datos dt { color: var(--apagado); font-size: 14px; }',
  'dl.datos dd { margin: 0; font-weight: 600; }',
  'ul.variantes { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 0; }',
  'ul.variantes a { border: 1px solid var(--borde); border-radius: 999px; padding: 6px 12px; text-decoration: none; font-size: 14px; }',
  'ul.variantes span { border: 1px solid rgba(255,255,255,.08); border-radius: 999px; padding: 6px 12px; font-size: 14px; color: var(--apagado); }',
  'ul.indice { list-style: none; padding: 0; columns: 2; column-gap: 28px; }',
  '@media (max-width: 640px) { ul.indice { columns: 1; } }',
  'ul.indice li { break-inside: avoid; margin-bottom: 6px; }',
  'table.tabla { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 15px; }',
  'table.tabla th, table.tabla td { border-bottom: 1px solid rgba(255,255,255,.08); padding: 8px 10px; text-align: left; }',
  'table.tabla th { color: var(--apagado); font-weight: 600; }',
  'details.faq { border-bottom: 1px solid rgba(255,255,255,.08); padding: 10px 0; }',
  'details.faq summary { cursor: pointer; font-weight: 600; }',
  'details.faq p { margin: 8px 0 0; color: var(--apagado); }',
  '.nota { border-left: 2px solid var(--borde); padding-left: 14px; color: var(--apagado); }',
  '.cta { margin: 30px 0 0; display: flex; flex-wrap: wrap; gap: 12px; }',
  '.cta a { border-radius: 10px; padding: 11px 18px; text-decoration: none; font-weight: 700; }',
  '.cta a.principal { background: var(--acento); color: #04121a; }',
  '.cta a.secundario { border: 1px solid var(--borde); }',
  'footer.pie { border-top: 1px solid rgba(255,255,255,.08); margin-top: 40px; padding-top: 16px; color: var(--apagado); font-size: 13px; }',
  'footer.pie nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }',
  // Accesibilidad. El foco se pinta con el acento sobre el fondo oscuro (contraste 13.96:1) y
  // con separacion del borde, para que se vea tanto en enlaces como en el summary del FAQ.
  ':focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; border-radius: 4px; }',
  // Enlace de salto: fuera de pantalla hasta que recibe foco (criterio 2.4.1). Asi quien navega
  // con teclado no atraviesa la cabecera y el conmutador de idioma en cada pagina.
  '.saltar { position: absolute; top: 0; left: -9999px; z-index: 20; }',
  '.saltar:focus { position: fixed; top: 12px; left: 12px; background: var(--acento); color: #04121a; padding: 10px 16px; border-radius: 10px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 30px rgba(0,0,0,.45); }',
  'html { scroll-behavior: smooth; }',
  '@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }',
  // 2.4.11: el encabezado enfocado no queda pegado al borde superior.
  ':target { scroll-margin-top: 24px; }',
  // 2.5.8: los enlaces del conmutador de idioma son objetivos reales y llegan a 24x24 px.
  'nav.idiomas a, nav.idiomas span { display: inline-flex; align-items: center; min-height: 24px; padding: 4px 10px; border-radius: 8px; text-decoration: none; }',
  'nav.idiomas a { transition: background-color .2s ease, color .2s ease; }',
  'nav.idiomas a:hover { background: rgba(0,240,232,.12); color: #7ef7f2; }'
].join('\n');

export function headHtml(etiquetas, ogImage) {
  const imagen = ogImage || IMAGEN_REDES;
  return [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<title>' + escapar(etiquetas.tituloDocumento || etiquetas.titulo) + '</title>',
    '<meta name="description" content="' + escapar(etiquetas.descripcion) + '" />',
    '<link rel="canonical" href="' + etiquetas.canonical + '" />',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
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
