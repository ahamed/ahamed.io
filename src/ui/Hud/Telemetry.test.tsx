import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Telemetry } from './Telemetry';

describe('Telemetry', () => {
  it('labels the date, distance, speed and signal delay, and hands their values to the writer', () => {
    const refs = {
      date: createRef<HTMLElement>(),
      au: createRef<HTMLElement>(),
      kms: createRef<HTMLElement>(),
      delay: createRef<HTMLElement>(),
    };
    render(
      <Telemetry dateRef={refs.date} auRef={refs.au} kmsRef={refs.kms} delayRef={refs.delay} />,
    );
    const block = screen.getByRole('region', { name: 'Mission telemetry' });
    for (const label of ['Date', 'Distance', 'Speed', 'Signal ▸ Earth']) {
      expect(block).toHaveTextContent(label);
    }
    for (const ref of Object.values(refs)) expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
