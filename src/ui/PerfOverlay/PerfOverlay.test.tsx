import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSnapshot } from '../../perf/snapshot';
import PerfOverlay from './PerfOverlay';

afterEach(() => {
  vi.useRealTimers();
  delete window.__voyagePerf;
});

describe('PerfOverlay', () => {
  it('shows the live snapshot, refreshed four times a second', () => {
    vi.useFakeTimers();
    render(<PerfOverlay />);
    const panel = screen.getByRole('region', { name: 'Performance' });
    expect(panel).toHaveTextContent('FPS–');
    const snapshot = createSnapshot('high');
    snapshot.fps = 60;
    window.__voyagePerf = snapshot;
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(panel).toHaveTextContent('FPS60.0');
    expect(panel).toHaveTextContent('Tierhigh');
  });

  it('never takes focus', () => {
    render(<PerfOverlay />);
    const panel = screen.getByRole('region', { name: 'Performance' });
    expect(panel.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
  });
});
