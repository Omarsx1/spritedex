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

test('un id con arte bajo otro nombre resuelve al archivo real', () => {
  assert.equal(rutaArteCanonica('peely_candy'), '/sprites/peely_gummy.webp');
  assert.equal(rutaArteCanonica('llama_candy'), '/sprites/llama_gummy.webp');
  assert.equal(rutaArteCanonica('water_quack'), '/sprites/water_duck.webp');
  assert.equal(rutaArteCanonica('fire_quack'), '/sprites/fire_duck.webp');
});

test('un espiritu normal resuelve a su propio webp', () => {
  assert.equal(rutaArteCanonica('vampire_basic'), '/sprites/vampire_basic.webp');
});

test('un placeholder sin arte real resuelve al svg, y ese svg existe', () => {
  for (const id of ['air_gem', 'aura_holofoil', 'batman_gem', 'duck_holofoil']) {
    assert.equal(rutaArteCanonica(id), DIRECTORIO_ARTE + id + '.svg');
    assert.ok(fs.existsSync(path.join(RAIZ_PUBLICA, 'sprites', id + '.svg')), 'falta el placeholder de ' + id);
  }
});

test('peely_candy tiene arte real por el mapa, asi que el mapa manda sobre el placeholder', () => {
  // Sigue en ART_VECTORIAL como red para las rutas que no leen el mapa (rutaAssetEspiritu),
  // pero la ruta canonica, la que pide la app, es la real.
  assert.ok(ART_VECTORIAL.has('peely_candy'));
  assert.equal(rutaArteCanonica('peely_candy'), '/sprites/peely_gummy.webp');
});

test('para todo placeholder, el archivo que pide la app existe', () => {
  for (const id of ART_VECTORIAL) {
    const ruta = rutaArteCanonica(id);
    assert.ok(fs.existsSync(path.join(RAIZ_PUBLICA, ruta)), 'falta ' + ruta + ' para ' + id);
  }
});

test('el nombre de archivo canonico es el que el sync tiene que mirar en disco', () => {
  assert.equal(archivoArteCanonico('peely_candy'), 'peely_gummy.webp');
  assert.equal(archivoArteCanonico('vampire_basic'), 'vampire_basic.webp');
  assert.equal(archivoArteCanonico('air_gem'), 'air_gem.svg');
});

test('sin id no se inventa ruta', () => {
  assert.equal(rutaArteCanonica(''), '');
  assert.equal(rutaArteCanonica(null), '');
  assert.equal(archivoArteCanonico(''), '');
});
