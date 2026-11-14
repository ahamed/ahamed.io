export type MoonPresetId =
  'io' | 'europa' | 'ganymede' | 'callisto' | 'titan' | 'rhea' | 'iapetus' | 'enceladus';

interface MoonPreset {
  /** Multiplied with the map: tints the greyscale mosaics toward each moon's real colour. */
  tint: string;
  roughness: number;
  /** Optional haze rim (Titan). */
  haze?: string;
}

/**
 * The gas-giant moons. Io and Ganymede use colour mosaics, so they stay untinted; the others are
 * greyscale mosaics tinted toward their true colour. All are tidally locked, so they do not spin.
 */
export const MOON_PRESETS: Record<MoonPresetId, MoonPreset> = {
  io: { tint: '#ffffff', roughness: 0.9 },
  europa: { tint: '#efe4d2', roughness: 0.7 },
  ganymede: { tint: '#ffffff', roughness: 0.9 },
  callisto: { tint: '#b3a593', roughness: 1 },
  titan: { tint: '#e8b878', roughness: 1, haze: '#d9893a' },
  rhea: { tint: '#dedad5', roughness: 0.9 },
  iapetus: { tint: '#e3d7c4', roughness: 0.95 },
  enceladus: { tint: '#ffffff', roughness: 0.6 },
};
