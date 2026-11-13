/** Star points at infinity: constant pixel size, soft round dots, gentle twinkle. */
export const starsVertex = /* glsl */ `
  attribute float size;
  attribute vec3 aColor;
  attribute float phase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uRadius;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * uRadius, 1.0);
    gl_PointSize = max(1.0, size * uPixelRatio);
    float rate = 0.6 + fract(phase * 7.13) * 1.6;
    float twinkle = 1.0 - 0.25 * (0.5 + 0.5 * sin(uTime * rate + phase));
    // Sub-pixel stars are drawn as one pixel, dimmer, so faint stars stay faint.
    vAlpha = twinkle * clamp(size / 1.4, 0.3, 1.0);
    vColor = aColor;
  }
`;

export const starsFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
