/** Characters revealed per second by the typewriter effect. */
export const REVEAL_CPS = 60;

export function revealCount(elapsedMs: number, length: number, reducedMotion: boolean): number {
  if (reducedMotion) return length;
  const count = Math.floor((Math.max(0, elapsedMs) / 1000) * REVEAL_CPS);
  return Math.min(length, count);
}
