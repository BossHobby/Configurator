<template>
  <Scatter
    v-if="chartData"
    :data="chartData"
    :options="chartOptions"
    ref="chart"
  />
</template>

<script lang="ts">
import type { ChartOptions } from "chart.js";
import { defineComponent } from "vue";
import { Scatter } from "vue-chartjs";

export default defineComponent({
  name: "RealtimePlot",
  components: { Scatter },
  props: ["title", "time", "input", "axis", "transform"],
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
      lastUpdate: 0,
      chartData: undefined as any,
      datasets: [] as any[],
    };
  },
  computed: {
    chartOptions(): ChartOptions<"scatter"> {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0,
        },
        elements: {
          line: {
            tension: 0, // disables bezier curves
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "second",
              displayFormats: {
                second: "HH:mm:ss",
              },
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.title,
          },
          tooltip: {
            enabled: true,
            mode: "index",
            position: "average",
            intersect: false,
            callbacks: {
              label: (item) => {
                let label = item.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                label += item.formattedValue;
                return label;
              },
            },
          },
        },
      };
    },
  },
  methods: {
    updateChartData() {
      let datasets = [] as any[];

      if (Array.isArray(this.axis)) {
        datasets = this.axis.map((l, i) => {
          return {
            label: l,
            data: this.datasets[i] || [],
            fill: false,
            borderColor: this.colors[i],
            showLine: true,
            interpolate: true,
          };
        });
      } else {
        datasets = [
          {
            label: this.axis,
            data: this.datasets[0] || [],
            fill: false,
            borderColor: this.colors[0],
            showLine: true,
            interpolate: true,
          },
        ];
      }

      this.chartData = {
        labels: [],
        datasets,
      };
    },
  },
  watch: {
    input(values) {
      const transform = this.transform || ((v) => v);
      const time = this.time || Date.now();

      if (Array.isArray(this.axis)) {
        for (let i = 0; i < this.axis.length; i++) {
          const val = Array.isArray(values) ? values[i] : values[this.axis[i]];
          this.datasets[i] = [
            ...(this.datasets[i] || []),
            {
              x: time,
              y: transform(val),
            },
          ];

          while (this.datasets[i].length >= 60) {
            this.datasets[i].shift();
          }
        }
      } else {
        this.datasets[0] = [
          ...(this.datasets[0] || []),
          {
            x: time,
            y: transform(values),
          },
        ];

        while (this.datasets[0].length >= 60) {
          this.datasets[0].shift();
        }
      }

      if (Date.now() - this.lastUpdate > 250) {
        this.updateChartData();
      }
    },
    title() {
      this.updateChartData();
    },
    time() {
      this.updateChartData();
    },
    axis() {
      this.updateChartData();
    },
    transform() {
      this.updateChartData();
    },
  },
});
</script>
