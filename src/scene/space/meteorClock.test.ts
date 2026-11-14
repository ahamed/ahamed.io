import { describe, expect, it } from 'vitest';
import { SKY_RADIUS } from './layout';
import { createMeteorClock, emptyMeteor, METEOR_RADIUS } from './meteorClock';

/** Start time and duration of every meteor in the first `seconds`, sampled every `step`. */
function events(seed: number, seconds: number, step = 0.02) {
  const clock = createMeteorClock(seed);
  const out = emptyMeteor();
  const found: { start: number; end: number }[] = [];
  let was = false;
  for (let t = 0; t <= seconds; t += step) {
    const { active } = clock.stateAt(t, out);
    if (active && !was) found.push({ start: t, end: t });
    if (active) {
      const last = found.at(-1);
      if (last) last.end = t;
    }
    was = active;
  }
  return found;
}

describe('meteor clock', () => {
  it('fires a meteor every 6 to 15 seconds, each lasting under a second, over 10 minutes', () => {
    const found = events(42, 600);
    expect(found.length).toBeGreaterThanOrEqual(600 / 15 - 1);
    expect(found.length).toBeLessThanOrEqual(600 / 6);
    expect(found[0]?.start).toBeGreaterThanOrEqual(6 - 0.05);
    for (let i = 1; i < found.length; i++) {
      const gap = (found[i]?.start ?? 0) - (found[i - 1]?.start ?? 0);
      expect(gap).toBeGreaterThanOrEqual(6 - 0.05);
      expect(gap).toBeLessThanOrEqual(15 + 0.05);
    }
    for (const { start, end } of found) expect(end - start).toBeLessThan(1);
  });

  it('starts each streak in the forward view on the far background sphere and moves it', () => {
    const clock = createMeteorClock(42);
    const out = emptyMeteor();
    let checked = 0;
    for (let t = 0; t < 600; t += 0.05) {
      clock.stateAt(t, out);
      if (!out.active) continue;
      checked++;
      const [x, y, z] = out.start;
      expect(Math.hypot(x, y, z)).toBeCloseTo(METEOR_RADIUS, 6);
      expect(Math.hypot(...out.end)).toBeCloseTo(METEOR_RADIUS, 6);
      // Within 45° of the travel direction (-Z), above the horizon.
      expect(-z / METEOR_RADIUS).toBeGreaterThan(Math.cos(Math.PI / 4));
      expect(y).toBeGreaterThan(0);
      const travel = Math.acos(
        Math.min(1, (x * out.end[0] + y * out.end[1] + z * out.end[2]) / METEOR_RADIUS ** 2),
      );
      expect(travel).toBeGreaterThan((7 * Math.PI) / 180);
      expect(travel).toBeLessThan((16 * Math.PI) / 180);
      expect(out.progress).toBeGreaterThanOrEqual(0);
      expect(out.progress).toBeLessThanOrEqual(1);
    }
    expect(checked).toBeGreaterThan(0);
    expect(METEOR_RADIUS).toBeLessThan(SKY_RADIUS);
  });

  it('is deterministic and writes into the given object, even when time runs backward', () => {
    const a = createMeteorClock(7);
    const b = createMeteorClock(7);
    const out = emptyMeteor();
    const samples = [3, 20, 47.3, 120, 18];
    for (const t of samples) {
      const first = { ...a.stateAt(t, out), start: [...out.start], end: [...out.end] };
      expect(b.stateAt(t, emptyMeteor())).toMatchObject(first);
      expect(a.stateAt(t, out)).toBe(out);
    }
  });
});
