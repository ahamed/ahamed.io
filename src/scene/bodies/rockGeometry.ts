import { BufferAttribute, Color, IcosahedronGeometry, type BufferGeometry } from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Vec3 } from '../../journey/route';
import { ROCK_PRESETS, rockPoint, rockShade, type RockPresetId } from './rockShape';

/**
 * Unit-radius rock: an icosphere (10·(detail+1)²+2 shared vertices) displaced by the preset's
 * shape, with smooth normals and per-vertex colour = `color` × the preset's shade.
 */
export function createRockGeometry(
  preset: RockPresetId,
  detail: number,
  color: string,
): BufferGeometry {
  const shape = ROCK_PRESETS[preset];
  const sphere = new IcosahedronGeometry(1, detail);
  sphere.deleteAttribute('normal');
  sphere.deleteAttribute('uv');
  const geometry = mergeVertices(sphere);
  sphere.dispose();

  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const base = new Color(color);
  const dir: Vec3 = [0, 0, 0];
  const point: Vec3 = [0, 0, 0];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const k = 1 / Math.hypot(x, y, z);
    dir[0] = x * k;
    dir[1] = y * k;
    dir[2] = z * k;
    rockPoint(point, dir, shape);
    position.setXYZ(i, point[0], point[1], point[2]);
    const shade = rockShade(dir, shape);
    colors[i * 3] = base.r * shade;
    colors[i * 3 + 1] = base.g * shade;
    colors[i * 3 + 2] = base.b * shade;
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
