import { useEffect, useMemo, useRef } from 'react';
import { type Mesh, MeshStandardMaterial } from 'three';
import { createRockGeometry } from './rockGeometry';
import type { RockPresetId } from './rockShape';
import { useDrawDistance } from './useDrawDistance';

/** Base colours (sRGB) per rocky body; the preset's shade varies them across the surface. */
const COLORS: Partial<Record<RockPresetId, string>> = {
  phobos: '#8a7a6a',
  deimos: '#9c8c78',
  ceres: '#8f8a85',
  vesta: '#a39a8e',
  pallas: '#7f7a74',
  hygiea: '#6b6762',
  'comet-nucleus': '#5d5852',
  'arrokoth-wenu': '#a06a4f',
  'arrokoth-weeyo': '#a06a4f',
  eris: '#f2f2f0',
};

const HERO_DETAIL = 32;
/** Ceres is the roundest and largest, so it needs the smoothest silhouette. */
const DETAIL: Partial<Record<RockPresetId, number>> = { ceres: 40 };

function createRock(preset: RockPresetId) {
  const geometry = createRockGeometry(
    preset,
    DETAIL[preset] ?? HERO_DETAIL,
    COLORS[preset] ?? '#8a8178',
  );
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  return {
    geometry,
    material,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * A small moon or hero asteroid generated from its seeded shape preset, drawn only while it
 * would be at least a few pixels across.
 */
export function Rock({ preset, radius }: { preset: RockPresetId; radius: number }) {
  const rock = useMemo(() => createRock(preset), [preset]);
  useEffect(() => rock.dispose, [rock]);
  const meshRef = useRef<Mesh>(null);
  useDrawDistance(meshRef, radius);
  return (
    <mesh
      ref={meshRef}
      name={`rock-${preset}`}
      geometry={rock.geometry}
      material={rock.material}
      scale={radius}
    />
  );
}
