import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it } from 'vitest';
import { Voyager } from './Voyager';

describe('Voyager', () => {
  it('has the recognisable Voyager 1 parts', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    const names = renderer.scene
      .findAll((node) => node.type === 'Mesh')
      .map((m) => m.instance.name);
    for (const part of ['hga', 'bus', 'rtg-boom', 'mag-boom', 'science-boom']) {
      expect(names).toContain(part);
    }
    await renderer.unmount();
  });
});
