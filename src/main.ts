import Vue from 'vue'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import './style.scss'
import './registerServiceWorker'

import App from './App.vue'
import router from './router'
import store from './store'

import SpinnerBtn from './components/SpinnerBtn.vue';
import Tooltip from './components/Tooltip.vue';

Vue.component("spinner-btn", SpinnerBtn);
Vue.component("tooltip", Tooltip);

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

Vue.use(require('vue-moment'));

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
