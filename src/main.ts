import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'

import './style.scss'
// import 'chartjs-plugin-crosshair'
import './registerServiceWorker'

import App from './App.vue'
import router from './router'
import store from './store'

import SpinnerBtn from './components/SpinnerBtn.vue';
Vue.component("spinner-btn", SpinnerBtn);

Vue.use(BootstrapVue);
Vue.use(require('vue-moment'));

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
