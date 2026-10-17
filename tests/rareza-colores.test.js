// Los colores de rareza viven en un modulo plano (src/data/rarezaColores.js) porque el modelo de
// la guia (src/seo/guia.js) corre en Node y no puede importar spritesData.js: ese arrastra los JSON
// del catalogo y Node exige el atributo de importacion. Ese corte crea un riesgo real —que las dos
// copias se separen— y aqui se corta.
//
// spritesData.js se lee COMO TEXTO a proposito: no se puede importar desde estas pruebas, y lo que
// hay que vigilar es justamente que no vuelva a tener colores escritos a mano.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLORES_RAREZA, RAREZA_POR_DEFECTO, coloresDeRareza, colorDeRareza, degradadoDeRareza } from '../src/data/rarezaColores.js';
import { htmlGuia } from '../src/seo/contenido.js';

const spritesData = readFileSync(new URL('../src/data/spritesData.js', import.meta.url), 'utf8');
const bloqueRarities = spritesData.slice(
  spritesData.indexOf('export const RARITIES'),
  spritesData.indexOf('function resolverRareza')
);

test('cada rareza trae las piezas que necesitan las tarjetas y la guia', () => {
  for (const [clase, entrada] of Object.entries(COLORES_RAREZA)) {
    for (const campo of ['color', 'bg', 'border', 'classKey', 'cardGradient']) {
      assert.ok(entrada[campo], clase + ' no tiene ' + campo);
    }
    assert.equal(entrada.classKey, clase, 'la clave del mapa y classKey no coinciden en ' + clase);
    assert.match(entrada.color, /^#[0-9a-f]{6}$/i, clase + ': color con formato raro');
  }
  // El color por defecto no es el de `special`: el borde cambia a proposito, y ya venia asi.
  assert.notEqual(RAREZA_POR_DEFECTO.border, COLORES_RAREZA.special.border);
});

test('spritesData delega los colores en el mapa en vez de volver a escribirlos', () => {
  assert.ok(
    bloqueRarities.includes('COLORES_RAREZA'),
    'RARITIES deberia construir sus entradas desde COLORES_RAREZA'
  );
  const aMano = bloqueRarities.match(/#[0-9a-f]{6}/i);
  assert.equal(aMano, null, 'RARITIES volvio a tener un color escrito a mano: ' + (aMano ? aMano[0] : ''));
});

test('el color y el degradado se resuelven por nombre, por clave, con espacios y con mayusculas', () => {
  assert.equal(colorDeRareza('Special'), '#5dffe4');
  assert.equal(colorDeRareza('special'), '#5dffe4');
  assert.equal(colorDeRareza('  SPECIAL  '), '#5dffe4');
  assert.equal(colorDeRareza('Mythic'), '#fff0a6');
  // Solo Special lleva degradado: es la banda de arcoiris de las tarjetas.
  assert.ok(degradadoDeRareza('Special'), 'Special deberia llevar degradado');
  assert.equal(degradadoDeRareza('Rare'), null);
  assert.equal(colorDeRareza(''), null);
  assert.equal(colorDeRareza(null), null);
  assert.equal(colorDeRareza(undefined), null);
  assert.equal(coloresDeRareza('Loot Hacker'), null, 'una rareza fuera del catalogo no tiene color propio');
});

test('el degradado de la guia es el mismo que el de las tarjetas en la hoja de la app', () => {
  // La cadena vive dos veces —mapa y CSS— porque CSS no lee de JavaScript. Esto impide que se paren.
  const indexCss = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8');
  const degradado = degradadoDeRareza('Special');
  assert.ok(
    indexCss.includes(degradado),
    'el arcoiris de index.css ya no coincide con el del mapa compartido'
  );
});

test('la tabla de la guia pinta cada rareza, y Special con su degradado', () => {
  const datos = {
    total: 278, familias: 24, costos: 15, dropMin: 0.75, dropMax: 5, fecha: '2026-10-04',
    porRareza: [{ nombre: 'Special', n: 120 }, { nombre: 'Mythic', n: 6 }]
  };
  const html = htmlGuia(datos, 'es');
  assert.ok(html.includes('class="rareza-arcoiris"'), 'Special deberia salir con su degradado, no con un color plano');
  assert.ok(html.includes('style="color: #fff0a6"'), 'Mythic deberia salir con su color plano');
  // El degradado nunca va como color plano: si alguien lo mete ahi, el texto sale transparente.
  assert.ok(!html.includes('color: linear-gradient'), 'un degradado no puede ir en la propiedad color');
});
