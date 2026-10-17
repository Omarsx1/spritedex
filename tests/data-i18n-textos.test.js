// Diccionario de textos del juego en los tres idiomas: cada entrada tiene en y pt-BR completos,
// sin rastros de español y con el vocabulario de los diccionarios de interfaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const textos = JSON.parse(fs.readFileSync('src/data/i18n/textos.juego.json', 'utf8'));
const entradas = Object.entries(textos);
const LENGUAS = ['en', 'pt-BR'];

test('cada entrada tiene en y pt-BR no vacios', () => {
  const incompletas = entradas
    .filter(([, traduccion]) => LENGUAS.some((lang) => typeof traduccion[lang] !== 'string' || !traduccion[lang].trim()))
    .map(([es]) => es);
  assert.deepEqual(incompletas, []);
});

test('no hay idiomas extra en las entradas', () => {
  const extras = entradas.filter(([, traduccion]) => Object.keys(traduccion).sort().join() !== [...LENGUAS].sort().join());
  assert.deepEqual(extras.map(([es]) => es), []);
});

test('pt-BR no lleva signos de apertura del español', () => {
  const malas = entradas
    .filter(([, traduccion]) => /[¡¿]/.test(traduccion['pt-BR']))
    .map(([es]) => es);
  assert.deepEqual(malas, []);
});

test('ningun texto portugues arrastra palabras del español del juego', () => {
  const restos = /Polvo|Hackeo|Tormenta|Sobremarcha|Esprint|Burbuja de|Cofres de Reliquia|Roca de/i;
  const malas = entradas
    .filter(([, traduccion]) => restos.test(traduccion['pt-BR']))
    .map(([es]) => es);
  assert.deepEqual(malas, []);
});

test('el polvo estelar usa el mismo nombre que el diccionario de interfaz', () => {
  const ptBR = fs.readFileSync('src/i18n/locales/pt-BR.js', 'utf8');
  assert.match(ptBR, /"detalle\.polvoEstelar": "Poeira Estelar"/);
  assert.equal(textos['100 Polvo Estelar']['pt-BR'], '100 Poeira Estelar');
});

test('la corona de victoria se traduce como Coroa en pt-BR, igual que la interfaz', () => {
  // Coroa es el termino de los diccionarios de interfaz (carta.corona) en pt-BR.
  const coronas = entradas.filter(([es]) => /corona/i.test(es));
  assert.ok(coronas.length > 0);
  for (const [, traduccion] of coronas) {
    assert.match(traduccion['pt-BR'], /coroa/i);
  }
});
