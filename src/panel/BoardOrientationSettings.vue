<template>
  <Panel title="Orientation Settings">
    <div class="space-y-5">
      <div class="text-sm text-muted">
        Gyro
        <span class="float-right font-medium text-ink">{{
          info.gyro_name
        }}</span>
      </div>
      <FieldSelect
        v-model="gyroOrientation"
        label="Gyro orientation"
        :options="
          gyroOrientations.map((o) => ({
            value: o.value,
            label: o.text.replace('ROTATE_', '').replaceAll('_', ' '),
          }))
        "
      />
      <Toggle v-model="gyroFlip" label="Flip board (180°)" />
    </div>
  </Panel>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import FieldSelect from "@/components/ui/Select.vue";
import Toggle from "@/components/ui/Toggle.vue";
import { useInfoStore } from "@/store/info";
import { defineComponent } from "vue";
import { useConstantStore } from "@/store/constants";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "BoardOrientationSettings",
  components: { Panel, FieldSelect, Toggle },
  setup() {
    return {
      info: useInfoStore(),
      constants: useConstantStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    gyroOrientation: {
      get() {
        return this.profile.motor.gyro_orientation & 0x1f;
      },
      set(value) {
        this.profile.motor.gyro_orientation =
          value | (this.gyroFlip ? this.constants.GyroRotation.FLIP_180 : 0x0);
      },
    },
    gyroOrientations() {
      return [
        { value: this.constants.GyroRotation.ROTATE_NONE, text: "ROTATE_NONE" },
        {
          value: this.constants.GyroRotation.ROTATE_45_CCW,
          text: "ROTATE_45_CCW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_45_CW,
          text: "ROTATE_45_CW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_90_CW,
          text: "ROTATE_90_CW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_90_CCW,
          text: "ROTATE_90_CCW",
        },
        {
          value:
            this.constants.GyroRotation.ROTATE_90_CCW |
            this.constants.GyroRotation.ROTATE_45_CCW,
          text: "ROTATE_135_CW",
        },
        {
          value:
            this.constants.GyroRotation.ROTATE_90_CW |
            this.constants.GyroRotation.ROTATE_45_CW,
          text: "ROTATE_135_CCW",
        },
        { value: this.constants.GyroRotation.ROTATE_180, text: "ROTATE_180" },
      ];
    },
    gyroFlip: {
      get() {
        return (
          (this.profile.motor.gyro_orientation &
            this.constants.GyroRotation.FLIP_180) >
          0
        );
      },
      set(value) {
        this.profile.motor.gyro_orientation =
          this.gyroOrientation |
          (value ? this.constants.GyroRotation.FLIP_180 : 0x0);
      },
    },
  },
});
</script>
