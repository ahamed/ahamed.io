import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useStore } from 'zustand';
import { qualityProfile, type Tier } from '../quality/profile';
import { qualityStore } from '../quality/store';
import { perfRoots } from '../perf/roots';
import { useReducedMotion } from '../useReducedMotion';

/** Lets ?perf count the composer's render targets toward texture memory. */
function registerComposer(composer: object | null) {
  if (!composer) return undefined;
  perfRoots.add(composer);
  return () => {
    perfRoots.delete(composer);
  };
}

/**
 * Subtle cinematic finish for the 3D canvas only (dialogs are HTML outside it): bloom on the
 * brightest pixels, a gentle vignette, faint grain, then ACES tone mapping. The composer
 * turns off the renderer's own tone mapping while it runs, so ACES is applied once. Grain
 * reseeds every frame, so it is dropped under reduced motion. Lighter quality tiers sample
 * less and drop bloom and grain; the vignette and tone mapping always stay.
 */
export function PostFX({ tier: forcedTier }: { tier?: Tier }) {
  const reduced = useReducedMotion();
  const storeTier = useStore(qualityStore, (s) => s.tier);
  const profile = qualityProfile(forcedTier ?? storeTier);
  return (
    <EffectComposer
      ref={registerComposer}
      multisampling={profile.multisampling}
      enableNormalPass={false}
    >
      {profile.bloom === 'off' ? null : (
        <Bloom
          mipmapBlur
          luminanceThreshold={0.9}
          luminanceSmoothing={0.1}
          intensity={0.6}
          resolutionScale={profile.bloom === 'half' ? 0.5 : 1}
        />
      )}
      <Vignette offset={0.3} darkness={0.55} />
      {reduced || !profile.grain ? null : <Noise premultiply opacity={0.04} />}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
