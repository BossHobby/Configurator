<template>
  <div class="columns is-multiline">
    <div class="column is-12"><Info></Info></div>
    <div class="column is-12">
      <div class="notification is-warning" v-show="info.quic_protocol_version < 5">
        Incompatible Firmware! <br />
        Please update to be able to change settings. <br />
        Current profile can be exported and loaded.
      </div>
      <div class="notification is-danger" v-show="state.failloop > 0">
        Faillop {{ state.failloopMessage }} ({{ state.failloop }}) Detected!
        <br />
        Please fix the issue to be able to change settings. <br />
      </div>
    </div>
    <div class="column is-12">
      <ProfileMetadata></ProfileMetadata>
    </div>
    <div class="column is-12">
      <SerialPassthrough></SerialPassthrough>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ProfileMetadata from "@/panel/ProfileMetadata.vue";
import Info from "@/panel/Info.vue";
import SerialPassthrough from "@/panel/SerialPassthrough.vue";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "Profile",
  components: {
    Info,
    ProfileMetadata,
    SerialPassthrough,
  },
  setup() {
    return {
      info: useInfoStore(),
      state: useStateStore(),
    };
  },
});
</script>
