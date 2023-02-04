<template>
  <div class="modal-card" v-if="tmpl">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ tmpl.name }}</p>

      <button
        class="delete has-background-primary"
        aria-label="close"
        @click="$emit('close')"
      ></button>
    </header>
    <section class="modal-card-body">
      <p>
        {{ tmpl.desc }}
      </p>
      <hr />

      <div v-for="o of tmpl.options" class="field is-horizontal">
        <div class="field-label is-normal is-align-self-flex-start pt-0">
          <label class="label">
            <span class="is-size-4">{{ o.title }}</span>
            <tooltip :text="o.desc" />
          </label>
        </div>
        <div class="field-body">
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
            <p v-if="selected[o.name]?.desc">
              {{ selected[o.name]?.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-flex-end">
      <button class="button" @click="$emit('close')">Cancel</button>
      <button class="button is-success" @click="applyTemplate()">Apply</button>
    </footer>
  </div>
</template>

<script lang="ts">
import { useInfoStore } from "@/store/info";
import YAML from "yaml";
import { templateUrl, type TemplateEntry } from "@/store/templates";
import { defineComponent } from "vue";
import { mergeDeep, useProfileStore } from "@/store/profile";

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
  methods: {
    updateTemplate(val: TemplateEntry) {
      if (!val) {
        this.tmpl = undefined;
        return;
      }

      const tmpl = val;
      const selected = {};

      for (const option of tmpl.options) {
        for (const entry of option.entries) {
          entry.title = entry.name;

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

      for (const option of this.tmpl.options) {
        const entry = option.entries.find(
          (e) => e.name == this.selected[option.name]
        );
        if (!entry) {
          continue;
        }

        const fragment = await fetch(templateUrl(entry.file))
          .then((res) => res.text())
          .then((t) => YAML.parse(t));

        mergeDeep(patch, fragment);
      }

      this.$emit("close");
      return this.profile.merge_profile(patch);
    },
  },
  created() {
    this.updateTemplate(this.template);
  },
});
</script>

<style></style>
