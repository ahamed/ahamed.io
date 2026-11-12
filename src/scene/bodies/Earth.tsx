import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BackSide, Color, SRGBColorSpace, type Mesh } from 'three';
import { atmosphereFragment, atmosphereVertex } from '../shaders/atmosphere';

const CLOUD_SPIN = 0.01;
const EARTH_SPIN = 0.004;

export function Earth({ radius }: { radius: number }) {
  const [day, clouds] = useTexture(
    ['/textures/2k_earth_daymap.jpg', '/textures/2k_earth_clouds.jpg'],
    ([dayMap]) => {
      if (dayMap) {
        dayMap.colorSpace = SRGBColorSpace;
        dayMap.anisotropy = 8;
      }
    },
  );

  const surface = useRef<Mesh>(null);
  const cloudLayer = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color('#5ab4ff') },
      uPower: { value: 2.6 },
      uIntensity: { value: 1.4 },
    }),
    [],
  );

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
      <mesh scale={1.07}>
        <sphereGeometry args={[radius, 96, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={uniforms}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
