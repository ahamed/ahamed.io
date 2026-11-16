import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group, WebGLRenderer } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { buildVoyager, type VoyagerModel } from './build';
import { createSpaceEnvironment } from './environment';
import { createVoyagerMaterials, type VoyagerMaterials } from './materials';
import { thrusterLink } from '../../audio/thrusterLink';
import { finaleTurn } from '../../journey/finale';
import { journeyRuntime, ROUTE } from '../../store/journey';
import {
  createAttitude,
  stepAttitudeInto,
  TURN_END,
  TURN_START,
  type AttitudeInput,
} from './attitude';
import { createPose, NOZZLE_FOR, puffEnvelope, voyagerPoseInto } from './motion';
import { VOYAGER_ORIENTATION, VOYAGER_SCALE } from './orientation';
import { PARTS, PIVOTS, type MotionGroup } from './parts';
import { Puffs } from './Puffs';

const ORIENTATION: [number, number, number] = [...VOYAGER_ORIENTATION];

/** PMREM needs a real WebGL 2 context; jsdom and the R3F test renderer have none. */
function canPrefilter(gl: WebGLRenderer): boolean {
  return (
    typeof WebGL2RenderingContext !== 'undefined' &&
    gl.getContext() instanceof WebGL2RenderingContext
  );
}

function Meshes({
  group,
  model,
  materials,
}: {
  group: MotionGroup;
  model: VoyagerModel;
  materials: VoyagerMaterials;
}): ReactNode {
  return model.buckets
    .filter((bucket) => bucket.group === group)
    .map((bucket) => (
      <mesh
        key={bucket.name}
        name={bucket.name}
        geometry={bucket.geometry}
        material={materials.slots[bucket.material]}
      />
    ));
}

/** Earth's position, which the dish faces at the end of the finale. */
const EARTH = ROUTE.bodies.find((b) => b.body === 'earth')?.position ?? [0, 0, 0];

interface Aim {
  state: ReturnType<typeof createAttitude>;
  input: AttitudeInput & { body: [number, number, number] | null };
  bodyDir: [number, number, number];
  earthDir: [number, number, number];
}

function createAim(): Aim {
  const earthDir: [number, number, number] = [0, 0, 1];
  return {
    state: createAttitude(),
    input: { body: null, earth: earthDir, finale: 0, reduced: false },
    bodyDir: [0, 0, -1],
    earthDir,
  };
}

/** Writes the unit direction from Voyager to `target` into `out`. */
function directionInto(out: [number, number, number], target: readonly number[]) {
  const s = journeyRuntime.ship;
  const x = (target[0] ?? 0) - s[0];
  const y = (target[1] ?? 0) - s[1];
  const z = (target[2] ?? 0) - s[2];
  const len = Math.hypot(x, y, z) || 1;
  out[0] = x / len;
  out[1] = y / len;
  out[2] = z / len;
}

/** Brightens nozzle `k`'s puff to at least `level`. */
function addPuff(puffs: Float32Array, k: number, level: number): void {
  if (level > (puffs[k] ?? 0)) puffs[k] = level;
}

/** Reads the voyage's capture and finale into the attitude input. Allocation-free. */
function aimInputInto(aim: Aim, reduced: boolean): AttitudeInput {
  const body = ROUTE.bodies[journeyRuntime.captured];
  // The heliopause has no body to face: Voyager drifts through it in its cruise attitude.
  if (body && body.body !== 'heliopause') {
    directionInto(aim.bodyDir, body.position);
    aim.input.body = aim.bodyDir;
  } else {
    aim.input.body = null;
  }
  directionInto(aim.earthDir, EARTH);
  aim.input.finale = finaleTurn(journeyRuntime.position);
  aim.input.reduced = reduced;
  return aim.input;
}

/**
 * Museum-grade procedural Voyager 1. Travels toward -Z, turned to a fixed three-quarter back
 * view so the trailing chase camera sees the bus and Golden Record with the dish behind and
 * offset (it never rolls: the real craft is 3-axis stabilised). Static parts are merged per material;
 * the scan platform, whips and magnetometer tip are separate pivot groups that move a little,
 * and the whole craft holds a ±2° attitude deadband: it drifts, then a rear thruster puffs to
 * push it back (each pulse also signals `thrusterLink` for a hiss). Motion freezes under
 * prefers-reduced-motion.
 */
export function Voyager(props: { position?: [number, number, number] }) {
  const gl = useThree((s) => s.gl);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  // Geometry and data textures keep their CPU data, so three re-uploads them if StrictMode
  // disposes and reuses them. The PMREM target cannot be rebuilt that way, so it lives in an
  // effect that creates and disposes it as a pair.
  const model = useMemo(() => buildVoyager(PARTS), []);
  const materials = useMemo(() => createVoyagerMaterials(null), []);
  useEffect(
    () => () => {
      model.dispose();
      materials.dispose();
    },
    [model, materials],
  );
  useEffect(() => {
    const env = canPrefilter(gl) ? createSpaceEnvironment(gl) : null;
    materials.setEnvironment(env?.texture ?? null);
    return () => {
      materials.setEnvironment(null);
      env?.dispose();
    };
  }, [gl, materials]);

  const orientation = useRef<Group>(null);
  const attitude = useRef<Group>(null);
  const [aim] = useState(createAim);
  /** Elapsed time of the latest turn's puff, and its nozzle. */
  const turnPuff = useRef({ at: -Infinity, nozzle: 0 });
  const scan = useRef<Group>(null);
  const whipL = useRef<Group>(null);
  const whipR = useRef<Group>(null);
  const magTip = useRef<Group>(null);
  const [pose] = useState(createPose);
  const elapsed = useRef(0);
  /** Latest pulse seen, or null before the first frame (so earlier pulses never fire). */
  const lastPulse = useRef<number | null>(null);

  useFrame((_, dt) => {
    elapsed.current += Math.min(dt, 0.1);
    voyagerPoseInto(pose, elapsed.current, reducedRef.current);
    // The dish turns to the body Voyager is orbiting, and to Earth in the finale.
    const events = stepAttitudeInto(aim.state, aimInputInto(aim, reducedRef.current), dt);
    if (events & (TURN_START | TURN_END)) {
      const yaw = NOZZLE_FOR[1];
      turnPuff.current.at = elapsed.current;
      turnPuff.current.nozzle = aim.state.turnSign > 0 ? yaw.positive : yaw.negative;
      thrusterLink.fire();
    }
    addPuff(
      pose.puffs,
      turnPuff.current.nozzle,
      puffEnvelope(elapsed.current - turnPuff.current.at),
    );
    if (orientation.current) {
      if (aim.state.weight > 0 || aim.state.finale > 0) {
        orientation.current.quaternion.set(...aim.state.quat);
      } else {
        orientation.current.rotation.set(...ORIENTATION);
      }
    }
    attitude.current?.rotation.set(pose.attitude[0], pose.attitude[1], pose.attitude[2]);
    scan.current?.rotation.set(pose.scanTilt, pose.scanPan, 0);
    whipL.current?.rotation.set(pose.whipL, 0, pose.whipL * 0.5);
    whipR.current?.rotation.set(pose.whipR, 0, pose.whipR * 0.5);
    magTip.current?.rotation.set(pose.magTip, 0, pose.magTip);
    // One hiss per new pulse; a jump (or reduced motion toggling) re-syncs without firing.
    if (lastPulse.current !== null && pose.pulseCount === lastPulse.current + 1) {
      thrusterLink.fire();
    }
    lastPulse.current = pose.pulseCount;
  });

  const shared = { model, materials };
  return (
    <group {...props} scale={VOYAGER_SCALE}>
      <group name="orientation" ref={orientation} rotation={ORIENTATION}>
        <group name="attitude" ref={attitude}>
          <Meshes group="static" {...shared} />
          <Puffs brightness={pose.puffs} />
          <group name="scan" ref={scan} position={PIVOTS.scan}>
            <Meshes group="scan" {...shared} />
          </group>
          <group name="whip-l" ref={whipL} position={PIVOTS['whip-l']}>
            <Meshes group="whip-l" {...shared} />
          </group>
          <group name="whip-r" ref={whipR} position={PIVOTS['whip-r']}>
            <Meshes group="whip-r" {...shared} />
          </group>
          <group name="mag-tip" ref={magTip} position={PIVOTS['mag-tip']}>
            <Meshes group="mag-tip" {...shared} />
          </group>
        </group>
      </group>
    </group>
  );
}
