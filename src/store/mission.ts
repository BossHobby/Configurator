import { QuicCmd, QuicMission } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";
import { useInfoStore } from "./info";
import { useRootStore } from "./root";
import {
  MISSION_DEFAULT_LIMITS,
  MissionEndAction,
  type Mission,
  type MissionLimits,
  type Waypoint,
} from "./util/mission";

// First QUIC protocol version that ships QuicCmd.Mission.
const MISSION_VERSION = "0.2.11";

interface MissionResponse extends Mission, Partial<MissionLimits> {
  max_waypoints: number;
}

function snapshot(mission: Mission) {
  return JSON.stringify({
    end_action: mission.end_action,
    waypoints: mission.waypoints,
  });
}

function missionError(err: unknown) {
  if (String(err).includes("ARMED")) {
    return new Error("Disarm the craft before changing the mission.");
  }
  return err;
}

export const useMissionStore = defineStore("mission", {
  state: () => ({
    end_action: MissionEndAction.Hold as MissionEndAction,
    waypoints: [] as Waypoint[],
    // Reported by the firmware with every Get, 0 until the first fetch.
    max_waypoints: 0,
    // Vehicle-specific limits, also reported with every reply.
    limits: { ...MISSION_DEFAULT_LIMITS } as MissionLimits,
    // Mission as last read from or written to the flight controller.
    stored: snapshot({ end_action: MissionEndAction.Hold, waypoints: [] }),
  }),
  getters: {
    supported() {
      return useInfoStore().quic_semver_gte(MISSION_VERSION);
    },
    mission(state): Mission {
      return { end_action: state.end_action, waypoints: state.waypoints };
    },
    dirty(state): boolean {
      return snapshot(this.mission) != state.stored;
    },
  },
  actions: {
    apply_response(res: MissionResponse) {
      this.max_waypoints = res.max_waypoints;
      this.limits = {
        min_alt: res.min_alt ?? MISSION_DEFAULT_LIMITS.min_alt,
        max_alt: res.max_alt ?? MISSION_DEFAULT_LIMITS.max_alt,
        max_speed: res.max_speed ?? MISSION_DEFAULT_LIMITS.max_speed,
      };
      this.end_action = res.end_action;
      this.waypoints = res.waypoints ?? [];
      this.stored = snapshot(this.mission);
    },
    load(mission: Mission) {
      this.end_action = mission.end_action;
      this.waypoints = mission.waypoints;
    },
    async fetch() {
      const res = await serial.command(QuicCmd.Mission, QuicMission.Get);
      this.apply_response(res.payload[0]);
    },
    async upload() {
      try {
        const res = await useRootStore().track("Uploading mission", 1, () =>
          serial.command(QuicCmd.Mission, QuicMission.Set, this.mission),
        );
        this.apply_response(res.payload[0]);
      } catch (err) {
        throw missionError(err);
      }
    },
    async clear() {
      try {
        await serial.command(QuicCmd.Mission, QuicMission.Clear);
      } catch (err) {
        throw missionError(err);
      }
      this.end_action = MissionEndAction.Hold;
      this.waypoints = [];
      this.stored = snapshot(this.mission);
    },
  },
});
