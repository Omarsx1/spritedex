// El reproductor fantasma: un elemento de audio que se queda vivo mantiene una sesion
// de medios y en el movil aparece en la pantalla de bloqueo aunque la app este cerrada.
// Esta prueba fija que el elemento se suelte al terminar (ended, error o play rechazado).
import test from 'node:test';
import assert from 'node:assert/strict';

const creados = [];
let rechazarPlay = false;

class AudioFalso {
  constructor(src) {
    this.src = src || '';
    this.listeners = {};
    this.pausado = false;
    this.cargado = false;
    creados.push(this);
  }
  addEventListener(tipo, fn) {
    (this.listeners[tipo] = this.listeners[tipo] || []).push(fn);
  }
  emitir(tipo) {
    (this.listeners[tipo] || []).forEach((fn) => fn());
  }
  play() {
    return rechazarPlay ? Promise.reject(new Error('bloqueado')) : Promise.resolve();
  }
  pause() { this.pausado = true; }
  removeAttribute(nombre) { if (nombre === 'src') this.src = ''; }
  load() { this.cargado = true; }
}

globalThis.window = globalThis.window || {};
globalThis.Audio = AudioFalso;

const { sounds } = await import('../src/utils/audio.js');

test('al terminar el sonido, el elemento se suelta', () => {
  sounds.playSample('/sound cards/level_spirit.mp3', 0.5);
  const audio = creados.at(-1);
  assert.equal(audio.src, '/sound cards/level_spirit.mp3');
  audio.emitir('ended');
  assert.equal(audio.src, '', 'sin src el navegador cierra la sesion de medios');
  assert.ok(audio.pausado && audio.cargado, 'pausa y load() liberan el recurso');
});

test('soltarlo dos veces no revienta', () => {
  sounds.playSample('/sound cards/maxed_8_bit.mp3');
  const audio = creados.at(-1);
  audio.emitir('ended');
  audio.emitir('ended');
  audio.emitir('error');
  assert.equal(audio.src, '');
});

test('si el navegador bloquea la reproduccion, tambien se suelta', async () => {
  rechazarPlay = true;
  sounds.playSample('/sound cards/level_spirit.mp3');
  const audio = creados.at(-1);
  await new Promise((r) => setImmediate(r));
  assert.equal(audio.src, '', 'un play rechazado no debe dejar el elemento vivo');
  rechazarPlay = false;
});
