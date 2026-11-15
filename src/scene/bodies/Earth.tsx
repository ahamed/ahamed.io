import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useKtx2 } from '../ktx2';
import { Atmosphere } from './Atmosphere';

const CLOUD_SPIN = 0.01;
const EARTH_SPIN = 0.004;

export function Earth({ radius }: { radius: number }) {
  // The day map is sRGB-encoded; the cloud map is a linear mask.
  const [day, clouds] = useKtx2(['2k_earth_daymap', '2k_earth_clouds']);

  const surface = useRef<Mesh>(null);
  const cloudLayer = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += EARTH_SPIN * dt;
    if (cloudLayer.current) cloudLayer.current.rotation.y += CLOUD_SPIN * dt;
  });

  return (
    <group rotation={[0.41, 0, 0]}>
      <mesh ref={surface}>
        <sphereGeometry args={[radius, 128, 64]} />
        <meshStandardMaterial map={day} roughness={0.85} metalness={0} />
      </mesh>
      <mesh ref={cloudLayer}>
        <sphereGeometry args={[radius * 1.012, 128, 64]} />
        <meshStandardMaterial alphaMap={clouds} transparent depthWrite={false} color="#ffffff" />
      </mesh>
      <Atmosphere name="earth-atmosphere" radius={radius} scale={1.1} color="#5ab4ff" />
    </group>
  );
}
