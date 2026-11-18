/**
 * The typewriter's key tick: a very short, quiet click of band-passed noise. Pitch and level
 * vary a little per key so it sounds mechanical rather than looped.
 */
export interface TickParams {
  attack: number;
  decay: number;
  peakGain: number;
  bandHz: number;
  q: number;
}

const BASE_HZ = 3200;
const PITCH_SPREAD = 0.08;
const BASE_GAIN = 0.035;
const GAIN_SPREAD = 0.2;

export const TICK_BOUNDS = {
  minHz: BASE_HZ * (1 - PITCH_SPREAD),
  maxHz: BASE_HZ * (1 + PITCH_SPREAD),
  minGain: BASE_GAIN * (1 - GAIN_SPREAD),
  maxGain: BASE_GAIN * (1 + GAIN_SPREAD),
} as const;

/** Shortest gap (ms) between ticks: at most about 30 a second, faster typing goes silent. */
export const MIN_TICK_GAP_MS = 34;

/** One tick's parameters; `rand` returns values in [0, 1). */
export function tickParams(rand: () => number): TickParams {
  const spread = (r: number) => 2 * Math.min(1, Math.max(0, r)) - 1;
  return {
    attack: 0.002,
    decay: 0.024,
    peakGain: BASE_GAIN * (1 + GAIN_SPREAD * spread(rand())),
    bandHz: BASE_HZ * (1 + PITCH_SPREAD * spread(rand())),
    q: 1.4,
  };
}

/** Whether revealing `char` at `now` should tick, given the last tick at `lastAt`. */
export const shouldTick = (char: string, now: number, lastAt: number): boolean =>
  char.trim() !== '' && now - lastAt >= MIN_TICK_GAP_MS;

const SILENCE = 0.0001;

/** Plays one tick from the shared noise `buffer` into `destination`; returns its source. */
export function playTick(
  ctx: BaseAudioContext,
  params: TickParams,
  buffer: AudioBuffer,
  destination: AudioNode = ctx.destination,
): AudioBufferSourceNode {
  const now = ctx.currentTime;
  const end = now + params.attack + params.decay;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(params.bandHz, now);
  filter.Q.setValueAtTime(params.q, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENCE, now);
  gain.gain.linearRampToValueAtTime(params.peakGain, now + params.attack);
  gain.gain.exponentialRampToValueAtTime(SILENCE, end);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  // Start at a random point in the buffer so consecutive ticks differ.
  source.start(now, Math.random() * Math.max(0, buffer.duration - (end - now)));
  source.stop(end);
  return source;
}
