import type { Stop } from '../content/schema';
import { flightDone, flightTarget } from './flyTo';
import {
  capturePoint,
  type LapPose,
  lapAngleAt,
  lapMs,
  lapPoseInto,
  lapRadius,
  readingMs,
} from './orbit';
import { clampProgress, damp } from './progress';
import { pointAt, type Route, type Vec3 } from './route';
import { autoplaySlingSpeed, brakeCap, coastSpeed } from './sling';
import { boostFor, cruiseSpeed, dampBoost, throttleSpeed } from './throttle';

/**
 * The voyage's single motion model, stepped once per frame: throttle travel, capture into a lap
 * on the orbit clock, the slingshot coast, jumps (flights) and the reduced-motion hold. Pure and
 * allocation-free: it mutates a preallocated state.
 */

export type VoyageMode = 'free' | 'flight' | 'captured' | 'hold' | 'coast';
export type CaptureKind = 'lap' | 'drift';

export const EV_CAPTURED = 1;
export const EV_READ = 2;
export const EV_RELEASED = 4;
export const EV_FLIGHT_DONE = 8;
export const EV_AUTOPLAY_DONE = 16;

/** Coast covers this share of the gap to the next stop. */
const COAST_SHARE = 1 / 3;
/** Rate (1/s) at which an off-route ship eases back onto the route. */
const REJOIN_RATE = 4;
/** Heliopause drift speed, as a share of cruise. */
const DRIFT_SHARE = 0.05;
/** Autoplay hands the slingshot back to plain cruise after this long (s). */
const SLING_HANDOFF_S = 4;
/** Autoplay's landing gain (1/s) into the end of the route. */
const END_GAIN = 3;
const END_EPSILON = 1e-4;
const MATCH_EPSILON = 1e-6;

export interface Flight {
  from: number;
  to: number;
  duration: number;
  startAt: number;
}

export interface VoyageContext {
  route: Route;
  ids: readonly string[];
  capture: readonly number[];
  radius: readonly number[];
  /** Lap length (orbit-clock seconds). */
  lapS: readonly number[];
  /** Reduced-motion hold (s). */
  readS: readonly number[];
  /** Speed (progress/s) Voyager joins each stop's lap at. */
  entry: readonly number[];
  kind: readonly CaptureKind[];
  cruise: number;
}

export interface VoyageInput {
  phase: 'boot' | 'intro' | 'voyage';
  /** Throttle direction: 1 forward, -1 back, 0 idle. */
  dir: -1 | 0 | 1;
  /** Throttle intensity (0..1, more is clamped) for the orbit clock. */
  intensity: number;
  autoplay: boolean;
  reduced: boolean;
  flight: Flight | null;
  readStops: readonly string[];
}

export interface VoyageState {
  mode: VoyageMode;
  kind: CaptureKind;
  /** The captured, held or coasting-from stop, or -1. */
  stop: number;
  /** Route progress (held during a lap). */
  position: number;
  /** Speed along the route (progress/s). */
  speed: number;
  /** Orbit clock (ms). */
  clock: number;
  boost: number;
  /** Lap angular rates (rad per clock second). */
  entryRate: number;
  exitRate: number;
  /** Seconds since the coast began, or since the hold began. */
  elapsed: number;
  coastDistance: number;
  exitSpeed: number;
  /** A reduced-motion hold releases only after input has gone idle once. */
  armed: boolean;
  flightRef: Flight | null;
  /** Ship offset from the route, easing to zero after leaving a lap early. */
  offset: Vec3;
  ship: Vec3;
  heading: Vec3;
  /** `ship` and `heading` seen as a lap pose, for `lapPoseInto`. */
  lapPose: LapPose;
  /** Events raised by the last step (EV_* bits). */
  events: number;
  /** The stop an EV_READ or EV_CAPTURED refers to. */
  eventStop: number;
}

export function createVoyageContext(route: Route, stops: readonly Stop[]): VoyageContext {
  const cruise = cruiseSpeed(route.bodies.map((_, i) => capturePoint(route, i)));
  const kind = stops.map((s): CaptureKind => (s.body === 'heliopause' ? 'drift' : 'lap'));
  const lapS = stops.map((s) => lapMs(s.text) / 1000);
  const radius = route.bodies.map(lapRadius);
  return {
    route,
    ids: stops.map((s) => s.id),
    capture: route.bodies.map((_, i) => capturePoint(route, i)),
    radius,
    lapS,
    readS: stops.map((s) => readingMs(s.text) / 1000),
    entry: lapS.map((T, i) =>
      kind[i] === 'drift'
        ? cruise * DRIFT_SHARE
        : (((2 * Math.PI) / T) * (radius[i] ?? 1)) / route.length,
    ),
    kind,
    cruise,
  };
}

export const createVoyageInput = (): VoyageInput => ({
  phase: 'boot',
  dir: 0,
  intensity: 0,
  autoplay: false,
  reduced: false,
  flight: null,
  readStops: [],
});

/** The voyage begins captured in Earth orbit, waiting for the voyage phase. */
export function createVoyageState(ctx: VoyageContext): VoyageState {
  const s: VoyageState = {
    mode: 'captured',
    kind: ctx.kind[0] ?? 'lap',
    stop: 0,
    position: ctx.capture[0] ?? 0,
    speed: 0,
    clock: 0,
    boost: 1,
    entryRate: 0,
    exitRate: meanRate(ctx, 0),
    elapsed: 0,
    coastDistance: 0,
    exitSpeed: 0,
    armed: false,
    flightRef: null,
    offset: [0, 0, 0],
    ship: [0, 0, 0],
    heading: [0, 0, -1],
    lapPose: { position: [0, 0, 0], heading: [0, 0, -1] },
    events: 0,
    eventStop: -1,
  };
  s.lapPose.position = s.ship;
  s.lapPose.heading = s.heading;
  routeShip(s, ctx);
  return s;
}

const meanRate = (ctx: VoyageContext, i: number) => (2 * Math.PI) / (ctx.lapS[i] ?? 1);
const isRead = (ctx: VoyageContext, input: VoyageInput, i: number) =>
  input.readStops.includes(ctx.ids[i] ?? '');

/** Index of the first unread stop whose capture point is ahead of `p`, or -1. */
function nextUnread(ctx: VoyageContext, input: VoyageInput, p: number): number {
  for (let i = 0; i < ctx.capture.length; i++) {
    if ((ctx.capture[i] ?? 0) > p + MATCH_EPSILON && !isRead(ctx, input, i)) return i;
  }
  return -1;
}

/** Writes the ship onto the route at the current position, plus any easing offset. */
function routeShip(s: VoyageState, ctx: VoyageContext): void {
  pointAt(ctx.route, s.position, s.ship);
  for (let k = 0; k < 3; k++) s.ship[k] = (s.ship[k] ?? 0) + (s.offset[k] ?? 0);
  s.heading[0] = 0;
  s.heading[1] = 0;
  s.heading[2] = -1;
}

/** Eases the off-route offset toward zero; `keep` 0 drops it at once (reduced motion). */
function easeOffset(s: VoyageState, dt: number, keep: 0 | 1): void {
  const decay = keep * Math.exp(-REJOIN_RATE * Math.min(dt, 0.1));
  for (let k = 0; k < 3; k++) s.offset[k] = (s.offset[k] ?? 0) * decay;
}

/** Keeps the ship where it is while the route position takes over, easing the gap away. */
function leaveRoute(s: VoyageState, ctx: VoyageContext): void {
  const x = s.ship[0];
  const y = s.ship[1];
  const z = s.ship[2];
  pointAt(ctx.route, s.position, s.ship);
  s.offset[0] = x - s.ship[0];
  s.offset[1] = y - s.ship[1];
  s.offset[2] = z - s.ship[2];
  s.ship[0] = x;
  s.ship[1] = y;
  s.ship[2] = z;
}

function capture(s: VoyageState, ctx: VoyageContext, input: VoyageInput, i: number): void {
  s.stop = i;
  s.position = ctx.capture[i] ?? s.position;
  s.kind = ctx.kind[i] ?? 'lap';
  s.clock = 0;
  s.boost = 1;
  s.elapsed = 0;
  s.armed = input.dir === 0;
  const R = ctx.radius[i] ?? 1;
  s.entryRate = (Math.max(0, s.speed) * ctx.route.length) / R;
  s.exitRate = meanRate(ctx, i);
  s.mode = input.reduced ? 'hold' : 'captured';
  if (s.mode === 'hold') s.speed = 0;
  s.events |= EV_CAPTURED;
  s.eventStop = i;
}

function markRead(s: VoyageState): void {
  s.events |= EV_READ | EV_RELEASED;
  s.eventStop = s.stop;
}

/**
 * Moves forward or back by `s.speed`, braking into the next unread capture point and capturing
 * there on a forward crossing.
 */
function advance(s: VoyageState, ctx: VoyageContext, input: VoyageInput, dt: number): void {
  const next = s.speed > 0 ? nextUnread(ctx, input, s.position) : -1;
  if (next >= 0) {
    const cp = ctx.capture[next] ?? 1;
    s.speed = Math.min(s.speed, brakeCap(cp - s.position, ctx.entry[next] ?? 0));
    if (s.position + s.speed * dt >= cp) {
      capture(s, ctx, input, next);
      routeShip(s, ctx);
      return;
    }
  }
  s.position = clampProgress(s.position + s.speed * dt);
  if ((s.position <= 0 && s.speed < 0) || (s.position >= 1 && s.speed > 0)) s.speed = 0;
  easeOffset(s, dt, 1);
  routeShip(s, ctx);
}

function startFlight(s: VoyageState, ctx: VoyageContext, flight: Flight): void {
  if (s.mode === 'captured' || s.mode === 'hold') {
    s.events |= EV_RELEASED;
    s.eventStop = s.stop;
  }
  s.flightRef = flight;
  s.mode = 'flight';
  s.stop = -1;
  leaveRoute(s, ctx);
}

function stepFlight(
  s: VoyageState,
  ctx: VoyageContext,
  input: VoyageInput,
  flight: Flight,
  dt: number,
  now: number,
): void {
  const elapsed = now - flight.startAt;
  const done = flight.duration <= 0 || flightDone(elapsed, flight.duration);
  const p = done ? flight.to : flightTarget(flight.from, flight.to, elapsed, flight.duration);
  const previous = s.position;
  s.position = clampProgress(p);
  s.speed = done ? 0 : dt > 0 ? (s.position - previous) / dt : 0;
  easeOffset(s, dt, 1);
  routeShip(s, ctx);
  if (!done) return;
  s.events |= EV_FLIGHT_DONE;
  s.mode = 'free';
  s.speed = 0;
  for (let i = 0; i < ctx.capture.length; i++) {
    if (Math.abs((ctx.capture[i] ?? -1) - flight.to) < MATCH_EPSILON && !isRead(ctx, input, i)) {
      capture(s, ctx, input, i);
      routeShip(s, ctx);
      return;
    }
  }
}

function stepCaptured(s: VoyageState, ctx: VoyageContext, input: VoyageInput, dt: number) {
  const i = s.stop;
  if (input.reduced) {
    leaveRoute(s, ctx);
    s.mode = 'hold';
    s.elapsed = 0;
    s.speed = 0;
    s.armed = input.dir === 0;
    return;
  }
  if (input.dir < 0 && !input.autoplay) {
    // Back out: the stop stays unread.
    s.events |= EV_RELEASED;
    s.eventStop = i;
    s.mode = 'free';
    s.stop = -1;
    s.speed = 0;
    if (s.kind === 'lap') leaveRoute(s, ctx);
    return;
  }
  const target = !input.autoplay && input.dir > 0 ? boostFor(input.intensity) : 1;
  s.boost = input.autoplay ? 1 : dampBoost(s.boost, target, dt);
  s.clock += dt * 1000 * s.boost;
  const T = ctx.lapS[i] ?? 0;
  const t = s.clock / 1000;
  if (s.kind === 'drift') {
    s.position = clampProgress(s.position + (ctx.entry[i] ?? 0) * s.boost * dt);
    routeShip(s, ctx);
  } else {
    const theta = lapAngleAt(t, T, s.entryRate, s.exitRate);
    const body = ctx.route.bodies[i];
    if (body) lapPoseInto(s.lapPose, body, ctx.radius[i] ?? 1, theta);
  }
  if (t < T) return;
  // The lap is done: the stop is read, and the slingshot takes over.
  markRead(s);
  const R = ctx.radius[i] ?? 1;
  s.exitSpeed =
    s.kind === 'drift'
      ? (ctx.entry[i] ?? 0) * s.boost
      : (s.exitRate * s.boost * R) / ctx.route.length;
  const nextCp = i + 1 < ctx.capture.length ? (ctx.capture[i + 1] ?? 1) : 1;
  s.coastDistance = Math.max(0, nextCp - s.position) * COAST_SHARE;
  s.speed = s.exitSpeed;
  s.elapsed = 0;
  s.mode = 'coast';
  s.offset[0] = s.offset[1] = s.offset[2] = 0;
  routeShip(s, ctx);
}

function stepCoast(s: VoyageState, ctx: VoyageContext, input: VoyageInput, dt: number) {
  if (!input.autoplay && input.dir !== 0) {
    s.mode = 'free';
    s.stop = -1;
    stepFree(s, ctx, input, dt);
    return;
  }
  s.elapsed += dt;
  if (input.autoplay) {
    s.speed = autoplaySlingSpeed(s.elapsed, ctx.cruise, s.exitSpeed);
    if (s.elapsed >= SLING_HANDOFF_S) s.mode = 'free';
  } else {
    s.speed = coastSpeed(s.elapsed, s.coastDistance, s.exitSpeed);
    if (s.elapsed > 2 && s.speed < ctx.cruise * 1e-3) {
      s.speed = 0;
      s.mode = 'free';
    }
  }
  if (s.mode === 'free') s.stop = -1;
  advance(s, ctx, input, dt);
}

function stepFree(s: VoyageState, ctx: VoyageContext, input: VoyageInput, dt: number) {
  const dir = input.autoplay ? 1 : input.dir;
  if (input.autoplay && nextUnread(ctx, input, s.position) < 0) {
    // Past the last stop: land at the end of the route.
    const v = Math.min(ctx.cruise, END_GAIN * (1 - s.position));
    s.speed = damp(s.speed, v, 8, dt);
    if (1 - s.position < END_EPSILON) {
      s.position = 1;
      s.speed = 0;
      s.events |= EV_AUTOPLAY_DONE;
      routeShip(s, ctx);
      return;
    }
  } else {
    s.speed = throttleSpeed(s.speed, dir, ctx.cruise, dt);
  }
  advance(s, ctx, input, dt);
}

function stepHold(s: VoyageState, ctx: VoyageContext, input: VoyageInput, dt: number) {
  if (input.dir === 0) s.armed = true;
  s.elapsed += dt;
  easeOffset(s, dt, input.reduced ? 0 : 1);
  routeShip(s, ctx);
  const release =
    (s.armed && input.dir > 0 && !input.autoplay) || s.elapsed >= (ctx.readS[s.stop] ?? 0);
  if (!release) return;
  markRead(s);
  s.mode = 'free';
  s.stop = -1;
  s.speed = 0;
}

export function stepVoyageInto(
  s: VoyageState,
  input: VoyageInput,
  ctx: VoyageContext,
  dt: number,
  now: number,
): VoyageState {
  s.events = 0;
  if (input.phase !== 'voyage') return s;
  const flight = input.flight;
  if (flight && flight !== s.flightRef) startFlight(s, ctx, flight);
  if (!flight) s.flightRef = null;
  switch (s.mode) {
    case 'flight':
      if (flight) stepFlight(s, ctx, input, flight, dt, now);
      else s.mode = 'free';
      break;
    case 'captured':
      stepCaptured(s, ctx, input, dt);
      break;
    case 'hold':
      stepHold(s, ctx, input, dt);
      break;
    case 'coast':
      stepCoast(s, ctx, input, dt);
      break;
    case 'free':
      stepFree(s, ctx, input, dt);
      break;
  }
  return s;
}
