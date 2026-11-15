import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { TextMode } from './TextMode';

describe('TextMode', () => {
  it('is a page titled by the owner with a link back to the voyage', () => {
    render(<TextMode />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sajeeb Ahamed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the voyage' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('article')).toHaveLength(STOPS.length - 1);
  });

  it('says the 3D voyage needs WebGL only when it is missing', () => {
    const { unmount } = render(<TextMode />);
    expect(screen.queryByText(/needs WebGL/)).toBeNull();
    unmount();
    render(<TextMode webglMissing />);
    expect(screen.getByText(/needs WebGL/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to the voyage' })).toBeNull();
  });
});
