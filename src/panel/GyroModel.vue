<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Model</p>
      <spinner-btn
        class="card-header-button is-primary"
        @click="root.cal_imu()"
      >
        calibrate
      </spinner-btn>
    </header>
    <div class="card-content">
      <div class="content">
        <div id="container" style="height: 30vh; width: 100%"></div>
        <small class="float-right">Model: TKS GT20 by Tarkusx</small>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
import {
  BoxGeometry,
  MeshBasicMaterial,
  WebGLRenderer,
  Mesh,
  Vector3,
  Quaternion,
  PerspectiveCamera,
  HemisphereLight,
  DirectionalLight,
  Scene,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useStateStore } from "@/store/state";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "GyroModel",
  setup() {
    return {
      frameRequest: -1,
      camera: new PerspectiveCamera(),
      scene: new Scene(),
      renderer: new WebGLRenderer(),
      model: undefined as any,
      state: useStateStore(),
      root: useRootStore(),
    };
  },
  async mounted() {
    await this.initThree();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frameRequest);
  },
  methods: {
    async initThree() {
      const container = document.getElementById("container");
      if (!container) {
        return;
      }

      this.camera = new PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.01,
        1000,
      );
      this.camera.position.z = 140;
      this.camera.position.y = 40;
      this.camera.lookAt(0, 0, 0);

      const ambientLight = new HemisphereLight(0xddeeff, 0x0f0e0d, 5);
      const mainLight = new DirectionalLight(0xffffff, 10);
      mainLight.position.set(0, 1000, 0);

      this.scene = new Scene();
      this.scene.add(ambientLight, mainLight);

      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      });

      const cube = new Mesh(geometry, material);
      this.scene.add(cube);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("gt20.glb");
      this.model = gltf.scene.children[0];
      this.scene.add(this.model);

      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.replaceChildren(this.renderer.domElement);

      this.animate();
    },
    animate() {
      if (this.model && this.state.GEstG) {
        const UP = new Vector3(0, 1, 0);
        const GYRO = new Vector3(
          this.state.GEstG[0],
          this.state.GEstG[2],
          -this.state.GEstG[1],
        );
        GYRO.normalize();

        const q = new Quaternion();
        q.setFromUnitVectors(UP, GYRO);

        this.model.rotation.setFromQuaternion(q);
      }
      this.renderer.render(this.scene, this.camera);
      this.frameRequest = requestAnimationFrame(this.animate);
    },
  },
});
</script>

<style scoped></style>
