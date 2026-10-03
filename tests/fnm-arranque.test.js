// El arranque del tema de temporada vive en dos sitios a proposito: index.html tiene que
// decidir ANTES del primer pintado, sin esperar al bundle, y seasonalEvent.js lo decide
// despues (y para el resto de la sesion). Esta prueba impide que las dos verdades se
// separen: si alguien mueve una frontera o cambia la clave del intro en un solo lado,
// aqui revienta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FORTNITEMARES_START,
  FORTNITEMARES_END,
  INTRO_SEEN_KEY
} from '../src/config/seasonalEvent.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const arranque = html.match(/<script>([\s\S]*?)<\/script>/g)?.find((s) => s.includes('theme-fortnitemares'));

test('index.html trae el arranque del tema antes del primer pintado', () => {
  assert.ok(arranque, 'falta el script que enciende el tema sin esperar al bundle');
  assert.ok(
    arranque.indexOf('<div id="root">') === -1,
    'el arranque tiene que ir antes del root'
  );
});

test('las fronteras del arranque son las mismas que las de seasonalEvent', () => {
  const fechas = [...arranque.matchAll(/new Date\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(fechas.length, 2, 'el arranque debe fijar las dos fronteras');
  assert.equal(new Date(fechas[0]).getTime(), FORTNITEMARES_START.getTime());
  assert.equal(new Date(fechas[1]).getTime(), FORTNITEMARES_END.getTime());
});

test('la clave del intro del arranque es la misma que la de seasonalEvent', () => {
  assert.ok(arranque.includes(INTRO_SEEN_KEY), 'la clave del intro no coincide');
});

test('el arranque respeta a quien todavia no vio la cinematica', () => {
  assert.ok(
    arranque.includes('prefers-reduced-motion'),
    'debe contemplar a quien pidio menos movimiento: ese visitante nunca ve la cinematica'
  );
  assert.match(arranque, /if \(!vioIntro && !quieto\) return;/, 'la cinematica pendiente manda');
});
