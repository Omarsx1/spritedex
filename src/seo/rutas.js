// Tabla unica de rutas indexables y de las etiquetas que les corresponden.
//
// Vive aparte y sin dependencias de datos (igual que spriteName.js e i18n/core.js) porque la
// usan tres consumidores distintos: el prerender del build (Node), el gestor de head en
// runtime (navegador) y las pruebas. Antes el <head> era uno solo para todas las URLs: /en y
// /amigos salian con el canonical de la raiz, asi que Google no indexaba ni el ingles ni la
// pagina de amigos, y el hreflang quedaba descartado (un canonical fuera del juego hreflang
// invalida el cluster entero).

import { conIdioma, idiomaDeRuta, rutaSinIdioma } from '../i18n/core.js';

export const SITIO = 'https://spritedex.gg';
export const IMAGEN_REDES = SITIO + '/icon-512.png';

export const RUTAS = [
  {
    ruta: '/',
    idiomas: ['es', 'en'],
    prioridad: 1.0,
    frecuencia: 'daily',
    titulos: {
      es: 'Spritedex — Espíritus de Fortnite: variantes y niveles',
      en: 'Spritedex — Fortnite Sprites: variants and levels'
    },
    descripciones: {
      es: 'Rastrea tu colección de espíritus de Fortnite: marca tus capturas, sube niveles del 1 al 5, compara con amigos y comparte tu Spritedex.',
      en: 'Track your Fortnite sprite collection: mark your captures, level them from 1 to 5, compare with friends and share your Spritedex.'
    }
  },
  {
    ruta: '/amigos',
    idiomas: ['es', 'en'],
    prioridad: 0.6,
    frecuencia: 'weekly',
    titulos: {
      es: 'Comparar espíritus con amigos — Spritedex',
      en: 'Compare Fortnite sprites with friends — Spritedex'
    },
    descripciones: {
      es: 'Compara tu lista de espíritus de Fortnite con la de tus amigos: quién tiene más, cuáles te faltan y qué pueden intercambiar.',
      en: 'Compare your Fortnite sprite list with your friends: who has more, what you are missing and what you can trade.'
    }
  },
  {
    // Pagina estatica (public/privacidad.html): el prerender no la reescribe, pero entra en
    // el sitemap, que es de donde se estaba quedando fuera.
    ruta: '/privacidad',
    idiomas: ['es'],
    archivo: true,
    prioridad: 0.3,
    frecuencia: 'yearly',
    titulos: { es: 'Privacidad y cookies — Spritedex' },
    descripciones: {
      es: 'Centro de privacidad y cookies de Spritedex: qué guardamos en tu dispositivo, por qué y cómo gestionarlo.'
    }
  }
];

// '/amigos' + 'en' -> '/en/amigos'. Mismo esquema que usa la app al navegar (i18n/core.js),
// para que la URL del canonical sea exactamente la que existe.
export function rutaConIdioma(ruta, lang) {
  return conIdioma(ruta, lang);
}

export function canonicalDe(ruta, lang) {
  return SITIO + conIdioma(ruta, lang);
}

// Juego hreflang completo, con autorreferencia y x-default: si falta cualquiera de los dos,
// Google descarta el cluster.
export function alternatesDe(ruta) {
  const entrada = RUTAS.find((r) => r.ruta === ruta);
  if (!entrada || entrada.idiomas.length < 2) return [];
  return [
    { hreflang: 'es', href: canonicalDe(ruta, 'es') },
    { hreflang: 'en', href: canonicalDe(ruta, 'en') },
    { hreflang: 'x-default', href: canonicalDe(ruta, 'es') }
  ];
}

function sinBarraFinal(pathname) {
  const p = String(pathname || '/');
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

// Resuelve una URL real a su entrada. Lo que no es una ruta conocida lo sirve el catch-all
// con el HTML de la home: se marca noindex para que no compita con ella (los enlaces de amigo
// del tipo /amigos/SDEX-XXXX son de un usuario concreto y no pintan nada en el indice).
export function entradaSeo(pathname) {
  const crudo = String(pathname || '/');
  const lang = idiomaDeRuta(crudo);
  const ruta = sinBarraFinal(rutaSinIdioma(crudo)) || '/';
  const exacta = RUTAS.find((r) => r.ruta === ruta);
  if (exacta) return { ...exacta, lang, noindex: false };
  const inicio = RUTAS.find((r) => r.ruta === '/');
  return { ...inicio, lang, noindex: true };
}

// Etiquetas de una entrada, ya resueltas: la misma funcion alimenta el prerender y el runtime.
export function etiquetasSeo(entrada) {
  const lang = entrada.idiomas.indexOf(entrada.lang) !== -1 ? entrada.lang : entrada.idiomas[0];
  return {
    lang,
    titulo: entrada.titulos[lang],
    descripcion: entrada.descripciones[lang],
    canonical: canonicalDe(entrada.ruta, entrada.idiomas.length > 1 ? lang : 'es'),
    alternates: entrada.noindex ? [] : alternatesDe(entrada.ruta)
  };
}

// Datos estructurados por ruta. Solo se describe lo que la pagina es de verdad: una web app
// gratuita de seguimiento y su relacion con el juego, sin inventar ofertas ni valoraciones.
export function jsonLdDe(entrada) {
  if (entrada.noindex) return null;
  const { lang, titulo, descripcion, canonical } = etiquetasSeo(entrada);
  const enIngles = lang === 'en';
  if (entrada.ruta === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': SITIO + '/#organization',
          name: 'Spritedex',
          url: SITIO + '/',
          logo: SITIO + '/icon-512.png',
          description: enIngles
            ? 'Interactive tracker and database for Fortnite Chapter 7 Sprites.'
            : 'Rastreador interactivo y catálogo de espíritus de Fortnite Capítulo 7.'
        },
        {
          '@type': 'WebSite',
          '@id': SITIO + '/#website',
          url: SITIO + '/',
          name: 'Spritedex',
          inLanguage: lang,
          description: descripcion,
          publisher: { '@id': SITIO + '/#organization' },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: SITIO + (enIngles ? '/en?q={search_term_string}' : '/?q={search_term_string}')
            },
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'WebApplication',
          '@id': SITIO + '/#app',
          name: 'Spritedex',
          url: canonical,
          applicationCategory: 'GameApplication',
          operatingSystem: 'All',
          inLanguage: lang,
          isAccessibleForFree: true,
          publisher: { '@id': SITIO + '/#organization' },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: enIngles
            ? ['Sprite collection tracker', 'Levels 1 to 5', 'Variant and family filters', 'Friend comparison', 'Shareable image cards']
            : ['Rastreador de colección de espíritus', 'Niveles del 1 al 5', 'Filtros por variante y familia', 'Comparación con amigos', 'Tarjetas para compartir'],
          description: descripcion
        },
        {
          '@type': 'WebPage',
          '@id': canonical + '#webpage',
          url: canonical,
          name: titulo,
          inLanguage: lang,
          isPartOf: { '@id': SITIO + '/#website' },
          about: { '@type': 'VideoGame', name: 'Fortnite' }
        }
      ]
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonical + '#webpage',
        url: canonical,
        name: titulo,
        inLanguage: lang,
        isPartOf: { '@id': SITIO + '/#website' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: enIngles ? 'Home' : 'Inicio', item: canonicalDe('/', lang) },
          { '@type': 'ListItem', position: 2, name: enIngles ? 'Friends' : 'Amigos', item: canonical }
        ]
      }
    ]
  };
}
