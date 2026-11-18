import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { STOPS } from '../content/journey';
import { FLY_BACK_MS, flightMs } from '../journey/flyTo';
import { buildRoute, type Vec3 } from '../journey/route';
import { neighbourTarget } from '../journey/stops';
import { inputActive, KEY_INTENSITY } from '../journey/throttle';
import { createVoyageContext, type Flight } from '../journey/voyage';

/** What Voyager is doing at a stop, for the dialog and E2E: mirrors the voyage step's mode. */
export type Orbit = 'none' | 'lap' | 'drift' | 'hold' | 'coast';

export interface JourneyState {
  /** `performance.now()` of the last wheel/touch throttle event. */
  lastInputAt: number;
  /** Direction of the last wheel/touch throttle event. */
  throttleDir: -1 | 1;
  /** Intensity (0..1) of the last throttle input; speeds up the orbit clock. */
  intensity: number;
  /** A held ↑/↓ key's direction, or 0. Holds the throttle until released. */
  heldKey: -1 | 0 | 1;
  openStopId: string | null;
  audioUnlocked: boolean;
  /** A running jump (map, PageUp/PageDown, Home/End, Back to Earth), or null. */
  flight: Flight | null;
  /** Whether the finale's caption and contact card are showing. */
  finaleShown: boolean;
  /** Wheel or touch throttle; ignored (with a hint) during autoplay. */
  throttle: (dir: -1 | 1, intensity: number, now: number) => void;
  /** ↑/↓ pressed or released; ignored (with a hint) during autoplay. */
  keyHold: (dir: -1 | 1, down: boolean, now: number) => void;
  /** Jumps to the next or previous stop's capture point. */
  goToStop: (dir: 1 | -1, now: number, reduced?: boolean) => void;
  goToStart: (now: number, reduced?: boolean) => void;
  goToEnd: (now: number, reduced?: boolean) => void;
  setOpenStop: (id: string | null) => void;
  setAudioUnlocked: () => void;
  /** Rewinds to the first stop and marks every stop unread; instant under reduced motion. */
  flyBack: (now: number, reduced: boolean) => void;
  endFlight: () => void;
  /** Map jump to stop `index`. Instant under reduced motion. */
  flyToStop: (index: number, now: number, reduced: boolean) => void;
  /** Manual moves so far (not ignored autoplay input); the controls hint reads it. */
  moves: number;
  setFinaleShown: (shown: boolean) => void;
  /** Boot panel, then the intro sweep, then the voyage. Voyage input is ignored while booting. */
  phase: Phase;
  /** `performance.now()` when the intro sweep started. */
  introStartAt: number;
  /** Leaves the boot panel; `silent` starts muted, `reduced` skips the intro sweep. */
  begin: (now: number, options: { silent: boolean; reduced: boolean }) => void;
  endIntro: () => void;
  /** Whether all sound is muted; remembered across visits. */
  muted: boolean;
  toggleMute: () => void;
  /** Whether autoplay is cruising. Only Space, its button or a jump turns it off. */
  autoplay: boolean;
  toggleAutoplay: () => void;
  /** Stops whose lap has finished this session. */
  readStops: readonly string[];
  markRead: (id: string) => void;
  /** What Voyager is doing at `capturedStopId`. */
  orbit: Orbit;
  capturedStopId: string | null;
  setOrbit: (orbit: Orbit, id: string | null) => void;
  /** `performance.now()` of the last input ignored during autoplay, for the hint. */
  ignoredHintAt: number;
}

export type Phase = 'boot' | 'intro' | 'voyage';

/** The part of `Storage` the store needs, so tests can pass a fake. */
export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface Options {
  phase?: Phase;
  storage?: KeyValueStorage | null;
}

const MUTED_KEY = 'voyage:muted';

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readMuted(storage: KeyValueStorage | null): boolean {
  try {
    return storage?.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(storage: KeyValueStorage | null, muted: boolean): void {
  try {
    storage?.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked: mute still works for this session.
  }
}

export type { Flight };

/** The throttle direction in force at `now`: a held key wins, then recent wheel or touch input. */
export function activeThrottle(
  s: Pick<JourneyState, 'heldKey' | 'throttleDir' | 'lastInputAt'>,
  now: number,
): -1 | 0 | 1 {
  if (s.heldKey !== 0) return s.heldKey;
  return inputActive(now, s.lastInputAt) ? s.throttleDir : 0;
}

/** `points` are the stops' capture points, in route order. */
export function createJourneyStore(
  points: readonly number[],
  { phase = 'boot', storage = browserStorage() }: Options = {},
) {
  return createStore<JourneyState>()((set, get) => {
    /** Gate for voyage input: false while booting; ends the intro sweep at once otherwise. */
    const accept = (): boolean => {
      const current = get().phase;
      if (current === 'boot') return false;
      if (current === 'intro') set({ phase: 'voyage' });
      return true;
    };
    /** Travel input during autoplay is ignored and shows the hint. */
    const ignored = (now: number): boolean => {
      if (!get().autoplay) return false;
      set({ ignoredHintAt: now });
      return true;
    };
    /** Starts a jump: manual input that stops autoplay and replaces any flight. */
    const jump = (to: number, now: number, duration: number) => {
      const from = journeyRuntime.position;
      set({
        flight: { from, to, startAt: now, duration },
        autoplay: false,
        heldKey: 0,
        lastInputAt: -Infinity,
        moves: get().moves + 1,
      });
    };

    return {
      lastInputAt: -Infinity,
      throttleDir: 1,
      intensity: 0,
      heldKey: 0,
      openStopId: null,
      audioUnlocked: false,
      flight: null,
      finaleShown: false,
      throttle: (dir, intensity, now) => {
        if (!accept() || ignored(now)) return;
        set({
          throttleDir: dir,
          intensity,
          lastInputAt: now,
          flight: null,
          moves: get().moves + 1,
        });
      },
      keyHold: (dir, down, now) => {
        if (!accept() || ignored(now)) return;
        if (down) {
          set({
            heldKey: dir,
            throttleDir: dir,
            intensity: KEY_INTENSITY,
            flight: null,
            moves: get().moves + 1,
          });
        } else if (get().heldKey === dir) {
          set({ heldKey: 0, lastInputAt: -Infinity });
        }
      },
      goToStop: (dir, now, reduced = false) => {
        if (!accept()) return;
        const from = journeyRuntime.position;
        // Repeated presses step on from where the running jump is heading.
        const to = neighbourTarget(get().flight?.to ?? from, points, dir);
        jump(to, now, reduced ? 0 : flightMs(to - from));
      },
      goToStart: (now, reduced = false) => {
        if (!accept()) return;
        jump(0, now, reduced ? 0 : flightMs(journeyRuntime.position));
      },
      goToEnd: (now, reduced = false) => {
        if (!accept()) return;
        jump(1, now, reduced ? 0 : flightMs(1 - journeyRuntime.position));
      },
      setOpenStop: (id) => {
        if (get().openStopId !== id) set({ openStopId: id });
      },
      setAudioUnlocked: () => {
        set({ audioUnlocked: true });
      },
      flyBack: (now, reduced) => {
        if (!accept()) return;
        jump(points[0] ?? 0, now, reduced ? 0 : FLY_BACK_MS);
        set({ readStops: [] });
      },
      flyToStop: (index, now, reduced) => {
        const to = points[index];
        if (to === undefined || !accept()) return;
        jump(to, now, reduced ? 0 : flightMs(to - journeyRuntime.position));
      },
      moves: 0,
      endFlight: () => {
        if (get().flight) set({ flight: null });
      },
      setFinaleShown: (shown) => {
        if (get().finaleShown !== shown) set({ finaleShown: shown });
      },
      phase,
      introStartAt: 0,
      begin: (now, { silent, reduced }) => {
        if (get().phase !== 'boot') return;
        if (silent) writeMuted(storage, true);
        set({
          phase: reduced ? 'voyage' : 'intro',
          introStartAt: now,
          muted: silent || get().muted,
        });
      },
      endIntro: () => {
        if (get().phase === 'intro') set({ phase: 'voyage' });
      },
      muted: readMuted(storage),
      toggleMute: () => {
        const muted = !get().muted;
        writeMuted(storage, muted);
        set({ muted });
      },
      autoplay: false,
      toggleAutoplay: () => {
        if (get().phase !== 'voyage' && !get().autoplay) return;
        set({ autoplay: !get().autoplay, heldKey: 0, lastInputAt: -Infinity });
      },
      readStops: [],
      markRead: (id) => {
        const read = get().readStops;
        if (!read.includes(id)) set({ readStops: [...read, id] });
      },
      orbit: 'none',
      capturedStopId: null,
      setOrbit: (orbit, id) => {
        const s = get();
        if (s.orbit !== orbit || s.capturedStopId !== id) set({ orbit, capturedStopId: id });
      },
      ignoredHintAt: 0,
    };
  });
}

export type JourneyStore = ReturnType<typeof createJourneyStore>;

export const ROUTE = buildRoute(STOPS);

/** The voyage step's per-stop constants (capture points, lap lengths, speeds). */
export const VOYAGE = createVoyageContext(ROUTE, STOPS);

export const journeyStore = createJourneyStore(VOYAGE.capture);

export const useJourney = <T>(selector: (state: JourneyState) => T): T =>
  useStore(journeyStore, selector);

/** Per-frame values mutated in the render loop (never React state). */
export const journeyRuntime = {
  /** Eased progress shown on screen (0..1). */
  position: 0,
  /** How fast `position` is moving, in progress per second (0 at rest). */
  speed: 0,
  /** Voyager's world position: on the route, or on a lap. */
  ship: [0, 0, 0] as Vec3,
  /** Voyager's unit direction of travel. */
  heading: [0, 0, -1] as Vec3,
  /** Index of the stop Voyager is captured at (lap, drift or hold), or -1. */
  captured: -1,
  /** Orbit clock (ms) of the current capture; drives the typewriter. */
  orbitClock: 0,
  /** 0 in the chase view, 1 in the orbit view; eased between. */
  captureWeight: 0,
};
