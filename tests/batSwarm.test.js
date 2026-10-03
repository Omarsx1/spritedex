// The bat swarm is canvas animation, which is exactly the code that looks fine
// and ships broken. These tests drive it against a stubbed canvas so a
// regression in the flight maths fails here instead of in the browser.
import test from 'node:test';
import assert from 'node:assert/strict';

function makeCanvasStub() {
  const calls = [];
  const ctx = {
    calls,
    globalAlpha: 1,
    shadowColor: 'none',
    shadowBlur: 0,
    fillStyle: '#000',
    setTransform: (...a) => calls.push(['setTransform', ...a]),
    clearRect: (...a) => calls.push(['clearRect', ...a]),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    translate: (...a) => calls.push(['translate', ...a]),
    rotate: (...a) => calls.push(['rotate', ...a]),
    scale: (...a) => calls.push(['scale', ...a]),
    drawImage: (...a) => calls.push(['drawImage', ...a]),
    beginPath: () => calls.push(['beginPath']),
    closePath: () => calls.push(['closePath']),
    moveTo: (...a) => calls.push(['moveTo', ...a]),
    lineTo: (...a) => calls.push(['lineTo', ...a]),
    quadraticCurveTo: (...a) => calls.push(['quadraticCurveTo', ...a]),
    fill: () => calls.push(['fill'])
  };
  return {
    calls,
    getContext: () => ctx,
    setAttribute: () => {},
    style: { cssText: '' },
    width: 0,
    height: 0,
    parentNode: null
  };
}

function installDom({ reducedMotion = false } = {}) {
  const canvas = makeCanvasStub();
  const removed = [];
  const appended = [];
  const listeners = new Map();
  const frames = [];

  globalThis.window = {
    innerWidth: 1200,
    innerHeight: 800,
    devicePixelRatio: 2,
    matchMedia: (query) => ({ matches: reducedMotion, media: query }),
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {}
  };
  globalThis.document = {
    createElement: () => canvas,
    body: {
      appendChild: (node) => appended.push(node),
      removeChild: (node) => removed.push(node)
    }
  };
  canvas.parentNode = { removeChild: (node) => removed.push(node) };

  return { canvas, removed, appended, listeners, frames };
}

test('the swarm mounts a canvas and paints bats on its first frame', async () => {
  const dom = installDom();
  const { createBatSwarm } = await import('../src/utils/batSwarm.js?nomock=1');

  const swarm = createBatSwarm({ count: 6, mode: 'burst' });
  assert.ok(swarm, 'the swarm must mount');
  assert.equal(dom.appended.length, 1, 'exactly one canvas is attached');

  dom.frames[0](0);
  dom.frames[0](16);

  const fills = dom.canvas.calls.filter((c) => c[0] === 'fill');
  assert.ok(fills.length >= 6, `expected a bat per swarm member, got ${fills.length} fills`);
  assert.ok(dom.canvas.calls.some((c) => c[0] === 'rotate'), 'bats must steer by rotation');

  swarm.stop();
  assert.equal(dom.removed.length, 1, 'the canvas is detached on stop');
  assert.equal(dom.listeners.has('resize'), false, 'the resize listener is released');
});

test('bats keep flying instead of falling: the canvas is never cleared by gravity', async () => {
  const dom = installDom();
  const { createBatSwarm } = await import('../src/utils/batSwarm.js?nomock=1');

  const swarm = createBatSwarm({ count: 3, mode: 'ambient' });
  dom.frames[0](0);
  dom.frames[0](16);

  // Every frame clears then re-draws: the swarm is repainted, not simulated
  // with a physics step that would terminate a particle.
  const clears = dom.canvas.calls.filter((c) => c[0] === 'clearRect');
  assert.ok(clears.length >= 2, 'each frame clears the previous bats');
  assert.ok(dom.canvas.calls.some((c) => c[0] === 'clearRect' && c[1] === 0 && c[2] === 0));

  swarm.stop();
});

test('a finishing swarm detaches itself so it cannot leak a canvas', async () => {
  const dom = installDom();
  const { createBatSwarm } = await import('../src/utils/batSwarm.js?nomock=1');

  const swarm = createBatSwarm({ count: 2, duration: 100, mode: 'burst' });
  assert.ok(swarm);

  let t = 0;
  for (let i = 0; i < 40; i += 1) {
    t += 50;
    const next = dom.frames.shift();
    if (!next) break;
    next(t);
  }

  assert.equal(dom.removed.length, 1, 'a timed swarm removes itself when it expires');
});

test('reduced motion mounts nothing rather than a frozen swarm', async () => {
  const dom = installDom({ reducedMotion: true });
  const { createBatSwarm, fireFlyingBats } = await import('../src/utils/batSwarm.js?nomock=1');

  assert.equal(createBatSwarm({ count: 5, mode: 'burst' }), null, 'no canvas is attached');
  assert.equal(dom.appended.length, 0, 'the document is left untouched');
  assert.equal(fireFlyingBats(), null, 'card bursts are suppressed entirely');
});

test('the swarm is a no-op without a DOM, instead of throwing', async () => {
  const dom = installDom();
  const { fireFlyingBats } = await import('../src/utils/batSwarm.js?nomock=1');
  assert.equal(typeof fireFlyingBats, 'function');
  delete globalThis.document;
  assert.equal(fireFlyingBats(), null);
  assert.ok(dom);
});

test('con la silueta cargada el enjambre la dibuja en vez de las facetas', async () => {
  const dom = installDom();
  let pedida = null;
  // Imagen que carga en cuanto se le asigna el src, como la del navegador.
  globalThis.Image = class {
    set src(valor) {
      pedida = valor;
      this.complete = true;
      this.naturalWidth = 1784;
      this.naturalHeight = 787;
      Promise.resolve().then(() => this.onload && this.onload());
    }
  };

  const { createBatSwarm } = await import('../src/utils/batSwarm.js?nomock=silueta');
  const swarm = createBatSwarm({ count: 4, mode: 'burst' });
  assert.ok(swarm);
  await Promise.resolve();
  dom.frames[0](0);
  dom.frames[0](16);

  assert.equal(pedida, '/murcielago.svg', 'la silueta se pide al arrancar el enjambre');
  const dibujos = dom.canvas.calls.filter((c) => c[0] === 'drawImage');
  assert.ok(dibujos.length >= 4, `cada murcielago se dibuja con la imagen, hubo ${dibujos.length}`);
  const facetas = dom.canvas.calls.filter((c) => c[0] === 'fill');
  assert.equal(facetas.length, 0, 'con silueta lista no se rellenan facetas');

  const escalas = dom.canvas.calls.filter((c) => c[0] === 'scale');
  assert.ok(escalas.length > 0, 'aplica escala de envergadura diedra en las alas');

  // Los giros del aleteo (tilt) son sutiles (tilt <= 0.11 rad / ~6.3°), no de tijera extrema (0.75 rad / 43°)
  const girosAleteo = dom.canvas.calls
    .filter((c) => c[0] === 'rotate' && Math.abs(c[1]) <= 0.20)
    .map((c) => Math.abs(c[1]));
  assert.ok(girosAleteo.length > 0, 'se aplicaron giros sutiles de ala');
  for (const giro of girosAleteo) {
    assert.ok(giro <= 0.15, `el giro de ala ${giro} rad es sutil y orgánico, no exagerado`);
  }

  swarm.stop();
  delete globalThis.Image;
});

test('si la silueta falla, el siguiente enjambre la vuelve a pedir', async () => {
  const dom = installDom();
  const pedidas = [];
  globalThis.Image = class {
    set src(valor) {
      pedidas.push(valor);
      this.complete = false;
      Promise.resolve().then(() => this.onerror && this.onerror());
    }
  };

  const { createBatSwarm } = await import('../src/utils/batSwarm.js?nomock=fallo');
  const uno = createBatSwarm({ count: 2, mode: 'burst' });
  await Promise.resolve();
  uno.stop();
  const dos = createBatSwarm({ count: 2, mode: 'burst' });
  await Promise.resolve();
  dos.stop();

  assert.equal(pedidas.length, 2, 'un fallo no debe condenar la sesion a las facetas');
  delete globalThis.Image;
});
