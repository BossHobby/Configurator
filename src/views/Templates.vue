<template>
  <section class="hero is-primary">
    <div class="hero-body">
      <h5 class="title is-5">
        Templates provide a way to apply configurations supplied by the
        community.
      </h5>
    </div>
  </section>

  <TemplateCard
    v-for="tmpl of templates.index"
    :key="tmpl.name"
    :template="tmpl"
  ></TemplateCard>
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
  created() {
    this.templates.fetch_templates();
  },
});
</script>

<style lang="scss" scoped>
.template-card {
  .card-content {
    height: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
