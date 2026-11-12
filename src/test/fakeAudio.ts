/** Minimal recording fake of the Web Audio API surface the app uses (tests only). */
export interface Call {
  node: string;
  method: string;
  args: unknown[];
}

export function createFakeAudioContext() {
  const calls: Call[] = [];
  let state: AudioContextState = 'suspended';
  const param = (node: string, name: string) => ({
    value: 0,
    setValueAtTime: (...args: unknown[]) => calls.push({ node, method: `${name}.set`, args }),
    linearRampToValueAtTime: (...args: unknown[]) =>
      calls.push({ node, method: `${name}.linear`, args }),
    exponentialRampToValueAtTime: (...args: unknown[]) =>
      calls.push({ node, method: `${name}.exp`, args }),
  });
  let id = 0;
  const ctx = {
    currentTime: 1,
    destination: { kind: 'destination' },
    get state() {
      return state;
    },
    resume: () => {
      state = 'running';
      calls.push({ node: 'ctx', method: 'resume', args: [] });
      return Promise.resolve();
    },
    createOscillator: () => {
      const node = `osc${String(id++)}`;
      return {
        type: 'sine' as OscillatorType,
        frequency: param(node, 'frequency'),
        connect: (dest: unknown) => {
          calls.push({ node, method: 'connect', args: [dest] });
          return dest;
        },
        start: (...args: unknown[]) => calls.push({ node, method: 'start', args }),
        stop: (...args: unknown[]) => calls.push({ node, method: 'stop', args }),
      };
    },
    createGain: () => {
      const node = `gain${String(id++)}`;
      return {
        gain: param(node, 'gain'),
        connect: (dest: unknown) => {
          calls.push({ node, method: 'connect', args: [dest] });
          return dest;
        },
      };
    },
  };
  return { ctx: ctx as unknown as AudioContext, calls };
}
