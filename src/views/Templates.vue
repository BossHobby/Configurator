<template>
  <div class="columns is-multiline">
    <div
      class="column mb-3 is-one-third"
      v-for="tmpl of templates.index"
      :key="tmpl.name"
    >
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
          <spinner-btn
            class="card-footer-item is-primary"
            @click="applyProfile(tmpl)"
          >
            Apply
          </spinner-btn>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useTemplatesStore } from "@/store/templates";
import { useProfileStore } from "@/store/profile";
import TemplateModal from "@/components/TemplateModal.vue";

export default defineComponent({
  name: "Templates",
  setup() {
    return {
      templates: useTemplatesStore(),
      profile: useProfileStore(),
    };
  },
  methods: {
    applyProfile(p) {
      this.$modal.show(TemplateModal, { template: p });
    },
  },
  created() {
    this.templates.fetch_templates();
  },
});
</script>

<style lang="scss" scoped>
.template-card {
  max-width: 18em;

  .card-content {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
