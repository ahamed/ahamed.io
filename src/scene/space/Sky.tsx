import { useTexture } from '@react-three/drei';
import { useEffect } from 'react';
import { BackSide, Quaternion, SRGBColorSpace } from 'three';
import { SKY_ORDER, SKY_RADIUS } from './layout';
import { skyQuaternion } from './orientation';

export const MILKY_WAY_URL = '/textures/2k_stars_milky_way.jpg';

const ROTATION = new Quaternion(...skyQuaternion());
/**
 * The source image is dark (the band peaks around 0.3 linear), so it is lifted a little;
 * it still stays far below the bloom threshold and never competes with the bodies.
 */
const GAIN = 1.6;

/** The Milky Way on the inside of a camera-following sphere, aimed along Voyager's heading. */
export function Sky() {
  const texture = useTexture(MILKY_WAY_URL, (t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  });

  useEffect(
    () => () => {
      useTexture.clear(MILKY_WAY_URL);
      texture.dispose();
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
