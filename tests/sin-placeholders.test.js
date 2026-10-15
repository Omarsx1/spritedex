// Los perks y habilidades vienen de fortnite.gg. Un texto de relleno escrito a mano en
// spritesData.js tapa el dato real del scrapeo, asi que no debe volver a aparecer.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const spritesData = fs.readFileSync('src/data/spritesData.js', 'utf8');

test('no hay textos de relleno tapando el perk del scrapeo', () => {
  assert.doesNotMatch(spritesData, /Sin confirmar/i);
});
