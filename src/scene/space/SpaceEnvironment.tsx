import { Suspense, type ReactNode, type Ref } from 'react';
import type { Group } from 'three';
import { Meteors } from './Meteors';
import { Sky } from './Sky';
import { Stars } from './Stars';
import { Sun } from './Sun';

/**
 * Everything at infinity: the Milky Way, the stars, the Sun and the occasional meteor. The owner keeps this group
 * on the camera's position (CameraRig's `sky` ref, or FollowCamera) so it shows no parallax.
 */
export function SpaceEnvironment({ ref, children }: { ref?: Ref<Group>; children?: ReactNode }) {
  return (
    <group ref={ref} name="space-environment">
      <Suspense fallback={null}>
        <Sky />
      </Suspense>
      <Stars />
      <Sun />
      <Meteors />
      {children}
    </group>
  );
}
