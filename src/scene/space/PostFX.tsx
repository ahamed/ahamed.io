import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useReducedMotion } from '../useReducedMotion';

/**
 * Subtle cinematic finish for the 3D canvas only (dialogs are HTML outside it): bloom on the
 * brightest pixels, a gentle vignette, faint grain, then ACES tone mapping. The composer
 * turns off the renderer's own tone mapping while it runs, so ACES is applied once. Grain
 * reseeds every frame, so it is dropped under reduced motion.
 */
export function PostFX() {
  const reduced = useReducedMotion();
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.1} intensity={0.6} />
      <Vignette offset={0.3} darkness={0.55} />
      {reduced ? null : <Noise premultiply opacity={0.04} />}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
