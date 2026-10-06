// Invariantes SEO de las rutas indexables. Son las que hoy estaban rotas en produccion:
// /en se canonicalizaba a la raiz (lo que suprime el ingles y, segun Google, invalida todo
// el hreflang) y /amigos tambien apuntaba a la raiz, asi que no se indexaba.
//
// Corren con el runner nativo de Node: src/seo/rutas.js es plano, igual que i18n/core.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RUTAS, SITIO, canonicalDe, alternatesDe, entradaSeo, rutaConIdioma } from '../src/seo/rutas.js';

test('cada ruta tiene titulo y descripcion propios, en rango y sin repetir', () => {
  const titulos = new Set();
  const descripciones = new Set();
  for (const r of RUTAS) {
    for (const lang of r.idiomas) {
      const titulo = r.titulos[lang];
      assert.ok(titulo, r.ruta + ' (' + lang + '): sin titulo');
      assert.ok(titulo.length >= 20 && titulo.length <= 60,
        r.ruta + ' (' + lang + '): titulo de ' + titulo.length + ' chars -> "' + titulo + '"');
      const desc = r.descripciones[lang];
      assert.ok(desc, r.ruta + ' (' + lang + '): sin descripcion');
      assert.ok(desc.length >= 70 && desc.length <= 160,
        r.ruta + ' (' + lang + '): descripcion de ' + desc.length + ' chars');
      assert.ok(!titulos.has(titulo), 'titulo repetido: ' + titulo);
      assert.ok(!descripciones.has(desc), 'descripcion repetida en ' + r.ruta + ' (' + lang + ')');
      titulos.add(titulo);
      descripciones.add(desc);
    }
  }
});

test('el canonical de cada ruta es autorreferente y forma parte de su juego hreflang', () => {
  for (const r of RUTAS) {
    if (r.idiomas.length < 2) continue;
    const alternates = alternatesDe(r.ruta);
    assert.ok(alternates.some((a) => a.hreflang === 'x-default'), r.ruta + ': sin x-default');
    for (const lang of r.idiomas) {
      const canonical = canonicalDe(r.ruta, lang);
      assert.ok(alternates.some((a) => a.href === canonical),
        r.ruta + ' (' + lang + '): el canonical no esta en el hreflang, Google descarta el cluster');
    }
  }
});

test('la version inglesa no se canonicaliza a la española', () => {
  for (const r of RUTAS) {
    if (r.idiomas.length < 2) continue;
    assert.notEqual(canonicalDe(r.ruta, 'en'), canonicalDe(r.ruta, 'es'),
      r.ruta + ': canonical cruzado entre idiomas');
  }
});

test('el hreflang solo apunta a rutas que existen en la tabla', () => {
  const rutas = new Set(RUTAS.map((r) => r.ruta));
  for (const r of RUTAS) {
    for (const alt of alternatesDe(r.ruta)) {
      const limpia = alt.href.replace(SITIO, '');
      assert.ok(rutas.has(rutaSinPrefijo(limpia)),
        'hreflang a una ruta que no existe: ' + alt.href);
    }
  }
});

test('la entrada se resuelve con o sin prefijo de idioma y sin barra final', () => {
  assert.equal(entradaSeo('/').ruta, '/');
  assert.equal(entradaSeo('/en').ruta, '/');
  assert.equal(entradaSeo('/en').lang, 'en');
  assert.equal(entradaSeo('/amigos/').ruta, '/amigos');
  assert.equal(entradaSeo('/en/amigos').ruta, '/amigos');
  assert.equal(entradaSeo('/en/amigos').lang, 'en');
});

test('las rutas que no existen no se indexan (sino compiten con la home)', () => {
  assert.equal(entradaSeo('/cualquier-cosa').noindex, true);
  assert.equal(entradaSeo('/amigos/SDEX-1234').noindex, true, 'un enlace de amigo es de un usuario');
  assert.equal(entradaSeo('/').noindex, false);
  assert.equal(entradaSeo('/en/amigos').noindex, false);
});

test('rutaConIdioma reproduce el mismo esquema que usa la app', () => {
  assert.equal(rutaConIdioma('/amigos', 'en'), '/en/amigos');
  assert.equal(rutaConIdioma('/', 'en'), '/en');
  assert.equal(rutaConIdioma('/', 'es'), '/');
  assert.equal(rutaConIdioma('/amigos', 'es'), '/amigos');
});

function rutaSinPrefijo(p) {
  if (p === '/en') return '/';
  return p.startsWith('/en/') ? p.slice(3) : (p === '' ? '/' : p);
}
