// El enlace de compartir es la pieza que sustituye al acceso por codigo: con token concede
// solo ver la coleccion y se puede revocar. La construccion es pura y por eso se prueba aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl, normalizeFriendCode } from '../src/utils/shareUrl.js';

test('con token, el enlace lleva el token y no el codigo', () => {
  const url = buildShareUrl('https://spritedex.gg/amigos', 'a1b2c3d4e5f6', 'SDEX-3CDB');
  assert.equal(url, 'https://spritedex.gg/amigos?share=a1b2c3d4e5f6');
  assert.ok(!url.includes('code='), 'no debe llevar el codigo de identidad');
});

test('sin token, cae al enlace por codigo', () => {
  assert.equal(
    buildShareUrl('https://spritedex.gg/amigos', '', '3cdb'),
    'https://spritedex.gg/amigos?code=SDEX-3CDB'
  );
  assert.equal(
    buildShareUrl('https://spritedex.gg/amigos', null, 'SDEX-3CDB'),
    'https://spritedex.gg/amigos?code=SDEX-3CDB'
  );
});

test('el enlace conserva la ruta donde se genero', () => {
  assert.equal(
    buildShareUrl('https://spritedex.gg/en/amigos', 'tok', 'SDEX-3CDB'),
    'https://spritedex.gg/en/amigos?share=tok'
  );
});

test('normalizar codigos sigue igual', () => {
  assert.equal(normalizeFriendCode('3cdb'), 'SDEX-3CDB');
  assert.equal(normalizeFriendCode('SDEX-3CDB'), 'SDEX-3CDB');
});
