import { TIERS, type Tier } from './profile';

export type TextureSet = '1k' | '2k';

/** Below this width a coarse-pointer device counts as a phone or tablet. */
const HANDHELD_WIDTH = 1024;
const MIN_CORES = 4;

/** `?quality=low|medium|high`, or null. */
export function parseForced(search: string): Tier | null {
  const value = new URLSearchParams(search).get('quality');
  return TIERS.find((tier) => tier === value) ?? null;
}

export const isHandheld = ({ coarse, width }: { coarse: boolean; width: number }): boolean =>
  coarse && width < HANDHELD_WIDTH;

/** The tier to start at: forced, else medium on handhelds and weak CPUs, else high. */
export function initialTier({
  forced,
  handheld,
  cores,
}: {
  forced: Tier | null;
  handheld: boolean;
  cores: number;
}): Tier {
  if (forced) return forced;
  return handheld || cores < MIN_CORES ? 'medium' : 'high';
}

/** 1K maps for a low start or a handheld; 2K otherwise. Chosen once, at load. */
export const textureSet = ({ tier, handheld }: { tier: Tier; handheld: boolean }): TextureSet =>
  tier === 'low' || handheld ? '1k' : '2k';

export interface Device {
  forced: Tier | null;
  handheld: boolean;
  cores: number;
}

/** Reads the browser: the only impure part of choosing a starting tier. */
export function detectDevice(): Device {
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return {
    forced: parseForced(window.location.search),
    handheld: isHandheld({ coarse, width: window.innerWidth }),
    cores: navigator.hardwareConcurrency || 8,
  };
}
