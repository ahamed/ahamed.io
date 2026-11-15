import type { BodyId } from '../content/schema';

/** Voyager 1's state when it is at a stop: date (ISO, UTC), distance from the Sun, speed. */
export interface Waypoint {
  date: string;
  au: number;
  /** Heliocentric speed. */
  kms: number;
  /** True for real Voyager 1 events; false for placed or approximate values (// VERIFY). */
  verified: boolean;
}

/**
 * Telemetry at each stop, following Voyager 1's real timeline. Bodies Voyager never visited
 * are placed between the real waypoints, and every speed is approximate.
 */
export const TELEMETRY: Record<BodyId, Waypoint> = {
  earth: { date: '1977-09-05', au: 1.01, kms: 36.0, verified: true }, // launch
  moon: { date: '1977-09-18', au: 1.02, kms: 34.5, verified: true }, // Earth–Moon photo
  // VERIFY: Mars-orbit crossing and asteroid-belt dates, distances and speeds are placed.
  mars: { date: '1977-12-10', au: 1.52, kms: 25.0, verified: false },
  phobos: { date: '1977-12-12', au: 1.53, kms: 24.8, verified: false },
  deimos: { date: '1977-12-15', au: 1.55, kms: 24.6, verified: false },
  ceres: { date: '1978-02-15', au: 2.3, kms: 18.0, verified: false },
  vesta: { date: '1978-04-20', au: 2.6, kms: 16.5, verified: false },
  pallas: { date: '1978-06-25', au: 2.95, kms: 15.2, verified: false },
  hygiea: { date: '1978-09-01', au: 3.3, kms: 14.0, verified: false },
  jupiter: { date: '1979-03-05', au: 5.2, kms: 25.0, verified: true }, // closest approach
  // VERIFY: moon encounter dates are approximate (all within the Jupiter flyby).
  io: { date: '1979-03-05', au: 5.2, kms: 25.0, verified: false },
  europa: { date: '1979-03-05', au: 5.2, kms: 25.0, verified: false },
  ganymede: { date: '1979-03-05', au: 5.2, kms: 25.0, verified: false },
  callisto: { date: '1979-03-06', au: 5.2, kms: 25.0, verified: false },
  saturn: { date: '1980-11-12', au: 9.5, kms: 21.0, verified: true }, // closest approach
  // VERIFY: Saturn moon dates are approximate (all within the Saturn flyby).
  titan: { date: '1980-11-12', au: 9.5, kms: 21.0, verified: false },
  rhea: { date: '1980-11-12', au: 9.5, kms: 21.0, verified: false },
  iapetus: { date: '1980-11-13', au: 9.5, kms: 21.0, verified: false },
  enceladus: { date: '1980-11-13', au: 9.5, kms: 21.0, verified: false },
  // VERIFY: the comets, Pluto, Arrokoth and Eris are placed on the cruise; Voyager 1 never
  // visited them. Pluto takes the Pale Blue Dot day (14 Feb 1990, about 40 AU) and Eris the
  // day Voyager 1 became the most distant human-made object (17 Feb 1998, about 69.4 AU).
  'support-comet': { date: '1983-06-01', au: 18.0, kms: 17.5, verified: false },
  'recruiter-comet': { date: '1985-06-01', au: 24.0, kms: 17.45, verified: false },
  'upcoming-comet': { date: '1987-06-01', au: 30.0, kms: 17.4, verified: false },
  pluto: { date: '1990-02-14', au: 40.1, kms: 17.3, verified: false },
  charon: { date: '1990-02-14', au: 40.1, kms: 17.3, verified: false },
  arrokoth: { date: '1991-06-01', au: 44.0, kms: 17.3, verified: false },
  eris: { date: '1998-02-17', au: 69.4, kms: 17.2, verified: false },
  heliopause: { date: '2012-08-25', au: 121.6, kms: 17.0, verified: true },
};

/** When Voyager 1 crossed the heliopause. */
export const HELIOPAUSE_TIME = Date.parse(TELEMETRY.heliopause.date);
/** VERIFY: Voyager 1's outward drift since the heliopause, about 3.57 AU a year. */
export const AU_PER_YEAR = 3.57;
/** VERIFY: approximate heliocentric speed today. */
const KMS_NOW = 16.9;
const YEAR_MS = 365.25 * 86_400_000;

export interface Telemetry {
  /** Mission date as a UTC timestamp (ms). */
  time: number;
  au: number;
  kms: number;
}

export const emptyTelemetry = (): Telemetry => ({ time: 0, au: 0, kms: 0 });

const TIMES = new Map<BodyId, number>(
  Object.entries(TELEMETRY).map(([id, w]) => [id as BodyId, Date.parse(w.date)]),
);

function writeStop(out: Telemetry, body: BodyId | undefined): Telemetry {
  if (!body) return out;
  out.time = TIMES.get(body) ?? 0;
  out.au = TELEMETRY[body].au;
  out.kms = TELEMETRY[body].kms;
  return out;
}

/**
 * Voyager's telemetry at progress `p`, interpolated between the stops on either side; after
 * the last stop it moves toward today (`now`) at the end of the route. Writes into `out`.
 */
export function telemetryAt(
  out: Telemetry,
  p: number,
  closePoints: readonly number[],
  bodies: readonly BodyId[],
  now: number,
): Telemetry {
  const last = closePoints.length - 1;
  if (p <= (closePoints[0] ?? 0)) return writeStop(out, bodies[0]);

  let i = 0;
  while (i < last && p > (closePoints[i + 1] ?? 1)) i++;
  const fromCp = closePoints[i] ?? 0;
  writeStop(out, bodies[i]);

  let toTime: number;
  let toAu: number;
  let toKms: number;
  let toCp: number;
  if (i < last) {
    const next = bodies[i + 1];
    if (!next) return out;
    toTime = TIMES.get(next) ?? out.time;
    toAu = TELEMETRY[next].au;
    toKms = TELEMETRY[next].kms;
    toCp = closePoints[i + 1] ?? 1;
  } else {
    toTime = now;
    toAu = TELEMETRY.heliopause.au + AU_PER_YEAR * ((now - HELIOPAUSE_TIME) / YEAR_MS);
    toKms = KMS_NOW;
    toCp = 1;
  }
  const t = toCp > fromCp ? Math.min(1, (p - fromCp) / (toCp - fromCp)) : 1;
  out.time += (toTime - out.time) * t;
  out.au += (toAu - out.au) * t;
  out.kms += (toKms - out.kms) * t;
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "05 Sep 1977", in UTC (fixed month names: locales disagree on "Sep" vs "Sept"). */
export function formatDate(time: number): string {
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getUTCMonth()] ?? ''} ${String(date.getUTCFullYear())}`;
}
