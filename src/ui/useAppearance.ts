import { ref, onMounted, onUnmounted, watch } from "vue";
import { readAppearance, resolveAppearance, type Appearance } from "./model";

export function useAppearance() {
  const preference = ref<Appearance>("system");
  let media: MediaQueryList | undefined;
  function apply() {
    const theme = resolveAppearance(preference.value, media?.matches ?? false);
    document.documentElement.dataset.theme = theme;
  }
  onMounted(() => {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    try {
      preference.value = readAppearance(
        localStorage.getItem("appearance"),
        localStorage.getItem("dark-mode"),
      );
    } catch {
      /* Storage may be unavailable. */
    }
    media.addEventListener("change", apply);
    apply();
  });
  watch(preference, (value) => {
    try {
      localStorage.setItem("appearance", value);
    } catch {
      /* Theme still works without persistence. */
    }
    apply();
  });
  onUnmounted(() => media?.removeEventListener("change", apply));
  return preference;
}
