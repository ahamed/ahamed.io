export interface BlipVoice {
  type: OscillatorType;
  startHz: number;
  endHz: number;
  /** Share of the peak gain. */
  level: number;
}

export interface BlipParams {
  attack: number;
  decay: number;
  peakGain: number;
  voices: BlipVoice[];
}

/** A short descending sci-fi "blip": sine sweep plus a quiet triangle an octave below. */
export const blipParams = (): BlipParams => ({
  attack: 0.005,
  decay: 0.14,
  peakGain: 0.15,
  voices: [
    { type: 'sine', startHz: 1800, endHz: 900, level: 1 },
    { type: 'triangle', startHz: 900, endHz: 450, level: 0.35 },
  ],
});

const SILENCE = 0.0001;

export function playBlip(
  ctx: BaseAudioContext,
  params: BlipParams,
  destination: AudioNode = ctx.destination,
): void {
  const now = ctx.currentTime;
  const end = now + params.attack + params.decay;
  for (const voice of params.voices) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = voice.type;
    osc.frequency.setValueAtTime(voice.startHz, now);
    osc.frequency.exponentialRampToValueAtTime(voice.endHz, end);
    gain.gain.setValueAtTime(SILENCE, now);
    gain.gain.linearRampToValueAtTime(params.peakGain * voice.level, now + params.attack);
    gain.gain.exponentialRampToValueAtTime(SILENCE, end);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(end);
  }
}
