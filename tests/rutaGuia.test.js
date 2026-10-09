// La regla que decide si una ruta es la guia de espiritus. Es pura, y por eso se prueba aqui:
// de ella depende que el menu abra la guia DENTRO de la aplicacion (y no que expulse al
// visitante a la pagina estatica o que siga pintando el catalogo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { esRutaGuia } from '../src/utils/rutaGuia.js';
import { rutaSinIdioma } from '../src/i18n/core.js';

test('la ruta de la guia entra', () => {
  assert.equal(esRutaGuia('/guia-espiritus'), true);
});

test('la barra final es la misma pagina', () => {
  assert.equal(esRutaGuia('/guia-espiritus/'), true);
});

test('los dos idiomas son la misma pantalla: el prefijo lo quita rutaSinIdioma', () => {
  assert.equal(rutaSinIdioma('/en/guia-espiritus'), '/guia-espiritus');
  for (const ruta of ['/guia-espiritus', '/guia-espiritus/', '/en/guia-espiritus', '/en/guia-espiritus/']) {
    assert.equal(esRutaGuia(rutaSinIdioma(ruta)), true, ruta);
  }
});

test('un texto mas largo que empieza igual no es la guia', () => {
  assert.equal(esRutaGuia('/guia-espiritus-vieja'), false);
  assert.equal(esRutaGuia('/guia-espiritus/algo'), false);
  assert.equal(esRutaGuia(rutaSinIdioma('/en/guia-espiritus/extra')), false);
});

test('otra ruta no es la guia', () => {
  assert.equal(esRutaGuia('/'), false);
  assert.equal(esRutaGuia('/espiritus'), false);
  assert.equal(esRutaGuia('/amigos'), false);
  assert.equal(esRutaGuia('/guia'), false);
  assert.equal(esRutaGuia(rutaSinIdioma('/en')), false);
  assert.equal(esRutaGuia(''), false);
  assert.equal(esRutaGuia(null), false);
  assert.equal(esRutaGuia(undefined), false);
});
