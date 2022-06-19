import { DFU } from "./dfu";
import { IntelHEX } from "./ihex";

const USB_DEVICE_FILTER: USBDeviceFilter[] = [
  { vendorId: 0x0483, productId: 0xdf11 },
];

export interface FlashProgress {
  task: string;
  current: number;
  total: number;
}

export type FlashProgressCallback = (p: FlashProgress) => void;

export class Flasher {
  private progressCallback?: FlashProgressCallback;

  public onProgress(cb: FlashProgressCallback) {
    this.progressCallback = cb;
  }

  public async flash(hexStr: string) {
    const device = await navigator.usb.requestDevice({
      filters: USB_DEVICE_FILTER,
    });

    const hex = IntelHEX.parse(hexStr);

    const dfu = new DFU(device);
    dfu.onProgress((p) => {
      if (this.progressCallback) {
        this.progressCallback(p);
      }
    });

    await dfu.open();
    await dfu.flash(hex);
    await dfu.close();
  }
}
