// Pruebas de la carga de sprites como ImageBitmap: cache, peticiones compartidas y caida
// a HTMLImageElement cuando el bitmap no llega. Se simulan fetch, createImageBitmap e Image.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBitmap } from '../src/utils/canvasExporter.js';

const originales = {
  fetch: globalThis.fetch,
  createImageBitmap: globalThis.createImageBitmap,
  Image: globalThis.Image,
};

function simularRed({ fallo = false } = {}) {
  const llamadas = [];
  globalThis.fetch = async (src) => {
    llamadas.push(src);
    if (fallo) throw new Error('red caida');
    return { ok: true, blob: async () => new Blob([src]) };
  };
  globalThis.createImageBitmap = async (blob) => ({ tipo: 'bitmap', tamano: blob.size });
  return llamadas;
}

function simularImagenFallida() {
  globalThis.Image = class {
    set src(valor) {
      this.valor = valor;
      queueMicrotask(() => this.onerror && this.onerror());
    }
  };
}

function restaurar() {
  globalThis.fetch = originales.fetch;
  globalThis.createImageBitmap = originales.createImageBitmap;
  globalThis.Image = originales.Image;
}

test('decodifica el sprite como ImageBitmap y lo deja en cache', async () => {
  const llamadas = simularRed();
  try {
    const primero = await loadBitmap('/sprites/collage/cache-test.webp');
    const segundo = await loadBitmap('/sprites/collage/cache-test.webp');
    assert.equal(primero.tipo, 'bitmap');
    assert.equal(segundo, primero);
    assert.equal(llamadas.length, 1);
  } finally {
    restaurar();
  }
});

test('dos pedidos simultaneos del mismo sprite comparten una sola descarga', async () => {
  const llamadas = simularRed();
  try {
    const [a, b] = await Promise.all([
      loadBitmap('/sprites/collage/simultaneo.webp'),
      loadBitmap('/sprites/collage/simultaneo.webp'),
    ]);
    assert.equal(a, b);
    assert.equal(llamadas.length, 1);
  } finally {
    restaurar();
  }
});

test('si la descarga falla, cae a HTMLImageElement sin lanzar error', async () => {
  simularRed({ fallo: true });
  simularImagenFallida();
  try {
    const resultado = await loadBitmap('/sprites/collage/fallo.webp');
    assert.equal(resultado, null);
  } finally {
    restaurar();
  }
});

test('sin src no pide nada', async () => {
  const llamadas = simularRed();
  try {
    assert.equal(await loadBitmap(''), null);
    assert.equal(llamadas.length, 0);
  } finally {
    restaurar();
  }
});
