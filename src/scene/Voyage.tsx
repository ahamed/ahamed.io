import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { useStore } from 'zustand';
import { ACESFilmicToneMapping, DefaultLoadingManager, SRGBColorSpace, type Group } from 'three';
import { bootTracker } from '../boot/tracker';
import { journeyStore, ROUTE } from '../store/journey';
import { AsteroidBelt } from './bodies/AsteroidBelt';
import { asteroidBelt, KUIPER_COLOR, kuiperBelt } from './bodies/beltPresets';
import { Bodies } from './bodies/Bodies';
import { CameraRig } from './CameraRig';
import { Lights } from './Lights';
import { DeepSky } from './space/DeepSky';
import { Heliopause } from './space/Heliopause';
import { PaleBlueDot } from './space/PaleBlueDot';
import { qualityProfile } from './quality/profile';
import { QualityMonitor } from './quality/QualityMonitor';
import { qualityStore } from './quality/store';
import { PostFX } from './space/PostFX';
import { SpaceEnvironment } from './space/SpaceEnvironment';
import { SpeedDust } from './space/SpeedDust';
import { Voyager } from './voyager/Voyager';

// The scene's code has loaded: show it on the boot panel and count its textures from here.
bootTracker.attach(DefaultLoadingManager);

const BELT = asteroidBelt(ROUTE);
const KUIPER = kuiperBelt(ROUTE);

/** The 3D voyage. Default export so it can be code-split with React.lazy. */
export default function Voyage() {
  const voyager = useRef<Group>(null);
  const sky = useRef<Group>(null);
  const tier = useStore(qualityStore, (s) => s.tier);
  return (
    <Canvas
      dpr={[1, qualityProfile(tier).maxDpr]}
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
      <SpaceEnvironment ref={sky}>
        <PaleBlueDot route={ROUTE} />
      </SpaceEnvironment>
      <group ref={voyager}>
        <Voyager />
      </group>
      <Bodies route={ROUTE} />
      <AsteroidBelt options={BELT} />
      <AsteroidBelt options={KUIPER} color={KUIPER_COLOR} name="kuiper-belt" />
      <Heliopause route={ROUTE} />
      <DeepSky route={ROUTE} />
      <SpeedDust />
      <CameraRig route={ROUTE} store={journeyStore} voyager={voyager} sky={sky} />
      <PostFX />
      <QualityMonitor />
    </Canvas>
  );
}
