/** Animated solar corona on a camera-facing quad (additive). */
export const coronaVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const coronaFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uDisc;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r >= 1.0) discard;
    vec2 dir = p / max(r, 1e-4);
    // Seamless in angle: sample noise on the direction circle, streaming outward over time.
    float streamers = noise(dir * 3.0 + vec2(uTime * 0.04, 0.0)) * 0.6
                    + noise(dir * 9.0 + vec2(0.0, r * 2.0 - uTime * 0.08)) * 0.4;
    float t = clamp((r - uDisc) / (1.0 - uDisc), 0.0, 1.0);
    float falloff = pow(1.0 - t, 3.0);
    float glow = falloff * (0.55 + 0.9 * streamers) * uIntensity;
    vec3 color = mix(vec3(1.0, 0.92, 0.78), vec3(1.0, 0.62, 0.32), t);
    gl_FragColor = vec4(color * glow, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
