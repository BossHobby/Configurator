<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <MotorTest></MotorTest>
    </div>
    <div class="column is-12">
      <MotorPins></MotorPins>
    </div>
    <div class="column is-12" v-if="has_feature(Features.BRUSHLESS)">
      <ESCSettings></ESCSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapGetters } from "vuex";

import MotorTest from "../panel/MotorTest.vue";
import MotorPins from "../panel/MotorPins.vue";
import ESCSettings from "../panel/ESCSettings.vue";

export default defineComponent({
  name: "Motor",
  components: { MotorTest, MotorPins, ESCSettings },
  computed: {
    ...mapGetters(["has_feature"]),
    ...mapState("constants", ["Features"]),
  },
});
</script>
