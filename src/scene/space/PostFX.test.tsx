import ReactThreeTestRenderer from '@react-three/test-renderer';
import { ToneMappingMode } from 'postprocessing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import type { Tier } from '../quality/profile';
import { perfRoots } from '../perf/roots';
import { PostFX } from './PostFX';

/** Effects in the order the composer received them, with their props. */
const effects: { name: string; props: Record<string, unknown> }[] = [];
let composerProps: Record<string, unknown> = {};

vi.mock('@react-three/postprocessing', () => {
  const effect = (name: string) => (props: Record<string, unknown>) => {
    effects.push({ name, props });
    return null;
  };
  return {
    EffectComposer: ({ children, ...props }: { children: ReactNode }) => {
      composerProps = props;
      return <>{children}</>;
    },
    Bloom: effect('Bloom'),
    Vignette: effect('Vignette'),
    Noise: effect('Noise'),
    ToneMapping: effect('ToneMapping'),
  };
});

beforeEach(() => {
  effects.length = 0;
  composerProps = {};
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function render(tier: Tier = 'high') {
  const renderer = await ReactThreeTestRenderer.create(<PostFX tier={tier} />);
  const names = effects.map((e) => e.name);
  const props = (name: string) => effects.find((e) => e.name === name)?.props ?? {};
  return { renderer, names, props };
}

describe('PostFX', () => {
  it('chains bloom, vignette, grain and ACES tone mapping last, multisampled', async () => {
    stubReducedMotion(false);
    const { renderer, names, props } = await render();
    expect(names).toEqual(['Bloom', 'Vignette', 'Noise', 'ToneMapping']);
    expect(props('ToneMapping').mode).toBe(ToneMappingMode.ACES_FILMIC);
    expect(composerProps.multisampling).toBe(2);
    await renderer.unmount();
  });

  it('blooms only the brightest pixels, subtly', async () => {
    stubReducedMotion(false);
    const { renderer, props } = await render();
    const bloom = props('Bloom');
    expect(bloom.mipmapBlur).toBe(true);
    expect(bloom.luminanceThreshold).toBeGreaterThanOrEqual(0.85);
    expect(bloom.intensity).toBeLessThanOrEqual(1);
    expect(props('Noise').opacity).toBeLessThanOrEqual(0.06);
    await renderer.unmount();
  });

  it('drops the animated grain under reduced motion', async () => {
    stubReducedMotion(true);
    const { renderer, names } = await render();
    expect(names).toEqual(['Bloom', 'Vignette', 'ToneMapping']);
    await renderer.unmount();
  });

  it('halves the bloom resolution and uses 2× multisampling at medium', async () => {
    stubReducedMotion(false);
    const { renderer, names, props } = await render('medium');
    expect(names).toEqual(['Bloom', 'Vignette', 'Noise', 'ToneMapping']);
    expect(props('Bloom').resolutionScale).toBe(0.5);
    expect(composerProps.multisampling).toBe(2);
    await renderer.unmount();
  });

  it('keeps only the vignette and tone mapping, without multisampling, at low', async () => {
    stubReducedMotion(false);
    const { renderer, names } = await render('low');
    expect(names).toEqual(['Vignette', 'ToneMapping']);
    expect(composerProps.multisampling).toBe(0);
    await renderer.unmount();
  });

  it('registers its composer so ?perf can count the post-processing render targets', async () => {
    const { renderer } = await render();
    const ref = composerProps.ref as (composer: object | null) => (() => void) | undefined;
    const composer = {};
    const cleanup = ref(composer);
    expect(perfRoots.has(composer)).toBe(true);
    cleanup?.();
    expect(perfRoots.has(composer)).toBe(false);
    await renderer.unmount();
  });
});
