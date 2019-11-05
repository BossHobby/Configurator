<script>
import { Bar } from "vue-chartjs";

export default {
  name: "plot",
  extends: Bar,
  props: ["title", "input", "axis", "labels"],
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
      lastUpdate: 0
    };
  },
  computed: {
    chartdata() {
      console.log(this.labels);
      return {
        labels: this.labels,
        datasets: this.axis.map((l, i) => {
          return {
            label: l,
            data: [],
            backgroundColor: this.colors[i]
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
        }
      };
    }
  },
  watch: {
    input(val) {
      const chart = this.$data._chart;
      if (!chart) {
        return this.renderChart(this.chartdata, this.options);
      }

      if (!chart.data.datasets) {
        return;
      }

      for (let i = 0; i < this.axis.length; i++) {
        chart.data.datasets[i].data = val[i];
      }

      if (Date.now() - this.lastUpdate > 100) {
        chart.update();
        this.lastUpdate = Date.now();
      }
    }
  },
  mounted() {
    this.renderChart(this.chartdata, this.options);
  }
};
</script>
