<template>
  <div class="flex flex-col gap-4">
    <!-- Once the link is live, the status sits above the commands. -->
    <MissionStatus v-if="nav.available && !showCommand" />

    <p
      v-if="serial.is_connected && !profile.serial?.gps"
      class="flex items-center gap-2 text-xs text-warning"
    >
      <Icon name="warning" />No GPS port is configured. The mission can be
      planned but not flown.
    </p>

    <div
      class="grid gap-4"
      :class="
        showCommand
          ? 'lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]'
          : ''
      "
    >
      <div class="min-w-0">
        <div
          class="relative h-[65vh] min-h-80 overflow-hidden rounded-lg border border-line lg:h-[calc(100dvh-19rem)] lg:min-h-[32rem]"
        >
          <MissionMap
            ref="map"
            :waypoints="mission.waypoints"
            :rth="mission.end_action == MissionEndAction.RTH"
            :selected="selected"
            :home="home"
            :position="craft"
            :heading="live ? nav.heading : undefined"
            :trail="nav.connected ? nav.trail : undefined"
            :target="liveTarget"
            :active="activeIndex"
            :live="!!live?.guidedReady"
            :follow="follow && hasCoord(craft)"
            :tiles="tiles"
            @flyto="flyTo"
            @add="add"
            @insert="insert"
            @move="move"
            @remove="remove"
            @select="selected = $event"
            @unfollow="follow = false"
          />
          <div
            class="absolute bottom-6 left-2 z-[400] flex flex-wrap gap-1 rounded-md border border-line bg-panel/90 p-1 text-xs"
            role="toolbar"
            aria-label="Map view"
            title="Map tiles come from the provider, which can see the area you view."
          >
            <button
              v-for="option in tileOptions"
              :key="option.value"
              type="button"
              class="rounded px-2 py-1"
              :class="
                tiles == option.value
                  ? 'bg-active font-medium text-ink'
                  : 'text-muted hover:text-ink'
              "
              :aria-pressed="tiles == option.value"
              @click="tiles = option.value"
            >
              {{ option.label }}
            </button>
            <span class="mx-1 w-px bg-line" />
            <button
              type="button"
              class="rounded px-2 py-1 disabled:opacity-50"
              :class="
                follow && hasCoord(craft)
                  ? 'bg-warning/15 font-medium text-warning'
                  : 'text-muted enabled:hover:text-ink'
              "
              :disabled="!hasCoord(craft)"
              :aria-pressed="follow"
              @click="follow = !follow"
            >
              Follow craft
            </button>
            <button
              type="button"
              class="rounded px-2 py-1 text-muted hover:text-ink"
              @click="fitMission"
            >
              Fit mission
            </button>
          </div>
        </div>
        <ul
          class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"
          aria-label="Map controls"
        >
          <li v-for="hint in mapHints" :key="hint.action">
            <span class="font-medium text-ink">{{ hint.gesture }}</span>
            {{ hint.action }}
          </li>
        </ul>
      </div>

      <div v-if="showCommand" class="flex flex-col gap-4 self-start">
        <MissionStatus compact />
        <MissionCommand
          ref="command"
          :selected="selected"
          :limits="mission.limits"
        />
      </div>
    </div>

    <section
      class="rounded-lg border border-line bg-panel p-5"
      aria-labelledby="mission-plan-title"
    >
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h2 id="mission-plan-title" class="text-base font-semibold">
            Mission
          </h2>
          <span
            class="flex items-center gap-1.5 text-xs"
            :class="mission.dirty ? 'text-warning' : 'text-muted'"
          >
            <span
              class="size-1.5 rounded-full"
              :class="mission.dirty ? 'bg-warning' : 'bg-accent'"
            />{{ mission.dirty ? "Not uploaded" : "In sync with FC" }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <UiButton @click="importFile">Import</UiButton>
          <UiButton :disabled="!mission.waypoints.length" @click="exportFile"
            >Export</UiButton
          >
          <UiButton
            :busy="busy == 'clear'"
            :disabled="!!busy || !serial.is_connected || info.is_read_only"
            @click="clear"
            >Clear on FC</UiButton
          >
          <UiButton
            :busy="busy == 'fetch'"
            :disabled="!!busy || !serial.is_connected"
            @click="fetch"
            >Read from FC</UiButton
          >
          <UiButton
            variant="primary"
            :busy="busy == 'upload'"
            :disabled="
              !!busy || !serial.is_connected || info.is_read_only || hasErrors
            "
            @click="upload"
            >Upload to FC</UiButton
          >
        </div>
      </header>

      <div class="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        <dl class="flex gap-8 text-sm tabular-nums">
          <div>
            <dt class="text-xs text-muted">Waypoints</dt>
            <dd class="font-semibold">
              {{ mission.waypoints.length
              }}<span
                v-if="mission.max_waypoints"
                class="font-normal text-muted"
              >
                / {{ mission.max_waypoints }}</span
              >
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted">
              Route{{ hasCoord(home) ? " from home" : "" }}
            </dt>
            <dd class="font-semibold">{{ formatDistance(routeDistance) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Est. time</dt>
            <dd class="font-semibold">{{ formatDuration(routeTime) }}</dd>
          </div>
        </dl>
        <UiSelect
          v-model="mission.end_action"
          class="w-56"
          label="After the last waypoint"
          :options="[
            { label: 'Hold position', value: MissionEndAction.Hold },
            { label: 'Return to home', value: MissionEndAction.RTH },
          ]"
        />
      </div>

      <ul
        v-if="issues.length"
        class="mt-3 space-y-1 text-xs"
        aria-live="polite"
      >
        <li
          v-for="(issue, i) in issues"
          :key="i"
          class="flex gap-2"
          :class="issue.level == 'error' ? 'text-danger' : 'text-warning'"
        >
          <Icon name="warning" class="shrink-0" />{{ issue.msg }}
        </li>
      </ul>

      <p
        v-if="!mission.waypoints.length"
        class="mt-4 rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-muted"
      >
        No waypoints yet. Click the map to add the first one.
      </p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[44rem] table-fixed text-sm tabular-nums">
          <colgroup>
            <col class="w-14" />
            <col :span="waypointSpeeds ? 4 : 3" />
            <col class="w-36" />
            <col class="w-32" />
          </colgroup>
          <thead class="text-left text-xs text-muted">
            <tr>
              <th class="py-2 pr-2 pl-2 font-medium">#</th>
              <th class="py-2 pr-2 font-medium">Latitude</th>
              <th class="py-2 pr-2 font-medium">Longitude</th>
              <th class="py-2 pr-2 font-medium">Altitude (m)</th>
              <th v-if="waypointSpeeds" class="py-2 pr-2 font-medium">
                Speed (km/h)
              </th>
              <th class="py-2 pr-2 font-medium">Leg</th>
              <th class="py-2 pr-2 font-medium">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(wp, index) in mission.waypoints"
              :key="index"
              class="border-t border-line"
              :class="
                index == activeIndex
                  ? 'bg-warning/10'
                  : index == selected
                    ? 'bg-active'
                    : ''
              "
              @focusin="selected = index"
            >
              <td class="py-1.5 pr-2 pl-2 font-semibold">
                <span class="flex items-center gap-1.5">
                  {{ index + 1
                  }}<span
                    v-if="index == activeIndex"
                    class="size-2 rounded-full bg-warning motion-safe:animate-pulse"
                    title="Flying to this waypoint"
                  /><span v-if="index == activeIndex" class="sr-only"
                    >, flying to this waypoint</span
                  >
                </span>
              </td>
              <td class="py-1.5 pr-2">
                <input
                  class="form-input"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  :aria-label="`Waypoint ${index + 1} latitude`"
                  :value="wp.lat / COORD_SCALE"
                  @change="setCoord(index, 'lat', $event)"
                />
              </td>
              <td class="py-1.5 pr-2">
                <input
                  class="form-input"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  :aria-label="`Waypoint ${index + 1} longitude`"
                  :value="wp.lon / COORD_SCALE"
                  @change="setCoord(index, 'lon', $event)"
                />
              </td>
              <td class="py-1.5 pr-2">
                <input
                  v-model.number="wp.alt"
                  class="form-input"
                  type="number"
                  step="1"
                  :min="mission.limits.min_alt"
                  :max="mission.limits.max_alt"
                  :aria-label="`Waypoint ${index + 1} altitude`"
                />
              </td>
              <td v-if="waypointSpeeds" class="py-1.5 pr-2">
                <input
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  :max="toKph(mission.limits.max_speed)"
                  :aria-label="`Waypoint ${index + 1} speed in km/h, empty for the navigation return speed`"
                  :value="wp.speed ? toKph(wp.speed) : ''"
                  :placeholder="
                    cruiseSpeed > 0
                      ? `${toKph(cruiseSpeed)} (default)`
                      : 'Default'
                  "
                  @change="setSpeed(index, $event)"
                />
              </td>
              <td class="py-1.5 pr-2 text-xs whitespace-nowrap text-muted">
                {{ legLabel(index) }}
              </td>
              <td class="py-1.5 pr-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="form-button px-2"
                  :disabled="index == 0"
                  :aria-label="`Move waypoint ${index + 1} up`"
                  @click="swap(index, index - 1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="ml-1 form-button px-2"
                  :disabled="index == mission.waypoints.length - 1"
                  :aria-label="`Move waypoint ${index + 1} down`"
                  @click="swap(index, index + 1)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  class="ml-1 form-button px-2 text-danger"
                  :aria-label="`Delete waypoint ${index + 1}`"
                  @click="remove(index)"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      hidden
      @change="loadFile"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UiButton from "@/components/ui/Button.vue";
import UiSelect from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import MissionMap from "@/components/mission/MissionMap.vue";
import MissionCommand from "@/components/mission/MissionCommand.vue";
import MissionStatus from "@/components/mission/MissionStatus.vue";
import {
  readTileProvider,
  saveTileProvider,
  type TileProvider,
} from "@/components/mission/tiles";
import { useMissionStore } from "@/store/mission";
import { useNavStore } from "@/store/nav";
import { useSerialStore } from "@/store/serial";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";
import { useInfoStore } from "@/store/info";
import { useRootStore } from "@/store/root";
import { Log } from "@/log";
import type { NavStatus } from "@/store/util/quic-rt";
import {
  COORD_SCALE,
  MissionEndAction,
  formatDistance,
  formatDuration,
  hasCoord,
  missionFromFile,
  missionLegs,
  missionToFile,
  validateMission,
  type GeoPoint,
} from "@/store/util/mission";

// New waypoints copy the previous altitude, starting here.
const DEFAULT_ALT = 30;

export default defineComponent({
  name: "Mission",
  components: {
    UiButton,
    UiSelect,
    Icon,
    MissionMap,
    MissionCommand,
    MissionStatus,
  },
  setup() {
    return {
      mission: useMissionStore(),
      nav: useNavStore(),
      serial: useSerialStore(),
      profile: useProfileStore(),
      state: useStateStore(),
      info: useInfoStore(),
      root: useRootStore(),
      COORD_SCALE,
      MissionEndAction,
      formatDistance,
      formatDuration,
      hasCoord,
    };
  },
  data() {
    return {
      tiles: readTileProvider() as TileProvider,
      selected: undefined as number | undefined,
      busy: undefined as "fetch" | "upload" | "clear" | undefined,
      follow: false,
      mapHints: [
        { gesture: "Click", action: "add a waypoint" },
        { gesture: "Click a leg", action: "insert one" },
        { gesture: "Drag", action: "move" },
        { gesture: "Right-click / long-press", action: "more actions" },
      ],
      tileOptions: [
        { label: "Satellite", value: "satellite" },
        { label: "Streets", value: "streets" },
      ] as { label: string; value: TileProvider }[],
    };
  },
  computed: {
    map(): InstanceType<typeof MissionMap> | undefined {
      return this.$refs.map as InstanceType<typeof MissionMap> | undefined;
    },
    // Live commands sit beside the map; the plan always spans below it.
    showCommand(): boolean {
      return this.nav.connected && !!this.nav.status;
    },
    // Fresh QUIC_RT link telemetry, which also flows while armed.
    live(): NavStatus | undefined {
      return this.nav.connected && !this.nav.stale
        ? this.nav.status
        : undefined;
    },
    home(): GeoPoint | undefined {
      if (this.serial.is_connected && hasCoord(this.state.gps_home)) {
        return this.state.gps_home;
      }
      // While armed, STATUS carries the launch point.
      const home = this.live?.home;
      return this.live?.armed && hasCoord(home) ? home : undefined;
    },
    craft(): GeoPoint | undefined {
      if (this.live) return this.nav.position;
      return this.serial.is_connected &&
        this.state.gps_lock &&
        hasCoord(this.state.gps_coord)
        ? this.state.gps_coord
        : undefined;
    },
    // Where navigation is flying: the guided target, waypoint or home.
    liveTarget(): GeoPoint | undefined {
      const live = this.live;
      if (!live || !(live.guided || live.mission || live.navigating))
        return undefined;
      return hasCoord(live.target) ? live.target : undefined;
    },
    // Mission waypoint the craft is flying to, highlighted on map and table.
    activeIndex(): number | undefined {
      return this.live?.mission ? this.live.missionIndex : undefined;
    },
    // Wings fly every leg at cruise throttle, so waypoint speeds do not apply.
    waypointSpeeds(): boolean {
      return !this.info.is_wing;
    },
    cruiseSpeed(): number {
      const navigation = this.profile.navigation;
      return (
        (this.info.is_wing
          ? navigation?.cruise_speed
          : navigation?.rth_cruise_speed) ?? 0
      );
    },
    legs() {
      return missionLegs(
        this.mission.mission,
        this.home,
        this.cruiseSpeed,
        this.waypointSpeeds,
      );
    },
    routeDistance(): number {
      return this.legs.reduce((sum, leg) => sum + leg.distance, 0);
    },
    routeTime(): number {
      return this.legs.reduce((sum, leg) => sum + leg.time, 0);
    },
    issues() {
      return validateMission(this.mission.mission, {
        maxWaypoints: this.mission.max_waypoints,
        limits: this.mission.limits,
        reference: this.home ?? this.craft,
        routeDistance: this.routeDistance,
      });
    },
    hasErrors(): boolean {
      return this.issues.some((issue) => issue.level == "error");
    },
  },
  watch: {
    tiles(value: TileProvider) {
      saveTileProvider(value);
    },
    // Follow the craft from takeoff, until the user pans away.
    "live.armed"(armed: boolean | undefined, was: boolean | undefined) {
      if (armed && !was) this.follow = true;
    },
  },
  mounted() {
    // Keep unsent edits when coming back to the page.
    if (this.serial.is_connected && !this.mission.dirty) this.fetch();
  },
  methods: {
    flyTo(point: GeoPoint, pickAlt: boolean) {
      (
        this.$refs.command as InstanceType<typeof MissionCommand> | undefined
      )?.flyTo(point, pickAlt);
    },
    fitMission() {
      this.follow = false;
      this.map?.fit();
    },
    legLabel(index: number) {
      // Legs start at home when it is known, so the arrival leg of a point
      // is offset by one.
      const leg = this.legs[this.home ? index : index - 1];
      if (!leg) return "–";
      return `${formatDistance(leg.distance)} · ${formatDuration(leg.time)}`;
    },
    add(point: GeoPoint) {
      const last = this.mission.waypoints[this.mission.waypoints.length - 1];
      this.mission.waypoints.push({
        ...point,
        alt: last?.alt ?? DEFAULT_ALT,
        speed: last?.speed ?? 0,
      });
      this.selected = this.mission.waypoints.length - 1;
    },
    insert(index: number, point: GeoPoint) {
      const prev = this.mission.waypoints[index - 1];
      this.mission.waypoints.splice(index, 0, {
        ...point,
        alt: prev?.alt ?? DEFAULT_ALT,
        speed: prev?.speed ?? 0,
      });
      this.selected = index;
    },
    move(index: number, point: GeoPoint) {
      Object.assign(this.mission.waypoints[index], point);
    },
    remove(index: number) {
      this.mission.waypoints.splice(index, 1);
      this.selected = undefined;
    },
    swap(a: number, b: number) {
      const wps = this.mission.waypoints;
      [wps[a], wps[b]] = [wps[b], wps[a]];
      this.selected = b;
    },
    toKph(speed: number) {
      return Number((speed * 3.6).toFixed(1));
    },
    setSpeed(index: number, event: Event) {
      // Empty means 0, which the firmware flies at the navigation return speed.
      const input = event.target as HTMLInputElement;
      this.mission.waypoints[index].speed =
        input.value == "" ? 0 : input.valueAsNumber / 3.6;
    },
    setCoord(index: number, key: "lat" | "lon", event: Event) {
      const value = (event.target as HTMLInputElement).valueAsNumber;
      this.mission.waypoints[index][key] = Number.isFinite(value)
        ? Math.round(value * COORD_SCALE)
        : NaN;
    },
    async run(
      busy: "fetch" | "upload" | "clear",
      action: () => Promise<void>,
      success?: string,
    ) {
      this.busy = busy;
      try {
        await action();
        if (success) this.root.append_alert({ type: "success", msg: success });
      } catch (err) {
        Log.error("mission", err);
        this.root.append_alert({
          type: "danger",
          msg: err instanceof Error ? err.message : String(err),
        });
      } finally {
        this.busy = undefined;
      }
    },
    fetch() {
      return this.run("fetch", () => this.mission.fetch());
    },
    async upload() {
      const warnings = this.issues.filter((issue) => issue.level == "warning");
      if (warnings.length) {
        const choice = await this.$modal.show(ConfirmModal, {
          title: "Upload mission?",
          message: warnings.map((w) => w.msg).join(" "),
          actions: [
            { label: "Cancel", value: "cancel" },
            { label: "Upload anyway", value: "upload", variant: "primary" },
          ],
        });
        if (choice !== "upload") return;
      }
      return this.run(
        "upload",
        () => this.mission.upload(),
        "Mission uploaded and saved on the flight controller.",
      );
    },
    async clear() {
      const choice = await this.$modal.show(ConfirmModal, {
        title: "Clear mission?",
        message:
          "This erases the mission stored on the flight controller and empties the planner. Export it first to keep a copy.",
        actions: [
          { label: "Cancel", value: "cancel" },
          { label: "Clear", value: "clear", variant: "primary" },
        ],
      });
      if (choice !== "clear") return;
      this.selected = undefined;
      return this.run(
        "clear",
        () => this.mission.clear(),
        "Mission cleared on the flight controller.",
      );
    },
    exportFile() {
      const blob = new Blob([missionToFile(this.mission.mission)], {
        type: "application/json",
      });
      const name = this.profile.meta.name.replace(/\0/g, "").trim();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name || "mission"}-mission.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 0);
    },
    importFile() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },
    async loadFile(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      try {
        this.mission.load(missionFromFile(await file.text()));
        this.selected = undefined;
        this.$nextTick(() => this.map?.fit());
      } catch (err) {
        this.root.append_alert({
          type: "danger",
          msg: `Could not load ${file.name}: ${err instanceof Error ? err.message : err}`,
        });
      }
    },
  },
});
</script>
