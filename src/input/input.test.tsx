import { fireEvent, render, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { activeThrottle, createJourneyStore, journeyRuntime } from '../store/journey';
import { useKeyboardInput } from './useKeyboardInput';
import { useTouchInput } from './useTouchInput';
import { useWheelInput } from './useWheelInput';

const make = () => createJourneyStore([0, 0.8], { phase: 'voyage', storage: null });
const dir = (store: ReturnType<typeof make>) => activeThrottle(store.getState(), performance.now());

describe('useWheelInput', () => {
  it('moves the voyage forward on wheel down and prevents page scroll', () => {
    const store = make();
    renderHook(() => {
      useWheelInput(store);
    });
    const event = new WheelEvent('wheel', { deltaY: 200, cancelable: true });
    window.dispatchEvent(event);
    expect(dir(store)).toBe(1);
    expect(store.getState().intensity).toBeGreaterThan(0);
    expect(event.defaultPrevented).toBe(true);
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    expect(dir(store)).toBe(-1);
  });

  it('ignores the wheel during autoplay and asks for the hint', () => {
    const store = make();
    store.getState().toggleAutoplay();
    renderHook(() => {
      useWheelInput(store);
    });
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, cancelable: true }));
    expect(dir(store)).toBe(0);
    expect(store.getState().ignoredHintAt).toBeGreaterThan(0);
  });

  it('leaves ctrl+wheel (pinch zoom) alone', () => {
    const store = make();
    renderHook(() => {
      useWheelInput(store);
    });
    const event = new WheelEvent('wheel', { deltaY: 200, ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(dir(store)).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('useKeyboardInput', () => {
  it('holds the throttle while an arrow is down, ignoring key repeat', () => {
    const store = make();
    renderHook(() => {
      useKeyboardInput(store);
    });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown', repeat: true });
    expect(store.getState().heldKey).toBe(1);
    expect(store.getState().moves).toBe(1);
    fireEvent.keyUp(window, { key: 'ArrowDown' });
    expect(dir(store)).toBe(0);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(dir(store)).toBe(-1);
  });

  it('jumps with PageDown/End/Home', () => {
    const store = make();
    journeyRuntime.position = 0;
    renderHook(() => {
      useKeyboardInput(store);
    });
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(store.getState().flight?.to).toBe(0.8);
    fireEvent.keyDown(window, { key: 'End' });
    expect(store.getState().flight?.to).toBe(1);
    fireEvent.keyDown(window, { key: 'Home' });
    expect(store.getState().flight?.to).toBe(0);
  });

  it('toggles mute with M and autoplay with Space, without scrolling the page', () => {
    const store = make();
    renderHook(() => {
      useKeyboardInput(store);
    });
    fireEvent.keyDown(window, { key: 'm' });
    expect(store.getState().muted).toBe(true);
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(space);
    expect(store.getState().autoplay).toBe(true);
    expect(space.defaultPrevented).toBe(true);
    // M is not voyage input, so it leaves autoplay running.
    fireEvent.keyDown(window, { key: 'M' });
    expect(store.getState().autoplay).toBe(true);
  });

  it('leaves Space to a focused button', () => {
    const store = make();
    function Harness() {
      useKeyboardInput(store);
      return <button type="button">Back to Earth</button>;
    }
    const { getByRole } = render(<Harness />);
    fireEvent.keyDown(getByRole('button'), { key: ' ' });
    expect(store.getState().autoplay).toBe(false);
  });

  it('ignores M and Space while booting', () => {
    const store = createJourneyStore([0, 0.8], { phase: 'boot', storage: null });
    renderHook(() => {
      useKeyboardInput(store);
    });
    fireEvent.keyDown(window, { key: 'm' });
    fireEvent.keyDown(window, { key: ' ' });
    expect(store.getState().muted).toBe(false);
    expect(store.getState().autoplay).toBe(false);
  });

  it('ignores keys typed into a text field', () => {
    const store = make();
    function Harness() {
      useKeyboardInput(store);
      return <input aria-label="name" />;
    }
    const { getByLabelText } = render(<Harness />);
    fireEvent.keyDown(getByLabelText('name'), { key: 'ArrowDown' });
    expect(dir(store)).toBe(0);
  });
});

describe('useTouchInput', () => {
  it('moves forward when swiping up', () => {
    const store = make();
    function Harness() {
      const ref = useRef<HTMLDivElement>(null);
      useTouchInput(store, ref);
      return <div data-testid="surface" ref={ref} />;
    }
    const { getByTestId } = render(<Harness />);
    const surface = getByTestId('surface');
    fireEvent.touchStart(surface, { touches: [{ clientY: 500 }] });
    fireEvent.touchMove(surface, { touches: [{ clientY: 300 }] });
    expect(dir(store)).toBe(1);
    expect(store.getState().intensity).toBeGreaterThan(0);
  });
});
