import { describe, expect, it } from 'vitest';
import { createJourneyStore, journeyRuntime, type KeyValueStorage } from './journey';

const make = () => createJourneyStore([0, 0.8], { phase: 'voyage', storage: null });

describe('journey store', () => {
  it('starts at Earth with nothing open and audio locked', () => {
    const s = make().getState();
    expect(s.target).toBe(0);
    expect(s.openStopId).toBeNull();
    expect(s.audioUnlocked).toBe(false);
  });

  it('nudges the target, clamps it and records input time', () => {
    const store = make();
    store.getState().nudge(0.3, 1000);
    expect(store.getState().target).toBeCloseTo(0.3);
    expect(store.getState().lastInputAt).toBe(1000);
    store.getState().nudge(5, 1100);
    expect(store.getState().target).toBe(1);
    store.getState().nudge(-5, 1200);
    expect(store.getState().target).toBe(0);
  });

  it('steps by a small share of the stop gap', () => {
    const store = make();
    store.getState().step(1, 0);
    const { target } = store.getState();
    expect(target).toBeGreaterThan(0);
    expect(target).toBeLessThan(0.1);
  });

  it('jumps to the next and previous stop', () => {
    const store = make();
    store.getState().goToStop(1, 0);
    expect(store.getState().target).toBe(0.8);
    store.getState().goToStop(-1, 0);
    expect(store.getState().target).toBe(0);
  });

  it('goes to the start and end', () => {
    const store = make();
    store.getState().goToEnd(0);
    expect(store.getState().target).toBe(1);
    store.getState().goToStart(0);
    expect(store.getState().target).toBe(0);
  });

  it('sets the open stop and audio unlock', () => {
    const store = make();
    store.getState().setOpenStop('moon');
    store.getState().setAudioUnlocked();
    expect(store.getState().openStopId).toBe('moon');
    expect(store.getState().audioUnlocked).toBe(true);
  });

  it('can be snapped without counting as input', () => {
    const store = make();
    store.getState().nudge(0.75, 500);
    store.getState().snapTo(0.8);
    expect(store.getState().target).toBe(0.8);
    expect(store.getState().lastInputAt).toBe(500);
  });

  it('starts a Back to Earth rewind from the current target', () => {
    const store = make();
    store.getState().goToEnd(100);
    store.getState().flyBack(500, false);
    expect(store.getState().flight).toEqual({ from: 1, startAt: 500 });
    expect(store.getState().target).toBe(1);
  });

  it('jumps straight to the start under reduced motion', () => {
    const store = make();
    store.getState().goToEnd(100);
    journeyRuntime.position = 1;
    store.getState().flyBack(500, true);
    expect(store.getState().flight).toBeNull();
    expect(store.getState().target).toBe(0);
    expect(journeyRuntime.position).toBe(0);
  });

  it('cancels the rewind on any input', () => {
    const inputs = [
      (s: ReturnType<typeof make>) => {
        s.getState().nudge(-0.01, 600);
      },
      (s: ReturnType<typeof make>) => {
        s.getState().step(1, 600);
      },
      (s: ReturnType<typeof make>) => {
        s.getState().goToStop(-1, 600);
      },
      (s: ReturnType<typeof make>) => {
        s.getState().goToStart(600);
      },
      (s: ReturnType<typeof make>) => {
        s.getState().goToEnd(600);
      },
    ];
    for (const input of inputs) {
      const store = make();
      store.getState().goToEnd(100);
      store.getState().flyBack(500, false);
      input(store);
      expect(store.getState().flight).toBeNull();
    }
  });

  it('flies the rewind by setting the target without counting as input', () => {
    const store = make();
    store.getState().goToEnd(100);
    store.getState().flyBack(500, false);
    store.getState().flyTo(0.4, 900);
    expect(store.getState().target).toBe(0.4);
    expect(store.getState().lastInputAt).toBe(900);
    expect(store.getState().flight).not.toBeNull();
    store.getState().endFlight();
    expect(store.getState().flight).toBeNull();
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
    const boot = () => createJourneyStore([0, 0.8]);

    it('starts in the boot phase and ignores every voyage input there', () => {
      const store = boot();
      expect(store.getState().phase).toBe('boot');
      store.getState().nudge(0.3, 10);
      store.getState().step(1, 10);
      store.getState().goToStop(1, 10);
      store.getState().goToEnd(10);
      store.getState().flyBack(10, false);
      expect(store.getState().target).toBe(0);
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
      expect(store.getState().target).toBe(0.8);
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

    it('is turned off by any voyage input and by Back to Earth', () => {
      const inputs: ((s: ReturnType<typeof make>) => void)[] = [
        (s) => {
          s.getState().nudge(0.01, 1);
        },
        (s) => {
          s.getState().step(1, 1);
        },
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
          s.getState().flyBack(1, false);
        },
      ];
      for (const input of inputs) {
        const store = make();
        store.getState().toggleAutoplay();
        input(store);
        expect(store.getState().autoplay).toBe(false);
      }
    });

    it('flies to the next stop for autoplay without turning it off', () => {
      const store = make();
      store.getState().toggleAutoplay();
      store.getState().autoplayTo(0.8, 5);
      expect(store.getState().target).toBe(0.8);
      expect(store.getState().autoplay).toBe(true);
      expect(store.getState().lastInputAt).toBe(5);
    });

    it('can only run in the voyage phase', () => {
      const store = createJourneyStore([0, 0.8]);
      store.getState().toggleAutoplay();
      expect(store.getState().autoplay).toBe(false);
    });
  });
});
