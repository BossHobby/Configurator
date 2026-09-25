<template>
  <div
    v-if="tmpl"
    class="min-w-0 rounded-lg border border-line bg-panel text-ink my-5"
  >
    <div class="p-4">
      <p class="text-xl font-semibold">
        <span class="text-lg">
          {{ tmpl.name }}
        </span>

        <span class="text-lg font-normal text-muted float-right">
          <font-awesome-icon icon="fa-regular fa-pen-to-square" fixed-width />
          by {{ tmpl.author }}
        </span>
      </p>

      <article class="flex flex-col gap-5 lg:flex-row">
        <figure class="shrink-0">
          <p class="w-full max-w-64">
            <img :src="tmpl.image" />
          </p>
        </figure>
        <div class="min-w-0 flex-1">
          <p class="m-2">{{ tmpl.desc }}</p>
          <hr />

          <div v-for="o of tmpl.options" class="form-row">
            <div class="form-label self-start">
              <label class="text-sm font-medium text-ink">
                <span class="text-lg">{{ o.title }}</span>
                <tooltip :text="o.desc" />
              </label>
            </div>
            <div
              class="flex min-w-0 flex-1 flex-wrap items-center gap-3 grow-2"
            >
              <div class="min-w-0 flex-1">
                <div class="min-w-0 mb-2">
                  <div class="min-w-0 w-full">
                    <select class="form-input" v-model="selected[o.name]">
                      <option v-for="e of o.entries" :value="e.name">
                        {{ e.title }}
                      </option>
                    </select>
                  </div>
                </div>
                <p
                  v-if="!selected[o.name]"
                  class="mt-1 text-xs text-danger"
                >
                  Please select an option!
                </p>
                <p
                  v-if="selectedValues[o.name]?.desc"
                  class="mt-1 text-xs text-muted"
                >
                  {{ selectedValues[o.name]?.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
    <footer
      class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
    >
      <spinner-btn
        class="bg-accent text-on-accent border-transparent"
        @click="applyTemplate()"
        :disabled="!formValid"
      >
        Apply
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { useInfoStore } from "@/store/info";
import YAML from "yaml";
import { templateUrl, type TemplateEntry } from "@/store/templates";
import { defineComponent } from "vue";
import { mergeDeep, useProfileStore } from "@/store/profile";
import { Log } from "@/log";

export default defineComponent({
  name: "TemplateModal",
  props: ["template"],
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
  watch: {
    template(val) {
      this.updateTemplate(val);
    },
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
  created() {
    this.updateTemplate(this.template);
  },
});
</script>
