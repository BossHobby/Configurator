<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Aux Channels</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-8">
            <div class="columns" v-for="f in auxFunctions" :key="f.key">
              <div class="column is-6">
                <label :for="f.key" :class="classForIndex(f.index)">
                  {{ f.key }}
                  <tooltip :entry="'channel.' + f.key.toLowerCase()" />
                </label>
              </div>
              <div class="column is-3">
                <input-select
                  :id="f.key"
                  v-model.number="receiver_aux[f.index]"
                  :options="auxChannels"
                ></input-select>
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
                  <div class="columns" v-for="(v, index) in auxChannels" :key="v.text">
                    <div class="column is-6">{{ v.text }}</div>
                    <div
                      class="column is-6"
                      :class="valueForIndex(index) ? 'text-success' : 'text-danger'"
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
import { mapGetters, mapState } from "vuex";
import { $enum } from "ts-enum-util";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "AuxChannels",
  components: {},
  computed: {
    ...mapFields("profile", ["receiver.aux"]),
    ...mapState({
      aux: (state) => state.state.aux,
    }),
    ...mapState("constants", {
      auxChannels: (state) => {
        return $enum(state.AuxChannels).map((value, key) => {
          return {
            text: key,
            value,
          };
        });
      },
    }),
    ...mapGetters("constants", ["AuxFunctions"]),
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
  },
  data() {
    return {};
  },
  methods: {
    valueForIndex(index) {
      return this.aux[index];
    },
    classForIndex(index) {
      if (!this.receiver_aux) {
        return "";
      }

      if (this.receiver_aux[index] == 12) return "text-danger";
      if (this.receiver_aux[index] == 13) return "text-success";
      if (this.valueForIndex(this.receiver_aux[index])) {
        return "text-success";
      }
      return "";
    },
  },
});
</script>
