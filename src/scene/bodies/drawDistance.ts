/**
 * Draw-distance culling. Every body on the route sits ahead of the camera, so frustum culling
 * alone draws all of them from the first frame. Small bodies and the belt are hidden instead
 * while they would be too small (or too far) to see.
 */

/** A body narrower than this on screen is not drawn. */
export const MIN_DRAW_PIXELS = 4;

/** Distance at which a sphere of `radius` covers MIN_DRAW_PIXELS of a `viewportHeight` screen. */
export function drawDistance(radius: number, fovY: number, viewportHeight: number): number {
  return (radius * viewportHeight) / (Math.tan(fovY / 2) * MIN_DRAW_PIXELS);
}

/** Whether the camera is within `margin` of the belt's z span (either end order). */
export function beltInRange(
  cameraZ: number,
  span: { zStart: number; zEnd: number },
  margin: number,
): boolean {
  const near = Math.max(span.zStart, span.zEnd) + margin;
  const far = Math.min(span.zStart, span.zEnd) - margin;
  return cameraZ <= near && cameraZ >= far;
}
