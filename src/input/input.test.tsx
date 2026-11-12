import { fireEvent, render, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { createJourneyStore } from '../store/journey';
import { useKeyboardInput } from './useKeyboardInput';
import { useTouchInput } from './useTouchInput';
import { useWheelInput } from './useWheelInput';

const make = () => createJourneyStore([0, 0.8]);

describe('useWheelInput', () => {
  it('moves the voyage forward on wheel down and prevents page scroll', () => {
    const store = make();
    renderHook(() => {
      useWheelInput(store, 2);
    });
    const event = new WheelEvent('wheel', { deltaY: 200, cancelable: true });
    window.dispatchEvent(event);
    expect(store.getState().target).toBeGreaterThan(0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves ctrl+wheel (pinch zoom) alone', () => {
    const store = make();
    renderHook(() => {
      useWheelInput(store, 2);
    });
    const event = new WheelEvent('wheel', { deltaY: 200, ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(store.getState().target).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('useKeyboardInput', () => {
  it('steps with arrows and jumps with PageDown/End/Home', () => {
    const store = make();
    renderHook(() => {
      useKeyboardInput(store);
    });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(store.getState().target).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(store.getState().target).toBe(0.8);
    fireEvent.keyDown(window, { key: 'End' });
    expect(store.getState().target).toBe(1);
    fireEvent.keyDown(window, { key: 'Home' });
    expect(store.getState().target).toBe(0);
  });

  it('ignores keys typed into a text field', () => {
    const store = make();
    function Harness() {
      useKeyboardInput(store);
      return <input aria-label="name" />;
    }
    const { getByLabelText } = render(<Harness />);
    fireEvent.keyDown(getByLabelText('name'), { key: 'ArrowDown' });
    expect(store.getState().target).toBe(0);
  });
});

describe('useTouchInput', () => {
  it('moves forward when swiping up', () => {
    const store = make();
    function Harness() {
      const ref = useRef<HTMLDivElement>(null);
      useTouchInput(store, ref, 2);
      return <div data-testid="surface" ref={ref} />;
    }
    const { getByTestId } = render(<Harness />);
    const surface = getByTestId('surface');
    fireEvent.touchStart(surface, { touches: [{ clientY: 500 }] });
    fireEvent.touchMove(surface, { touches: [{ clientY: 300 }] });
    expect(store.getState().target).toBeGreaterThan(0);
  });
});
