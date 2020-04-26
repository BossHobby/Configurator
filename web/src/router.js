import Vue from 'vue'
import Router from 'vue-router'
import Setup from './views/Setup.vue'
import Rates from './views/Rates.vue'
import Channels from './views/Channels.vue'
import OSD from './views/OSD.vue'
import Motor from './views/Motor.vue'
import Blackbox from './views/Blackbox.vue'
import Log from './views/Log.vue'
import Profile from './views/Profile.vue'
import Flash from './views/Flash.vue'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: Home
    },
    {
      path: '/flash',
      name: 'flash',
      component: Flash
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
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
      path: '/osd',
      name: 'osd',
      component: OSD
    },
    {
      path: '/motor',
      name: 'motor',
      component: Motor
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
