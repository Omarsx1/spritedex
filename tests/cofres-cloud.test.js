import test from 'node:test';
import assert from 'node:assert/strict';

import { fusionarCofres, sinHistorial } from '../src/utils/cofresCloud.js';

const base = {
  total: 10,
  sesion: 4,
  token: false,
  tokenFecha: null,
  dias: { '2026-11-12': 6, '2026-11-13': 4 },
  historial: [{ total: 9 }]
};

test('la fusión conserva el mayor total y el mayor de cada día', () => {
  const remoto = {
    total: 12,
    sesion: 0,
    token: false,
    tokenFecha: null,
    dias: { '2026-11-12': 8, '2026-11-11': 3 }
  };
  const r = fusionarCofres(base, remoto);
  assert.equal(r.total, 12);
  assert.equal(r.sesion, 4);
  assert.deepEqual(r.dias, { '2026-11-12': 8, '2026-11-13': 4, '2026-11-11': 3 });
  assert.deepEqual(r.historial, base.historial, 'el historial de deshacer es local');
});

test('el token se mantiene si aparece en cualquiera de los dos lados', () => {
  const r = fusionarCofres(base, { token: true, tokenFecha: '2026-11-10', dias: {} });
  assert.equal(r.token, true);
  assert.equal(r.tokenFecha, '2026-11-10');
});

test('sin remoto se queda el local tal cual', () => {
  assert.deepEqual(fusionarCofres(base, null), base);
});

test('al subir no se manda el historial de deshacer', () => {
  assert.deepEqual(sinHistorial(base), {
    total: 10,
    sesion: 4,
    token: false,
    tokenFecha: null,
    dias: { '2026-11-12': 6, '2026-11-13': 4 }
  });
});
