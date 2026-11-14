import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  DoubleSide,
  type Group,
  type Mesh,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  type Texture,
  Vector3,
} from 'three';
import { RING_INNER, RING_OUTER } from '../../journey/route';
import { useKtx2 } from '../ktx2';
import { SUN_DIRECTION } from '../space/sunDirection';
import { useShaderClock } from '../space/useShaderClock';
import { ringShadowGlsl } from './ringShadow';
import { useDrawDistance } from './useDrawDistance';

/** Saturn's axial tilt (26.7°), leaning the ring plane toward the approaching camera (+Z). */
const TILT = (26.7 * Math.PI) / 180;
/** Visible spin (rad/s). The rings are symmetric about the axis, so only the planet spins. */
const SPIN = 0.008;
/** Brightness left in the planet's shadow on the rings. */
const RING_IN_SHADOW = 0.12;

const SHADOW_UNIFORMS = /* glsl */ `
uniform sampler2D uRingStrip;
uniform vec3 uCentre;
uniform vec3 uNormal;
uniform vec3 uSun;
uniform float uRadius;
uniform float uInner;
uniform float uOuter;
`;

const ringVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const ringFragment = /* glsl */ `
${SHADOW_UNIFORMS}
varying vec3 vWorld;
${ringShadowGlsl}
void main() {
  float r = length(vWorld - uCentre);
  vec4 strip = texture(uRingStrip, vec2(clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0), 0.5));
  float light = 0.25 + 0.75 * abs(dot(uNormal, uSun));
  float shadow = planetShadowsRing(vWorld, uCentre, uRadius, uSun) ? ${String(RING_IN_SHADOW)} : 1.0;
  gl_FragColor = vec4(strip.rgb * light * shadow, strip.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function createSaturn(planetMap: Texture, strip: Texture, radius: number) {
  const uniforms = {
    uRingStrip: { value: strip },
    uCentre: { value: new Vector3() },
    uNormal: { value: new Vector3(0, 1, 0) },
    uSun: { value: new Vector3(...SUN_DIRECTION) },
    uRadius: { value: radius },
    uInner: { value: RING_INNER * radius },
    uOuter: { value: RING_OUTER * radius },
  };

  const surfaceMaterial = new MeshStandardMaterial({
    map: planetMap,
    roughness: 0.9,
    metalness: 0,
  });
  surfaceMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 vSaturnWorld;\n${shader.vertexShader}`.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n  vSaturnWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    );
    shader.fragmentShader =
      `${SHADOW_UNIFORMS}\nvarying vec3 vSaturnWorld;\n${ringShadowGlsl}\n${shader.fragmentShader}`.replace(
        '#include <opaque_fragment>',
        `outgoingLight *= ringShadowOnPlanet(vSaturnWorld, uCentre, uNormal, uInner, uOuter, uSun);
#include <opaque_fragment>`,
      );
  };
  surfaceMaterial.customProgramCacheKey = () => 'saturn-ring-shadow';

  // RingGeometry lies in XY; turn it into the planet's equatorial (XZ) plane.
  const ringGeometry = new RingGeometry(RING_INNER * radius, RING_OUTER * radius, 128, 1);
  ringGeometry.rotateX(-Math.PI / 2);
  const ringMaterial = new ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });

  const quaternion = new Quaternion();
  return {
    surfaceMaterial,
    ringGeometry,
    ringMaterial,
    /** Copies the planet centre and the tilted ring normal into the shadow uniforms. */
    update(root: Group, tilted: Group) {
      root.getWorldPosition(uniforms.uCentre.value);
      uniforms.uNormal.value.set(0, 1, 0).applyQuaternion(tilted.getWorldQuaternion(quaternion));
    },
    /** Spins the planet (not the rings) by `dt` seconds. */
    advance(dt: number, surface: Mesh | null) {
      if (surface) surface.rotation.y += SPIN * dt;
    },
    dispose: () => {
      surfaceMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    },
  };
}

/**
 * Saturn: KTX2 planet map, a flat ring system shaded from the ring strip by radius (Cassini
 * Division included), and analytic shadows both ways from the Sun direction. The spin holds
 * still under reduced motion.
 */
export function Saturn({ radius }: { radius: number }) {
  const [planetMap, strip] = useKtx2(['2k_saturn', '2k_saturn_ring_alpha']);
  const saturn = useMemo(
    () => (planetMap && strip ? createSaturn(planetMap, strip, radius) : null),
    [planetMap, strip, radius],
  );
  useEffect(() => saturn?.dispose, [saturn]);

  const root = useRef<Group>(null);
  const tilted = useRef<Group>(null);
  const surface = useRef<Mesh>(null);
  useDrawDistance(root, radius * RING_OUTER);
  useShaderClock((dt) => saturn?.advance(dt, surface.current));
  useFrame(() => {
    if (saturn && root.current && tilted.current) saturn.update(root.current, tilted.current);
  });

  return (
    <group name="saturn" ref={root}>
      <group ref={tilted} rotation={[TILT, 0, 0]}>
        <mesh name="saturn-surface" ref={surface} material={saturn?.surfaceMaterial}>
          <sphereGeometry args={[radius, 128, 64]} />
        </mesh>
        <mesh
          name="saturn-rings"
          geometry={saturn?.ringGeometry}
          material={saturn?.ringMaterial}
          renderOrder={1}
        />
      </group>
    </group>
  );
}
