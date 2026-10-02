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
