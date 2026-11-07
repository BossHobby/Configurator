import { useDefaultProfileStore } from "./default_profile";
import { defineStore } from "pinia";
import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { Log } from "@/log";
import semver from "semver";
import { decodeSemver } from "./util";
import { useRootStore } from "./root";
import { timeAgo } from "@/mixin/filters";
import type { aux_function_map_t } from "./types";
import { useTargetStore } from "./target";
import {
  DEFAULT_MOTOR,
  mergeDeep,
  migrateProfile as migrateProfileFor,
  migrateTemplatePatch as migrateTemplatePatchFor,
} from "./util/profile-migrate";

export {
  cloneProfileValue,
  fixedMotorMixer,
  mergeDeep,
  mergeFixedMotorMixer,
} from "./util/profile-migrate";

function migrateProfile(profile) {
  return migrateProfileFor(
    profile,
    useDefaultProfileStore(),
    useTargetStore().$state,
  );
}

export function migrateTemplatePatch(template: any): any {
  return migrateTemplatePatchFor(
    template,
    useDefaultProfileStore(),
    useTargetStore().$state,
  );
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    semver: "v0.0.0",
    modified: "",
    outputs: [],
    servo: { pwm_rate_hz: 50 },
    mixer: [],
    serial: {
      rx: 0,
      smart_audio: 0,
      hdzero: 0,
      gps: 0,
    },
    gps: { constellations: 5 },
    filter: {
      gyro: [{}, {}],
      dterm: [{}, {}],
    },
    osd: {
      callsign: "",
      elements: [],
      elements_hd: [],
      profiles: [
        {
          callsign: "",
          elements: [] as any[],
        },
        {
          callsign: "",
          elements: [] as any[],
        },
      ],
    },
    meta: {
      name: "",
      datetime: 0,
    },
    motor: {
      ...DEFAULT_MOTOR,
      gyro_orientation: 0,
    },
    rate: {
      mode: 0,
      profile: 0,
      silverware: {} as any,
      betaflight: {} as any,
      low_rate_mulitplier: 0,
      level_max_angle: 0,
      sticks_deadband: 0,
      rates: [] as any[],
      throttle_expo: 0,
      throttle_mid: 0,
    },
    voltage: {
      vbat_scale: 0,
      ibat_scale: 0,
    },
    receiver: {
      lqi_source: -1,
      role_map: [
        { channel: 0, min: -1, center: 0, max: 1 },
        { channel: 1, min: -1, center: 0, max: 1 },
        { channel: 3, min: -1, center: 0, max: 1 },
        { channel: 2, min: -1, center: 0, max: 1 },
      ],
      aux: [] as aux_function_map_t[],
      protocol: 0,
    },
    pid: {
      pid_profile: 0,
      pid_rates: [{}],
      stick_profile: 0,
      stick_rates: [{}],
      big_angle: {},
      small_angle: {},
      throttle_dterm_attenuation: {},
    },
    blackbox: {
      field_flags: 0,
      debug_flags: 0,
      sample_rate_hz: 0,
    },
    rover: {
      center_deadband: 0.05,
      yaw_rate: 180.0,
      pid: {
        kp: 70.0,
        ki: 0.0,
        kd: 6.0,
      },
      throttle_scale_breakpoint: 1.0,
      throttle_scale_factor: 0.5,
      reversible: 1,
    },
    vtx: {},
    wing: {},
    navigation: {},
  }),
  getters: {
    current_pid_rate: (state) => {
      return state.pid.pid_rates[state.pid.pid_profile];
    },
    current_stick_rate: (state) => {
      return state.pid.stick_rates[state.pid.stick_profile];
    },
    profileVersionGt(state) {
      return (version) => {
        return semver.gt(state.semver, version);
      };
    },
    has_legacy_motor_outputs(state) {
      return semver.lt(state.semver, "v0.3.0");
    },
  },
  actions: {
    set_profile(profile) {
      profile.motor = {
        ...DEFAULT_MOTOR,
        ...(profile.motor || {}),
      };
      profile.modified = timeAgo(new Date(profile.meta.datetime * 1000));
      profile.semver = decodeSemver(profile.meta.version);
      profile.meta.name = profile.meta.name.replace(/\0/g, "");
      this.$patch(profile);
    },
    set_current_pid_rate(rate) {
      const rates = [...this.pid.pid_rates];
      rates[this.pid.pid_profile] = rate;
      this.pid = {
        ...this.pid,
        pid_rates: rates,
      };
    },
    set_current_stick_rate(rate) {
      const rates = [...this.pid.stick_rates];
      rates[this.pid.stick_profile] = rate;
      this.pid = {
        ...this.pid,
        stick_rates: rates,
      };
    },
    set_osd_elements(elements) {
      this.osd = {
        ...this.osd,
        elements,
      };
    },
    set_osd_elements_hd(elements) {
      this.osd = {
        ...this.osd,
        elements_hd: elements,
      };
    },

    reset() {
      const default_profile = useDefaultProfileStore();
      return useRootStore().track("Resetting profile", 1, () =>
        this.apply_profile(default_profile.$state),
      );
    },

    fetch_profile() {
      return serial.get(QuicVal.Profile).then((p) => this.set_profile(p));
    },
    merge_profile(profile) {
      return useRootStore().track("Applying template", 2, async () => {
        const lhs = migrateProfile(await serial.get(QuicVal.Profile));
        const rhs = migrateTemplatePatch(profile);

        const p = mergeDeep(lhs, rhs);

        return this.apply_profile(p);
      });
    },
    apply_profile(profile) {
      const root = useRootStore();

      const p = migrateProfile(profile);

      return root
        .track("Applying profile", 1, () => serial.set(QuicVal.Profile, p))
        .then((p) => this.set_profile(p))
        .then(() =>
          root.append_alert({ type: "success", msg: "Profile applied!" }),
        )
        .then(() => root.reset_needs_apply())
        .catch((err) => {
          Log.error(err);
          root.append_alert({
            type: "danger",
            msg: "Apply failed! " + err,
          });
        });
    },
  },
});
