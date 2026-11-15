import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { createJourneyStore } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import { ProgressMap } from './ProgressMap';

const route = buildRoute(STOPS);

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup() {
  stubReducedMotion(false);
  const store = createJourneyStore(route.closePoints, { phase: 'voyage', storage: null });
  render(<ProgressMap stops={STOPS} closePoints={route.closePoints} store={store} />);
  return store;
}

const title = (id: string) => STOPS.find((s) => s.id === id)?.title ?? '';

describe('ProgressMap', () => {
  it('is a voyage map with one button per stop, named by its card title', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Voyage map' });
    expect(nav).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(STOPS.length);
    expect(screen.getByRole('button', { name: title('saturn') })).toBeVisible();
  });

  it('places each dot at its stop on the route and marks planets', () => {
    setup();
    const saturn = screen.getByRole('button', { name: title('saturn') });
    const at = saturn.parentElement?.style.getPropertyValue('--at');
    expect(Number(at)).toBeCloseTo(route.closePoints[14] ?? NaN, 3);
    expect(saturn).toHaveAttribute('data-planet');
    expect(screen.getByRole('button', { name: title('titan') })).not.toHaveAttribute('data-planet');
  });

  it('flies to a stop when its dot is clicked', () => {
    const store = setup();
    fireEvent.click(screen.getByRole('button', { name: title('saturn') }));
    expect(store.getState().flight?.to).toBe(route.closePoints[14]);
  });

  it('moves focus with the left and right arrows without moving the voyage', () => {
    const store = setup();
    const earth = screen.getByRole('button', { name: title('earth') });
    earth.focus();
    fireEvent.keyDown(earth, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: title('moon') })).toHaveFocus();
    fireEvent.keyDown(document.activeElement ?? earth, { key: 'ArrowLeft' });
    expect(earth).toHaveFocus();
    expect(store.getState().target).toBe(0);
    expect(store.getState().flight).toBeNull();
  });
});
