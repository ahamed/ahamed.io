import { describe, expect, it } from 'vitest';
import { createJourneyStore, journeyRuntime } from './journey';

const make = () => createJourneyStore([0, 0.8]);

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
});
