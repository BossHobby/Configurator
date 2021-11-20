<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <Metadata class="control-card"></Metadata>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Metadata from "@/components/Metadata";

export default {
  name: "home",
  components: {
    Metadata
  }
};
</script>
