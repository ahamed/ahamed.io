import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BackSide, Color, type Mesh } from 'three';
import { useKtx2 } from '../ktx2';
import { atmosphereFragment, atmosphereVertex } from '../shaders/atmosphere';

const MARS_SPIN = 0.0039;

/** Mars: KTX2 surface map plus a thin dusty-orange atmosphere rim. */
export function Mars({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_mars']);
  const surface = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color('#f2a06a') },
      uPower: { value: 3.0 },
      uIntensity: { value: 1.6 },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (surface.current) surface.current.rotation.y += MARS_SPIN * dt;
  });

  return (
    <group rotation={[0.44, 0, 0]}>
      <mesh name="mars-surface" ref={surface}>
        <sphereGeometry args={[radius, 128, 64]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      <mesh name="mars-atmosphere" scale={1.04}>
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
