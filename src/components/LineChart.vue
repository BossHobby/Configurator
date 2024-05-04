<template>
  <LineChart :data="chartData" :options="chartOptions" ref="chart" />
</template>

<script lang="ts">
import type { ChartOptions } from "chart.js";
import { defineComponent } from "vue";
import { Line } from "vue-chartjs";

export default defineComponent({
  name: "line-chart",
  components: { LineChart: Line },
  props: ["title", "axis", "labels"],
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
            borderColor: this.colors[i],
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
          x: {
            type: "linear",
          },
        },

        plugins: {
          title: {
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
