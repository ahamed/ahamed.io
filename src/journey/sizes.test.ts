import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { chasePoseInto, type ChasePose } from './camera';
import { buildRoute, type Vec3 } from './route';
import { stopSizesInto } from './sizes';
import { apparentSize, chooseOpenStop, dialogScale, OPEN_SIZE } from './visibility';

const route = buildRoute(STOPS);
const fov = (50 * Math.PI) / 180;
const pose: ChasePose = { position: [0, 0, 0], lookAt: [0, 0, 0] };
const sizes = route.bodies.map(() => 0);

/** Fly from `from` to `to` in small steps; returns the open stop id at each step. */
function fly(from: number, to: number, start: number | null) {
  let open = start;
  const opened: (string | null)[] = [];
  const scales: number[] = [];
  const steps = 4000; // fine enough to see the short closed gap between neighbouring moons
  for (let i = 0; i <= steps; i++) {
    const p = from + ((to - from) * i) / steps;
    chasePoseInto(pose, route, p);
    stopSizesInto(sizes, route, pose.position, fov);
    open = chooseOpenStop(sizes, open);
    opened.push(open === null ? null : (route.bodies[open]?.id ?? null));
    scales.push(open === null ? 0 : dialogScale(sizes[open] ?? 0));
  }
  return { opened, scales, last: open };
}

const collapse = (xs: (string | null)[]) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]);

describe('stopSizesInto', () => {
  const one = {
    length: 100,
    closePoints: [0],
    bodies: [
      {
        id: 'x',
        body: 'jupiter' as const,
        radius: 16,
        footprint: 16,
        position: [40, 0, -100] as Vec3,
      },
    ],
  };

  it('gives a body ahead of the camera its apparent size', () => {
    const out = [0];
    stopSizesInto(out, one, [0, 0, 0], fov);
    expect(out[0]).toBeGreaterThan(0);
  });

  it('shrinks a body to zero as it slides out of view past the camera', () => {
    const at = (z: number) => {
      const out = [0];
      stopSizesInto(out, one, [0, 0, z], fov);
      return out[0] ?? NaN;
    };
    // Well ahead: the plain apparent size. Behind the camera: zero. Once past: shrinking.
    expect(at(-40)).toBeCloseTo(apparentSize(16, Math.hypot(40, 60), fov), 12);
    expect(at(-140)).toBe(0);
    const passing = [-100, -110, -120, -130].map(at);
    for (let i = 1; i < passing.length; i++) {
      expect(passing[i]).toBeLessThanOrEqual(passing[i - 1] ?? 0);
    }
  });
});

describe('dialog sequence along the route', () => {
  // PageDown and the idle snap park the camera exactly on a close point, so each stop must
  // open there by itself, with some room above the threshold, not only while flying past.
  it.each(route.bodies.map((body, i) => [body.id, i] as const))(
    'opens %s on its own when parked at its close point',
    (_, i) => {
      chasePoseInto(pose, route, route.closePoints[i] ?? 0);
      stopSizesInto(sizes, route, pose.position, fov);
      expect(sizes[i]).toBeGreaterThanOrEqual(OPEN_SIZE * 1.25);
      expect(chooseOpenStop(sizes, null)).toBe(i);
    },
  );

  it('opens Earth at the start', () => {
    expect(fly(0, 0, null).last).toBe(0);
  });

  it('shrinks and closes Earth, then opens the Moon going forward', () => {
    const { opened, scales } = fly(0, route.closePoints[1] ?? 0.8, null);
    expect(collapse(opened)).toEqual(['earth', null, 'moon']);
    const earthScales = scales.slice(0, opened.indexOf(null));
    expect(earthScales.at(-1)).toBeLessThan(earthScales[0] ?? 0);
  });

  it('reopens Earth when travelling back from the Moon', () => {
    const moon = route.closePoints[1] ?? 0.8;
    const forward = fly(0, moon, null);
    const back = fly(moon, 0, forward.last);
    expect(collapse(back.opened)).toEqual(['moon', null, 'earth']);
  });

  it('opens every stop on its own, in order, closing each before the next', () => {
    const { opened } = fly(0, 1, null);
    const sequence = collapse(opened);
    if (sequence.at(-1) === null) sequence.pop(); // the last dialog may close in the end slack
    const expected = route.bodies.flatMap((b, i) => (i === 0 ? [b.id] : [null, b.id]));
    expect(sequence).toEqual(expected);
  });
});
