<script>
import { Scatter } from "vue-chartjs";

export default {
  name: "RealtimePlot",
  extends: Scatter,
  props: ["title", "time", "input", "axis", "transform"],
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
      lastUpdate: 0
    };
  },
  computed: {
    chartdata() {
      var datasets = [];

      if (Array.isArray(this.axis)) {
        datasets = this.axis.map((l, i) => {
          return {
            label: l,
            data: [],
            fill: false,
            borderColor: this.colors[i],
            showLine: true,
            interpolate: true
          };
        });
      } else {
        datasets = [
          {
            label: this.axis,
            data: [],
            fill: false,
            borderColor: this.colors[0],
            showLine: true,
            interpolate: true
          }
        ];
      }

      return {
        labels: [],
        datasets
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
          mode: "index",
          position: "average",
          intersect: false,
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || "";
              if (label) {
                label += ": ";
              }
              label += tooltipItem.yLabel;
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
    input(values) {
      const chart = this.$data._chart;
      if (!chart) {
        return this.renderChart(this.chartdata, this.options);
      }

      const transform = this.transform || (v => v);
      const time = this.time || Date.now();

      if (Array.isArray(this.axis)) {
        for (let i = 0; i < this.axis.length; i++) {
          const val = Array.isArray(values) ? values[i] : values[this.axis[i]];
          chart.data.datasets[i].data.push({
            x: time,
            y: transform(val)
          });

          while (chart.data.datasets[i].data.length >= 60) {
            chart.data.datasets[i].data.shift();
          }
        }
      } else {
        chart.data.datasets[0].data.push({
          x: time,
          y: transform(values)
        });

        while (chart.data.datasets[0].data.length >= 60) {
          chart.data.datasets[0].data.shift();
        }
      }

      if (Date.now() - this.lastUpdate > 100) {
        chart.update();
        this.lastUpdate = time;
      }
    }
  },
  mounted() {
    this.renderChart(this.chartdata, this.options);
  },
  methods: {
    reset() {
      const chart = this.$data._chart;
      for (let i = 0; i < this.axis.length; i++) {
        chart.data.datasets[i].data = [];
      }
      this.renderChart(this.chartdata, this.options);
    }
  }
};
</script>
