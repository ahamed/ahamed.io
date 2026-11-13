import {
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  Vector2,
  type Texture,
} from 'three';
import type { MaterialSlot } from './parts';
import { crinkleHeight, grooveRGBA, heightToNormalRGBA, roughnessRGBA } from './textures';

const TEXTURE_SIZE = 256;
const FOIL_SEED = 1977;
const FOIL_REPEAT = 3;

type Slots = Record<Exclude<MaterialSlot, 'foil'>, MeshStandardMaterial> & {
  foil: MeshPhysicalMaterial;
};

export interface VoyagerMaterials {
  slots: Slots;
  /** Points every Voyager material at `env` (or none); three recompiles as needed. */
  setEnvironment: (env: Texture | null) => void;
  dispose: () => void;
}

/** Data (non-colour) texture from RGBA8 bytes: tiled, mipmapped, no colour-space transform. */
function dataTexture(data: Uint8Array, repeat: number): DataTexture {
  const texture = new DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, RGBAFormat);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Voyager's PBR materials, one per slot. `env` (a PMREM texture) is applied per material, so
 * only Voyager reflects it; `scene.environment` is left untouched.
 */
export function createVoyagerMaterials(env: Texture | null): VoyagerMaterials {
  const height = crinkleHeight(TEXTURE_SIZE, FOIL_SEED);
  const foilNormal = dataTexture(heightToNormalRGBA(height, TEXTURE_SIZE, 0.06), FOIL_REPEAT);
  const foilRoughness = dataTexture(roughnessRGBA(height, TEXTURE_SIZE, 0.6, 1), FOIL_REPEAT);
  const grooves = dataTexture(grooveRGBA(TEXTURE_SIZE), 1);
  const textures = [foilNormal, foilRoughness, grooves];

  const slots: Slots = {
    foil: new MeshPhysicalMaterial({
      name: 'voyager-foil',
      color: '#c9a24a',
      metalness: 1,
      roughness: 0.42,
      roughnessMap: foilRoughness,
      normalMap: foilNormal,
      normalScale: new Vector2(0.4, 0.4),
      clearcoat: 0.3,
      clearcoatRoughness: 0.35,
      envMap: env,
      envMapIntensity: 1.2,
    }),
    metal: new MeshStandardMaterial({
      name: 'voyager-metal',
      color: '#9aa1a9',
      metalness: 0.9,
      roughness: 0.4,
      envMap: env,
      envMapIntensity: 1.2,
    }),
    dish: new MeshStandardMaterial({
      name: 'voyager-dish',
      color: '#e8e6e1',
      metalness: 0.1,
      roughness: 0.6,
      side: DoubleSide,
      envMap: env,
      envMapIntensity: 0.6,
    }),
    dark: new MeshStandardMaterial({
      name: 'voyager-dark',
      color: '#2b2e33',
      metalness: 0.5,
      roughness: 0.6,
      envMap: env,
      envMapIntensity: 0.6,
    }),
    record: new MeshStandardMaterial({
      name: 'voyager-record',
      color: '#d4a73c',
      metalness: 1,
      roughness: 1,
      roughnessMap: grooves,
      envMap: env,
      envMapIntensity: 1,
    }),
    black: new MeshStandardMaterial({
      name: 'voyager-black',
      color: '#0d0e10',
      metalness: 0.2,
      roughness: 0.9,
      envMap: env,
      envMapIntensity: 0.4,
    }),
  };

  return {
    slots,
    setEnvironment: (texture) => {
      for (const material of Object.values(slots)) material.envMap = texture;
    },
    dispose: () => {
      for (const material of Object.values(slots)) material.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
