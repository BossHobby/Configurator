import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Shape,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";

export type VehicleKind = "quad" | "wing" | "plane" | "rover";

export interface ModelMaterials {
  body: Material;
  detail: Material;
  /** Marks the nose, so the heading reads on a symmetric frame. */
  front: Material;
  prop: Material;
  frontProp: Material;
}

type Vec3 = [number, number, number];

// Models are built x right, y up, nose towards -z and fit a unit sphere.

function add(
  group: Group,
  geometry: BufferGeometry,
  material: Material,
  position: Vec3 = [0, 0, 0],
) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

/** A flat plate from an outline of [right, forward] points, centred on y. */
function plate(outline: [number, number][], thickness: number) {
  const shape = new Shape();
  outline.forEach(([x, forward], i) =>
    i == 0 ? shape.moveTo(x, forward) : shape.lineTo(x, forward),
  );
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
    .rotateX(-Math.PI / 2)
    .translate(0, -thickness / 2, 0);
}

/** Mirrors the right half of an outline onto the left. */
function mirrored(half: [number, number][]): [number, number][] {
  return [
    ...half,
    ...half
      .filter(([x]) => x != 0)
      .reverse()
      .map(([x, forward]): [number, number] => [-x, forward]),
  ];
}

/** A cylinder along the forward axis; `noseRadius` is the forward end. */
function tube(noseRadius: number, tailRadius: number, length: number) {
  return new CylinderGeometry(noseRadius, tailRadius, length, 16).rotateX(
    -Math.PI / 2,
  );
}

function quad(m: ModelMaterials) {
  const group = new Group();
  const reach = 0.48;

  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    add(group, new BoxGeometry(0.1, 0.05, 1.42).rotateY(angle), m.body);
  }
  for (const x of [-reach, reach]) {
    for (const z of [-reach, reach]) {
      add(group, new CylinderGeometry(0.085, 0.085, 0.13, 16), m.detail, [
        x,
        0.06,
        z,
      ]);
      add(
        group,
        new CircleGeometry(0.33, 40).rotateX(-Math.PI / 2),
        z < 0 ? m.frontProp : m.prop,
        [x, 0.14, z],
      );
    }
  }

  add(group, new BoxGeometry(0.3, 0.1, 0.62), m.body, [0, 0.03, 0]);
  add(group, new BoxGeometry(0.22, 0.11, 0.42), m.detail, [0, 0.135, 0.04]);
  add(group, new BoxGeometry(0.18, 0.14, 0.12), m.front, [0, 0.07, -0.35]);
  return group;
}

function wing(m: ModelMaterials) {
  const group = new Group();

  add(
    group,
    plate(
      mirrored([
        [0, 0.55],
        [0.14, 0.5],
        [1, -0.24],
        [1, -0.5],
        [0.18, -0.35],
        [0, -0.35],
      ]),
      0.05,
    ),
    m.body,
  );
  // Elevons along the swept trailing edge.
  for (const side of [1, -1]) {
    add(
      group,
      plate(
        [
          [side * 0.22, -0.277],
          [side * 0.95, -0.411],
          [side * 0.95, -0.491],
          [side * 0.22, -0.357],
        ],
        0.06,
      ),
      m.detail,
    );
    add(group, new BoxGeometry(0.025, 0.2, 0.26), m.detail, [
      side * 1,
      0.08,
      0.37,
    ]);
  }

  add(
    group,
    new SphereGeometry(1, 20, 12).scale(0.13, 0.11, 0.46),
    m.body,
    [0, 0.03, -0.06],
  );
  add(
    group,
    new SphereGeometry(1, 16, 10).scale(0.09, 0.08, 0.14),
    m.front,
    [0, 0.03, -0.44],
  );
  add(group, tube(0.06, 0.05, 0.1), m.detail, [0, 0.03, 0.4]);
  add(group, new CircleGeometry(0.17, 32), m.prop, [0, 0.03, 0.46]);
  return group;
}

function plane(m: ModelMaterials) {
  const group = new Group();

  add(group, tube(0.1, 0.035, 1.5), m.body);
  add(
    group,
    new SphereGeometry(1, 16, 10).scale(0.1, 0.1, 0.13),
    m.front,
    [0, 0, -0.75],
  );
  add(group, new CircleGeometry(0.2, 32), m.prop, [0, 0, -0.89]);

  add(
    group,
    plate(
      mirrored([
        [0, 0.36],
        [1, 0.28],
        [1, 0.08],
        [0, 0.04],
      ]),
      0.045,
    ),
    m.body,
    [0, 0.1, 0],
  );
  add(
    group,
    plate(
      mirrored([
        [0, -0.52],
        [0.36, -0.58],
        [0.36, -0.72],
        [0, -0.74],
      ]),
      0.035,
    ),
    m.body,
    [0, 0.02, 0],
  );
  add(group, new BoxGeometry(0.03, 0.3, 0.2), m.detail, [0, 0.17, 0.64]);
  return group;
}

function rover(m: ModelMaterials) {
  const group = new Group();

  add(group, new BoxGeometry(0.58, 0.14, 1.2), m.body);
  add(group, new BoxGeometry(0.46, 0.2, 0.5), m.detail, [0, 0.17, 0.08]);
  add(group, new BoxGeometry(0.58, 0.08, 0.1), m.front, [0, 0, -0.63]);
  for (const x of [-0.4, 0.4]) {
    for (const z of [-0.4, 0.4]) {
      add(
        group,
        new CylinderGeometry(0.22, 0.22, 0.16, 24).rotateZ(Math.PI / 2),
        m.detail,
        [x, -0.06, z],
      );
    }
  }
  return group;
}

export function buildVehicleModel(
  kind: VehicleKind,
  materials: ModelMaterials,
) {
  switch (kind) {
    case "wing":
      return wing(materials);
    case "plane":
      return plane(materials);
    case "rover":
      return rover(materials);
    default:
      return quad(materials);
  }
}
