import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../content/journey';

const webgl = vi.hoisted(() => ({ supported: false }));
vi.mock('../scene/webgl', () => ({ canUseWebGL: () => webgl.supported }));
vi.mock('../scene/Voyage', () => ({ default: () => <div data-testid="voyage" /> }));
vi.mock('../scene/voyager/Inspect', () => ({ default: () => <div data-testid="inspect" /> }));

const { App } = await import('./App');

beforeEach(() => {
  webgl.supported = false;
  window.history.replaceState(null, '', '/');
});

describe('App shell', () => {
  it('renders one main landmark containing the site owner heading', () => {
    render(<App />);
    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Sajeeb Ahamed' })).toBeInTheDocument();
  });

  it('keeps the heading visually hidden but accessible', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('visually-hidden');
  });

  it('shows a fallback message when WebGL is unavailable', () => {
    render(<App />);
    expect(screen.getByText(/3D view not supported/i)).toBeInTheDocument();
    expect(screen.queryByTestId('voyage')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Mission boot' })).toBeNull();
  });

  it('mounts the voyage and one dialog per stop when WebGL is available', async () => {
    webgl.supported = true;
    render(<App />);
    expect(await screen.findByTestId('voyage')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-stop]')).toHaveLength(STOPS.length);
    expect(screen.getByRole('dialog', { name: 'Mission boot' })).toBeInTheDocument();
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
});
