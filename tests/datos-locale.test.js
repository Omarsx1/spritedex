// El texto que viene de los DATOS del juego (habilidad, perk, ubicacion y coste) no puede
// pasar por t(): se traduce por catalogo, con el texto en español como clave. Estas pruebas
// garantizan que ninguna cadena se quede sin traduccion y que la extraccion no se encoja.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const leer = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'));
const indice = leer('src/data/fortnite_gg_index.json');
const traducciones = leer('src/data/i18n/textos.juego.json');
const spritesData = fs.readFileSync('src/data/spritesData.js', 'utf8');

// Un coste tipo "2,000" o "0" no se traduce: es un numero.
const esNumerico = (texto) => /^[0-9.,%\s]+$/.test(texto);

function cadenasDeDatos() {
  const unicas = new Set();
  for (const item of indice) {
    for (const campo of ['ability', 'specialPerk', 'location', 'summonCost']) {
      const valor = String(item[campo] || '').trim();
      if (valor) unicas.add(valor);
    }
  }
  const patrones = [
    /ability:\s*'([^'\n]+)'/g,
    /specialPerk:\s*'([^'\n]+)'/g,
    /'([^'\n]*Polvo Estelar[^'\n]*)'/g,
    /'([^'\n]*(?:Cofres de Sprite|bonificaciones pasivas)[^'\n]*)'/g
  ];
  for (const patron of patrones) {
    for (const coincidencia of spritesData.matchAll(patron)) unicas.add(coincidencia[1]);
  }
  return [...unicas].filter((texto) => texto && !esNumerico(texto));
}

test('la extraccion alcanza todas las cadenas de datos', () => {
  // Si alguien cambia los archivos de datos y la extraccion deja de encontrarlas, aqui salta.
  assert.ok(cadenasDeDatos().length >= 80, 'solo se encontraron ' + cadenasDeDatos().length + ' cadenas');
});

test('toda cadena de datos del juego tiene su traduccion al ingles', () => {
  const sinTraduccion = cadenasDeDatos().filter((texto) => !traducciones[texto]);
  assert.deepEqual(sinTraduccion, [], 'sin traducir:\n' + sinTraduccion.join('\n'));
});

test('no sobran traducciones huerfanas', () => {
  const usadas = new Set(cadenasDeDatos());
  const huerfanas = Object.keys(traducciones).filter((clave) => !usadas.has(clave));
  assert.deepEqual(huerfanas, [], 'traducciones que ya no usa nadie:\n' + huerfanas.join('\n'));
});

test('ninguna traduccion queda vacia ni arrastra texto en español', () => {
  const malas = Object.entries(traducciones)
    .filter(([, ingles]) => !ingles.trim() || /Polvo Estelar|espíritu|¡|ñ|Cofres de/i.test(ingles))
    .map(([clave]) => clave);
  assert.deepEqual(malas, []);
});

test('el texto del juego conserva su formato en ingles', () => {
  assert.equal(
    traducciones['Hackeo de botín: aumenta la calidad de los cofres y cajas de suministros cercanas.'],
    'Loot hack: improves the quality of nearby chests and supply drops.'
  );
  assert.equal(traducciones['2,000 Polvo Estelar'], '2,000 Stardust');
  assert.equal(traducciones['Distribuido por la isla de Fortnite'], 'Distributed across the Fortnite island');
});
