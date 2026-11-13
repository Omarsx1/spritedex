// Orden de las variantes dentro de una familia. En la 3ª generación (Buscatesoros)
// Fortnite publica el Dorado AL FINAL: Basico, Afortunado (Fortune), Maldito (Cursed),
// Dorado (Gold). En 1ª y 2ª el Dorado sigue junto al Basico.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { prioridadVariante } from '../src/utils/ordenVariantes.js';

test('en la 3ª generación el Dorado va después del Afortunado y del Maldito', () => {
  assert.ok(prioridadVariante('Gold', 3) > prioridadVariante('cursed', 3));
  assert.ok(prioridadVariante('Gold', 3) > prioridadVariante('jeweled', 3));
  assert.ok(prioridadVariante('cursed', 3) > prioridadVariante('jeweled', 3));
  assert.ok(prioridadVariante('jeweled', 3) > prioridadVariante('Basic', 3));
});

test('la 1ª y 2ª generación conservan el Dorado junto al Básico', () => {
  for (const gen of [1, 2]) {
    assert.ok(prioridadVariante('Gold', gen) > prioridadVariante('Basic', gen));
    assert.ok(prioridadVariante('Gold', gen) < prioridadVariante('cursed', gen));
  }
  assert.equal(prioridadVariante('Base', 2), prioridadVariante('Basic', 2), 'Base es alias de Basic');
});

test('el catálogo guarda el Dorado de la 3ª generación después del Maldito', () => {
  const catalogo = JSON.parse(fs.readFileSync('src/data/official_sprites.json', 'utf8'));
  const posicion = new Map(catalogo.map((s, i) => [s.id, i]));
  const familias = [...new Set(
    catalogo.filter((s) => s.gen === 3).map((s) => s.id.split('_')[0])
  )];

  const problemas = [];
  for (const familia of familias) {
    const gold = posicion.get(familia + '_gold');
    if (gold === undefined) continue;
    const cursed = posicion.get(familia + '_cursed');
    const jeweled = posicion.get(familia + '_jeweled');
    if (cursed !== undefined && gold < cursed) problemas.push(familia + ': Dorado antes que Maldito');
    if (jeweled !== undefined && gold < jeweled) problemas.push(familia + ': Dorado antes que Afortunado');
  }
  assert.deepEqual(problemas, []);
});
