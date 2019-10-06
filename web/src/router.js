import Vue from 'vue'
import Router from 'vue-router'
import Setup from './views/Setup.vue'
import Rates from './views/Rates.vue'
import Channels from './views/Channels.vue'
import Blackbox from './views/Blackbox.vue'
import Log from './views/Log.vue'

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
      path: '/channels',
      name: 'channels',
      component: Channels
    },
    {
      path: '/blackbox',
      name: 'blackbox',
      component: Blackbox
    },
    {
      path: '/log',
      name: 'log',
      component: Log
    }
  ]
})
