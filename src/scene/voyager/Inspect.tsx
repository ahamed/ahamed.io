import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { Voyager } from './Voyager';

/**
 * Dev-only spacecraft inspector (`?inspect` on the dev server): Voyager alone, lit like the
 * voyage and reflecting its procedural space environment, with orbit controls. Production
 * builds never import this module.
 */
export default function Inspect() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 40, near: 0.05, far: 100, position: [2.2, 1.6, 3.2] }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
      aria-label="Voyager 1 inspector"
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[-40, 18, 30]} intensity={2.6} />
      <Voyager />
      <OrbitControls makeDefault target={[0.15, 0.3, 0]} minDistance={0.8} maxDistance={12} />
    </Canvas>
  );
}
