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

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    description?: string;
  }
}

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
      meta: { title: "Welcome", description: "" },
    },
    {
      path: "/templates",
      name: "templates",
      component: Templates,
      meta: {
        title: "Templates",
        description: "Browse configurations shared by the community.",
      },
    },
    {
      path: "/profile",
      name: "profile",
      component: Profile,
      meta: {
        title: "Profile",
        description: "Craft identity, firmware, and configuration files.",
      },
    },
    {
      path: "/setup",
      name: "setup",
      component: Setup,
      meta: {
        title: "Setup",
        description: "Board orientation, power, and serial connections.",
      },
    },
    {
      path: "/outputs",
      name: "outputs",
      component: Outputs,
      meta: {
        title: "Outputs",
        description: "Assign outputs and configure motors and servos.",
      },
    },
    {
      path: "/control",
      name: "control",
      component: Control,
      meta: {
        title: "Control",
        description: "Tune rates, throttle response, PID gains, and filters.",
      },
    },
    {
      path: "/rates",
      redirect: "/control",
    },
    {
      path: "/receiver",
      name: "receiver",
      component: Receiver,
      meta: {
        title: "Receiver",
        description: "Verify your radio link and channel assignments.",
      },
    },
    {
      path: "/osd",
      name: "osd",
      component: OSD,
      meta: {
        title: "OSD",
        description: "Arrange the information in your goggles.",
      },
    },
    {
      path: "/motor",
      redirect: "/outputs",
    },
    {
      path: "/blackbox",
      name: "blackbox",
      component: Blackbox,
      meta: {
        title: "Blackbox",
        description: "Configure flight recording and download logs.",
      },
    },
    {
      path: "/state",
      redirect: "/diagnostics",
    },
    {
      path: "/diagnostics",
      name: "diagnostics",
      component: Diagnostics,
      meta: {
        title: "Diagnostics",
        description:
          "Inspect live sensor readings and flight-controller performance.",
      },
    },
    {
      path: "/perf",
      name: "perf",
      component: Perf,
      meta: {
        title: "Performance",
        description: "Inspect flight-controller task timing.",
      },
    },
  ],
});

router.beforeEach((to) => {
  const serial = useSerialStore();
  if (serial.is_connected) {
    if (to.name === "home") {
      return { name: "profile" };
    }
    return true;
  } else {
    if (to.name !== "home" && to.name !== "flash" && to.name !== "log") {
      return { name: "home" };
    }
    return true;
  }
});

export default router;
