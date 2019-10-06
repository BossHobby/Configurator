<template>
  <div>
    <vue-plotly :data="data" :layout="layout"></vue-plotly>
  </div>
</template>

<script>
import VuePlotly from "@statnett/vue-plotly";

export default {
  name: "plot",
  components: {
    VuePlotly
  },
  props: ["title", "input", "axis", "interval"],
  data() {
    return {
      start: Date.now() / 1000,
      time: Date.now() / 1000,
      raw_data: []
    };
  },
  computed: {
    data() {
      return this.axis.map((name, i) => {
        const axis = {
          name: name,
          mode: "lines"
        };
        if (this.raw_data[i]) {
          axis.x = this.raw_data[i].x || [];
          axis.y = this.raw_data[i].y || [];
        }
        return axis;
      });
    },
    layout() {
      return {
        title: this.title,
        yaxis: {
          title: this.title,
          autorange: true
        },
        xaxis: {
          title: "Time (s)",
          range: [this.time - this.interval, this.time]
        }
      };
    }
  },
  watch: {
    input(val) {
      this.time = Date.now() / 1000 - this.start;
      for (let i = 0; i < val.length; i++) {
        if (!this.raw_data[i]) {
          this.raw_data[i] = {
            x: [],
            y: []
          };
        }

        this.raw_data[i].x.push(this.time);
        this.raw_data[i].y.push(val[i]);

        while (this.raw_data[i].x.length >= 1024) {
          this.raw_data[i].x.shift();
          this.raw_data[i].y.shift();
        }
      }
    }
  }
};
</script>
