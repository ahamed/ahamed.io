import { createStore } from 'zustand/vanilla';
import { adaptTier, startAdapt, type AdaptState } from './adapt';
import { detectDevice, initialTier, textureSet, type Device, type TextureSet } from './initialTier';
import type { Tier } from './profile';

export interface QualityState {
  tier: Tier;
  /** Chosen once at load; a later tier change never reloads textures. */
  textureSet: TextureSet;
  handheld: boolean;
  forced: boolean;
  adapt: AdaptState;
  /** The frame rate stayed low ('down') or high ('up'). */
  step: (direction: 'down' | 'up') => void;
}

export function createQualityStore(device: Device) {
  const tier = initialTier(device);
  const forced = device.forced !== null;
  return createStore<QualityState>()((set, get) => ({
    tier,
    textureSet: textureSet({ tier, handheld: device.handheld }),
    handheld: device.handheld,
    forced,
    adapt: startAdapt({ tier, ceiling: device.handheld ? tier : 'high', forced }),
    step: (direction) => {
      const next = adaptTier(get().adapt, direction);
      if (next !== get().adapt) set({ adapt: next, tier: next.tier });
    },
  }));
}

export type QualityStore = ReturnType<typeof createQualityStore>;

/** The voyage's quality, from this device and any `?quality=` override. */
export const qualityStore = createQualityStore(detectDevice());
