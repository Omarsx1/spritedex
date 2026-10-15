// El arranque del tema de temporada vive en dos sitios a proposito: index.html tiene que
// decidir ANTES del primer pintado, sin esperar al bundle, y seasonalEvent.js lo decide
// despues (y para el resto de la sesion). Esta prueba impide que las dos verdades se
// separen: si alguien mueve una frontera en un solo lado, aqui revienta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FORTNITEMARES_START,
  FORTNITEMARES_END
} from '../src/config/seasonalEvent.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const arranque = html.match(/<script>([\s\S]*?)<\/script>/g)?.find((s) => s.includes('theme-fortnitemares'));
const css = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8');

test('index.html trae el arranque del tema antes del primer pintado', () => {
  assert.ok(arranque, 'falta el script que enciende el tema sin esperar al bundle');
  assert.ok(
    html.indexOf(arranque) < html.indexOf('<div id="root">'),
    'el arranque tiene que ir antes del root'
  );
});

test('las fronteras del arranque son las mismas que las de seasonalEvent', () => {
  const fechas = [...arranque.matchAll(/new Date\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(fechas.length, 2, 'el arranque debe fijar las dos fronteras');
  assert.equal(new Date(fechas[0]).getTime(), FORTNITEMARES_START.getTime());
  assert.equal(new Date(fechas[1]).getTime(), FORTNITEMARES_END.getTime());
});

test('el bosque viaja en el armazon, antes del root', () => {
  const bosques = [...html.matchAll(/class="fnm-forest"/g)];
  assert.equal(bosques.length, 1, 'debe haber una sola capa de bosque en el armazon');
  assert.ok(
    html.indexOf('class="fnm-forest"') < html.indexOf('<div id="root">'),
    'el bosque tiene que existir antes que el root'
  );
});

test('sin la clase del tema el bosque se queda oculto', () => {
  const regla = css.match(/html:not\(\.theme-fortnitemares\) \.fnm-forest \{([^}]*)\}/);
  assert.ok(regla, 'sin la clase del tema el bosque no debe verse');
  assert.match(regla[1], /opacity:\s*0/, 'el bosque debe quedar transparente');
  assert.match(
    regla[1],
    /animation:\s*none/,
    'sin animation none, fnm-forest-light anima opacity y le gana a la regla: el bosque se veria fuera de temporada'
  );
});
