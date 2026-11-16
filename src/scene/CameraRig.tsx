import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { Box3, MathUtils, PerspectiveCamera, Vector3, type Camera, type Group } from 'three';
import {
  aimTowardInto,
  aimWeight,
  chasePoseInto,
  type ChasePose,
  orbitPoseInto,
  viewAreaInto,
  type ViewArea,
} from '../journey/camera';
import { DOT_FROM_TURN, finalePoseInto, finaleReveal, finaleTurn } from '../journey/finale';
import { introPoseInto, introProgress, introStartPose } from '../journey/intro';
import { damp } from '../journey/progress';
import {
  dockRectInto,
  dockWidth,
  easeOffset,
  placeDialogInto,
  type Placement,
  type PlacementInput,
  type Rect,
  type Spot,
} from '../journey/placement';
import { pointAt, type Route, type Vec3 } from '../journey/route';
import { stopSizesInto } from '../journey/sizes';
import { chooseOpenStop, dialogOpacity, dialogScale } from '../journey/visibility';
import {
  createVoyageContext,
  createVoyageInput,
  createVoyageState,
  EV_AUTOPLAY_DONE,
  EV_FLIGHT_DONE,
  EV_READ,
  stepVoyageInto,
  type VoyageContext,
  type VoyageInput,
  type VoyageState,
} from '../journey/voyage';
import { STOPS } from '../content/journey';
import { activeThrottle, journeyRuntime, type JourneyStore, type Orbit } from '../store/journey';
import { plasmaLink } from '../audio/plasmaLink';
import { plasmaGain, type PlasmaLayout } from '../audio/plasma';
import { finaleLayer } from '../ui/Finale/registry';
import { dialogElements, dialogSizes } from '../ui/TerminalDialog/registry';
import { heliopauseLayout } from './space/heliosphere';
import { useReducedMotion } from './useReducedMotion';

/** Rate (1/s) the camera blends between the chase and orbit views: about 1.2 s. */
const CAPTURE_RATE = 3;
/** Screens at least this wide dock the dialog; narrower ones show a bottom sheet. */
const DOCK_MIN_WIDTH = 768;
/** Distance (px) the dialog keeps from the viewport edges. */
const EDGE_MARGIN = 16;
/** Used for the first frame a dialog is open, before its size has been observed. */
const FALLBACK_DIALOG = { w: 416, h: 220 };

interface Props {
  route: Route;
  store: JourneyStore;
  voyager: RefObject<Group | null>;
  /** Camera-following sky group (stars, Milky Way, Sun): moved with the camera, no parallax. */
  sky?: RefObject<Group | null>;
  /** The voyage's motion state; tests pass one to start anywhere. */
  voyage?: VoyageState;
}

const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * The single per-frame loop: eases progress, snaps when idle, flies the chase camera and
 * drives dialog open state + placement. Allocation-free apart from CSS var strings.
 */
export function CameraRig({ route, store, voyager, sky, voyage }: Props) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  // useFrame always runs the latest callback, so the closure sees the current preference.
  const reducedMotion = useReducedMotion();

  // Per-instance scratch, created on the first frame and reused (no per-frame allocation).
  const scratchRef = useRef<Scratch | null>(null);

  useFrame((_, dt) => {
    scratchRef.current ??= createScratch(route, voyage);
    const scratch = scratchRef.current;
    const state = store.getState();
    const now = performance.now();
    const v = scratch.voyage;

    // One step of the voyage: throttle, capture, lap, coast, flights, hold.
    const input = scratch.voyageInput;
    input.phase = state.phase;
    input.dir = activeThrottle(state, now);
    input.intensity = state.intensity;
    input.autoplay = state.autoplay;
    input.reduced = reducedMotion;
    input.flight = state.flight;
    input.readStops = state.readStops;
    stepVoyageInto(v, input, scratch.ctx, dt, now);
    if (v.events & EV_FLIGHT_DONE) state.endFlight();
    if (v.events & EV_READ) state.markRead(scratch.ctx.ids[v.eventStop] ?? '');
    if (v.events & EV_AUTOPLAY_DONE && store.getState().autoplay) state.toggleAutoplay();
    const holding = v.mode === 'captured' || v.mode === 'hold';
    const orbit: Orbit =
      v.mode === 'captured' ? v.kind : v.mode === 'hold' || v.mode === 'coast' ? v.mode : 'none';
    const atStop = orbit === 'none' ? null : (scratch.ctx.ids[v.stop] ?? null);
    state.setOrbit(orbit, atStop);

    journeyRuntime.speed = holding ? 0 : Math.abs(v.speed);
    journeyRuntime.position = v.position;
    journeyRuntime.captured = holding ? v.stop : -1;
    journeyRuntime.orbitClock = v.clock;
    for (let k = 0; k < 3; k++) {
      journeyRuntime.ship[k] = v.ship[k] ?? 0;
      journeyRuntime.heading[k] = v.heading[k] ?? 0;
    }
    const weightTarget = holding && state.phase === 'voyage' ? 1 : 0;
    if (holding) scratch.viewStop = v.stop;
    journeyRuntime.captureWeight = reducedMotion
      ? weightTarget
      : damp(journeyRuntime.captureWeight, weightTarget, CAPTURE_RATE, dt);
    const orbitWeight = smooth(journeyRuntime.captureWeight);
    const p = journeyRuntime.position;

    chasePoseInto(scratch.pose, route, p);
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    stopSizesInto(scratch.sizes, route, scratch.pose.position, fovY);

    // Turn partly toward the nearest body (more on portrait screens) so it stays in view.
    let nearest = 0;
    for (let i = 1; i < scratch.sizes.length; i++) {
      if ((scratch.sizes[i] ?? 0) > (scratch.sizes[nearest] ?? 0)) nearest = i;
    }
    const nearestBody = route.bodies[nearest];
    const weight = aimWeight(scratch.sizes[nearest] ?? 0, size.width / Math.max(1, size.height));
    if (nearestBody) {
      aimTowardInto(scratch.pose.lookAt, scratch.pose.lookAt, nearestBody.position, weight);
    }
    // The finale: orbit to Voyager's front and look back at Earth, after the body aim.
    pointAt(route, p, scratch.ship);
    finalePoseInto(scratch.pose, scratch.ship, finaleTurn(p), scratch.earth);
    // Boot holds the wide establishing view; the intro sweeps from it into the chase view.
    const { phase, introStartAt } = store.getState();
    if (phase === 'boot') {
      introPoseInto(scratch.pose, scratch.intro, 0);
    } else if (phase === 'intro') {
      const t = introProgress(now - introStartAt);
      introPoseInto(scratch.pose, scratch.intro, t);
      if (t >= 1) state.endIntro();
    }
    blendOrbitView(scratch, route, camera, size, fovY, orbitWeight);
    camera.position.set(...scratch.pose.position);
    camera.lookAt(...scratch.pose.lookAt);
    sky?.current?.position.copy(camera.position);
    if (voyager.current) voyager.current.position.set(...journeyRuntime.ship);
    plasmaLink.set(plasmaGain(scratch.ship[2], scratch.plasma));
    writeFinale(scratch, p, camera, size, state);

    const currentIndex = scratch.openIndex;
    // Dialogs open only once the voyage has begun and the intro has landed. A captured stop's
    // dialog stays open for the whole capture.
    const openIndex =
      phase !== 'voyage' ? null : holding ? v.stop : chooseOpenStop(scratch.sizes, currentIndex);
    scratch.openIndex = openIndex;
    const openBody = openIndex === null ? undefined : route.bodies[openIndex];
    if (openIndex !== currentIndex) state.setOpenStop(openBody?.id ?? null);

    if (!openBody) {
      scratch.spot = null;
      return;
    }
    const element = dialogElements.get(openBody.id);
    if (!element) return;
    if (openIndex !== currentIndex) {
      scratch.spot = null;
      scratch.writtenRect.fill(NaN);
      scratch.writtenBody.fill(NaN);
      scratch.last.fill(NaN);
    }
    const dialogOrbit = atStop === openBody.id ? orbit : 'none';
    if (element.dataset.orbit !== dialogOrbit) element.dataset.orbit = dialogOrbit;
    // Fresh state: this frame may have just marked the stop read.
    const read = store.getState().readStops.includes(openBody.id) ? 'true' : 'false';
    if (element.dataset.read !== read) element.dataset.read = read;

    // The body's disc and Voyager's box on screen, in CSS px.
    const body = projectInto(scratch.anchor.set(...openBody.position), camera, size);
    const bodySize = scratch.sizes[openIndex ?? 0] ?? 0;
    const disc = scratch.disc;
    disc.x = body.x;
    disc.y = body.y;
    // The body's true on-screen radius out to its footprint (Saturn's rings), from its real
    // distance: the dialog-size fade near the view edge must not shrink what it has to avoid.
    const [bx, by, bz] = openBody.position;
    const distance = Math.hypot(
      bx - camera.position.x,
      by - camera.position.y,
      bz - camera.position.z,
    );
    disc.r =
      (openBody.footprint * size.height) / (2 * Math.tan(fovY / 2) * Math.max(distance, 1e-3));
    voyagerRectInto(scratch, voyager.current, camera, size);

    const dockShare = openIndex === scratch.viewStop ? orbitWeight : 0;
    const scale = dialogScale(bodySize) + (1 - dialogScale(bodySize)) * dockShare;
    const measured = dialogSizes.get(openBody.id);
    const base = measured && measured.w > 0 ? measured : FALLBACK_DIALOG;
    scratch.dialog.w = base.w * scale;
    scratch.dialog.h = base.h * scale;
    scratch.input.viewport.w = size.width;
    scratch.input.viewport.h = size.height;
    scratch.input.previous = scratch.spot;
    const placed = placeDialogInto(scratch.placed, scratch.input);

    // Follow the body every frame; ease only when the dialog moves to a different spot.
    const targetX = placed.x - disc.x;
    const targetY = placed.y - disc.y;
    if (scratch.spot === null) {
      scratch.gliding = false;
    } else if (placed.spot !== scratch.spot) {
      scratch.gliding = true;
    }
    if (scratch.gliding) {
      scratch.offset[0] = easeOffset(scratch.offset[0], targetX, dt, reducedMotion);
      scratch.offset[1] = easeOffset(scratch.offset[1], targetY, dt, reducedMotion);
      if (scratch.offset[0] === targetX && scratch.offset[1] === targetY) scratch.gliding = false;
    } else {
      scratch.offset[0] = targetX;
      scratch.offset[1] = targetY;
    }
    if (placed.spot !== scratch.spot) element.dataset.spot = placed.spot;
    scratch.spot = placed.spot;

    // During a capture the dialog glides to the dock, at the left edge.
    dockRectInto(scratch.dock, scratch.input.viewport, scratch.dialog, EDGE_MARGIN);
    const x = disc.x + scratch.offset[0];
    const y = disc.y + scratch.offset[1];
    const opacity = dialogOpacity(bodySize);
    writeVar(element, '--x', x + (scratch.dock.x - x) * dockShare, 'px', scratch.last, 0);
    writeVar(element, '--y', y + (scratch.dock.y - y) * dockShare, 'px', scratch.last, 1);
    writeVar(element, '--scale', scale, '', scratch.last, 2);
    writeVar(element, '--opacity', opacity + (1 - opacity) * dockShare, '', scratch.last, 3);
    writeRect(element, scratch.voyagerRect, scratch);
    writeBody(element, disc, scratch);
  });

  return null;
}

/**
 * Blends the chase pose in `scratch.pose` toward the orbit view of `scratch.viewStop` by
 * `weight`, and shifts the projection so the body sits in the middle of the space the dialog
 * (docked on wide screens, a bottom sheet on narrow ones) leaves free.
 */
function blendOrbitView(
  scratch: Scratch,
  route: Route,
  camera: Camera,
  size: { width: number; height: number },
  fovY: number,
  weight: number,
): void {
  const perspective = camera instanceof PerspectiveCamera ? camera : null;
  const body = route.bodies[scratch.viewStop];
  if (weight <= 0 || !body) {
    if (scratch.offsetApplied) {
      perspective?.clearViewOffset();
      scratch.offsetApplied = false;
    }
    return;
  }
  const measured = dialogSizes.get(body.id);
  const base = measured && measured.w > 0 ? measured : FALLBACK_DIALOG;
  const wide = size.width >= DOCK_MIN_WIDTH;
  const covered = scratch.covered;
  covered.dock = wide ? dockWidth(base.w, EDGE_MARGIN) : 0;
  covered.sheet = wide ? 0 : base.h;
  scratch.viewport.w = size.width;
  scratch.viewport.h = size.height;
  const area = viewAreaInto(scratch.area, scratch.viewport, covered, fovY, weight);
  const radius = scratch.ctx.radius[scratch.viewStop] ?? body.radius;
  const orbit = orbitPoseInto(scratch.orbitPose, body, radius, area.fovY, area.aspect);
  for (let i = 0; i < 3; i++) {
    const from = scratch.pose.position[i] ?? 0;
    const look = scratch.pose.lookAt[i] ?? 0;
    scratch.pose.position[i] = from + ((orbit.position[i] ?? 0) - from) * weight;
    scratch.pose.lookAt[i] = look + ((orbit.lookAt[i] ?? 0) - look) * weight;
  }
  if (perspective) {
    perspective.setViewOffset(
      size.width,
      size.height,
      area.offsetX,
      area.offsetY,
      size.width,
      size.height,
    );
    scratch.offsetApplied = true;
  }
}

/** Shows the caption and card, and tells the bracket where the Pale Blue Dot is on screen. */
function writeFinale(
  scratch: Scratch,
  p: number,
  camera: Camera,
  size: { width: number; height: number },
  state: ReturnType<JourneyStore['getState']>,
): void {
  const reveal = finaleReveal(p);
  state.setFinaleShown(reveal > 0);
  const element = finaleLayer.element;
  if (!element) return;
  writeVar(element, '--reveal', reveal, '', scratch.finaleLast, 0);
  const shown = finaleTurn(p) > DOT_FROM_TURN;
  const dotState = shown ? 'shown' : 'hidden';
  if (element.dataset.dot !== dotState) element.dataset.dot = dotState;
  if (!shown) return;
  const dot = projectInto(scratch.anchor.set(...scratch.earth), camera, size);
  writeVar(element, '--dot-x', dot.x, 'px', scratch.finaleLast, 1);
  writeVar(element, '--dot-y', dot.y, 'px', scratch.finaleLast, 2);
}

interface Scratch {
  ctx: VoyageContext;
  voyage: VoyageState;
  voyageInput: VoyageInput;
  /** The stop the orbit view frames (kept while blending back to the chase view). */
  viewStop: number;
  orbitPose: ChasePose;
  area: ViewArea;
  /** Whether the camera has a view offset applied. */
  offsetApplied: boolean;
  dock: { x: number; y: number };
  covered: { dock: number; sheet: number };
  viewport: { w: number; h: number };
  /** Where the plasma texture swells along the route. */
  plasma: PlasmaLayout;
  /** The wide view the intro sweep starts from. */
  intro: ChasePose;
  /** Earth's position: where the Pale Blue Dot is, seen from the finale. */
  earth: Vec3;
  finaleLast: number[];
  pose: ChasePose;
  ship: Vec3;
  sizes: number[];
  anchor: Vector3;
  openIndex: number | null;
  last: number[];
  spot: Spot | null;
  gliding: boolean;
  /** The dialog's top-left relative to the body's screen centre. */
  offset: [number, number];
  disc: { x: number; y: number; r: number };
  dialog: { w: number; h: number };
  voyagerRect: Rect;
  /** Voyager's model box relative to the ship, measured once its model exists. */
  box: Box3;
  boxMeasured: boolean;
  input: PlacementInput;
  placed: Placement;
  writtenRect: number[];
  writtenBody: number[];
}

function createScratch(route: Route, voyage?: VoyageState): Scratch {
  const disc = { x: 0, y: 0, r: 0 };
  const dialog = { w: 0, h: 0 };
  const voyagerRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  const earth = route.bodies.find((b) => b.body === 'earth')?.position ?? [0, 0, 0];
  const ctx = createVoyageContext(route, STOPS);
  return {
    ctx,
    voyage: voyage ?? createVoyageState(ctx),
    voyageInput: createVoyageInput(),
    viewStop: 0,
    orbitPose: { position: [0, 0, 0], lookAt: [0, 0, 0] },
    area: { aspect: 1, fovY: 1, offsetX: 0, offsetY: 0 },
    offsetApplied: false,
    dock: { x: 0, y: 0 },
    covered: { dock: 0, sheet: 0 },
    viewport: { w: 0, h: 0 },
    earth: [...earth],
    intro: introStartPose(earth),
    plasma: {
      zEris: route.bodies.find((b) => b.body === 'eris')?.position[2] ?? 0,
      zCross: heliopauseLayout(route).zCross,
      zEnd: -route.length,
    },
    finaleLast: [NaN, NaN, NaN],
    pose: { position: [0, 0, 0], lookAt: [0, 0, 0] },
    ship: [0, 0, 0],
    sizes: route.bodies.map(() => 0),
    anchor: new Vector3(),
    openIndex: null,
    last: [NaN, NaN, NaN, NaN],
    spot: null,
    gliding: false,
    offset: [0, 0],
    disc,
    dialog,
    voyagerRect,
    box: new Box3(),
    boxMeasured: false,
    input: {
      viewport: { w: 0, h: 0 },
      body: disc,
      voyager: voyagerRect,
      dialog,
      previous: null,
      margin: EDGE_MARGIN,
    },
    placed: { spot: 'right', x: 0, y: 0 },
    writtenRect: [NaN, NaN, NaN, NaN],
    writtenBody: [NaN, NaN, NaN],
  };
}

/** Projects world point `v` (mutated) to CSS px; returns `v` with x, y in px. */
function projectInto(v: Vector3, camera: Camera, size: { width: number; height: number }) {
  v.project(camera);
  v.x = ((v.x + 1) / 2) * size.width;
  v.y = ((1 - v.y) / 2) * size.height;
  return v;
}

/**
 * Writes Voyager's on-screen bounding box into `scratch.voyagerRect`: its model's world box,
 * measured once relative to the ship, with the eight corners projected each frame.
 */
function voyagerRectInto(
  scratch: Scratch,
  ship: Group | null,
  camera: Camera,
  size: { width: number; height: number },
): void {
  const rect = scratch.voyagerRect;
  if (!ship) {
    rect.x = rect.y = -1;
    rect.w = rect.h = 0;
    return;
  }
  const box = scratch.box;
  if (!scratch.boxMeasured) {
    box.setFromObject(ship);
    if (box.isEmpty()) return;
    box.min.sub(ship.position);
    box.max.sub(ship.position);
    scratch.boxMeasured = true;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 8; i++) {
    const corner = scratch.anchor.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    );
    projectInto(corner.add(ship.position), camera, size);
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
  }
  rect.x = minX;
  rect.y = minY;
  rect.w = maxX - minX;
  rect.h = maxY - minY;
}

/** Publishes the body's screen disc on the dialog as "x,y,r" (for E2E), only on change. */
function writeBody(element: HTMLElement, disc: Scratch['disc'], scratch: Scratch): void {
  const last = scratch.writtenBody;
  const x = Math.round(disc.x);
  const y = Math.round(disc.y);
  const r = Math.round(disc.r);
  if (x === last[0] && y === last[1] && r === last[2]) return;
  last[0] = x;
  last[1] = y;
  last[2] = r;
  element.dataset.bodyRect = `${String(x)},${String(y)},${String(r)}`;
}

/** Publishes Voyager's screen rect on the dialog (for tests and dev tools), only on change. */
function writeRect(element: HTMLElement, rect: Rect, scratch: Scratch): void {
  const last = scratch.writtenRect;
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  const w = Math.round(rect.w);
  const h = Math.round(rect.h);
  if (x === last[0] && y === last[1] && w === last[2] && h === last[3]) return;
  last[0] = x;
  last[1] = y;
  last[2] = w;
  last[3] = h;
  element.dataset.voyagerRect = `${String(x)},${String(y)},${String(w)},${String(h)}`;
}

/** Writes a CSS custom property only when it changed meaningfully. */
function writeVar(
  element: HTMLElement,
  name: string,
  value: number,
  unit: string,
  last: number[],
  slot: number,
): void {
  const previous = last[slot] ?? NaN;
  if (Math.abs(value - previous) < (unit === 'px' ? 0.5 : 0.002)) return;
  last[slot] = value;
  element.style.setProperty(name, `${value.toFixed(3)}${unit}`);
}
