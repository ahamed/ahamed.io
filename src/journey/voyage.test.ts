import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { readingMs } from './orbit';
import { buildRoute } from './route';
import {
  createVoyageContext,
  createVoyageInput,
  createVoyageState,
  EV_AUTOPLAY_DONE,
  EV_CAPTURED,
  EV_FLIGHT_DONE,
  EV_READ,
  stepVoyageInto,
  type VoyageInput,
  type VoyageState,
} from './voyage';

const route = buildRoute(STOPS);
const ctx = createVoyageContext(route, STOPS);
const DT = 1 / 60;
const MOON = 1;
const HELIO = STOPS.length - 1;

interface Run {
  s: VoyageState;
  input: VoyageInput;
  now: number;
  events: number;
}

function setup(mutate?: (s: VoyageState, input: VoyageInput) => void): Run {
  const s = createVoyageState(ctx);
  const input = createVoyageInput();
  input.phase = 'voyage';
  mutate?.(s, input);
  return { s, input, now: 0, events: 0 };
}

/** Steps `seconds` of frames; `each` runs before every frame. Collects events. */
function run(r: Run, seconds: number, each?: (r: Run) => void) {
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    each?.(r);
    r.now += DT * 1000;
    stepVoyageInto(r.s, r.input, ctx, DT, r.now);
    r.events |= r.s.events;
  }
}

/** Free just before the Moon's capture point, moving forward at cruise. */
const beforeMoon = (s: VoyageState) => {
  s.mode = 'free';
  s.stop = -1;
  s.position = (ctx.capture[MOON] ?? 0) - ctx.cruise * 2;
  s.speed = ctx.cruise;
};

const readEarth = (input: VoyageInput) => {
  input.readStops = ['earth'];
};

describe('the voyage starts in Earth orbit', () => {
  it('is captured at Earth and holds still until the voyage phase', () => {
    const r = setup((_, input) => {
      input.phase = 'intro';
    });
    expect(r.s.mode).toBe('captured');
    expect(r.s.stop).toBe(0);
    run(r, 1);
    expect(r.s.clock).toBe(0);
    r.input.phase = 'voyage';
    run(r, 1);
    expect(r.s.clock).toBeGreaterThan(900);
  });
});

describe('capture', () => {
  it('captures a forward arrival at an unread capture point', () => {
    const r = setup((s, input) => {
      beforeMoon(s);
      readEarth(input);
      input.dir = 1;
    });
    run(r, 5);
    expect(r.events & EV_CAPTURED).toBeTruthy();
    expect(r.s.mode).toBe('captured');
    expect(r.s.stop).toBe(MOON);
    expect(r.s.position).toBeCloseTo(ctx.capture[MOON] ?? 0);
  });

  it('never captures going backward', () => {
    const r = setup((s, input) => {
      s.mode = 'free';
      s.position = (ctx.capture[MOON] ?? 0) + ctx.cruise;
      s.speed = -ctx.cruise;
      input.dir = -1;
    });
    run(r, 2);
    expect(r.events & EV_CAPTURED).toBeFalsy();
    expect(r.s.position).toBeLessThan(ctx.capture[MOON] ?? 0);
  });

  it('passes a read stop', () => {
    const r = setup((s, input) => {
      beforeMoon(s);
      input.readStops = ['earth', 'moon'];
      input.dir = 1;
    });
    run(r, 2);
    expect(r.events & EV_CAPTURED).toBeFalsy();
    expect(r.s.position).toBeGreaterThan(ctx.capture[MOON] ?? 0);
  });

  it('slows into the capture so the speed never jumps', () => {
    const r = setup((s, input) => {
      beforeMoon(s);
      readEarth(input);
      input.dir = 1;
    });
    let prev = r.s.speed;
    run(r, 4, ({ s }) => {
      expect(Math.abs(s.speed - prev)).toBeLessThan(ctx.cruise * 0.2);
      prev = s.speed;
    });
  });
});

describe('the lap', () => {
  const captured = () =>
    setup((s, input) => {
      s.stop = MOON;
      s.mode = 'captured';
      s.position = ctx.capture[MOON] ?? 0;
      s.clock = 0;
      readEarth(input);
    });

  it('holds the route position while forward input speeds up the clock', () => {
    const r = captured();
    r.input.dir = 1;
    r.input.intensity = 1;
    run(r, 1);
    expect(r.s.position).toBe(ctx.capture[MOON]);
    expect(r.s.boost).toBeGreaterThan(2);
    expect(r.s.clock).toBeGreaterThan(1500);
  });

  it('never runs faster than 2.5×', () => {
    const r = captured();
    r.input.dir = 1;
    r.input.intensity = 50;
    run(r, 1);
    expect(r.s.clock).toBeLessThanOrEqual(2500);
  });

  it('ends after typing + rest at 1×, marks the stop read, and coasts', () => {
    const r = captured();
    const lap = ctx.lapS[MOON] ?? 0;
    run(r, lap - 0.1);
    expect(r.events & EV_READ).toBeFalsy();
    run(r, 0.2);
    expect(r.events & EV_READ).toBeTruthy();
    expect(r.s.mode).toBe('coast');
  });

  it('coasts about a third of the way to the next stop, then rests', () => {
    const r = captured();
    run(r, (ctx.lapS[MOON] ?? 0) + 12);
    const from = ctx.capture[MOON] ?? 0;
    const gap = (ctx.capture[MOON + 1] ?? 0) - from;
    expect(r.s.mode).toBe('free');
    expect(Math.abs(r.s.speed)).toBeLessThan(1e-5);
    expect((r.s.position - from) / gap).toBeGreaterThan(0.28);
    expect((r.s.position - from) / gap).toBeLessThan(0.38);
  });

  it('moves the ship smoothly through capture, the lap and the coast', () => {
    const r = setup((s, input) => {
      beforeMoon(s);
      readEarth(input);
      input.dir = 1;
    });
    run(r, 1 / 60);
    const last: [number, number, number] = [...r.s.ship];
    let lastStep = NaN;
    let frames = 0;
    run(r, (ctx.lapS[MOON] ?? 0) + 6, (cur) => {
      if (cur.s.mode === 'captured') cur.input.dir = 0;
      const step = Math.hypot(
        cur.s.ship[0] - last[0],
        cur.s.ship[1] - last[1],
        cur.s.ship[2] - last[2],
      );
      // `each` runs before a frame, so the first call sees no motion yet.
      if (frames++ > 1) expect(Math.abs(step - lastStep)).toBeLessThan(0.15);
      lastStep = step;
      last[0] = cur.s.ship[0];
      last[1] = cur.s.ship[1];
      last[2] = cur.s.ship[2];
    });
  });

  it('backs out on backward input, leaving the stop unread', () => {
    const r = captured();
    run(r, 2);
    r.input.dir = -1;
    run(r, 2);
    expect(r.events & EV_READ).toBeFalsy();
    expect(r.s.mode).toBe('free');
    expect(r.s.position).toBeLessThan(ctx.capture[MOON] ?? 0);
  });

  it('blends throttle input during the coast into cruise without a jump', () => {
    const r = captured();
    run(r, (ctx.lapS[MOON] ?? 0) + 0.5);
    expect(r.s.mode).toBe('coast');
    r.input.dir = 1;
    let prev = r.s.speed;
    run(r, 1, ({ s }) => {
      expect(Math.abs(s.speed - prev)).toBeLessThan(ctx.cruise * 0.2);
      prev = s.speed;
    });
    expect(r.s.mode).toBe('free');
  });
});

describe('flights', () => {
  it('releases an orbit and captures an unread stop it lands on', () => {
    const r = setup();
    run(r, 1);
    const to = ctx.capture[MOON] ?? 0;
    r.input.flight = { from: r.s.position, to, startAt: r.now, duration: 1500 };
    run(r, 2);
    expect(r.events & EV_FLIGHT_DONE).toBeTruthy();
    expect(r.s.mode).toBe('captured');
    expect(r.s.stop).toBe(MOON);
  });

  it('lands free on a point that is not an unread stop', () => {
    const r = setup();
    r.input.flight = { from: r.s.position, to: 0.5, startAt: 0, duration: 0 };
    run(r, 0.1);
    expect(r.s.mode).toBe('free');
    expect(r.s.position).toBeCloseTo(0.5);
  });
});

describe('the heliopause', () => {
  it('drifts forward without circling for the lap time', () => {
    const r = setup((s, input) => {
      s.mode = 'free';
      s.position = (ctx.capture[HELIO] ?? 0) - ctx.cruise;
      s.speed = ctx.cruise;
      input.dir = 1;
      input.readStops = STOPS.slice(0, HELIO).map((x) => x.id);
    });
    run(r, 3);
    expect(r.s.mode).toBe('captured');
    expect(r.s.kind).toBe('drift');
    const start = r.s.position;
    r.input.dir = 0;
    run(r, 1, ({ s }) => {
      expect(s.ship[0]).toBe(0);
    });
    expect(r.s.position).toBeGreaterThan(start);
  });
});

describe('reduced motion', () => {
  const held = () =>
    setup((s, input) => {
      beforeMoon(s);
      readEarth(input);
      input.dir = 1;
      input.reduced = true;
    });

  it('holds without a lap for the reading time, then releases with no coast', () => {
    const r = held();
    run(r, 5);
    expect(r.s.mode).toBe('hold');
    r.input.dir = 0;
    const x = r.s.ship[0];
    // The hold began during the 5 s approach, so stop short of the full reading time.
    run(r, readingMs(STOPS[MOON]?.text ?? '') / 1000 - 2.5);
    expect(r.s.ship[0]).toBe(x);
    expect(r.s.mode).toBe('hold');
    run(r, 3);
    expect(r.events & EV_READ).toBeTruthy();
    expect(r.s.mode).toBe('free');
    expect(r.s.speed).toBe(0);
  });

  it('releases at once on forward input', () => {
    const r = held();
    run(r, 5);
    r.input.dir = 0;
    run(r, 0.5);
    r.events = 0;
    r.input.dir = 1;
    run(r, 1 / 60);
    expect(r.events & EV_READ).toBeTruthy();
    expect(r.s.mode).toBe('free');
  });
});

describe('autoplay', () => {
  it('cruises at a constant speed between stops', () => {
    const r = setup((s, input) => {
      s.mode = 'free';
      s.position = (ctx.capture[MOON] ?? 0) + 0.0005;
      input.autoplay = true;
      input.readStops = ['earth', 'moon'];
    });
    run(r, 1.5);
    expect(r.s.speed).toBeCloseTo(ctx.cruise, 5);
  });

  it('ignores scroll input and laps at 1×', () => {
    const r = setup((s, input) => {
      s.clock = 0;
      input.autoplay = true;
      input.dir = -1;
      input.intensity = 1;
    });
    run(r, 1);
    expect(r.s.mode).toBe('captured');
    expect(r.s.boost).toBe(1);
    expect(r.s.clock).toBeCloseTo(1000, -1);
  });

  it('slings above cruise after a lap and eases back to it', () => {
    const r = setup((_, input) => {
      input.autoplay = true;
    });
    let peak = 0;
    run(r, (ctx.lapS[0] ?? 0) + 4, ({ s }) => {
      if (s.mode !== 'captured') peak = Math.max(peak, s.speed);
    });
    expect(peak).toBeGreaterThan(ctx.cruise * 1.2);
  });

  it('settles at the end of the route and reports autoplay done', () => {
    const r = setup((s, input) => {
      s.mode = 'free';
      s.position = 0.97;
      s.speed = ctx.cruise;
      input.autoplay = true;
      input.readStops = STOPS.map((x) => x.id);
    });
    run(r, 30);
    expect(r.events & EV_AUTOPLAY_DONE).toBeTruthy();
    expect(r.s.position).toBeCloseTo(1, 3);
  });
});

describe('allocation', () => {
  it('reuses its state across many steps', () => {
    const r = setup();
    const { ship, heading } = r.s;
    run(r, 60, (cur) => {
      cur.input.dir = cur.s.mode === 'captured' ? 1 : 0;
    });
    expect(r.s.ship).toBe(ship);
    expect(r.s.heading).toBe(heading);
  });
});
