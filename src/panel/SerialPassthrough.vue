<template>
  <Panel title="Serial Passthrough" help="serial_passthrough"
    ><div class="space-y-4">
      <div class="grid grid-cols-12 gap-4">
        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="min-w-0 flex-1">
            <label class="form-label mb-1.5" for="passthrough-port"
              >Serial Port</label
            >
            <UiSelect
              id="passthrough-port"
              v-model.number="serial_port"
              class="w-full"
              :options="serialPorts"
            />
          </div>
        </div>

        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="min-w-0 flex-1">
            <label class="form-label mb-1.5" for="passthrough-preset"
              >Preset</label
            >
            <UiSelect
              id="passthrough-preset"
              v-model="preset"
              class="w-full"
              :options="presetOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <footer class="mt-5 flex flex-wrap items-center justify-end gap-2">
      <spinner-btn
        :disabled="serial_port == 0 || preset == null"
        @click="start_passthrough"
      >
        Start
      </spinner-btn>
    </footer></Panel
  >
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { useInfoStore } from "@/store/info";
import { useSerialStore } from "@/store/serial";
import { useTargetStore } from "@/store/target";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SerialPassthrough",
  components: { Panel },
  setup() {
    return {
      info: useInfoStore(),
      target: useTargetStore(),
      serial: useSerialStore(),
    };
  },
  data() {
    return {
      serial_port: 0,
      preset: null as any,
    };
  },
  computed: {
    serialPorts() {
      const ports = [{ value: 0, text: "SERIAL_PORT_INVALID" }];
      for (const [key, val] of Object.entries(this.target.serial_port_names)) {
        ports.push({ value: val, text: key });
      }
      if (this.info.quic_semver_gte("0.2.4")) {
        for (let i = 0; i < 4; i++) {
          ports.push({ value: 100 + i, text: "ESCPROG " + i });
        }
      }
      return ports;
    },
    presetOptions() {
      const opts = [{ value: null as any, text: "Please select an option" }];
      if (this.serial_port < 100) {
        opts.push(
          {
            text: "ExpressLRS",
            value: {
              baudrate: 420000,
              half_duplex: false,
              stop_bits: 1,
            },
          },
          {
            text: "OpenVTX",
            value: {
              baudrate: 4800,
              half_duplex: true,
              stop_bits: 2,
            },
          },
        );
      } else {
        opts.push({
          text: "ESCape32",
          value: {
            baudrate: 38400,
          },
        });
      }

      return opts;
    },
  },
  methods: {
    start_passthrough() {
      if (this.serial_port < 100) {
        return this.serial.serial_passthrough({
          port: this.serial_port,
          ...(this.preset || {}),
        });
      } else {
        return this.serial.esc_passthrough({
          index: this.serial_port - 100,
          ...(this.preset || {}),
        });
      }
    },
  },
});
</script>
