import { createPinia } from "pinia";
import { useRootStore } from "./root";

const pinia = createPinia();

const applyNeededStores = ["profile"];

pinia.use(({ store }) => {
  if (!applyNeededStores.includes(store.$id)) {
    return;
  }

  store.$subscribe((mutation) => {
    if (mutation.type != "direct") {
      return;
    }
    const root = useRootStore();
    root.set_needs_apply();
  });
});

export default pinia;
