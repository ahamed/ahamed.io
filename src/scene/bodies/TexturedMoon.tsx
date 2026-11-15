import { useRef } from 'react';
import type { Group } from 'three';
import { useKtx2 } from '../ktx2';
import { Atmosphere } from './Atmosphere';
import { MOON_PRESETS, type MoonPresetId } from './moonPresets';
import { useDrawDistance } from './useDrawDistance';

/** A gas-giant moon: a 1K KTX2 global mosaic on a sphere, with Titan's haze rim. */
export function TexturedMoon({ preset, radius }: { preset: MoonPresetId; radius: number }) {
  const { tint, roughness, haze, yaw = 0, pitch = 0 } = MOON_PRESETS[preset];
  const [map] = useKtx2([`1k_${preset}`]);
  const root = useRef<Group>(null);
  useDrawDistance(root, radius);

  return (
    <group name={`moon-${preset}-root`} ref={root}>
      <group rotation-x={pitch}>
        <mesh name={`moon-${preset}`} rotation-y={yaw}>
          <sphereGeometry args={[radius, 96, 48]} />
          <meshStandardMaterial map={map} color={tint} roughness={roughness} metalness={0} />
        </mesh>
      </group>
      {haze && (
        <Atmosphere
          name={`moon-${preset}-haze`}
          radius={radius}
          scale={1.06}
          color={haze}
          innerPower={10}
          intensity={0.55}
          segments={64}
        />
      )}
    </group>
  );
}
