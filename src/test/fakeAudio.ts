/** Minimal recording fake of the Web Audio API surface the app uses (tests only). */
export interface Call {
  node: string;
  method: string;
  args: unknown[];
}

export function createFakeAudioContext() {
  const calls: Call[] = [];
  let state: AudioContextState = 'suspended';
  let id = 0;
  const param = (node: string, name: string) => ({
    value: 0,
    setValueAtTime: (...args: unknown[]) => calls.push({ node, method: `${name}.set`, args }),
    linearRampToValueAtTime: (...args: unknown[]) =>
      calls.push({ node, method: `${name}.linear`, args }),
    exponentialRampToValueAtTime: (...args: unknown[]) =>
      calls.push({ node, method: `${name}.exp`, args }),
    setTargetAtTime: (...args: unknown[]) => calls.push({ node, method: `${name}.target`, args }),
    cancelScheduledValues: (...args: unknown[]) =>
      calls.push({ node, method: `${name}.cancel`, args }),
  });
  const node = (kind: string) => {
    const name = `${kind}${String(id++)}`;
    return {
      name,
      connect: (dest: unknown) => {
        calls.push({ node: name, method: 'connect', args: [dest] });
        return dest;
      },
      disconnect: () => calls.push({ node: name, method: 'disconnect', args: [] }),
      start: (...args: unknown[]) => calls.push({ node: name, method: 'start', args }),
      stop: (...args: unknown[]) => calls.push({ node: name, method: 'stop', args }),
    };
  };
  const ctx = {
    currentTime: 1,
    sampleRate: 8000,
    destination: { kind: 'destination' },
    get state() {
      return state;
    },
    resume: () => {
      state = 'running';
      calls.push({ node: 'ctx', method: 'resume', args: [] });
      return Promise.resolve();
    },
    close: () => {
      state = 'closed';
      calls.push({ node: 'ctx', method: 'close', args: [] });
      return Promise.resolve();
    },
    createOscillator: () => {
      const n = node('osc');
      return {
        ...n,
        type: 'sine' as OscillatorType,
        frequency: param(n.name, 'frequency'),
        detune: param(n.name, 'detune'),
      };
    },
    createGain: () => {
      const n = node('gain');
      return { ...n, gain: param(n.name, 'gain') };
    },
    createBiquadFilter: () => {
      const n = node('filter');
      return {
        ...n,
        type: 'lowpass' as BiquadFilterType,
        frequency: param(n.name, 'frequency'),
        Q: param(n.name, 'Q'),
      };
    },
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      const n = node('source');
      return { ...n, buffer: null as unknown, loop: false };
    },
  };
  return { ctx: ctx as unknown as AudioContext, calls };
}
