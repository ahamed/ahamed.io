import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FINALE, STOPS } from '../../content/journey';
import type { Stop } from '../../content/schema';
import { TextContent } from './TextContent';

const earth = STOPS[0];
if (!earth) throw new Error('no Earth');

describe('TextContent', () => {
  it('opens with the Earth card as the header', () => {
    render(<TextContent stops={STOPS} finale={FINALE} />);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { name: earth.title })).toBeInTheDocument();
    expect(header).toHaveTextContent(earth.text);
  });

  it('shows all 27 card titles as headings, in route order', () => {
    render(<TextContent stops={STOPS} finale={FINALE} />);
    const titles = STOPS.map((s) => s.title);
    const headings = screen
      .getAllByRole('heading')
      .map((h) => h.textContent)
      .filter((t) => titles.includes(t));
    expect(headings).toEqual(titles);
  });

  it('groups the cards into region sections with a mission date', () => {
    render(<TextContent stops={STOPS} finale={FINALE} />);
    const jupiter = screen.getByRole('region', { name: 'Jupiter' });
    expect(jupiter).toHaveTextContent('05 Mar 1979');
    expect(within(jupiter).getAllByRole('article')).toHaveLength(5);
  });

  it('lists tech chips, the Moon timeline and verified links only', () => {
    const stops: Stop[] = STOPS.map((s) =>
      s.id === 'mars'
        ? { ...s, links: [{ label: 'Hidden', href: 'https://example.com/', verified: false }] }
        : s,
    );
    render(<TextContent stops={stops} finale={FINALE} />);
    const pluto = screen.getByRole('article', { name: 'Tech stack' });
    expect(within(pluto).getByRole('list', { name: 'Tech' })).toHaveTextContent('Rust');
    const moon = screen.getByRole('article', { name: 'Career timeline' });
    expect(within(moon).getAllByRole('listitem')[0]).toHaveTextContent('Ezzytech');
    expect(screen.queryByRole('link', { name: 'Hidden' })).toBeNull();
  });

  it('ends with the Pale Blue Dot caption and the contact card', () => {
    render(<TextContent stops={STOPS} finale={FINALE} />);
    const contact = screen.getByRole('region', { name: FINALE.title });
    expect(contact).toHaveTextContent(FINALE.caption);
    expect(within(contact).getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:/) as string,
    );
    expect(within(contact).getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
  });

  it('can keep its links out of the tab order, for the visually hidden copy', () => {
    render(<TextContent stops={STOPS} finale={FINALE} tabbable={false} />);
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('tabindex', '-1');
  });
});
