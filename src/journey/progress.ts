const MAX_DT = 0.1;
const EPSILON = 1e-5;

export const clampProgress = (p: number): number => Math.min(1, Math.max(0, p));

export const applyDelta = (target: number, delta: number): number => clampProgress(target + delta);

/**
 * Frame-rate independent exponential approach: never overshoots, settles exactly when close.
 * `lambda` is the decay rate per second; `dt` is clamped so a stalled tab cannot teleport.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  const step = Math.min(Math.max(dt, 0), MAX_DT);
  const next = target + (current - target) * Math.exp(-lambda * step);
  return Math.abs(next - target) < EPSILON ? target : next;
}
