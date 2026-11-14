import { useKtx2 } from '../ktx2';

export function Moon({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_moon']);
  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <sphereGeometry args={[radius, 96, 48]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}
