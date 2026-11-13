/**
 * Pure part list for the procedural Voyager 1 (no three.js imports).
 *
 * Model space is unscaled: the high-gain antenna faces +Z (back toward Earth), the craft
 * travels toward −Z, the RTG boom points −X, the science boom +X and the magnetometer boom
 * up and out to +X+Y. Parts in a moving group are positioned relative to that group's pivot.
 */

export type Vec3 = readonly [number, number, number];

export const MATERIAL_SLOTS = ['foil', 'metal', 'dish', 'dark', 'record', 'black'] as const;
export type MaterialSlot = (typeof MATERIAL_SLOTS)[number];

export const MOTION_GROUPS = ['static', 'scan', 'whip-l', 'whip-r', 'mag-tip'] as const;
export type MotionGroup = (typeof MOTION_GROUPS)[number];
export type MovingGroup = Exclude<MotionGroup, 'static'>;

export type Shape =
  | { kind: 'cylinder'; radiusTop: number; radiusBottom: number; height: number; segments: number }
  | { kind: 'cone'; radius: number; height: number; segments: number }
  | { kind: 'box'; width: number; height: number; depth: number }
  | { kind: 'sphere'; radius: number; widthSegments: number; heightSegments: number }
  | {
      kind: 'torus';
      radius: number;
      tube: number;
      radialSegments: number;
      tubularSegments: number;
    }
  | { kind: 'lathe'; profile: readonly (readonly [number, number])[]; segments: number };

export interface PartSpec {
  id: string;
  shape: Shape;
  position: Vec3;
  /** Euler angles, XYZ order (three.js default). */
  rotation: Vec3;
  material: MaterialSlot;
  group: MotionGroup;
}

// ---------------------------------------------------------------------------------------------
// Small vector helpers
// ---------------------------------------------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1));
const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));

/** Euler XYZ that turns +Y onto the unit direction `d`. */
function alignY(d: Vec3): Vec3 {
  const [dx, dy, dz] = normalize(d);
  return [Math.atan2(dz, dy), 0, -Math.asin(Math.max(-1, Math.min(1, dx)))];
}

/** Applies Euler XYZ (matrix Rx·Ry·Rz) to a vector. */
function rotate(v: Vec3, r: Vec3): Vec3 {
  const [x0, y0, z0] = v;
  const [ax, ay, az] = r;
  // Rz
  const x1 = x0 * Math.cos(az) - y0 * Math.sin(az);
  const y1 = x0 * Math.sin(az) + y0 * Math.cos(az);
  const z1 = z0;
  // Ry
  const x2 = x1 * Math.cos(ay) + z1 * Math.sin(ay);
  const z2 = -x1 * Math.sin(ay) + z1 * Math.cos(ay);
  const y2 = y1;
  // Rx
  const y3 = y2 * Math.cos(ax) - z2 * Math.sin(ax);
  const z3 = y2 * Math.sin(ax) + z2 * Math.cos(ax);
  return [x2, y3, z3];
}

// ---------------------------------------------------------------------------------------------
// Part builders
// ---------------------------------------------------------------------------------------------

type Opts = Pick<PartSpec, 'material' | 'group'>;
const STATIC_METAL: Opts = { material: 'metal', group: 'static' };

function beam(
  id: string,
  from: Vec3,
  to: Vec3,
  radius: number,
  opts: Opts = STATIC_METAL,
  segments = 6,
): PartSpec {
  const dir = sub(to, from);
  return {
    id,
    shape: {
      kind: 'cylinder',
      radiusTop: radius,
      radiusBottom: radius,
      height: length(dir),
      segments,
    },
    position: lerp(from, to, 0.5),
    rotation: alignY(dir),
    ...opts,
  };
}

function box(
  id: string,
  size: Vec3,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
  opts: Opts = STATIC_METAL,
): PartSpec {
  return {
    id,
    shape: { kind: 'box', width: size[0], height: size[1], depth: size[2] },
    position,
    rotation,
    ...opts,
  };
}

function cylinder(
  id: string,
  radius: number,
  height: number,
  position: Vec3,
  rotation: Vec3,
  opts: Opts = STATIC_METAL,
  segments = 16,
): PartSpec {
  return {
    id,
    shape: { kind: 'cylinder', radiusTop: radius, radiusBottom: radius, height, segments },
    position,
    rotation,
    ...opts,
  };
}

/** Three longerons in a triangular section plus battens and diagonals between two points. */
function truss(
  prefix: string,
  from: Vec3,
  to: Vec3,
  options: { radius: number; bays: number; rod: number; mainId: string },
): PartSpec[] {
  const d = normalize(sub(to, from));
  // Two unit vectors perpendicular to d.
  const helper: Vec3 = Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = normalize([
    d[1] * helper[2] - d[2] * helper[1],
    d[2] * helper[0] - d[0] * helper[2],
    d[0] * helper[1] - d[1] * helper[0],
  ]);
  const e2: Vec3 = [
    d[1] * e1[2] - d[2] * e1[1],
    d[2] * e1[0] - d[0] * e1[2],
    d[0] * e1[1] - d[1] * e1[0],
  ];
  const corner = (j: number): Vec3 => {
    const a = (Math.PI * 2 * j) / 3 + Math.PI / 2;
    return add(scale(e1, Math.cos(a) * options.radius), scale(e2, Math.sin(a) * options.radius));
  };

  const parts: PartSpec[] = [];
  for (let j = 0; j < 3; j++) {
    const id = j === 0 ? options.mainId : `${prefix}-longeron-${String(j)}`;
    parts.push(
      beam(id, add(from, corner(j)), add(to, corner(j)), options.rod * 1.4, STATIC_METAL, 4),
    );
  }
  for (let k = 0; k <= options.bays; k++) {
    const station = lerp(from, to, k / options.bays);
    for (let j = 0; j < 3; j++) {
      parts.push(
        beam(
          `${prefix}-batten-${String(k)}-${String(j)}`,
          add(station, corner(j)),
          add(station, corner((j + 1) % 3)),
          options.rod,
          STATIC_METAL,
          4,
        ),
      );
    }
  }
  for (let k = 0; k < options.bays; k++) {
    const a = lerp(from, to, k / options.bays);
    const b = lerp(from, to, (k + 1) / options.bays);
    for (let j = 0; j < 3; j++) {
      parts.push(
        beam(
          `${prefix}-diag-${String(k)}-${String(j)}`,
          add(a, corner(j)),
          add(b, corner((j + 1) % 3)),
          options.rod * 0.6,
          STATIC_METAL,
          4,
        ),
      );
    }
  }
  return parts;
}

// ---------------------------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------------------------

const DISH_RADIUS = 0.9;
const DISH_DEPTH = 0.22;
const DISH_Z = 0.25;
const dishZ = (r: number) => DISH_Z + (r * r * DISH_DEPTH) / (DISH_RADIUS * DISH_RADIUS);
const RIM_Z = dishZ(DISH_RADIUS);
const SUB_Z = 0.97;

const BUS_RADIUS = 0.48;
const BUS_DEPTH = 0.38;
const BUS_Z = -0.05;
const BUS_APOTHEM = BUS_RADIUS * Math.cos(Math.PI / 10);
const BUS_SIDE = 2 * BUS_RADIUS * Math.sin(Math.PI / 10);
const BUS_REAR = BUS_Z - BUS_DEPTH / 2;
const RECORD_BAY = 4;

const MAG_BASE: Vec3 = [0.35, 0.3, -0.2];
const MAG_DIR = normalize([0.643, 0.766, 0]);
const MAG_LENGTH = 3.4;
const MAG_TIP = add(MAG_BASE, scale(MAG_DIR, MAG_LENGTH));

const SCIENCE_Y = 0.05;
const SCIENCE_Z = -0.1;
const RTG_Y = -0.15;
const RTG_Z = -0.1;

const WHIP_LENGTH = 1.25;
const WHIP_L_ROOT: Vec3 = [-0.25, -0.38, -0.2];
const WHIP_R_ROOT: Vec3 = [0.25, -0.38, -0.2];
const WHIP_L_DIR = normalize([-0.75, -0.66, 0]);
const WHIP_R_DIR = normalize([0.75, -0.66, 0]);

/** Joint positions of the moving groups, in model space. */
export const PIVOTS: Record<MovingGroup, Vec3> = {
  scan: [1.75, SCIENCE_Y, SCIENCE_Z],
  'whip-l': WHIP_L_ROOT,
  'whip-r': WHIP_R_ROOT,
  'mag-tip': MAG_TIP,
};

// ---------------------------------------------------------------------------------------------
// Assemblies
// ---------------------------------------------------------------------------------------------

function antenna(): PartSpec[] {
  const profile: [number, number][] = [];
  for (let i = 0; i <= 23; i++) {
    const r = (i / 23) * DISH_RADIUS;
    profile.push([r, (r * r * DISH_DEPTH) / (DISH_RADIUS * DISH_RADIUS)]);
  }
  const parts: PartSpec[] = [
    {
      id: 'hga',
      shape: { kind: 'lathe', profile, segments: 48 },
      position: [0, 0, DISH_Z],
      rotation: [Math.PI / 2, 0, 0],
      material: 'dish',
      group: 'static',
    },
    {
      id: 'hga-rim',
      shape: {
        kind: 'torus',
        radius: DISH_RADIUS,
        tube: 0.016,
        radialSegments: 6,
        tubularSegments: 64,
      },
      position: [0, 0, RIM_Z],
      rotation: [0, 0, 0],
      ...STATIC_METAL,
    },
    cylinder('hga-hub', 0.12, 0.08, [0, 0, DISH_Z - 0.02], [Math.PI / 2, 0, 0]),
    {
      id: 'feed',
      shape: { kind: 'cone', radius: 0.07, height: 0.24, segments: 16 },
      position: [0, 0, DISH_Z + 0.14],
      rotation: [-Math.PI / 2, 0, 0],
      ...STATIC_METAL,
    },
    {
      id: 'subreflector',
      shape: { kind: 'cylinder', radiusTop: 0.06, radiusBottom: 0.13, height: 0.05, segments: 24 },
      position: [0, 0, SUB_Z],
      rotation: [-Math.PI / 2, 0, 0],
      ...STATIC_METAL,
    },
  ];
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
    const footR = 0.6;
    const foot: Vec3 = [Math.cos(a) * footR, Math.sin(a) * footR, dishZ(footR)];
    const head: Vec3 = [Math.cos(a) * 0.09, Math.sin(a) * 0.09, SUB_Z - 0.02];
    parts.push(beam(`feed-strut-${String(k)}`, foot, head, 0.012));
  }
  // Sun sensor on the dish face, next to the feed.
  parts.push(
    box('sun-sensor', [0.06, 0.04, 0.05], [0, 0.22, dishZ(0.22) + 0.03], [0, 0, 0], STATIC_METAL),
  );
  return parts;
}

function bus(): PartSpec[] {
  const parts: PartSpec[] = [
    cylinder(
      'bus',
      BUS_RADIUS,
      BUS_DEPTH,
      [0, 0, BUS_Z],
      [Math.PI / 2, 0, 0],
      { material: 'foil', group: 'static' },
      10,
    ),
  ];
  for (let k = 0; k < 10; k++) {
    const phi = ((k + 0.5) * Math.PI) / 5;
    const out: Vec3 = [Math.sin(phi), -Math.cos(phi), 0];
    const at = (d: number): Vec3 => add(scale(out, d), [0, 0, BUS_Z]);
    const rot: Vec3 = [0, 0, Math.PI + phi];
    parts.push(
      box(
        `bus-bay-${String(k)}`,
        [BUS_SIDE * 0.86, 0.02, BUS_DEPTH * 0.84],
        at(BUS_APOTHEM + 0.01),
        rot,
        {
          material: 'foil',
          group: 'static',
        },
      ),
    );
    if (k === RECORD_BAY) {
      parts.push(
        cylinder(
          'golden-record',
          0.11,
          0.008,
          at(BUS_APOTHEM + 0.026),
          rot,
          { material: 'record', group: 'static' },
          40,
        ),
        {
          id: 'golden-record-cover',
          shape: {
            kind: 'torus',
            radius: 0.118,
            tube: 0.008,
            radialSegments: 6,
            tubularSegments: 40,
          },
          position: at(BUS_APOTHEM + 0.026),
          // Rx(π/2)·Ry(φ) turns the torus normal (+Z) onto the bay's outward normal.
          rotation: [Math.PI / 2, phi, 0],
          ...STATIC_METAL,
        },
      );
    }
  }
  // Star trackers and the propellant line on the rear face.
  parts.push(
    cylinder(
      'star-tracker-0',
      0.035,
      0.12,
      [0.18, 0.28, BUS_REAR - 0.04],
      [Math.PI / 2, 0, 0],
      { material: 'black', group: 'static' },
      12,
    ),
    cylinder(
      'star-tracker-1',
      0.035,
      0.12,
      [-0.18, 0.28, BUS_REAR - 0.04],
      [Math.PI / 2, 0, 0],
      { material: 'black', group: 'static' },
      12,
    ),
  );
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI * 2) / 12;
    parts.push({
      id: `thruster-${String(k)}`,
      shape: { kind: 'cone', radius: 0.025, height: 0.05, segments: 10 },
      position: [Math.cos(a) * 0.33, Math.sin(a) * 0.33, BUS_REAR - 0.025],
      rotation: [Math.PI / 2, 0, 0],
      material: 'black',
      group: 'static',
    });
  }
  return parts;
}

function rtgBoom(): PartSpec[] {
  const parts = truss('rtg', [-0.46, RTG_Y, RTG_Z], [-1.6, RTG_Y, RTG_Z], {
    radius: 0.035,
    bays: 2,
    rod: 0.012,
    mainId: 'rtg-boom',
  });
  parts.push(cylinder('rtg-bracket', 0.06, 0.04, [-1.58, RTG_Y, RTG_Z], [0, 0, Math.PI / 2]));
  const along: Vec3 = [0, 0, Math.PI / 2];
  [-1.71, -1.94, -2.17].forEach((x, k) => {
    const id = `rtg-${String(k)}`;
    parts.push(
      cylinder(id, 0.085, 0.2, [x, RTG_Y, RTG_Z], along, { material: 'dark', group: 'static' }, 16),
    );
    for (let j = 0; j < 6; j++) {
      const psi = (j * Math.PI) / 3;
      parts.push(
        box(
          `${id}-fin-${String(j)}`,
          [0.18, 0.08, 0.008],
          [x, RTG_Y + Math.cos(psi) * 0.125, RTG_Z + Math.sin(psi) * 0.125],
          [psi, 0, 0],
          { material: 'dark', group: 'static' },
        ),
      );
    }
    if (k < 2)
      parts.push(cylinder(`rtg-flange-${String(k)}`, 0.1, 0.02, [x - 0.115, RTG_Y, RTG_Z], along));
  });
  parts.push(
    beam(
      'cable-rtg',
      [-0.46, RTG_Y - 0.04, RTG_Z + 0.02],
      [-1.6, RTG_Y - 0.04, RTG_Z + 0.02],
      0.006,
      { material: 'black', group: 'static' },
    ),
  );
  return parts;
}

function scienceBoom(): PartSpec[] {
  const parts = truss('science', [0.46, SCIENCE_Y, SCIENCE_Z], [1.66, SCIENCE_Y, SCIENCE_Z], {
    radius: 0.04,
    bays: 3,
    rod: 0.012,
    mainId: 'science-boom',
  });
  parts.push(
    box('cosmic-ray', [0.16, 0.14, 0.12], [0.8, SCIENCE_Y + 0.13, SCIENCE_Z], [0, 0, 0], {
      material: 'foil',
      group: 'static',
    }),
    box(
      'cosmic-ray-telescope',
      [0.04, 0.06, 0.04],
      [0.8, SCIENCE_Y + 0.23, SCIENCE_Z],
      [0, 0, 0],
      STATIC_METAL,
    ),
    cylinder('lecp', 0.06, 0.12, [1.35, SCIENCE_Y + 0.12, SCIENCE_Z], [0, 0, 0], STATIC_METAL, 16),
    box('lecp-motor', [0.08, 0.06, 0.08], [1.35, SCIENCE_Y + 0.04, SCIENCE_Z], [0, 0, 0], {
      material: 'foil',
      group: 'static',
    }),
    box('pls', [0.12, 0.1, 0.1], [1.1, SCIENCE_Y - 0.11, SCIENCE_Z], [0, 0, 0], {
      material: 'foil',
      group: 'static',
    }),
    {
      id: 'pls-cup',
      shape: { kind: 'cone', radius: 0.05, height: 0.07, segments: 12 },
      position: [1.1, SCIENCE_Y - 0.2, SCIENCE_Z],
      rotation: [0, 0, 0],
      material: 'black',
      group: 'static',
    },
    beam(
      'cable-science',
      [0.46, SCIENCE_Y - 0.05, SCIENCE_Z + 0.03],
      [1.66, SCIENCE_Y - 0.05, SCIENCE_Z + 0.03],
      0.006,
      { material: 'black', group: 'static' },
    ),
  );
  return parts;
}

function scanPlatform(): PartSpec[] {
  const scan = (material: MaterialSlot): Opts => ({ material, group: 'scan' });
  const forward: Vec3 = [Math.PI / 2, 0, 0];
  return [
    cylinder('scan-mount', 0.05, 0.08, [0.04, 0, 0], [0, 0, Math.PI / 2], scan('metal'), 12),
    box('scan-platform', [0.26, 0.2, 0.22], [0.2, 0, 0], [0, 0, 0], scan('foil')),
    cylinder('camera-na', 0.045, 0.3, [0.16, 0.15, 0.02], forward, scan('metal'), 16),
    cylinder('camera-na-lens', 0.038, 0.01, [0.16, 0.15, 0.175], forward, scan('black'), 16),
    cylinder('camera-wa', 0.035, 0.2, [0.26, 0.14, 0.0], forward, scan('metal'), 16),
    cylinder('camera-wa-lens', 0.029, 0.01, [0.26, 0.14, 0.105], forward, scan('black'), 16),
    cylinder('iris', 0.085, 0.16, [0.2, -0.17, 0.02], forward, scan('foil'), 20),
    cylinder('iris-aperture', 0.07, 0.01, [0.2, -0.17, 0.105], forward, scan('black'), 20),
    box('uvs', [0.06, 0.06, 0.18], [0.34, 0.02, 0.04], [0, 0, 0], scan('metal')),
    cylinder('ppx', 0.03, 0.14, [0.34, -0.09, 0.04], forward, scan('metal'), 12),
  ];
}

function magnetometer(): PartSpec[] {
  const parts = truss('mag', MAG_BASE, MAG_TIP, {
    radius: 0.045,
    bays: 10,
    rod: 0.006,
    mainId: 'mag-boom',
  });
  const along = alignY(MAG_DIR);
  parts.push(
    {
      ...cylinder(
        'mag-canister',
        0.075,
        0.26,
        add(MAG_BASE, scale(MAG_DIR, 0.08)),
        along,
        { material: 'foil', group: 'static' },
        16,
      ),
    },
    box('mag-sensor-base', [0.07, 0.07, 0.07], add(MAG_BASE, scale(MAG_DIR, 0.5)), along, {
      material: 'dark',
      group: 'static',
    }),
    box(
      'mag-sensor-mid',
      [0.07, 0.07, 0.07],
      add(MAG_BASE, scale(MAG_DIR, MAG_LENGTH * 0.62)),
      along,
      { material: 'dark', group: 'static' },
    ),
    beam(
      'cable-mag',
      add(MAG_BASE, [0, 0, 0.05]),
      add(MAG_BASE, add(scale(MAG_DIR, 0.5), [0, 0, 0.05])),
      0.005,
      { material: 'black', group: 'static' },
    ),
    {
      id: 'mag-sensor-tip',
      shape: { kind: 'cylinder', radiusTop: 0.04, radiusBottom: 0.04, height: 0.09, segments: 12 },
      position: scale(MAG_DIR, 0.05),
      rotation: along,
      material: 'metal',
      group: 'mag-tip',
    },
  );
  return parts;
}

function whips(): PartSpec[] {
  return [
    box('whip-l-mount', [0.06, 0.04, 0.06], WHIP_L_ROOT, [0, 0, 0], STATIC_METAL),
    box('whip-r-mount', [0.06, 0.04, 0.06], WHIP_R_ROOT, [0, 0, 0], STATIC_METAL),
    beam('whip-l', [0, 0, 0], scale(WHIP_L_DIR, WHIP_LENGTH), 0.008, {
      material: 'metal',
      group: 'whip-l',
    }),
    beam('whip-r', [0, 0, 0], scale(WHIP_R_DIR, WHIP_LENGTH), 0.008, {
      material: 'metal',
      group: 'whip-r',
    }),
  ];
}

export const PARTS: readonly PartSpec[] = [
  ...antenna(),
  ...bus(),
  ...rtgBoom(),
  ...scienceBoom(),
  ...scanPlatform(),
  ...magnetometer(),
  ...whips(),
];

/** Parts the model must always contain to read as Voyager 1. */
export const REQUIRED_PARTS: readonly string[] = [
  'hga',
  'hga-rim',
  'subreflector',
  'feed',
  'feed-strut-0',
  'feed-strut-1',
  'feed-strut-2',
  'bus',
  ...Array.from({ length: 10 }, (_, i) => `bus-bay-${String(i)}`),
  'golden-record',
  'rtg-boom',
  'rtg-0',
  'rtg-1',
  'rtg-2',
  'mag-boom',
  'mag-sensor-mid',
  'mag-sensor-tip',
  'science-boom',
  'scan-platform',
  'camera-na',
  'camera-wa',
  'whip-l',
  'whip-r',
  'thruster-0',
  'lecp',
  'cosmic-ray',
];

// ---------------------------------------------------------------------------------------------
// Bounds (model space, neutral pose)
// ---------------------------------------------------------------------------------------------

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

function localHalfExtents(shape: Shape): { min: Vec3; max: Vec3 } {
  switch (shape.kind) {
    case 'cylinder': {
      const r = Math.max(shape.radiusTop, shape.radiusBottom);
      return { min: [-r, -shape.height / 2, -r], max: [r, shape.height / 2, r] };
    }
    case 'cone':
      return {
        min: [-shape.radius, -shape.height / 2, -shape.radius],
        max: [shape.radius, shape.height / 2, shape.radius],
      };
    case 'box':
      return {
        min: [-shape.width / 2, -shape.height / 2, -shape.depth / 2],
        max: [shape.width / 2, shape.height / 2, shape.depth / 2],
      };
    case 'sphere':
      return {
        min: [-shape.radius, -shape.radius, -shape.radius],
        max: [shape.radius, shape.radius, shape.radius],
      };
    case 'torus': {
      const r = shape.radius + shape.tube;
      return { min: [-r, -r, -shape.tube], max: [r, r, shape.tube] };
    }
    case 'lathe': {
      const r = Math.max(...shape.profile.map((p) => p[0]));
      const ys = shape.profile.map((p) => p[1]);
      return { min: [-r, Math.min(...ys), -r], max: [r, Math.max(...ys), r] };
    }
  }
}

/** Axis-aligned bounds of one part in model space (pivot offset included). */
export function partBounds(part: PartSpec): Bounds {
  const { min, max } = localHalfExtents(part.shape);
  const offset = part.group === 'static' ? part.position : add(PIVOTS[part.group], part.position);
  const out: Bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (let i = 0; i < 8; i++) {
    const corner: Vec3 = [
      i & 1 ? max[0] : min[0],
      i & 2 ? max[1] : min[1],
      i & 4 ? max[2] : min[2],
    ];
    const p = add(rotate(corner, part.rotation), offset);
    for (let axis = 0; axis < 3; axis++) {
      out.min[axis] = Math.min(out.min[axis] ?? 0, p[axis] ?? 0);
      out.max[axis] = Math.max(out.max[axis] ?? 0, p[axis] ?? 0);
    }
  }
  return out;
}

/** Union of all part bounds. */
export function modelBounds(parts: readonly PartSpec[]): Bounds {
  const out: Bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (const part of parts) {
    const b = partBounds(part);
    for (let axis = 0; axis < 3; axis++) {
      out.min[axis] = Math.min(out.min[axis] ?? 0, b.min[axis] ?? 0);
      out.max[axis] = Math.max(out.max[axis] ?? 0, b.max[axis] ?? 0);
    }
  }
  return out;
}
