<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">GPS</p>
      <div class="card-header-icon">
        <span v-if="gps.state !== 10" class="tag" :class="gpsConfigStateClass">
          {{ gps.configStateName }}
        </span>
      </div>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5" v-if="!gpsDetected">
        <div class="notification is-warning">
          <p>
            No GPS module detected. Make sure GPS is connected and configured on
            the correct serial port.
          </p>
        </div>
      </div>

      <div class="content column-narrow field-is-5" v-else>
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Module</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag is-medium">{{ gpsVersionName }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Satellites</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag is-medium" :class="satelliteCountClass">
                  {{ state.gps_sats }} {{ gpsStatusText }}
                </span>
                <span v-if="gps.sats_in_view > 0" class="ml-2">
                  ({{ gps.sats_used }} used / {{ gps.sats_in_view }} in view)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="field is-horizontal"
          v-if="gps.activeConstellations.length > 0"
        >
          <div class="field-label">
            <label class="label">Constellations</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <div class="is-size-7">
                  <span v-if="gps.gps.sats_in_view > 0" class="mr-2">
                    <span class="tag is-small is-info">GPS</span>
                    <span class="ml-1"
                      >{{ gps.gps.sats_used }}/{{ gps.gps.sats_in_view }}</span
                    >
                  </span>
                  <span v-if="gps.glonass.sats_in_view > 0" class="mr-2">
                    <span class="tag is-small is-info">GLO</span>
                    <span class="ml-1"
                      >{{ gps.glonass.sats_used }}/{{
                        gps.glonass.sats_in_view
                      }}</span
                    >
                  </span>
                  <span v-if="gps.galileo.sats_in_view > 0" class="mr-2">
                    <span class="tag is-small is-info">GAL</span>
                    <span class="ml-1"
                      >{{ gps.galileo.sats_used }}/{{
                        gps.galileo.sats_in_view
                      }}</span
                    >
                  </span>
                  <span v-if="gps.beidou.sats_in_view > 0" class="mr-2">
                    <span class="tag is-small is-info">BDS</span>
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

        <div class="field is-horizontal" v-if="state.gps_lock">
          <div class="field-label">
            <label class="label">Fix Type</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag" :class="fixTypeClass">
                  {{ gps.fixTypeName || "3D Fix" }}
                </span>
                <span v-if="gps.fix_quality > 0" class="ml-2">
                  Quality: {{ gps.fix_quality }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="state.gps_lock">
          <div class="field-label">
            <label class="label">Position</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <p class="is-size-7">
                  Lat: {{ formatCoordinate(state.gps_coord.lat, "lat") }}<br />
                  Lon: {{ formatCoordinate(state.gps_coord.lon, "lon") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="gps.h_acc > 0 && state.gps_lock">
          <div class="field-label">
            <label class="label">Accuracy</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <p class="is-size-7">
                  H: {{ (gps.h_acc / 1000).toFixed(1) }}m V:
                  {{ (gps.v_acc / 1000).toFixed(1) }}m
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="state.gps_lock">
          <div class="field-label">
            <label class="label">Altitude</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <p>{{ state.gps_altitude.toFixed(1) }} m</p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="state.gps_lock">
          <div class="field-label">
            <label class="label">Speed</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <p>{{ state.gps_speed.toFixed(1) }} km/h</p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="state.gps_lock">
          <div class="field-label">
            <label class="label">Heading</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <p>{{ state.gps_heading.toFixed(0) }}°</p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="gps.pdop > 0">
          <div class="field-label">
            <label class="label">PDOP</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag" :class="pdopClass">
                  {{ (gps.pdop / 100).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="gps.update_rate > 0">
          <div class="field-label">
            <label class="label">Update Rate</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag is-info">{{ gps.update_rate }} Hz</span>
                <span
                  v-if="gps.powerModeName !== 'Unknown'"
                  class="ml-2 tag is-info"
                >
                  {{ gps.powerModeName }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="gps.avg_cno > 0">
          <div class="field-label">
            <label class="label">Signal Quality</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <span class="tag" :class="signalQualityClass">
                  {{ gps.avg_cno }} dBHz
                </span>
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
import { useGpsStore } from "@/store/gps";

export default defineComponent({
  name: "GPS",
  setup() {
    const state = useStateStore();
    const gps = useGpsStore();

    return {
      state,
      gps,
    };
  },
  computed: {
    gpsDetected() {
      return this.state.gps_version !== 0;
    },
    fixTypeClass() {
      if (this.gps.fix_type >= 3) return "is-success";
      if (this.gps.fix_type === 2) return "is-warning";
      return "is-danger";
    },
    gpsStatusText() {
      if (!this.gpsDetected) return "- Not Detected";
      if (this.state.gps_lock) return "- Locked";
      return "- No Lock";
    },
    gpsStatusClass() {
      if (!this.gpsDetected) return "is-danger";
      if (this.state.gps_lock && this.state.gps_sats >= 6) return "is-success";
      if (this.state.gps_lock && this.state.gps_sats >= 4) return "is-warning";
      return "is-danger";
    },
    satelliteCountClass() {
      if (this.state.gps_sats >= 6) return "is-success";
      if (this.state.gps_sats >= 4) return "is-warning";
      return "is-danger";
    },
    gpsVersionName() {
      // GPS version constants from firmware
      const GPS_VERSIONS = {
        0x00040005: "u-blox M5",
        0x00040007: "u-blox M6",
        0x00070000: "u-blox M7",
        0x00080000: "u-blox M8",
        0x00190000: "u-blox M9",
        0x000a0000: "u-blox M10",
      };

      if (!this.gpsDetected) return "Not Detected";
      return (
        GPS_VERSIONS[this.state.gps_version] ||
        `Unknown (0x${this.state.gps_version.toString(16)})`
      );
    },
    signalQualityClass() {
      // Signal quality based on average C/N0
      if (this.gps.avg_cno >= 40) return "is-success"; // Excellent
      if (this.gps.avg_cno >= 35) return "is-info"; // Good
      if (this.gps.avg_cno >= 30) return "is-warning"; // Fair
      return "is-danger"; // Poor
    },
    pdopClass() {
      // PDOP quality (lower is better)
      const pdop = this.gps.pdop / 100;
      if (pdop <= 2.0) return "is-success"; // Excellent
      if (pdop <= 3.0) return "is-info"; // Good
      if (pdop <= 5.0) return "is-warning"; // Fair
      return "is-danger"; // Poor
    },
    gpsConfigStateClass() {
      // Configuration state classes
      if (this.gps.state === 9) return "is-success"; // Running
      if (this.gps.state === 8) return "is-info"; // Waiting for Lock
      if (this.gps.state === 10) return "is-danger"; // Not Detected
      return "is-warning"; // All other config states
    },
  },
  methods: {
    formatCoordinate(value: number, type: string): string {
      if (value === 0) return "No Fix";

      const absValue = Math.abs(value);
      const degrees = Math.floor(absValue);
      const minutes = (absValue - degrees) * 60;

      let direction = "";
      if (type === "lat") {
        direction = value >= 0 ? "N" : "S";
      } else {
        direction = value >= 0 ? "E" : "W";
      }

      return `${degrees}° ${minutes.toFixed(2)}' ${direction}`;
    },
  },
});
</script>
