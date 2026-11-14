import { useKTX2 } from '@react-three/drei';
import type { Texture } from 'three';

/** Where the Basis Universal transcoder (copied from three) is served. */
export const BASIS_PATH = '/basis/';

/** URL of a committed KTX2 texture in public/textures/. */
export const textureUrl = (name: string): string => `/textures/${name}.ktx2`;

/**
 * Loads KTX2 textures by name (suspends). Colour space comes from the file: maps encoded with
 * an sRGB transfer function load as SRGBColorSpace, masks as linear.
 */
export function useKtx2(names: readonly string[]): Texture[] {
  return useKTX2(names.map(textureUrl), BASIS_PATH);
}

/** Drops cached KTX2 textures so an unmounted view releases them for good. */
export function clearKtx2(names: readonly string[]): void {
  useKTX2.clear(names.map(textureUrl));
}
