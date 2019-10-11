<script>
import { Line } from "vue-chartjs";

export default {
  name: "plot",
  extends: Line,
  props: ["title", "input", "axis", "interval"],
  data() {
    return {
      start: Date.now() / 1000,
      time: Date.now() / 1000,
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]
    };
  },
  computed: {
    chartdata() {
      return {
        labels: [],
        datasets: this.axis.map((l, i) => {
          return {
            label: l,
            data: [],
            fill: false,
            borderColor: this.colors[i]
          };
        })
      };
    },
    options() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        title: {
          display: true,
          text: this.title
        },
        elements: {
          line: {
            tension: 0 // disables bezier curves
          }
        }
      };
    }
  },
  watch: {
    input(val) {
      this.time = Date.now() / 1000 - this.start;

      const chart = this.$data._chart;

      chart.data.labels.push(Math.round(this.time));
      for (let i = 0; i < val.length; i++) {
        chart.data.datasets[i].data.push(val[i]);
      }

      while (chart.data.labels.length >= 60) {
        chart.data.labels.shift();
        for (let i = 0; i < chart.data.datasets.length; i++) {
          chart.data.datasets[i].data.shift();
        }
      }

      chart.update();
    }
  },
  mounted() {
    this.renderChart(this.chartdata, this.options);
  }
};
</script>
