import Vue from 'vue'
import Router from 'vue-router'

import store from './store'

import Setup from './views/Setup.vue'
import Rates from './views/Rates.vue'
import Receiver from './views/Receiver.vue'
import OSD from './views/OSD.vue'
import Motor from './views/Motor.vue'
import Blackbox from './views/Blackbox.vue'
import State from './views/State.vue'
import Perf from './views/Perf.vue'
import Profile from './views/Profile.vue'
import Flash from './views/Flash.vue'
import Home from './views/Home.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: () => {
        if (store.state.status.IsConnected) {
          return '/profile';
        }
        return '/home'
      },
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
      path: '/receiver',
      name: 'receiver',
      component: Receiver
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
      path: '/state',
      name: 'state',
      component: State
    },
    {
      path: '/perf',
      name: 'perf',
      component: Perf
    }
  ]
})


router.beforeEach((to, from, next) => {
  if (store.state.status.IsConnected) {
    if (to.name === 'home') {
      next({ name: "profile" })
    } else {
      next();
    }
  } else {
    if (to.name !== 'home' && to.name !== "flash") {
      next({ name: 'home' })
    } else {
      next()
    }
  }
})

export default router;