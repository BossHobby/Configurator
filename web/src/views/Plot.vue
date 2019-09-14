<template>
  <b-container>
    <vue-plotly :data="raw.data" :layout="raw.layout"></vue-plotly>
    <vue-plotly :data="copy.data" :layout="copy.layout"></vue-plotly>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
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
            title: "Time (s)",
            range: [0, 30]
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
  computed: {
    ...mapState({
      rx: state => state.rx,
      gyro: state => state.gyro
    })
  },
  methods: {
    ...mapActions(["fetch_rx", "fetch_gyro"])
  },
  watch: {
    rx(val) {
      const time = (Date.now() - this.start) / 1000;
      for (let i = 0; i < 4; i++) {
        this.raw.data[i].y.push(val.raw[i]);
        this.raw.data[i].x.push(time);

        this.copy.data[i].y.push(val.copy[i]);
        this.copy.data[i].x.push(time);
      }
    },
    gyro(val) {
      const time = (Date.now() - this.start) / 1000;
      if (Date.now() - this.start > 30 * 1000) {
        this.start = Date.now();
        for (let i = 0; i < 3; i++) {
          this.raw.data[i].y = [];
          this.raw.data[i].x = [];
        }
      }

      for (let i = 0; i < 3; i++) {
        this.raw.data[i].y.push(val.gyro_raw[i]);
        this.raw.data[i].x.push(time);

        //this.copy.data[i].y.push(val.copy[i]);
        //this.copy.data[i].x.push(time);
      }
    }
  },
  created() {
    this.start = Date.now();

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.fetch_gyro();
    }, 250);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>
