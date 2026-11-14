/** Arrokoth's contact-binary layout (no three.js imports): two lobes touching at a neck. */
import type { RockPresetId } from './rockShape';

export interface Lobe {
  preset: RockPresetId;
  radius: number;
  /** Centre offset along X. */
  x: number;
}

/** Share of the smaller lobe's radius by which the lobes overlap, making a narrow neck. */
const NECK_OVERLAP = 0.12;

/** The two lobes of an Arrokoth of overall half-length about `radius`. */
export function arrokothLobes(radius: number): [Lobe, Lobe] {
  const big = 0.62 * radius;
  const small = 0.48 * radius;
  const gap = big + small - NECK_OVERLAP * small;
  // Centre the pair on the body's origin.
  const bigX = -gap * (small / (big + small));
  return [
    { preset: 'arrokoth-wenu', radius: big, x: bigX },
    { preset: 'arrokoth-weeyo', radius: small, x: bigX + gap },
  ];
}
