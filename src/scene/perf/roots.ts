/**
 * Objects whose render targets count toward texture memory (the post-processing composer).
 * Registering is a Set insert, so it costs nothing when ?perf is off.
 */
export const perfRoots = new Set<object>();

export const listRoots = (): readonly unknown[] => [...perfRoots];
