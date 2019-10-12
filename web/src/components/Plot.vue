<script>
import { Scatter } from "vue-chartjs";

export default {
  name: "plot",
  extends: Scatter,
  props: ["title", "input", "axis", "interval"],
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
      lastUpdate: 0
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
            borderColor: this.colors[i],
            showLine: true,
            interpolate: true
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
        },
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                unit: "second",
                displayFormats: {
                  second: "HH:mm:ss"
                }
              }
            }
          ]
        },
        tooltips: {
          mode: "interpolate",
          intersect: false,
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || "";
              if (label) {
                label += ": ";
              }
              label += tooltipItem.value;
              return label;
            }
          }
        },
        plugins: {
          crosshair: {
            line: {
              color: "#333"
            },
            sync: {
              enabled: true,
              group: 1,
              suppressTooltips: false
            }
          }
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

      for (let i = 0; i < this.axis.length; i++) {
        chart.data.datasets[i].data.push({
          x: Date.now(),
          y: val[i]
        });

        while (chart.data.datasets[i].data.length >= 60) {
          chart.data.datasets[i].data.shift();
        }
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
