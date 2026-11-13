import { describe, expect, it } from 'vitest';
import {
  MATERIAL_SLOTS,
  MOTION_GROUPS,
  modelBounds,
  partBounds,
  PARTS,
  PIVOTS,
  REQUIRED_PARTS,
  type PartSpec,
} from './parts';

const ids = PARTS.map((p) => p.id);
const byId = (id: string): PartSpec | undefined => PARTS.find((p) => p.id === id);

/** Unscaled extents of the M1 first-pass model, measured from its meshes. */
const M1_MIN = [-2.06, -0.9, -0.24] as const;
const M1_MAX = [2.76, 2.73, 1.0] as const;

describe('PARTS', () => {
  it('contains every recognisable Voyager 1 part', () => {
    for (const id of REQUIRED_PARTS) expect(ids, id).toContain(id);
  });

  it('lists the required anatomy', () => {
    expect(REQUIRED_PARTS).toEqual(
      expect.arrayContaining([
        'hga',
        'hga-rim',
        'subreflector',
        'feed',
        'feed-strut-0',
        'feed-strut-1',
        'feed-strut-2',
        'bus',
        ...Array.from({ length: 10 }, (_, i) => `bus-bay-${String(i)}`),
        'golden-record',
        'rtg-boom',
        'rtg-0',
        'rtg-1',
        'rtg-2',
        'mag-boom',
        'mag-sensor-mid',
        'mag-sensor-tip',
        'science-boom',
        'scan-platform',
        'camera-na',
        'camera-wa',
        'whip-l',
        'whip-r',
        'thruster-0',
        'lecp',
        'cosmic-ray',
      ]),
    );
  });

  it('gives every RTG canister cooling fins', () => {
    for (const k of [0, 1, 2]) {
      expect(ids.filter((id) => id.startsWith(`rtg-${String(k)}-fin-`)).length).toBeGreaterThan(3);
    }
  });

  it('builds the magnetometer boom as a lattice', () => {
    expect(ids.filter((id) => id.startsWith('mag-batten-')).length).toBeGreaterThanOrEqual(20);
    expect(ids.filter((id) => id.startsWith('mag-diag-')).length).toBeGreaterThanOrEqual(20);
  });

  it('has at least 100 parts with unique ids', () => {
    expect(PARTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only known material slots and motion groups', () => {
    for (const part of PARTS) {
      expect(MATERIAL_SLOTS, part.id).toContain(part.material);
      expect(MOTION_GROUPS, part.id).toContain(part.group);
    }
  });

  it('keeps the dish rigid with the bus', () => {
    const dishParts = PARTS.filter(
      (p) => p.id.startsWith('hga') || p.id.startsWith('feed') || p.id === 'subreflector',
    );
    expect(dishParts.length).toBeGreaterThanOrEqual(6);
    for (const p of dishParts) expect(p.group, p.id).toBe('static');
    expect(byId('bus')?.group).toBe('static');
  });

  it('puts the moving parts in their motion groups, each with a pivot', () => {
    expect(byId('scan-platform')?.group).toBe('scan');
    expect(byId('whip-l')?.group).toBe('whip-l');
    expect(byId('whip-r')?.group).toBe('whip-r');
    expect(byId('mag-sensor-tip')?.group).toBe('mag-tip');
    for (const group of MOTION_GROUPS) {
      if (group === 'static') continue;
      expect(PIVOTS[group]).toHaveLength(3);
      expect(PARTS.some((p) => p.group === group)).toBe(true);
    }
  });

  it('stays within ±10% of the M1 footprint so chase framing is unchanged', () => {
    const { min, max } = modelBounds(PARTS);
    for (let axis = 0; axis < 3; axis++) {
      const span = (M1_MAX[axis] ?? 0) - (M1_MIN[axis] ?? 0);
      expect(
        Math.abs((min[axis] ?? 0) - (M1_MIN[axis] ?? 0)),
        `min[${String(axis)}]`,
      ).toBeLessThanOrEqual(span * 0.1);
      expect(
        Math.abs((max[axis] ?? 0) - (M1_MAX[axis] ?? 0)),
        `max[${String(axis)}]`,
      ).toBeLessThanOrEqual(span * 0.1);
    }
  });
});

describe('partBounds', () => {
  it('rotates a cylinder lying along X', () => {
    const b = partBounds({
      id: 't',
      shape: { kind: 'cylinder', radiusTop: 0.1, radiusBottom: 0.1, height: 2, segments: 8 },
      position: [1, 0, 0],
      rotation: [0, 0, Math.PI / 2],
      material: 'metal',
      group: 'static',
    });
    expect(b.min[0]).toBeCloseTo(0);
    expect(b.max[0]).toBeCloseTo(2);
    expect(b.max[1]).toBeCloseTo(0.1);
  });

  it('offsets moving-group parts by their pivot', () => {
    const b = partBounds({
      id: 't',
      shape: { kind: 'sphere', radius: 0.5, widthSegments: 8, heightSegments: 6 },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      material: 'metal',
      group: 'scan',
    });
    expect(b.min[0]).toBeCloseTo(PIVOTS.scan[0] - 0.5);
  });
});
