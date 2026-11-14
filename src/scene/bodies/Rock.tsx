import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, type Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three';
import { drawDistance } from './drawDistance';
import { createRockGeometry } from './rockGeometry';
import type { RockPresetId } from './rockShape';

/** Base colours (sRGB) per rocky body; the preset's shade varies them across the surface. */
const COLORS: Partial<Record<RockPresetId, string>> = {
  phobos: '#8a7a6a',
  deimos: '#9c8c78',
  ceres: '#8f8a85',
  vesta: '#a39a8e',
  pallas: '#7f7a74',
  hygiea: '#6b6762',
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

/** Shared scratch for the per-frame distance check (used synchronously, never retained). */
const worldPosition = new Vector3();

/**
 * A small moon or hero asteroid generated from its seeded shape preset. It is only drawn
 * while it would be at least a few pixels across: every body on the route is ahead of the
 * camera, so frustum culling alone would draw all of them from the start.
 */
export function Rock({ preset, radius }: { preset: RockPresetId; radius: number }) {
  const rock = useMemo(() => createRock(preset), [preset]);
  useEffect(() => rock.dispose, [rock]);
  const meshRef = useRef<Mesh>(null);
  useFrame(({ camera, size }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    const distance = mesh.getWorldPosition(worldPosition).distanceTo(camera.position);
    mesh.visible = distance <= drawDistance(radius, fovY, size.height);
  });
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
