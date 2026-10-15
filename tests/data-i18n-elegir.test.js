// Eleccion de texto y nombre por idioma: es y en no cambian, pt-BR y pt-PT tienen su texto
// (pt-BR y pt-PT usan el nombre en ingles de forma temporal) y todo cae a es si falta.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { elegirNombreFamilia, elegirTextoJuego, IDIOMAS_NOMBRE_EN } from '../src/data/i18n/elegir.js';
import { FAMILY_NAMES_MAP } from '../src/data/nombresEspiritus.js';
import { pickName } from '../src/utils/spriteName.js';

const leer = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'));
const textos = leer('src/data/i18n/textos.juego.json');
const familiasEn = leer('src/data/i18n/familias.en.json');

const ESTELAR = '2,000 Polvo Estelar';

test('pickTexto devuelve el texto de cada uno de los cuatro idiomas', () => {
  assert.equal(elegirTextoJuego(textos, ESTELAR, 'es'), ESTELAR);
  assert.equal(elegirTextoJuego(textos, ESTELAR, 'en'), '2,000 Stardust');
  assert.equal(elegirTextoJuego(textos, ESTELAR, 'pt-BR'), '2.000 Poeira Estelar');
  assert.equal(elegirTextoJuego(textos, ESTELAR, 'pt-PT'), '2 000 Pó Estelar');
});

test('pickTexto cae al español si el texto no existe en el diccionario', () => {
  const desconocido = 'Texto que nadie ha traducido';
  for (const lang of ['en', 'pt-BR', 'pt-PT']) {
    assert.equal(elegirTextoJuego(textos, desconocido, lang), desconocido);
  }
});

test('pickTexto cae al español si el idioma pedido no está en el diccionario', () => {
  assert.equal(elegirTextoJuego(textos, ESTELAR, 'fr'), ESTELAR);
  assert.equal(elegirTextoJuego(textos, ESTELAR, undefined), ESTELAR);
});

test('pickTexto cae al español si la entrada no tiene el idioma pedido', () => {
  const parcial = { 'Hola del juego': { en: 'Game hello' } };
  assert.equal(elegirTextoJuego(parcial, 'Hola del juego', 'pt-BR'), 'Hola del juego');
  assert.equal(elegirTextoJuego(parcial, 'Hola del juego', 'en'), 'Game hello');
});

test('pickTexto no modifica valores vacios', () => {
  assert.equal(elegirTextoJuego(textos, '', 'pt-BR'), '');
  assert.equal(elegirTextoJuego(textos, null, 'pt-PT'), null);
  assert.equal(elegirTextoJuego(textos, undefined, 'en'), undefined);
});

test('es y en devuelven lo mismo que antes del cambio', () => {
  // Valores en ingles fijados a mano: si cambian, la UI en ingles cambia sin querer.
  assert.equal(
    elegirTextoJuego(textos, 'Hackeo de botín: aumenta la calidad de los cofres y cajas de suministros cercanas.', 'en'),
    'Loot hack: improves the quality of nearby chests and supply drops.'
  );
  assert.equal(elegirTextoJuego(textos, 'Distribuido por la isla de Fortnite', 'en'), 'Distributed across the Fortnite island');
  assert.equal(elegirTextoJuego(textos, 'Distribuido por la isla de Fortnite', 'es'), 'Distribuido por la isla de Fortnite');
});

test('pickFamilyName: es conserva el nombre en español y en ingles el de su catalogo', () => {
  const familias = Object.keys(FAMILY_NAMES_MAP).filter((id) => familiasEn[id]);
  assert.ok(familias.length > 0, 'debe haber familias con nombre en ingles');
  for (const id of familias) {
    assert.equal(elegirNombreFamilia(id, 'es', FAMILY_NAMES_MAP, familiasEn), FAMILY_NAMES_MAP[id]);
    assert.equal(elegirNombreFamilia(id, 'en', FAMILY_NAMES_MAP, familiasEn), familiasEn[id]);
  }
});

test('pickFamilyName: pt-BR usa su mapa; pt-PT sigue en ingles, nunca en español', () => {
  const familias = Object.keys(FAMILY_NAMES_MAP).filter((id) => familiasEn[id]);
  const ptBr = { honey: 'Mel', klombo: 'Klombo' };
  assert.equal(elegirNombreFamilia('honey', 'pt-BR', FAMILY_NAMES_MAP, familiasEn, ptBr), 'Mel');
  assert.equal(elegirNombreFamilia('honey', 'pt-BR', FAMILY_NAMES_MAP, familiasEn), familiasEn.honey);
  for (const id of familias) {
    assert.equal(elegirNombreFamilia(id, 'pt-PT', FAMILY_NAMES_MAP, familiasEn), familiasEn[id]);
  }
});

test('pickFamilyName: sin familia devuelve vacio y con familia desconocida devuelve el id', () => {
  for (const lang of ['es', 'en', 'pt-BR', 'pt-PT']) {
    assert.equal(elegirNombreFamilia('', lang, FAMILY_NAMES_MAP, familiasEn), '');
    assert.equal(elegirNombreFamilia('familia-inexistente', lang, FAMILY_NAMES_MAP, familiasEn), 'familia-inexistente');
  }
});

test('la lista de idiomas con nombre en ingles es exactamente en y pt-PT', () => {
  assert.deepEqual(IDIOMAS_NOMBRE_EN, ['en', 'pt-PT']);
});

test('pickName: pt-BR usa su nombre; pt-PT sigue en ingles; es y en no cambian', () => {
  const sprite = { fullName: 'Oro Jonesy', fullNameEn: 'Gold Jonesy Sprite', fullNamePtBr: 'Jonesy Dourado' };
  assert.equal(pickName(sprite, 'es'), 'Oro Jonesy');
  assert.equal(pickName(sprite, 'en'), 'Gold Jonesy Sprite');
  assert.equal(pickName(sprite, 'pt-BR'), 'Jonesy Dourado');
  assert.equal(pickName(sprite, 'pt-PT'), 'Gold Jonesy Sprite');
});

test('pickName: sin nombre en ingles, pt cae al español como en/es', () => {
  const sinIngles = { fullName: 'Oro Jonesy' };
  assert.equal(pickName(sinIngles, 'en'), 'Oro Jonesy');
  assert.equal(pickName(sinIngles, 'pt-BR'), 'Oro Jonesy');
  assert.equal(pickName(sinIngles, 'pt-PT'), 'Oro Jonesy');
  assert.equal(pickName(null, 'pt-BR'), '');
});
