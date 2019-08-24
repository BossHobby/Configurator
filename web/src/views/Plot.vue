<template>
  <b-container>
    <vue-plotly :data="raw.data" :layout="raw.layout"></vue-plotly>
    <vue-plotly :data="copy.data" :layout="copy.layout"></vue-plotly>
  </b-container>
</template>

<script>
import { get } from "@/api.js";
import VuePlotly from "@statnett/vue-plotly";

export default {
  name: "plot",
  components: {
    VuePlotly
  },
  data() {
    return {
      raw: {
        data: [
          {
            name: "Roll",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Pitch",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Yaw",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Throttle",
            x: [],
            y: [],
            mode: "lines"
          }
        ],
        layout: {
          title: "Raw RX Channels",
          yaxis: {
            range: [-1, 1],
            autorange: false
          },
          xaxis: {
            title: "Time (s)"
          }
        }
      },
      copy: {
        data: [
          {
            name: "Roll",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Pitch",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Yaw",
            x: [],
            y: [],
            mode: "lines"
          },
          {
            name: "Throttle",
            x: [],
            y: [],
            mode: "lines"
          }
        ],
        layout: {
          title: "Copy RX Channels",
          yaxis: {
            range: [-1, 1],
            autorange: false
          },
          xaxis: {
            title: "Time (s)"
          }
        }
      }
    };
  },
  created() {
    const start = Date.now();

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      get("/api/rx").then(res => {
        const time = (Date.now() - start) / 1000;
        for (let i = 0; i < 4; i++) {
          this.raw.data[i].y.push(res.raw[i]);
          this.raw.data[i].x.push(time);

          this.copy.data[i].y.push(res.copy[i]);
          this.copy.data[i].x.push(time);
        }
      });
    }, 250);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>
