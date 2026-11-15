import { type ReactNode, useRef } from 'react';
import type { Group } from 'three';
import { SPINS, type SpinKey } from './spin';
import { useSpin } from './useSpin';

/** A group, named `spin-<key>`, that turns its children by body `key`'s spin. */
export function Spinning({ spin, children }: { spin: SpinKey; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useSpin(ref, SPINS[spin]);
  return (
    <group name={`spin-${spin}`} ref={ref}>
      {children}
    </group>
  );
}
