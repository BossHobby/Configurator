import { ref, watch, type Ref } from "vue";
import { readAppearance, resolveAppearance, type Appearance } from "./model";

// Module-level singleton: the preference, its watcher and the media-query
// listener are created once and shared by every caller.
let preference: Ref<Appearance> | undefined;

export function useAppearance(): Ref<Appearance> {
  if (preference) return preference;

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let initial: Appearance = "system";
  try {
    initial = readAppearance(
      localStorage.getItem("appearance"),
      localStorage.getItem("dark-mode"),
    );
  } catch {
    /* Storage may be unavailable. */
  }

  const state = ref<Appearance>(initial);
  const apply = () => {
    document.documentElement.dataset.theme = resolveAppearance(
      state.value,
      media.matches,
    );
  };
  media.addEventListener("change", apply);
  watch(state, (value) => {
    try {
      localStorage.setItem("appearance", value);
    } catch {
      /* Theme still works without persistence. */
    }
    apply();
  });
  apply();

  preference = state;
  return state;
}
