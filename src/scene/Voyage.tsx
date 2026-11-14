import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace, type Group } from 'three';
import { journeyStore, ROUTE } from '../store/journey';
import { AsteroidBelt } from './bodies/AsteroidBelt';
import { beltSpan, type BeltOptions } from './bodies/belt';
import { Bodies } from './bodies/Bodies';
import { CameraRig } from './CameraRig';
import { Lights } from './Lights';
import { PostFX } from './space/PostFX';
import { SpaceEnvironment } from './space/SpaceEnvironment';
import { SpeedDust } from './space/SpeedDust';
import { Voyager } from './voyager/Voyager';

const BELT: BeltOptions = {
  count: 2500,
  seed: 1801,
  ...beltSpan(ROUTE),
  corridor: 16,
  outer: 140,
  thickness: 30,
};

/** The 3D voyage. Default export so it can be code-split with React.lazy. */
export default function Voyage() {
  const voyager = useRef<Group>(null);
  const sky = useRef<Group>(null);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.1, far: 5000, position: [0, 2.2, 7] }}
      // The post pass multisamples, so the canvas itself needs no antialiasing.
      gl={{
        antialias: false,
        toneMapping: ACESFilmicToneMapping,
        outputColorSpace: SRGBColorSpace,
      }}
      aria-hidden="true"
    >
      <color attach="background" args={['#000000']} />
      <Lights />
      <SpaceEnvironment ref={sky} />
      <group ref={voyager}>
        <Voyager />
      </group>
      <Bodies route={ROUTE} />
      <AsteroidBelt options={BELT} />
      <SpeedDust />
      <CameraRig route={ROUTE} store={journeyStore} voyager={voyager} sky={sky} />
      <PostFX />
    </Canvas>
  );
}
