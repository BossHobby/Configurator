import { FlashProgressCallback } from './flash';
import { IntelHEX } from './ihex';

enum DFURequest {
  DETACH = 0x00, // OUT, Requests the device to leave DFU mode and enter the application.
  DNLOAD = 0x01, // OUT, Requests data transfer from Host to the device in order to load them into device internal Flash. Includes also erase commands
  UPLOAD = 0x02, // IN,  Requests data transfer from device to Host in order to load content of device internal Flash into a Host file.
  GETSTATUS = 0x03, // IN,  Requests device to send status report to the Host (including status resulting from the last request execution and the state the device will enter immediately after this request).
  CLRSTATUS = 0x04, // OUT, Requests device to clear error status and move to next step
  GETSTATE = 0x05, // IN,  Requests the device to send only the state it will enter immediately after this request.
  ABORT = 0x06  // OUT, Requests device to exit the current state/operation and enter idle state immediately.
}

enum DFUStatus {
  OK = 0x00, // No error condition is present.
  errTARGET = 0x01, // File is not targeted for use by this device.
  errFILE = 0x02, // File is for this device but fails some vendor-specific verification test
  errWRITE = 0x03, // Device is unable to write memory.
  errERASE = 0x04, // Memory erase function failed.
  errCHECK_ERASED = 0x05, // Memory erase check failed.
  errPROG = 0x06, // Program memory function failed.
  errVERIFY = 0x07, // Programmed memory failed verification.
  errADDRESS = 0x08, // Cannot program memory due to received address that is out of range.
  errNOTDONE = 0x09, // Received DFU_DNLOAD with wLength = 0, but device does not think it has all of the data yet.
  errFIRMWARE = 0x0A, // Device's firmware is corrupt. It cannot return to run-time (non-DFU) operations.
  errVENDOR = 0x0B, // iString indicates a vendor-specific error.
  errUSBR = 0x0C, // Device detected unexpected USB reset signaling.
  errPOR = 0x0D, // Device detected unexpected power on reset.
  errUNKNOWN = 0x0E, // Something went wrong, but the device does not know what it was.
  errSTALLEDPKT = 0x0F  // Device stalled an unexpected request.
}

enum DFUState {
  appIDLE = 0, // Device is running its normal application.
  appDETACH = 1, // Device is running its normal application, has received the DFU_DETACH request, and is waiting for a USB reset.
  dfuIDLE = 2, // Device is operating in the DFU mode and is waiting for requests.
  dfuDNLOAD_SYNC = 3, // Device has received a block and is waiting for the host to solicit the status via DFU_GETSTATUS.
  dfuDNBUSY = 4, // Device is programming a control-write block into its nonvolatile memories.
  dfuDNLOAD_IDLE = 5, // Device is processing a download operation. Expecting DFU_DNLOAD requests.
  dfuMANIFEST_SYNC = 6, // Device has received the final block of firmware from the host and is waiting for receipt of DFU_GETSTATUS to begin the Manifestation phase; or device has completed the Manifestation phase and is waiting for receipt of DFU_GETSTATUS.
  dfuMANIFEST = 7, // Device is in the Manifestation phase. (Not all devices will be able to respond to DFU_GETSTATUS when in this state.)
  dfuMANIFEST_WAIT_RESET = 8, // Device has programmed its memories and is waiting for a USB reset or a power on reset. (Devices that must enter this state clear bitManifestationTolerant to 0.)
  dfuUPLOAD_IDLE = 9, // The device is processing an upload operation. Expecting DFU_UPLOAD requests.
  dfuERROR = 10 // An error has occurred. Awaiting the DFU_CLRSTATUS request.
}

function asyncDelay(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  })
}

export class DFU {

  private progressCallback?: FlashProgressCallback;

  public onProgress(cb: FlashProgressCallback) {
    this.progressCallback = cb;
  }

  constructor(private device: USBDevice) { }

  async open() {
    await this.device.open();
    await this.device.claimInterface(0);
  }

  async close() {
    await this.device.close();
  }

  private progress(task: string, current: number, total: number) {
    if (this.progressCallback)
      this.progressCallback({ task, current, total });
  }

  private async getString(index: number) {
    const result = await this.device.controlTransferIn({
      'recipient': 'device',
      'requestType': 'standard',
      'request': 6,
      'value': 0x300 | index,
      'index': 0,  // specifies language
    }, 255);

    if (result?.status != "ok") {
      throw new Error(result.status)
    }

    const view = result.data!;
    const length = view.getUint8(0);

    let descriptor = "";
    for (let i = 2; i < length; i += 2) {
      const charCode = view.getUint16(i, true);
      descriptor += String.fromCharCode(charCode);
    }

    return descriptor;
  }

  private async getInterfaceDescriptor(iface: number) {
    const result = await this.device.controlTransferIn({
      'recipient': 'device',
      'requestType': 'standard',
      'request': 6,
      'value': 0x200,
      'index': 0,
    }, 18 + iface * 9);

    if (result?.status != "ok") {
      throw new Error(result.status)
    }

    const buf = new Uint8Array(result.data!.buffer, 9 + iface * 9);
    return {
      'bLength': buf[0],
      'bDescriptorType': buf[1],
      'bInterfaceNumber': buf[2],
      'bAlternateSetting': buf[3],
      'bNumEndpoints': buf[4],
      'bInterfaceClass': buf[5],
      'bInterfaceSubclass': buf[6],
      'bInterfaceProtocol': buf[7],
      'iInterface': buf[8]
    };
  }

  private async getFunctionalDescriptor() {
    const result = await this.device.controlTransferIn({
      'recipient': 'interface',
      'requestType': 'standard',
      'request': 6,
      'value': 0x2100,
      'index': 0,
    }, 255);

    if (result?.status != "ok") {
      throw new Error(result.status)
    }

    const buf = new Uint8Array(result.data!.buffer);
    return {
      'bLength': buf[0],
      'bDescriptorType': buf[1],
      'bmAttributes': buf[2],
      'wDetachTimeOut': (buf[4] << 8) | buf[3],
      'wTransferSize': (buf[6] << 8) | buf[5],
      'bcdDFUVersion': buf[7]
    };
  }

  private async getInterfaceDescriptors(interfaceNum: number) {
    const descStrings = [];
    const config = this.device.configuration!;

    for (const iface of config.interfaces) {
      for (let i = 0; i < iface.alternates.length; i++) {
        const desc = await this.getInterfaceDescriptor(iface.interfaceNumber + i)
        if (desc.bInterfaceNumber != interfaceNum) {
          continue;
        }

        const str = await this.getString(desc.iInterface);
        descStrings.push(str);
      }
    }
    return descStrings;
  }

  private async controlTransferIn(request: number, value: number, iface: number, length: number) {
    // data is ignored
    const result = await this.device.controlTransferIn({
      'recipient': 'interface',
      'requestType': 'class',
      'request': request,
      'value': value,
      'index': iface,
    }, length);

    if (result?.status != "ok") {
      throw new Error(result.status)
    }

    return new Uint8Array(result.data!.buffer);
  }

  private async controlTransferOut(request: number, value: number, iface: number, data?: number[]) {
    // length is ignored
    let arrayBuf = new ArrayBuffer(0);
    if (data) {
      arrayBuf = new ArrayBuffer(data.length);
      const arrayBufView = new Uint8Array(arrayBuf);
      arrayBufView.set(data);
    }

    const result = await this.device.controlTransferOut({
      'recipient': 'interface',
      'requestType': 'class',
      'request': request,
      'value': value,
      'index': iface,
    }, arrayBuf);

    if (result?.status != "ok") {
      throw new Error(result.status)
    }

    return result;
  }

  private clearStatus() {
    const check_status = async (): Promise<Uint8Array> => {
      const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
      if (data[4] == DFUState.dfuIDLE) {
        return data;
      }

      const delay = data[1] | (data[2] << 8) | (data[3] << 16);
      await asyncDelay(delay)

      return clear_status();
    }

    const clear_status = async () => {
      await this.controlTransferOut(DFURequest.CLRSTATUS, 0, 0);
      return check_status();
    }

    return check_status();
  }

  private async getChipInfo() {
    const parseDescriptor = (str: string) => {
      // F303: "@Internal Flash  /0x08000000/128*0002Kg"
      // F40x: "@Internal Flash  /0x08000000/04*016Kg,01*064Kg,07*128Kg"
      // F72x: "@Internal Flash  /0x08000000/04*016Kg,01*64Kg,03*128Kg"
      // F74x: "@Internal Flash  /0x08000000/04*032Kg,01*128Kg,03*256Kg"

      // H750 SPRacing H7 EXST: "@External Flash /0x90000000/998*128Kg,1*128Kg,4*128Kg,21*128Ka"
      // H750 SPRacing H7 EXST: "@External Flash /0x90000000/1001*128Kg,3*128Kg,20*128Ka" - Early BL firmware with incorrect string, treat as above.

      // H750 Partitions: Flash, Config, Firmware, 1x BB Management block + x BB Replacement blocks)
      if (str == "@External Flash /0x90000000/1001*128Kg,3*128Kg,20*128Ka") {
        str = "@External Flash /0x90000000/998*128Kg,1*128Kg,4*128Kg,21*128Ka";
      }

      // split main into [location, start_addr, sectors]

      const tmp0 = str.replace(/[^\x20-\x7E]+/g, "");
      const tmp1 = tmp0.split('/');

      // G474 (and may be other G4 variants) returns
      // "@Option Bytes   /0x1FFF7800/01*048 e/0x1FFFF800/01*048 e"
      // for two banks of options bytes which may be fine in terms of descriptor syntax,
      // but as this splits into an array of size 5 instead of 3, it induces an length error.
      // Here, we blindly trim the array length to 3. While doing so may fail to
      // capture errornous patterns, but it is good to avoid this known and immediate
      // error.
      // May need to preserve the second bank if the configurator starts to really
      // support option bytes.

      if (tmp1.length > 3) {
        console.log('parseDescriptor: shrinking long descriptor "' + str + '"');
        tmp1.length = 3;
      }
      if (!tmp1[0].startsWith("@")) {
        return null;
      }
      const type = tmp1[0].trim().replace('@', '');
      const start_address = parseInt(tmp1[1]);

      // split sectors into array
      const sectors = [];
      let total_size = 0;
      const tmp2 = tmp1[2].split(',');
      if (tmp2.length < 1) {
        return null;
      }
      for (let i = 0; i < tmp2.length; i++) {
        // split into [num_pages, page_size]
        const tmp3 = tmp2[i].split('*');
        if (tmp3.length != 2) {
          return null;
        }
        const num_pages = parseInt(tmp3[0]);
        let page_size = parseInt(tmp3[1]);
        if (!page_size) {
          return null;
        }
        const unit = tmp3[1].slice(-2, -1);
        switch (unit) {
          case 'M':
            page_size *= 1024; //  fall through to K as well
          case 'K':
            page_size *= 1024;
            break;
        }

        sectors.push({
          'num_pages': num_pages,
          'start_address': start_address + total_size,
          'page_size': page_size,
          'total_size': num_pages * page_size
        });

        total_size += num_pages * page_size;
      }

      const memory = {
        'type': type,
        'start_address': start_address,
        'sectors': sectors,
        'total_size': total_size
      };
      return memory;
    };

    const descriptors = await this.getInterfaceDescriptors(0);
    return descriptors
      .map(parseDescriptor)
      .reduce(function (o: any, v, i) {
        o[v!.type.toLowerCase().replace(' ', '_')] = v;
        return o;
      }, {});
  }

  private async loadAddress(address: number, abort = true) {
    const payload = [0x21, address & 0xff, (address >> 8) & 0xff, (address >> 16) & 0xff, (address >> 24) & 0xff];
    await this.controlTransferOut(DFURequest.DNLOAD, 0, 0, payload);

    const busyCheck = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
    if (busyCheck[4] != DFUState.dfuDNBUSY) {
      throw new Error('Failed to request address load');
    }

    const delay = busyCheck[1] | (busyCheck[2] << 8) | (busyCheck[3] << 16);
    await asyncDelay(delay);

    const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
    if (data[4] != DFUState.dfuDNLOAD_IDLE && abort) {
      throw new Error('Failed to request address load');
    }

    return data;
  }

  private async unlockOptionBytes(start_address: number, total_size: number) {
    const unprotect = async () => {
      console.log('Initiate read unprotect');

      // 0x92 initiates read unprotect
      await this.controlTransferOut(DFURequest.DNLOAD, 0, 0, [0x92]);

      const status = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
      if (status[4] != DFUState.dfuDNBUSY) {
        throw new Error('Failed to initiate unprotect memory command');
      }


      const delay = status[1] | (status[2] << 8) | (status[3] << 16);
      const total_delay = delay + 20000; // wait at least 20 seconds to make sure the user does not disconnect the board while erasing the memory

      await asyncDelay(total_delay);

      try {
        const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);

        // unprotecting the flight controller did not work. It did not reboot.
        console.log('Failed to execute unprotect memory command');
        console.log(data);
        throw new Error('Failed to execute unprotect memory command');
      } catch (e) {
        // we encounter an error, but this is expected. should be a stall.
        console.log('Unprotect memory command ran successfully. Unplug flight controller. Connect again in DFU mode and try flashing again.');
      }
    };

    const tryReadOB = async () => {
      // the following should fail if read protection is active
      const ob_data = await this.controlTransferIn(DFURequest.UPLOAD, 2, 0, total_size);
      const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
      if (data[4] == DFUState.dfuUPLOAD_IDLE && ob_data.length == total_size) {
        console.log('Option bytes read successfully');
        console.log('Chip does not appear read protected');
        return this.clearStatus();
      } else {
        console.log('Option bytes could not be read. Quite possibly read protected.');
        await this.clearStatus();
        return unprotect();
      }
    };

    await this.clearStatus();
    const loadAddressResponse = await this.loadAddress(start_address, false);

    // contrary to what is in the docs. Address load should in theory work even if read protection is active
    // if address load fails with this specific error though, it is very likely bc of read protection
    if (loadAddressResponse[4] == DFUState.dfuERROR && loadAddressResponse[0] == DFUStatus.errVENDOR) {
      // read protected
      await this.clearStatus();
      return unprotect();
    } else if (loadAddressResponse[4] == DFUState.dfuDNLOAD_IDLE) {
      console.log('Address load for option bytes sector succeeded.');
      await this.clearStatus();
      return tryReadOB();
    } else {
      throw new Error('Address load failed');
    }
  }

  private async erasePages(flash_layout: any) {
    const erase_pages: any[] = [];
    for (let i = 0; i < flash_layout.sectors.length; i++) {
      for (let j = 0; j < flash_layout.sectors[i].num_pages; j++) {
        erase_pages.push({ 'sector': i, 'page': j });
      }
    }

    if (erase_pages.length === 0) {
      console.log('Aborting, No flash pages to erase');
      throw new Error('No flash pages to erase')
    }


    console.log('Executing local chip erase', erase_pages);

    let erase_progress = 0;

    for (const erase_page of erase_pages) {
      erase_progress++;
      this.progress('erase', erase_progress, erase_pages.length);

      const page_addr = erase_page.page * flash_layout.sectors[erase_page.sector].page_size + flash_layout.sectors[erase_page.sector].start_address;
      const cmd = [0x41, page_addr & 0xff, (page_addr >> 8) & 0xff, (page_addr >> 16) & 0xff, (page_addr >> 24) & 0xff];
      console.log('Erasing. sector ' + erase_page.sector + ', page ' + erase_page.page + ' @ 0x' + page_addr.toString(16));

      await this.controlTransferOut(DFURequest.DNLOAD, 0, 0, cmd);

      const status = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
      if (status[4] != DFUState.dfuDNBUSY) {
        throw new Error('Failed to initiate page erase, page 0x' + page_addr.toString(16));
      }

      const delay = status[1] | (status[2] << 8) | (status[3] << 16);
      await asyncDelay(delay);

      const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
      if (data[4] == DFUState.dfuDNLOAD_IDLE) {
        continue;
      } else if (data[4] == DFUState.dfuDNBUSY) {
        //
        // H743 Rev.V (probably other H7 Rev.Vs also) remains in dfuDNBUSY state after the specified delay time.
        // STM32CubeProgrammer deals with behavior with an undocumented procedure as follows.
        //     1. Issue DFU_CLRSTATUS, which ends up with (14,10) = (errUNKNOWN, dfuERROR)
        //     2. Issue another DFU_CLRSTATUS which delivers (0,2) = (OK, dfuIDLE)
        //     3. Treat the current erase successfully finished.
        // Here, we call clarStatus to get to the dfuIDLE state.
        //

        console.log('erase_page: dfuDNBUSY after timeout, clearing');
        await this.clearStatus();

        const clearStatus = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
        if (clearStatus[4] != DFUState.dfuIDLE) {
          throw new Error('Failed to erase page 0x' + page_addr.toString(16) + ' (did not reach dfuIDLE after clearing');
        }
      } else {
        throw new Error('Failed to erase page 0x' + page_addr.toString(16));
      }
    }
  }

  private async upload(hex: IntelHEX, transferSize: number) {
    console.log('Writing data ...');

    const bytes_total = hex.segment_bytes_total;
    let bytes_flashed_total = 0;

    for (const segment of hex.segments) {
      let address = segment.address;
      let wBlockNum = 2;

      let bytes_flashed = 0;

      await this.loadAddress(address);

      while (bytes_flashed < segment.data.length) {
        let bytes_to_write = transferSize;
        if ((bytes_flashed + bytes_to_write) > segment.data.length) {
          bytes_to_write = segment.data.length - bytes_flashed;
        }
        const data_to_flash = segment.data.slice(bytes_flashed, bytes_flashed + bytes_to_write);

        address += bytes_to_write;
        bytes_flashed += bytes_to_write;
        bytes_flashed_total += bytes_to_write;

        this.progress('write', bytes_flashed_total, bytes_total);

        this.controlTransferOut(DFURequest.DNLOAD, wBlockNum++, 0, [...data_to_flash]);

        const status = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
        if (status[4] != DFUState.dfuDNBUSY) {
          throw new Error('Failed to initiate write ' + bytes_to_write + 'bytes to 0x' + address.toString(16));
        }

        const delay = status[1] | (status[2] << 8) | (status[3] << 16);
        await asyncDelay(delay);

        const data = await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
        if (data[4] != DFUState.dfuDNLOAD_IDLE) {
          throw new Error('Failed to write ' + bytes_to_write + 'bytes to 0x' + address.toString(16));
        }
      }
    }
  }

  private async verify(hex: IntelHEX, transferSize: number) {
    console.log('Verifying data ...');

    const bytes_total = hex.segment_bytes_total;
    let bytes_verified_total = 0;


    for (const segment of hex.segments) {
      let address = segment.address;
      let wBlockNum = 2;

      let bytes_verified = 0;

      await this.clearStatus();
      await this.loadAddress(address);
      await this.clearStatus();

      while (bytes_verified < segment.data.length) {
        let bytes_to_read = transferSize;
        if ((bytes_verified + bytes_to_read) > segment.data.length) {
          bytes_to_read = segment.data.length - bytes_verified;
        }

        const data = await this.controlTransferIn(DFURequest.UPLOAD, wBlockNum++, 0, bytes_to_read);
        for (let i = 0; i < bytes_to_read; i++) {
          if (data[i] != segment.data[bytes_verified + i]) {
            throw new Error("verify failed");
          }
        }

        address += bytes_to_read;
        bytes_verified += bytes_to_read;
        bytes_verified_total += bytes_to_read;

        this.progress('verify', bytes_verified_total, bytes_total);
      }
    }
  }

  private async leave(hex?: IntelHEX) {
    const address = hex?.segments[0]?.address || 0x08000000;

    await this.clearStatus();
    await this.loadAddress(address);

    // 'downloading' 0 bytes to the program start address followed by a GETSTATUS is used to trigger DFU exit on STM32
    await this.controlTransferOut(DFURequest.DNLOAD, 0, 0);
    await this.controlTransferIn(DFURequest.GETSTATUS, 0, 0, 6);
  }

  async flash(hex: IntelHEX) {
    const info = await this.getChipInfo();

    const flash_layout = info.internal_flash || info.external_flash;

    let available_flash_size = 0;
    if (info.internal_flash) {
      available_flash_size = flash_layout.total_size - (hex.start_linear_address - flash_layout.start_address);
    } else if (info.external_flash) {
      const firmware_partition_index = 2;
      const firmware_sectors = flash_layout.sectors[firmware_partition_index];
      const firmware_partition_size = firmware_sectors.total_size;

      available_flash_size = firmware_partition_size;
    }

    if (hex.linear_bytes_total > available_flash_size) {
      throw new Error('' + (hex.linear_bytes_total / 1024.0).toFixed(1) + (available_flash_size / 1024.0).toFixed(1));
    }

    let transferSize = 2048;
    try {
      const desc = await this.getFunctionalDescriptor();
      transferSize = desc.wTransferSize;
    } catch (e) {
      // ...ignoring, leave at default
    }

    await this.clearStatus();

    if (info.internal_flash) {
      await this.unlockOptionBytes(info.option_bytes.start_address, info.option_bytes.total_size);
    }

    await this.erasePages(flash_layout);
    await this.upload(hex, transferSize);
    await this.verify(hex, transferSize);
    await asyncDelay(500);
    await this.leave(hex);
  }
}