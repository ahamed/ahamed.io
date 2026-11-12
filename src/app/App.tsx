import { lazy, Suspense, useRef, useState } from 'react';
import { STOPS } from '../content/journey';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { useTouchInput } from '../input/useTouchInput';
import { useWheelInput } from '../input/useWheelInput';
import { canUseWebGL } from '../scene/webgl';
import { journeyStore } from '../store/journey';
import { DialogLayer } from '../ui/TerminalDialog/DialogLayer';
import styles from './App.module.css';
import { useAudio } from './useAudio';

const Voyage = lazy(() => import('../scene/Voyage'));

export function App() {
  const [webgl] = useState(canUseWebGL);
  const surface = useRef<HTMLElement>(null);

  useWheelInput(journeyStore, STOPS.length);
  useKeyboardInput(journeyStore);
  useTouchInput(journeyStore, surface, STOPS.length);
  useAudio(journeyStore);

  return (
    <main ref={surface} className={styles.voyage}>
      <h1 className="visually-hidden">Sajeeb Ahamed</h1>
      {webgl ? (
        <>
          <Suspense fallback={null}>
            <Voyage />
          </Suspense>
          <DialogLayer stops={STOPS} />
        </>
      ) : (
        <p role="status" className={styles.fallback}>
          3D view not supported in this browser.
        </p>
      )}
    </main>
  );
}
