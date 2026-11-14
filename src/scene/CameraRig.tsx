import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { Box3, MathUtils, PerspectiveCamera, Vector3, type Camera, type Group } from 'three';
import { aimTowardInto, aimWeight, chasePoseInto, type ChasePose } from '../journey/camera';
import {
  DOT_FROM_TURN,
  finalePoseInto,
  finaleReveal,
  finaleSnap,
  finaleTurn,
} from '../journey/finale';
import { flyBackDone, flyBackTarget } from '../journey/flyBack';
import { damp } from '../journey/progress';
import {
  easeOffset,
  placeDialogInto,
  type Placement,
  type PlacementInput,
  type Rect,
  type Spot,
} from '../journey/placement';
import { pointAt, type Route, type Vec3 } from '../journey/route';
import { stopSizesInto } from '../journey/sizes';
import { SNAP_IDLE_MS, snapTarget } from '../journey/snap';
import { stopRanges } from '../journey/stops';
import { chooseOpenStop, dialogOpacity, dialogScale } from '../journey/visibility';
import { journeyRuntime, type JourneyStore } from '../store/journey';
import { finaleLayer } from '../ui/Finale/registry';
import { dialogElements, dialogSizes } from '../ui/TerminalDialog/registry';
import { useReducedMotion } from './useReducedMotion';

const DAMPING = 6;
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
}

/**
 * The single per-frame loop: eases progress, snaps when idle, flies the chase camera and
 * drives dialog open state + placement. Allocation-free apart from CSS var strings.
 */
export function CameraRig({ route, store, voyager, sky }: Props) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  // useFrame always runs the latest callback, so the closure sees the current preference.
  const reducedMotion = useReducedMotion();

  // Per-instance scratch, created on the first frame and reused (no per-frame allocation).
  const scratchRef = useRef<Scratch | null>(null);

  useFrame((_, dt) => {
    scratchRef.current ??= createScratch(route);
    const scratch = scratchRef.current;
    const state = store.getState();
    const now = performance.now();

    // "Back to Earth": the rewind moves the target itself, and counts as input so nothing snaps.
    if (state.flight) {
      const elapsed = now - state.flight.startAt;
      state.flyTo(flyBackTarget(state.flight.from, elapsed), now);
      if (flyBackDone(elapsed)) state.endFlight();
    }

    const idleMs = now - store.getState().lastInputAt;
    const current = store.getState().target;
    const snap =
      snapTarget(current, route.closePoints, scratch.ranges, idleMs) ??
      (idleMs >= SNAP_IDLE_MS ? finaleSnap(current) : null);
    if (snap !== null && snap !== current) state.snapTo(snap);

    const target = store.getState().target;
    const previous = journeyRuntime.position;
    journeyRuntime.position = damp(previous, target, DAMPING, dt);
    journeyRuntime.speed = dt > 0 ? Math.abs(journeyRuntime.position - previous) / dt : 0;
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
    camera.position.set(...scratch.pose.position);
    camera.lookAt(...scratch.pose.lookAt);
    sky?.current?.position.copy(camera.position);
    if (voyager.current) voyager.current.position.set(...scratch.ship);
    writeFinale(scratch, p, camera, size, state);

    const currentIndex = scratch.openIndex;
    const openIndex = chooseOpenStop(scratch.sizes, currentIndex);
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
      scratch.last.fill(NaN);
    }

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

    const scale = dialogScale(bodySize);
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

    writeVar(element, '--x', disc.x + scratch.offset[0], 'px', scratch.last, 0);
    writeVar(element, '--y', disc.y + scratch.offset[1], 'px', scratch.last, 1);
    writeVar(element, '--scale', scale, '', scratch.last, 2);
    writeVar(element, '--opacity', dialogOpacity(bodySize), '', scratch.last, 3);
    writeRect(element, scratch.voyagerRect, scratch);
  });

  return null;
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
  /** Earth's position: where the Pale Blue Dot is, seen from the finale. */
  earth: Vec3;
  finaleLast: number[];
  ranges: ReturnType<typeof stopRanges>;
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
}

function createScratch(route: Route): Scratch {
  const disc = { x: 0, y: 0, r: 0 };
  const dialog = { w: 0, h: 0 };
  const voyagerRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  const earth = route.bodies.find((b) => b.body === 'earth')?.position ?? [0, 0, 0];
  return {
    earth: [...earth],
    finaleLast: [NaN, NaN, NaN],
    ranges: stopRanges(route.closePoints),
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
