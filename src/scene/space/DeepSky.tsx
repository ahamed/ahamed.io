import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Points,
  ShaderMaterial,
} from 'three';
import type { Route } from '../../journey/route';
import { noise3Glsl } from '../shaders/noise';
import { galaxyCloud, NEBULAE } from './deepSkyField';
import { deepSkyFade, heliopauseLayout } from './heliosphere';

const nebulaVertex = /* glsl */ `
attribute vec3 aCentre;
attribute vec2 aCorner;
attribute float aSize;
attribute vec3 aColor;
attribute float aSeed;
varying vec2 vCorner;
varying vec3 vColor;
varying float vSeed;
void main() {
  vCorner = aCorner;
  vColor = aColor;
  vSeed = aSeed;
  // Camera-facing quad: offset the corner in view space.
  vec4 mv = viewMatrix * vec4(aCentre, 1.0);
  mv.xy += aCorner * aSize * 0.5;
  gl_Position = projectionMatrix * mv;
}
`;

const nebulaFragment = /* glsl */ `
uniform float uFade;
varying vec2 vCorner;
varying vec3 vColor;
varying float vSeed;
${noise3Glsl}
void main() {
  float r = length(vCorner);
  // Radial mask that reaches 0 well inside the quad, so no edge ever shows.
  float mask = smoothstep(0.95, 0.15, r);
  vec3 p = vec3(vCorner * 2.2, vSeed);
  // Domain-warped fbm for wispy clouds.
  float warp = fbm3(p + vec3(vSeed));
  float cloud = fbm3(p * 1.6 + warp * 1.8);
  float a = uFade * mask * pow(cloud, 1.8) * 1.1;
  gl_FragColor = vec4(vColor * a, a);
}
`;

const galaxyVertex = /* glsl */ `
attribute vec3 color;
uniform float uScale;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // World-size stars, never under 1.5 px so distant galaxies still read.
  gl_PointSize = max(1.5, 2.5 * uScale / max(-mv.z, 1.0));
}
`;

const galaxyFragment = /* glsl */ `
uniform float uFade;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = uFade * 0.7 * smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * a, a);
}
`;

const additive = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
} as const;

function createNebula(zStop: number, uFade: { value: number }) {
  const n = NEBULAE.length;
  const centre = new Float32Array(n * 4 * 3);
  const corner = new Float32Array(n * 4 * 2);
  const size = new Float32Array(n * 4);
  const color = new Float32Array(n * 4 * 3);
  const seed = new Float32Array(n * 4);
  const index: number[] = [];
  const corners = [-1, -1, 1, -1, 1, 1, -1, 1];
  const rgb = new Color();
  NEBULAE.forEach((cloud, c) => {
    rgb.set(cloud.color);
    for (let k = 0; k < 4; k++) {
      const v = c * 4 + k;
      centre.set([cloud.offset[0], cloud.offset[1], zStop + cloud.offset[2]], v * 3);
      corner.set([corners[k * 2] ?? 0, corners[k * 2 + 1] ?? 0], v * 2);
      size[v] = cloud.size;
      color.set([rgb.r, rgb.g, rgb.b], v * 3);
      seed[v] = cloud.seed;
    }
    const b = c * 4;
    index.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geometry = new BufferGeometry();
  // Positions are placed in the shader; this attribute sets the vertex count.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 4 * 3), 3));
  geometry.setAttribute('aCentre', new BufferAttribute(centre, 3));
  geometry.setAttribute('aCorner', new BufferAttribute(corner, 2));
  geometry.setAttribute('aSize', new BufferAttribute(size, 1));
  geometry.setAttribute('aColor', new BufferAttribute(color, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  geometry.setIndex(index);
  const material = new ShaderMaterial({
    vertexShader: nebulaVertex,
    fragmentShader: nebulaFragment,
    uniforms: { uFade },
    ...additive,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'nebula';
  mesh.frustumCulled = false;
  return mesh;
}

function createGalaxies(zStop: number, uFade: { value: number }, uScale: { value: number }) {
  const { positions, colors } = galaxyCloud(zStop);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const material = new ShaderMaterial({
    vertexShader: galaxyVertex,
    fragmentShader: galaxyFragment,
    uniforms: { uFade, uScale },
    ...additive,
  });
  const points = new Points(geometry, material);
  points.name = 'galaxies';
  return points;
}

function createDeepSky(route: Route) {
  const layout = heliopauseLayout(route);
  const uFade = { value: 0 };
  const uScale = { value: 1 };
  const nebula = createNebula(layout.zStop, uFade);
  const galaxies = createGalaxies(layout.zStop, uFade, uScale);
  const group = new Group();
  group.name = 'deep-sky';
  group.add(nebula, galaxies);
  group.visible = false;
  return {
    group,
    /** Fades the deep sky in past the heliopause; hidden (no draw calls) while it is 0. */
    update: (cameraZ: number, bufferHeight: number, fovY: number, canvas: HTMLElement) => {
      uFade.value = deepSkyFade(cameraZ, layout);
      const visible = uFade.value > 0;
      // Marked on the canvas for the end-to-end tests, only when it changes.
      if (visible !== group.visible || canvas.dataset.deepSky === undefined) {
        canvas.dataset.deepSky = visible ? 'shown' : 'hidden';
      }
      group.visible = visible;
      uScale.value = bufferHeight / 2 / Math.tan(fovY / 2);
    },
    dispose: () => {
      for (const part of [nebula, galaxies]) {
        part.geometry.dispose();
        part.material.dispose();
      }
    },
  };
}

/**
 * The nebula and spiral galaxies beyond the heliopause, all generated in code. Hidden through
 * the Solar System, they fade in as Voyager crosses the heliopause and are fully shown by the
 * heliopause stop. They sit in the world, so they shift slowly as Voyager moves.
 */
export function DeepSky({ route }: { route: Route }) {
  const deepSky = useMemo(() => createDeepSky(route), [route]);
  useEffect(() => deepSky.dispose, [deepSky]);
  useFrame(({ camera, size, viewport, gl }) => {
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    deepSky.update(camera.position.z, size.height * viewport.dpr, fovY, gl.domElement);
  });
  return <primitive object={deepSky.group} />;
}
