import { useEffect, useMemo, useRef } from 'react';
import { type Group, type Mesh, MeshStandardMaterial, RepeatWrapping, type Texture } from 'three';
import { useKtx2 } from '../ktx2';
import { useShaderClock } from '../space/useShaderClock';
import { bandOffsetGlsl } from './bands';
import { useDrawDistance } from './useDrawDistance';

/** Axial tilt (rad): 3.1°. */
const TILT = 0.054;
/** Visible spin (rad/s); far slower than the real 10-hour day, so the bands stay readable. */
const SPIN = 0.01;

/** The map lookup, shifted per latitude band; derivatives come from the unshifted UV. */
const BAND_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec2 bandUv = vec2(vMapUv.x + bandOffset(vMapUv.y, uTime), vMapUv.y);
  vec4 sampledDiffuseColor = textureGrad(map, bandUv, dFdx(vMapUv), dFdy(vMapUv));
  diffuseColor *= sampledDiffuseColor;
#endif
`;

/** Darkens the disc toward its edge (limb darkening). */
const LIMB_DARKENING = /* glsl */ `
  float limb = pow(max(dot(normal, normalize(vViewPosition)), 0.0), 0.35);
  outgoingLight *= mix(1.0, limb, 0.6);
#include <opaque_fragment>
`;

function createJupiter(map: Texture) {
  map.wrapS = RepeatWrapping;
  map.needsUpdate = true;
  const uTime = { value: 0 };
  const material = new MeshStandardMaterial({ map, roughness: 0.9, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.fragmentShader = `uniform float uTime;\n${bandOffsetGlsl}\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', BAND_MAP_FRAGMENT)
      .replace('#include <opaque_fragment>', LIMB_DARKENING);
  };
  material.customProgramCacheKey = () => 'jupiter-bands';
  return {
    material,
    /** Advances the band drift and spins `surface` by `dt` seconds. */
    advance(dt: number, surface: Mesh | null) {
      uTime.value += dt;
      if (surface) surface.rotation.y += SPIN * dt;
    },
    dispose: () => {
      material.dispose();
    },
  };
}

/**
 * Jupiter: KTX2 map whose latitude bands drift past each other (zonal winds), with limb
 * darkening. The drift and the spin hold still under reduced motion.
 */
export function Jupiter({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_jupiter']);
  const jupiter = useMemo(() => (map ? createJupiter(map) : null), [map]);
  useEffect(() => jupiter?.dispose, [jupiter]);

  const root = useRef<Group>(null);
  const surface = useRef<Mesh>(null);
  useDrawDistance(root, radius);
  useShaderClock((dt) => jupiter?.advance(dt, surface.current));

  return (
    <group name="jupiter" ref={root} rotation={[TILT, 0, 0]}>
      <mesh name="jupiter-surface" ref={surface} material={jupiter?.material}>
        <sphereGeometry args={[radius, 128, 64]} />
      </mesh>
    </group>
  );
}
