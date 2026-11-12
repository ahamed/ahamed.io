import { useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';

export function Moon({ radius }: { radius: number }) {
  const map = useTexture('/textures/2k_moon.jpg', (texture) => {
    texture.colorSpace = SRGBColorSpace;
  });
  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <sphereGeometry args={[radius, 96, 48]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}
