<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Serial</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-4">
            <label for="rx">
              RX
              <tooltip entry="serial.rx" />
            </label>
          </div>
          <div class="column is-8">
            <input-select
              id="rx"
              v-model.number="serial.rx"
              :options="serialPorts"
            ></input-select>
          </div>
        </div>
        <div class="columns">
          <div class="column is-4">
            <label for="smart-audio">
              Smart Audio
              <tooltip entry="serial.smart_audio" />
            </label>
          </div>
          <div class="column is-8">
            <input-select
              id="smart-audio"
              v-model.number="serial.smart_audio"
              :options="serialPorts"
            ></input-select>
          </div>
        </div>
        <div class="columns">
          <div class="column is-4">
            <label for="hdzero">
              HDZero
              <tooltip entry="serial.hdzero" />
            </label>
          </div>
          <div class="column is-8">
            <input-select
              id="hdzero"
              v-model.number="serial.hdzero"
              :options="serialPorts"
            ></input-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "serial",
  computed: {
    ...mapFields("profile", ["serial"]),
    ...mapState(["info"]),
    serialPorts() {
      const ports = [{ value: 0, text: "None" }];
      for (let i = 1; i < this.info.usart_ports.length; i++) {
        ports.push({ value: i, text: this.info.usart_ports[i] });
      }
      return ports;
    },
  },
});
</script>
