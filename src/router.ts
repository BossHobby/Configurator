import { useSerialStore } from "./store/serial";
import { createRouter, createWebHashHistory } from "vue-router";

import Setup from "./views/Setup.vue";
import Control from "./views/Control.vue";
import Diagnostics from "./views/Diagnostics.vue";
import Outputs from "./views/Outputs.vue";
import Receiver from "./views/Receiver.vue";
import OSD from "./views/OSD.vue";
import Blackbox from "./views/Blackbox.vue";
import Perf from "./views/Perf.vue";
import Profile from "./views/Profile.vue";
import Home from "./views/Home.vue";
import Templates from "./views/Templates.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: () => {
        const serial = useSerialStore();
        if (serial.is_connected) {
          return "/profile";
        }
        return "/home";
      },
    },
    {
      path: "/home",
      name: "home",
      component: Home,
    },
    {
      path: "/templates",
      name: "templates",
      component: Templates,
    },
    {
      path: "/profile",
      name: "profile",
      component: Profile,
    },
    {
      path: "/setup",
      name: "setup",
      component: Setup,
    },
    {
      path: "/outputs",
      name: "outputs",
      component: Outputs,
    },
    {
      path: "/control",
      name: "control",
      component: Control,
    },
    {
      path: "/rates",
      redirect: "/control",
    },
    {
      path: "/receiver",
      name: "receiver",
      component: Receiver,
    },
    {
      path: "/osd",
      name: "osd",
      component: OSD,
    },
    {
      path: "/motor",
      redirect: "/outputs",
    },
    {
      path: "/blackbox",
      name: "blackbox",
      component: Blackbox,
    },
    {
      path: "/state",
      redirect: "/diagnostics",
    },
    {
      path: "/diagnostics",
      name: "diagnostics",
      component: Diagnostics,
    },
    {
      path: "/perf",
      name: "perf",
      component: Perf,
    },
  ],
});

router.beforeEach((to, from, next) => {
  const serial = useSerialStore();
  if (serial.is_connected) {
    if (to.name === "home") {
      next({ name: "profile" });
    } else {
      next();
    }
  } else {
    if (to.name !== "home" && to.name !== "flash" && to.name !== "log") {
      next({ name: "home" });
    } else {
      next();
    }
  }
});

export default router;
