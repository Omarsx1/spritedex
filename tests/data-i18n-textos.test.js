// Diccionario de textos del juego en los cuatro idiomas: cada entrada tiene en, pt-BR y pt-PT
// completos, sin rastros de español y con el vocabulario de los diccionarios de interfaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const textos = JSON.parse(fs.readFileSync('src/data/i18n/textos.juego.json', 'utf8'));
const entradas = Object.entries(textos);
const LENGUAS = ['en', 'pt-BR', 'pt-PT'];

test('cada entrada tiene en, pt-BR y pt-PT no vacios', () => {
  const incompletas = entradas
    .filter(([, traduccion]) => LENGUAS.some((lang) => typeof traduccion[lang] !== 'string' || !traduccion[lang].trim()))
    .map(([es]) => es);
  assert.deepEqual(incompletas, []);
});

test('no hay idiomas extra en las entradas', () => {
  const extras = entradas.filter(([, traduccion]) => Object.keys(traduccion).sort().join() !== [...LENGUAS].sort().join());
  assert.deepEqual(extras.map(([es]) => es), []);
});

test('pt-BR y pt-PT no llevan signos de apertura del español', () => {
  const malas = entradas
    .filter(([, traduccion]) => ['pt-BR', 'pt-PT'].some((lang) => /[¡¿]/.test(traduccion[lang])))
    .map(([es]) => es);
  assert.deepEqual(malas, []);
});

test('pt-PT evita el tratamiento "você" y el gerundio brasileño "estou a"', () => {
  const malas = entradas
    .filter(([, traduccion]) => /\bvocê\b|\bestou a\b|\bestá a\b|\bestamos a\b/i.test(traduccion['pt-PT']))
    .map(([es]) => es);
  assert.deepEqual(malas, []);
});

test('ningun texto portugues arrastra palabras del español del juego', () => {
  const restos = /Polvo|Hackeo|Tormenta|Sobremarcha|Esprint|Burbuja de|Cofres de Reliquia|Roca de/i;
  const malas = entradas
    .filter(([, traduccion]) => ['pt-BR', 'pt-PT'].some((lang) => restos.test(traduccion[lang])))
    .map(([es]) => es);
  assert.deepEqual(malas, []);
});

test('el polvo estelar usa el mismo nombre que los diccionarios de interfaz', () => {
  const ptBR = fs.readFileSync('src/i18n/locales/pt-BR.js', 'utf8');
  const ptPT = fs.readFileSync('src/i18n/locales/pt-PT.js', 'utf8');
  assert.match(ptBR, /"detalle\.polvoEstelar": "Poeira Estelar"/);
  assert.match(ptPT, /"detalle\.polvoEstelar": "Pó Estelar"/);
  assert.equal(textos['100 Polvo Estelar']['pt-BR'], '100 Poeira Estelar');
  assert.equal(textos['100 Polvo Estelar']['pt-PT'], '100 Pó Estelar');
});

test('la corona de victoria se traduce como Coroa en pt-BR y pt-PT, igual que la interfaz', () => {
  // Coroa es el termino de los diccionarios de interfaz (carta.corona) en ambos idiomas.
  const coronas = entradas.filter(([es]) => /corona/i.test(es));
  assert.ok(coronas.length > 0);
  for (const [, traduccion] of coronas) {
    assert.match(traduccion['pt-BR'], /coroa/i);
    assert.match(traduccion['pt-PT'], /coroa/i);
  }
});
