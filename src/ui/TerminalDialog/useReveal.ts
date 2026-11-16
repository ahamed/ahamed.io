import { useEffect, useRef, useState } from 'react';
import { typingLink } from '../../audio/typingLink';
import { revealAt } from '../../journey/orbit';
import { journeyRuntime } from '../../store/journey';

/**
 * Characters of `text` to show while its stop is typing: read from the orbit clock on each
 * animation frame (so the reveal stays in step with the lap), re-rendering only when the count
 * changes. Each newly revealed character goes to `typingLink` for the key tick.
 */
export function useReveal(text: string): number {
  const [count, setCount] = useState(() => revealAt(journeyRuntime.orbitClock, text.length));
  const shown = useRef(count);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const next = revealAt(journeyRuntime.orbitClock, text.length);
      if (next !== shown.current) {
        const now = performance.now();
        for (let i = shown.current; i < next; i++) typingLink.reveal(text.charAt(i), now);
        shown.current = next;
        setCount(next);
      }
      if (next < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return count;
}
