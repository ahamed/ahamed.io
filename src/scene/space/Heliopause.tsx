import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import type { Route, Vec3 } from '../../journey/route';
import { noise3Glsl } from '../shaders/noise';
import { useReducedMotion } from '../useReducedMotion';
import { crossingGlow, heliopauseLayout, RIM_POWER, shellsVisible } from './heliosphere';
import { useShaderClock } from './useShaderClock';

/** Half-angle of each spherical cap around its nose (rad): past its limb, bounding the fill. */
const CAP = (70 * Math.PI) / 180;
/** How much the crossing glow multiplies the heliopause shell's brightness by, at its peak. */
const CROSS_BOOST = 2.5;

const vertex = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
uniform float uBrightness;
uniform float uCross;
uniform float uTime;
uniform float uCapCos;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vLocal;
${noise3Glsl}
void main() {
  vec3 view = normalize(cameraPosition - vWorld);
  float c = abs(dot(view, normalize(vNormal)));
  // Same as rimGlow() in heliosphere.ts: nearly clear face-on, full at a glancing view.
  float rim = 0.03 + 0.97 * pow(1.0 - min(c, 1.0), ${RIM_POWER.toFixed(1)});
  float ripple = 0.55 + 0.9 * fbm3(vWorld * 0.004 + vec3(0.0, uTime * 0.015, uTime * 0.01));
  // Fade out toward the cap's edge so it never shows a hard border.
  float axis = normalize(vLocal).y;
  float edge = smoothstep(uCapCos, mix(uCapCos, 1.0, 0.35), axis);
  float a = uBrightness * (1.0 + ${CROSS_BOOST.toFixed(1)} * uCross) * rim * ripple * edge;
  gl_FragColor = vec4(uColor * a, a);
}
`;

interface ShellSpec {
  name: string;
  radius: number;
  color: string;
  brightness: number;
}

function createShell(
  { name, radius, color, brightness }: ShellSpec,
  centre: Vec3,
  uTime: { value: number },
) {
  const uCross = { value: 0 };
  // A unit cap around +Y, turned to face +Z (the approaching camera) and scaled to the radius.
  const geometry = new SphereGeometry(1, 128, 48, 0, Math.PI * 2, 0, CAP);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uColor: { value: new Color(color) },
      uBrightness: { value: brightness },
      uCross,
      uTime,
      uCapCos: { value: Math.cos(CAP) },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...centre);
  mesh.rotation.x = Math.PI / 2;
  mesh.scale.setScalar(radius);
  return { mesh, material, geometry, uCross };
}

function createHeliopause(route: Route) {
  const layout = heliopauseLayout(route);
  const uTime = { value: 0 };
  const helio = createShell(
    { name: 'heliopause-shell', radius: layout.helioRadius, color: '#67d3c1', brightness: 0.6 },
    layout.helioCentre,
    uTime,
  );
  const bow = createShell(
    { name: 'bow-shock-shell', radius: layout.bowRadius, color: '#9a7cff', brightness: 0.5 },
    layout.bowCentre,
    uTime,
  );
  const group = new Group();
  group.name = 'heliopause';
  group.add(helio.mesh, bow.mesh);
  group.visible = false;
  return {
    group,
    advance: (dt: number) => {
      uTime.value += dt;
    },
    /** Shows the shells near the crossing and sets the crossing glow (0 under reduced motion). */
    update: (cameraZ: number, reduced: boolean) => {
      group.visible = shellsVisible(cameraZ, layout);
      helio.uCross.value = reduced ? 0 : crossingGlow(cameraZ, layout);
    },
    dispose: () => {
      for (const shell of [helio, bow]) {
        shell.geometry.dispose();
        shell.material.dispose();
      }
    },
  };
}

/**
 * The heliopause and the bow shock beyond it: two huge, faint spherical caps that glow at the
 * rim (Fresnel) with slow drifting ripples. The heliopause shell brightens as Voyager crosses
 * it. Under reduced motion the ripples hold still and the crossing does not brighten.
 */
export function Heliopause({ route }: { route: Route }) {
  const heliopause = useMemo(() => createHeliopause(route), [route]);
  useEffect(() => heliopause.dispose, [heliopause]);
  const reduced = useReducedMotion();
  useShaderClock(heliopause.advance);
  useFrame(({ camera }) => {
    heliopause.update(camera.position.z, reduced);
  });
  return <primitive object={heliopause.group} />;
}
