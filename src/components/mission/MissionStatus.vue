<template>
  <section
    v-if="compact"
    class="rounded-lg border border-line bg-panel"
    aria-labelledby="mission-status-title"
  >
    <header
      class="flex items-center gap-3 border-l-4 px-4 py-3"
      :class="tone.border"
    >
      <span class="relative flex size-3 shrink-0">
        <span
          v-if="pulse"
          class="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
          :class="tone.dot"
        />
        <span class="relative size-3 rounded-full" :class="tone.dot" />
      </span>
      <div class="min-w-0 flex-1">
        <h2
          id="mission-status-title"
          class="truncate text-base leading-tight font-semibold"
          :class="tone.text"
          aria-live="polite"
        >
          {{ mode }}
        </h2>
        <p class="mt-0.5 truncate text-xs text-muted tabular-nums">
          {{ detail }}
        </p>
      </div>
      <UiButton
        v-if="!serial.radio_link"
        class="shrink-0"
        @click="nav.disconnect()"
        >Disconnect</UiButton
      >
    </header>
    <dl
      v-if="status"
      class="grid grid-cols-3 gap-px border-t border-line bg-line"
      :class="nav.stale ? 'opacity-50' : ''"
    >
      <div
        v-for="tile in tiles"
        :key="tile.label"
        class="min-w-0 bg-panel px-3 py-2"
      >
        <dt class="truncate text-[11px] tracking-wide text-muted uppercase">
          {{ tile.label }}
        </dt>
        <dd
          class="mt-0.5 truncate text-lg leading-tight font-semibold tabular-nums"
          :class="tile.warn ? 'text-warning' : ''"
        >
          {{ tile.value
          }}<span
            v-if="tile.unit"
            class="ml-0.5 text-xs font-normal text-muted"
            >{{ tile.unit }}</span
          >
        </dd>
        <p v-if="tile.sub" class="truncate text-xs text-muted tabular-nums">
          {{ tile.sub }}
        </p>
        <div
          v-if="tile.progress !== undefined"
          class="mt-1 h-1 overflow-hidden rounded-full bg-line"
        >
          <div
            class="h-full bg-warning transition-[width]"
            :style="{ width: `${tile.progress * 100}%` }"
          />
        </div>
      </div>
    </dl>
  </section>
  <section
    v-else
    class="rounded-lg border border-line bg-panel"
    aria-labelledby="mission-status-title"
  >
    <div class="flex flex-wrap items-stretch">
      <div
        class="flex min-w-56 flex-1 items-center gap-3 border-l-4 px-4 py-3 sm:flex-none"
        :class="tone.border"
      >
        <span class="relative flex size-3 shrink-0">
          <span
            v-if="pulse"
            class="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
            :class="tone.dot"
          />
          <span class="relative size-3 rounded-full" :class="tone.dot" />
        </span>
        <div class="min-w-0">
          <h2
            id="mission-status-title"
            class="truncate text-base leading-tight font-semibold"
            :class="tone.text"
            aria-live="polite"
          >
            {{ mode }}
          </h2>
          <p class="mt-0.5 truncate text-xs text-muted tabular-nums">
            {{ detail }}
          </p>
        </div>
      </div>

      <dl
        v-if="status"
        class="grid flex-1 grid-cols-3 gap-px border-t border-line bg-line sm:grid-cols-4 sm:border-t-0 sm:border-l xl:grid-cols-6"
        :class="nav.stale ? 'opacity-50' : ''"
      >
        <div v-for="tile in tiles" :key="tile.label" class="bg-panel px-3 py-2">
          <dt class="text-[11px] tracking-wide text-muted uppercase">
            {{ tile.label }}
          </dt>
          <dd
            class="mt-0.5 text-lg leading-tight font-semibold whitespace-nowrap tabular-nums"
            :class="tile.warn ? 'text-warning' : ''"
          >
            {{ tile.value
            }}<span
              v-if="tile.unit"
              class="ml-0.5 text-xs font-normal text-muted"
              >{{ tile.unit }}</span
            >
          </dd>
          <div
            v-if="tile.progress !== undefined"
            class="mt-1 h-1 overflow-hidden rounded-full bg-line"
          >
            <div
              class="h-full bg-warning transition-[width]"
              :style="{ width: `${tile.progress * 100}%` }"
            />
          </div>
        </div>
      </dl>
      <p
        v-else
        class="flex flex-1 items-center border-t border-line px-4 py-3 text-xs text-muted sm:border-t-0 sm:border-l"
      >
        {{
          nav.connected
            ? "Waiting for the first status from the flight controller."
            : "Connect to follow the craft on the map and command it over the CRSF radio link, also while armed."
        }}
      </p>

      <!-- A radio link session runs the QUIC_RT link itself. -->
      <div
        v-if="!serial.radio_link"
        class="flex items-center border-t border-line px-4 py-3 sm:border-t-0 sm:border-l"
      >
        <UiButton
          v-if="!nav.connected"
          variant="primary"
          :busy="nav.connecting"
          @click="connect"
          >Connect link</UiButton
        >
        <UiButton v-else @click="nav.disconnect()">Disconnect</UiButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UiButton from "@/components/ui/Button.vue";
import { useConnectionStore } from "@/store/connection";
import { useNavStore } from "@/store/nav";
import { useRootStore } from "@/store/root";
import { useSerialStore } from "@/store/serial";
import { useTelemetryStore } from "@/store/telemetry";
import { crsfKey } from "@/store/serial/serial";
import { formatDistance } from "@/store/util/mission";
import { CrsfTelemetryType } from "@/store/util/crsf-telemetry";
import { NavVehicle, type NavStatus } from "@/store/util/quic-rt";

type Tone = "idle" | "pilot" | "auto" | "alert";

const TONES: Record<Tone, { border: string; dot: string; text: string }> = {
  idle: { border: "border-l-line", dot: "bg-muted", text: "" },
  pilot: { border: "border-l-accent", dot: "bg-accent", text: "" },
  auto: { border: "border-l-warning", dot: "bg-warning", text: "text-warning" },
  alert: { border: "border-l-danger", dot: "bg-danger", text: "text-danger" },
};

interface Tile {
  label: string;
  value: string;
  unit?: string;
  // A secondary reading under the value.
  sub?: string;
  warn?: boolean;
  progress?: number;
}

// Splits "1.2 km" into value and unit so the unit can be set smaller.
function split(text: string): [string, string] {
  const i = text.lastIndexOf(" ");
  return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i + 1)];
}

export default defineComponent({
  name: "MissionStatus",
  components: { UiButton },
  props: {
    // Sits under the command panel once the link is live.
    compact: { type: Boolean, default: false },
  },
  setup() {
    return {
      connection: useConnectionStore(),
      nav: useNavStore(),
      root: useRootStore(),
      serial: useSerialStore(),
      telemetry: useTelemetryStore(),
    };
  },
  computed: {
    status(): NavStatus | undefined {
      return this.nav.status;
    },
    // Standard CRSF telemetry from the same bridge, when it is current.
    flightMode(): string | undefined {
      const fresh = this.telemetry.fresh(
        CrsfTelemetryType.FlightMode,
        this.nav.now,
      );
      return fresh ? this.telemetry.flightMode : undefined;
    },
    linkText(): string {
      const link = this.telemetry.link;
      if (
        !link ||
        !this.telemetry.fresh(CrsfTelemetryType.LinkStatistics, this.nav.now)
      ) {
        return "";
      }
      const rssi = link.activeAntenna ? link.uplinkRssi2 : link.uplinkRssi1;
      return ` · LQ ${link.uplinkQuality}% · ${rssi} dBm`;
    },
    state(): Tone {
      const s = this.status;
      if (!this.nav.connected || !s) return "idle";
      if (this.nav.stale || (s.armed && s.failsafe)) return "alert";
      if (!s.armed) return "idle";
      if (s.guided || s.mission || s.navigating) return "auto";
      if (s.vehicle == NavVehicle.Wing && s.navState) return "auto";
      return "pilot";
    },
    tone() {
      return TONES[this.state];
    },
    pulse(): boolean {
      return !!this.status?.armed && !this.nav.stale;
    },
    mode(): string {
      const s = this.status;
      if (!this.nav.connected) return "Link offline";
      if (!s) return "Connecting…";
      if (this.nav.stale) return "Telemetry lost";
      if (!s.armed) return "Disarmed";
      if (s.failsafe) return "Failsafe";
      if (s.guided) return "Guided";
      if (s.mission) return `Mission · waypoint ${s.missionIndex + 1}`;
      if (s.navigating) return "Returning home";
      if (s.vehicle == NavVehicle.Wing && s.navState) return "Navigating";
      return this.flightMode
        ? `Pilot control · ${this.flightMode}`
        : "Pilot control";
    },
    detail(): string {
      const s = this.status;
      if (!this.nav.connected) return "CRSF QUIC_RT link";
      if (!s) return "CRSF QUIC_RT link";
      const age = Math.max(0, this.nav.now - this.nav.updatedAt) / 1000;
      if (this.nav.stale) return `Last status ${age.toFixed(1)} s ago`;
      if (!s.armed) return `Live · on the ground${this.linkText}`;
      return s.guidedReady
        ? `Live · mission switch on, commands enabled${this.linkText}`
        : `Live · mission switch off${this.linkText}`;
    },
    tiles(): Tile[] {
      const s = this.status;
      if (!s) return [];
      const nav = this.nav;
      const missing = "—";
      const distanceTile = (label: string, meters?: number) => {
        if (meters === undefined) return { label, value: missing };
        const [value, unit] = split(formatDistance(meters));
        return { label, value, unit };
      };
      const flying = s.guided || s.mission || s.navigating;
      const now = nav.now;
      const battery = this.telemetry.fresh(CrsfTelemetryType.Battery, now)
        ? this.telemetry.battery
        : undefined;
      const airspeed = this.telemetry.fresh(CrsfTelemetryType.Airspeed, now)
        ? this.telemetry.airspeed
        : undefined;
      const altitude = nav.altitude;
      const groundSpeed = nav.groundSpeed;
      return [
        altitude
          ? {
              label: "Altitude",
              value: altitude.altitude.toFixed(1),
              unit: "m",
              sub: `${altitude.verticalSpeed >= 0 ? "↑" : "↓"} ${Math.abs(altitude.verticalSpeed).toFixed(1)} m/s`,
            }
          : { label: "Altitude", value: missing },
        {
          label: "Speed",
          value:
            groundSpeed !== undefined
              ? (groundSpeed * 3.6).toFixed(0)
              : missing,
          unit: groundSpeed !== undefined ? "km/h" : "",
          sub:
            airspeed !== undefined
              ? `Air ${(airspeed * 3.6).toFixed(0)} km/h`
              : undefined,
        },
        distanceTile("Home", nav.homeDistance),
        flying
          ? {
              ...distanceTile(
                s.mission
                  ? `WP ${s.missionIndex + 1}/${s.missionCount}`
                  : "Target",
                nav.targetDistance,
              ),
              progress:
                s.mission && s.missionCount
                  ? s.missionIndex / s.missionCount
                  : undefined,
            }
          : {
              label: "Mission",
              value: s.missionCount ? `${s.missionCount} WP` : "None",
            },
        // The flight controller reports the average cell voltage.
        battery
          ? {
              label: "Cell",
              value: battery.voltage.toFixed(2),
              unit: "V",
              sub: `${battery.current.toFixed(1)} A · ${battery.capacityUsed} mAh`,
            }
          : { label: "Cell", value: missing },
        {
          label: "GPS",
          value: s.gpsLock ? String(nav.sats ?? missing) : "No fix",
          unit: s.gpsLock && nav.sats !== undefined ? "sats" : "",
          warn: !s.gpsLock,
        },
      ];
    },
  },
  methods: {
    async connect() {
      const key = crsfKey(this.connection.target);
      if (!key) return;
      try {
        await this.nav.connect(key);
      } catch {
        this.root.append_alert({
          type: "danger",
          msg: "Could not open the CRSF link.",
        });
      }
    },
  },
});
</script>
