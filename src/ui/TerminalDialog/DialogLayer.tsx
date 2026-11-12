import type { Stop } from '../../content/schema';
import { useJourney } from '../../store/journey';
import { TerminalDialog } from './TerminalDialog';

/** One dialog per stop; only the store's open stop is shown. */
export function DialogLayer({ stops }: { stops: readonly Stop[] }) {
  const openStopId = useJourney((s) => s.openStopId);
  return (
    <>
      {stops.map((stop) => (
        <TerminalDialog key={stop.id} stop={stop} open={stop.id === openStopId} />
      ))}
    </>
  );
}
