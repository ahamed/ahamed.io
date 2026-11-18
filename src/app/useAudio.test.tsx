import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { thrusterLink } from '../audio/thrusterLink';
import { typingLink } from '../audio/typingLink';
import { createJourneyStore } from '../store/journey';
import { useAudio } from './useAudio';

const hiss = vi.fn(() => true);
const tick = vi.fn(() => true);
vi.mock('../audio/engine', () => ({
  createAudioEngine: () => ({
    hiss,
    tick,
    setPlasma: vi.fn(),
    dispose: vi.fn(),
  }),
}));
vi.mock('../audio/wireAudio', () => ({ wireAudio: () => () => undefined }));

describe('useAudio', () => {
  it('points the thruster link at the engine’s hiss, and unhooks it on unmount', () => {
    const store = createJourneyStore([0, 0.5, 1]);
    const { unmount } = renderHook(() => {
      useAudio(store);
    });
    thrusterLink.fire();
    expect(hiss).toHaveBeenCalledOnce();
    unmount();
    thrusterLink.fire();
    expect(hiss).toHaveBeenCalledOnce();
  });

  it('points the typing link at the engine’s tick, and unhooks it on unmount', () => {
    const store = createJourneyStore([0, 0.5, 1]);
    const { unmount } = renderHook(() => {
      useAudio(store);
    });
    typingLink.reveal('a', 5);
    expect(tick).toHaveBeenCalledWith('a', 5);
    unmount();
    typingLink.reveal('b', 6);
    expect(tick).toHaveBeenCalledOnce();
  });
});
