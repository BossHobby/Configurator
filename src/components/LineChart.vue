<template>
  <ChartLine ref="chart" :data="chartData" :options="chartOptions" />
</template>

<script lang="ts">
import type { ChartOptions } from "chart.js";
import { seriesColor, useChartTheme } from "@/ui/useChartTheme";
import { defineComponent, type PropType } from "vue";
import { Line } from "vue-chartjs";

export default defineComponent({
  name: "LineChart",
  components: { ChartLine: Line },
  props: {
    title: { type: String, default: "" },
    axis: {
      type: Array as PropType<{ label: string; data: unknown[] }[]>,
      required: true,
    },
    labels: { type: Array as PropType<string[]>, required: true },
  },
  setup() {
    return { chartTheme: useChartTheme() };
  },
  computed: {
    chartData() {
      return {
        labels: this.labels,
        datasets: this.axis.map((a, i) => {
          return {
            label: a.label,
            data: a.data,
            borderColor: seriesColor(this.chartTheme, i),
            fill: false,
            radius: 1,
            pointRadius: 0,
            lineTension: 0.1,
          };
        }),
      };
    },
    chartOptions(): ChartOptions<"line"> {
      return {
        responsive: true,
        maintainAspectRatio: false,

        animation: {
          duration: 0,
        },

        scales: {
          y: {
            ticks: { color: this.chartTheme.text },
            grid: { color: this.chartTheme.grid },
          },
          x: {
            ticks: { color: this.chartTheme.text },
            grid: { color: this.chartTheme.grid },
            type: "linear",
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
            position: "average",
            mode: "index",
            intersect: false,
          },
        },
      };
    },
  },
});
</script>
