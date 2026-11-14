import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FINALE } from '../../content/journey';
import type { Finale } from '../../content/schema';
import { createJourneyStore } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import { FinaleLayer } from './FinaleLayer';
import { finaleLayer } from './registry';

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderLayer(finale: Finale = FINALE) {
  const store = createJourneyStore([0, 0.8], { phase: 'voyage' });
  render(<FinaleLayer finale={finale} store={store} />);
  const show = (shown: boolean) => {
    act(() => {
      store.getState().setFinaleShown(shown);
    });
  };
  return { store, show };
}

describe('FinaleLayer', () => {
  it('is hidden from the accessibility tree until the finale is shown', () => {
    stubReducedMotion(false);
    const { show } = renderLayer();
    expect(screen.queryByRole('region', { name: FINALE.title })).toBeNull();
    show(true);
    expect(screen.getByRole('region', { name: FINALE.title })).toBeVisible();
    show(false);
    expect(screen.queryByRole('region', { name: FINALE.title })).toBeNull();
  });

  it('shows the caption, the fact line and the card', () => {
    stubReducedMotion(false);
    const { show } = renderLayer();
    show(true);
    expect(screen.getByText(FINALE.caption)).toBeVisible();
    expect(screen.getByText(FINALE.fact)).toBeVisible();
    expect(screen.getByText(FINALE.body)).toBeVisible();
  });

  it('links email in the same tab and GitHub and LinkedIn in a new one', () => {
    stubReducedMotion(false);
    const { show } = renderLayer();
    show(true);
    const email = screen.getByRole('link', { name: 'Email' });
    expect(email.getAttribute('href')).toMatch(/^mailto:/);
    expect(email).not.toHaveAttribute('target');
    for (const name of ['GitHub', 'LinkedIn']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('renders verified links only', () => {
    stubReducedMotion(false);
    const { show } = renderLayer({
      ...FINALE,
      links: [
        { label: 'GitHub', href: 'https://github.com/ahamed', verified: true },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/', verified: false },
      ],
    });
    show(true);
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull();
  });

  it('Back to Earth starts the rewind', () => {
    stubReducedMotion(false);
    const { store, show } = renderLayer();
    store.getState().goToEnd(0);
    show(true);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Earth' }));
    expect(store.getState().flight?.from).toBe(1);
  });

  it('Back to Earth jumps straight to the start under reduced motion', () => {
    stubReducedMotion(true);
    const { store, show } = renderLayer();
    store.getState().goToEnd(0);
    show(true);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Earth' }));
    expect(store.getState().flight).toBeNull();
    expect(store.getState().target).toBe(0);
  });

  it('registers its root for the camera rig, with a hidden bracket labelled Earth', () => {
    stubReducedMotion(false);
    renderLayer();
    expect(finaleLayer.element).not.toBeNull();
    expect(finaleLayer.element?.querySelector('[data-bracket]')?.textContent).toBe('Earth');
    expect(finaleLayer.element?.querySelector('[data-bracket]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
