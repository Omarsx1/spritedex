// El español es el original y el ingles su traduccion: si alguien agrega una clave en un
// idioma y se olvida del otro, la app mostraria la clave cruda. Esto lo corta en seco.
import test from 'node:test';
import assert from 'node:assert/strict';
import es from '../src/i18n/locales/es.js';
import en from '../src/i18n/locales/en.js';

test('es y en tienen exactamente las mismas claves', () => {
  const sinIngles = Object.keys(es).filter((k) => !(k in en));
  const sinEspanol = Object.keys(en).filter((k) => !(k in es));
  assert.deepEqual(sinIngles, [], 'claves sin traduccion al ingles: ' + sinIngles.join(', '));
  assert.deepEqual(sinEspanol, [], 'claves sin texto en español: ' + sinEspanol.join(', '));
});

test('ninguna traduccion queda vacia', () => {
  const vacias = [];
  for (const [idioma, dicc] of Object.entries({ es, en })) {
    for (const [clave, valor] of Object.entries(dicc)) {
      if (typeof valor !== 'string' || valor.trim() === '') vacias.push(idioma + ':' + clave);
    }
  }
  assert.deepEqual(vacias, []);
});

test('las variables {x} de cada clave coinciden en los dos idiomas', () => {
  const variables = (texto) => (String(texto).match(/\{(\w+)\}/g) || []).sort().join(',');
  const desajustes = Object.keys(es)
    .filter((k) => variables(es[k]) !== variables(en[k]))
    .map((k) => k + ' (' + variables(es[k]) + ' vs ' + variables(en[k]) + ')');
  assert.deepEqual(desajustes, []);
});

test('la marca y el dominio del canvas son iguales en los dos idiomas', () => {
  assert.equal(es['lona.marca'], en['lona.marca']);
  assert.match(es['lona.marca'], /spritedex\.gg/);
  assert.doesNotMatch(es['lona.marca'], /spritedex\.com/);
});
