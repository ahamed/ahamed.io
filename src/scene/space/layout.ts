/** Shared sizes and draw order for the camera-following sky (no three.js imports). */

/** Radius of the sky sphere; well inside the camera's far plane (5000). */
export const SKY_RADIUS = 2000;

/** Sky first, then stars, then the Sun, then everything else (renderOrder 0). */
export const SKY_ORDER = { sky: -3, stars: -2, sun: -1 } as const;
