// Paginas de espiritu: la ficha de cada uno con su contenido propio.
//
// Vive separado y sin dependencias (como rutas.js) porque lo usan el generador del build y
// las pruebas con Node. Aqui no hay datos: las funciones reciben la ficha ya resuelta y el
// idioma, y devuelven etiquetas, JSON-LD y HTML. La traduccion de los textos del juego la
// hace la app (pickTexto), no este modulo.
//
// Por que existe: los 278 espiritus solo vivian dentro de la SPA (el detalle se abria en un
// modal por estado, sin URL). Todo su contenido unico era invisible para un buscador.

import { SITIO, TITULO_SITIO } from './rutas.js';
import { escapar, migas, documento, ctaHtml, recortar, conIdiomaRuta, TEXTO, ZONA, ABRIR_MAIN } from './plantilla.js';
import { porIdioma, hreflangsDe, rarezaEnIdioma, numeroEnIdioma } from './idioma.js';

const RUTA_HUB = '/espiritus';

// Rotulos de las propiedades del JSON-LD de la ficha. Se piden por idioma (porIdioma) y no con una
// rama binaria: el portugues no debe caer al espanol.
const ROTULOS_FICHA = {
  es: { familia: 'Familia', variante: 'Variante', rareza: 'Rareza', generacion: 'Generación', probabilidad: 'Probabilidad', costo: 'Costo de invocación', ubicacion: 'Ubicación', categoria: 'Espíritu de Fortnite' },
  en: { familia: 'Family', variante: 'Variant', rareza: 'Rarity', generacion: 'Generation', probabilidad: 'Drop chance', costo: 'Summon cost', ubicacion: 'Location', categoria: 'Fortnite sprite' },
  'pt-BR': { familia: 'Família', variante: 'Variante', rareza: 'Raridade', generacion: 'Geração', probabilidad: 'Probabilidade', costo: 'Custo de invocação', ubicacion: 'Localização', categoria: 'Espírito de Fortnite' }
};

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
  return hreflangsDe(SITIO, rutaEspiritu(id));
}

export function etiquetasEspiritu(ficha, lang) {
  const datos = ficha[lang];
  const completo = datos.nombre + ' — ' + ZONA[lang] + ' | Spritedex';
  const titulo = completo.length <= 60 ? completo : recortar(datos.nombre + ' — ' + ZONA[lang], 60);
  const rareza = rarezaEnIdioma(ficha.rareza, lang);
  const descripcion = porIdioma(lang, {
    en: recortar('Fortnite sprite ' + datos.nombre + ': ' + datos.familia + ' family, ' + datos.variante + ' variant, ' + rareza + ' rarity, ' + numeroEnIdioma(ficha.drop, lang) + ' drop chance. Where to find it and what it does.', 160),
    es: recortar('Espíritu ' + datos.nombre + ' de Fortnite: familia ' + datos.familia + ', variante ' + datos.variante + ', rareza ' + rareza + ' y ' + numeroEnIdioma(ficha.drop, lang) + ' de probabilidad. Dónde aparece y qué hace.', 160),
    'pt-BR': recortar('Espírito ' + datos.nombre + ' de Fortnite: família ' + datos.familia + ', variante ' + datos.variante + ', raridade ' + rareza + ' e ' + numeroEnIdioma(ficha.drop, lang) + ' de probabilidade. Onde aparece e o que faz.', 160)
  });
  return {
    lang,
    titulo,
    descripcion,
    canonical: canonicalEspiritu(ficha.id, lang),
    alternates: alternatesDeEspiritu(ficha.id)
  };
}

export function etiquetasHubEspiritus(total, lang) {
  const titulo = porIdioma(lang, {
    en: 'All Fortnite sprites — Spritedex',
    es: 'Todos los espíritus de Fortnite — Spritedex',
    'pt-BR': 'Todos os espíritos de Fortnite — Spritedex'
  });
  const descripcion = porIdioma(lang, {
    en: recortar('Full list of the ' + total + ' Fortnite sprites by family and variant, with rarity, drop chance and a page for each one.', 160),
    es: recortar('Lista completa de los ' + total + ' espíritus de Fortnite por familia y variante, con rareza, probabilidad de drop y su ficha.', 160),
    'pt-BR': recortar('Lista completa dos ' + total + ' espíritos de Fortnite por família e variante, com raridade, probabilidade de obtenção e uma ficha para cada um.', 160)
  });
  return {
    lang,
    titulo,
    tituloDocumento: TITULO_SITIO,
    descripcion,
    canonical: SITIO + rutaConIdiomaEspiritu(RUTA_HUB, lang),
    alternates: hreflangsDe(SITIO, RUTA_HUB)
  };
}

function propiedad(nombre, valor) {
  return { '@type': 'PropertyValue', name: nombre, value: valor };
}

export function jsonLdEspiritu(ficha, lang) {
  const etiquetas = etiquetasEspiritu(ficha, lang);
  const datos = ficha[lang];
  const r = porIdioma(lang, ROTULOS_FICHA);
  const propiedades = [
    propiedad(r.familia, datos.familia),
    propiedad(r.variante, datos.variante),
    propiedad(r.rareza, rarezaEnIdioma(ficha.rareza, lang)),
    propiedad(r.generacion, String(ficha.generacion)),
    propiedad(r.probabilidad, numeroEnIdioma(ficha.drop, lang))
  ];
  if (datos.costo) propiedades.push(propiedad(r.costo, datos.costo));
  if (datos.ubicacion) propiedades.push(propiedad(r.ubicacion, datos.ubicacion));
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
          category: r.categoria,
          additionalProperty: propiedades
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: TEXTO[lang].inicio, item: SITIO + rutaConIdiomaEspiritu('/', lang) },
          { '@type': 'ListItem', position: 2, name: TEXTO[lang].espiritus, item: SITIO + rutaConIdiomaEspiritu(RUTA_HUB, lang) },
          { '@type': 'ListItem', position: 3, name: datos.nombre, item: etiquetas.canonical }
        ]
      }
    ]
  };
}

export function jsonLdHubEspiritus(fichas, lang) {
  const etiquetas = etiquetasHubEspiritus(fichas.length, lang);
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
          { '@type': 'ListItem', position: 1, name: TEXTO[lang].inicio, item: SITIO + rutaConIdiomaEspiritu('/', lang) },
          { '@type': 'ListItem', position: 2, name: TEXTO[lang].espiritus, item: etiquetas.canonical }
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
    [t.rareza, rarezaEnIdioma(ficha.rareza, lang)],
    [t.generacion, String(ficha.generacion)],
    [t.variante, d.variante],
    [t.familia, d.familia],
    [t.drop, numeroEnIdioma(ficha.drop, lang)],
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
    migas([{ nombre: t.inicio, href: base }, { nombre: t.espiritus, href: hub }, { nombre: d.nombre }], lang),
    ABRIR_MAIN,
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
    migas([{ nombre: t.inicio, href: base }, { nombre: t.espiritus }], lang),
    ABRIR_MAIN,
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    bloques,
    '<p class="cta"><a class="principal" href="' + base + '">' + escapar(t.cta) + '</a></p>',
    '</main>'
  ].filter(Boolean).join('\n');
  return documento({ lang, etiquetas, jsonLd: jsonLdHubEspiritus(fichas, lang), cuerpo });
}
