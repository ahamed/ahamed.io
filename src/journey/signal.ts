/** Light travel time per astronomical unit, in seconds. */
const SECONDS_PER_AU = 499.005;

/** Earth's distance from the Sun at launch, as in the telemetry table. */
const EARTH_AU = 1.01;

/** One-way light time across `au`. */
export const lightSeconds = (au: number): number => au * SECONDS_PER_AU;

/**
 * Voyager's distance from Earth, from its distance from the Sun: the radial gap on the way
 * out (Earth's place in its orbit is ignored, so this is good to about ±1 AU).
 */
export const earthDistanceAu = (sunAu: number): number => Math.max(0, sunAu - EARTH_AU);

/**
 * A reply travelling home: the light time left after resting `restSec` seconds, counting
 * down and starting again from the full light time each time it reaches zero.
 */
export function countdown(lightSec: number, restSec: number): number {
  if (lightSec <= 0) return 0;
  return lightSec - (Math.max(0, restSec) % lightSec);
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** "1.3 s", "8m 19s" or "16h 51m 18s". */
export function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  if (h === 0) return `${String(m)}m ${pad(s)}s`;
  return `${String(h)}h ${pad(m)}m ${pad(s)}s`;
}
