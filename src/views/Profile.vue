<template>
  <div class="columns is-multiline">
    <div class="column is-12 is-hidden-mobile"><Info></Info></div>
    <div class="column is-12">
      <div v-show="info.version_too_old" class="notification is-warning">
        Incompatible Firmware! <br />
        Please update to be able to change settings. <br />
        Your current profile can be exported and loaded.
      </div>
      <div v-show="state.failloop > 0" class="notification is-danger">
        Faillop {{ state.failloopMessage }} ({{ state.failloop }}) Detected!
        <br />
        Please fix the issue to be able to change settings. <br />
      </div>
    </div>
    <div class="column is-12">
      <ProfileMetadata></ProfileMetadata>
    </div>
    <div class="column is-12">
      <Target></Target>
    </div>
    <div class="column is-12">
      <SerialPassthrough></SerialPassthrough>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";

import ProfileMetadata from "@/panel/ProfileMetadata.vue";
import Info from "@/panel/Info.vue";
import SerialPassthrough from "@/panel/SerialPassthrough.vue";
import Target from "@/panel/Target.vue";

export default defineComponent({
  name: "Profile",
  components: {
    Info,
    ProfileMetadata,
    SerialPassthrough,
    Target,
  },
  setup() {
    return {
      info: useInfoStore(),
      state: useStateStore(),
    };
  },
});
</script>
