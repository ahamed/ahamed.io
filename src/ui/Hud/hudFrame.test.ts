import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { createHudFrame, type HudTargets } from './hudFrame';

const route = buildRoute(STOPS);
const bodies = STOPS.map((s) => s.body);
const NOW = Date.UTC(2026, 10, 15);
const cp = (id: string) => route.closePoints[STOPS.findIndex((s) => s.id === id)] ?? NaN;

function setup() {
  const targets: HudTargets = {
    date: document.createElement('span'),
    au: document.createElement('span'),
    kms: document.createElement('span'),
    delay: document.createElement('span'),
    map: document.createElement('div'),
  };
  const frame = createHudFrame(targets, route.closePoints, bodies, () => NOW);
  return { targets, frame };
}

describe('createHudFrame', () => {
  it('writes the telemetry for the current position', () => {
    const { targets, frame } = setup();
    frame.tick(0, cp('jupiter'), 0, false);
    expect(targets.date.textContent).toBe('05 Mar 1979');
    expect(targets.au.textContent).toBe('5.20 AU');
    expect(targets.kms.textContent).toBe('25.0 km/s');
    expect(targets.delay.textContent).toBe('34m 50s');
    expect(targets.map.style.getPropertyValue('--p')).toBe(cp('jupiter').toFixed(4));
  });

  it('reads no signal delay at Earth, where Voyager starts', () => {
    const { targets, frame } = setup();
    frame.tick(0, 0, 0, true);
    expect(targets.delay.textContent).toBe('0.0 s');
  });

  it('counts the signal delay down while at rest, and restarts it when moving', () => {
    const { targets, frame } = setup();
    const saturn = cp('saturn');
    frame.tick(0, saturn, 0, false);
    const start = targets.delay.textContent;
    frame.tick(3000, saturn, 0, false);
    expect(targets.delay.textContent).not.toBe(start);
    frame.tick(3100, saturn, 0.01, false);
    expect(targets.delay.textContent).toBe(start);
  });

  it('holds the full light time under reduced motion', () => {
    const { targets, frame } = setup();
    frame.tick(0, cp('saturn'), 0, true);
    const start = targets.delay.textContent;
    frame.tick(5000, cp('saturn'), 0, true);
    expect(targets.delay.textContent).toBe(start);
  });

  it('touches the DOM only when a shown value changes', () => {
    const { targets, frame } = setup();
    frame.tick(0, 0.3, 0, true);
    const node = targets.au.firstChild;
    frame.tick(16, 0.3, 0, true);
    expect(targets.au.firstChild).toBe(node);
  });
});
