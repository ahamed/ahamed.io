import { useStore } from 'zustand';
import { qualityProfile, type QualityProfile, type Tier } from './profile';
import { qualityStore } from './store';

/** The current tier's profile, or `tier`'s when given (tests and previews). */
export function useQualityProfile(tier?: Tier): QualityProfile {
  const current = useStore(qualityStore, (s) => s.tier);
  return qualityProfile(tier ?? current);
}
