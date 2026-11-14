import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  ShaderMaterial,
  Vector3,
} from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { SKY_ORDER } from './layout';
import { createMeteorClock, emptyMeteor, METEOR_RADIUS } from './meteorClock';

/** Streak width (world units on the background sphere: about 3 px at 720 px tall). */
const WIDTH = 7;
/** Tail length as a share of the whole path. */
const TAIL = 0.35;
const SEED = 1977;

const vertex = /* glsl */ `
attribute float aT;
attribute float aSide;
uniform vec3 uStart;
uniform vec3 uEnd;
uniform float uProgress;
uniform float uRadius;
uniform float uWidth;
varying float vT;
vec3 onSphere(float s) { return normalize(mix(uStart, uEnd, s)) * uRadius; }
void main() {
  vT = aT;
  vec3 head = onSphere(uProgress);
  vec3 tail = onSphere(max(uProgress - ${TAIL.toFixed(2)}, 0.0));
  vec4 mv = modelViewMatrix * vec4(mix(tail, head, aT), 1.0);
  vec4 h = modelViewMatrix * vec4(head, 1.0);
  vec4 t = modelViewMatrix * vec4(tail, 1.0);
  vec2 dir = normalize(h.xy - t.xy + vec2(1e-5, 0.0));
  mv.xy += vec2(-dir.y, dir.x) * aSide * uWidth * 0.5;
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
uniform float uProgress;
varying float vT;
void main() {
  // Brightest at the head, fading along the tail; in and out over the meteor's life.
  float a = min(1.0, 1.6 * vT * vT * sin(3.14159265 * uProgress));
  gl_FragColor = vec4(vec3(0.85, 0.92, 1.0) * a, a);
}
`;

function createMeteors() {
  const clock = createMeteorClock(SEED);
  const state = emptyMeteor();
  const uStart = { value: new Vector3() };
  const uEnd = { value: new Vector3() };
  const uProgress = { value: 0 };
  const geometry = new BufferGeometry();
  // A strip of two quads' worth of corners: tail (aT 0) to head (aT 1), both sides.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(4 * 3), 3));
  geometry.setAttribute('aT', new BufferAttribute(new Float32Array([0, 0, 1, 1]), 1));
  geometry.setAttribute('aSide', new BufferAttribute(new Float32Array([-1, 1, -1, 1]), 1));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uStart,
      uEnd,
      uProgress,
      uRadius: { value: METEOR_RADIUS },
      uWidth: { value: WIDTH },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'meteor';
  mesh.renderOrder = (SKY_ORDER.stars + SKY_ORDER.sun) / 2;
  mesh.frustumCulled = false;
  mesh.visible = false;
  let time = 0;
  return {
    mesh,
    advance: (dt: number) => {
      time += Math.min(dt, 0.1);
      clock.stateAt(time, state);
      mesh.visible = state.active;
      if (!state.active) return;
      uStart.value.fromArray(state.start);
      uEnd.value.fromArray(state.end);
      uProgress.value = state.progress;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

function MeteorStreak() {
  const meteors = useMemo(() => createMeteors(), []);
  useEffect(() => meteors.dispose, [meteors]);
  useFrame((_, dt) => {
    meteors.advance(dt);
  });
  return <primitive object={meteors.mesh} />;
}

/**
 * An occasional meteor: a thin, bright streak crossing the far background every 6 to 15 s.
 * Lives in the camera-following space environment, drawn behind every body. Not drawn at all
 * under reduced motion.
 */
export function Meteors() {
  const reduced = useReducedMotion();
  return reduced ? null : <MeteorStreak />;
}
