import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';

/** Test helper: puts the default camera at world z (2.2 above the path, like the chase cam). */
export function CameraAt({ z }: { z: number }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 2.2, z);
    camera.updateMatrixWorld();
  }, [camera, z]);
  return null;
}
