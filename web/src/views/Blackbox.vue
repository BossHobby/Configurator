<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">Blackbox</h5>
          <div>
            <div
              v-for="(size, index) in blackbox_list.files"
              :key="index"
            >File {{index + 1}}: {{ humanFileSize(size * 128) }}</div>
            <b-button size="sm" class="my-2 mx-2" @click="list_blackbox()">list</b-button>
            <b-button size="sm" class="my-2 mx-2" @click="fetch()">fetch</b-button>
            <b-button
              size="sm"
              class="my-2 mx-2"
              href="http://localhost:8000/api/blackbox/download"
            >download</b-button>
            <b-button size="sm" class="my-2 mx-2" @click="reset_blackbox()">reset</b-button>
          </div>
        </b-card>
      </b-col>

      <b-col sm="12">
        <GyroModel class="my-3"></GyroModel>
      </b-col>

      <b-col v-for="plot in plots" :key="plot.name" :sm="plot.size">
        <RealtimePlot :title="plot.title" ref="plot" :axis="plot.axis" :input="blackbox[plot.name]"></RealtimePlot>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import RealtimePlot from "@/components/RealtimePlot";
import GyroModel from "@/components/GyroModel";

export default {
  name: "blackbox",
  components: {
    RealtimePlot,
    GyroModel
  },
  data() {
    return {
      plots: [
        {
          name: "rx_filtered",
          size: 12,
          title: "Rx Channels",
          axis: ["Roll", "Pitch", "Yaw", "Throttle"]
        },
        {
          name: "gyro_raw",
          size: 6,
          title: "Gyro Raw",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "gyro",
          size: 6,
          title: "Gyro Filter",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "GEstG",
          size: 12,
          title: "Gyro Vector",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "accel_raw",
          size: 6,
          title: "AccelRaw",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "accel",
          size: 6,
          title: "AccelFilter",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "pidoutput",
          size: 12,
          title: "Pid Output",
          axis: ["Roll", "Pitch", "Yaw"]
        }
      ]
    };
  },
  computed: {
    ...mapState(["blackbox", "blackbox_list"])
  },
  methods: {
    ...mapActions(["fetch_blackbox", "reset_blackbox", "list_blackbox"]),
    humanFileSize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }

      const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
      );

      return bytes.toFixed(dp) + " " + units[u];
    },
    fetch() {
      for (const p of this.$refs.plot) {
        p.reset();
      }
      this.fetch_blackbox();
    }
  }
};
</script>
