export interface WheelLike {
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
}

const LINE_HEIGHT_PX = 16;
/** Viewport heights of scrolling per stop. */
export const SCREENS_PER_STOP = 1.5;
/** One arrow press moves this share of the average gap between stops. */
export const ARROW_STEP_FRACTION = 0.04;

export function wheelToPixels(event: WheelLike, viewportHeight: number): number {
  if (event.ctrlKey) return 0;
  if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT_PX;
  if (event.deltaMode === 2) return event.deltaY * viewportHeight;
  return event.deltaY;
}

export function pixelsToProgress(px: number, viewportHeight: number, stopCount: number): number {
  return px / (viewportHeight * SCREENS_PER_STOP * Math.max(1, stopCount));
}

export type Command =
  | { type: 'step'; dir: 1 | -1 }
  | { type: 'stop'; dir: 1 | -1 }
  | { type: 'start' }
  | { type: 'end' };

export function keyToCommand(key: string): Command | null {
  switch (key) {
    case 'ArrowDown':
      return { type: 'step', dir: 1 };
    case 'ArrowUp':
      return { type: 'step', dir: -1 };
    case 'PageDown':
      return { type: 'stop', dir: 1 };
    case 'PageUp':
      return { type: 'stop', dir: -1 };
    case 'Home':
      return { type: 'start' };
    case 'End':
      return { type: 'end' };
    default:
      return null;
  }
}
