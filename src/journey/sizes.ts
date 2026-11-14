import type { Route, Vec3 } from './route';
import { apparentSize } from './visibility';

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Angles (rad) off the travel direction (-Z) to a body's nearest limb. Inside VIEW_FULL the
 * body counts at its full apparent size; it fades to 0 by VIEW_EDGE, past which it is behind
 * or beside the camera and out of view. Generous enough for wide screens and the camera's turn
 * toward the nearest body.
 */
export const VIEW_FULL = deg(45);
export const VIEW_EDGE = deg(75);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Writes each route body's apparent size (viewport-height fraction) seen from `camera` into
 * `out`. A body sliding out of view past the camera shrinks to 0, so a passed giant never
 * keeps its dialog open from behind the camera.
 */
export function stopSizesInto(out: number[], route: Route, camera: Vec3, fovY: number): number[] {
  for (let i = 0; i < route.bodies.length; i++) {
    const body = route.bodies[i];
    if (!body) continue;
    const dz = body.position[2] - camera[2];
    const distance = Math.hypot(body.position[0] - camera[0], body.position[1] - camera[1], dz);
    const centre = Math.acos(Math.min(1, Math.max(-1, -dz / Math.max(distance, 1e-9))));
    const limb = centre - Math.asin(Math.min(1, body.radius / Math.max(distance, body.radius)));
    const inView = 1 - smoothstep(VIEW_FULL, VIEW_EDGE, limb);
    out[i] = inView * apparentSize(body.radius, distance, fovY);
  }
  return out;
}
