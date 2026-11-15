/**
 * A rolling window of frame times (ms) in a fixed ring, so pushing a frame never allocates.
 * `fps()` and `frameMs()` average the most recent `windowMs` of frames.
 */
export function createRolling(windowMs: number, capacity = 1200) {
  const times = new Float64Array(capacity);
  let head = 0;
  let count = 0;

  /** Sum and count of the newest frames that fit in the window. */
  function scan(): [number, number] {
    let sum = 0;
    let n = 0;
    while (n < count) {
      const ms = times[(head - 1 - n + capacity) % capacity] ?? 0;
      // Always keep the newest frame; stop before a frame that would overrun the window.
      if (n > 0 && sum + ms > windowMs + 1e-6) break;
      sum += ms;
      n++;
    }
    return [sum, n];
  }

  return {
    push(ms: number): void {
      times[head] = ms;
      head = (head + 1) % capacity;
      if (count < capacity) count++;
    },
    fps(): number {
      const [sum, n] = scan();
      return sum > 0 ? (n * 1000) / sum : 0;
    },
    frameMs(): number {
      const [sum, n] = scan();
      return n > 0 ? sum / n : 0;
    },
    size: (): number => count,
    reset(): void {
      head = 0;
      count = 0;
    },
  };
}
