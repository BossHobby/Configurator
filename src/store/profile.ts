import { useDefaultProfileStore } from "./default_profile";
import { defineStore } from "pinia";
import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { Log } from "@/log";
import semver from "semver";
import { decodeSemver } from "./util";
import { useRootStore } from "./root";

export function mergeDeep(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      if (target[key] === undefined) {
        target[key] = new (val as any).__proto__.constructor();
      }
      mergeDeep(target[key], val);
    } else {
      target[key] = val;
    }
  }
  // we're replacing in-situ, so this is more for chaining than anything else
  return target;
}

function makeSemver(major, minor, patch) {
  return (major << 16) | (minor << 8) | patch;
}

function ensureMinVersion(version) {
  version = version || makeSemver(0, 1, 0);
  if (version < makeSemver(0, 1, 0)) {
    version = makeSemver(0, 1, 0);
  }
  return version;
}

function migrateProfileVersion(profile, version) {
  switch (version) {
    case makeSemver(0, 1, 0): {
      const silverware = {
        mode: 0,
        rate: [
          profile.rate.silverware?.max_rate || [860, 860, 500],
          profile.rate.silverware?.acro_expo || [0.8, 0.8, 0.6],
          profile.rate.silverware?.angle_expo || [0.55, 0, 0.55],
        ],
      };
      const betaflight = {
        mode: 1,
        rate: [
          profile.rate.betaflight?.rc_rate || [1.3, 1.3, 1.3],
          profile.rate.betaflight?.super_rate || [0.7, 0.7, 0.7],
          profile.rate.betaflight?.expo || [0.4, 0.4, 0.4],
        ],
      };

      profile.rate.profile = 0;

      if (profile.rate.mode == 0) {
        profile.rate.rates = [silverware, betaflight];
      } else {
        profile.rate.rates = [betaflight, silverware];
      }

      break;
    }
  }

  if (profile.meta.name) {
    profile.meta.name = profile.meta.name.replace(/\0/g, "");
  }
  if (profile.osd?.callsign) {
    profile.osd.callsign = profile.osd.callsign.replace(/\0/g, "");
  }

  return profile;
}

function migrateProfile(profile) {
  const default_profile = useDefaultProfileStore();

  const firmwareVersion = ensureMinVersion(default_profile?.meta?.version);
  const profileVersion = ensureMinVersion(profile?.meta?.version);

  let p = JSON.parse(JSON.stringify(profile));
  if (!p.meta) {
    p.meta = {};
  }
  if (firmwareVersion != profileVersion) {
    p = migrateProfileVersion(p, profileVersion);
  }

  p.meta.datetime = Math.floor(Date.now() / 1000);

  return p;
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    semver: "v0.0.0",
    serial: {
      rx: 0,
      smart_audio: 0,
      hdzero: 0,
      blackbox: 0,
    },
    filter: {
      gyro: [{}, {}],
      dterm: [{}, {}],
    },
    osd: {
      callsign: "",
      elements: [],
      elements_hd: [],
    },
    meta: {
      name: "",
      datetime: 0,
    },
    motor: {
      gyro_orientation: 0,
      invert_yaw: 1,
      motor_pins: [] as number[],
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
    voltage: {},
    receiver: {
      lqi_source: -1,
      channel_mapping: 0,
      aux: [],
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
      sample_rate_hz: 0,
    },
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
  },
  actions: {
    set_profile(profile) {
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
      return this.apply_profile(default_profile.$state);
    },

    fetch_profile() {
      return serial.get(QuicVal.Profile).then((p) => this.set_profile(p));
    },
    async merge_profile(profile) {
      const lhs = migrateProfile(await serial.get(QuicVal.Profile));
      const rhs = migrateProfile(profile);

      const p = mergeDeep(lhs, rhs);

      return this.apply_profile(p);
    },
    apply_profile(profile) {
      const root = useRootStore();

      const p = migrateProfile(profile);

      return serial
        .set(QuicVal.Profile, p)
        .then((p) => this.set_profile(p))
        .then(() =>
          root.append_alert({ type: "success", msg: "Profile applied!" })
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
