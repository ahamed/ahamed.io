import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../content/journey';

const webgl = vi.hoisted(() => ({ supported: false }));
vi.mock('../scene/webgl', () => ({ canUseWebGL: () => webgl.supported }));
vi.mock('../scene/Voyage', () => ({ default: () => <div data-testid="voyage" /> }));
vi.mock('../scene/voyager/Inspect', () => ({ default: () => <div data-testid="inspect" /> }));
vi.mock('../ui/PerfOverlay/PerfOverlay', () => ({ default: () => <div data-testid="perf" /> }));

const { App } = await import('./App');

beforeEach(() => {
  webgl.supported = false;
  window.history.replaceState(null, '', '/');
});

describe('App shell', () => {
  it('renders one main landmark containing the site owner heading', () => {
    webgl.supported = true;
    render(<App />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Sajeeb Ahamed' })).toHaveClass(
      'visually-hidden',
    );
  });

  it('shows Text mode, with a note, when WebGL is unavailable', () => {
    render(<App />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByText(/needs WebGL/)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(STOPS.length - 1);
    expect(screen.queryByTestId('voyage')).toBeNull();
  });

  it('shows Text mode instead of the voyage for ?text', () => {
    webgl.supported = true;
    window.history.replaceState(null, '', '/?text');
    render(<App />);
    expect(screen.getByRole('link', { name: 'Back to the voyage' })).toBeInTheDocument();
    expect(screen.queryByTestId('voyage')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Mission boot' })).toBeNull();
    expect(document.querySelectorAll('[data-stop]')).toHaveLength(0);
  });

  it('mounts the voyage, one dialog per stop and the boot panel when WebGL is available', async () => {
    webgl.supported = true;
    render(<App />);
    expect(await screen.findByTestId('voyage')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-stop]')).toHaveLength(STOPS.length);
    expect(screen.getByRole('dialog', { name: 'Mission boot' })).toBeInTheDocument();
  });

  it('keeps every card readable in the voyage, behind a skip link that comes first', async () => {
    webgl.supported = true;
    render(<App />);
    await screen.findByTestId('voyage');
    const skip = screen.getByRole('link', { name: 'Skip to text version' });
    const focusable = document.querySelectorAll('a[href], button');
    expect(focusable[0]).toBe(skip);
    const hidden = document.getElementById('text-version');
    expect(hidden?.closest('.visually-hidden')).not.toBeNull();
    for (const stop of STOPS) {
      expect(screen.getAllByRole('heading', { name: stop.title }).length).toBeGreaterThan(0);
    }
  });

  it('shows the dev-only inspector instead of the voyage with ?inspect', async () => {
    webgl.supported = true;
    window.history.replaceState(null, '', '/?inspect');
    render(<App />);
    expect(await screen.findByTestId('inspect')).toBeInTheDocument();
    expect(screen.queryByTestId('voyage')).toBeNull();
    expect(document.querySelectorAll('[data-stop]')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Sajeeb Ahamed' })).toBeInTheDocument();
  });

  it('shows the performance overlay with ?perf, before the dialogs', async () => {
    webgl.supported = true;
    window.history.replaceState(null, '', '/?perf');
    render(<App />);
    const perf = await screen.findByTestId('perf');
    const dialog = document.querySelector('[data-stop]');
    expect(dialog).not.toBeNull();
    expect(
      perf.compareDocumentPosition(dialog as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('does not load the performance overlay without ?perf', async () => {
    webgl.supported = true;
    render(<App />);
    await screen.findByTestId('voyage');
    expect(screen.queryByTestId('perf')).toBeNull();
  });
});
