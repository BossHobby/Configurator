<template>
  <Panel v-if="tmpl" :title="tmpl.name">
    <template #actions>
      <span class="flex items-center gap-1.5 text-xs text-muted">
        <Icon name="edit" class="size-3.5" />by {{ tmpl.author }}
      </span>
    </template>
    <article class="flex flex-col gap-6 lg:flex-row">
      <img
        :src="tmpl.image"
        alt=""
        class="h-auto w-full max-w-64 shrink-0 self-start rounded-md"
      />
      <div class="min-w-0 flex-1 space-y-4">
        <p class="text-sm text-muted">{{ tmpl.desc }}</p>
        <div class="form-grid">
          <div v-for="o of tmpl.options" :key="o.name" class="form-row">
            <label class="form-label" :for="'template-' + o.name">
              {{ o.title }} <tooltip :text="o.desc" />
            </label>
            <div class="relative">
              <select
                :id="'template-' + o.name"
                v-model="selected[o.name]"
                class="form-select"
                :aria-invalid="!selected[o.name] || undefined"
              >
                <option v-for="e of o.entries" :key="e.name" :value="e.name">
                  {{ e.title }}
                </option>
              </select>
              <Icon
                name="chevron"
                class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
              />
            </div>
            <p v-if="!selected[o.name]" class="text-xs text-danger">
              Please select an option.
            </p>
            <p
              v-else-if="selectedValues[o.name]?.desc"
              class="text-xs text-muted"
            >
              {{ selectedValues[o.name]?.desc }}
            </p>
          </div>
        </div>
      </div>
    </article>
    <footer class="mt-5 flex justify-end">
      <spinner-btn
        variant="primary"
        :disabled="!formValid"
        @click="applyTemplate()"
        >Apply template</spinner-btn
      >
    </footer>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import Icon from "@/components/ui/Icon.vue";
import { useInfoStore } from "@/store/info";
import YAML from "yaml";
import { templateUrl, type TemplateEntry } from "@/store/templates";
import { defineComponent, type PropType } from "vue";
import { mergeDeep, useProfileStore } from "@/store/profile";
import { Log } from "@/log";

export default defineComponent({
  name: "TemplateModal",
  components: { Panel, Icon },
  props: {
    template: { type: Object as PropType<TemplateEntry>, default: undefined },
  },
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      selected: {},
      tmpl: undefined as TemplateEntry | undefined,
    };
  },
  computed: {
    formValid() {
      for (const option of this.tmpl?.options || []) {
        if (!this.selected[option.name]) {
          return false;
        }
      }
      return true;
    },
    selectedValues() {
      const values = {};

      for (const key of Object.keys(this.selected)) {
        const option = this.tmpl?.options?.find((e) => e.name == key);
        if (!option) {
          continue;
        }
        values[key] = option.entries.find((e) => e.name == this.selected[key]);
      }

      return values;
    },
  },
  watch: {
    template(val) {
      this.updateTemplate(val);
    },
  },
  created() {
    this.updateTemplate(this.template);
  },
  methods: {
    updateTemplate(val: TemplateEntry) {
      if (!val) {
        this.tmpl = undefined;
        return;
      }

      const tmpl = JSON.parse(JSON.stringify(val));
      const selected = {};

      for (const option of tmpl.options || []) {
        for (const entry of option.entries) {
          for (const key of Object.keys(entry.selector || {})) {
            if (!entry.selector[key].includes(this.info[key])) {
              continue;
            }

            entry.title += " (auto-selected)";
            selected[option.name] = entry.name;
            break;
          }
        }
        if (!selected[option.name]) {
          const entry = option.entries.find((e) => e.name == option.default);
          if (entry) {
            selected[option.name] = option.default;
            entry.title += " (auto-selected)";
          }
        }
      }

      this.tmpl = tmpl;
      this.selected = selected;
    },
    async applyTemplate() {
      if (!this.tmpl) {
        return;
      }

      const patch = await fetch(this.tmpl?.profile)
        .then((res) => res.text())
        .then((t) => YAML.parse(t));

      for (const option of this.tmpl.options || []) {
        const entry = option.entries.find(
          (e) => e.name == this.selected[option.name],
        );
        if (!entry) {
          continue;
        }

        const fragment = await fetch(templateUrl(entry.file))
          .then((res) => res.text())
          .then((t) => YAML.parse(t));

        Log.info("template", "applying option", entry.name);
        mergeDeep(patch, fragment.profile);
      }

      if (this.tmpl?.mutations) {
        for (const mut of this.tmpl.mutations) {
          const match = mut.options.find((o) => {
            return Object.entries(o.selector).every(([key, values]) => {
              return values.includes(this.selected[key]);
            });
          });
          if (!match) {
            continue;
          }
          Log.info("template", "applying mutation", match.name);
          mergeDeep(patch, match.profile);
        }
      }

      return this.profile.merge_profile(patch);
    },
  },
});
</script>
