import { describe, expect, it } from 'vitest';
import {
  easeOffset,
  placeDialog,
  type Circle,
  type PlacementInput,
  type Rect,
  type Spot,
} from './placement';

const VIEWPORT = { w: 1280, h: 800 };
/** Voyager sits just below the screen centre in the chase view. */
const VOYAGER: Rect = { x: 590, y: 420, w: 100, h: 60 };
const DIALOG = { w: 360, h: 200 };

const input = (body: Circle, previous: Spot | null = null): PlacementInput => ({
  viewport: VIEWPORT,
  body,
  voyager: VOYAGER,
  dialog: DIALOG,
  previous,
  margin: 16,
});

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const rectOf = (p: { x: number; y: number }): Rect => ({ x: p.x, y: p.y, ...DIALOG });
const rectOf2 = (p: { x: number; y: number }, d: { w: number; h: number }): Rect => ({
  x: p.x,
  y: p.y,
  ...d,
});

const hitsCircle = (r: Rect, c: Circle) => {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return (nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r ** 2;
};

const onScreen = (r: Rect, margin = 16) =>
  r.x >= margin &&
  r.y >= margin &&
  r.x + r.w <= VIEWPORT.w - margin &&
  r.y + r.h <= VIEWPORT.h - margin;

describe('placeDialog', () => {
  it('puts the dialog left of a body that is left of Voyager, clear of both', () => {
    const body = { x: 520, y: 380, r: 60 };
    const placed = placeDialog(input(body));
    expect(placed.spot).toBe('left');
    const rect = rectOf(placed);
    expect(rect.x + rect.w).toBeLessThanOrEqual(body.x - body.r);
    expect(overlaps(rect, VOYAGER)).toBe(false);
    expect(hitsCircle(rect, body)).toBe(false);
    expect(onScreen(rect)).toBe(true);
  });

  it('puts the dialog right of a body that is right of Voyager, clear of both', () => {
    const body = { x: 760, y: 380, r: 60 };
    const placed = placeDialog(input(body));
    expect(placed.spot).toBe('right');
    const rect = rectOf(placed);
    expect(rect.x).toBeGreaterThanOrEqual(body.x + body.r);
    expect(overlaps(rect, VOYAGER)).toBe(false);
    expect(hitsCircle(rect, body)).toBe(false);
    expect(onScreen(rect)).toBe(true);
  });

  it('uses the other side when the first side has no room', () => {
    // Left of centre but hugging the left edge: no room on its left.
    const body = { x: 150, y: 200, r: 100 };
    const placed = placeDialog(input(body));
    expect(placed.spot).toBe('right');
    expect(overlaps(rectOf(placed), VOYAGER)).toBe(false);
  });

  it('goes above when neither side has room, and below when above has none either', () => {
    // A huge body filling the width: no room on either side.
    const wide = { x: 640, y: 760, r: 420 };
    expect(placeDialog(input(wide)).spot).toBe('above');
    const low = { x: 640, y: 40, r: 420 };
    const placed = placeDialog(input(low));
    expect(placed.spot).toBe('below');
  });

  it('falls back to the first spot, kept on screen, when nothing fits', () => {
    const everywhere = { x: 640, y: 400, r: 2000 };
    const placed = placeDialog(input(everywhere));
    expect(placed.spot).toBe('right');
    expect(onScreen(rectOf(placed))).toBe(true);
  });

  it('when nothing fits, takes the spot that covers the least of Voyager and the body', () => {
    // A giant filling the right of a 1280×720 screen; Voyager low on the left.
    const crowded: PlacementInput = {
      viewport: { w: 1280, h: 720 },
      body: { x: 965, y: 335, r: 275 },
      voyager: { x: 175, y: 413, w: 313, h: 313 },
      dialog: { w: 416, h: 180 },
      previous: null,
      margin: 16,
    };
    const placed = placeDialog(crowded);
    expect(placed.spot).toBe('left');
    expect(hitsCircle(rectOf2(placed, crowded.dialog), crowded.body)).toBe(false);
  });

  it('keeps the previous spot while it still fits', () => {
    // Right of Voyager would prefer "right", but "left" still fits, so it stays.
    const body = { x: 760, y: 250, r: 40 };
    expect(placeDialog(input(body)).spot).toBe('right');
    const sticky = placeDialog(input(body, 'left'));
    expect(sticky.spot).toBe('left');
    expect(overlaps(rectOf(sticky), VOYAGER)).toBe(false);
  });

  it('leaves the previous spot once it no longer fits', () => {
    // "left" would now land on Voyager, so it moves to the preferred side.
    const body = { x: 700, y: 440, r: 30 };
    expect(placeDialog(input(body, 'left')).spot).toBe('right');
  });

  it('keeps a side spot vertically on screen', () => {
    const body = { x: 900, y: 40, r: 30 };
    const rect = rectOf(placeDialog(input(body)));
    expect(onScreen(rect)).toBe(true);
  });
});

describe('easeOffset', () => {
  it('moves toward the target and converges', () => {
    let x = 0;
    const first = easeOffset(x, 100, 1 / 60, false);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(100);
    for (let i = 0; i < 120; i++) x = easeOffset(x, 100, 1 / 60, false);
    expect(x).toBe(100);
  });

  it('jumps straight to the target under reduced motion', () => {
    expect(easeOffset(0, 100, 1 / 60, true)).toBe(100);
  });
});
