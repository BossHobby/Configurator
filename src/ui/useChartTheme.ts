import { shallowRef, onMounted, onUnmounted } from "vue";
export function useChartTheme() {
  const theme = shallowRef({
    text: "#a5adb7",
    grid: "#393f46",
    series: ["#75baff", "#ffb66b", "#94d86a", "#ff9da7"],
  });
  let observer: MutationObserver;
  function update() {
    const dark = document.documentElement.dataset.theme === "dark";
    theme.value = dark
      ? {
          text: "#a5adb7",
          grid: "#393f46",
          series: ["#75baff", "#ffb66b", "#94d86a", "#ff9da7"],
        }
      : {
          text: "#536765",
          grid: "#d9e3df",
          series: ["#2467a4", "#ad570b", "#246b3c", "#b42332"],
        };
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
