import { describe, expect, it } from 'vitest';
import { createJourneyStore } from './journey';

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
});
