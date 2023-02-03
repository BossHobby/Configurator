<template>
  <div class="modal is-active" v-if="template">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ template.name }}</p>

        <button class="delete has-background-white" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <p>
          {{ template.desc }}
        </p>
        <hr />

        <div v-for="o of template.options" class="field is-horizontal">
          <div class="field-label is-normal pt-0">
            <label class="label is-align-self-flex-start">
              <span class="is-size-4">{{ o.title }}</span>
              <tooltip :text="o.desc" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control mb-2">
                <div class="select is-fullwidth">
                  <select v-model="selected[o.name]">
                    <option v-for="e of o.entries" :value="e">
                      {{ e.name }}
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
      <footer class="modal-card-foot">
        <button class="button">Cancel</button>
        <button class="button is-success">Apply</button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "TemplateModal",
  props: ["template"],
  data() {
    return {
      selected: {},
    };
  },
});
</script>

<style></style>
