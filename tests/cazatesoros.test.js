// Cazatesoros is a local preview for the next season. These seams break
// silently, so they are pinned here: production isolation, the developer
// overrides, and the precedence against Fortnitemares.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCazatesorosState,
  resolveSeasonalTheme,
  CAZATESOROS_CLASS,
  CAZATESOROS_STORAGE_KEY
} from '../src/config/cazatesoros.js';

test('production activates the launched season and keeps the escape hatch', () => {
  // Lanzada la temporada, produccion enciende el tema por defecto.
  assert.equal(resolveCazatesorosState({ isDev: false }), true);
  assert.equal(resolveCazatesorosState({ isDev: false, search: '?cazatesoros=1' }), true);
  // La bandera y el override siguen apagandolo.
  assert.equal(resolveCazatesorosState({ isDev: false, search: '?cazatesoros=0' }), false);
  assert.equal(resolveCazatesorosState({ isDev: false, storedOverride: 'false' }), false);
});

test('development honours the query flag before the stored override', () => {
  assert.equal(resolveCazatesorosState({ isDev: true, search: '?cazatesoros=0', storedOverride: 'true' }), false);
  assert.equal(resolveCazatesorosState({ isDev: true, search: '?cazatesoros=false', storedOverride: 'true' }), false);
  assert.equal(resolveCazatesorosState({ isDev: true, search: '?cazatesoros=1', storedOverride: 'false' }), true);
  assert.equal(resolveCazatesorosState({ isDev: true, search: '?cazatesoros=true', storedOverride: 'false' }), true);
});

test('development defaults on and still honours the stored override', () => {
  assert.equal(resolveCazatesorosState({ isDev: true }), true);
  assert.equal(resolveCazatesorosState({ isDev: true, storedOverride: 'false' }), false);
  assert.equal(resolveCazatesorosState({ isDev: true, storedOverride: 'true' }), true);
});

test('Cazatesoros wins over Fortnitemares when both are requested', () => {
  assert.deepEqual(
    resolveSeasonalTheme({ cazatesorosActive: true, fortnitemaresActive: true }),
    { cazatesoros: true, fortnitemares: false }
  );
  assert.deepEqual(
    resolveSeasonalTheme({ cazatesorosActive: false, fortnitemaresActive: true }),
    { cazatesoros: false, fortnitemares: true }
  );
  assert.deepEqual(
    resolveSeasonalTheme({ cazatesorosActive: false, fortnitemaresActive: false }),
    { cazatesoros: false, fortnitemares: false }
  );
});

test('the theme contract exposes stable class and storage identifiers', () => {
  assert.equal(CAZATESOROS_CLASS, 'theme-cazatesoros');
  assert.equal(CAZATESOROS_STORAGE_KEY, 'spritedex_cazatesoros_override');
});
