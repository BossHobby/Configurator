import { serial } from "./serial/serial";
import { QuicCmd, QuicOSD, QuicVal } from "./serial/quic";
import { defineStore } from "pinia";
import { OSD } from "./util/osd";
import { useInfoStore } from "./info";

export const useOSDStore = defineStore("osd", {
  state: () => ({
    font_raw: undefined as number[][] | undefined,
    font_bitmap: undefined as ImageBitmap | undefined,
    font_bitmap_inverted: undefined as ImageBitmap | undefined,
  }),
  actions: {
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
    fetch_hd_osd_font() {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve(image);
        };
        image.src = "osd/hdzero_quic.png";
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
