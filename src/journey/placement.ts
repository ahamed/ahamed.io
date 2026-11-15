import { damp } from './progress';

/**
 * Where the open dialog sits on screen (desktop). All values are CSS pixels with the origin at
 * the viewport's top-left. Pure; `placeDialogInto` allocates nothing, for the frame loop.
 */

export type Spot = 'left' | 'right' | 'above' | 'below';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A body's disc on screen. */
export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface PlacementInput {
  viewport: { w: number; h: number };
  body: Circle;
  /** Voyager's bounding box on screen. */
  voyager: Rect;
  /** The dialog's current on-screen size (already scaled). */
  dialog: { w: number; h: number };
  /** The spot used last frame, kept while it still fits. */
  previous: Spot | null;
  /** Distance kept from the viewport edges. */
  margin: number;
}

export interface Placement {
  spot: Spot;
  /** The dialog's top-left corner. */
  x: number;
  y: number;
}

/** Space between the body's limb and the dialog. */
export const BODY_GAP = 24;
/**
 * Extra edge tolerance for the spot already in use, so a dialog right at a viewport edge
 * does not flip back and forth between two spots.
 */
export const STICK_SLACK = 8;
/** Space kept between a side spot slid clear of Voyager and Voyager's box. */
export const VOYAGER_GAP = 8;
/** Rate at which the dialog glides to a new spot (1/s). */
const GLIDE_RATE = 12;

const clamp = (v: number, lo: number, hi: number) => (hi < lo ? lo : Math.min(hi, Math.max(lo, v)));

/**
 * A side spot's top edge: centred on the body, or, when that would cover Voyager, slid up (or
 * else down) just clear of Voyager's box, as long as the dialog stays on screen and level with
 * the body's centre.
 */
function sideY(x: number, minY: number, maxY: number, input: PlacementInput): number {
  const { body, dialog, voyager } = input;
  const centred = clamp(body.y - dialog.h / 2, minY, maxY);
  if (!overlapsAt(x, centred, dialog.w, dialog.h, voyager)) return centred;
  const level = (y: number) => y >= minY && y <= maxY && y <= body.y && y + dialog.h >= body.y;
  const above = voyager.y - VOYAGER_GAP - dialog.h;
  if (level(above)) return above;
  const below = voyager.y + voyager.h + VOYAGER_GAP;
  if (level(below)) return below;
  return centred;
}

/**
 * An above or below spot's left edge: centred on the body, or, when that would cover Voyager,
 * slid left (or else right) just clear of Voyager's box, as long as the dialog stays on screen
 * and over the body's centre.
 */
function stackX(y: number, minX: number, maxX: number, input: PlacementInput): number {
  const { body, dialog, voyager } = input;
  const centred = clamp(body.x - dialog.w / 2, minX, maxX);
  if (!overlapsAt(centred, y, dialog.w, dialog.h, voyager)) return centred;
  const over = (x: number) => x >= minX && x <= maxX && x <= body.x && x + dialog.w >= body.x;
  const left = voyager.x - VOYAGER_GAP - dialog.w;
  if (over(left)) return left;
  const right = voyager.x + voyager.w + VOYAGER_GAP;
  if (over(right)) return right;
  return centred;
}

/** Writes the top-left corner of `spot` into `out` (x, y only). */
function positionInto(out: Placement, spot: Spot, input: PlacementInput): Placement {
  const { body, dialog, viewport, margin } = input;
  const minX = margin;
  const maxX = viewport.w - margin - dialog.w;
  const minY = margin;
  const maxY = viewport.h - margin - dialog.h;
  switch (spot) {
    case 'left':
      out.x = body.x - body.r - BODY_GAP - dialog.w;
      out.y = sideY(out.x, minY, maxY, input);
      break;
    case 'right':
      out.x = body.x + body.r + BODY_GAP;
      out.y = sideY(out.x, minY, maxY, input);
      break;
    case 'above':
      out.y = body.y - body.r - BODY_GAP - dialog.h;
      out.x = stackX(out.y, minX, maxX, input);
      break;
    case 'below':
      out.y = body.y + body.r + BODY_GAP;
      out.x = stackX(out.y, minX, maxX, input);
      break;
  }
  return out;
}

function overlapsAt(x: number, y: number, w: number, h: number, b: Rect): boolean {
  return x < b.x + b.w && b.x < x + w && y < b.y + b.h && b.y < y + h;
}

function hitsCircleAt(x: number, y: number, w: number, h: number, c: Circle): boolean {
  const nx = clamp(c.x, x, x + w);
  const ny = clamp(c.y, y, y + h);
  return (nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r ** 2;
}

function fits(pos: Placement, input: PlacementInput, slack: number): boolean {
  const { viewport, dialog, voyager, body } = input;
  const edge = input.margin - slack;
  const { x, y } = pos;
  const { w, h } = dialog;
  return (
    x >= edge &&
    y >= edge &&
    x + w <= viewport.w - edge &&
    y + h <= viewport.h - edge &&
    !overlapsAt(x, y, w, h, voyager) &&
    !hitsCircleAt(x, y, w, h, body)
  );
}

const LEFT_FIRST: readonly Spot[] = ['left', 'right', 'above', 'below'];
const RIGHT_FIRST: readonly Spot[] = ['right', 'left', 'above', 'below'];

/** Candidate spots in order: beside the body away from Voyager, the other side, above, below. */
export function spotOrder(body: Circle, voyager: Rect): readonly Spot[] {
  return body.x < voyager.x + voyager.w / 2 ? LEFT_FIRST : RIGHT_FIRST;
}

/**
 * Chooses the dialog's spot and writes it into `out`: the previous spot while it still fits,
 * otherwise the first spot that fits on screen without covering Voyager or the body. When
 * none fits, the on-screen spot that covers the least of them.
 */
export function placeDialogInto(out: Placement, input: PlacementInput): Placement {
  if (input.previous && fits(positionInto(out, input.previous, input), input, STICK_SLACK)) {
    out.spot = input.previous;
    return out;
  }
  const order = spotOrder(input.body, input.voyager);
  for (const spot of order) {
    if (fits(positionInto(out, spot, input), input, 0)) {
      out.spot = spot;
      return out;
    }
  }
  // Nothing fits: of the spots kept on screen, take the one covering the least (ties keep the
  // preference order).
  const { viewport, dialog, margin } = input;
  let best: Spot = order[0] ?? 'right';
  let bestCost = Infinity;
  let bestX = 0;
  let bestY = 0;
  for (const spot of order) {
    positionInto(out, spot, input);
    const x = clamp(out.x, margin, viewport.w - margin - dialog.w);
    const y = clamp(out.y, margin, viewport.h - margin - dialog.h);
    const cost = coverage(x, y, input);
    if (cost < bestCost) {
      best = spot;
      bestCost = cost;
      bestX = x;
      bestY = y;
    }
  }
  out.spot = best;
  out.x = bestX;
  out.y = bestY;
  return out;
}

const overlapLength = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/**
 * Area of Voyager's box plus (roughly) of the body's disc that a dialog at (x, y) would cover.
 * The disc is taken as its bounding square scaled by π/4.
 */
function coverage(x: number, y: number, { dialog, voyager, body }: PlacementInput): number {
  const { w, h } = dialog;
  const ship =
    overlapLength(x, x + w, voyager.x, voyager.x + voyager.w) *
    overlapLength(y, y + h, voyager.y, voyager.y + voyager.h);
  const disc =
    overlapLength(x, x + w, body.x - body.r, body.x + body.r) *
    overlapLength(y, y + h, body.y - body.r, body.y + body.r) *
    (Math.PI / 4);
  return ship + disc;
}

/** Allocating convenience wrapper around `placeDialogInto`. */
export function placeDialog(input: PlacementInput): Placement {
  return placeDialogInto({ spot: 'right', x: 0, y: 0 }, input);
}

/** One axis of the glide toward a new spot; immediate under reduced motion. */
export function easeOffset(current: number, target: number, dt: number, reduced: boolean): number {
  return reduced ? target : damp(current, target, GLIDE_RATE, dt);
}
