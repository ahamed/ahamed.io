import { SUN_DIRECTION } from './space/sunDirection';

const KEY_DISTANCE = 50;
const KEY_POSITION: [number, number, number] = [
  SUN_DIRECTION[0] * KEY_DISTANCE,
  SUN_DIRECTION[1] * KEY_DISTANCE,
  SUN_DIRECTION[2] * KEY_DISTANCE,
];

/** Faint ambient fill plus the sunlight key, shared by the voyage and the inspector. */
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={KEY_POSITION} intensity={2.6} />
    </>
  );
}
