import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders one main landmark containing the site owner heading', () => {
    render(<App />);

    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);

    const [main] = mains;
    if (!main) throw new Error('main landmark missing');
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Sajeeb Ahamed');
  });
});
