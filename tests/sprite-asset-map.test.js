// El mapa de arte es el contrato entre la app y el sincronizador automatico. Si se
// desalinea, el sync vuelve a bajar (y a commitear) arte que ya existe con otro nombre: paso
// con peely_candy, que se sirve desde peely_gummy.webp.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  WEBP_MAP,
  ART_VECTORIAL,
  DIRECTORIO_ARTE,
  rutaArteCanonica,
  archivoArteCanonico,
} from '../src/data/spriteAssetMap.js';

const RAIZ_PUBLICA = path.resolve(import.meta.dirname, '../public');

test('toda ruta del mapa apunta a un archivo que existe', () => {
  const faltan = Object.entries(WEBP_MAP).filter(([, ruta]) => !fs.existsSync(path.join(RAIZ_PUBLICA, ruta)));
  assert.deepEqual(faltan, [], 'rutas del mapa sin archivo: ' + JSON.stringify(faltan));
});

test('el mapa siempre es arte real, nunca un placeholder vectorial', () => {
  const svg = Object.entries(WEBP_MAP).filter(([, ruta]) => /\.svg$/.test(ruta));
  assert.deepEqual(svg, [], 'el mapa no debe apuntar a .svg: ' + JSON.stringify(svg));
});

test('cada id resuelve a su propio archivo: ya no hay nombres alternativos', () => {
  // Los seis que quedaban (peely_candy, llama_candy y los cuatro *_quack) se bajaron con su
  // id correcto y se borraron los archivos viejos. Una tabla aparte era lo que hacia que el
  // sync volviera a bajar arte que ya estaba.
  for (const id of ['peely_candy', 'llama_candy', 'water_quack', 'fire_quack', 'earth_quack', 'zeropoint_quack']) {
    assert.equal(rutaArteCanonica(id), '/sprites/' + id + '.webp');
  }
});

test('el mapa no apunta a ningun nombre distinto del id', () => {
  const alternativos = Object.entries(WEBP_MAP).filter(([id, ruta]) => ruta !== '/sprites/' + id + '.webp');
  assert.deepEqual(alternativos, [], 'rutas con nombre alternativo: ' + JSON.stringify(alternativos));
});

test('un espiritu normal resuelve a su propio webp', () => {
  assert.equal(rutaArteCanonica('vampire_basic'), '/sprites/vampire_basic.webp');
});

test('ningun espiritu depende ya de un placeholder vectorial', () => {
  // El ultimo era peely_candy, que ya tiene su arte real. Los otros cuatro (Gem Air, Holofoil
  // Aura, Gem Batman, Holofoil Duck) no existen en el juego y salieron del catalogo. La lista
  // se queda vacia como red para el proximo espiritu que salga sin arte.
  assert.deepEqual([...ART_VECTORIAL], []);
});

test('para todo placeholder, el archivo que pide la app existe', () => {
  for (const id of ART_VECTORIAL) {
    const ruta = rutaArteCanonica(id);
    assert.ok(fs.existsSync(path.join(RAIZ_PUBLICA, ruta)), 'falta ' + ruta + ' para ' + id);
  }
});

test('el nombre de archivo canonico es el que el sync tiene que mirar en disco', () => {
  assert.equal(archivoArteCanonico('peely_candy'), 'peely_candy.webp');
  assert.equal(archivoArteCanonico('vampire_basic'), 'vampire_basic.webp');
});

test('sin id no se inventa ruta', () => {
  assert.equal(rutaArteCanonica(''), '');
  assert.equal(rutaArteCanonica(null), '');
  assert.equal(archivoArteCanonico(''), '');
});
