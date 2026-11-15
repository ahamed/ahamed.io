import { useKtx2 } from '../ktx2';
import { Spinning } from './Spinning';

export function Moon({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_moon']);
  return (
    <group rotation={[0, Math.PI, 0]}>
      <Spinning spin="moon">
        <mesh>
          <sphereGeometry args={[radius, 96, 48]} />
          <meshStandardMaterial map={map} roughness={1} metalness={0} />
        </mesh>
      </Spinning>
    </group>
  );
}
