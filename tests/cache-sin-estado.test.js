// La copia del navegador no decide un lanzamiento: sirve para pintar rapido.
//
// El caso que se escapo: una copia vieja con fecha futura para fichas que el catalogo da por
// publicadas (Impulso aterrador Dorado, Ciervo Dorado, Impulso aterrador Cazarrecompensas).
// La copia cruda ganaba por 'release_date' y las tres desaparecian de la cuadricula.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoLanzamiento, fechaDeLanzamiento, sinEstadoDeLanzamiento } from '../src/utils/lanzamiento.js';

const FUTURO = '2026-12-01T00:00:00.000Z';
const CATALOGO = { id: 'deer_gold', unreleased: false, releaseDate: '2026-10-01' };
const COPIA_VIEJA = { id: 'deer_gold', release_date: FUTURO, unreleased: true, is_new: false };

// Lo que hacia el navegador antes de limpiar la copia: la ficha salia programada y se ocultaba.
test('la copia cruda si ocultaba una ficha que el catalogo da por publicada', () => {
  assert.equal(estadoLanzamiento({ ...CATALOGO, ...COPIA_VIEJA }).unreleased, true);
});

test('la copia del navegador pierde las claves de lanzamiento al leerla', () => {
  assert.deepEqual(Object.keys(sinEstadoDeLanzamiento(COPIA_VIEJA)), ['id']);
});

test('con la copia limpia manda el catalogo y la ficha vuelve a la cuadricula', () => {
  const copia = sinEstadoDeLanzamiento(COPIA_VIEJA);
  const mezcla = { ...CATALOGO, ...copia, releaseDate: fechaDeLanzamiento(CATALOGO, copia) };
  assert.equal(mezcla.release_date, undefined);
  assert.equal(mezcla.releaseDate, '2026-10-01');
  assert.equal(estadoLanzamiento(mezcla).unreleased, false);
});

test('la copia tampoco decide la novedad: manda la fecha del catalogo', () => {
  const copia = sinEstadoDeLanzamiento(COPIA_VIEJA);
  assert.equal(estadoLanzamiento({ ...CATALOGO, ...copia, releaseDate: fechaDeLanzamiento(CATALOGO, copia) }, Date.parse('2026-10-02')).nuevo, true);
});
