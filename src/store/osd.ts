import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { defineStore } from "pinia";
import { OSD } from "./util/osd";

export const useOSDStore = defineStore("osd", {
  state: () => ({
    font_raw: undefined as Uint8Array | undefined,
    font_bitmap: undefined as ImageBitmap | undefined,
    font_bitmap_inverted: undefined as ImageBitmap | undefined,
  }),
  actions: {
    fetch_sd_osd_font() {
      return serial.get(QuicVal.OSDFont).then((font) => {
        this.font_raw = font;
        this.font_bitmap = OSD.unpackFontBitmap(font);
        this.font_bitmap_inverted = OSD.unpackFontBitmap(font, true);
      });
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
