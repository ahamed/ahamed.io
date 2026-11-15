import { useEffect, type RefObject } from 'react';
import type { BodyId } from '../../content/schema';
import { useReducedMotion } from '../../scene/useReducedMotion';
import { journeyRuntime } from '../../store/journey';
import { createHudFrame, type HudTargets } from './hudFrame';

export type HudRefs = { [K in keyof HudTargets]: RefObject<HTMLElement | null> };

/** Runs the HUD's DOM writer on every animation frame while its elements are mounted. */
export function useHudFrame(
  refs: HudRefs,
  closePoints: readonly number[],
  bodies: readonly BodyId[],
): void {
  const reduced = useReducedMotion();
  useEffect(() => {
    const { date, au, kms, delay, map } = refs;
    if (!date.current || !au.current || !kms.current || !delay.current || !map.current) return;
    const frame = createHudFrame(
      {
        date: date.current,
        au: au.current,
        kms: kms.current,
        delay: delay.current,
        map: map.current,
      },
      closePoints,
      bodies,
    );
    let id = 0;
    const loop = (time: number) => {
      frame.tick(time, journeyRuntime.position, journeyRuntime.speed, reduced);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [refs, closePoints, bodies, reduced]);
}
