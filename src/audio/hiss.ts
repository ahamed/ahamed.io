/** A Voyager thruster pulse as sound: a very soft, short burst of band-passed noise. */
export interface HissParams {
  attack: number;
  decay: number;
  peakGain: number;
  /** Centre of the band-pass (Hz) and its Q. */
  bandHz: number;
  q: number;
}

export const hissParams = (): HissParams => ({
  attack: 0.01,
  decay: 0.19,
  peakGain: 0.03,
  bandHz: 2500,
  q: 0.9,
});

const SILENCE = 0.0001;

/** Length (s) of the shared white-noise buffer each hiss plays a slice of. */
export const HISS_BUFFER_SECONDS = 0.5;

/** A white-noise buffer to share between hisses (create once). */
export function createHissBuffer(ctx: BaseAudioContext): AudioBuffer {
  const length = Math.ceil(ctx.sampleRate * HISS_BUFFER_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Plays one hiss from `buffer` into `destination`; returns its source node. */
export function playHiss(
  ctx: BaseAudioContext,
  params: HissParams,
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
  source.start(now);
  source.stop(end);
  return source;
}
