<script>
import { Line } from "vue-chartjs";

export default {
  name: "line-chart",
  extends: Line,
  props: ["title", "axis", "labels"],
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
    };
  },
  computed: {
    chartdata() {
      return {
        labels: this.labels,
        datasets: this.axis.map((a, i) => {
          return {
            label: a.label,
            data: a.data,
            borderColor: this.colors[i],
            fill: false,
            radius: 1,
            pointRadius: 0,
            lineTension: 0.1,
          };
        }),
      };
    },
    options() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: this.title,
        },
        animation: {
          duration: 0,
        },
        responsiveAnimationDuration: 0,
        scales: {
          xAxes: [
            {
              type: "linear",
              gridLines: {
                display: true,
              },
              ticks: {
                step: 10,
              },
            },
          ],
          yAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                step: 10,
              },
            },
          ],
        },
        tooltips: {
          position: "average",
          mode: "index",
          intersect: false,
        },
      };
    },
  },
  watch: {
    title() {
      this.update();
    },
    axis() {
      this.update();
    },
    labels() {
      this.update();
    },
  },
  methods: {
    update() {
      this.renderChart(this.chartdata, this.options);
    },
  },
  mounted() {
    this.update();
  },
};
</script>
