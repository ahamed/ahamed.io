import { countWords } from '../content/words';
import { REVEAL_CPS } from '../ui/TerminalDialog/typewriter';
import { neighbourTarget } from './stops';

/** Shortest reading time at a stop. */
export const MIN_DWELL_MS = 4000;
const WORDS_PER_MINUTE = 200;
const END_EPSILON = 1e-6;

/** How long autoplay stays at a stop: the typewriter's time, then the card's reading time. */
export function dwellMs(text: string): number {
  const typing = (text.length / REVEAL_CPS) * 1000;
  const reading = (countWords(text) / WORDS_PER_MINUTE) * 60_000;
  return typing + Math.max(MIN_DWELL_MS, reading);
}

/** Where autoplay flies next from progress `p`: the next stop, then the route's end, then null. */
export function autoplayNext(p: number, closePoints: readonly number[]): number | null {
  if (p >= 1 - END_EPSILON) return null;
  return neighbourTarget(p, closePoints, 1);
}
