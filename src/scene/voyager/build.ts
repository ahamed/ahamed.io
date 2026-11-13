import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  LatheGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MaterialSlot, MotionGroup, PartSpec, Shape } from './parts';

export interface Bucket {
  /** `<group>:<material>`, also used as the mesh name. */
  name: string;
  group: MotionGroup;
  material: MaterialSlot;
  geometry: BufferGeometry;
}

export interface VoyagerModel {
  buckets: Bucket[];
  stats: { drawCalls: number; triangles: number };
  dispose: () => void;
}

const ATTRIBUTES = ['position', 'normal', 'uv'] as const;

function createGeometry(shape: Shape): BufferGeometry {
  switch (shape.kind) {
    case 'cylinder':
      return new CylinderGeometry(
        shape.radiusTop,
        shape.radiusBottom,
        shape.height,
        shape.segments,
      );
    case 'cone':
      return new ConeGeometry(shape.radius, shape.height, shape.segments);
    case 'box':
      return new BoxGeometry(shape.width, shape.height, shape.depth);
    case 'sphere':
      return new SphereGeometry(shape.radius, shape.widthSegments, shape.heightSegments);
    case 'torus':
      return new TorusGeometry(
        shape.radius,
        shape.tube,
        shape.radialSegments,
        shape.tubularSegments,
      );
    case 'lathe':
      return new LatheGeometry(
        shape.profile.map(([x, y]) => new Vector2(x, y)),
        shape.segments,
      );
  }
}

/** Non-indexed, with exactly position/normal/uv, so every shape merges with every other. */
function normalise(geometry: BufferGeometry): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  for (const name of Object.keys(flat.attributes)) {
    if (!(ATTRIBUTES as readonly string[]).includes(name)) flat.deleteAttribute(name);
  }
  flat.clearGroups();
  return flat;
}

/**
 * Turns the pure part list into one merged geometry per (motion group, material slot).
 * Transforms are baked in; moving-group parts stay relative to their pivot.
 */
export function buildVoyager(parts: readonly PartSpec[]): VoyagerModel {
  const pending = new Map<
    string,
    { group: MotionGroup; material: MaterialSlot; items: BufferGeometry[] }
  >();
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const euler = new Euler();
  const position = new Vector3();
  const unit = new Vector3(1, 1, 1);

  for (const part of parts) {
    const raw = createGeometry(part.shape);
    const geometry = normalise(raw);
    raw.dispose();
    quaternion.setFromEuler(euler.set(...part.rotation));
    matrix.compose(position.set(...part.position), quaternion, unit);
    geometry.applyMatrix4(matrix);

    const name = `${part.group}:${part.material}`;
    let bucket = pending.get(name);
    if (!bucket) {
      bucket = { group: part.group, material: part.material, items: [] };
      pending.set(name, bucket);
    }
    bucket.items.push(geometry);
  }

  const buckets: Bucket[] = [];
  let triangles = 0;
  for (const [name, { group, material, items }] of pending) {
    // Typed as non-null, but returns null on attribute mismatch at runtime.
    const merged = mergeGeometries(items, false) as BufferGeometry | null;
    for (const item of items) item.dispose();
    if (!merged) throw new Error(`Voyager: could not merge bucket ${name}`);
    merged.name = name;
    triangles += merged.getAttribute('position').count / 3;
    buckets.push({ name, group, material, geometry: merged });
  }

  return {
    buckets,
    stats: { drawCalls: buckets.length, triangles },
    dispose: () => {
      for (const bucket of buckets) bucket.geometry.dispose();
    },
  };
}
