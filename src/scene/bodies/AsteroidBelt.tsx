import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { drawCount, type Tier } from '../quality/profile';
import { useQualityProfile } from '../quality/useQualityProfile';
import {
  type Group,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three';
import { useShaderClock } from '../space/useShaderClock';
import { BELT_SHAPES, createBelt, type BeltOptions } from './belt';
import { beltInRange, drawDistance } from './drawDistance';
import { createRockGeometry } from './rockGeometry';

const ROCK_DETAIL = 2;
const ROCK_COLOR = '#8a8178';
/** The belt is drawn from where a unit-size rock would become visible. */
const MARGIN_ROCK_RADIUS = 1;

/** GLSL: rotate a vector about the instance's spin axis by uTime × aSpinRate (Rodrigues). */
const SPIN_HEADER = /* glsl */ `
  attribute vec3 aSpinAxis;
  attribute float aSpinRate;
  uniform float uTime;
  vec3 spinVec(vec3 v) {
    float a = uTime * aSpinRate;
    float c = cos(a);
    return v * c + cross(aSpinAxis, v) * sin(a) + aSpinAxis * dot(aSpinAxis, v) * (1.0 - c);
  }
`;

function createBeltMeshes(options: BeltOptions, color: string, name: string) {
  const belt = createBelt(options);
  const uTime = { value: 0 };
  const material = new MeshStandardMaterial({
    name,
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
  });
  material.userData.uTime = uTime;
  // Tumble on the GPU: spin each rock (and its normal) before the instance matrix applies.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = SPIN_HEADER + shader.vertexShader;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\n  objectNormal = spinVec(objectNormal);',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  transformed = spinVec(transformed);',
      );
  };

  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const meshes = BELT_SHAPES.map((shape, s) => {
    const members: number[] = [];
    for (let i = 0; i < belt.count; i++) if (belt.shapes[i] === s) members.push(i);
    const geometry = createRockGeometry(shape, ROCK_DETAIL, color);
    const axes = new Float32Array(members.length * 3);
    const rates = new Float32Array(members.length);
    const mesh = new InstancedMesh(geometry, material, members.length);
    mesh.name = `belt-${shape}`;
    members.forEach((i, k) => {
      position.fromArray(belt.positions, i * 3);
      rotation.fromArray(belt.rotations, i * 4);
      scale.setScalar(belt.scales[i] ?? 0);
      mesh.setMatrixAt(k, matrix.compose(position, rotation, scale));
      axes.set(belt.axes.subarray(i * 3, i * 3 + 3), k * 3);
      rates[k] = belt.rates[i] ?? 0;
    });
    geometry.setAttribute('aSpinAxis', new InstancedBufferAttribute(axes, 3));
    geometry.setAttribute('aSpinRate', new InstancedBufferAttribute(rates, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  });

  return {
    meshes,
    /** Draws a share of each shape's rocks; the buffers keep every rock. */
    setFraction: (fraction: number) => {
      for (const mesh of meshes) mesh.count = drawCount(mesh.instanceMatrix.count, fraction);
    },
    advance: (dt: number) => {
      uTime.value += dt;
    },
    dispose: () => {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        mesh.dispose();
      }
      material.dispose();
    },
  };
}

/**
 * A sparse rock field around a section of the route (the asteroid belt, or the Kuiper belt
 * with an icy colour): one instanced mesh per rock
 * shape (≤ 3 draw calls), tumbling on the GPU; the tumble holds still under reduced motion.
 */
export function AsteroidBelt({
  options,
  color = ROCK_COLOR,
  name = 'asteroid-belt',
  tier,
}: {
  options: BeltOptions;
  /** Overrides the current quality tier (tests). */
  tier?: Tier;
  /** Base rock colour (sRGB). */
  color?: string;
  name?: string;
}) {
  const belt = useMemo(() => createBeltMeshes(options, color, name), [options, color, name]);
  useEffect(() => belt.dispose, [belt]);
  const { beltFraction } = useQualityProfile(tier);
  useEffect(() => {
    belt.setFraction(beltFraction);
  }, [belt, beltFraction]);
  useShaderClock(belt.advance);
  const groupRef = useRef<Group>(null);
  // Hide the whole belt (all its draw calls) while the camera is far from its span.
  useFrame(({ camera, size }) => {
    const group = groupRef.current;
    if (!group) return;
    const fovY = camera instanceof PerspectiveCamera ? MathUtils.degToRad(camera.fov) : Math.PI / 4;
    const margin = drawDistance(MARGIN_ROCK_RADIUS, fovY, size.height);
    group.visible = beltInRange(camera.position.z, options, margin);
  });
  return (
    <group ref={groupRef} name={name}>
      {belt.meshes.map((mesh) => (
        <primitive key={mesh.name} object={mesh} />
      ))}
    </group>
  );
}
