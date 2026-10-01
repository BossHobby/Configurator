<template>
  <div class="space-y-4">
    <div v-if="info.version_too_old || state.failloop > 0">
      <div
        v-show="info.version_too_old"
        class="relative rounded-lg border border-current bg-panel p-4 pr-10 text-warning"
      >
        Incompatible Firmware! <br />
        Please update to be able to change settings. <br />
        Your current profile can be exported and loaded.
      </div>
      <div
        v-show="state.failloop > 0"
        class="relative rounded-lg border border-current bg-panel p-4 pr-10 text-danger"
      >
        Faillop {{ state.failloopMessage }} ({{ state.failloop }}) Detected!
        <br />
        Please fix the issue to be able to change settings. <br />
      </div>
    </div>
    <div class="grid items-stretch gap-4 lg:grid-cols-2">
      <ProfileMetadata /><Target />
    </div>
    <div>
      <SerialPassthrough></SerialPassthrough>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";

import ProfileMetadata from "@/panel/ProfileMetadata.vue";
import SerialPassthrough from "@/panel/SerialPassthrough.vue";
import Target from "@/panel/Target.vue";

export default defineComponent({
  name: "Profile",
  components: {
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
