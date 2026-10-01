// Seasonal Fortnitemares behaviour is driven by time, storage and a canvas
// library. Those are exactly the seams that break silently, so they are pinned
// here: window boundaries, developer-preview isolation and the bat-only fallback.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FORTNITEMARES_START,
  FORTNITEMARES_END,
  INTRO_TIMELINE,
  resolveSeasonalState,
  getNextSeasonalBoundary,
  hasSeenFortnitemaresIntro,
  markFortnitemaresIntroSeen,
  resetFortnitemaresIntro,
  applySeasonalTheme,
  subscribeSeasonalState
} from '../src/config/seasonalEvent.js';
import {
  HALLOWEEN_COLORS,
  buildThemedConfettiOptions,
  resolveBatShapes
} from '../src/utils/confetti.js';

const INSIDE = new Date('2026-10-15T12:00:00-05:00');
const AFTER = new Date('2027-01-01T00:00:00-05:00');

test('event boundaries are offset-anchored, so they cannot drift with the browser timezone', () => {
  assert.equal(FORTNITEMARES_START.toISOString(), '2026-10-01T05:00:00.000Z');
  assert.equal(FORTNITEMARES_END.toISOString(), '2026-11-04T05:00:00.000Z');
});

test('the one-time intro stays a short trailer sting, not a loading screen', () => {
  const t = INTRO_TIMELINE;
  assert.ok(t.bootDelay + t.end <= 2200, 'total time from mount must stay under ~2.2s');
  assert.ok(
    t.corrupt < t.transform && t.transform < t.curse && t.curse < t.fade && t.fade < t.end,
    'timeline beats must be strictly ordered'
  );
  assert.ok(t.end - t.fade >= 600, 'the 600ms CSS fade must finish before the overlay unmounts');
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

test('the bat fallback never degrades into ordinary confetti', () => {
  assert.deepEqual(resolveBatShapes(null), ['circle']);
  assert.deepEqual(resolveBatShapes({}), ['circle']);
  const everythingFails = {
    shapeFromText() { throw new Error('emoji cannot be rasterized'); },
    shapeFromPath() { throw new Error('canvas unavailable'); }
  };
  assert.deepEqual(resolveBatShapes(everythingFails), ['circle']);
});

test('the bat fallback prefers the emoji shape, then the vector silhouette', () => {
  const emojiShape = { kind: 'text' };
  assert.deepEqual(resolveBatShapes({ shapeFromText: () => emojiShape }), [emojiShape]);

  const pathShape = { kind: 'path' };
  const textFails = {
    shapeFromText() { throw new Error('no emoji'); },
    shapeFromPath: () => pathShape
  };
  assert.deepEqual(resolveBatShapes(textFails), [pathShape]);
});

test('themed bursts discard the caller palette', () => {
  const built = buildThemedConfettiOptions(
    { particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#ffffff', '#000000'], shapes: ['square'], scalar: 9 },
    ['circle']
  );
  assert.deepEqual(built.colors, HALLOWEEN_COLORS);
  assert.deepEqual(built.shapes, ['circle']);
  assert.equal(built.particleCount, 48);
  assert.equal(built.spread, 70);
  assert.deepEqual(built.origin, { y: 0.7 });
  assert.equal(built.scalar, undefined);
});

test('themed bursts keep the emoji scalar when a custom shape is used', () => {
  const shape = { kind: 'text' };
  const built = buildThemedConfettiOptions({ particleCount: 30 }, [shape]);
  assert.deepEqual(built.shapes, [shape]);
  assert.equal(built.scalar, 2.4);
  assert.equal(built.particleCount, 24);
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
