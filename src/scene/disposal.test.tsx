import type { ReactElement } from 'react';
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute } from '../journey/route';
import { undisposedAfterUnmount } from '../test/disposal';
import { stubReducedMotion } from '../test/reducedMotion';
import { AsteroidBelt } from './bodies/AsteroidBelt';
import { asteroidBelt, KUIPER_COLOR, kuiperBelt } from './bodies/beltPresets';
import { Bodies } from './bodies/Bodies';
import { DeepSky } from './space/DeepSky';
import { Heliopause } from './space/Heliopause';
import { Meteors } from './space/Meteors';
import { PaleBlueDot } from './space/PaleBlueDot';
import { Sky } from './space/Sky';
import { SpeedDust } from './space/SpeedDust';
import { Stars } from './space/Stars';
import { Sun } from './space/Sun';
import { Voyager } from './voyager/Voyager';

// KTX2 maps come from a shared loader cache that outlives any one component, so they are
// excluded below; everything a component builds itself must be disposed.
const loaded = vi.hoisted(() => new Set<unknown>());
vi.mock('./ktx2', async () => {
  const { Texture: T } = await import('three');
  const cache = new Map<string, InstanceType<typeof T>>();
  return {
    useKtx2: (names: string[]) =>
      names.map((n) => {
        const texture = cache.get(n) ?? new T();
        cache.set(n, texture);
        loaded.add(texture);
        return texture;
      }),
    clearKtx2: () => undefined,
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const ROUTE = buildRoute(STOPS);

const CASES: [string, () => ReactElement][] = [
  ['Bodies (every planet, moon, rock and comet)', () => <Bodies route={ROUTE} />],
  ['AsteroidBelt', () => <AsteroidBelt options={asteroidBelt(ROUTE)} />],
  [
    'Kuiper belt',
    () => <AsteroidBelt options={kuiperBelt(ROUTE)} color={KUIPER_COLOR} name="kuiper-belt" />,
  ],
  ['Heliopause', () => <Heliopause route={ROUTE} />],
  ['DeepSky', () => <DeepSky route={ROUTE} />],
  ['SpeedDust', () => <SpeedDust />],
  ['Stars', () => <Stars />],
  ['Sun', () => <Sun />],
  ['Sky', () => <Sky />],
  ['Meteors', () => <Meteors />],
  ['PaleBlueDot', () => <PaleBlueDot route={ROUTE} />],
  ['Voyager', () => <Voyager />],
];

describe('GPU resources are disposed on unmount', () => {
  for (const [name, element] of CASES) {
    it(name, async () => {
      stubReducedMotion(false);
      const { held, left } = await undisposedAfterUnmount(
        element(),
        (r) => r instanceof Texture && loaded.has(r),
      );
      expect(held).toBeGreaterThan(0);
      expect(left).toEqual([]);
    });
  }
});
