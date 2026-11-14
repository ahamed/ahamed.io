import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  ShaderMaterial,
} from 'three';
import { mulberry32 } from '../random';
import { useShaderClock } from '../space/useShaderClock';
import { COMET_PRESETS, tailParticleGlsl, type TailKind, type TailParams } from './cometTail';
import { Rock } from './Rock';
import { useDrawDistance } from './useDrawDistance';

export type CometVariant = keyof typeof COMET_PRESETS;

/** Coma radius as a multiple of the nucleus radius. */
const COMA_SCALE = 3;

const tailVertex = (kind: TailKind) => /* glsl */ `
attribute float aSeed;
attribute vec2 aJitter;
uniform float uTime;
uniform float uSize;
uniform float uScale;
uniform float uBrightness;
varying float vAlpha;
${tailParticleGlsl(kind)}
void main() {
  float age = tailAge(aSeed, uTime);
  vec4 mv = modelViewMatrix * vec4(tailParticle(aSeed, aJitter, uTime), 1.0);
  gl_Position = projectionMatrix * mv;
  // World-size particles: uScale is pixels per world unit at distance 1.
  gl_PointSize = uSize * (0.6 + age) * uScale / max(-mv.z, 1.0);
  // Fade in just off the nucleus and out toward the tip.
  vAlpha = uBrightness * smoothstep(0.0, 0.05, age) * (1.0 - age);
}
`;

const tailFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = vAlpha * smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor * a, a);
}
`;

const comaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Camera-facing quad: offset the corner in view space.
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy;
  gl_Position = projectionMatrix * mv;
}
`;

const comaFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uBrightness;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = uBrightness * pow(max(1.0 - d, 0.0), 2.5);
  gl_FragColor = vec4(uColor * a, a);
}
`;

function createTail(
  kind: TailKind,
  params: TailParams,
  seed: number,
  uTime: { value: number },
  uScale: { value: number },
) {
  const rand = mulberry32(seed);
  const geometry = new BufferGeometry();
  const seeds = new Float32Array(params.count);
  const jitter = new Float32Array(params.count * 2);
  for (let i = 0; i < params.count; i++) {
    seeds[i] = rand();
    jitter[i * 2] = rand() * 2 - 1;
    jitter[i * 2 + 1] = rand() * 2 - 1;
  }
  // Positions are computed in the shader; this attribute only sets the vertex count.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(params.count * 3), 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  geometry.setAttribute('aJitter', new BufferAttribute(jitter, 2));
  const material = new ShaderMaterial({
    vertexShader: tailVertex(kind),
    fragmentShader: tailFragment,
    uniforms: {
      uTime,
      uLength: { value: params.length },
      uRate: { value: params.rate },
      uSpread: { value: params.spread },
      uCurve: { value: params.curve },
      uSize: { value: params.size },
      uScale,
      uBrightness: { value: params.brightness },
      uColor: { value: new Color(params.color) },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.name = `comet-${kind}`;
  // The geometry's own bounds are a point at the nucleus; the shader moves the particles.
  points.frustumCulled = false;
  return points;
}

function createComet(variant: CometVariant, radius: number) {
  const uTime = { value: 0 };
  const uScale = { value: 1 };
  const preset = COMET_PRESETS[variant];
  const seed = variant === 'bright' ? 9001 : 9101;
  const tails = [
    createTail('ion', preset.ion, seed, uTime, uScale),
    createTail('dust', preset.dust, seed + 1, uTime, uScale),
  ];
  const comaGeometry = new PlaneGeometry(radius * COMA_SCALE * 2, radius * COMA_SCALE * 2);
  const comaMaterial = new ShaderMaterial({
    vertexShader: comaVertex,
    fragmentShader: comaFragment,
    uniforms: {
      uColor: { value: new Color('#cfe3ff') },
      uBrightness: { value: variant === 'bright' ? 0.5 : 0.25 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const coma = new Mesh(comaGeometry, comaMaterial);
  coma.name = 'comet-coma';
  return {
    tails,
    coma,
    /** Tail length that sets how far away the comet stays drawn. */
    reach: preset.ion.length,
    advance: (dt: number) => {
      uTime.value += dt;
    },
    /** Pixels per world unit at distance 1, from the drawing-buffer height and vertical fov. */
    setViewport: (bufferHeight: number, fovY: number) => {
      uScale.value = bufferHeight / 2 / Math.tan(fovY / 2);
    },
    dispose: () => {
      for (const tail of tails) {
        tail.geometry.dispose();
        tail.material.dispose();
      }
      comaGeometry.dispose();
      comaMaterial.dispose();
    },
  };
}

/**
 * A comet: a dark seeded nucleus, a glowing coma and two GPU particle tails pointing away from
 * the Sun (a straight ion tail and a curved dust tail). The faint variant is the upcoming comet,
 * still far from the Sun. The tails hold still under reduced motion.
 */
export function Comet({ variant, radius }: { variant: CometVariant; radius: number }) {
  const comet = useMemo(() => createComet(variant, radius), [variant, radius]);
  useEffect(() => comet.dispose, [comet]);
  const root = useRef<Group>(null);
  // Drawn while the bright part of the tail would be a few pixels across.
  useDrawDistance(root, comet.reach / 4);
  useShaderClock(comet.advance);
  useFrame(({ camera, size, viewport }) => {
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    comet.setViewport(size.height * viewport.dpr, fovY);
  });

  return (
    <group name="comet" ref={root}>
      <Rock preset="comet-nucleus" radius={radius} />
      <primitive object={comet.coma} />
      {comet.tails.map((tail) => (
        <primitive key={tail.name} object={tail} />
      ))}
    </group>
  );
}
