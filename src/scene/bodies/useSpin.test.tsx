import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useRef } from 'react';
import { type Group, Quaternion, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Spin } from './spin';
import { useSpin } from './useSpin';

const SPIN: Spin = { axis: [0, 0.6, 0.8], period: 40 };

function Spinner({ spin }: { spin: Spin }) {
  const ref = useRef<Group>(null);
  useSpin(ref, spin);
  return <group name="spinner" ref={ref} />;
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function spun(reduced: boolean, frames: number, dt: number) {
  stubReducedMotion(reduced);
  const renderer = await ReactThreeTestRenderer.create(<Spinner spin={SPIN} />);
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(frames, dt);
  });
  const q = (renderer.scene.instance.getObjectByName('spinner') as Group).quaternion.clone();
  await renderer.unmount();
  return q;
}

describe('useSpin', () => {
  it('turns the object about its spin axis by the elapsed angle', async () => {
    const q = await spun(false, 50, 0.1); // 5 s of a 40 s turn: 45°
    const expected = new Quaternion().setFromAxisAngle(new Vector3(0, 0.6, 0.8), Math.PI / 4);
    expect(q.angleTo(expected)).toBeLessThan(1e-6);
  });

  it('holds the resting orientation under reduced motion', async () => {
    const q = await spun(true, 50, 0.1);
    expect(q.angleTo(new Quaternion())).toBe(0);
  });

  it('clamps long frames so a stalled tab does not jump the spin', async () => {
    const q = await spun(false, 1, 5); // one 5 s hitch counts as 0.1 s
    const expected = new Quaternion().setFromAxisAngle(
      new Vector3(0, 0.6, 0.8),
      (Math.PI * 2 * 0.1) / 40,
    );
    expect(q.angleTo(expected)).toBeLessThan(1e-6);
  });
});
