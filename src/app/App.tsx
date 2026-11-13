import { lazy, Suspense, useRef, useState } from 'react';
import { STOPS } from '../content/journey';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { useTouchInput } from '../input/useTouchInput';
import { useWheelInput } from '../input/useWheelInput';
import { canUseWebGL } from '../scene/webgl';
import { journeyStore } from '../store/journey';
import { DialogLayer } from '../ui/TerminalDialog/DialogLayer';
import styles from './App.module.css';
import { shouldInspect } from './inspect';
import { useAudio } from './useAudio';

const Voyage = lazy(() => import('../scene/Voyage'));
// `import.meta.env.DEV` is replaced with `false` in production builds, so this import is
// dropped and the inspector (and its orbit controls) never ships.
const Inspect = import.meta.env.DEV ? lazy(() => import('../scene/voyager/Inspect')) : null;

export function App() {
  const [webgl] = useState(canUseWebGL);
  const [inspect] = useState(() => shouldInspect(import.meta.env.DEV, window.location.search));
  const surface = useRef<HTMLElement>(null);

  useWheelInput(journeyStore, STOPS.length);
  useKeyboardInput(journeyStore);
  useTouchInput(journeyStore, surface, STOPS.length);
  useAudio(journeyStore);

  return (
    <main ref={surface} className={styles.voyage}>
      <h1 className="visually-hidden">Sajeeb Ahamed</h1>
      {webgl && inspect && Inspect ? (
        <Suspense fallback={null}>
          <Inspect />
        </Suspense>
      ) : webgl ? (
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
