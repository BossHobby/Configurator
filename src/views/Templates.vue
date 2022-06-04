<template>
  <b-container>
    <b-row>
      <b-card-group deck>
        <b-card
          v-for="tmpl of templates.index"
          :key="tmpl.name"
          :title="tmpl.name"
          :sub-title="tmpl.category"
          :img-src="tmpl.image"
          img-top
          class="template-card"
        >
          <b-card-text>
            {{ tmpl.desc }}
          </b-card-text>
          <template #footer>
            <b-button
              class="float-right"
              variant="primary"
              @click="applyProfile(tmpl)"
            >
              Apply
            </b-button>
          </template>
        </b-card>
      </b-card-group>
    </b-row>
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { serial } from "../store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import YAML from "yaml";

export default {
  name: "Templates",
  computed: {
    ...mapState(["templates"]),
  },
  methods: {
    ...mapActions(["fetch_templates", "apply_profile"]),
    applyProfile(p) {
      return Promise.all([
        fetch(p.profile)
          .then((res) => res.text())
          .then((t) => YAML.parse(t)),
        serial.get(QuicVal.Profile),
      ]).then(([patch, profile]) => {
        const p = {
          ...profile,
          ...patch,
        };
        return this.apply_profile(p);
      });
    },
  },
  created() {
    this.fetch_templates();
  },
};
</script>

<style scoped>
.template-card {
  max-width: 18em;
}
</style>
