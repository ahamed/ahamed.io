import { describe, expect, it } from 'vitest';
import { createRolling } from './rolling';

describe('createRolling', () => {
  it('reports 0 before any frame', () => {
    const r = createRolling(5000);
    expect(r.fps()).toBe(0);
    expect(r.frameMs()).toBe(0);
  });

  it('averages frame times into FPS and frame ms', () => {
    const r = createRolling(5000);
    for (let i = 0; i < 10; i++) r.push(20);
    expect(r.fps()).toBeCloseTo(50);
    expect(r.frameMs()).toBeCloseTo(20);
  });

  it('only keeps the last window of time', () => {
    const r = createRolling(1000);
    for (let i = 0; i < 100; i++) r.push(50); // 5 s of 20 fps
    for (let i = 0; i < 60; i++) r.push(1000 / 60); // 1 s of 60 fps
    expect(r.fps()).toBeCloseTo(60, 0);
  });

  it('drops frames beyond its capacity without growing', () => {
    const r = createRolling(5000, 8);
    for (let i = 0; i < 100; i++) r.push(1);
    expect(r.fps()).toBeCloseTo(1000);
    expect(r.size()).toBe(8);
  });

  it('resets', () => {
    const r = createRolling(5000);
    r.push(16);
    r.reset();
    expect(r.fps()).toBe(0);
  });
});
