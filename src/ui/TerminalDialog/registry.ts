/** Dialog elements by stop id, so the frame loop can write position/scale CSS vars directly. */
export const dialogElements = new Map<string, HTMLElement>();

/**
 * Each dialog's unscaled layout size (CSS px) by stop id, kept current by a ResizeObserver so
 * the frame loop never reads layout. Missing or zero until the dialog has been laid out.
 */
export const dialogSizes = new Map<string, { w: number; h: number }>();

let observer: ResizeObserver | null | undefined;
const idOf = new WeakMap<Element, string>();

function sizeObserver(): ResizeObserver | null {
  observer ??=
    typeof ResizeObserver === 'function'
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            const id = idOf.get(entry.target);
            const element = entry.target as HTMLElement;
            if (id) dialogSizes.set(id, { w: element.offsetWidth, h: element.offsetHeight });
          }
        })
      : null;
  return observer;
}

/** Registers (or, with `null`, unregisters) the element of stop `id`. */
export function registerDialog(id: string, element: HTMLElement | null): void {
  const previous = dialogElements.get(id);
  if (previous && previous !== element) sizeObserver()?.unobserve(previous);
  if (element) {
    dialogElements.set(id, element);
    idOf.set(element, id);
    sizeObserver()?.observe(element);
  } else {
    dialogElements.delete(id);
    dialogSizes.delete(id);
  }
}
