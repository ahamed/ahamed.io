import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { starsFragment, starsVertex } from '../shaders/stars';
import { SKY_ORDER, SKY_RADIUS } from './layout';
import { createStarField } from './starField';
import { useShaderClock } from './useShaderClock';

export const STAR_COUNT = 4000;
const STAR_SEED = 1977;

function createStars() {
  const field = createStarField(STAR_COUNT, STAR_SEED);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(field.positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(field.colors, 3));
  geometry.setAttribute('size', new BufferAttribute(field.sizes, 1));
  geometry.setAttribute('phase', new BufferAttribute(field.phases, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uRadius: { value: SKY_RADIUS * 0.95 },
  };
  const material = new ShaderMaterial({
    name: 'stars',
    vertexShader: starsVertex,
    fragmentShader: starsFragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  return {
    geometry,
    material,
    advance: (dt: number) => {
      uniforms.uTime.value += dt;
    },
    setPixelRatio: (dpr: number) => {
      uniforms.uPixelRatio.value = dpr;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/** Seeded point stars just inside the sky sphere; sharp at any DPR, twinkling slightly. */
export function Stars() {
  const dpr = useThree((s) => s.viewport.dpr);
  const stars = useMemo(() => createStars(), []);

  useEffect(() => {
    stars.setPixelRatio(dpr);
  }, [stars, dpr]);
  useEffect(() => stars.dispose, [stars]);
  useShaderClock(stars.advance);

  return (
    <points
      name="stars"
      geometry={stars.geometry}
      material={stars.material}
      renderOrder={SKY_ORDER.stars}
      frustumCulled={false}
    />
  );
}
