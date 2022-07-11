<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Model</p>
      <button class="card-header-button button is-primary" @click="cal_imu()">
        calibrate
      </button>
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
import { defineComponent } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { mapState, mapActions } from "vuex";

export default defineComponent({
  name: "GyroModel",
  data() {
    return {};
  },
  computed: {
    ...mapState({
      rate: (state) => state.profile.rate,
      gyro_vector: (state) => state.state.GEstG,
      accel: (state) => state.state.accel,
    }),
  },
  methods: {
    ...mapActions(["cal_imu"]),
    async initThree() {
      const container = document.getElementById("container");
      if (!container) {
        return;
      }

      this.camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      );
      this.camera.position.z = 140;
      this.camera.position.y = 40;
      this.camera.lookAt(0, 0, 0);

      const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 10);
      const mainLight = new THREE.DirectionalLight(0xffffff, 10);
      mainLight.position.set(0, 500, 0);

      this.scene = new THREE.Scene();
      this.scene.add(ambientLight, mainLight);

      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      });

      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("gt20.gltf");
      this.model = gltf.scene.children[0];
      this.scene.add(this.model);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      this.animate();
    },
    animate() {
      if (this.model) {
        const UP = new THREE.Vector3(0, 1, 0);
        const GYRO = new THREE.Vector3(
          this.gyro_vector[0],
          this.gyro_vector[2],
          -this.gyro_vector[1]
        );
        GYRO.normalize();

        const q = new THREE.Quaternion(); // create one and reuse it
        q.setFromUnitVectors(UP, GYRO);

        this.model.rotation.setFromQuaternion(q);
      }
      this.renderer.render(this.scene, this.camera);
      this.frameRequest = requestAnimationFrame(this.animate);
    },
  },
  async mounted() {
    await this.initThree();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frameRequest);
  },
});
</script>

<style scoped></style>
