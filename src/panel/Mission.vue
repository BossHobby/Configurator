<template>
  <div class="flex flex-col gap-4">
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
          class="relative isolate min-h-80 overflow-hidden rounded-lg border border-line lg:min-h-[32rem]"
          :class="
            root.fullscreen
              ? 'h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]'
              : 'h-[65vh] lg:h-[calc(100dvh-19rem)]'
          "
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
            <span class="mx-1 w-px bg-line" />
            <button
              type="button"
              class="flex items-center gap-1.5 rounded px-2 py-1 text-muted hover:text-ink"
              :title="root.fullscreen ? 'Exit fullscreen (Esc)' : undefined"
              :aria-pressed="root.fullscreen"
              @click="root.fullscreen = !root.fullscreen"
            >
              <component
                :is="root.fullscreen ? Minimize2 : Maximize2"
                :size="14"
                aria-hidden="true"
              />{{ root.fullscreen ? "Exit fullscreen" : "Fullscreen" }}
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
        <MissionStatus />
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
            v-if="session || liveUpload"
            class="flex items-center gap-1.5 text-xs"
            :class="mission.dirty ? 'text-warning' : 'text-muted'"
          >
            <span
              class="size-1.5 rounded-full"
              :class="mission.dirty ? 'bg-warning' : 'bg-accent'"
            />{{ mission.dirty ? "Not uploaded" : "In sync with FC" }}
          </span>
          <span v-else class="flex items-center gap-1.5 text-xs text-muted">
            <span class="size-1.5 rounded-full bg-muted" />Connect to upload
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <UiButton @click="importFile">Import</UiButton>
          <UiButton :disabled="!mission.waypoints.length" @click="exportFile"
            >Export</UiButton
          >
          <UiButton
            :busy="busy == 'clear'"
            :disabled="!!busy || !session || info.is_read_only"
            @click="clear"
            >Clear on FC</UiButton
          >
          <UiButton
            :busy="busy == 'fetch'"
            :disabled="!!busy || !session"
            @click="fetch"
            >Read from FC</UiButton
          >
          <UiButton
            variant="primary"
            :busy="busy == 'upload'"
            :disabled="
              !!busy ||
              !(session || liveUpload) ||
              (!liveUpload && info.is_read_only) ||
              hasErrors
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
            <col :span="waypointSpeeds ? 5 : 4" />
            <col class="w-36" />
            <col class="w-32" />
          </colgroup>
          <thead class="text-left text-xs text-muted">
            <tr>
              <th class="py-2 pr-2 pl-2 font-medium">#</th>
              <th class="py-2 pr-2 font-medium">Latitude</th>
              <th class="py-2 pr-2 font-medium">Longitude</th>
              <th class="py-2 pr-2 font-medium">Altitude (m)</th>
              <th
                class="py-2 pr-2 font-medium"
                title="Height above the ground below the waypoint, from elevation data."
              >
                Above ground
              </th>
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
                  v-model.lazy="fields[index].lat"
                  class="form-input"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  :aria-label="`Waypoint ${index + 1} latitude`"
                />
              </td>
              <td class="py-1.5 pr-2">
                <input
                  v-model.lazy="fields[index].lon"
                  class="form-input"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  :aria-label="`Waypoint ${index + 1} longitude`"
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
              <td
                class="py-1.5 pr-2 text-xs whitespace-nowrap"
                :class="
                  aboveGround(wp) < TERRAIN_CLEARANCE_WARN
                    ? 'font-medium text-danger'
                    : 'text-muted'
                "
              >
                {{
                  Number.isFinite(aboveGround(wp))
                    ? `${Math.round(aboveGround(wp))} m`
                    : "–"
                }}
              </td>
              <td v-if="waypointSpeeds" class="py-1.5 pr-2">
                <input
                  v-model.lazy="fields[index].speed"
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  :max="toKph(mission.limits.max_speed)"
                  :aria-label="`Waypoint ${index + 1} speed in km/h, empty for the navigation return speed`"
                  :placeholder="
                    cruiseSpeed > 0
                      ? `${toKph(cruiseSpeed)} (default)`
                      : 'Default'
                  "
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

      <div
        v-if="mission.waypoints.length"
        class="mt-5 border-t border-line pt-4"
        aria-labelledby="mission-terrain-title"
        role="group"
      >
        <div
          class="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
        >
          <h3 id="mission-terrain-title" class="text-sm font-semibold">
            Terrain
          </h3>
          <p
            class="text-xs text-muted"
            title="Elevation tiles come from AWS Terrain Tiles, which can see the area of the route."
          >
            {{
              home
                ? "Heights above home."
                : "Heights above the ground below #1, until the craft has a home point."
            }}
            Bare-ground data, about 30 m resolution.
          </p>
        </div>
        <TerrainProfile
          v-if="terrainProfile.length > 1"
          :profile="terrainProfile"
          :path="path"
          :warn-clearance="TERRAIN_CLEARANCE_WARN"
          :takeoff="takeoff"
        />
        <p
          v-else
          class="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-muted"
          :class="terrainState == 'error' ? 'text-warning' : ''"
        >
          {{
            terrainState == "error"
              ? "Elevation data could not be loaded. Terrain is not checked."
              : terrainState == "loading"
                ? "Loading elevation data…"
                : "Add a second waypoint to see the terrain along the route."
          }}
        </p>
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
import { Maximize2, Minimize2 } from "@lucide/vue";
import UiButton from "@/components/ui/Button.vue";
import UiSelect from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import MissionMap from "@/components/mission/MissionMap.vue";
import MissionCommand from "@/components/mission/MissionCommand.vue";
import MissionStatus from "@/components/mission/MissionStatus.vue";
import TerrainProfile from "@/components/mission/TerrainProfile.vue";
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
  MULTI_VERTICAL_RATES,
  WING_VERTICAL_RATES,
  formatDistance,
  formatDuration,
  hasCoord,
  missionFromFile,
  missionLegs,
  missionPath,
  missionRoute,
  pathReach,
  missionToFile,
  validateMission,
  type GeoPoint,
  type MissionIssue,
  type PathVertex,
} from "@/store/util/mission";
import {
  TERRAIN_CLEARANCE_WARN,
  Terrain,
  lowestClearance,
  sampleRoute,
  terrainProfile,
  type ProfileSample,
} from "@/store/util/terrain";

// New waypoints copy the previous altitude, starting here.
const DEFAULT_ALT = 30;
// Terrain samples along the route, at least this far apart.
const TERRAIN_STEP = 10;
const TERRAIN_SAMPLES = 400;

// Tiles stay cached while the app runs.
const terrain = new Terrain();
let terrainTimer: ReturnType<typeof setTimeout> | undefined;
let terrainToken = 0;

export default defineComponent({
  name: "Mission",
  components: {
    UiButton,
    UiSelect,
    Icon,
    MissionMap,
    MissionCommand,
    MissionStatus,
    TerrainProfile,
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
      TERRAIN_CLEARANCE_WARN,
      Maximize2,
      Minimize2,
    };
  },
  data() {
    return {
      tiles: readTileProvider() as TileProvider,
      selected: undefined as number | undefined,
      busy: undefined as "fetch" | "upload" | "clear" | undefined,
      follow: false,
      // Ground elevation along the route, refreshed after edits settle.
      ground: [] as { d: number; elevation: number }[],
      terrainState: "idle" as "idle" | "loading" | "error",
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
      // While armed, CRSF GPS home carries the launch point.
      const home = this.live ? this.nav.home : undefined;
      return hasCoord(home) ? home : undefined;
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
    // Armed, there is no configuration session: it is suspended, or the craft
    // was armed when we connected. The QUIC_RT link replaces the mission.
    liveUpload(): boolean {
      return (
        (!this.serial.is_connected || this.root.in_flight) && !!this.live?.armed
      );
    },
    // The configuration session answers mission commands.
    session(): boolean {
      return this.serial.is_connected && !this.root.in_flight;
    },
    // Mission waypoint the craft is flying to, highlighted on map and table.
    // Unsent edits renumber the plan, so its indices no longer match the FC.
    activeIndex(): number | undefined {
      return this.live?.mission && !this.mission.dirty
        ? this.live.missionIndex
        : undefined;
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
    // Table inputs in display units. Live telemetry re-renders the panel, and
    // lazy v-model leaves a focused input alone, unlike a :value binding.
    fields() {
      const toKph = this.toKph;
      return this.mission.waypoints.map((wp) => ({
        get lat() {
          return wp.lat / COORD_SCALE;
        },
        // The map cannot place a cleared coordinate; keep the last one.
        set lat(value: number | string) {
          if (typeof value == "number" && Number.isFinite(value))
            wp.lat = Math.round(value * COORD_SCALE);
        },
        get lon() {
          return wp.lon / COORD_SCALE;
        },
        set lon(value: number | string) {
          if (typeof value == "number" && Number.isFinite(value))
            wp.lon = Math.round(value * COORD_SCALE);
        },
        get speed(): number | string {
          return wp.speed ? toKph(wp.speed) : "";
        },
        // Empty means 0, which the firmware flies at the navigation return speed.
        set speed(value: number | string) {
          wp.speed = value === "" ? 0 : Number(value) / 3.6;
        },
      }));
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
    route(): GeoPoint[] {
      return missionRoute(this.mission.mission, this.home);
    },
    path(): PathVertex[] {
      return missionPath(
        this.mission.mission,
        this.home,
        this.legs,
        this.info.is_wing ? WING_VERTICAL_RATES : MULTI_VERTICAL_RATES,
        this.profile.navigation?.rth_altitude ?? 0,
      );
    },
    // Ground at the launch point: home, or below #1 until home is known.
    launchElevation(): number {
      return this.ground.length && this.route.length
        ? terrain.elevation(this.route[0])
        : NaN;
    },
    terrainProfile(): ProfileSample[] {
      if (!Number.isFinite(this.launchElevation)) return [];
      return terrainProfile(this.ground, this.launchElevation, this.path);
    },
    // The climb out from the ground is not checked against terrain, up to
    // #1 or the warning clearance, whichever is lower.
    takeoff(): number {
      if (!this.home || !this.mission.waypoints.length) return 0;
      const reach = pathReach(
        this.path,
        Math.min(this.mission.waypoints[0].alt, TERRAIN_CLEARANCE_WARN),
      );
      return Number.isFinite(reach)
        ? reach
        : (this.path.find((v) => v.index == 0)?.d ?? 0);
    },
    terrainIssues(): MissionIssue[] {
      const profile = this.terrainProfile;
      if (!profile.length) return [];
      const issues: MissionIssue[] = [];
      const offset = this.home ? 0 : 1;
      let from = 0;
      this.legs.forEach((leg, i) => {
        const to = from + leg.distance;
        const low = lowestClearance(profile, from, to, this.takeoff);
        from = to;
        if (!low || low.clearance >= TERRAIN_CLEARANCE_WARN) return;
        const index = i + offset;
        const name =
          index < this.mission.waypoints.length
            ? `The leg to #${index + 1}`
            : "The return home";
        issues.push({
          level: "warning",
          index: index < this.mission.waypoints.length ? index : undefined,
          msg:
            low.clearance < 0
              ? `${name} runs ${Math.round(-low.clearance)} m into the ground.`
              : `${name} passes ${Math.round(low.clearance)} m above the ground, not counting trees and buildings.`,
        });
      });
      return issues;
    },
    issues() {
      return [
        ...validateMission(this.mission.mission, {
          maxWaypoints: this.mission.max_waypoints,
          limits: this.mission.limits,
          reference: this.home ?? this.craft,
          routeDistance: this.routeDistance,
        }),
        ...this.terrainIssues,
      ];
    },
    hasErrors(): boolean {
      return this.issues.some((issue) => issue.level == "error");
    },
  },
  watch: {
    tiles(value: TileProvider) {
      saveTileProvider(value);
    },
    route: {
      handler() {
        clearTimeout(terrainTimer);
        terrainTimer = setTimeout(() => this.loadTerrain(), 300);
      },
      immediate: true,
    },
    // Follow the craft from takeoff, until the user pans away.
    "live.armed"(armed: boolean | undefined, was: boolean | undefined) {
      if (armed && !was) this.follow = true;
    },
    // Connecting keeps this page, which then reads the new session's mission.
    // Disarming refreshes it itself.
    "serial.is_connected"(connected: boolean) {
      if (
        connected &&
        this.mission.supported &&
        !this.root.in_flight &&
        !this.mission.dirty
      ) {
        this.fetch();
      }
    },
  },
  mounted() {
    // Keep unsent edits when coming back to the page.
    if (this.session && !this.mission.dirty) this.fetch();
    document.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    clearTimeout(terrainTimer);
    terrainToken++;
    document.removeEventListener("keydown", this.onKeydown);
    this.root.fullscreen = false;
  },
  methods: {
    onKeydown(event: KeyboardEvent) {
      // Esc first closes the map menu or a dialog.
      if (
        event.key != "Escape" ||
        event.defaultPrevented ||
        (event.target as Element).closest?.('[role="dialog"], [aria-modal]')
      )
        return;
      this.root.fullscreen = false;
    },
    flyTo(point: GeoPoint, pickAlt: boolean) {
      (
        this.$refs.command as InstanceType<typeof MissionCommand> | undefined
      )?.flyTo(point, pickAlt);
    },
    fitMission() {
      this.follow = false;
      this.map?.fit();
    },
    async loadTerrain() {
      const route = this.route;
      const token = ++terrainToken;
      if (!route.length) {
        this.ground = [];
        this.terrainState = "idle";
        return;
      }
      const step = Math.max(TERRAIN_STEP, this.routeDistance / TERRAIN_SAMPLES);
      const samples = sampleRoute(route, step);
      this.terrainState = "loading";
      try {
        await terrain.load(samples.map((s) => s.point));
      } catch (err) {
        if (token != terrainToken) return;
        Log.warn("mission", "terrain", err);
        // Ground of the previous route would not match this one.
        this.ground = [];
        this.terrainState = "error";
        return;
      }
      if (token != terrainToken) return;
      this.ground = samples.map((s) => ({
        d: s.d,
        elevation: terrain.elevation(s.point),
      }));
      this.terrainState = "idle";
    },
    // Height of a waypoint above the ground below it.
    aboveGround(wp: GeoPoint & { alt: number }) {
      if (!Number.isFinite(this.launchElevation)) return NaN;
      return this.launchElevation + wp.alt - terrain.elevation(wp);
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
      if (this.liveUpload) {
        if (this.live?.mission) {
          const choice = await this.$modal.show(ConfirmModal, {
            title: "Change the mission in flight?",
            message: `The craft keeps flying to waypoint ${this.live.missionIndex + 1} of the new route, or to its last waypoint if the route is shorter.`,
            actions: [
              { label: "Cancel", value: "cancel" },
              { label: "Upload", value: "upload", variant: "primary" },
            ],
          });
          if (choice !== "upload") return;
        }
        return this.run(
          "upload",
          () => this.mission.upload_live(),
          "Mission replaced. The flight controller saves it once the craft is disarmed and still.",
        );
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
