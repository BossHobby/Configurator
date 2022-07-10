<template>
  <div class="columns is-multiline">
    <div class="column is-one-third" v-for="tmpl of templates.index" :key="tmpl.name">
      <div class="card template-card">
        <div class="card-image">
          <figure class="image is-square">
            <img :src="tmpl.image" />
          </figure>
        </div>
        <div class="card-content">
          <p class="title">
            {{ tmpl.name }}
          </p>
          <p class="subtitle">
            {{ tmpl.category }}
          </p>
          <div class="content">
            {{ tmpl.desc }}
          </div>
        </div>
        <footer class="card-footer">
          <span class="card-footer-item"></span>
          <button class="card-footer-item button is-white" @click="applyProfile(tmpl)">
            Apply
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapActions, mapState } from "vuex";
import { serial } from "../store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import YAML from "yaml";

export default defineComponent({
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
});
</script>

<style lang="scss" scoped>
.template-card {
  max-width: 18em;

  .card-content {
    height: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
