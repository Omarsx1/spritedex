// Paginas de espiritu: la ficha de cada uno con su contenido propio.
//
// Vive separado y sin dependencias (como rutas.js) porque lo usan el generador del build y
// las pruebas con Node. Aqui no hay datos: las funciones reciben la ficha ya resuelta y el
// idioma, y devuelven etiquetas, JSON-LD y HTML. La traduccion de los textos del juego la
// hace la app (pickTexto), no este modulo.
//
// Por que existe: los 278 espiritus solo vivian dentro de la SPA (el detalle se abria en un
// modal por estado, sin URL). Todo su contenido unico era invisible para un buscador.

import { SITIO } from './rutas.js';
import { escapar, migas, documento, ctaHtml, recortar, conIdiomaRuta, TEXTO, ZONA } from './plantilla.js';

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
  return conIdiomaRuta(ruta, lang);
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

export function htmlPaginaEspiritu(ficha, lang) {
  const etiquetas = etiquetasEspiritu(ficha, lang);
  const t = TEXTO[lang];
  const d = ficha[lang];
  const base = conIdiomaRuta('/', lang);
  const hub = conIdiomaRuta(RUTA_HUB, lang);
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
      : '<li><a href="' + conIdiomaRuta(rutaEspiritu(h.id), lang) + '">' + escapar(h[lang].nombre) + '</a></li>'
  )).join('');
  const cuerpo = [
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
    ctaHtml(lang, { conEnlace: '?s=' + slugDeEspiritu(ficha.id) }),
    '</main>'
  ].filter(Boolean).join('\n');
  return documento({ lang, etiquetas, jsonLd: jsonLdEspiritu(ficha, lang), cuerpo, ogImage: ficha.thumb ? SITIO + ficha.thumb : undefined });
}

export function htmlHubEspiritus(fichas, lang) {
  const etiquetas = etiquetasHubEspiritus(fichas.length, lang);
  const t = TEXTO[lang];
  const base = conIdiomaRuta('/', lang);
  const porFamilia = new Map();
  for (const f of fichas) {
    const clave = f[lang].familia;
    if (!porFamilia.has(clave)) porFamilia.set(clave, []);
    porFamilia.get(clave).push(f);
  }
  const bloques = [...porFamilia.entries()].map(([familia, lista]) => (
    '<h3>' + escapar(familia) + '</h3><ul class="indice">' + lista.map((f) => (
      '<li><a href="' + conIdiomaRuta(rutaEspiritu(f.id), lang) + '">' + escapar(f[lang].nombre) + '</a></li>'
    )).join('') + '</ul>'
  )).join('');
  const cuerpo = [
    migas([{ nombre: t.inicio, href: base }, { nombre: t.espiritus }]),
    '<main>',
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    bloques,
    '<p class="cta"><a class="principal" href="' + base + '">' + escapar(t.cta) + '</a></p>',
    '</main>'
  ].filter(Boolean).join('\n');
  return documento({ lang, etiquetas, jsonLd: jsonLdHubEspiritus(fichas, lang), cuerpo });
}
