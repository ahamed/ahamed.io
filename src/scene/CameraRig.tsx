import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { MathUtils, PerspectiveCamera, Vector3, type Group } from 'three';
import { aimTowardInto, aimWeight, chasePoseInto, type ChasePose } from '../journey/camera';
import { damp } from '../journey/progress';
import { pointAt, type Route, type Vec3 } from '../journey/route';
import { stopSizesInto } from '../journey/sizes';
import { snapTarget } from '../journey/snap';
import { stopRanges } from '../journey/stops';
import { chooseOpenStop, dialogOpacity, dialogScale } from '../journey/visibility';
import { journeyRuntime, type JourneyStore } from '../store/journey';
import { dialogElements } from '../ui/TerminalDialog/registry';

const DAMPING = 6;
const EDGE_MARGIN = 0.12;

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

  // Per-instance scratch, created on the first frame and reused (no per-frame allocation).
  const scratchRef = useRef<Scratch | null>(null);

  useFrame((_, dt) => {
    scratchRef.current ??= createScratch(route);
    const scratch = scratchRef.current;
    const state = store.getState();
    const now = performance.now();

    const snap = snapTarget(
      state.target,
      route.closePoints,
      scratch.ranges,
      now - state.lastInputAt,
    );
    if (snap !== null && snap !== state.target) state.snapTo(snap);

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
    if (nearestBody) aimTowardInto(scratch.aim, scratch.pose.lookAt, nearestBody.position, weight);
    camera.position.set(...scratch.pose.position);
    camera.lookAt(...scratch.aim);
    sky?.current?.position.copy(camera.position);
    if (voyager.current) voyager.current.position.set(...pointAt(route, p, scratch.ship));

    const currentIndex = scratch.openIndex;
    const openIndex = chooseOpenStop(scratch.sizes, currentIndex);
    scratch.openIndex = openIndex;
    const openBody = openIndex === null ? undefined : route.bodies[openIndex];
    if (openIndex !== currentIndex) state.setOpenStop(openBody?.id ?? null);

    if (!openBody) return;
    const element = dialogElements.get(openBody.id);
    if (!element) return;

    // Anchor at the body's left limb; the dialog sits to the left of it.
    const anchor = scratch.anchor.set(
      openBody.position[0] - openBody.radius * 1.05,
      openBody.position[1],
      openBody.position[2],
    );
    anchor.project(camera);
    const x = ((anchor.x + 1) / 2) * size.width;
    const yNorm = MathUtils.clamp((1 - anchor.y) / 2, EDGE_MARGIN, 1 - EDGE_MARGIN);
    const y = yNorm * size.height;
    const bodySize = scratch.sizes[openIndex ?? 0] ?? 0;
    writeVar(element, '--x', x, 'px', scratch.last, 0);
    writeVar(element, '--y', y, 'px', scratch.last, 1);
    writeVar(element, '--scale', dialogScale(bodySize), '', scratch.last, 2);
    writeVar(element, '--opacity', dialogOpacity(bodySize), '', scratch.last, 3);
  });

  return null;
}

interface Scratch {
  ranges: ReturnType<typeof stopRanges>;
  pose: ChasePose;
  ship: Vec3;
  aim: Vec3;
  sizes: number[];
  anchor: Vector3;
  openIndex: number | null;
  last: number[];
}

function createScratch(route: Route): Scratch {
  return {
    ranges: stopRanges(route.closePoints),
    pose: { position: [0, 0, 0], lookAt: [0, 0, 0] },
    ship: [0, 0, 0],
    aim: [0, 0, 0],
    sizes: route.bodies.map(() => 0),
    anchor: new Vector3(),
    openIndex: null,
    last: [NaN, NaN, NaN, NaN],
  };
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
