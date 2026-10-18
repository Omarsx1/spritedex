// El pie de la lona (QR y leyenda) apunta siempre al dominio nuevo, sin importar por donde
// entro el usuario: quien llega por el viejo dominio de Vercel tambien comparte spritedex.gg.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dominioParaCompartir, textoParaQR } from '../src/utils/canvasExporter.js';
import { baseCompartir } from '../src/utils/shareUrl.js';

function conOrigen(origen, fn) {
  const previo = globalThis.window;
  globalThis.window = { location: { origin: origen } };
  try {
    return fn();
  } finally {
    if (previo === undefined) delete globalThis.window;
    else globalThis.window = previo;
  }
}

test('el dominio para compartir es el nuevo aunque el usuario entre por Vercel', () => {
  assert.equal(
    conOrigen('https://spritedex-two.vercel.app', dominioParaCompartir),
    'https://spritedex.gg/'
  );
});

test('el dominio para compartir no depende del origen del usuario', () => {
  for (const origen of [
    'https://spritedex.gg',
    'https://www.spritedex.gg',
    'http://localhost:5173',
    'https://spritedex-git-rama.vercel.app'
  ]) {
    assert.equal(conOrigen(origen, dominioParaCompartir), 'https://spritedex.gg/');
  }
});

test('el pie de la lona muestra solo el dominio nuevo', () => {
  assert.equal(
    conOrigen('https://spritedex-two.vercel.app', () => textoParaQR()),
    'spritedex.gg'
  );
});

test('los enlaces que se pegan como texto usan el dominio nuevo', () => {
  assert.equal(baseCompartir('/amigos'), 'https://spritedex.gg/amigos');
  assert.equal(baseCompartir('/en/amigos'), 'https://spritedex.gg/en/amigos');
  assert.equal(baseCompartir(), 'https://spritedex.gg/');
});

test('el enlace de la coleccion sale del dominio nuevo aunque el usuario entre por Vercel', () => {
  const enlace = conOrigen('https://spritedex-two.vercel.app', () =>
    baseCompartir('/amigos')
  );
  assert.equal(enlace, 'https://spritedex.gg/amigos');
  assert.doesNotMatch(enlace, /vercel/);
});
