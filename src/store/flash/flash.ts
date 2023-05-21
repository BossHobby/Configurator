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
  private device?: USBDevice;
  private progressCallback?: FlashProgressCallback;

  public onProgress(cb: FlashProgressCallback) {
    this.progressCallback = cb;
  }

  public async connect() {
    this.device = await navigator.usb.requestDevice({
      filters: USB_DEVICE_FILTER,
    });
  }

  public async flash(hex: IntelHEX) {
    if (!this.device) {
      return;
    }

    const dfu = new DFU(this.device);
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
