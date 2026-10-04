// Reglas del nombre en la lona: como se reparte en lineas y como crece para llenar la
// banda entre el espiritu y la linea del estado.
//
// Corren con el runner nativo de Node. El modulo del canvas se puede importar sin DOM
// porque la medicion de texto se inyecta: aqui se usa un ctx de mentira cuyo ancho es
// lineal con el tamano de fuente, que es exactamente como se comporta el ctx real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpriteNameLines, repartirNombreEnLineas } from '../src/utils/canvasExporter.js';

// Ancho medio por caracter como fraccion del tamano de fuente.
const ANCHO_POR_CARACTER = 0.55;

function ctxFalso() {
  return {
    font: '',
    measureText(texto) {
      const tamano = /(\d+(?:\.\d+)?)px/.exec(this.font);
      const px = tamano ? Number(tamano[1]) : 10;
      return {
        width: texto.length * px * ANCHO_POR_CARACTER,
        actualBoundingBoxAscent: px * 0.8,
        actualBoundingBoxDescent: px * 0.2
      };
    }
  };
}

const medirAncho = (ctx) => (texto) => {
  ctx.font = '800 100px "Outfit"';
  return ctx.measureText(texto).width;
};

// Geometria real de la ficha de la captura: tarjeta de 524 px de ancho con una banda de
// 88 px de alto entre el espiritu y la linea del estado.
const BANDA = { ancho: 493, alto: 88, objetivo: 48 };

test('la familia conocida manda sobre el corte por ancho', () => {
  // En una ficha estrecha las dos opciones son de dos lineas, y el corte por ancho
  // preferiria "Impulso" / "aterrador Dorado". La familia manda porque parte el nombre
  // por donde se lee.
  const ajuste = getSpriteNameLines(
    ctxFalso(),
    'Impulso aterrador Dorado',
    300,
    88,
    48,
    ['Impulso aterrador', 'Spooky Dash']
  );
  assert.deepEqual(ajuste.lines, ['Impulso aterrador', 'Dorado']);
});

test('sin familia conocida el corte busca la linea mas larga mas corta', () => {
  const ctx = ctxFalso();
  const candidatos = repartirNombreEnLineas('Alfa Beta Gammagamma Delta', null, medirAncho(ctx));
  assert.deepEqual(candidatos[0], ['Alfa Beta', 'Gammagamma Delta']);
});

test('el reparto por familia funciona con el nombre de familia en ingles o en espanol', () => {
  // En la lona el nombre completo va en espanol pero se pasaba la familia en ingles
  // primero, asi que la regla de familia no se aplicaba nunca. Se aceptan las dos.
  assert.deepEqual(
    repartirNombreEnLineas('Impulso aterrador Cazarrecompensas', ['Spooky Dash', 'Impulso aterrador']),
    [['Impulso aterrador', 'Cazarrecompensas']]
  );
});

test('la variante Hacker de Botín conserva su reparto de diseno', () => {
  const candidatos = repartirNombreEnLineas('Impulso aterrador Hacker de Botín', ['Impulso aterrador', 'Spooky Dash']);
  assert.deepEqual(candidatos, [['Impulso aterrador', 'Hacker de Botín']]);
});

test('el nombre largo se reparte en dos lineas porque asi es mas grande', () => {
  const ajuste = getSpriteNameLines(ctxFalso(), 'Impulso aterrador Cazarrecompensas', BANDA.ancho, BANDA.alto, BANDA.objetivo, null);
  assert.equal(ajuste.lines.length, 2);
  // El tope viejo era 24 px: en la ficha de la captura el nombre tiene que usarlo entero.
  assert.ok(ajuste.fontSize > 30, 'esperaba un nombre grande, salio ' + ajuste.fontSize);
});

test('el nombre corto se queda en una linea y no se parte por gusto', () => {
  const ajuste = getSpriteNameLines(ctxFalso(), 'El Ciervo Dorado', BANDA.ancho, BANDA.alto, BANDA.objetivo, null);
  assert.equal(ajuste.lines.length, 1);
});

test('el bloque nunca se sale de su banda (ni a lo ancho ni a lo alto)', () => {
  const ctx = ctxFalso();
  const nombres = [
    'Impulso aterrador Cazarrecompensas',
    'Impulso aterrador Dorado',
    'El Ciervo Dorado',
    'Vampiro',
    'Aventurero de la Suerte',
    'Impulso aterrador Hacker de Botín'
  ];
  for (const nombre of nombres) {
    const ajuste = getSpriteNameLines(ctx, nombre, BANDA.ancho, BANDA.alto, BANDA.objetivo, null);
    assert.ok(ajuste.ancho <= BANDA.ancho + 0.01, nombre + ' se sale a lo ancho');
    assert.ok(ajuste.alto <= BANDA.alto + 0.01, nombre + ' se sale a lo alto');
  }
});

test('la banda manda: mas alto disponible, nombre mas grande', () => {
  const chica = getSpriteNameLines(ctxFalso(), 'El Ciervo Dorado', 240, 46, 26, null);
  const grande = getSpriteNameLines(ctxFalso(), 'El Ciervo Dorado', 493, 88, 48, null);
  assert.ok(grande.fontSize > chica.fontSize, 'el nombre no crecio con la ficha');
  assert.ok(grande.fontSize <= 52, 'el nombre se paso del techo de cordura');
});
