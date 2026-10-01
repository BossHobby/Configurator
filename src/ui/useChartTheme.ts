import { shallowRef, onMounted, onUnmounted } from "vue";

export interface ChartTheme {
  text: string;
  grid: string;
  series: string[];
}

const SERIES = 6;

/** Reads the chart palette from the CSS tokens defined in style.css. */
function readTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    text: token("--ui-muted"),
    grid: token("--ui-line"),
    series: Array.from({ length: SERIES }, (_, i) =>
      token(`--ui-series-${i + 1}`),
    ),
  };
}

/** Series colour for any index; wraps once the palette is exhausted. */
export function seriesColor(theme: ChartTheme, index: number) {
  return theme.series[index % theme.series.length];
}

export function useChartTheme() {
  const theme = shallowRef<ChartTheme>(readTheme());
  let observer: MutationObserver | undefined;
  function update() {
    theme.value = readTheme();
  }
  onMounted(() => {
    update();
    observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
  onUnmounted(() => observer?.disconnect());
  return theme;
}
