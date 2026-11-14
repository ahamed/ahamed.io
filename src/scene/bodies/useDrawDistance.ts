import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { MathUtils, PerspectiveCamera, Vector3, type Object3D } from 'three';
import { drawDistance } from './drawDistance';

/** Shared scratch for the per-frame distance check (used synchronously, never retained). */
const worldPosition = new Vector3();

/**
 * Hides `ref`'s object while a sphere of `radius` at its position would be fewer than
 * MIN_DRAW_PIXELS across. Every body on the route is ahead of the camera, so frustum culling
 * alone would draw all of them from the start.
 */
export function useDrawDistance(ref: RefObject<Object3D | null>, radius: number): void {
  useFrame(({ camera, size }) => {
    const object = ref.current;
    if (!object) return;
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    const distance = object.getWorldPosition(worldPosition).distanceTo(camera.position);
    object.visible = distance <= drawDistance(radius, fovY, size.height);
  });
}
