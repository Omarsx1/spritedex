// La novedad de un lote no puede depender de la generacion: desde la temporada
// Buscatesoros los lanzamientos nuevos son de 3ª. Antes la regla solo miraba la 2ª,
// asi que un espiritu recien salido contaba en el aviso pero nunca aparecia en la
// vista "Nuevos" (badge 1, lista vacia).
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyBatchNoveltyRules } from '../src/utils/novedadLote.js';

const DIA = 24 * 60 * 60 * 1000;
const AHORA = Date.parse('2026-11-13T08:00:00Z');
const hace = (dias) => new Date(AHORA - dias * DIA).toISOString();

test('un lanzamiento reciente de la 3ª generación cuenta como nuevo', () => {
  const [sprite] = applyBatchNoveltyRules(
    [{ id: 'unbotheredfish_cursed', gen: 3, unreleased: false, releaseDate: hace(0.3) }],
    AHORA
  );
  assert.equal(sprite.isNew, true);
  assert.equal(sprite.noveltyReason, 'recent');
});

test('la 3ª generación tampoco se cuela si su lanzamiento ya paso los 7 dias', () => {
  const [viejo, nuevo] = applyBatchNoveltyRules(
    [
      { id: 'squibbly_gold', gen: 3, unreleased: false, releaseDate: hace(4) },
      { id: 'treasuremap_gold', gen: 3, unreleased: false, releaseDate: hace(8) }
    ],
    AHORA
  );
  assert.equal(viejo.isNew, true);
  assert.equal(nuevo.isNew, false);
  assert.equal(nuevo.noveltyReason, 'expired');
});

test('sin lanzamientos recientes, la ultima tanda de cualquier generacion se mantiene', () => {
  const [ultima, anterior] = applyBatchNoveltyRules(
    [
      { id: 'whitetiger_basic', gen: 3, unreleased: false, releaseDate: hace(10) },
      { id: 'honey_basic', gen: 2, unreleased: false, releaseDate: hace(20) }
    ],
    AHORA
  );
  assert.equal(ultima.isNew, true);
  assert.equal(ultima.noveltyReason, 'latest_drop');
  assert.equal(anterior.isNew, false);
});

test('un espiritu programado o no lanzado nunca es nuevo', () => {
  const [programado, sinFecha] = applyBatchNoveltyRules(
    [
      { id: 'piratecalamari_gold', gen: 3, unreleased: true, releaseDate: hace(-1) },
      { id: 'ghost_gem', unreleased: true }
    ],
    AHORA
  );
  assert.equal(programado.isNew, false);
  assert.equal(programado.noveltyReason, 'unreleased');
  assert.equal(sinFecha.isNew, false);
});

test('notNew apaga la novedad del lote aunque su fecha siga en la ventana', () => {
  const [sprite] = applyBatchNoveltyRules(
    [{ id: 'birthday_basic', gen: 2, unreleased: false, releaseDate: hace(2), notNew: true }],
    AHORA
  );
  assert.equal(sprite.isNew, false);
  assert.equal(sprite.noveltyReason, 'excluded');
});
