import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
} from 'three';
import { NOZZLES } from './parts';

/** How far behind each nozzle (along -Z, the exhaust direction) the puff sits. */
const PLUME_OFFSET = 0.06;
/** Puff diameter at full brightness, in the model's units. */
const PUFF_SIZE = 0.5;

const vertex = /* glsl */ `
attribute float aBrightness;
uniform float uSize;
uniform float uViewportHeight;
varying float vBrightness;
void main() {
  vBrightness = aBrightness;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // World-sized: projectionMatrix[1][1] / -z is the on-screen height of one unit, as a share
  // of half the viewport. The puff also swells slightly as it brightens.
  float scale = length(modelMatrix[0].xyz);
  gl_PointSize = uSize * scale * (0.5 + 0.5 * aBrightness) * projectionMatrix[1][1]
    * uViewportHeight * 0.5 / max(-mv.z, 1e-3);
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vBrightness;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float glow = vBrightness * pow(max(1.0 - d, 0.0), 2.0);
  if (glow <= 0.0) discard;
  gl_FragColor = vec4(uColor * glow, glow);
}
`;

function createPuffs() {
  const positions = new Float32Array(NOZZLES.length * 3);
  NOZZLES.forEach(([x, y, z], k) => {
    positions.set([x, y, z - PLUME_OFFSET], k * 3);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const brightness = new BufferAttribute(new Float32Array(NOZZLES.length), 1);
  geometry.setAttribute('aBrightness', brightness);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uSize: { value: PUFF_SIZE },
      uViewportHeight: { value: 1 },
      uColor: { value: new Color('#cfefff') },
    },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.name = 'thruster-puffs';
  // The puffs live a few centimetres off the bus; never cull them.
  points.frustumCulled = false;
  const target = brightness.array as Float32Array;
  return {
    points,
    /** Sizes the puffs for the drawing buffer's height and copies `source` in place. */
    update(viewportHeight: number, source: Float32Array) {
      const uniform = material.uniforms.uViewportHeight;
      if (uniform) uniform.value = viewportHeight;
      let changed = false;
      for (let k = 0; k < target.length; k++) {
        const value = source[k] ?? 0;
        if (target[k] !== value) {
          target[k] = value;
          changed = true;
        }
      }
      if (changed) brightness.needsUpdate = true;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Pale cyan-white thruster puffs at Voyager's 12 rear nozzles, in one draw call. `brightness`
 * (0..1 per nozzle, indexed like `NOZZLES`) is read every frame and copied in place.
 */
export function Puffs({ brightness }: { brightness: Float32Array }) {
  const puffs = useMemo(() => createPuffs(), []);
  useEffect(() => puffs.dispose, [puffs]);

  useFrame((state) => {
    puffs.update(state.size.height * state.viewport.dpr, brightness);
  });

  return <primitive object={puffs.points} />;
}
