import { BufferGeometry } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildVoyager } from './build';
import { PARTS, type PartSpec } from './parts';

describe('buildVoyager', () => {
  it('merges the full model into one geometry per (group, material) bucket', () => {
    const model = buildVoyager(PARTS);
    const expected = new Set(PARTS.map((p) => `${p.group}:${p.material}`));
    expect(model.buckets.map((b) => b.name).sort()).toEqual([...expected].sort());
    expect(model.stats.drawCalls).toBe(model.buckets.length);
    model.dispose();
  });

  it('respects the render budget: ≤ 14 draw calls and ≤ 60k triangles', () => {
    const model = buildVoyager(PARTS);
    expect(model.stats.drawCalls).toBeLessThanOrEqual(14);
    expect(model.stats.triangles).toBeLessThanOrEqual(60_000);
    expect(model.stats.triangles).toBeGreaterThan(3_000);
    model.dispose();
  });

  it('merges every shape kind without throwing', () => {
    const base = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      material: 'metal',
      group: 'static',
    } as const;
    const parts: PartSpec[] = [
      {
        ...base,
        id: 'a',
        shape: { kind: 'cylinder', radiusTop: 1, radiusBottom: 1, height: 1, segments: 8 },
      },
      { ...base, id: 'b', shape: { kind: 'cone', radius: 1, height: 1, segments: 8 } },
      { ...base, id: 'c', shape: { kind: 'box', width: 1, height: 1, depth: 1 } },
      {
        ...base,
        id: 'd',
        shape: { kind: 'sphere', radius: 1, widthSegments: 8, heightSegments: 6 },
      },
      {
        ...base,
        id: 'e',
        shape: { kind: 'torus', radius: 1, tube: 0.1, radialSegments: 4, tubularSegments: 8 },
      },
      {
        ...base,
        id: 'f',
        shape: {
          kind: 'lathe',
          profile: [
            [0, 0],
            [1, 0.5],
          ],
          segments: 8,
        },
      },
    ];
    const model = buildVoyager(parts);
    expect(model.buckets).toHaveLength(1);
    const geometry = model.buckets[0]?.geometry;
    expect(geometry?.getAttribute('position').count).toBeGreaterThan(0);
    expect(geometry?.getAttribute('normal')).toBeDefined();
    expect(geometry?.getAttribute('uv')).toBeDefined();
    model.dispose();
  });

  it('bakes the part transform into the merged vertices', () => {
    const model = buildVoyager([
      {
        id: 'moved',
        shape: { kind: 'box', width: 1, height: 1, depth: 1 },
        position: [10, 0, 0],
        rotation: [0, 0, 0],
        material: 'metal',
        group: 'static',
      },
    ]);
    const geometry = model.buckets[0]?.geometry;
    geometry?.computeBoundingBox();
    expect(geometry?.boundingBox?.min.x).toBeCloseTo(9.5);
    model.dispose();
  });

  it('disposes every geometry it created', () => {
    const spy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const model = buildVoyager(PARTS);
    // Intermediate per-part geometries are released during the build.
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(PARTS.length);
    const merged = model.buckets.map((b) => b.geometry);
    spy.mockClear();
    model.dispose();
    const disposed = spy.mock.contexts;
    for (const geometry of merged) expect(disposed).toContain(geometry);
  });
});
