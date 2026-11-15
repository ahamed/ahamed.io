import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useKtx2 } from '../ktx2';
import { Atmosphere } from './Atmosphere';

const MARS_SPIN = 0.0039;

/** Mars: KTX2 surface map plus a thin dusty-orange atmosphere rim. */
export function Mars({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_mars']);
  const surface = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += MARS_SPIN * dt;
  });

  return (
    <group rotation={[0.44, 0, 0]}>
      <mesh name="mars-surface" ref={surface}>
        <sphereGeometry args={[radius, 128, 64]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      <Atmosphere
        name="mars-atmosphere"
        radius={radius}
        scale={1.06}
        color="#f2a06a"
        innerPower={12}
        intensity={0.6}
      />
    </group>
  );
}
