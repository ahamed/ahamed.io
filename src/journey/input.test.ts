import { describe, expect, it } from 'vitest';
import { keyToCommand, pixelsToProgress, wheelToPixels } from './input';

describe('wheelToPixels', () => {
  it('passes pixel deltas through', () => {
    expect(wheelToPixels({ deltaY: 100, deltaMode: 0, ctrlKey: false }, 800)).toBe(100);
  });
  it('scales line and page deltas', () => {
    expect(wheelToPixels({ deltaY: 3, deltaMode: 1, ctrlKey: false }, 800)).toBe(48);
    expect(wheelToPixels({ deltaY: 1, deltaMode: 2, ctrlKey: false }, 800)).toBe(800);
  });
  it('ignores ctrl+wheel so pinch-zoom still works', () => {
    expect(wheelToPixels({ deltaY: 100, deltaMode: 0, ctrlKey: true }, 800)).toBe(0);
  });
});

describe('pixelsToProgress', () => {
  it('maps 1.5 viewport heights per stop to the whole route', () => {
    expect(pixelsToProgress(800 * 1.5 * 2, 800, 2)).toBeCloseTo(1);
  });
});

describe('keyToCommand', () => {
  it('maps arrows to steps', () => {
    expect(keyToCommand('ArrowDown')).toEqual({ type: 'step', dir: 1 });
    expect(keyToCommand('ArrowUp')).toEqual({ type: 'step', dir: -1 });
  });
  it('maps PageDown/PageUp to stop jumps', () => {
    expect(keyToCommand('PageDown')).toEqual({ type: 'stop', dir: 1 });
    expect(keyToCommand('PageUp')).toEqual({ type: 'stop', dir: -1 });
  });
  it('maps Home/End to the route ends', () => {
    expect(keyToCommand('Home')).toEqual({ type: 'start' });
    expect(keyToCommand('End')).toEqual({ type: 'end' });
  });
  it('maps M to mute and Space to autoplay', () => {
    expect(keyToCommand('m')).toEqual({ type: 'mute' });
    expect(keyToCommand('M')).toEqual({ type: 'mute' });
    expect(keyToCommand(' ')).toEqual({ type: 'autoplay' });
  });
  it('ignores other keys', () => {
    expect(keyToCommand('a')).toBeNull();
    expect(keyToCommand('Enter')).toBeNull();
  });
});
