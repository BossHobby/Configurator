import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { defineStore } from "pinia";
import { OSD } from "./util/osd";

export const useOSDStore = defineStore("osd", {
  state: () => ({
    font_raw: null as unknown as Uint8Array,
    font_bitmap: null as unknown as ImageBitmap,
    font_bitmap_inverted: null as unknown as ImageBitmap,
  }),
  actions: {
    fetch_osd_font() {
      return serial.get(QuicVal.OSDFont).then((font) => {
        this.font_raw = font;
        this.font_bitmap = OSD.unpackFontBitmap(font);
        this.font_bitmap_inverted = OSD.unpackFontBitmap(font, true);
      });
    },
  },
});
