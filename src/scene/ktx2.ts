import { useKTX2 } from '@react-three/drei';
import type { Texture } from 'three';
import { withBase } from '../app/withBase';
import type { TextureSet } from './quality/initialTier';
import { qualityStore } from './quality/store';

/** Where the Basis Universal transcoder (copied from three) is served. */
export const BASIS_PATH = withBase('basis/');

/** URL of a committed KTX2 texture in public/textures/. */
export const textureUrl = (name: string): string => withBase(`textures/${name}.ktx2`);

/** The texture to load for `name` in a set: a `2k_` map becomes its `1k_` version in the 1K set. */
export const resolveTexture = (name: string, set: TextureSet): string =>
  set === '1k' && name.startsWith('2k_') ? `1k_${name.slice(3)}` : name;

/** Chosen once at load from the starting quality tier; a later tier change never reloads maps. */
const TEXTURE_SET = qualityStore.getState().textureSet;
const urls = (names: readonly string[]): string[] =>
  names.map((name) => textureUrl(resolveTexture(name, TEXTURE_SET)));

/**
 * Loads KTX2 textures by name (suspends), from the device's texture set. Colour space comes from the file: maps encoded with
 * an sRGB transfer function load as SRGBColorSpace, masks as linear.
 */
export function useKtx2(names: readonly string[]): Texture[] {
  return useKTX2(urls(names), BASIS_PATH);
}

/** Drops cached KTX2 textures so an unmounted view releases them for good. */
export function clearKtx2(names: readonly string[]): void {
  useKTX2.clear(urls(names));
}
