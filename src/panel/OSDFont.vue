<template>
  <Panel title="OSD Font" help="osd.font"
    ><div class="space-y-4">
      <div class="form-row">
        <label for="font-file" class="form-label">
          Full OSD font to upload
        </label>
        <div class="flex min-w-0 items-center gap-2">
          <UiSelect
            id="font-file"
            v-model="current_font_file"
            class="w-full"
            :options="fontFiles"
          ></UiSelect>
          <p class="min-w-0">
            <spinner-btn
              class="float-right"
              @click="apply_osd_font(current_font_file)"
            >
              Upload Font
            </spinner-btn>
          </p>
        </div>
      </div>

      <form ref="form">
        <div class="form-row">
          <span class="form-label">
            Custom Logo <br />
            288x72 Black/White/Transparent PNG
          </span>
          <div class="flex min-w-0 items-center gap-2">
            <p class="min-w-0 flex-1"></p>
            <p class="min-w-0">
              <spinner-btn @click="uploadLogo()"> Upload Logo </spinner-btn>
            </p>
          </div>
        </div>
      </form>

      <div class="grid grid-cols-12 gap-4 mt-5">
        <div class="min-w-0 col-span-12 md:col-span-6">
          <Panel title="Preview"
            ><div class="space-y-4">
              <figure class="block m-0">
                <img
                  class="mx-auto block h-auto max-h-[305px] max-w-full object-contain"
                  :src="'osd/' + current_font_file"
                />
              </figure></div
          ></Panel>
        </div>
        <div class="min-w-0 col-span-12 md:col-span-6">
          <Panel title="Current"
            ><div class="space-y-4">
              <figure class="block m-0">
                <img
                  class="mx-auto block h-auto max-h-[305px] max-w-full object-contain"
                  :src="imageSource"
                />
              </figure>
              <canvas
                ref="canvas"
                class="mx-5 mt-3 hidden"
                width="209"
                height="305"
              ></canvas>
              <canvas
                ref="logoCanvas"
                class="mx-5 mt-3 hidden"
                width="288"
                height="72"
              ></canvas></div
          ></Panel>
        </div>
      </div></div
  ></Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
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
  components: { Panel },
  setup() {
    return {
      root: useRootStore(),
      profile: useProfileStore(),
      osd: useOSDStore(),
    };
  },
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
  created() {
    this.get_osd_font();
  },
  methods: {
    apply_osd_font(name) {
      return loadImage("osd/" + name)
        .then((src) => {
          const font = OSD.packFont(this.$refs.canvas, src);
          return this.osd.apply_font(font);
        })
        .then(() => this.get_osd_font())
        .then(() =>
          this.root.append_alert({
            type: "success",
            msg: "Font updated!",
          }),
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
          pickerOpts,
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
            img,
          );
          return this.osd.apply_font(font);
        })
        .then(() => this.get_osd_font())
        .then(() =>
          this.root.append_alert({
            type: "success",
            msg: "Logo updated!",
          }),
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
});
</script>
