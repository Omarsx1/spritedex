// Seasonal Fortnitemares behaviour is driven by time, storage and canvas work.
// Those are exactly the seams that break silently, so they are pinned here:
// window boundaries, developer-preview isolation, the intro phase order and
// the guarantee that the seasonal effect can never fall back to confetti.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FORTNITEMARES_START,
  FORTNITEMARES_END,
  resolveSeasonalState,
  getNextSeasonalBoundary,
  hasSeenFortnitemaresIntro,
  markFortnitemaresIntroSeen,
  resetFortnitemaresIntro,
  applySeasonalTheme,
  subscribeSeasonalState
} from '../src/config/seasonalEvent.js';
import { FNM_PHASES, FNM_SWARM_COUNT } from '../src/config/fortnitemaresTimeline.js';
import { HALLOWEEN_COLORS, isBatSwarmActive } from '../src/utils/confetti.js';
import { createBatSwarm, fireFlyingBats } from '../src/utils/batSwarm.js';

const INSIDE = new Date('2026-10-15T12:00:00-05:00');
const AFTER = new Date('2027-01-01T00:00:00-05:00');

test('event boundaries are offset-anchored, so they cannot drift with the browser timezone', () => {
  assert.equal(FORTNITEMARES_START.toISOString(), '2026-10-01T05:00:00.000Z');
  assert.equal(FORTNITEMARES_END.toISOString(), '2026-11-04T05:00:00.000Z');
});

test('the entrance runs as an ordered season-launch sequence, not a stall', () => {
  const ids = FNM_PHASES.map((p) => p.id);
  assert.deepEqual(ids, ['corrupt', 'swarm', 'brand', 'curse', 'settle', 'done']);

  for (let i = 1; i < FNM_PHASES.length; i += 1) {
    assert.ok(
      FNM_PHASES[i].at > FNM_PHASES[i - 1].at,
      `phase ${FNM_PHASES[i].id} must start after ${FNM_PHASES[i - 1].id}`
    );
  }

  const total = FNM_PHASES[FNM_PHASES.length - 1].at;
  assert.ok(total >= 3500, 'the cinematic must be a real moment, not a 1.9s sting');
  assert.ok(total <= 6000, 'but it must not block the interface for long');
});

test('the brand beat lands before the theme has to be readable', () => {
  const brand = FNM_PHASES.find((p) => p.id === 'brand');
  const settle = FNM_PHASES.find((p) => p.id === 'settle');
  const curse = FNM_PHASES.find((p) => p.id === 'curse');
  assert.ok(brand.at < curse.at, 'the wordmark swaps before the crimson flood');
  assert.ok(curse.at < settle.at, 'the flood resolves into a readable interface');
});

test('production resolves strictly from the event window', () => {
  const cases = [
    ['2026-09-30T23:59:59-05:00', false],
    ['2026-10-01T00:00:00-05:00', true],
    ['2026-10-31T23:59:59-05:00', true],
    ['2026-11-03T23:59:59-05:00', true],
    ['2026-11-04T00:00:00-05:00', false],
    ['2027-01-01T00:00:00-05:00', false]
  ];
  for (const [iso, expected] of cases) {
    assert.equal(resolveSeasonalState({ now: new Date(iso), isDev: false }), expected, iso);
  }
});

test('production ignores every developer preview override', () => {
  assert.equal(resolveSeasonalState({ now: AFTER, isDev: false, search: '?halloween=1', storedOverride: 'true' }), false);
  assert.equal(resolveSeasonalState({ now: AFTER, isDev: false, search: '?fortnitemares=true', storedOverride: 'true' }), false);
  assert.equal(resolveSeasonalState({ now: INSIDE, isDev: false, search: '?halloween=0', storedOverride: 'false' }), true);
});

test('development honours query and storage previews, then defaults on', () => {
  assert.equal(resolveSeasonalState({ now: INSIDE, isDev: true, search: '?halloween=0' }), false);
  assert.equal(resolveSeasonalState({ now: INSIDE, isDev: true, search: '?fortnitemares=false' }), false);
  assert.equal(resolveSeasonalState({ now: INSIDE, isDev: true, search: '?halloween=1' }), true);
  assert.equal(resolveSeasonalState({ now: INSIDE, isDev: true, storedOverride: 'false' }), false);
  assert.equal(resolveSeasonalState({ now: AFTER, isDev: true, storedOverride: 'true' }), true);
  assert.equal(resolveSeasonalState({ now: AFTER, isDev: true }), true);
});

test('the next boundary points at the start, then the end, then nothing', () => {
  assert.equal(getNextSeasonalBoundary(new Date('2026-09-01T00:00:00-05:00')), FORTNITEMARES_START);
  assert.equal(getNextSeasonalBoundary(INSIDE), FORTNITEMARES_END);
  assert.equal(getNextSeasonalBoundary(AFTER), null);
});

test('the intro flag is remembered once and can be replayed', () => {
  resetFortnitemaresIntro();
  assert.equal(hasSeenFortnitemaresIntro(), false);
  markFortnitemaresIntroSeen();
  assert.equal(hasSeenFortnitemaresIntro(), true);
  resetFortnitemaresIntro();
  assert.equal(hasSeenFortnitemaresIntro(), false);
});

test('the seasonal palette stays inside the key-art night range', () => {
  assert.ok(Array.isArray(HALLOWEEN_COLORS) && HALLOWEEN_COLORS.length > 0);
  for (const color of HALLOWEEN_COLORS) {
    assert.match(color, /^#[0-9a-f]{6}$/i, `unexpected colour token: ${color}`);
  }
});

// The original defect: the seasonal effect was drawn with canvas-confetti, so
// bats arced up under gravity and fell like dead debris. The swarm now owns its
// own canvas, which is what this assertion protects.
test('the seasonal effect never routes through canvas-confetti particles', () => {
  assert.equal(isBatSwarmActive(INSIDE), true, 'inside the window the bats own the effect');
  assert.equal(isBatSwarmActive(AFTER), false, 'outside the window normal confetti returns');
});

test('the bat swarm refuses to run without a DOM instead of throwing', () => {
  assert.equal(createBatSwarm(), null);
  assert.equal(fireFlyingBats(), null);
  assert.equal(createBatSwarm({ count: 4, mode: 'burst' }), null);
});

test('the entrance releases enough bats to cross the whole viewport', () => {
  assert.ok(FNM_SWARM_COUNT >= 20, 'a thin swarm reads as confetti, not a flight');
});

// The original defect: a tab left open kept the theme forever, because the
// seasonal state was only read once at startup. This drives the wake path with
// a stubbed window/document and a frozen clock.
test('an open tab drops the theme once the window closes', () => {
  const RealDate = Date;
  const listeners = new Map();
  const classes = new Set();

  const makeClassList = () => ({
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name)
  });

  globalThis.window = {
    location: { search: '' },
    localStorage: null,
    addEventListener: (type, handler) => listeners.set('window:' + type, handler),
    removeEventListener: (type) => listeners.delete('window:' + type),
    dispatchEvent: () => true
  };
  globalThis.document = {
    documentElement: { classList: makeClassList() },
    body: { classList: makeClassList() },
    addEventListener: (type, handler) => listeners.set('document:' + type, handler),
    removeEventListener: (type) => listeners.delete('document:' + type)
  };

  let clock = new RealDate('2026-10-15T12:00:00-05:00').getTime();

  class FrozenDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(clock);
      else super(...args);
    }
    static now() {
      return clock;
    }
  }

  try {
    globalThis.Date = FrozenDate;

    const changes = [];
    const unsubscribe = subscribeSeasonalState((active) => changes.push(active));

    // Simulate the themed boot state owned by App.jsx.
    applySeasonalTheme(true);
    assert.equal(classes.has('theme-fortnitemares'), true);
    assert.deepEqual(changes, []);

    // The season ends while the tab stays open; the user returns to the tab.
    clock = new RealDate('2026-11-05T12:00:00-05:00').getTime();
    listeners.get('document:visibilitychange')();

    assert.deepEqual(changes, [false]);
    assert.equal(classes.has('theme-fortnitemares'), false);

    unsubscribe();
    assert.equal(listeners.has('document:visibilitychange'), false);
    assert.equal(listeners.has('window:focus'), false);
  } finally {
    globalThis.Date = RealDate;
    delete globalThis.window;
    delete globalThis.document;
  }
});
