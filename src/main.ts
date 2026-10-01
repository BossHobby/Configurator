import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import pinia from "./store";

import SpinnerBtn from "./components/SpinnerBtn.vue";
import Tooltip from "./components/Tooltip.vue";
import UiSelect from "./components/ui/Select.vue";
import { ModalPlugin } from "./mixin/modal";

import "./style.css";
import "./mixin/chart.ts";

const app = createApp(App);

app.component("spinner-btn", SpinnerBtn);
app.component("tooltip", Tooltip);
app.component("UiSelect", UiSelect);

app.use(pinia);
app.use(router);
app.use(ModalPlugin);

app.mount("#app");
