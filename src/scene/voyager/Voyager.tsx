import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group, WebGLRenderer } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { buildVoyager, type VoyagerModel } from './build';
import { createSpaceEnvironment } from './environment';
import { createVoyagerMaterials, type VoyagerMaterials } from './materials';
import { createPose, voyagerPoseInto } from './motion';
import { VOYAGER_ORIENTATION } from './orientation';
import { PARTS, PIVOTS, type MotionGroup } from './parts';

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

/**
 * Museum-grade procedural Voyager 1. Travels toward -Z, turned to a fixed three-quarter back
 * view so the trailing chase camera sees the bus and Golden Record with the dish behind and
 * offset (it never rolls: the real craft is 3-axis stabilised). Static parts are merged per material;
 * the scan platform, whips and magnetometer tip are separate pivot groups that move a little,
 * and the whole craft drifts in attitude. Motion freezes under prefers-reduced-motion.
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

  const attitude = useRef<Group>(null);
  const scan = useRef<Group>(null);
  const whipL = useRef<Group>(null);
  const whipR = useRef<Group>(null);
  const magTip = useRef<Group>(null);
  const [pose] = useState(createPose);
  const elapsed = useRef(0);

  useFrame((_, dt) => {
    elapsed.current += Math.min(dt, 0.1);
    voyagerPoseInto(pose, elapsed.current, reducedRef.current);
    attitude.current?.rotation.set(pose.attitude[0], pose.attitude[1], pose.attitude[2]);
    scan.current?.rotation.set(pose.scanTilt, pose.scanPan, 0);
    whipL.current?.rotation.set(pose.whipL, 0, pose.whipL * 0.5);
    whipR.current?.rotation.set(pose.whipR, 0, pose.whipR * 0.5);
    magTip.current?.rotation.set(pose.magTip, 0, pose.magTip);
  });

  const shared = { model, materials };
  return (
    <group {...props} scale={0.45}>
      <group name="orientation" rotation={ORIENTATION}>
        <group name="attitude" ref={attitude}>
          <Meshes group="static" {...shared} />
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
