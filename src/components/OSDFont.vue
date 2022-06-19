<template>
  <b-row>
    <b-col class="my-4" sm="12">
      <b-card>
        <h5 slot="header" class="mb-0">
          Font
          <tooltip entry="osd.font" />
        </h5>
        <b-row class="my-4">
          <b-col sm="2">
            <label for="font-file">File</label>
          </b-col>
          <b-col sm="6">
            <b-form-select
              id="font-file"
              v-model="current_font_file"
              :options="fontFiles"
            ></b-form-select>
          </b-col>
          <b-col sm="4">
            <spinner-btn
              class="float-right"
              v-on:click="apply_osd_font(current_font_file)"
            >
              Upload Font
            </spinner-btn>
          </b-col>
        </b-row>
        <b-row class="my-4">
          <b-col sm="8"> Custom Logo 288x72 Black/White/Transparent PNG </b-col>
          <b-col sm="4">
            <form ref="form">
              <input
                accept=".png"
                type="file"
                ref="file"
                style="display: none"
              />
              <spinner-btn class="float-right" @click="uploadLogo()">
                Upload Logo
              </spinner-btn>
            </form>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="6">
            <b-card>
              <h5 slot="header" class="mb-0">Preview</h5>
              <b-row>
                <b-img
                  :src="'osd/' + current_font_file"
                  fluid-grow
                  class="mx-5 mt-3"
                ></b-img>
              </b-row>
            </b-card>
          </b-col>
          <b-col sm="6">
            <b-card>
              <h5 slot="header" class="mb-0">Current</h5>
              <b-row>
                <b-img :src="imageSource" fluid-grow class="mx-5 mt-3"></b-img>
                <canvas
                  ref="canvas"
                  class="mx-5 mt-3 d-none"
                  width="209"
                  height="305"
                ></canvas>
                <canvas
                  ref="logoCanvas"
                  class="mx-5 mt-3 d-none"
                  width="288"
                  height="72"
                ></canvas>
              </b-row>
            </b-card>
          </b-col>
        </b-row>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
import { mapFields } from "@/store/helper.js";
import { serial } from "@/store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import { OSD } from "@/store/util/osd";

const loadImage = (url) => {
  return new Promise((r, e) => {
    let i = new Image();
    i.onload = () => r(i);
    i.onerror = (err) => e(err);
    i.src = url;
  });
};

export default {
  name: "OSDFont",
  data() {
    return {
      fontFiles: [
        { text: "betaflight", value: "betaflight.png" },
        { text: "bold", value: "bold.png" },
        { text: "clarity", value: "clarity.png" },
        { text: "default", value: "default.png" },
        { text: "digital", value: "digital.png" },
        { text: "extra_large", value: "extra_large.png" },
        { text: "impact_mini", value: "impact_mini.png" },
        { text: "impact", value: "impact.png" },
        { text: "large", value: "large.png" },
        { text: "vision", value: "vision.png" },
      ],
      current_font_file: "clarity.png",
      imageSource: null,
    };
  },
  computed: {
    ...mapFields("profile", ["osd"]),
  },
  methods: {
    apply_osd_font(name) {
      return loadImage("osd/" + name)
        .then((src) => {
          const font = OSD.packFont(this.$refs.canvas, src);
          return serial.set(QuicVal.OSDFont, ...font);
        })
        .then(() => this.get_osd_font())
        .then(() =>
          this.$store.commit("append_alert", {
            type: "success",
            msg: "Font updated!",
          })
        )
        .catch(() => {
          this.$store.commit("append_alert", {
            type: "danger",
            msg: "Font update failed!",
          });
        });
    },
    get_osd_font() {
      return serial.get(QuicVal.OSDFont).then((font) => {
        this.imageSource = OSD.unpackFont(this.$refs.canvas, font);
      });
    },
    uploadLogo() {
      const readImage = (file) => {
        return new Promise((resovle, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onabort = reject;
          reader.onload = (event) => {
            var img = new Image();
            img.onerror = reject;
            img.onabort = reject;
            img.onload = function () {
              resovle(img);
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        });
      };

      const selectFile = () => {
        return new Promise((resovle, reject) => {
          const checkForFile = () => {
            document.body.onfocus = null;

            if (!this.$refs.file.files.length) {
              reject(new Error("no file selected"));
              return;
            }
            resovle(this.$refs.file.files[0]);
          };

          this.$refs.file.oninvalid = reject;
          this.$refs.file.onchange = checkForFile;
          setTimeout(
            () => (document.body.onfocus = () => checkForFile()),
            1000
          );

          this.$refs.file.click();
        });
      };

      return selectFile()
        .then((file) => readImage(file))
        .then((img) => {
          if (img.width != 288 && img.height != 72) {
            throw new Error("Invalid logo dimensions");
          }

          const font = OSD.packLogo(
            this.$refs.canvas,
            this.$refs.logoCanvas,
            img
          );
          return serial.set(QuicVal.OSDFont, ...font);
        })
        .then(() => this.get_osd_font())
        .then(() =>
          this.$store.commit("append_alert", {
            type: "success",
            msg: "Logo updated!",
          })
        )
        .catch((err) => {
          this.$store.commit("append_alert", {
            type: "danger",
            msg: "Logo update failed! " + err.message,
          });
        })
        .finally(() => this.$refs.form.reset());
    },
  },
  created() {
    this.get_osd_font();
  },
};
</script>
