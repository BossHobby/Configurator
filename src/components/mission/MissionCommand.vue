<template>
  <section
    class="rounded-lg border border-line bg-panel p-4"
    aria-labelledby="mission-command-title"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <h2 id="mission-command-title" class="text-sm font-semibold">Command</h2>
      <span
        v-if="guidable"
        class="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
        :class="ready ? 'border-accent text-accent' : 'border-line text-muted'"
      >
        <span
          class="size-1.5 rounded-full"
          :class="ready ? 'bg-accent' : 'bg-muted'"
        />{{ ready ? "Commands enabled" : "Mission switch off" }}
      </span>
    </header>

    <p v-if="!guidable" class="text-xs text-muted">
      This vehicle has no guided flight; the link only follows it.
    </p>
    <template v-else>
      <div class="grid grid-cols-2 gap-2">
        <UiButton
          class="min-h-11"
          :disabled="!ready"
          @click="command({ type: NavCommand.Hold }, 'Hold')"
          >Hold</UiButton
        >
        <UiButton
          class="min-h-11"
          :disabled="!ready"
          @click="command({ type: NavCommand.RTH }, 'Return home')"
          >Return home</UiButton
        >
        <UiButton
          class="col-span-2"
          :disabled="!ready || !status?.missionCount"
          @click="
            command(
              { type: NavCommand.Mission, index: NAV_MISSION_RESUME },
              'Resume mission',
            )
          "
          >Resume mission</UiButton
        >
        <UiButton
          v-if="selected !== undefined"
          class="col-span-2"
          :disabled="!ready || selected >= (status?.missionCount ?? 0)"
          @click="
            command(
              { type: NavCommand.Mission, index: selected },
              `Mission from waypoint ${selected + 1}`,
            )
          "
          >Fly from waypoint {{ selected + 1 }}</UiButton
        >
        <UiButton
          class="col-span-2"
          :disabled="!ready || !status?.guided"
          @click="changeAltitude"
          >Change altitude</UiButton
        >
      </div>

      <p class="mt-3 text-xs text-muted">
        <template v-if="ready"
          >Long-press or right-click the map for Go here.</template
        >
        <template v-else
          >Turn on the mission switch to command the craft. RTH and failsafe
          take priority.</template
        >
      </p>
    </template>

    <div v-if="nav.pending || nav.log.length" class="mt-4 border-t border-line">
      <h3 class="pt-3 pb-1 text-xs font-medium text-muted">Recent commands</h3>
      <ol class="space-y-1 text-xs" aria-live="polite">
        <li v-if="nav.pending" class="flex items-center gap-2">
          <Icon name="loading" class="motion-safe:animate-spin" />
          <span class="font-medium">{{ nav.pending.label }}</span>
          <span class="ml-auto text-muted">Sending…</span>
        </li>
        <li
          v-for="entry in nav.log"
          :key="entry.at"
          class="flex items-baseline gap-2"
          :title="resultMessage(entry.result)"
        >
          <span class="text-muted tabular-nums">{{ time(entry.at) }}</span>
          <span class="truncate font-medium">{{ entry.label }}</span>
          <span
            class="ml-auto shrink-0"
            :class="
              entry.result === NavResult.Ok ? 'text-accent' : 'text-warning'
            "
            >{{ shortResult(entry.result) }}</span
          >
        </li>
      </ol>
      <p
        v-if="lastFailure"
        class="mt-2 flex gap-2 text-xs text-warning"
        role="status"
      >
        <Icon name="warning" class="shrink-0" />{{ lastFailure }}
      </p>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UiButton from "@/components/ui/Button.vue";
import Icon from "@/components/ui/Icon.vue";
import AltitudeModal from "./AltitudeModal.vue";
import { useNavStore } from "@/store/nav";
import type { GeoPoint } from "@/store/util/mission";
import {
  NAV_MISSION_RESUME,
  NavCommand,
  NavResult,
  NavVehicle,
  resultMessage,
  type NavCommandRequest,
  type NavStatus,
} from "@/store/util/quic-rt";

export default defineComponent({
  name: "MissionCommand",
  components: { UiButton, Icon },
  props: {
    // Waypoint selected in the planner, offered as a mission start point.
    selected: { type: Number, default: undefined },
    limits: {
      type: Object as PropType<{ min_alt: number; max_alt: number }>,
      required: true,
    },
  },
  setup() {
    return {
      nav: useNavStore(),
      resultMessage,
      NavCommand,
      NavResult,
      NAV_MISSION_RESUME,
    };
  },
  computed: {
    status(): NavStatus | undefined {
      return this.nav.status;
    },
    // Rovers have no navigation; the firmware answers every command as unsupported.
    guidable(): boolean {
      return this.status?.vehicle != NavVehicle.Rover;
    },
    ready(): boolean {
      return !this.nav.stale && !!this.status?.guidedReady;
    },
    // Explains the newest command only while it is the one that failed.
    lastFailure(): string | undefined {
      const last = this.nav.log[0];
      if (this.nav.pending || !last || last.result === NavResult.Ok) {
        return undefined;
      }
      return resultMessage(last.result);
    },
  },
  methods: {
    time(at: number) {
      return new Date(at).toLocaleTimeString([], { hour12: false });
    },
    shortResult(result: NavResult) {
      switch (result) {
        case NavResult.Ok:
          return "Accepted";
        case NavResult.None:
          return "No answer";
        case NavResult.Unsupported:
          return "Unsupported";
        default:
          return "Rejected";
      }
    },
    command(cmd: NavCommandRequest, label: string) {
      return this.nav.send(cmd, label);
    },
    // The altitude the craft holds, within the guided limits.
    currentAltitude(): number | undefined {
      const current = this.nav.altitude?.altitude;
      if (current === undefined) return undefined;
      return Math.min(
        this.limits.max_alt,
        Math.max(this.limits.min_alt, Math.round(current)),
      );
    },
    // Asks for an altitude, starting from the current one.
    async pickAltitude(title: string, action: string) {
      const chosen = await this.$modal.show(AltitudeModal, {
        title,
        action,
        altitude: this.currentAltitude() ?? this.limits.min_alt,
        min: this.limits.min_alt,
        max: this.limits.max_alt,
      });
      return typeof chosen === "number" && this.ready ? chosen : undefined;
    },
    async changeAltitude() {
      const alt = await this.pickAltitude("Change altitude", "Change");
      if (alt === undefined || !this.status?.guided) return;
      return this.command(
        { type: NavCommand.SetAlt, alt },
        `Change altitude to ${alt} m`,
      );
    },
    // Choosing Go here in the map menu is the confirmation. It holds the
    // current altitude unless pickAlt asks for another one.
    async flyTo(point: GeoPoint, pickAlt = false) {
      if (!this.ready) return;
      const alt = pickAlt
        ? await this.pickAltitude("Go here at altitude", "Go here")
        : this.currentAltitude();
      if (alt === undefined) return;
      return this.command(
        { type: NavCommand.Goto, lat: point.lat, lon: point.lon, alt },
        `Go here at ${alt} m`,
      );
    },
  },
});
</script>
