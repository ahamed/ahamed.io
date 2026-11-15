export interface AtmosphereShape {
  /** Shell radius over planet radius (> 1). */
  scale: number;
  /** Outer falloff exponent: higher fades into space sooner. */
  power: number;
  /** Inner falloff exponent: higher keeps the haze closer to the limb. */
  innerPower: number;
}

/**
 * How far from the planet's centre (in planet radii) the view ray passes, given |N·V| where it
 * meets the shell. Along any ray, N·V on a sphere of radius s is sqrt(1 - (b/s)²) for impact
 * parameter b, so this holds under perspective too. The planet's limb is at 1.
 */
export function impactRadius(nDotV: number, scale: number): number {
  return Math.sqrt(Math.max(1 - nDotV * nDotV, 0)) * scale;
}

/**
 * Glow strength (0–1) for a view ray passing `rho` planet radii from the centre. It peaks at the
 * limb, fades to zero at the shell edge so the halo blurs into space, and hazes only the rim of
 * the disc. The GLSL below mirrors this.
 */
export function atmosphereGlow(rho: number, { scale, power, innerPower }: AtmosphereShape): number {
  if (rho >= 1) {
    const altitude = Math.min((rho - 1) / (scale - 1), 1);
    return Math.pow(1 - altitude, power);
  }
  return Math.pow(Math.max(rho, 0), innerPower);
}

/** Front faces of a shell around a planet: a halo in space that also hazes the disc's rim. */
export const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uScale;
  uniform float uPower;
  uniform float uInnerPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float d = abs(dot(normalize(vNormal), normalize(vViewDir)));
    float rho = sqrt(max(1.0 - d * d, 0.0)) * uScale;
    // Continuous across the limb (1 on both sides), so no seam shows at the planet's edge.
    float glow = rho >= 1.0
      ? pow(1.0 - min((rho - 1.0) / (uScale - 1.0), 1.0), uPower)
      : pow(rho, uInnerPower);
    gl_FragColor = vec4(uColor * glow * uIntensity, 1.0);
  }
`;
