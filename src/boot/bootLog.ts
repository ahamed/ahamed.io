/** What the boot panel knows about loading. */
export interface BootState {
  /** The voyage scene's code has loaded. */
  chunk: boolean;
  /** Items (textures, decoder files) finished and started by three's loading manager. */
  loaded: number;
  total: number;
  /** Everything has loaded and nothing new started for a while: ready to begin. */
  settled: boolean;
}

export interface BootLine {
  text: string;
  done: boolean;
}

/** How long nothing may be pending before loading counts as settled. */
export const QUIET_MS = 300;
/** Share of the bar for the scene code; the rest follows the loaded items. */
const CHUNK_SHARE = 20;

/** The mission log for the current loading state, oldest line first. */
export function bootLines({ chunk, loaded, total, settled }: BootState): BootLine[] {
  const lines: BootLine[] = [
    { text: 'VOYAGER 1 · FLIGHT DATA SUBSYSTEM', done: true },
    { text: `loading flight software …${chunk ? ' ok' : ''}`, done: chunk },
  ];
  if (!chunk) return lines;
  const count = `${String(loaded)}/${String(total)}`;
  lines.push({ text: `calibrating imaging … ${count}${settled ? ' ok' : ''}`, done: settled });
  if (settled) lines.push({ text: 'telemetry link … ok', done: true });
  return lines;
}

/** Progress in whole percent, never below `previous` (items can be discovered late). */
export function nextPercent(
  previous: number,
  { chunk, loaded, total, settled }: BootState,
): number {
  if (settled) return 100;
  const items = total > 0 ? loaded / total : 0;
  const raw = (chunk ? CHUNK_SHARE : 0) + (100 - CHUNK_SHARE) * items;
  // Hold at 99 until settled, so 100% always means ready.
  return Math.max(previous, Math.min(99, Math.floor(raw)));
}

/** Ready to begin: scene code in, every started item loaded, and quiet for QUIET_MS. */
export function isSettled({ chunk, loaded, total }: BootState, quietMs: number): boolean {
  return chunk && total > 0 && loaded >= total && quietMs >= QUIET_MS;
}
