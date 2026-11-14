import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createJourneyStore } from '../../store/journey';
import { StatusChip } from './StatusChip';

function setup(phase: 'boot' | 'voyage' = 'voyage') {
  const store = createJourneyStore([0, 0.8], { phase, storage: null });
  render(<StatusChip store={store} />);
  return store;
}

describe('StatusChip', () => {
  it('is hidden while the boot panel is shown', () => {
    const store = setup('boot');
    expect(screen.queryByRole('button', { name: /sound/i })).toBeNull();
    act(() => {
      store.getState().begin(0, { silent: false, reduced: true });
    });
    expect(screen.getByRole('button', { name: /sound/i })).toBeVisible();
  });

  it('shows sound on and toggles mute, exposing the state with aria-pressed', () => {
    const store = setup();
    const sound = screen.getByRole('button', { name: /sound/i });
    expect(sound).toHaveTextContent('♪ on · M');
    expect(sound).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sound);
    expect(store.getState().muted).toBe(true);
    expect(sound).toHaveTextContent('♪ off · M');
    expect(sound).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles autoplay and follows the store', () => {
    const store = setup();
    const autoplay = screen.getByRole('button', { name: /autoplay/i });
    expect(autoplay).toHaveTextContent('▶ autoplay · Space');
    expect(autoplay).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(autoplay);
    expect(store.getState().autoplay).toBe(true);
    expect(autoplay).toHaveTextContent('❚❚ autoplay · Space');
    expect(autoplay).toHaveAttribute('aria-pressed', 'true');
  });
});
