<template>
  <b-card>
    <h5 slot="header" class="mb-0">Channels</h5>
    <b-row>
      <b-col sm="8">
        <b-row v-for="(func, index) in auxFunctions" :key="func">
          <b-col sm="6" class="my-1">
            <label :for="func" :class="classForIndex(index)">
              {{ func }}
              <tooltip :entry="'channel.' + func.toLowerCase()" />
            </label>
          </b-col>
          <b-col sm="3" class="my-1">
            <b-form-select
              :id="func"
              v-model.number="receiver_aux[index]"
              :options="auxChannels"
            ></b-form-select>
          </b-col>
        </b-row>
      </b-col>
      <b-col offset="0" sm="4">
        <b-card>
          <h6 slot="header" class="mb-0">Current AUX State</h6>
          <b-row v-for="(v, index) in auxChannels" :key="v.text">
            <b-col sm="6" class="my-1">{{ v.text }}</b-col>
            <b-col
              sm="6"
              class="my-1"
              :class="valueForIndex(index) ? 'text-success' : 'text-danger'"
              >{{ valueForIndex(index) ? "ON" : "OFF" }}</b-col
            >
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { $enum } from "ts-enum-util";
import { mapFields } from "@/store/helper.js";

export default {
  name: "Channels",
  components: {},
  computed: {
    ...mapFields("profile", ["receiver.aux"]),
    ...mapState({
      aux: (state) => state.state.aux,
    }),
    ...mapState("constants", {
      auxChannels: (state) =>
        $enum(state.AuxChannels).map((value, key) => {
          return {
            text: key,
            value,
          };
        }),
      auxFunctions: (state) => $enum(state.AuxFunctions).getKeys(),
    }),
  },
  data() {
    return {};
  },
  methods: {
    valueForIndex(index) {
      return this.aux[index];
    },
    classForIndex(index) {
      if (!this.channel_aux) {
        return "";
      }

      if (this.channel_aux[index] == 12) return "text-danger";
      if (this.channel_aux[index] == 13) return "text-success";
      if (this.valueForIndex(this.channel_aux[index])) {
        return "text-success";
      }
      return "";
    },
  },
};
</script>
