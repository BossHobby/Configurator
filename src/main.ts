import "@fortawesome/fontawesome-free/js/all";

import "./style.scss";
import "./chart.ts";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { store } from "./store";

import SpinnerBtn from "./components/SpinnerBtn.vue";
import Tooltip from "./components/Tooltip.vue";

const app = createApp({
  router,
  ...App,
});

app.component("spinner-btn", SpinnerBtn);
app.component("tooltip", Tooltip);

app.use(store);

app.mount("#app");
