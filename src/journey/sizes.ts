import type { Route, Vec3 } from './route';
import { apparentSize } from './visibility';

/** Writes each route body's apparent size (viewport-height fraction) seen from `camera` into `out`. */
export function stopSizesInto(out: number[], route: Route, camera: Vec3, fovY: number): number[] {
  for (let i = 0; i < route.bodies.length; i++) {
    const body = route.bodies[i];
    if (!body) continue;
    const distance = Math.hypot(
      body.position[0] - camera[0],
      body.position[1] - camera[1],
      body.position[2] - camera[2],
    );
    out[i] = apparentSize(body.radius, distance, fovY);
  }
  return out;
}
