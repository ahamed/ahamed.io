import { useEffect } from 'react';
import { BackSide, Quaternion } from 'three';
import { clearKtx2, useKtx2 } from '../ktx2';
import { SKY_ORDER, SKY_RADIUS } from './layout';
import { skyQuaternion } from './orientation';

/** KTX2 texture name (sRGB) of the Solar System Scope Milky Way map. */
export const MILKY_WAY = '2k_stars_milky_way';

const ROTATION = new Quaternion(...skyQuaternion());
/**
 * The source image is dark (the band peaks around 0.3 linear), so it is lifted a little;
 * it still stays far below the bloom threshold and never competes with the bodies.
 */
const GAIN = 1.6;

/** The Milky Way on the inside of a camera-following sphere, aimed along Voyager's heading. */
export function Sky() {
  const [texture] = useKtx2([MILKY_WAY]);

  useEffect(
    () => () => {
      clearKtx2([MILKY_WAY]);
      texture?.dispose();
    },
    [texture],
  );

  return (
    <mesh name="sky" quaternion={ROTATION} renderOrder={SKY_ORDER.sky} frustumCulled={false}>
      <sphereGeometry args={[SKY_RADIUS, 64, 32]} />
      <meshBasicMaterial
        map={texture}
        color={[GAIN, GAIN, GAIN]}
        side={BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
