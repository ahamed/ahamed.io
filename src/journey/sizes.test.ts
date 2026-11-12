import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { chasePoseInto, type ChasePose } from './camera';
import { buildRoute } from './route';
import { stopSizesInto } from './sizes';
import { chooseOpenStop, dialogScale } from './visibility';

const route = buildRoute(STOPS);
const fov = (50 * Math.PI) / 180;
const pose: ChasePose = { position: [0, 0, 0], lookAt: [0, 0, 0] };
const sizes = route.bodies.map(() => 0);

/** Fly from `from` to `to` in small steps; returns the open stop id at each step. */
function fly(from: number, to: number, start: number | null) {
  let open = start;
  const opened: (string | null)[] = [];
  const scales: number[] = [];
  const steps = 400;
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

describe('dialog sequence along the route', () => {
  it('opens Earth at the start', () => {
    expect(fly(0, 0, null).last).toBe(0);
  });

  it('shrinks and closes Earth, then opens the Moon going forward', () => {
    const { opened, scales } = fly(0, route.closePoints[1] ?? 0.8, null);
    expect(collapse(opened)).toEqual(['earth', null, 'moon']);
    const earthScales = scales.slice(0, opened.indexOf(null));
    expect(earthScales.at(-1)).toBeLessThan(earthScales[0] ?? 0);
  });

  it('reopens Earth when travelling back', () => {
    const forward = fly(0, 0.8, null);
    const back = fly(0.8, 0, forward.last);
    expect(collapse(back.opened)).toEqual(['moon', null, 'earth']);
  });
});
