/**
 * Pure, seeded texture data for Voyager's materials (no three.js imports).
 * Every generator is deterministic for a given seed and returns tileable data.
 */

import { mulberry32 } from '../random';

const CELLS = 7;

/**
 * Crinkled-foil height field: tileable Worley creases (F2 − F1) plus a little value noise,
 * normalised to [0, 1]. Length is size².
 */
export function crinkleHeight(size: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const points = new Float32Array(CELLS * CELLS * 2);
  for (let i = 0; i < points.length; i++) points[i] = rand();
  const jitter = new Float32Array(size * size);
  for (let i = 0; i < jitter.length; i++) jitter[i] = rand();

  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * CELLS;
      const v = (y / size) * CELLS;
      const cu = Math.floor(u);
      const cv = Math.floor(v);
      let f1 = Infinity;
      let f2 = Infinity;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const gx = cu + ox;
          const gy = cv + oy;
          const wx = ((gx % CELLS) + CELLS) % CELLS;
          const wy = ((gy % CELLS) + CELLS) % CELLS;
          const k = (wy * CELLS + wx) * 2;
          const px = gx + (points[k] ?? 0);
          const py = gy + (points[k + 1] ?? 0);
          const d = Math.hypot(px - u, py - v);
          if (d < f1) {
            f2 = f1;
            f1 = d;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
      out[y * size + x] = Math.min(1, f2 - f1) * 0.85 + (jitter[y * size + x] ?? 0) * 0.15;
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (const value of out) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const range = max - min || 1;
  for (let i = 0; i < out.length; i++) out[i] = ((out[i] ?? 0) - min) / range;
  return out;
}

const toByte = (n: number) => Math.round((n * 0.5 + 0.5) * 255);

/** Tangent-space normal map (RGBA8) from a tileable height field, via central differences. */
export function heightToNormalRGBA(
  height: Float32Array,
  size: number,
  strength: number,
): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) =>
    height[(((y + size) % size) * size + ((x + size) % size)) | 0] ?? 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * 0.5 * size * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * 0.5 * size * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out[i] = toByte(-dx / len);
      out[i + 1] = toByte(-dy / len);
      out[i + 2] = toByte(1 / len);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Roughness map (RGBA8, roughness in G as three.js samples it) remapped into [min, max]. */
export function roughnessRGBA(
  height: Float32Array,
  size: number,
  min: number,
  max: number,
): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const r = Math.round((min + (height[i] ?? 0) * (max - min)) * 255);
    out[i * 4] = r;
    out[i * 4 + 1] = r;
    out[i * 4 + 2] = r;
    out[i * 4 + 3] = 255;
  }
  return out;
}

const GROOVES = 24;

/** Golden Record roughness (RGBA8): fine concentric grooves, a function of radius only. */
export function grooveRGBA(size: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.sqrt((x - c) ** 2 + (y - c) ** 2) / c;
      const label = r < 0.32;
      const groove = 0.5 + 0.5 * Math.sin(r * GROOVES * Math.PI * 2);
      const rough = label ? 0.55 : 0.18 + groove * 0.22;
      const v = Math.round(rough * 255);
      const i = (y * size + x) * 4;
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  }
  return out;
}
