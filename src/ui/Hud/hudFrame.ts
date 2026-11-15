import type { BodyId } from '../../content/schema';
import { countdown, earthDistanceAu, formatDelay, lightSeconds } from '../../journey/signal';
import { emptyTelemetry, formatDate, telemetryAt } from '../../journey/telemetry';

/** The elements the HUD writes each frame. */
export interface HudTargets {
  date: HTMLElement;
  au: HTMLElement;
  kms: HTMLElement;
  delay: HTMLElement;
  /** Gets `--p`, the current progress, for the map's position marker. */
  map: HTMLElement;
}

/** Below this speed (progress per second) the voyage counts as at rest for the countdown. */
const REST_SPEED = 1e-4;
const DAY_MS = 86_400_000;

/**
 * Writes telemetry, the signal delay and the map marker straight into the DOM, and only when a
 * shown value changes, so the HUD never re-renders React per frame.
 */
export function createHudFrame(
  targets: HudTargets,
  closePoints: readonly number[],
  bodies: readonly BodyId[],
  now: () => number = Date.now,
) {
  const telemetry = emptyTelemetry();
  // Last shown values, as numbers, so unchanged frames build no strings.
  let day = NaN;
  let au = NaN;
  let kms = NaN;
  let delay = NaN;
  let p = NaN;
  let restSince = 0;

  return {
    /** One frame: `time` in ms, eased `position` and `speed` from the journey runtime. */
    tick: (time: number, position: number, speed: number, reduced: boolean) => {
      telemetryAt(telemetry, position, closePoints, bodies, now());

      const nextDay = Math.floor(telemetry.time / DAY_MS);
      if (nextDay !== day) {
        day = nextDay;
        targets.date.textContent = formatDate(telemetry.time);
      }
      const nextAu = Math.round(telemetry.au * 100);
      if (nextAu !== au) {
        au = nextAu;
        targets.au.textContent = `${(nextAu / 100).toFixed(2)} AU`;
      }
      const nextKms = Math.round(telemetry.kms * 10);
      if (nextKms !== kms) {
        kms = nextKms;
        targets.kms.textContent = `${(nextKms / 10).toFixed(1)} km/s`;
      }

      if (speed > REST_SPEED) restSince = time;
      const light = lightSeconds(earthDistanceAu(telemetry.au));
      const seconds = reduced ? light : countdown(light, (time - restSince) / 1000);
      // Tenths below a minute, whole seconds above, matching formatDelay.
      const nextDelay = seconds < 60 ? Math.round(seconds * 10) : Math.floor(seconds) * 10;
      if (nextDelay !== delay) {
        delay = nextDelay;
        targets.delay.textContent = formatDelay(seconds);
      }

      // Negated so the first frame (p is NaN) always writes.
      if (!(Math.abs(position - p) <= 1e-4)) {
        p = position;
        targets.map.style.setProperty('--p', position.toFixed(4));
      }
    },
  };
}
