import ReactThreeTestRenderer from '@react-three/test-renderer';
import { createRef } from 'react';
import { Group, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { SpaceEnvironment } from './SpaceEnvironment';

vi.mock('../ktx2', () => ({
  useKtx2: (names: string[]) => names.map(() => new Texture()),
  clearKtx2: () => undefined,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpaceEnvironment', () => {
  it('groups the sky, stars and Sun under one ref-able group', async () => {
    stubReducedMotion(false);
    const ref = createRef<Group>();
    const renderer = await ReactThreeTestRenderer.create(<SpaceEnvironment ref={ref} />);
    expect(ref.current).toBeInstanceOf(Group);
    for (const name of ['sky', 'stars', 'sun']) {
      expect(ref.current?.getObjectByName(name), name).toBeDefined();
    }
    await renderer.unmount();
  });
});
