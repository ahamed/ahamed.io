/**
 * Voyager's fixed orientation in the chase view (no three.js imports). The model is built with
 * its dish on +Z; the chase camera trails on +Z. A half turn puts the bus toward the camera and
 * the dish ahead, along the direction of travel; a small yaw and pitch give a three-quarter back
 * view so the dish rim and every boom stand clear of the bus. The craft never rolls: the real
 * Voyager 1 is 3-axis stabilised.
 */

const DEG = Math.PI / 180;

type Vec3 = [number, number, number];

/** Model scale: about a third larger than M1's 0.45, so Voyager reads clearly in the foreground.
 * Scaling the model rather than moving the camera keeps every body's on-screen size, and so its
 * dialog timing, unchanged. */
export const VOYAGER_SCALE = 0.6;

/** Euler XYZ (radians): pitch, half turn plus yaw, no roll. */
export const VOYAGER_ORIENTATION: Readonly<Vec3> = [14 * DEG, Math.PI - 28 * DEG, 0];

/** Writes the dish's world-facing axis (the model's +Z after the orientation) into `out`. */
export function dishAxisInto(out: Vec3): Vec3 {
  const [pitch, yaw] = VOYAGER_ORIENTATION;
  // Euler XYZ applies Rz, then Ry, then Rx to a vector. Rz is identity (no roll).
  // Ry(yaw)·(0,0,1) = (sin yaw, 0, cos yaw); then Rx(pitch).
  const x = Math.sin(yaw);
  const z = Math.cos(yaw);
  out[0] = x;
  out[1] = -z * Math.sin(pitch);
  out[2] = z * Math.cos(pitch);
  return out;
}
