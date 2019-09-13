<template>
  <b-card>
    <h5 slot="header" class="mb-0">Metadata</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="name">Profile Name</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input id="name" type="text" v-model="Meta.Name"></b-form-input>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="datetime">Last Modified</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ date | moment("from") }}</b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Metadata",
  computed: {
    ...mapState({
      Meta: state => state.profile.Meta
    }),
    date() {
      return new Date(this.Meta.Datetime * 1000);
    }
  }
};
</script>

<style scoped>
</style>
