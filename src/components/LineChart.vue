<template>
  <ChartLine ref="chart" :data="chartData" :options="chartOptions" />
</template>

<script lang="ts">
import type { ChartOptions } from "chart.js";
import { useChartTheme } from "@/ui/useChartTheme";
import { defineComponent } from "vue";
import { Line } from "vue-chartjs";

export default defineComponent({
  name: "LineChart",
  components: { ChartLine: Line },
  props: ["title", "axis", "labels"],
  setup() {
    return { chartTheme: useChartTheme() };
  },
  data() {
    return {
      colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
    };
  },
  computed: {
    chartData() {
      return {
        labels: this.labels,
        datasets: this.axis.map((a, i) => {
          return {
            label: a.label,
            data: a.data,
            borderColor: this.chartTheme.series[i],
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
