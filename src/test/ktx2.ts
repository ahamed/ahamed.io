/**
 * A `useKtx2` stand-in that suspends forever, like a texture that never finishes loading in
 * jsdom, so bodies render their untextured placeholders. Use with:
 * `vi.mock('<path>/ktx2', () => import('<path>/test/ktx2'))`.
 */
const pending = new Promise<never>(() => undefined);

export const BASIS_PATH = '/basis/';
export const textureUrl = (name: string): string => `/textures/${name}.ktx2`;

export function useKtx2(): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- Suspense contract
  throw pending;
}
