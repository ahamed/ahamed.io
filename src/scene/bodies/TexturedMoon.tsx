import { useMemo, useRef } from 'react';
import { AdditiveBlending, BackSide, Color, type Group } from 'three';
import { useKtx2 } from '../ktx2';
import { atmosphereFragment, atmosphereVertex } from '../shaders/atmosphere';
import { MOON_PRESETS, type MoonPresetId } from './moonPresets';
import { useDrawDistance } from './useDrawDistance';

/** A gas-giant moon: a 1K KTX2 global mosaic on a sphere, with Titan's haze rim. */
export function TexturedMoon({ preset, radius }: { preset: MoonPresetId; radius: number }) {
  const { tint, roughness, haze, yaw = 0, pitch = 0 } = MOON_PRESETS[preset];
  const [map] = useKtx2([`1k_${preset}`]);
  const root = useRef<Group>(null);
  useDrawDistance(root, radius);
  const hazeUniforms = useMemo(
    () =>
      haze
        ? { uColor: { value: new Color(haze) }, uPower: { value: 3.0 }, uIntensity: { value: 1.1 } }
        : null,
    [haze],
  );

  return (
    <group name={`moon-${preset}-root`} ref={root}>
      <group rotation-x={pitch}>
        <mesh name={`moon-${preset}`} rotation-y={yaw}>
          <sphereGeometry args={[radius, 96, 48]} />
          <meshStandardMaterial map={map} color={tint} roughness={roughness} metalness={0} />
        </mesh>
      </group>
      {hazeUniforms && (
        <mesh name={`moon-${preset}-haze`} scale={1.04}>
          <sphereGeometry args={[radius, 64, 32]} />
          <shaderMaterial
            vertexShader={atmosphereVertex}
            fragmentShader={atmosphereFragment}
            uniforms={hazeUniforms}
            side={BackSide}
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
