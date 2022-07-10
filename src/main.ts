import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { store } from "./store";

import SpinnerBtn from "./components/SpinnerBtn.vue";
import Tooltip from "./components/Tooltip.vue";
import InputSelect from "./components/InputSelect.vue";
import FontAwesomeIcon from "./mixin/icons";

import "./style.scss";
import "./mixin/chart.ts";

const app = createApp(App);

app.component("spinner-btn", SpinnerBtn);
app.component("tooltip", Tooltip);
app.component("input-select", InputSelect);
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.use(store);
app.use(router);

app.mount("#app");
