import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { createJourneyStore } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Hud } from './Hud';

const route = buildRoute(STOPS);

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(phase: 'boot' | 'voyage') {
  stubReducedMotion(false);
  const store = createJourneyStore(route.closePoints, { phase, storage: null });
  render(<Hud store={store} stops={STOPS} closePoints={route.closePoints} />);
  return store;
}

describe('Hud', () => {
  it('is hidden while the boot panel is shown', () => {
    const store = setup('boot');
    expect(screen.queryByRole('navigation', { name: 'Voyage map' })).toBeNull();
    act(() => {
      store.getState().begin(0, { silent: false, reduced: true });
    });
    expect(screen.getByRole('navigation', { name: 'Voyage map' })).toBeVisible();
  });

  it('holds the telemetry, the map and the sound and autoplay controls', () => {
    setup('voyage');
    expect(screen.getByRole('region', { name: 'Mission telemetry' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Voyage map' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mute sound' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Autoplay' })).toBeVisible();
  });

  it('dims in the finale', () => {
    const store = setup('voyage');
    const root = document.querySelector('[data-hud]');
    expect(root).not.toHaveAttribute('data-dim');
    act(() => {
      store.getState().setFinaleShown(true);
    });
    expect(root).toHaveAttribute('data-dim');
  });
});
