import { arrokothLobes } from './arrokothLobes';
import { Rock } from './Rock';

/** Arrokoth: a reddish contact binary of two flattened seeded lobes joined at a narrow neck. */
export function Arrokoth({ radius }: { radius: number }) {
  return (
    <group name="arrokoth" rotation={[0.3, 0.6, 0.2]}>
      {arrokothLobes(radius).map((lobe) => (
        <group key={lobe.preset} position={[lobe.x, 0, 0]}>
          <Rock preset={lobe.preset} radius={lobe.radius} />
        </group>
      ))}
    </group>
  );
}
