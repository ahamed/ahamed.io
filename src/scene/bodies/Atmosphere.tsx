import { useMemo } from 'react';
import { AdditiveBlending, Color } from 'three';
import { atmosphereFragment, atmosphereVertex } from '../shaders/atmosphere';

interface AtmosphereProps {
  name?: string;
  radius: number;
  /** Shell radius over planet radius: how far the glow reaches into space. */
  scale: number;
  color: string;
  power?: number;
  innerPower?: number;
  intensity?: number;
  segments?: number;
}

/** A soft atmospheric halo: brightest at the planet's limb, fading out into space. */
export function Atmosphere({
  name,
  radius,
  scale,
  color,
  power = 2.5,
  innerPower = 8,
  intensity = 0.7,
  segments = 96,
}: AtmosphereProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uScale: { value: scale },
      uPower: { value: power },
      uInnerPower: { value: innerPower },
      uIntensity: { value: intensity },
    }),
    [color, scale, power, innerPower, intensity],
  );

  return (
    <mesh name={name} scale={scale}>
      <sphereGeometry args={[radius, segments, segments / 2]} />
      <shaderMaterial
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
