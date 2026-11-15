import { DataTexture, Material, MeshPhysicalMaterial, NoColorSpace, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createVoyagerMaterials } from './materials';
import { MATERIAL_SLOTS } from './parts';

describe('createVoyagerMaterials', () => {
  it('provides a material for every slot', () => {
    const set = createVoyagerMaterials(null);
    for (const slot of MATERIAL_SLOTS) expect(set.slots[slot]).toBeInstanceOf(Material);
    set.dispose();
  });

  it('makes gold foil physical, with crinkle normal and roughness data maps', () => {
    const set = createVoyagerMaterials(null);
    const foil = set.slots.foil;
    expect(foil).toBeInstanceOf(MeshPhysicalMaterial);
    expect(foil.normalMap).toBeInstanceOf(DataTexture);
    expect(foil.roughnessMap).toBeInstanceOf(DataTexture);
    expect(foil.normalMap?.colorSpace).toBe(NoColorSpace);
    expect(foil.roughnessMap?.colorSpace).toBe(NoColorSpace);
    set.dispose();
  });

  it('keeps the dish a matte mid-grey that does not outshine the bus', () => {
    const set = createVoyagerMaterials(null);
    const dish = set.slots.dish;
    const metal = set.slots.metal;
    const { r, g, b } = dish.color; // linear
    expect(0.2126 * r + 0.7152 * g + 0.0722 * b).toBeLessThanOrEqual(0.3);
    expect(dish.metalness).toBeLessThanOrEqual(0.1);
    expect(dish.envMapIntensity).toBeLessThan(metal.envMapIntensity);
    set.dispose();
  });

  it('gives the Golden Record a groove roughness map', () => {
    const set = createVoyagerMaterials(null);
    expect(set.slots.record.roughnessMap).toBeInstanceOf(DataTexture);
    set.dispose();
  });

  it('applies the given environment to every Voyager material', () => {
    const env = new Texture();
    const set = createVoyagerMaterials(env);
    for (const slot of MATERIAL_SLOTS) {
      expect(set.slots[slot].envMap, slot).toBe(env);
    }
    set.dispose();
  });

  it('can swap the environment in later, and clear it', () => {
    const set = createVoyagerMaterials(null);
    const env = new Texture();
    set.setEnvironment(env);
    for (const slot of MATERIAL_SLOTS) expect(set.slots[slot].envMap, slot).toBe(env);
    set.setEnvironment(null);
    for (const slot of MATERIAL_SLOTS) expect(set.slots[slot].envMap, slot).toBeNull();
    set.dispose();
  });

  it('disposes every material and texture it created', () => {
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const textureSpy = vi.spyOn(Texture.prototype, 'dispose');
    const set = createVoyagerMaterials(null);
    const materials = Object.values(set.slots);
    const textures = [
      set.slots.foil.normalMap,
      set.slots.foil.roughnessMap,
      set.slots.record.roughnessMap,
    ];
    set.dispose();
    for (const m of materials) expect(materialSpy.mock.contexts).toContain(m);
    for (const t of textures) expect(textureSpy.mock.contexts).toContain(t);
  });
});
