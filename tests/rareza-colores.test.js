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
import { COLORES_RAREZA, RAREZA_POR_DEFECTO, coloresDeRareza, colorDeRareza, estiloBadgeRareza } from '../src/data/rarezaColores.js';
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

test('el color se resuelve por nombre, por clave, con espacios y con mayusculas', () => {
  assert.equal(colorDeRareza('Special'), '#5dffe4');
  assert.equal(colorDeRareza('special'), '#5dffe4');
  assert.equal(colorDeRareza('  SPECIAL  '), '#5dffe4');
  assert.equal(colorDeRareza('Mythic'), '#fff0a6');
  assert.equal(colorDeRareza(''), null);
  assert.equal(colorDeRareza(null), null);
  assert.equal(colorDeRareza(undefined), null);
  assert.equal(coloresDeRareza('Loot Hacker'), null, 'una rareza fuera del catalogo no tiene color propio');
});

test('el texto de cada badge llega a 4.5:1 sobre su fondo (AA, criterio 1.4.3)', () => {
  // El texto del badge mide 11 px y va en negrita: es texto NORMAL, no grande, asi que necesita
  // 4.5:1. Epic y Common no llegaban cuando se midio por primera vez.
  const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  const lum = (h) => rgb(h).map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  for (const [clase, entrada] of Object.entries(COLORES_RAREZA)) {
    if (entrada.degradadoTexto) continue; // Special va sobre la banda; se mide abajo parada a parada.
    const r = ratio(entrada.color, entrada.bg);
    assert.ok(r >= 4.5, clase + ': ' + r.toFixed(2) + ':1 sobre su fondo, por debajo de 4.5');
  }

  // Special no tiene fondo plano: hay que mirar la PEOR parada de la banda.
  const paradas = COLORES_RAREZA.special.degradadoTexto.match(/#[0-9a-f]{6}/gi) || [];
  assert.ok(paradas.length >= 7, 'la banda deberia declarar sus paradas');
  for (const parada of paradas) {
    const r = ratio('#000000', parada);
    assert.ok(r >= 4.5, 'Special: negro sobre ' + parada + ' da ' + r.toFixed(2) + ':1');
  }
});

test('el estilo del badge sale del mapa y distingue la banda del fondo plano', () => {
  // Fondo plano: el fondo y el color del texto de su rareza.
  assert.deepEqual(estiloBadgeRareza('Rare'), { background: '#00458a', color: '#00fffb' });
  assert.deepEqual(estiloBadgeRareza('Mythic'), { background: '#7c5d26', color: '#fff0a6' });
  // Special no es un color: es la banda de arcoiris de las tarjetas, con el texto negro.
  const especial = estiloBadgeRareza('Special');
  assert.match(especial.background, /^linear-gradient\(15deg/);
  assert.equal(especial.color, '#000');
  assert.equal(especial.backgroundSize, '200% 100%');
  // Una rareza desconocida no tiene badge: quien llama decide que hacer.
  assert.equal(estiloBadgeRareza('Loot Hacker'), null);
});

test('la tabla de la guia pinta cada rareza como badge, y Special con su banda', () => {
  const datos = {
    total: 278, familias: 24, costos: 15, dropMin: 0.75, dropMax: 5, fecha: '2026-10-04',
    porRareza: [{ nombre: 'Special', n: 120 }, { nombre: 'Mythic', n: 6 }]
  };
  const html = htmlGuia(datos, 'es');
  assert.ok(html.includes('class="rareza-badge"'), 'falta el badge de rareza');
  assert.ok(html.includes('style="background:#7c5d26;color:#fff0a6"'), 'Mythic deberia llevar su fondo y su color');
  // Special no es un color: es la banda de arcoiris de las tarjetas, con el texto negro.
  assert.match(html, /style="background:linear-gradient\(15deg[^"]*color:#000"/, 'Special deberia llevar la banda con texto negro');
  // Y el badge va dentro del encabezado de fila, no en lugar de el.
  assert.match(html, /<th scope="row"><span class="rareza-badge"/);
});
