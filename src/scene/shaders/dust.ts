/**
 * Speed-dust streaks. Each particle is a two-vertex segment (tail = 0 head, 1 tail). The
 * base position repeats every uBox and is wrapped around the camera (mirrors `wrapInto` in
 * space/dust.ts); the tail trails behind along +Z, opposite the direction of travel.
 */
export const dustVertex = /* glsl */ `
  attribute float tail;
  uniform float uBox;
  uniform float uStretch;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec3 p = position - cameraPosition + uBox * 0.5;
    p = p - floor(p / uBox) * uBox - uBox * 0.5 + cameraPosition;
    p.z += tail * uStretch;
    float d = length(p - cameraPosition);
    float far = 1.0 - smoothstep(uBox * 0.25, uBox * 0.5, d);
    float near = smoothstep(1.0, 4.0, d);
    vAlpha = uOpacity * far * near * (1.0 - tail * 0.85);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

export const dustFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(vec3(0.75, 0.82, 0.9) * vAlpha, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
