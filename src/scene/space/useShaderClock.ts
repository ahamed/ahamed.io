import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '../useReducedMotion';

/**
 * Calls `advance` with each frame's time (clamped to 0.1 s) so shader animation is smooth;
 * under prefers-reduced-motion it is not called, so the animation holds still.
 */
export function useShaderClock(advance: (dt: number) => void): void {
  const reduced = useReducedMotion();
  useFrame((_, dt) => {
    if (!reduced) advance(Math.min(dt, 0.1));
  });
}
