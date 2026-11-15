import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DataTexture,
  LinearFilter,
  type Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { coronaFragment, coronaVertex } from '../shaders/corona';
import { ghostRGBA, glowRGBA } from './flareTextures';
import { SKY_ORDER, SKY_RADIUS } from './layout';
import { SUN_DIRECTION } from './sunDirection';
import { useShaderClock } from './useShaderClock';

const DISTANCE = SKY_RADIUS * 0.9;
/** About 2.5° across: exaggerated from the real 0.5° so it reads at this scale. */
const DISC_RADIUS = DISTANCE * Math.tan((1.25 * Math.PI) / 180);
const CORONA_SCALE = 4;
const FLARE_TEXTURE_SIZE = 128;
/** Ghosts are additive; keep them faint so the flare reads as a lens artefact, not shapes. */
const GHOST_STRENGTH = 0.3;

const ghostTint = (hex: string) => new Color(hex).multiplyScalar(GHOST_STRENGTH);

function flareTexture(data: Uint8Array): DataTexture {
  const texture = new DataTexture(data, FLARE_TEXTURE_SIZE, FLARE_TEXTURE_SIZE, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createSun() {
  const position = new Vector3(...SUN_DIRECTION).multiplyScalar(DISTANCE);
  // Quads face back toward the origin, where the camera-following group keeps the camera.
  const facing = new Quaternion().setFromUnitVectors(
    new Vector3(0, 0, 1),
    new Vector3(...SUN_DIRECTION).negate(),
  );

  const disc = new Mesh(
    new CircleGeometry(DISC_RADIUS, 48),
    new MeshBasicMaterial({
      name: 'sun-disc',
      // HDR white so the bloom pass picks the disc up strongly.
      color: new Color('#fff4e0').multiplyScalar(20),
      depthWrite: false,
    }),
  );
  disc.name = 'sun-disc';

  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 2.2 },
    uDisc: { value: 1 / CORONA_SCALE },
  };
  const corona = new Mesh(
    new PlaneGeometry(DISC_RADIUS * CORONA_SCALE * 2, DISC_RADIUS * CORONA_SCALE * 2),
    new ShaderMaterial({
      name: 'sun-corona',
      vertexShader: coronaVertex,
      fragmentShader: coronaFragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  corona.name = 'sun-corona';

  for (const mesh of [disc, corona]) {
    mesh.position.copy(position);
    mesh.quaternion.copy(facing);
    mesh.renderOrder = SKY_ORDER.sun;
  }

  const glow = flareTexture(glowRGBA(FLARE_TEXTURE_SIZE));
  const ghost = flareTexture(ghostRGBA(FLARE_TEXTURE_SIZE));
  const flare = new Lensflare();
  flare.name = 'sun-flare';
  flare.position.copy(position);
  flare.addElement(new LensflareElement(glow, 600, 0, new Color('#fff1dc')));
  flare.addElement(new LensflareElement(ghost, 60, 0.6, ghostTint('#9fb8ff')));
  flare.addElement(new LensflareElement(ghost, 80, 0.7, ghostTint('#c2a6ff')));
  flare.addElement(new LensflareElement(ghost, 130, 0.9, ghostTint('#8fd1c4')));
  flare.addElement(new LensflareElement(ghost, 70, 1.0, ghostTint('#ffd3a0')));

  return {
    disc,
    corona,
    flare,
    advance: (dt: number) => {
      uniforms.uTime.value += dt;
    },
    dispose: () => {
      for (const mesh of [disc, corona]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      // Lensflare.dispose() frees its internal materials, but not its own (invisible) mesh
      // material or the quad geometry all flares share; three re-uploads that if drawn again.
      flare.dispose();
      const flareMesh: Mesh = flare;
      (flareMesh.material as Material).dispose();
      flareMesh.geometry.dispose();
      glow.dispose();
      ghost.dispose();
    },
  };
}

/** The Sun at infinity along SUN_DIRECTION: HDR disc, animated corona and lens flare. */
export function Sun() {
  const sun = useMemo(() => createSun(), []);
  useEffect(() => sun.dispose, [sun]);
  useShaderClock(sun.advance);

  return (
    <group name="sun">
      <primitive object={sun.disc} />
      <primitive object={sun.corona} />
      <primitive object={sun.flare} />
    </group>
  );
}
