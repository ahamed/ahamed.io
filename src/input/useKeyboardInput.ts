import { useEffect } from 'react';
import { keyToCommand } from '../journey/input';
import type { JourneyStore } from '../store/journey';
import { isEditableTarget, isInteractiveTarget } from './editable';

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * ↑/↓ hold the throttle from keydown to keyup, PageUp/PageDown jump between stops, Home/End go to the ends, M mutes and Space
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
      const reduced = prefersReducedMotion();
      switch (command.type) {
        case 'step':
          // Key repeat would re-count the move; the hold lasts until keyup anyway.
          if (!event.repeat) state.keyHold(command.dir, true, now);
          break;
        case 'stop':
          state.goToStop(command.dir, now, reduced);
          break;
        case 'start':
          state.goToStart(now, reduced);
          break;
        case 'end':
          state.goToEnd(now, reduced);
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const command = keyToCommand(event.key);
      if (command?.type !== 'step') return;
      store.getState().keyHold(command.dir, false, performance.now());
    };
    // Losing focus mid-hold would never deliver the keyup.
    const onBlur = () => {
      const state = store.getState();
      if (state.heldKey !== 0) state.keyHold(state.heldKey, false, performance.now());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [store]);
}
