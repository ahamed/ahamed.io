import {
  BackSide,
  BufferAttribute,
  Color,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  Vector3,
  type Texture,
  type WebGLRenderer,
} from 'three';

export interface SpaceEnvironment {
  texture: Texture;
  dispose: () => void;
}

/** Matches the key light in Voyage.tsx so reflections and highlights agree. */
const SUN_DIRECTION = new Vector3(-40, 18, 30).normalize();
const SKY_BOTTOM = new Color('#0a0f1a');
const SKY_TOP = new Color('#22324f');

function skyDome(): Mesh {
  const geometry = new SphereGeometry(10, 32, 16);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const c = new Color();
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) / 10 + 1) / 2;
    c.lerpColors(SKY_BOTTOM, SKY_TOP, t).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: BackSide }));
}

function glow(direction: Vector3, radius: number, color: Color): Mesh {
  const mesh = new Mesh(
    new SphereGeometry(radius, 16, 8),
    new MeshBasicMaterial({ color, side: BackSide }),
  );
  mesh.position.copy(direction).multiplyScalar(8);
  return mesh;
}

/**
 * Builds a tiny in-code space environment (dark gradient sky, warm sun patch, faint Earth-blue
 * fill) and prefilters it once with PMREM. Returns null without a renderer (e.g. in jsdom).
 * No files or network requests are involved.
 */
export function createSpaceEnvironment(
  renderer: WebGLRenderer | null,
  makePmrem: (renderer: WebGLRenderer) => PMREMGenerator = (r) => new PMREMGenerator(r),
): SpaceEnvironment | null {
  if (!renderer) return null;

  const scene = new Scene();
  const sun = new Color('#ffd9a0').multiplyScalar(8);
  const fill = new Color('#2f5f94').multiplyScalar(1.4);
  scene.add(
    skyDome(),
    glow(SUN_DIRECTION, 0.9, sun),
    glow(SUN_DIRECTION.clone().negate(), 3, fill),
  );

  const generator = makePmrem(renderer);
  try {
    const target = generator.fromScene(scene, 0.04);
    return {
      texture: target.texture,
      dispose: () => {
        target.dispose();
      },
    };
  } catch {
    // Reflections are optional: without a usable GPU context (test renderers, lost
    // contexts) Voyager renders with its lights alone.
    return null;
  } finally {
    generator.dispose();
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        (object.geometry as SphereGeometry).dispose();
        (object.material as MeshBasicMaterial).dispose();
      }
    });
  }
}
