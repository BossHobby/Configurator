<template>
  <div v-if="tmpl" class="card my-5">
    <div class="card-content">
      <p class="title">
        <span class="is-3">
          {{ tmpl.name }}
        </span>

        <span
          class="is-size-5 has-text-weight-normal has-text-grey-lighter is-pulled-right"
        >
          <font-awesome-icon icon="fa-regular fa-pen-to-square" fixed-width />
          by {{ tmpl.author }}
        </span>
      </p>

      <article class="media">
        <figure class="media-left">
          <p class="image" style="width: 300px">
            <img :src="tmpl.image" />
          </p>
        </figure>
        <div class="media-content">
          <p class="m-2">{{ tmpl.desc }}</p>
          <hr />

          <div v-for="o of tmpl.options" class="field is-horizontal">
            <div class="field-label is-medium is-align-self-flex-start">
              <label class="label">
                <span class="is-size-5">{{ o.title }}</span>
                <tooltip :text="o.desc" />
              </label>
            </div>
            <div class="field-body is-flex-grow-2">
              <div class="field">
                <div class="control mb-2">
                  <div class="select is-fullwidth">
                    <select v-model="selected[o.name]">
                      <option v-for="e of o.entries" :value="e.name">
                        {{ e.title }}
                      </option>
                    </select>
                  </div>
                </div>
                <p v-if="!selected[o.name]" class="help is-danger">
                  Please select an option!
                </p>
                <p
                  v-if="selectedValues[o.name]?.desc"
                  class="help has-text-grey-light"
                >
                  {{ selectedValues[o.name]?.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <spinner-btn
        class="card-footer-item is-primary"
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

            entry.title += " (auto-detected)";
            selected[option.name] = entry.name;
            break;
          }
        }
        if (!selected[option.name]) {
          const entry = option.entries.find((e) => e.name == option.default);
          if (entry) {
            selected[option.name] = option.default;
            entry.title += " (auto-detected)";
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
          (e) => e.name == this.selected[option.name]
        );
        if (!entry) {
          continue;
        }

        const fragment = await fetch(templateUrl(entry.file))
          .then((res) => res.text())
          .then((t) => YAML.parse(t));

        Log.info("template", "applying option", entry.name);
        mergeDeep(patch, fragment);
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

<style>
.is-256x256 {
  height: 256px;
  width: 256px;
}
</style>
