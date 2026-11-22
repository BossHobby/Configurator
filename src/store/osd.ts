import { serial } from "./serial/serial";
import { QuicCmd, QuicOSD, QuicVal } from "./serial/quic";
import { defineStore } from "pinia";
import { OSD } from "./util/osd";
import { useInfoStore } from "./info";

const OSD_SCREEN_VERSION = "0.2.10";

const NO_SCREEN = { connected: 0, cols: 0, rows: 0 };

export const useOSDStore = defineStore("osd", {
  state: () => ({
    font_raw: undefined as number[][] | undefined,
    font_bitmap: undefined as ImageBitmap | undefined,
    font_bitmap_inverted: undefined as ImageBitmap | undefined,
    // The board's screen; zero cols when not reported. An analog screen is 30
    // wide with 16 rows on PAL and 13 on NTSC.
    screen: { ...NO_SCREEN },
  }),
  actions: {
    update_screen() {
      if (!useInfoStore().quic_semver_gte(OSD_SCREEN_VERSION)) {
        this.screen = { ...NO_SCREEN };
        return;
      }
      return serial
        .get(QuicVal.OsdScreen)
        .then((screen) => {
          this.screen = screen;
        })
        .catch(() => {
          // development builds of 0.2.10 lack the value
          this.screen = { ...NO_SCREEN };
        });
    },
    async fetch_sd_osd_font() {
      const info = useInfoStore();
      if (!info.quic_semver_gte("0.2.0")) {
        return serial.get(QuicVal.OSDFont).then((font) => {
          this.font_raw = font;
          this.font_bitmap = OSD.unpackFontBitmap(font);
          this.font_bitmap_inverted = OSD.unpackFontBitmap(font, true);
        });
      }

      const font: number[][] = [];
      for (let i = 0; i < 256; i++) {
        const res = await serial.command(QuicCmd.OSD, QuicOSD.ReadChar, i);
        font[i] = res.payload[0];
      }
      this.font_raw = font;
      this.font_bitmap = OSD.unpackFontBitmap(font);
      this.font_bitmap_inverted = OSD.unpackFontBitmap(font, true);
    },
    async apply_font(font: Uint8Array[]) {
      const info = useInfoStore();
      if (!info.quic_semver_gte("0.2.0")) {
        return serial.set(QuicVal.OSDFont, ...font);
      }

      for (let i = 0; i < 256; i++) {
        await serial.command(QuicCmd.OSD, QuicOSD.WriteChar, i, font[i]);
      }
    },
    // Stands in for the board's font where it cannot be read, e.g. over the
    // radio link.
    async load_sd_osd_font(name: string) {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = "osd/" + name;
      });
      const canvas = new OffscreenCanvas(OSD.FULL_WIDTH, OSD.FULL_HEIGHT);
      const font = OSD.packFont(
        canvas as unknown as HTMLCanvasElement,
        image,
      ).map((char) => Array.from(char));
      this.font_raw = font;
      this.font_bitmap = OSD.unpackFontBitmap(font);
      this.font_bitmap_inverted = OSD.unpackFontBitmap(font, true);
    },
    fetch_hd_osd_font() {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve(image);
        };
        image.src = "osd/clarity.png";
      })
        .then((img: any) => createImageBitmap(img))
        .then((img) => {
          this.font_raw = undefined;
          this.font_bitmap = img;
          this.font_bitmap_inverted = undefined;
        });
    },
  },
});
