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

// En iOS la sesion de medios no se cierra al quitar el src: el widget "Now Playing"
// se queda pegado en la pantalla de bloqueo hasta que vaciamos el metadata y
// marcamos playbackState. Esta prueba fija que la limpiemos explicitamente.
const sesion = { metadata: { title: 'Spritedex' }, playbackState: 'playing' };
// La categoria de audio: en iOS decide dos cosas a la vez, y son la misma. Si la
// pagina queda en "playback" los sonidos suenan con el movil en silencio pero
// Safari se queda con la pantalla de bloqueo; "ambient" respeta el interruptor.
const audioSession = { type: 'auto' };
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaSession: sesion, audioSession },
  configurable: true,
  writable: true,
});

// Al apagar la pantalla iOS no deja el contexto en 'suspended' sino en
// 'interrupted' (MDN, BaseAudioContext.state). Dormirlo y reanudarlo tiene que
// funcionar desde los dos estados.
class ContextoFalso {
  constructor(state = 'running') {
    this.state = state;
    this.vecesDormido = 0;
    this.vecesReanudado = 0;
  }
  suspend() { this.vecesDormido++; this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.vecesReanudado++; this.state = 'running'; return Promise.resolve(); }
}

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

test('al soltar el elemento tambien se limpia la sesion de medios', () => {
  sesion.metadata = { title: 'Spritedex' };
  sesion.playbackState = 'playing';
  sounds.playSample('/sound cards/maxed_8_bit.mp3');
  creados.at(-1).emitir('ended');
  assert.equal(sesion.metadata, null, 'sin metadata el sistema suelta el titulo');
  assert.equal(sesion.playbackState, 'none', 'playbackState none cierra la sesion');
});

test('un play rechazado no deja la sesion de medios abierta', async () => {
  sesion.metadata = { title: 'Spritedex' };
  sesion.playbackState = 'playing';
  rechazarPlay = true;
  sounds.playSample('/sound cards/level_spirit.mp3');
  await new Promise((r) => setImmediate(r));
  assert.equal(sesion.metadata, null);
  assert.equal(sesion.playbackState, 'none');
  rechazarPlay = false;
});

test('dormir duerme el contexto aunque iOS lo deje en interrupted', () => {
  const ctx = new ContextoFalso('interrupted');
  sounds.ctx = ctx;
  sounds.dormir();
  assert.equal(ctx.vecesDormido, 1, 'interrupted tambien hay que dormirlo');
  assert.equal(ctx.state, 'suspended');
  sounds.ctx = null;
});

test('dormir tambien limpia la sesion de medios', () => {
  sesion.metadata = { title: 'Spritedex' };
  sesion.playbackState = 'playing';
  sounds.dormir();
  assert.equal(sesion.metadata, null);
  assert.equal(sesion.playbackState, 'none');
});

test('el contexto se reanuda desde interrupted al volver a sonar', () => {
  const ctx = new ContextoFalso('interrupted');
  sounds.ctx = ctx;
  sounds.initContext();
  assert.equal(ctx.vecesReanudado, 1, 'resume() es la salida del estado interrupted');
  assert.equal(ctx.state, 'running');
  sounds.ctx = null;
});

test('un contexto ya dormido no se vuelve a dormir', () => {
  const ctx = new ContextoFalso('suspended');
  sounds.ctx = ctx;
  sounds.dormir();
  assert.equal(ctx.vecesDormido, 0);
  sounds.ctx = null;
});

test('al cargar, la app declara la categoria ambient', async () => {
  audioSession.type = 'auto';
  await import('../src/utils/audio.js?declara-ambient');
  assert.equal(
    audioSession.type,
    'ambient',
    'ambient es la categoria que respeta el interruptor de silencio',
  );
});

test('si el navegador no trae Audio Session API no revienta', () => {
  const guardada = navigator.audioSession;
  delete navigator.audioSession;
  assert.doesNotThrow(() => sounds.ponerCategoria('ambient'));
  navigator.audioSession = guardada;
});

test('si el navegador rechaza el tipo no revienta', () => {
  Object.defineProperty(audioSession, 'type', {
    configurable: true,
    get: () => 'auto',
    set: () => {
      throw new Error('tipo no soportado');
    },
  });
  assert.doesNotThrow(() => sounds.ponerCategoria('ambient'));
  delete audioSession.type;
  audioSession.type = 'ambient';
});
