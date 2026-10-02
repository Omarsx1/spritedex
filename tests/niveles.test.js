// La primera moneda es un interruptor y el cartel lo promete desde siempre:
// "Toca para desmarcar". El manejador ponia owned:true pasara lo que pasara, asi
// que desmarcar desde ahi era imposible y el cartel mentia. Esto lo fija.
import test from 'node:test';
import assert from 'node:assert/strict';

import { estadoAlTocarNivel } from '../src/utils/niveles.js';

test('la primera moneda marca cuando el espiritu no estaba atrapado', () => {
  assert.deepEqual(estadoAlTocarNivel(undefined, 1), { owned: true, level: 1 });
  assert.deepEqual(estadoAlTocarNivel({ owned: false, level: 1 }, 1), { owned: true, level: 1 });
});

test('volver a tocar la primera moneda desmarca, que es lo que promete el cartel', () => {
  assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 1 }, 1), { owned: false, level: 1 });
});

test('desde un nivel mas alto, la primera moneda baja a 1 en vez de desmarcar', () => {
  assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 4 }, 1), { owned: true, level: 1 });
});

test('el resto de monedas fijan su nivel y nunca desmarcan', () => {
  for (const nivel of [2, 3, 4, 5]) {
    assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 1 }, nivel), { owned: true, level: nivel });
    assert.deepEqual(estadoAlTocarNivel({ owned: false, level: 1 }, nivel), { owned: true, level: nivel });
  }
});

test('el nivel pedido se limita al rango real y no acepta basura', () => {
  assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 2 }, 9), { owned: true, level: 5 });
  assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 2 }, 0), { owned: true, level: 1 });
  assert.deepEqual(estadoAlTocarNivel({ owned: true, level: 2 }, 'x'), { owned: true, level: 1 });
});
