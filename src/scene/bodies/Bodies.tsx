import { Suspense } from 'react';
import type { BodyId } from '../../content/schema';
import type { Route } from '../../journey/route';
import { Earth } from './Earth';
import { Moon } from './Moon';

const BODY_COMPONENTS: Record<BodyId, (props: { radius: number }) => React.JSX.Element> = {
  earth: Earth,
  moon: Moon,
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
