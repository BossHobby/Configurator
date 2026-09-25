<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">GPS</p>
      <div class="shrink-0 text-muted">
        <span
          v-if="gps.state !== 13"
          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
          :class="gpsConfigStateClass"
        >
          {{ gps.configStateName }}
        </span>
      </div>
    </header>

    <div class="p-4">
      <div class="grid grid-cols-12 gap-4">
        <div class="min-w-0 col-span-12 md:col-span-4">
          <div class="space-y-4" v-if="profile.serial.gps">
            <h6 class="text-xl font-semibold text-lg">Constellations</h6>
            <div
              class="form-row"
              v-for="item in constellationOptions"
              :key="item.bit"
            >
              <div class="form-label">
                <label
                  class="text-sm font-medium text-ink"
                  :for="'gps-constellation-' + item.bit"
                  >{{ item.name }}</label
                >
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <input
                    :id="'gps-constellation-' + item.bit"
                    type="checkbox"
                    class="form-switch"
                    :value="item.bit"
                    v-model="selectedConstellations"
                    :disabled="
                      selectedConstellations.length === 1 &&
                      selectedConstellations.includes(item.bit)
                    "
                  />
                  <label :for="'gps-constellation-' + item.bit"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="min-w-0 col-span-12 md:col-span-8">
          <h6 class="text-xl font-semibold text-lg">Status</h6>
          <div class="space-y-4" v-if="!gpsDetected">
            <div
              class="relative rounded-lg border border-current bg-panel p-4 pr-10 text-warning"
            >
              <p>
                No GPS module detected. Make sure GPS is connected and
                configured on the correct serial port.
              </p>
            </div>
          </div>

          <div class="space-y-4" v-else>
            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Module</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
                      >{{ gpsVersionName }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Satellites</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
                      :class="satelliteCountClass"
                    >
                      {{ state.gps_sats }} {{ gpsStatusText }}
                    </span>
                    <span v-if="gps.sats_in_view > 0" class="ml-2">
                      ({{ gps.sats_used }} used / {{ gps.sats_in_view }} in
                      view)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="gps.activeConstellations.length > 0">
              <div class="form-label">
                <label class="text-sm font-medium text-ink"
                  >Constellations</label
                >
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <div class="text-xs">
                      <span v-if="gps.gps.sats_in_view > 0" class="mr-2">
                        <span
                          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                          >GPS</span
                        >
                        <span class="ml-1"
                          >{{ gps.gps.sats_used }}/{{
                            gps.gps.sats_in_view
                          }}</span
                        >
                      </span>
                      <span v-if="gps.glonass.sats_in_view > 0" class="mr-2">
                        <span
                          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                          >GLO</span
                        >
                        <span class="ml-1"
                          >{{ gps.glonass.sats_used }}/{{
                            gps.glonass.sats_in_view
                          }}</span
                        >
                      </span>
                      <span v-if="gps.galileo.sats_in_view > 0" class="mr-2">
                        <span
                          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                          >GAL</span
                        >
                        <span class="ml-1"
                          >{{ gps.galileo.sats_used }}/{{
                            gps.galileo.sats_in_view
                          }}</span
                        >
                      </span>
                      <span v-if="gps.beidou.sats_in_view > 0" class="mr-2">
                        <span
                          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                          >BDS</span
                        >
                        <span class="ml-1"
                          >{{ gps.beidou.sats_used }}/{{
                            gps.beidou.sats_in_view
                          }}</span
                        >
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="state.gps_lock">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Fix Type</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
                      :class="fixTypeClass"
                    >
                      {{ gps.fixTypeName || "3D Fix" }}
                    </span>
                    <span v-if="gps.fix_quality > 0" class="ml-2">
                      Quality: {{ gps.fix_quality }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="state.gps_lock">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Position</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <p class="text-xs">
                      Lat: {{ formatCoordinate(state.gps_coord.lat, "lat")
                      }}<br />
                      Lon: {{ formatCoordinate(state.gps_coord.lon, "lon") }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="gps.h_acc > 0 && state.gps_lock">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Accuracy</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <p class="text-xs">
                      H: {{ (gps.h_acc / 1000).toFixed(1) }}m V:
                      {{ (gps.v_acc / 1000).toFixed(1) }}m
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="state.gps_lock">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Speed</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <p>{{ (state.gps_speed * 3.6).toFixed(1) }} km/h</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="state.gps_lock">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Heading</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <p>{{ state.gps_heading.toFixed(0) }}°</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="gps.pdop > 0">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">PDOP</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
                      :class="pdopClass"
                    >
                      {{ (gps.pdop / 100).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="gps.update_rate > 0">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Update Rate</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                      >{{ gps.update_rate }} Hz</span
                    >
                    <span
                      v-if="gps.powerModeName !== 'Unknown'"
                      class="ml-2 inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                    >
                      {{ gps.powerModeName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row" v-if="gps.avg_cno > 0">
              <div class="form-label">
                <label class="text-sm font-medium text-ink"
                  >Signal Quality</label
                >
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
                      :class="signalQualityClass"
                    >
                      {{ gps.avg_cno }} dBHz
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";
import { useGpsStore } from "@/store/gps";

export default defineComponent({
  name: "GPS",
  setup() {
    const state = useStateStore();
    const gps = useGpsStore();

    return {
      state,
      gps,
      profile: useProfileStore(),
      root: useRootStore(),
    };
  },
  computed: {
    constellationOptions() {
      return [
        { bit: 1, name: "GPS (US)" },
        { bit: 2, name: "GLONASS (RU)" },
        { bit: 4, name: "Galileo (EU)" },
        { bit: 8, name: "BeiDou (CN)" },
      ];
    },
    selectedConstellations: {
      get(): number[] {
        return this.constellationOptions
          .filter((item) => this.profile.gps.constellations & item.bit)
          .map((item) => item.bit);
      },
      set(bits: number[]) {
        this.profile.gps.constellations = bits.reduce(
          (mask, bit) => mask | bit,
          0,
        );
      },
    },
    gpsDetected() {
      return typeof this.gps.version === "number" && this.gps.version !== 0;
    },
    fixTypeClass() {
      if (this.gps.fix_type >= 3) return "text-accent";
      if (this.gps.fix_type === 2) return "text-warning";
      return "text-danger";
    },
    gpsStatusText() {
      if (!this.gpsDetected) return "- Not Detected";
      if (this.state.gps_lock) return "- Locked";
      return "- No Lock";
    },
    gpsStatusClass() {
      if (!this.gpsDetected) return "text-danger";
      if (this.state.gps_lock && this.state.gps_sats >= 6) return "text-accent";
      if (this.state.gps_lock && this.state.gps_sats >= 4)
        return "text-warning";
      return "text-danger";
    },
    satelliteCountClass() {
      if (this.state.gps_sats >= 6) return "text-accent";
      if (this.state.gps_sats >= 4) return "text-warning";
      return "text-danger";
    },
    gpsVersionName() {
      // GPS version constants from firmware
      const GPS_VERSIONS: Record<number, string> = {
        0x00040005: "u-blox M5",
        0x00040007: "u-blox M6",
        0x00070000: "u-blox M7",
        0x00080000: "u-blox M8",
        0x00190000: "u-blox M9",
        0x000a0000: "u-blox M10",
      };

      if (!this.gpsDetected) return "Not Detected";

      const version =
        typeof this.gps.version === "number" ? this.gps.version : 0;
      return GPS_VERSIONS[version] || `Unknown (0x${version.toString(16)})`;
    },
    signalQualityClass() {
      // Signal quality based on average C/N0
      if (this.gps.avg_cno >= 40) return "text-accent"; // Excellent
      if (this.gps.avg_cno >= 35) return "text-accent"; // Good
      if (this.gps.avg_cno >= 30) return "text-warning"; // Fair
      return "text-danger"; // Poor
    },
    pdopClass() {
      // PDOP quality (lower is better)
      const pdop = this.gps.pdop / 100;
      if (pdop <= 2.0) return "text-accent"; // Excellent
      if (pdop <= 3.0) return "text-accent"; // Good
      if (pdop <= 5.0) return "text-warning"; // Fair
      return "text-danger"; // Poor
    },
    gpsConfigStateClass() {
      // Configuration state classes
      if (this.gps.state === 10 || this.gps.state === 12) return "text-accent"; // Running
      if (this.gps.state === 8) return "text-accent"; // Waiting for Lock
      if (this.gps.state === 13) return "text-danger"; // Not Detected
      return "text-warning"; // All other config states
    },
  },
  watch: {
    "profile.gps": {
      handler() {
        this.root.set_needs_reboot();
      },
      deep: true,
    },
  },
  methods: {
    formatCoordinate(value: number, type: string): string {
      if (value === 0) return "No Fix";

      const decimalDegrees = value / 10000000;
      const absValue = Math.abs(decimalDegrees);
      const degrees = Math.floor(absValue);
      const minutes = (absValue - degrees) * 60;

      let direction = "";
      if (type === "lat") {
        direction = decimalDegrees >= 0 ? "N" : "S";
      } else {
        direction = decimalDegrees >= 0 ? "E" : "W";
      }

      return `${degrees}° ${minutes.toFixed(2)}' ${direction}`;
    },
  },
});
</script>
