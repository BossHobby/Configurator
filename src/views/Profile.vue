<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-alert variant="warning" :show="info.quic_protocol_version < 5">
          Incompatible Firmware! <br />
          Please update to be able to change settings. <br />
          Current profile can be exported and loaded.
        </b-alert>
      </b-col>
      <b-col sm="12">
        <Metadata class="control-card"></Metadata>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import Metadata from "@/components/Metadata";

export default {
  name: "home",
  components: {
    Metadata,
  },
  computed: {
    ...mapState(["info"]),
  },
};
</script>
