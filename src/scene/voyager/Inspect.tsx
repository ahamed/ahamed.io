import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { ACESFilmicToneMapping, Quaternion, SRGBColorSpace, Vector3, type Group } from 'three';
import { Lights } from '../Lights';
import { FollowCamera } from '../space/FollowCamera';
import { SKY_RADIUS } from '../space/layout';
import { skyQuaternion, skyTextureUv, textureDirection } from '../space/orientation';
import { SpaceEnvironment } from '../space/SpaceEnvironment';
import { SUN_DIRECTION } from '../space/sunDirection';
import { Voyager } from './Voyager';

const TARGET: [number, number, number] = [0.15, 0.3, 0];
const DEFAULT_CAMERA: [number, number, number] = [2.2, 1.6, 3.2];

/** World direction of the Galactic Centre on the rotated sky sphere. */
function galacticCentre(): Vector3 {
  return new Vector3(...textureDirection(...skyTextureUv(0, 0))).applyQuaternion(
    new Quaternion(...skyQuaternion()),
  );
}

/** Camera start: `view=sun` or `view=gc` looks past Voyager toward that direction. */
function startCamera(view: string | null): [number, number, number] {
  const direction =
    view === 'sun' ? new Vector3(...SUN_DIRECTION) : view === 'gc' ? galacticCentre() : null;
  if (!direction) return DEFAULT_CAMERA;
  return new Vector3(...TARGET).addScaledVector(direction, -5).toArray();
}

/**
 * Dev-only spacecraft inspector (`?inspect` on the dev server): Voyager without bodies or
 * dialogs, lit like the voyage, inside the space environment (sky, stars, Sun), with orbit
 * controls. `&view=sun` faces the Sun; `&view=gc` hides Voyager, faces the Galactic Centre
 * and marks it in red, to check the sky's orientation. Production builds never import this module.
 */
export default function Inspect() {
  const sky = useRef<Group>(null);
  const [view] = useState(() => new URLSearchParams(window.location.search).get('view'));
  const [marker] = useState(() =>
    galacticCentre()
      .multiplyScalar(SKY_RADIUS * 0.85)
      .toArray(),
  );
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 40, near: 0.05, far: 5000, position: startCamera(view) }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
      aria-label="Voyager 1 inspector"
    >
      <color attach="background" args={['#000000']} />
      <Lights />
      <SpaceEnvironment ref={sky}>
        {view === 'gc' && (
          <mesh position={marker}>
            <sphereGeometry args={[12, 16, 8]} />
            <meshBasicMaterial color="#ff2020" toneMapped={false} />
          </mesh>
        )}
      </SpaceEnvironment>
      <FollowCamera target={sky} />
      {view === 'gc' ? null : <Voyager />}
      <OrbitControls makeDefault target={TARGET} minDistance={0.8} maxDistance={12} />
    </Canvas>
  );
}
