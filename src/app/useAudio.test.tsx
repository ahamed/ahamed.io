import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { thrusterLink } from '../audio/thrusterLink';
import { createJourneyStore } from '../store/journey';
import { useAudio } from './useAudio';

const hiss = vi.fn(() => true);
vi.mock('../audio/engine', () => ({
  createAudioEngine: () => ({
    hiss,
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
});
