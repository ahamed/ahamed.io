import type { DroneParams } from './drone';
import type { PlasmaParams } from './plasma';

/** A looping noise buffer: white, or brown (integrated, darker) for the drone's hiss. */
function noiseSource(ctx: BaseAudioContext, brown: boolean): AudioBufferSourceNode {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = brown ? (last + 0.02 * white) / 1.02 : white;
    data[i] = brown ? last * 3.5 : white;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function lfo(ctx: BaseAudioContext, hz: number, depth: number, target: AudioParam): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.frequency.value = hz;
  const gain = ctx.createGain();
  gain.gain.value = depth;
  osc.connect(gain);
  gain.connect(target);
  return osc;
}

/** Builds and starts the drone into `destination`, fading in from silence. */
export function buildDrone(
  ctx: BaseAudioContext,
  destination: AudioNode,
  params: DroneParams,
): AudioScheduledSourceNode[] {
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(params.gain, now + params.fadeIn);
  out.connect(destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = params.filter.hz;
  filter.connect(out);

  const sources: AudioScheduledSourceNode[] = [];
  for (const voice of params.oscillators) {
    const osc = ctx.createOscillator();
    osc.type = voice.type;
    osc.frequency.value = voice.hz;
    osc.detune.value = voice.detune;
    const level = ctx.createGain();
    level.gain.value = voice.level;
    osc.connect(level);
    level.connect(filter);
    sources.push(osc);
  }
  sources.push(lfo(ctx, params.filter.lfoHz, params.filter.sweepHz, filter.frequency));
  sources.push(lfo(ctx, params.ampLfo.hz, params.ampLfo.depth * params.gain, out.gain));

  const hiss = noiseSource(ctx, true);
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'lowpass';
  hissFilter.frequency.value = params.noise.lowpassHz;
  const hissGain = ctx.createGain();
  // Relative to the drone's own output gain, so the hiss lands at noise.gain overall.
  hissGain.gain.value = params.noise.gain / params.gain;
  hiss.connect(hissFilter);
  hissFilter.connect(hissGain);
  hissGain.connect(out);
  sources.push(hiss);

  for (const source of sources) source.start(now);
  return sources;
}

/** Builds and starts the plasma texture, silent until its returned gain is raised. */
export function buildPlasma(
  ctx: BaseAudioContext,
  destination: AudioNode,
  params: PlasmaParams,
): { gain: GainNode; sources: AudioScheduledSourceNode[] } {
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.connect(destination);

  const tone = ctx.createOscillator();
  tone.frequency.value = params.tone.hz;
  const toneGain = ctx.createGain();
  toneGain.gain.value = params.tone.level;
  tone.connect(toneGain);
  toneGain.connect(out);
  const glide = lfo(ctx, params.tone.lfoHz, params.tone.glide, tone.frequency);

  const noise = noiseSource(ctx, false);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = params.noise.bandHz;
  band.Q.value = params.noise.q;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = params.noise.level;
  noise.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(out);

  const sources = [tone, glide, noise];
  for (const source of sources) source.start(now);
  return { gain: out, sources };
}
