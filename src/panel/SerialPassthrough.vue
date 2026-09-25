<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Serial Passthrough</p>
      <tooltip
        class="shrink-0 text-muted"
        entry="serial_passthrough"
        size="lg"
      />
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <div class="min-w-0 flex-1">
              <label class="text-sm font-medium text-ink">Serial Port</label>
              <div class="min-w-0 flex-1">
                <input-select
                  v-model.number="serial_port"
                  class="w-full"
                  :options="serialPorts"
                />
              </div>
            </div>
          </div>

          <div class="min-w-0 col-span-12 md:col-span-6">
            <div class="min-w-0 flex-1">
              <label class="text-sm font-medium text-ink">Preset</label>
              <div class="min-w-0 flex-1">
                <input-select
                  v-model="preset"
                  class="w-full"
                  :options="presetOptions"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer
      class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
    >
      <spinner-btn
        :disabled="serial_port == 0 || preset == null"
        @click="start_passthrough"
      >
        Start
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { useInfoStore } from "@/store/info";
import { useSerialStore } from "@/store/serial";
import { useTargetStore } from "@/store/target";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SerialPassthrough",
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
