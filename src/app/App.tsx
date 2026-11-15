import { lazy, Suspense, useRef, useState } from 'react';
import { bootTracker } from '../boot/tracker';
import { FINALE, STOPS } from '../content/journey';
import { useAutoplay } from '../input/useAutoplay';
import { useKeyboardInput } from '../input/useKeyboardInput';
import { useTouchInput } from '../input/useTouchInput';
import { useWheelInput } from '../input/useWheelInput';
import { canUseWebGL } from '../scene/webgl';
import { journeyStore, ROUTE } from '../store/journey';
import { BootLoader } from '../ui/BootLoader/BootLoader';
import { FinaleLayer } from '../ui/Finale/FinaleLayer';
import { Hud } from '../ui/Hud/Hud';
import { DialogLayer } from '../ui/TerminalDialog/DialogLayer';
import { HiddenContent, SkipLink } from '../ui/TextMode/HiddenContent';
import { TextMode } from '../ui/TextMode/TextMode';
import styles from './App.module.css';
import { shouldInspect } from './inspect';
import { isPerf } from './perf';
import { shouldShowText } from './textMode';
import { useAudio } from './useAudio';

const Voyage = lazy(() => import('../scene/Voyage'));
const PerfOverlay = lazy(() => import('../ui/PerfOverlay/PerfOverlay'));
// `import.meta.env.DEV` is replaced with `false` in production builds, so this import is
// dropped and the inspector (and its orbit controls) never ships.
const Inspect = import.meta.env.DEV ? lazy(() => import('../scene/voyager/Inspect')) : null;

/** The 3D voyage with its overlays, input, sound and autoplay. Only mounted with WebGL. */
function VoyageApp() {
  const [inspect] = useState(() => shouldInspect(import.meta.env.DEV, window.location.search));
  const [perf] = useState(() => isPerf(window.location.search));
  const surface = useRef<HTMLElement>(null);

  useWheelInput(journeyStore, STOPS.length);
  useKeyboardInput(journeyStore);
  useTouchInput(journeyStore, surface, STOPS.length);
  useAudio(journeyStore);
  useAutoplay(journeyStore, STOPS, ROUTE.closePoints);

  return (
    <main ref={surface} className={styles.voyage}>
      <SkipLink />
      <h1 className="visually-hidden">Sajeeb Ahamed</h1>
      {inspect && Inspect ? (
        <Suspense fallback={null}>
          <Inspect />
        </Suspense>
      ) : (
        <>
          <Suspense fallback={null}>
            <Voyage />
          </Suspense>
          {/* Before the dialogs, so they paint over it. */}
          {perf ? (
            <Suspense fallback={null}>
              <PerfOverlay />
            </Suspense>
          ) : null}
          <DialogLayer stops={STOPS} />
          <FinaleLayer finale={FINALE} store={journeyStore} />
          <Hud store={journeyStore} stops={STOPS} closePoints={ROUTE.closePoints} />
          <BootLoader tracker={bootTracker.store} store={journeyStore} />
          <HiddenContent />
        </>
      )}
    </main>
  );
}

/** Text mode for `?text` or without WebGL (no 3D, no input hooks); otherwise the voyage. */
export function App() {
  const [webgl] = useState(canUseWebGL);
  const [text] = useState(() => shouldShowText(window.location.search, webgl));
  if (text) {
    return (
      <main>
        <TextMode webglMissing={!webgl} />
      </main>
    );
  }
  return <VoyageApp />;
}
