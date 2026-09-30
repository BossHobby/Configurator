<template>
  <Shell
    :active="$route.path"
    :navigation="navigation"
    :aircraft="serial.is_connected ? profile.meta.name.replace(/\0/g, '') : ''"
    :target="serial.is_connected ? info.target_name || target.name : ''"
    :connected="serial.is_connected"
    :connection="serial.is_connected ? 'Connected' : 'Disconnected'"
  >
    <template #connection>
      <div class="flex items-center gap-4">
        <span v-if="serial.is_connected" class="hidden tabular-nums lg:inline">
          {{ state.looptime_autodetect }} µs · CPU {{ state.cpu_load }}% ·
          {{ state.cpu_temp.toFixed(1) }}°C
        </span>
        <ActionButton
          :busy="serial.is_connecting"
          :disabled="applying || rebooting"
          @click="toggleConnection"
          >{{ serial.is_connected ? "Disconnect" : "Connect" }}</ActionButton
        >
      </div>
    </template>
    <template #utilities>
      <button
        v-if="serial.is_connected"
        type="button"
        class="text-xs text-muted hover:text-ink"
        @click="downloadLog"
      >
        Export diagnostic log
      </button>
    </template>
    <header
      v-if="serial.is_connected"
      class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-semibold text-ink">{{ $route.meta.title }}</h1>
        <p v-if="$route.meta.description" class="mt-1 text-sm text-muted">
          {{ $route.meta.description }}
        </p>
      </div>
      <!-- Views teleport page-wide controls (e.g. active profiles) here. -->
      <div id="page-actions" class="flex flex-wrap items-end gap-3"></div>
    </header>
    <router-view />
    <template #footer>
      <SaveBar
        v-if="serial.is_connected || rebooting"
        :dirty="root.needs_apply"
        :needs-reboot="root.needs_reboot"
        :busy="applying"
        :rebooting="rebooting"
        :disabled="info.is_read_only || serial.is_connecting"
        :reboot-disabled="serial.is_connecting"
        :error="operationError"
        @apply="apply"
        @reboot="reboot"
      />
    </template>
  </Shell>
  <a ref="logDownloadAnchor" hidden></a>
  <AlertPortal />
  <ModalPortal />
  <div
    v-if="updateProcessing || !hasBrowserSupport"
    role="alertdialog"
    aria-modal="true"
    :aria-label="updateProcessing ? 'Updating' : 'Unsupported Browser'"
    class="fixed inset-0 z-[10002] flex items-center justify-center bg-workspace/95 p-6"
  >
    <div class="max-w-lg rounded-lg border border-line bg-panel p-6">
      <h1 class="mb-3 text-xl font-semibold">
        {{ updateProcessing ? "Updating…" : "Unsupported Browser" }}
      </h1>
      <p v-if="!updateProcessing">
        Your browser does not support the APIs needed by this application.
        Please use Chrome, Chromium, or Edge.
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { updater } from "@/store/util/updater";
import AlertPortal from "@/components/AlertPortal.vue";
import ModalPortal from "@/components/ModalPortal.vue";
import SelectModal from "@/components/SelectModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import Shell from "@/components/ui/Shell.vue";
import ActionButton from "@/components/ui/Button.vue";
import SaveBar from "@/components/ui/SaveBar.vue";
import type { IconName } from "@/components/ui/Icon.vue";
import { useTargetStore } from "./store/target";
import { useInfoStore } from "./store/info";
import { useProfileStore } from "./store/profile";
import { useStateStore } from "./store/state";
import { useSerialStore } from "./store/serial";
import { useRootStore } from "./store/root";
import { useConstantStore } from "./store/constants";
import { Log } from "./log";
import { WebSerial } from "./store/serial/webserial";
import { settings } from "./store/serial/settings";
export default defineComponent({
  components: { Shell, ActionButton, SaveBar, AlertPortal, ModalPortal },
  setup() {
    return {
      target: useTargetStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
      state: useStateStore(),
      serial: useSerialStore(),
      root: useRootStore(),
      constants: useConstantStore(),
    };
  },
  data() {
    return {
      applying: false,
      rebooting: false,
      operationError: undefined as string | undefined,
    };
  },
  computed: {
    navigation(): { id: string; label: string; icon: IconName }[] {
      if (!this.serial.is_connected) return [];
      const pages: { id: string; label: string; icon: IconName }[] = [
        { id: "/profile", label: "Profile", icon: "profile" },
        { id: "/setup", label: "Setup", icon: "setup" },
        { id: "/receiver", label: "Receiver", icon: "receiver" },
        { id: "/outputs", label: "Outputs", icon: "outputs" },
        { id: "/control", label: "Control", icon: "control" },
      ];
      if (this.info.has_feature(this.constants.Features.OSD))
        pages.push({ id: "/osd", label: "OSD", icon: "osd" });
      if (
        this.info.has_feature(this.constants.Features.BLACKBOX) &&
        this.info.quic_protocol_version > 1
      )
        pages.push({ id: "/blackbox", label: "Blackbox", icon: "blackbox" });
      pages.push({
        id: "/diagnostics",
        label: "Diagnostics",
        icon: "diagnostics",
      });
      if (
        this.info.has_feature(this.constants.Features.DEBUG) &&
        this.info.quic_protocol_version > 1
      )
        pages.push({ id: "/perf", label: "Performance", icon: "performance" });
      pages.push({ id: "/templates", label: "Templates", icon: "templates" });
      return pages;
    },
    updateProcessing() {
      return updater.updatePreparing() || updater.updatePending();
    },
    hasBrowserSupport() {
      return (
        settings.websocketUrl() ||
        settings.crsfUrl() ||
        (navigator.usb && WebSerial)
      );
    },
    logDownloadAnchorRef(): HTMLAnchorElement {
      return this.$refs.logDownloadAnchor as HTMLAnchorElement;
    },
  },
  created() {
    if (updater.updatePending()) updater.finishUpdate();
    window.addEventListener("beforeunload", this.onBeforeUnload);
    window.electron?.ipcRenderer.on("select-serial", this.selectSerial);
    window.electron?.ipcRenderer.on("select-usb-device", this.selectUSBDevice);
  },
  unmounted() {
    window.removeEventListener("beforeunload", this.onBeforeUnload);
    window.electron?.ipcRenderer.removeAllListeners("select-serial");
    window.electron?.ipcRenderer.removeAllListeners("select-usb-device");
  },
  methods: {
    onBeforeUnload(event: BeforeUnloadEvent) {
      if (this.serial.is_connected && this.root.needs_apply) {
        event.preventDefault();
      }
    },
    /**
     * Asks what to do with unsaved changes before an action that would drop
     * them. Resolves false when the user cancels.
     */
    async resolveUnsaved(action: string): Promise<boolean> {
      if (!this.root.needs_apply || this.info.is_read_only) return true;
      const choice = await this.$modal.show(ConfirmModal, {
        title: "Unsaved changes",
        message: `Your changes have not been applied to the flight controller. ${action} anyway?`,
        actions: [
          { label: "Discard changes", value: "discard" },
          { label: "Apply first", value: "apply", variant: "primary" },
        ],
      });
      if (choice === "apply") {
        await this.apply();
        return !this.root.needs_apply;
      }
      return choice === "discard";
    },
    async toggleConnection() {
      if (
        this.serial.is_connected &&
        !(await this.resolveUnsaved("Disconnect"))
      )
        return;
      try {
        await this.serial.toggle_connection();
      } catch (error) {
        this.root.append_alert({ type: "danger", msg: String(error) });
      }
    },
    async apply() {
      if (
        this.applying ||
        this.rebooting ||
        this.info.is_read_only ||
        !this.serial.is_connected
      )
        return;
      this.applying = true;
      this.operationError = undefined;
      try {
        await this.profile.apply_profile(this.profile.$state);
        if (this.root.needs_apply)
          this.operationError = "Changes could not be applied. Try again.";
      } catch (error) {
        this.operationError = String(error);
      } finally {
        this.applying = false;
      }
    },
    async reboot() {
      if (this.applying || this.rebooting || !this.serial.is_connected) return;
      if (!(await this.resolveUnsaved("Reboot"))) return;
      this.rebooting = true;
      this.operationError = undefined;
      try {
        await this.serial.soft_reboot();
      } catch (error) {
        this.operationError = String(error);
        this.serial.is_connecting = false;
        this.root.append_alert({
          type: "danger",
          msg: "Reboot failed: " + error,
        });
      } finally {
        this.rebooting = false;
      }
    },
    selectSerial(event, ports) {
      this.$modal
        .show(SelectModal, {
          title: "Serial",
          options: ports.map((p) => {
            return {
              text: p.displayName + " " + p.portName,
              value: p.portId,
            };
          }),
        })
        .then((value) => {
          return window.electron?.ipcRenderer.send("serial", value);
        });
    },
    selectUSBDevice(event, devices) {
      this.$modal
        .show(SelectModal, {
          title: "USB Device",
          options: devices.map((d) => {
            return {
              text: d.productName,
              value: d.deviceId,
            };
          }),
        })
        .then((value) => {
          return window.electron?.ipcRenderer.send("usb-device", value);
        });
    },
    downloadLog() {
      const file = Log.history.join("\n");
      const encoded =
        "data:text/plain;charset=utf-8," + encodeURIComponent(file);
      const filename = `Log_${new Date().toISOString()}.txt`;

      this.logDownloadAnchorRef.setAttribute("href", encoded);
      this.logDownloadAnchorRef.setAttribute("download", filename);
      this.logDownloadAnchorRef.click();
    },
  },
});
</script>
