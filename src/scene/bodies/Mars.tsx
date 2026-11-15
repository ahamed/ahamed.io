import { useKtx2 } from '../ktx2';
import { Atmosphere } from './Atmosphere';
import { Spinning } from './Spinning';

/** Mars: KTX2 surface map plus a thin dusty-orange atmosphere rim. */
export function Mars({ radius }: { radius: number }) {
  const [map] = useKtx2(['2k_mars']);
  return (
    <group rotation={[0.44, 0, 0]}>
      <Spinning spin="mars">
        <mesh name="mars-surface">
          <sphereGeometry args={[radius, 128, 64]} />
          <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
        </mesh>
      </Spinning>
      <Atmosphere
        name="mars-atmosphere"
        radius={radius}
        scale={1.06}
        color="#f2a06a"
        innerPower={12}
        intensity={0.6}
      />
    </group>
  );
}
