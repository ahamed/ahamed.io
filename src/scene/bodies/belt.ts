/** Asteroid-belt layout (no three.js imports): a sparse, seeded field around the route. */
import { mulberry32 } from '../random';
import type { RockPresetId } from './rockShape';

/** The rock shapes shared by every belt instance; one draw call each. */
export const BELT_SHAPES: readonly RockPresetId[] = ['belt-a', 'belt-b', 'belt-c'];

export interface BeltOptions {
  count: number;
  seed: number;
  /** Belt span along the route; travel is toward −Z, so zStart > zEnd. */
  zStart: number;
  zEnd: number;
  /** Clear radius around the route axis (x = y = 0) that no rock may enter. */
  corridor: number;
  /** Outer radius of the band. */
  outer: number;
  /** Half-height of the band (it is flattened in y). */
  thickness: number;
}

export interface Belt {
  count: number;
  positions: Float32Array;
  scales: Float32Array;
  shapes: Uint8Array;
  /** Unit spin axis per rock. */
  axes: Float32Array;
  /** Spin rate (radians per second) per rock. */
  rates: Float32Array;
  /** Initial orientation per rock, as a unit quaternion (x, y, z, w). */
  rotations: Float32Array;
}

const MIN_SIZE = 0.2;
const MAX_SIZE = 2.5;
/** Share of the span at each end over which rocks shrink to nothing. */
const TAPER = 0.12;

function unitVector(rand: () => number): [number, number, number] {
  const z = 2 * rand() - 1;
  const phi = 2 * Math.PI * rand();
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(phi), r * Math.sin(phi), z];
}

/** Scale multiplier along the span: 0 at either end, 1 in the middle section. */
function taper(t: number): number {
  const edge = Math.min(t, 1 - t) / TAPER;
  if (edge >= 1) return 1;
  const s = Math.max(0, edge);
  return s * s * (3 - 2 * s);
}

/** Rejection-samples (x, y) in the flattened band, keeping the whole rock clear of the corridor. */
function sampleCrossSection(
  rand: () => number,
  scale: number,
  { corridor, outer, thickness }: BeltOptions,
): [number, number] {
  for (;;) {
    const x = (rand() * 2 - 1) * outer;
    const y = (rand() * 2 - 1) * thickness;
    const inBand = Math.hypot(x, (y * outer) / thickness) <= outer;
    const clear = Math.hypot(x, y) - scale >= corridor;
    if (inBand && clear) return [x, y];
  }
}

export function createBelt(options: BeltOptions): Belt {
  const { count, seed, zStart, zEnd } = options;
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const shapes = new Uint8Array(count);
  const axes = new Float32Array(count * 3);
  const rates = new Float32Array(count);
  const rotations = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const z = zStart + (zEnd - zStart) * rand();
    const t = (zStart - z) / (zStart - zEnd);
    // Power law: mostly pebbles, a few boulders; tapered toward the ends of the belt.
    const scale = (MIN_SIZE + (MAX_SIZE - MIN_SIZE) * rand() ** 4) * taper(t);

    const [x, y] = sampleCrossSection(rand, scale, options);

    positions.set([x, y, z], i * 3);
    scales[i] = scale;
    shapes[i] = Math.floor(rand() * BELT_SHAPES.length);
    axes.set(unitVector(rand), i * 3);
    rates[i] = 0.05 + rand() * 0.35;
    // Random orientation: axis-angle → quaternion.
    const [ax, ay, az] = unitVector(rand);
    const half = Math.PI * rand();
    const s = Math.sin(half);
    rotations.set([ax * s, ay * s, az * s, Math.cos(half)], i * 4);
  }

  return { count, positions, scales, shapes, axes, rates, rotations };
}

/** Minimal route shape needed to place the belt (kept structural to stay three-free). */
interface RouteLike {
  length: number;
  bodies: readonly { id: string; position: readonly [number, number, number] }[];
}

/**
 * The belt's span along the route: from halfway between Deimos and Ceres to halfway between
 * Hygiea and the end of the route.
 */
export function beltSpan(route: RouteLike): { zStart: number; zEnd: number } {
  const z = (id: string): number => {
    const body = route.bodies.find((b) => b.id === id);
    if (!body) throw new Error(`route has no ${id}`);
    return body.position[2];
  };
  return {
    zStart: (z('deimos') + z('ceres')) / 2,
    zEnd: (z('hygiea') - route.length) / 2,
  };
}
