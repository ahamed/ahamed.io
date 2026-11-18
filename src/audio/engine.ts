import { blipParams, playBlip } from './blip';
import { droneParams } from './drone';
import { buildDrone, buildPlasma } from './graph';
import { createHissBuffer, hissParams, playHiss } from './hiss';
import { plasmaParams } from './plasma';
import { playTick, shouldTick, tickParams } from './tick';

/** Time constant (s) of the mute ramp: about 0.15 s to silence, with no click. */
const MUTE_TAU = 0.05;
/** Time constant (s) of plasma level changes. */
const PLASMA_TAU = 0.2;
/** Smallest plasma level change worth scheduling. */
const PLASMA_STEP = 0.005;

export interface AudioEngine {
  isStarted: () => boolean;
  /** Creates and resumes the AudioContext and starts the drone and plasma. Call from a gesture. */
  start: () => void;
  /** Plays the blip if started and not muted; returns whether it played. Never queues. */
  blip: () => boolean;
  /** Plays a thruster hiss if started and not muted; returns whether it played. Never queues. */
  hiss: () => boolean;
  /**
   * Plays a key tick for `char` revealed at `now` (ms) if started, not muted, not whitespace and
   * not within the rate cap of the last tick; returns whether it played.
   */
  tick: (char: string, now: number) => boolean;
  setMuted: (muted: boolean) => void;
  /** The plasma texture's level, 0..1 (see plasmaGain). */
  setPlasma: (level: number) => void;
  onStart: (listener: () => void) => () => void;
  dispose: () => void;
}

interface Options {
  createContext?: () => AudioContext;
}

/**
 * The voyage's sound: a master gain (mute) over the drone, the plasma texture, the blip, the
 * thruster hiss and the typewriter tick (which shares the hiss's noise buffer).
 */
export function createAudioEngine({
  createContext = () => new AudioContext(),
}: Options = {}): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let plasma: GainNode | null = null;
  let hissBuffer: AudioBuffer | null = null;
  let muted = false;
  let lastTickAt = -Infinity;
  let plasmaLevel = 0;
  let scheduledPlasma = -1;
  const listeners = new Set<() => void>();
  const blip = blipParams();
  const hiss = hissParams();
  const plasmaSettings = plasmaParams();

  const applyPlasma = () => {
    if (!ctx || !plasma || Math.abs(plasmaLevel - scheduledPlasma) < PLASMA_STEP) return;
    scheduledPlasma = plasmaLevel;
    plasma.gain.setTargetAtTime(plasmaLevel * plasmaSettings.level, ctx.currentTime, PLASMA_TAU);
  };

  return {
    isStarted: () => ctx !== null,
    start: () => {
      if (ctx) return;
      ctx = createContext();
      void ctx.resume();
      master = ctx.createGain();
      master.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
      master.connect(ctx.destination);
      buildDrone(ctx, master, droneParams());
      plasma = buildPlasma(ctx, master, plasmaSettings).gain;
      hissBuffer = createHissBuffer(ctx);
      applyPlasma();
      for (const listener of listeners) listener();
    },
    blip: () => {
      if (!ctx || !master || muted) return false;
      playBlip(ctx, blip, master);
      return true;
    },
    hiss: () => {
      if (!ctx || !master || !hissBuffer || muted) return false;
      playHiss(ctx, hiss, hissBuffer, master);
      return true;
    },
    tick: (char, now) => {
      if (!ctx || !master || !hissBuffer || muted || !shouldTick(char, now, lastTickAt)) {
        return false;
      }
      lastTickAt = now;
      playTick(ctx, tickParams(Math.random), hissBuffer, master);
      return true;
    },
    setMuted: (value) => {
      muted = value;
      if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, MUTE_TAU);
    },
    setPlasma: (level) => {
      plasmaLevel = level;
      applyPlasma();
    },
    onStart: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      listeners.clear();
      void ctx?.close();
      ctx = null;
    },
  };
}
