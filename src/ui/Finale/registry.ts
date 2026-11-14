/** The finale layer's root element, which the camera rig writes per-frame CSS vars onto. */
export const finaleLayer: { element: HTMLElement | null } = { element: null };

export function registerFinale(element: HTMLElement | null): void {
  finaleLayer.element = element;
}
