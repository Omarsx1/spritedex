// Enlace profundo a un espiritu.
//
// Las paginas de /espiritu/<slug> son estaticas (las sirve Vercel como archivo, la app ni se
// entera), asi que su CTA lleva a la app con ?s=<slug>. Aqui se resuelve ese parametro —y
// tambien la propia ruta, que es la que ve la app en desarrollo— al espiritu del catalogo.
//
// Modulo plano y sin React: se prueba con node --test.
import { slugDeEspiritu } from '../seo/espiritus.js';
import { rutaSinIdioma } from '../i18n/core.js';

const PREFIJO = '/espiritu/';

export function slugDeEnlace(pathname, search) {
  const parametro = new URLSearchParams(String(search || '')).get('s');
  if (parametro) return parametro.trim() || null;

  const ruta = rutaSinIdioma(String(pathname || '/'));
  if (!ruta.startsWith(PREFIJO)) return null;
  const resto = ruta.slice(PREFIJO.length).split('/')[0];
  return resto ? decodeURIComponent(resto) : null;
}

export function espirituDeEnlace(pathname, search, sprites) {
  const slug = slugDeEnlace(pathname, search);
  if (!slug || !Array.isArray(sprites)) return null;
  return sprites.find((s) => s && slugDeEspiritu(s.id) === slug) || null;
}
