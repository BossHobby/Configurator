<template>
  <b-card>
    <h5 slot="header" class="mb-0">Serial</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="invert-yaw">RX</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select id="invert-yaw" v-model.number="profile.serial.rx" :options="serialPorts"></b-form-select>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="invert-yaw">Smart Audio</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select
          id="invert-yaw"
          v-model.number="profile.serial.smart_audio"
          :options="serialPorts"
        ></b-form-select>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "serial",
  computed: {
    ...mapState(["profile", "default_profile"]),
    serialPorts() {
      const ports = [{ value: 0, text: "None" }];
      for (let i = 1; i < this.default_profile.serial.port_max; i++) {
        ports.push({ value: i, text: "UART " + i });
      }
      return ports;
    }
  }
};
</script>
