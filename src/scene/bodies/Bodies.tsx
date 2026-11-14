import { Suspense } from 'react';
import type { BodyId } from '../../content/schema';
import type { Route } from '../../journey/route';
import { Earth } from './Earth';
import { Mars } from './Mars';
import { Moon } from './Moon';
import { Rock } from './Rock';
import type { RockPresetId } from './rockShape';

type BodyComponent = (props: { radius: number }) => React.JSX.Element;

/** Small moons and hero asteroids are seeded rocks, one shape preset each. */
const rock =
  (preset: RockPresetId): BodyComponent =>
  ({ radius }) => <Rock preset={preset} radius={radius} />;

const BODY_COMPONENTS: Record<BodyId, BodyComponent> = {
  earth: Earth,
  moon: Moon,
  mars: Mars,
  phobos: rock('phobos'),
  deimos: rock('deimos'),
  ceres: rock('ceres'),
  vesta: rock('vesta'),
  pallas: rock('pallas'),
  hygiea: rock('hygiea'),
};

/** Untextured stand-in while a body's maps load. */
function Placeholder({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshStandardMaterial color="#2a3340" roughness={1} />
    </mesh>
  );
}

export function Bodies({ route }: { route: Route }) {
  return (
    <>
      {route.bodies.map(({ id, body, radius, position }) => {
        const Body = BODY_COMPONENTS[body];
        return (
          <group key={id} name={`body-${id}`} position={position}>
            <Suspense fallback={<Placeholder radius={radius} />}>
              <Body radius={radius} />
            </Suspense>
          </group>
        );
      })}
    </>
  );
}
