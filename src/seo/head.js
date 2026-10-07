// Mantiene el <head> coherente con la ruta mientras se navega dentro de la app.
//
// El HTML de cada ruta ya sale correcto del build (scripts/prerender-seo.mjs escribe /en,
// /amigos y /en/amigos con su titulo y su canonical). Esto es para despues: al pasar de la
// home a Amigos sin recargar, el <head> se quedaba el de la home.
import { SITIO, IMAGEN_REDES, entradaSeo, etiquetasSeo, jsonLdDe } from './rutas.js';

function ponerMeta(atributo, clave, contenido) {
  let nodo = document.head.querySelector('meta[' + atributo + '="' + clave + '"]');
  if (!nodo) {
    nodo = document.createElement('meta');
    nodo.setAttribute(atributo, clave);
    document.head.appendChild(nodo);
  }
  nodo.setAttribute('content', contenido);
}

function ponerCanonical(href) {
  let nodo = document.head.querySelector('link[rel="canonical"]');
  if (!nodo) {
    nodo = document.createElement('link');
    nodo.setAttribute('rel', 'canonical');
    document.head.appendChild(nodo);
  }
  nodo.setAttribute('href', href);
}

function ponerJsonLd(datos) {
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());
  if (!datos) return;
  const nodo = document.createElement('script');
  nodo.type = 'application/ld+json';
  nodo.textContent = JSON.stringify(datos);
  document.head.appendChild(nodo);
}

export function aplicarSeoRuta(pathname, { noindex = false } = {}) {
  if (typeof document === 'undefined') return null;
  const entrada = entradaSeo(pathname);
  const { lang, titulo, descripcion, canonical, alternates } = etiquetasSeo(entrada);

  document.title = titulo;
  ponerMeta('name', 'description', descripcion);
  ponerCanonical(canonical);
  ponerMeta('property', 'og:url', canonical);
  ponerMeta('property', 'og:title', titulo);
  ponerMeta('property', 'og:description', descripcion);
  ponerMeta('property', 'og:image', IMAGEN_REDES);
  ponerMeta('property', 'og:locale', lang === 'en' ? 'en_US' : 'es_MX');
  ponerMeta('name', 'twitter:card', 'summary_large_image');
  ponerMeta('name', 'twitter:title', titulo);
  ponerMeta('name', 'twitter:description', descripcion);
  ponerMeta('name', 'twitter:image', IMAGEN_REDES);

  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
  for (const alt of alternates) {
    const nodo = document.createElement('link');
    nodo.rel = 'alternate';
    nodo.hreflang = alt.hreflang;
    nodo.href = alt.href;
    document.head.appendChild(nodo);
  }

  // El portal de administracion vive en rutas sirviendo el HTML de la home: sin esto
  // heredaria su canonical, que es justo lo que no queremos que vea un buscador.
  if (noindex || entrada.noindex) {
    ponerMeta('name', 'robots', 'noindex, follow');
    ponerJsonLd(null);
  } else {
    const robots = document.head.querySelector('meta[name="robots"]');
    if (robots) robots.remove();
    ponerJsonLd(jsonLdDe(entrada));
  }

  // El sitio es el mismo en los dos idiomas: se lo decimos tambien al <html>.
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('data-sitio', SITIO);
  return { lang, titulo, canonical };
}
