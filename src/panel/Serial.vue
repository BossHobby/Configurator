<template>
  <Panel title="Serial Ports">
    <div class="grid grid-cols-1 gap-4">
      <FieldSelect
        v-model="profile.serial.rx"
        label="Receiver (RX)"
        :options="serialPorts.map((o) => ({ value: o.value, label: o.text }))"
      />
      <FieldSelect
        v-model="profile.serial.smart_audio"
        label="VTX"
        :options="serialPorts.map((o) => ({ value: o.value, label: o.text }))"
      />
      <FieldSelect
        v-model="profile.serial.hdzero"
        label="Digital VTX"
        :options="serialPorts.map((o) => ({ value: o.value, label: o.text }))"
      />
      <FieldSelect
        v-if="profile.profileVersionGt('0.2.6')"
        v-model="profile.serial.gps"
        label="GPS"
        :options="serialPorts.map((o) => ({ value: o.value, label: o.text }))"
      />
    </div>
  </Panel>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import FieldSelect from "@/components/ui/Select.vue";
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";
import { useTargetStore } from "@/store/target";

export default defineComponent({
  name: "Serial",
  components: { Panel, FieldSelect },
  setup() {
    return {
      root: useRootStore(),
      target: useTargetStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    serialPorts() {
      const ports = [{ value: 0, text: "None" }];
      for (const [key, val] of Object.entries(this.target.serial_port_names)) {
        ports.push({ value: val, text: key });
      }
      return ports;
    },
  },
  watch: {
    "profile.serial": {
      handler() {
        this.root.set_needs_reboot();
      },
      deep: true,
    },
  },
});
</script>
