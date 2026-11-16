import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeAudioContext } from '../test/fakeAudio';
import { droneParams } from './drone';
import { createAudioEngine, type AudioEngine } from './engine';

let engine: AudioEngine | undefined;
afterEach(() => engine?.dispose());

function setup() {
  const fake = createFakeAudioContext();
  const createContext = vi.fn(() => fake.ctx);
  engine = createAudioEngine({ createContext });
  return { ...fake, createContext, engine };
}

describe('audio engine', () => {
  it('creates no AudioContext and plays nothing before start', () => {
    const { createContext, engine, calls } = setup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(engine.isStarted()).toBe(false);
    expect(engine.blip()).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it('starts once: resumes the context and routes everything through a master gain', () => {
    const { createContext, engine, calls, ctx } = setup();
    engine.start();
    engine.start();
    expect(createContext).toHaveBeenCalledOnce();
    expect(engine.isStarted()).toBe(true);
    expect(calls.some((c) => c.method === 'resume')).toBe(true);
    const toDestination = calls.filter(
      (c) => c.method === 'connect' && c.args[0] === ctx.destination,
    );
    expect(toDestination).toHaveLength(1);
  });

  it('fades the drone in from silence to its level over about 4 s', () => {
    const { engine, calls } = setup();
    engine.start();
    const { gain, fadeIn } = droneParams();
    const ramp = calls.find((c) => c.method === 'gain.linear' && c.args[0] === gain);
    expect(ramp?.args[1]).toBeCloseTo(1 + fadeIn);
  });

  it('starts the drone and plasma sources', () => {
    const { engine, calls } = setup();
    engine.start();
    expect(calls.filter((c) => c.method === 'start').length).toBeGreaterThanOrEqual(5);
  });

  it('blips only after start and while not muted', () => {
    const { engine } = setup();
    engine.start();
    expect(engine.blip()).toBe(true);
    engine.setMuted(true);
    expect(engine.blip()).toBe(false);
    engine.setMuted(false);
    expect(engine.blip()).toBe(true);
  });

  it('hisses only after start and while not muted', () => {
    const { engine } = setup();
    expect(engine.hiss()).toBe(false);
    engine.start();
    expect(engine.hiss()).toBe(true);
    engine.setMuted(true);
    expect(engine.hiss()).toBe(false);
    engine.setMuted(false);
    expect(engine.hiss()).toBe(true);
  });

  it('ticks only after start, while not muted, and never for whitespace', () => {
    const { engine } = setup();
    expect(engine.tick('a', 0)).toBe(false);
    engine.start();
    expect(engine.tick('a', 100)).toBe(true);
    expect(engine.tick(' ', 200)).toBe(false);
    engine.setMuted(true);
    expect(engine.tick('b', 300)).toBe(false);
  });

  it('keeps ticks to about 30 a second when typing at 150 characters a second', () => {
    const { engine } = setup();
    engine.start();
    let played = 0;
    for (let i = 0; i < 150; i++) if (engine.tick('x', 1000 + (i * 1000) / 150)) played++;
    expect(played).toBeLessThanOrEqual(30);
    expect(played).toBeGreaterThan(20);
  });

  it('makes the hiss noise buffer once, at start, and reuses it', () => {
    const { engine, ctx } = setup();
    const createBuffer = vi.spyOn(ctx, 'createBuffer');
    engine.start();
    const afterStart = createBuffer.mock.calls.length;
    for (let i = 0; i < 3; i++) engine.hiss();
    expect(createBuffer.mock.calls.length).toBe(afterStart);
  });

  it('ramps the master gain on mute, without a click', () => {
    const { engine, calls } = setup();
    engine.start();
    engine.setMuted(true);
    const ramp = calls.filter((c) => c.method === 'gain.target').at(-1);
    expect(ramp?.args[0]).toBe(0);
    expect(ramp?.args[2]).toBeLessThanOrEqual(0.06);
  });

  it('starts silent when muted before start', () => {
    const { engine, calls } = setup();
    engine.setMuted(true);
    engine.start();
    expect(engine.blip()).toBe(false);
    expect(calls.some((c) => c.method === 'gain.set' && c.args[0] === 0)).toBe(true);
  });

  it('moves the plasma level only on a meaningful change', () => {
    const { engine, calls } = setup();
    engine.setPlasma(0.5);
    engine.start();
    const targets = () => calls.filter((c) => c.method === 'gain.target').length;
    const before = targets();
    engine.setPlasma(0.5);
    engine.setPlasma(0.502);
    expect(targets()).toBe(before);
    engine.setPlasma(0.6);
    expect(targets()).toBe(before + 1);
  });

  it('notifies listeners when started and closes the context on dispose', () => {
    const { engine, calls } = setup();
    const listener = vi.fn();
    engine.onStart(listener);
    engine.start();
    expect(listener).toHaveBeenCalledOnce();
    engine.dispose();
    expect(calls.some((c) => c.method === 'close')).toBe(true);
  });
});
