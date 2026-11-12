import { useMemo } from 'react';
import { DoubleSide, Vector2 } from 'three';

const DISH_RADIUS = 0.9;
const DISH_DEPTH = 0.22;
const DISH_SEGMENTS = 64;

/** Parabolic dish profile (front face toward +Z once rotated). */
function useDishProfile(): Vector2[] {
  return useMemo(() => {
    const points: Vector2[] = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const r = (i / steps) * DISH_RADIUS;
      points.push(new Vector2(r, (r * r * DISH_DEPTH) / (DISH_RADIUS * DISH_RADIUS)));
    }
    return points;
  }, []);
}

const FOIL = { color: '#c9a24a', metalness: 0.9, roughness: 0.35 } as const;
const METAL = { color: '#8d939b', metalness: 0.85, roughness: 0.4 } as const;
const DISH = { color: '#e8e6e1', metalness: 0.15, roughness: 0.55 } as const;

/**
 * First-pass procedural Voyager 1. Travels toward -Z with its high-gain antenna facing back
 * toward Earth (+Z), so the chase camera sees the dish. M2 adds the detailed model.
 */
export function Voyager(props: { position?: [number, number, number] }) {
  const dishProfile = useDishProfile();

  return (
    <group {...props} scale={0.45}>
      {/* High-gain antenna: lathe opens along +Y, rotated to face +Z. */}
      <mesh name="hga" rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]}>
        <latheGeometry args={[dishProfile, DISH_SEGMENTS]} />
        <meshStandardMaterial {...DISH} side={DoubleSide} />
      </mesh>
      <mesh name="feed" position={[0, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>

      {/* Ten-sided bus behind the dish. */}
      <mesh name="bus" rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.48, 0.48, 0.38, 10]} />
        <meshStandardMaterial {...FOIL} />
      </mesh>

      {/* RTG boom with three generator canisters. */}
      <mesh name="rtg-boom" position={[-1.1, -0.15, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {[-1.45, -1.7, -1.95].map((x) => (
        <mesh key={x} name="rtg" position={[x, -0.15, -0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.22, 16]} />
          <meshStandardMaterial color="#3b3f45" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}

      {/* Science boom with the scan platform. */}
      <mesh name="science-boom" position={[1.05, 0.05, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh name="scan-platform" position={[1.85, 0.05, -0.1]}>
        <boxGeometry args={[0.28, 0.22, 0.22]} />
        <meshStandardMaterial {...FOIL} />
      </mesh>

      {/* Long magnetometer boom, angled up and out. */}
      <mesh name="mag-boom" position={[1.6, 1.35, -0.2]} rotation={[0, 0, -Math.PI / 4.5]}>
        <cylinderGeometry args={[0.012, 0.012, 3.6, 6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  );
}
