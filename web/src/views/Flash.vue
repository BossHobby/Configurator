<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">
            Flash
            <b-button
              size="sm"
              class="my-2 mx-2"
              @click="hard_reboot_first_port()"
              :disabled="status.AvailablePorts.length == 0 || status.HasDFU"
            >Reset to Bootloader</b-button>
          </h5>
          <b-row v-if="!status.HasDFU">
            <b-col sm="6">No DFU detected</b-col>
          </b-row>
          <b-row v-else>
            <b-col sm="6">
              <b-form @submit="onSubmit">
                <b-form-group label="File" label-for="file-local" label-cols-sm="2">
                  <b-form-file id="file-local" v-model="file" accept=".hex, .bin"></b-form-file>
                </b-form-group>
                <b-button class="my-2" type="submit">Flash</b-button>
              </b-form>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "flash",
  data() {
    return {
      file: null
    };
  },
  computed: {
    ...mapState(["status"])
  },
  methods: {
    ...mapActions(["hard_reboot_first_port"]),
    onSubmit(evt) {
      evt.preventDefault();

      const formData = new FormData();
      formData.append("file", this.file);

      fetch("http://localhost:8000/api/flash/local", {
        method: "POST",
        body: formData
      }).then(() => this.$store.commit("append_alert", "firmware flashed!"));
    }
  }
};
</script>
