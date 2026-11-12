import { useEffect } from 'react';
import { keyToCommand } from '../journey/input';
import type { JourneyStore } from '../store/journey';
import { isEditableTarget } from './editable';

/** ↑/↓ step, PageUp/PageDown jump between stops, Home/End go to the ends. */
export function useKeyboardInput(store: JourneyStore): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      const command = keyToCommand(event.key);
      if (!command) return;
      event.preventDefault();
      const now = performance.now();
      const state = store.getState();
      switch (command.type) {
        case 'step':
          state.step(command.dir, now);
          break;
        case 'stop':
          state.goToStop(command.dir, now);
          break;
        case 'start':
          state.goToStart(now);
          break;
        case 'end':
          state.goToEnd(now);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [store]);
}
