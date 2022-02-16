<template>
  <b-card>
    <h5 slot="header" class="mb-0">Serial</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="rx">
          RX
          <tooltip entry="serial.rx" />
        </label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select
          id="rx"
          v-model.number="serial.rx"
          :options="serialPorts"
        ></b-form-select>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="smart-audio">
          Smart Audio
          <tooltip entry="serial.smart_audio" />
        </label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select
          id="smart-audio"
          v-model.number="serial.smart_audio"
          :options="serialPorts"
        ></b-form-select>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
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
};
</script>
