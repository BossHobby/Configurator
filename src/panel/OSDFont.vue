<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Font</p>
      <tooltip class="card-header-icon" entry="osd.font" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <div class="field field-is-4 is-horizontal">
          <div class="field-label">
            <label class="label"> Full OSD font to upload </label>
          </div>
          <div class="field-body">
            <div class="field has-addons">
              <p class="control is-expanded">
                <input-select
                  id="font-file"
                  class="is-fullwidth"
                  v-model="current_font_file"
                  :options="fontFiles"
                ></input-select>
              </p>
              <p class="control">
                <spinner-btn
                  class="float-right"
                  @click="apply_osd_font(current_font_file)"
                >
                  Upload Font
                </spinner-btn>
              </p>
            </div>
          </div>
        </div>

        <form ref="form">
          <div class="field field-is-4 is-horizontal">
            <div class="field-label">
              <label class="label">
                Custom Logo <br />
                288x72 Black/White/Transparent PNG
              </label>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <p class="control is-expanded"></p>
                <p class="control">
                  <spinner-btn @click="uploadLogo()"> Upload Logo </spinner-btn>
                </p>
              </div>
            </div>
          </div>
        </form>

        <div class="columns mt-5">
          <div class="column is-6">
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">Preview</p>
              </header>

              <div class="card-content">
                <div class="content">
                  <figure class="image m-0">
                    <img :src="'osd/' + current_font_file" />
                  </figure>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-6">
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">Current</p>
              </header>
              <div class="card-content">
                <div class="content">
                  <figure class="image m-0">
                    <img :src="imageSource" />
                  </figure>
                  <canvas
                    ref="canvas"
                    class="mx-5 mt-3 is-hidden"
                    width="209"
                    height="305"
                  ></canvas>
                  <canvas
                    ref="logoCanvas"
                    class="mx-5 mt-3 is-hidden"
                    width="288"
                    height="72"
                  ></canvas>
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
import { serial } from "@/store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import { OSD } from "@/store/util/osd";
import { useRootStore } from "@/store/root";
import { useProfileStore } from "@/store/profile";
import { useOSDStore } from "@/store/osd";

const loadImage = (url) => {
  return new Promise((r, e) => {
    const i = new Image();
    i.onload = () => r(i);
    i.onerror = (err) => e(err);
    i.src = url;
  });
};

export default defineComponent({
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
      imageSource: undefined as string | undefined,
    };
  },
  setup() {
    return {
      root: useRootStore(),
      profile: useProfileStore(),
      osd: useOSDStore(),
    };
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
          this.root.append_alert({
            type: "success",
            msg: "Font updated!",
          })
        )
        .catch(() => {
          this.root.append_alert({
            type: "danger",
            msg: "Font update failed!",
          });
        });
    },
    async get_osd_font() {
      await this.osd.fetch_sd_osd_font();
      this.imageSource = OSD.unpackFont(this.$refs.canvas, this.osd.font_raw);
    },
    uploadLogo() {
      const readImage = (file) => {
        return new Promise((resovle, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onabort = reject;
          reader.onload = (event) => {
            const img = new Image();
            img.onerror = reject;
            img.onabort = reject;
            img.onload = function () {
              resovle(img);
            };
            img.src = event?.target?.result || "";
          };
          reader.readAsDataURL(file);
        });
      };

      const selectFile = async () => {
        const pickerOpts = {
          types: [
            {
              description: "Images",
              accept: {
                "image/*": [".png"],
              },
            },
          ],
          excludeAcceptAllOption: true,
          multiple: false,
        };

        const [fileHandle] = await (window as any).showOpenFilePicker(
          pickerOpts
        );
        return await fileHandle.getFile();
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
          this.root.append_alert({
            type: "success",
            msg: "Logo updated!",
          })
        )
        .catch((err) => {
          this.root.append_alert({
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
});
</script>
