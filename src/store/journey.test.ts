import { beforeEach, describe, expect, it } from 'vitest';
import { flightMs, FLY_BACK_MS } from '../journey/flyTo';
import { KEY_INTENSITY, THROTTLE_HOLD_MS } from '../journey/throttle';
import {
  activeThrottle,
  createJourneyStore,
  journeyRuntime,
  type KeyValueStorage,
} from './journey';

/** Two stops whose capture points are 0.001 and 0.8. */
const make = () => createJourneyStore([0.001, 0.8], { phase: 'voyage', storage: null });
type Store = ReturnType<typeof make>;

beforeEach(() => {
  journeyRuntime.position = 0.001;
});

describe('journey store', () => {
  it('starts with nothing open, nothing read and audio locked', () => {
    const s = make().getState();
    expect(s.openStopId).toBeNull();
    expect(s.readStops).toEqual([]);
    expect(s.orbit).toBe('none');
    expect(s.audioUnlocked).toBe(false);
  });

  describe('throttle', () => {
    it('holds a direction and intensity for a short window after each event', () => {
      const store = make();
      store.getState().throttle(1, 0.4, 1000);
      const s = store.getState();
      expect(activeThrottle(s, 1000 + THROTTLE_HOLD_MS - 1)).toBe(1);
      expect(s.intensity).toBe(0.4);
      expect(activeThrottle(s, 1000 + THROTTLE_HOLD_MS + 1)).toBe(0);
      store.getState().throttle(-1, 0.1, 2000);
      expect(activeThrottle(store.getState(), 2000)).toBe(-1);
    });

    it('keeps a held key active until it is released', () => {
      const store = make();
      store.getState().keyHold(1, true, 0);
      expect(activeThrottle(store.getState(), 5000)).toBe(1);
      expect(store.getState().intensity).toBe(KEY_INTENSITY);
      store.getState().keyHold(-1, false, 5000);
      expect(activeThrottle(store.getState(), 5000)).toBe(1);
      store.getState().keyHold(1, false, 5000);
      expect(activeThrottle(store.getState(), 5000)).toBe(0);
    });

    it('cancels a running flight', () => {
      const store = make();
      store.getState().goToEnd(0);
      store.getState().throttle(-1, 0.2, 10);
      expect(store.getState().flight).toBeNull();
    });
  });

  describe('jumps', () => {
    it('fly to the next and previous capture point from the current position', () => {
      const store = make();
      store.getState().goToStop(1, 100);
      expect(store.getState().flight).toEqual({
        from: 0.001,
        to: 0.8,
        startAt: 100,
        duration: flightMs(0.799),
      });
      journeyRuntime.position = 0.8;
      store.getState().goToStop(-1, 200);
      expect(store.getState().flight?.to).toBe(0.001);
    });

    it('count the next stop from a running flight’s destination', () => {
      const three = createJourneyStore([0.001, 0.3, 0.8], { phase: 'voyage', storage: null });
      three.getState().goToStop(1, 0);
      journeyRuntime.position = 0.1; // still on the way to 0.3
      three.getState().goToStop(1, 10);
      expect(three.getState().flight?.to).toBe(0.8);
      expect(three.getState().flight?.from).toBe(0.1);
    });

    it('fly to the start and the end', () => {
      const store = make();
      store.getState().goToEnd(0);
      expect(store.getState().flight?.to).toBe(1);
      store.getState().goToStart(0);
      expect(store.getState().flight?.to).toBe(0);
    });

    it('are instant flights under reduced motion', () => {
      const store = make();
      store.getState().goToStop(1, 100, true);
      expect(store.getState().flight?.duration).toBe(0);
      store.getState().flyToStop(1, 100, true);
      expect(store.getState().flight?.duration).toBe(0);
    });

    it('fly a map jump to a stop, longer for longer jumps, and ignore unknown stops', () => {
      const store = make();
      store.getState().flyToStop(1, 100, false);
      expect(store.getState().flight).toEqual({
        from: 0.001,
        to: 0.8,
        startAt: 100,
        duration: flightMs(0.799),
      });
      const before = store.getState().flight;
      store.getState().flyToStop(9, 100, false);
      expect(store.getState().flight).toBe(before);
    });

    it('rewind Back to Earth to the first stop and mark everything unread', () => {
      const store = make();
      store.getState().markRead('earth');
      journeyRuntime.position = 1;
      store.getState().flyBack(500, false);
      expect(store.getState().flight).toEqual({
        from: 1,
        to: 0.001,
        startAt: 500,
        duration: FLY_BACK_MS,
      });
      expect(store.getState().readStops).toEqual([]);
      store.getState().flyBack(600, true);
      expect(store.getState().flight?.duration).toBe(0);
    });

    it('end their flight', () => {
      const store = make();
      store.getState().goToEnd(0);
      store.getState().endFlight();
      expect(store.getState().flight).toBeNull();
    });
  });

  describe('orbit status', () => {
    it('marks stops read once and reports the orbit only on change', () => {
      const store = make();
      let changes = 0;
      store.subscribe(() => changes++);
      store.getState().markRead('moon');
      store.getState().markRead('moon');
      expect(store.getState().readStops).toEqual(['moon']);
      store.getState().setOrbit('lap', 'moon');
      store.getState().setOrbit('lap', 'moon');
      expect(store.getState().orbit).toBe('lap');
      expect(store.getState().capturedStopId).toBe('moon');
      expect(changes).toBe(2);
    });
  });

  it('sets the open stop and audio unlock', () => {
    const store = make();
    store.getState().setOpenStop('moon');
    store.getState().setAudioUnlocked();
    expect(store.getState().openStopId).toBe('moon');
    expect(store.getState().audioUnlocked).toBe(true);
  });

  it('records whether the finale is shown, only on change', () => {
    const store = make();
    expect(store.getState().finaleShown).toBe(false);
    let changes = 0;
    store.subscribe(() => changes++);
    store.getState().setFinaleShown(true);
    store.getState().setFinaleShown(true);
    expect(store.getState().finaleShown).toBe(true);
    expect(changes).toBe(1);
  });

  describe('phases', () => {
    const boot = () => createJourneyStore([0.001, 0.8]);

    it('starts in the boot phase and ignores every voyage input there', () => {
      const store = boot();
      expect(store.getState().phase).toBe('boot');
      store.getState().throttle(1, 1, 10);
      store.getState().keyHold(1, true, 10);
      store.getState().goToStop(1, 10);
      store.getState().goToEnd(10);
      store.getState().flyBack(10, false);
      expect(activeThrottle(store.getState(), 10)).toBe(0);
      expect(store.getState().flight).toBeNull();
    });

    it('begins with the intro, or straight in the voyage under reduced motion', () => {
      const store = boot();
      store.getState().begin(500, { silent: false, reduced: false });
      expect(store.getState().phase).toBe('intro');
      expect(store.getState().introStartAt).toBe(500);
      const reduced = boot();
      reduced.getState().begin(500, { silent: false, reduced: true });
      expect(reduced.getState().phase).toBe('voyage');
    });

    it('ends the intro on input and applies the input', () => {
      const store = boot();
      store.getState().begin(500, { silent: false, reduced: false });
      store.getState().goToStop(1, 600);
      expect(store.getState().phase).toBe('voyage');
      expect(store.getState().flight?.to).toBe(0.8);
    });

    it('ends the intro when the sweep finishes', () => {
      const store = boot();
      store.getState().begin(500, { silent: false, reduced: false });
      store.getState().endIntro();
      expect(store.getState().phase).toBe('voyage');
    });
  });

  describe('mute', () => {
    const memory = (
      initial: Record<string, string> = {},
    ): KeyValueStorage & {
      data: Record<string, string>;
    } => {
      const data = { ...initial };
      return {
        data,
        getItem: (k) => data[k] ?? null,
        setItem: (k, v) => {
          data[k] = v;
        },
      };
    };

    it('starts unmuted, or muted when an earlier visit muted', () => {
      expect(createJourneyStore([0], { storage: memory() }).getState().muted).toBe(false);
      const stored = memory({ 'voyage:muted': '1' });
      expect(createJourneyStore([0], { storage: stored }).getState().muted).toBe(true);
    });

    it('toggles and remembers the choice', () => {
      const storage = memory();
      const store = createJourneyStore([0], { storage });
      store.getState().toggleMute();
      expect(store.getState().muted).toBe(true);
      expect(storage.data['voyage:muted']).toBe('1');
      store.getState().toggleMute();
      expect(storage.data['voyage:muted']).toBe('0');
    });

    it('Begin silently starts muted and remembers it', () => {
      const storage = memory();
      const store = createJourneyStore([0], { storage });
      store.getState().begin(0, { silent: true, reduced: false });
      expect(store.getState().muted).toBe(true);
      expect(storage.data['voyage:muted']).toBe('1');
    });

    it('still works for the session when storage throws', () => {
      const broken: KeyValueStorage = {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
      };
      const store = createJourneyStore([0], { storage: broken });
      expect(store.getState().muted).toBe(false);
      store.getState().toggleMute();
      expect(store.getState().muted).toBe(true);
    });
  });

  describe('autoplay', () => {
    it('is off at the start and toggles', () => {
      const store = make();
      expect(store.getState().autoplay).toBe(false);
      store.getState().toggleAutoplay();
      expect(store.getState().autoplay).toBe(true);
      store.getState().toggleAutoplay();
      expect(store.getState().autoplay).toBe(false);
    });

    it('ignores scroll, arrows and touch, and asks for the hint instead', () => {
      const store = make();
      store.getState().toggleAutoplay();
      store.getState().throttle(1, 1, 40);
      store.getState().keyHold(-1, true, 50);
      expect(activeThrottle(store.getState(), 50)).toBe(0);
      expect(store.getState().autoplay).toBe(true);
      expect(store.getState().ignoredHintAt).toBe(50);
    });

    it('is turned off by every jump', () => {
      const jumps: ((s: Store) => void)[] = [
        (s) => {
          s.getState().goToStop(1, 1);
        },
        (s) => {
          s.getState().goToStart(1);
        },
        (s) => {
          s.getState().goToEnd(1);
        },
        (s) => {
          s.getState().flyToStop(1, 1, false);
        },
        (s) => {
          s.getState().flyBack(1, false);
        },
      ];
      for (const jump of jumps) {
        const store = make();
        store.getState().toggleAutoplay();
        jump(store);
        expect(store.getState().autoplay).toBe(false);
        expect(store.getState().flight).not.toBeNull();
      }
    });

    it('can only run in the voyage phase', () => {
      const store = createJourneyStore([0.001, 0.8]);
      store.getState().toggleAutoplay();
      expect(store.getState().autoplay).toBe(false);
    });
  });

  describe('moves', () => {
    it('counts manual moves, but not ignored autoplay input', () => {
      const store = make();
      store.getState().throttle(1, 0.1, 1);
      store.getState().keyHold(1, true, 1);
      store.getState().keyHold(1, false, 1);
      store.getState().goToStop(1, 1);
      store.getState().goToStart(1);
      store.getState().goToEnd(1);
      store.getState().flyToStop(0, 1, false);
      expect(store.getState().moves).toBe(6);
      store.getState().toggleAutoplay();
      store.getState().throttle(1, 0.1, 2);
      expect(store.getState().moves).toBe(6);
    });
  });
});
