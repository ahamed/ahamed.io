export interface DroneParams {
  oscillators: { type: OscillatorType; hz: number; detune: number; level: number }[];
  /** Slowly swept low-pass over the oscillators. */
  filter: { hz: number; sweepHz: number; lfoHz: number };
  /** Faint low-passed noise: the "cosmic hiss". */
  noise: { gain: number; lowpassHz: number };
  /** Volume breathing. */
  ampLfo: { hz: number; depth: number };
  /** Steady-state output gain, before mute. */
  gain: number;
  /** Seconds to fade in from silence. */
  fadeIn: number;
}

/** The deep-space pad under the whole voyage: A1, E2 and A2, detuned, breathing every ~12 s. */
export const droneParams = (): DroneParams => ({
  oscillators: [
    { type: 'sine', hz: 55, detune: 0, level: 1 },
    { type: 'triangle', hz: 82.41, detune: 7, level: 0.55 },
    { type: 'sine', hz: 110, detune: -5, level: 0.35 },
  ],
  filter: { hz: 380, sweepHz: 120, lfoHz: 0.03 },
  noise: { gain: 0.015, lowpassHz: 600 },
  ampLfo: { hz: 0.08, depth: 0.25 },
  gain: 0.05,
  fadeIn: 4,
});
