import { useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { Stop } from '../../content/schema';
import type { JourneyStore } from '../../store/journey';
import { AutoplayHint } from './AutoplayHint';
import { ControlsHint } from './ControlsHint';
import styles from './Hud.module.css';
import { ProgressMap } from './ProgressMap';
import { StatusChip } from './StatusChip';
import { Telemetry } from './Telemetry';
import { useHudFrame } from './useHudFrame';

interface Props {
  store: JourneyStore;
  stops: readonly Stop[];
  closePoints: readonly number[];
}

/** The HUD once mounted: its per-frame writer needs the elements to exist first. */
function HudContent({ store, stops, closePoints }: Props) {
  const finale = useStore(store, (s) => s.finaleShown);
  const date = useRef<HTMLElement>(null);
  const au = useRef<HTMLElement>(null);
  const kms = useRef<HTMLElement>(null);
  const delay = useRef<HTMLElement>(null);
  const map = useRef<HTMLElement>(null);
  const refs = useMemo(() => ({ date, au, kms, delay, map }), []);
  const bodies = useMemo(() => stops.map((s) => s.body), [stops]);
  useHudFrame(refs, closePoints, bodies);

  return (
    <div className={styles.hud} data-hud="" data-dim={finale ? '' : undefined}>
      <Telemetry dateRef={date} auRef={au} kmsRef={kms} delayRef={delay} />
      <ProgressMap ref={map} stops={stops} closePoints={closePoints} store={store} />
      <StatusChip store={store} />
      <ControlsHint store={store} />
      <AutoplayHint store={store} />
    </div>
  );
}

/**
 * Mission telemetry, the progress map, the sound and autoplay chip and the controls hint.
 * Hidden while the boot panel is shown; dims in the finale.
 */
export function Hud(props: Props) {
  const phase = useStore(props.store, (s) => s.phase);
  return phase === 'boot' ? null : <HudContent {...props} />;
}
