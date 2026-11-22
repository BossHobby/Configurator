import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Shape,
  ShapeGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import {
  buildVehicleModel,
  type ModelMaterials,
  type VehicleKind,
} from "./attitudeModels";

/** Radians as the firmware reports them: roll right, pitch nose-down, yaw clockwise from north. */
export interface Attitude {
  roll: number;
  pitch: number;
  yaw: number;
}

const GROUND = -0.6;
const RING = 1.6;
// The state arrives a few times a second; ease towards it in between.
const SMOOTHING_S = 0.09;

function token(style: CSSStyleDeclaration, name: string) {
  return new Color(style.getPropertyValue(name).trim() || "#888888");
}

function groundLines() {
  const points: number[] = [];
  const segments = 72;
  for (const radius of [RING / 2, RING]) {
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const b = ((i + 1) / segments) * Math.PI * 2;
      points.push(
        Math.sin(a) * radius,
        0,
        Math.cos(a) * radius,
        Math.sin(b) * radius,
        0,
        Math.cos(b) * radius,
      );
    }
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    points.push(
      Math.sin(a) * RING,
      0,
      Math.cos(a) * RING,
      -Math.sin(a) * RING,
      0,
      -Math.cos(a) * RING,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

/** A compass hand flat on the ground, from the centre to the ring, pointing forward. */
function headingMarker() {
  const shape = new Shape();
  shape.moveTo(-0.012, 0);
  shape.lineTo(0.012, 0);
  shape.lineTo(0.012, RING - 0.2);
  shape.lineTo(0.1, RING - 0.2);
  shape.lineTo(0, RING);
  shape.lineTo(-0.1, RING - 0.2);
  shape.lineTo(-0.012, RING - 0.2);
  shape.closePath();
  return new ShapeGeometry(shape).rotateX(-Math.PI / 2);
}

function dispose(object: Object3D) {
  object.traverse((child) => {
    (child as Mesh).geometry?.dispose();
  });
}

/**
 * A vehicle seen from behind over a compass ring. The ring is fixed to the
 * world and the view turns with `viewYaw`, so the vehicle faces away from the
 * viewer at that heading.
 */
export class AttitudeScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(34, 1, 0.1, 50);
  private world = new Group();
  private vehicle = new Group();
  private marker: Mesh;
  private north: Sprite;
  private grid: LineSegments;

  private materials: ModelMaterials & {
    grid: LineBasicMaterial;
    marker: MeshBasicMaterial;
    north: SpriteMaterial;
  };
  private northColor = "#888888";

  private target = new Quaternion();
  private settled = false;
  private lastFrame = 0;
  private frameRequest = -1;

  constructor(private container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const surface = { roughness: 0.75, metalness: 0, flatShading: true };
    const disc = {
      transparent: true,
      opacity: 0.22,
      side: DoubleSide,
      depthWrite: false,
    };
    this.materials = {
      body: new MeshStandardMaterial(surface),
      detail: new MeshStandardMaterial(surface),
      front: new MeshStandardMaterial(surface),
      prop: new MeshBasicMaterial(disc),
      frontProp: new MeshBasicMaterial({ ...disc, opacity: 0.4 }),
      grid: new LineBasicMaterial(),
      marker: new MeshBasicMaterial({ side: DoubleSide }),
      north: new SpriteMaterial({ transparent: true, depthWrite: false }),
    };

    this.camera.position.set(0, 3.4, 4.1);
    this.camera.lookAt(0, -0.3, 0);

    const sun = new DirectionalLight(0xffffff, 1.6);
    sun.position.set(2, 5, 3);
    this.scene.add(new HemisphereLight(0xffffff, 0x555555, 1.7), sun);

    this.grid = new LineSegments(groundLines(), this.materials.grid);
    this.grid.position.y = GROUND;
    this.marker = new Mesh(headingMarker(), this.materials.marker);
    this.marker.position.y = GROUND;
    this.north = new Sprite(this.materials.north);
    this.north.position.set(0, GROUND, -RING - 0.3);
    this.north.scale.setScalar(0.4);

    this.world.add(this.grid, this.marker, this.north, this.vehicle);
    this.scene.add(this.world);

    this.setTheme();
    this.resize();
    container.replaceChildren(this.renderer.domElement);
    this.frameRequest = requestAnimationFrame(this.frame);
  }

  setVehicle(kind: VehicleKind) {
    dispose(this.vehicle);
    this.vehicle.clear();
    this.vehicle.add(buildVehicleModel(kind, this.materials));
  }

  setAttitude(attitude: Attitude) {
    this.target.setFromEuler(
      new Euler(-attitude.pitch, -attitude.yaw, -attitude.roll, "YXZ"),
    );
    if (!this.settled) {
      this.vehicle.quaternion.copy(this.target);
      this.settled = true;
    }
  }

  /** The heading, in radians, at which the vehicle faces away from the viewer. */
  setViewYaw(yaw: number) {
    this.world.rotation.y = yaw;
  }

  /** North is only meaningful once the firmware trusts its heading. */
  setNorth(visible: boolean) {
    this.north.visible = visible;
  }

  /** Follows the CSS tokens in style.css; call again when the theme changes. */
  setTheme() {
    const style = getComputedStyle(document.documentElement);
    const ink = token(style, "--ui-ink");
    const muted = token(style, "--ui-muted");
    const accent = token(style, "--ui-accent");
    const m = this.materials;
    (m.body as MeshStandardMaterial).color.copy(muted);
    (m.detail as MeshStandardMaterial).color.copy(ink);
    (m.front as MeshStandardMaterial).color.copy(accent);
    (m.prop as MeshBasicMaterial).color.copy(muted);
    (m.frontProp as MeshBasicMaterial).color.copy(accent);
    m.grid.color.copy(token(style, "--ui-line"));
    m.marker.color.copy(accent);

    const northColor = `#${muted.getHexString()}`;
    if (northColor != this.northColor || !m.north.map) {
      this.northColor = northColor;
      m.north.map?.dispose();
      m.north.map = this.northLabel(northColor);
      m.north.needsUpdate = true;
    }
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    // Keep the ring in view when the panel is narrower than it is tall.
    this.camera.zoom = Math.min(1, this.camera.aspect / 1.15);
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.frameRequest);
    dispose(this.scene);
    for (const material of Object.values(this.materials)) material.dispose();
    this.materials.north.map?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private northLabel(color: string) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = "600 64px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 48, 52);
    return new CanvasTexture(canvas);
  }

  private frame = (now: number) => {
    const dt = Math.min((now - this.lastFrame) / 1000, 0.25);
    this.lastFrame = now;
    this.vehicle.quaternion.slerp(this.target, 1 - Math.exp(-dt / SMOOTHING_S));

    // The hand follows the nose around the ring; it holds still while the
    // nose points straight up or down.
    const nose = new Vector3(0, 0, -1).applyQuaternion(this.vehicle.quaternion);
    if (Math.hypot(nose.x, nose.z) > 0.05) {
      this.marker.rotation.y = Math.atan2(-nose.x, -nose.z);
    }

    this.renderer.render(this.scene, this.camera);
    this.frameRequest = requestAnimationFrame(this.frame);
  };
}
