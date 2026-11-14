import { useEffect } from 'react';
import { keyToCommand } from '../journey/input';
import type { JourneyStore } from '../store/journey';
import { isEditableTarget, isInteractiveTarget } from './editable';

/**
 * ↑/↓ step, PageUp/PageDown jump between stops, Home/End go to the ends, M mutes and Space
 * toggles autoplay. Nothing but the voyage keys works while the boot panel is shown.
 */
export function useKeyboardInput(store: JourneyStore): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      const command = keyToCommand(event.key);
      if (!command) return;
      const state = store.getState();
      if (command.type === 'mute' || command.type === 'autoplay') {
        if (state.phase === 'boot') return;
        // Space on a focused button or link presses it; leave that to the browser.
        if (command.type === 'autoplay' && isInteractiveTarget(event.target)) return;
        event.preventDefault();
        if (command.type === 'mute') state.toggleMute();
        else state.toggleAutoplay();
        return;
      }
      event.preventDefault();
      const now = performance.now();
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
