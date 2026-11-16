import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { journeyRuntime } from '../../store/journey';
import { typingLink } from '../../audio/typingLink';
import { dialogElements } from './registry';
import { TerminalDialog } from './TerminalDialog';

/** Sets the orbit clock and lets the reveal's animation frame read it. */
function clock(ms: number) {
  journeyRuntime.orbitClock = ms;
  act(() => {
    vi.advanceTimersByTime(50);
  });
}

const earth = STOPS[0];
const moon = STOPS[1];
if (!earth || !moon) throw new Error('fixture stops missing');

beforeEach(() => {
  vi.useFakeTimers();
  journeyRuntime.orbitClock = 0;
});
afterEach(() => {
  vi.useRealTimers();
});

describe('TerminalDialog', () => {
  it('is a region named by the card title when open', () => {
    render(<TerminalDialog stop={earth} open />);
    const region = screen.getByRole('region', { name: earth.title });
    expect(region).toHaveAttribute('data-state', 'open');
  });

  it('is hidden from the accessibility tree when closed', () => {
    render(<TerminalDialog stop={earth} open={false} />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(document.querySelector('[data-stop="earth"]')).toHaveAttribute('data-state', 'closed');
  });

  it('exposes the full text while the typewriter is still revealing', () => {
    render(<TerminalDialog stop={earth} open typing />);
    const region = screen.getByRole('region', { name: earth.title });
    expect(region).toHaveTextContent(earth.text);
  });

  it('reveals the text on the orbit clock: 60 characters a second', () => {
    render(<TerminalDialog stop={earth} open typing />);
    const typed = document.querySelector('[data-typewriter]');
    expect(typed?.textContent).toBe('');
    clock(2000);
    expect(typed?.textContent).toBe(earth.text.slice(0, 120));
    clock(600_000);
    expect(typed?.textContent).toBe(earth.text);
  });

  it('hands each newly revealed character to the typing link', () => {
    const seen: string[] = [];
    typingLink.reveal = (char) => seen.push(char);
    render(<TerminalDialog stop={earth} open typing />);
    clock(500);
    expect(seen.join('')).toBe(earth.text.slice(0, 30));
    typingLink.reveal = () => undefined;
  });

  it('opens fully typed when it is not typing (a read card, or a reduced-motion hold)', () => {
    const seen: string[] = [];
    typingLink.reveal = (char) => seen.push(char);
    render(<TerminalDialog stop={earth} open typing={false} />);
    expect(document.querySelector('[data-typewriter]')?.textContent).toBe(earth.text);
    clock(500);
    expect(seen).toEqual([]);
    typingLink.reveal = () => undefined;
  });

  it('renders verified links only', () => {
    const stop = {
      ...earth,
      links: [
        { label: 'GitHub', href: 'https://github.com/ahamed', verified: true },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/', verified: false },
      ],
    };
    render(<TerminalDialog stop={stop} open />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ahamed',
    );
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull();
  });

  it('lists timeline entries in order', () => {
    render(<TerminalDialog stop={moon} open />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Ezzytech');
    expect(items.at(-1)).toContain('Ollyo');
  });

  it('registers its element so the frame loop can position it', () => {
    const { unmount } = render(<TerminalDialog stop={earth} open />);
    expect(dialogElements.get('earth')).toBeInstanceOf(HTMLElement);
    unmount();
    expect(dialogElements.has('earth')).toBe(false);
  });

  describe('tech chips', () => {
    const phobos = STOPS.find((s) => s.id === 'phobos');
    if (!phobos?.tech) throw new Error('phobos card with tech missing');
    const tech = phobos.tech;

    it('lists the card tech as a "Tech" list, in order', () => {
      render(<TerminalDialog stop={phobos} open />);
      const list = screen.getByRole('list', { name: 'Tech' });
      expect(Array.from(list.querySelectorAll('li')).map((li) => li.textContent)).toEqual(tech);
    });

    it('shows no chip list on cards without tech', () => {
      render(<TerminalDialog stop={earth} open />);
      expect(screen.queryByRole('list', { name: 'Tech' })).toBeNull();
    });

    it('reveals the chips once the typewriter has finished', () => {
      render(<TerminalDialog stop={phobos} open typing />);
      const list = screen.getByRole('list', { name: 'Tech' });
      expect(list).not.toHaveAttribute('data-revealed');
      clock(600_000);
      expect(list).toHaveAttribute('data-revealed');
    });

    it('shows the chips at once when not typing', () => {
      render(<TerminalDialog stop={phobos} open typing={false} />);
      expect(screen.getByRole('list', { name: 'Tech' })).toHaveAttribute('data-revealed');
    });
  });
});
