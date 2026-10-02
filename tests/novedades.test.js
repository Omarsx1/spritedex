// El aviso flotante de espiritus nuevos se recordaba con una clave que llevaba
// la fecha del drop de cumpleanos escrita a mano: quien lo vio en septiembre no
// volvia a verlo nunca, y los drops siguientes llegaban con el aviso gastado.
import test from 'node:test';
import assert from 'node:assert/strict';

import { contarNovedades, claveAvisoNovedades } from '../src/utils/novedadesAviso.js';

const sprites = [
  { id: 'a', isNew: true, unreleased: false, releaseDate: '2026-09-26' },
  { id: 'b', isNew: true, unreleased: false, releaseDate: '2026-09-26' },
  { id: 'c', isNew: true, unreleased: true, releaseDate: '2026-10-01' },
  { id: 'd', isNew: false, unreleased: false, releaseDate: '2026-08-01' }
];

test('cuenta solo los nuevos que ya salieron', () => {
  assert.equal(contarNovedades(sprites), 2);
  assert.equal(contarNovedades([]), 0);
  assert.equal(contarNovedades(undefined), 0);
});

test('la clave cambia cuando cambia el drop', () => {
  const anterior = claveAvisoNovedades(sprites);
  const siguiente = claveAvisoNovedades([...sprites, { id: 'e', isNew: true, unreleased: false, releaseDate: '2026-10-01' }]);
  assert.notEqual(anterior, siguiente, 'un drop nuevo debe volver a avisar');
});

test('la clave es estable dentro del mismo drop', () => {
  const a = claveAvisoNovedades(sprites);
  const b = claveAvisoNovedades([...sprites].reverse());
  assert.equal(a, b, 'el orden del catalogo no puede cambiar la clave');
  assert.match(a, /^spritedex_visto_novedades_[0-9]{8}$/);
});

test('sin novedades no se inventa una clave con fecha', () => {
  assert.equal(claveAvisoNovedades([{ id: 'x', isNew: false, unreleased: false }]), 'spritedex_visto_novedades_sin_fecha');
});
