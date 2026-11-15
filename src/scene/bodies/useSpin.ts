import { useFrame } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { type Object3D, Vector3 } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { type Spin, spinAngle } from './spin';

/** Longest frame step counted, so a stalled tab does not jump the spin. */
const MAX_STEP = 0.1;

/**
 * Turns `ref`'s object about `spin.axis` by the angle for the elapsed time. The object should
 * exist only to spin: its quaternion is overwritten every frame, so static rotations belong on
 * a parent. Holds the resting orientation under reduced motion. Allocation-free per frame.
 */
export function useSpin(ref: RefObject<Object3D | null>, spin: Spin): void {
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const axis = useMemo(() => new Vector3(...spin.axis).normalize(), [spin.axis]);
  const elapsed = useRef(0);

  useFrame((_, dt) => {
    // The clock pauses under reduced motion, so turning it off resumes from rest without a jump.
    if (!reducedRef.current) elapsed.current += Math.min(dt, MAX_STEP);
    ref.current?.quaternion.setFromAxisAngle(
      axis,
      spinAngle(elapsed.current, spin.period, reducedRef.current),
    );
  });
}
