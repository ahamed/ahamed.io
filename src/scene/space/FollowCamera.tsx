import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import type { Group } from 'three';

/**
 * Keeps `target` on the camera's position each frame. For views whose camera is moved by
 * controls (drei controls update at priority −1, before this); the voyage uses CameraRig.
 */
export function FollowCamera({ target }: { target: RefObject<Group | null> }) {
  useFrame(({ camera }) => {
    target.current?.position.copy(camera.position);
  });
  return null;
}
