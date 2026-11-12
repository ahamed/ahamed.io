import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace, type Group } from 'three';
import { journeyStore, ROUTE } from '../store/journey';
import { Bodies } from './bodies/Bodies';
import { CameraRig } from './CameraRig';
import { Voyager } from './voyager/Voyager';

/** The 3D voyage. Default export so it can be code-split with React.lazy. */
export default function Voyage() {
  const voyager = useRef<Group>(null);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.1, far: 5000, position: [0, 2.2, 7] }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
      aria-hidden="true"
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[-40, 18, 30]} intensity={2.6} />
      <group ref={voyager}>
        <Voyager />
      </group>
      <Bodies route={ROUTE} />
      <CameraRig route={ROUTE} store={journeyStore} voyager={voyager} />
    </Canvas>
  );
}
