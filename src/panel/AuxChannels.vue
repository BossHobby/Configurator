<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Aux Channels</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-8">
            <div
              v-for="f in auxFunctions"
              :key="f.key"
              class="field field-is-3 is-horizontal mr-4"
            >
              <div class="field-label">
                <label
                  class="label"
                  :for="f.key"
                  :class="classForIndex(f.index)"
                >
                  {{ f.key }}
                  <tooltip :entry="'channel.' + f.key.toLowerCase()" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      :id="f.key"
                      v-model.number="profile.receiver.aux[f.index]"
                      class="is-fullwidth"
                      :options="auxChannels"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">Current AUX State</p>
              </header>
              <div class="card-content">
                <div class="content">
                  <div
                    v-for="(v, index) in auxChannels"
                    :key="v.text"
                    class="columns"
                  >
                    <div class="column is-6 py-1">{{ v.text }}</div>
                    <div
                      class="column is-6 py-1"
                      :class="
                        valueForIndex(index) ? 'text-success' : 'text-danger'
                      "
                    >
                      {{ valueForIndex(index) ? "ON" : "OFF" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { $enum } from "ts-enum-util";
import { useConstantStore } from "@/store/constants";
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { mapState } from "pinia";

export default defineComponent({
  name: "AuxChannels",
  setup() {
    return {
      state: useStateStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    ...mapState(useConstantStore, {
      auxChannels: (state) => {
        return $enum(state.AuxChannels).map((value, key) => {
          return {
            text: key,
            value,
          };
        });
      },
      auxFunctions: (state) => {
        return $enum(state.AuxFunctions)
          .getKeys()
          .map((f, index) => {
            return {
              index,
              key: f,
            };
          })
          .filter((f) => !f.key.startsWith("_"));
      },
    }),
  },
  methods: {
    valueForIndex(index) {
      return this.state.aux[index];
    },
    classForIndex(index) {
      if (!this.profile.receiver.aux) {
        return "";
      }

      if (this.profile.receiver.aux[index] == 12) return "text-danger";
      if (this.profile.receiver.aux[index] == 13) return "text-success";
      if (this.valueForIndex(this.profile.receiver.aux[index])) {
        return "text-success";
      }
      return "";
    },
  },
});
</script>
