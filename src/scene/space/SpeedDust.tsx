import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  ShaderMaterial,
} from 'three';
import { journeyRuntime } from '../../store/journey';
import { dustFragment, dustVertex } from '../shaders/dust';
import { useReducedMotion } from '../useReducedMotion';
import { createDust, dustResponse } from './dust';

export const DUST_COUNT = 1500;
const DUST_BOX = 60;
const DUST_SEED = 4242;

function createSpeedDust() {
  const base = createDust(DUST_COUNT, DUST_SEED, DUST_BOX);
  const positions = new Float32Array(DUST_COUNT * 6);
  const tail = new Float32Array(DUST_COUNT * 2);
  for (let i = 0; i < DUST_COUNT; i++) {
    for (let k = 0; k < 3; k++) {
      const v = base[i * 3 + k] ?? 0;
      positions[i * 6 + k] = v;
      positions[i * 6 + 3 + k] = v;
    }
    tail[i * 2 + 1] = 1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('tail', new BufferAttribute(tail, 1));

  const uniforms = {
    uBox: { value: DUST_BOX },
    uStretch: { value: 0 },
    uOpacity: { value: 0 },
  };
  const lines = new LineSegments(
    geometry,
    new ShaderMaterial({
      name: 'speed-dust',
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  lines.name = 'speed-dust';
  lines.frustumCulled = false;
  lines.visible = false;

  return {
    lines,
    update: (speed: number) => {
      const { opacity, stretch } = dustResponse(speed);
      uniforms.uOpacity.value = opacity;
      uniforms.uStretch.value = stretch;
      lines.visible = opacity > 0;
    },
    dispose: () => {
      geometry.dispose();
      lines.material.dispose();
    },
  };
}

function DustLines() {
  const dust = useMemo(() => createSpeedDust(), []);
  useEffect(() => dust.dispose, [dust]);
  useFrame(() => {
    dust.update(journeyRuntime.speed);
  });
  return <primitive object={dust.lines} />;
}

/** Faint streaks around the camera that grow with travel speed; hidden under reduced motion. */
export function SpeedDust() {
  return useReducedMotion() ? null : <DustLines />;
}
