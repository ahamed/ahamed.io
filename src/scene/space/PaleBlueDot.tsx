import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { DOT_FROM_TURN, finaleTurn } from '../../journey/finale';
import type { Route } from '../../journey/route';
import { journeyRuntime } from '../../store/journey';
import { SKY_ORDER, SKY_RADIUS } from './layout';
import { SUN_DIRECTION } from './sunDirection';

/** Distance of the dot from the camera, inside the sky sphere and in front of the stars. */
const DISTANCE = SKY_RADIUS * 0.85;
/** The dot's size on screen, in CSS px. */
const DOT_PX = 3;
/** HDR pale blue, so the bloom pass gives the dot a faint halo. */
const DOT_COLOR = new Color('#9cc8ff').multiplyScalar(2.5);
/** The scattered-sunlight band: long enough to cross the frame, about 2° wide. */
const BAND_LENGTH = 3200;
const BAND_WIDTH = 70;
const BAND_ALPHA = 0.11;

const dotVertex = /* glsl */ `
uniform float uSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}
`;

const dotFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uFade;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = uFade * smoothstep(0.5, 0.15, d);
  gl_FragColor = vec4(uColor * a, a);
}
`;

const bandVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bandFragment = /* glsl */ `
uniform float uFade;
varying vec2 vUv;
void main() {
  // Gaussian across the band; brighter toward the Sun's end (+x), fading out at both ends.
  float across = (vUv.y - 0.5) * 2.0;
  float a = exp(-across * across * 6.0);
  a *= smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * (0.55 + 0.45 * vUv.x);
  a *= uFade * ${BAND_ALPHA.toFixed(3)};
  gl_FragColor = vec4(vec3(1.0, 0.93, 0.82) * a, a);
}
`;

const additive = {
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: AdditiveBlending,
} as const;

function createPaleBlueDot(route: Route) {
  const earth = new Vector3(
    ...(route.bodies.find((b) => b.body === 'earth')?.position ?? [0, 0, 0]),
  );
  const uFade = { value: 0 };
  const uSize = { value: DOT_PX };

  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
  const dotMaterial = new ShaderMaterial({
    vertexShader: dotVertex,
    fragmentShader: dotFragment,
    uniforms: { uColor: { value: DOT_COLOR }, uFade, uSize },
    ...additive,
  });
  const dot = new Points(dotGeometry, dotMaterial);
  dot.name = 'earth-dot';

  const bandGeometry = new PlaneGeometry(BAND_LENGTH, BAND_WIDTH);
  const bandMaterial = new ShaderMaterial({
    vertexShader: bandVertex,
    fragmentShader: bandFragment,
    uniforms: { uFade },
    ...additive,
  });
  const band = new Mesh(bandGeometry, bandMaterial);
  band.name = 'sunbeam';

  for (const part of [dot, band]) {
    part.renderOrder = SKY_ORDER.sun;
    part.frustumCulled = false;
  }

  const group = new Group();
  group.name = 'pale-blue-dot';
  group.add(band, dot);
  group.visible = false;

  const direction = new Vector3();
  const sun = new Vector3(...SUN_DIRECTION);
  const along = new Vector3();
  const across = new Vector3();
  const facing = new Vector3();
  const basis = new Matrix4();

  return {
    group,
    /** Places the dot toward Earth and turns the band toward the Sun; hidden outside the finale. */
    update: (p: number, camera: Vector3, pixelRatio: number) => {
      const turn = finaleTurn(p);
      const fade = Math.min(1, Math.max(0, (turn - DOT_FROM_TURN) / (1 - DOT_FROM_TURN)));
      group.visible = fade > 0;
      if (!group.visible) return;
      uFade.value = fade * fade * (3 - 2 * fade);
      uSize.value = DOT_PX * pixelRatio;
      // The group follows the camera, so local positions are offsets from it.
      direction.subVectors(earth, camera).normalize();
      dot.position.copy(direction).multiplyScalar(DISTANCE);
      band.position.copy(dot.position);
      // Band basis: x toward the Sun within the plane facing the camera, z back at the camera.
      facing.copy(direction).negate();
      along.copy(sun).addScaledVector(direction, -sun.dot(direction)).normalize();
      across.crossVectors(facing, along);
      basis.makeBasis(along, across, facing);
      band.quaternion.setFromRotationMatrix(basis);
    },
    dispose: () => {
      dotGeometry.dispose();
      dotMaterial.dispose();
      bandGeometry.dispose();
      bandMaterial.dispose();
    },
  };
}

/**
 * The Pale Blue Dot: Earth as a single pale-blue point in a faint band of scattered sunlight,
 * as in Voyager 1's 1990 photo. Lives in the camera-following space environment and draws
 * only once the finale's look-back turn is past halfway.
 */
export function PaleBlueDot({ route }: { route: Route }) {
  const paleBlueDot = useMemo(() => createPaleBlueDot(route), [route]);
  useEffect(() => paleBlueDot.dispose, [paleBlueDot]);
  useFrame(({ camera, gl }) => {
    paleBlueDot.update(journeyRuntime.position, camera.position, gl.getPixelRatio());
  });
  return <primitive object={paleBlueDot.group} />;
}
