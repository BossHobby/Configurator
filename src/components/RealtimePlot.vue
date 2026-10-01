<template>
  <Scatter
    v-if="chartData"
    ref="chart"
    :data="chartData"
    :options="chartOptions"
  />
</template>

<script lang="ts">
import type { ChartOptions } from "chart.js";
import { seriesColor, useChartTheme } from "@/ui/useChartTheme";
import { defineComponent, type PropType } from "vue";
import { Scatter } from "vue-chartjs";

export default defineComponent({
  name: "RealtimePlot",
  components: { Scatter },
  props: {
    title: { type: String, default: "" },
    time: { type: Number, default: undefined },
    input: {
      type: [Number, Array, Object] as PropType<unknown>,
      default: undefined,
    },
    axis: {
      type: [String, Array] as PropType<string | string[]>,
      required: true,
    },
    transform: {
      type: Function as PropType<(value: unknown) => number>,
      default: undefined,
    },
  },
  setup() {
    return { chartTheme: useChartTheme() };
  },
  data() {
    return {
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
          y: {
            ticks: { color: this.chartTheme.text },
            grid: { color: this.chartTheme.grid },
          },
          x: {
            ticks: { color: this.chartTheme.text },
            grid: { color: this.chartTheme.grid },
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
          legend: {
            labels: {
              color: this.chartTheme.text,
              usePointStyle: true,
              boxWidth: 8,
            },
          },
          title: {
            color: this.chartTheme.text,
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
  watch: {
    chartTheme() {
      this.updateChartData();
    },
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
  methods: {
    updateChartData() {
      let datasets = [] as any[];

      if (Array.isArray(this.axis)) {
        datasets = this.axis.map((l, i) => {
          return {
            label: l,
            data: this.datasets[i] || [],
            fill: false,
            borderColor: seriesColor(this.chartTheme, i),
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
            borderColor: this.chartTheme.series[0],
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
});
</script>
