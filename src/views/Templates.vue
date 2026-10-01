<template>
  <div class="space-y-4">
    <p
      v-if="loading"
      role="status"
      class="rounded-lg border border-line bg-panel p-6 text-sm text-muted"
    >
      Loading community templates…
    </p>
    <div
      v-else-if="loadError"
      role="status"
      class="rounded-lg border border-line bg-panel p-6"
    >
      <p class="text-sm text-muted">Community templates could not be loaded.</p>
      <button
        type="button"
        class="mt-3 rounded-md border border-line px-3 py-2 text-sm"
        @click="loadTemplates"
      >
        Try again
      </button>
    </div>
    <p
      v-else-if="!templates.index.length"
      class="rounded-lg border border-line bg-panel p-6 text-sm text-muted"
    >
      No community templates are available.
    </p>
    <TemplateCard
      v-for="tmpl in templates.index"
      :key="tmpl.name"
      :template="tmpl"
    />
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useTemplatesStore } from "@/store/templates";
import { useProfileStore } from "@/store/profile";
import TemplateCard from "@/components/TemplateCard.vue";

export default defineComponent({
  name: "Templates",
  components: {
    TemplateCard,
  },
  setup() {
    return {
      templates: useTemplatesStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return { loading: true, loadError: false };
  },
  created() {
    this.loadTemplates();
  },
  methods: {
    async loadTemplates() {
      this.loading = true;
      this.loadError = false;
      try {
        await this.templates.fetch_templates();
      } catch {
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
