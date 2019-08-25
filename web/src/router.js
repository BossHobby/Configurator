import Vue from 'vue'
import Router from 'vue-router'
import Setup from './views/Setup.vue'
import Rates from './views/Rates.vue'
import Plot from './views/Plot.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: '/setup'
    },
    {
      path: '/setup',
      name: 'setup',
      component: Setup
    },
    {
      path: '/rates',
      name: 'rates',
      component: Rates
    },
    {
      path: '/plot',
      name: 'plot',
      component: Plot
    }
  ]
})
