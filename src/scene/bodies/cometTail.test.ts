import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute, type Vec3 } from '../../journey/route';
import {
  ANTI_SUN,
  COMET_PRESETS,
  TAIL_LATERAL,
  tailParticle,
  type TailKind,
  type TailParams,
} from './cometTail';

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: Vec3) => Math.hypot(...a);
const ion: TailParams = COMET_PRESETS.bright.ion;
const dust: TailParams = COMET_PRESETS.bright.dust;
const JITTERS: [number, number][] = [
  [0, 0],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [0.3, -0.8],
];

describe('tailParticle', () => {
  it('keeps the ion tail in a narrow cone pointing away from the Sun', () => {
    for (let s = 0.05; s < 1; s += 0.1) {
      for (const j of JITTERS) {
        const p = tailParticle('ion', s, j, 0, ion);
        const angle = Math.acos(Math.min(1, dot(p, ANTI_SUN) / len(p)));
        expect(angle).toBeLessThan((3 * Math.PI) / 180);
      }
    }
  });

  it('bends the dust tail further sideways the further along a particle is', () => {
    const lateral = (seed: number) =>
      dot(tailParticle('dust', seed, [0, 0], 0, dust), TAIL_LATERAL);
    expect(lateral(0.2)).toBeGreaterThan(0);
    expect(lateral(0.5)).toBeGreaterThan(lateral(0.2));
    expect(lateral(0.9)).toBeGreaterThan(lateral(0.5));
  });

  it('streams outward and loops, so the tail looks continuous', () => {
    const at = (t: number) => tailParticle('ion', 0.1, [0.2, 0.4], t, ion);
    expect(dot(at(0.5), ANTI_SUN)).toBeGreaterThan(dot(at(0), ANTI_SUN));
    const period = 1 / ion.rate;
    const [a, b] = [at(0.3), at(0.3 + period)];
    for (let i = 0; i < 3; i++) expect(b[i]).toBeCloseTo(a[i] ?? NaN, 6);
  });

  it('gives the upcoming comet shorter tails', () => {
    const tip = (kind: TailKind, preset: keyof typeof COMET_PRESETS) =>
      len(tailParticle(kind, 0.99, [0, 0], 0, COMET_PRESETS[preset][kind]));
    expect(tip('ion', 'faint')).toBeLessThan(tip('ion', 'bright'));
    expect(tip('dust', 'faint')).toBeLessThan(tip('dust', 'bright'));
    expect(COMET_PRESETS.faint.ion.brightness).toBeLessThan(COMET_PRESETS.bright.ion.brightness);
  });

  it('never lets a tail cross the flight path from a comet at its route position', () => {
    const route = buildRoute(STOPS);
    for (const comet of route.bodies.filter((b) => b.body.endsWith('-comet'))) {
      const preset = comet.body === 'upcoming-comet' ? COMET_PRESETS.faint : COMET_PRESETS.bright;
      for (const kind of ['ion', 'dust'] as const) {
        for (let s = 0; s < 1; s += 0.05) {
          for (const j of JITTERS) {
            const p = tailParticle(kind, s, j, 0, preset[kind]);
            expect(comet.position[0] + p[0], comet.id).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
