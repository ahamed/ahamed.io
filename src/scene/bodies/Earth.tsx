import { useKtx2 } from '../ktx2';
import { Atmosphere } from './Atmosphere';
import { Spinning } from './Spinning';

export function Earth({ radius }: { radius: number }) {
  // The day map is sRGB-encoded; the cloud map is a linear mask.
  const [day, clouds] = useKtx2(['2k_earth_daymap', '2k_earth_clouds']);

  return (
    <group rotation={[0.41, 0, 0]}>
      <Spinning spin="earth">
        <mesh>
          <sphereGeometry args={[radius, 128, 64]} />
          <meshStandardMaterial map={day} roughness={0.85} metalness={0} />
        </mesh>
      </Spinning>
      <Spinning spin="earth-clouds">
        <mesh>
          <sphereGeometry args={[radius * 1.012, 128, 64]} />
          <meshStandardMaterial alphaMap={clouds} transparent depthWrite={false} color="#ffffff" />
        </mesh>
      </Spinning>
      <Atmosphere name="earth-atmosphere" radius={radius} scale={1.1} color="#5ab4ff" />
    </group>
  );
}
