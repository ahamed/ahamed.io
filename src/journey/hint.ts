/** How long the controls hint stays up after it appears. */
export const HINT_MS = 8000;
/** Moves that dismiss the hint. */
const HINT_MOVES = 2;
/** Idle time at Earth after which the hint comes back. */
export const HINT_IDLE_MS = 20_000;

export interface HintInput {
  /** Time since the hint was (last) shown. */
  shownForMs: number;
  /** Manual moves since it was (last) shown. */
  movesSinceShown: number;
  /** How long the voyage has rested at Earth with no input (0 when elsewhere). */
  idleAtEarthMs: number;
}

/** Whether the controls hint is visible: briefly after it appears, and again when idle at Earth. */
export function hintVisible({ shownForMs, movesSinceShown, idleAtEarthMs }: HintInput): boolean {
  if (idleAtEarthMs >= HINT_IDLE_MS) return true;
  return movesSinceShown < HINT_MOVES && shownForMs < HINT_MS;
}
