import { ArrayWriter } from ".";

export interface FieldDefinition {
  name: string;
  array_index?: number;
  index: number;
  signed: boolean;
  convert?: (v: number) => number;
}

function convertFlip(val: number): number {
  return -val;
}

function convertGyro(flip: number): (v: number) => number {
  return (val) => {
    return (((flip * val * 1) / 1000) * 180) / Math.PI;
  };
}

function convertOffset(offset: number): (v: number) => number {
  return (val) => {
    return offset + val;
  };
}

export const DefaultFields: FieldDefinition[] = [
  {
    name: "loopIteration",
    index: 0,
    signed: false,
  },
  {
    name: "time",
    index: 1,
    signed: false,
  },

  { name: "axisP", array_index: 0, index: 2, signed: true },
  { name: "axisP", array_index: 1, index: 2, signed: true },
  { name: "axisP", array_index: 2, index: 2, signed: true },

  { name: "axisI", array_index: 0, index: 3, signed: true },
  { name: "axisI", array_index: 1, index: 3, signed: true },
  { name: "axisI", array_index: 2, index: 3, signed: true },

  { name: "axisD", array_index: 0, index: 4, signed: true },
  { name: "axisD", array_index: 1, index: 4, signed: true },
  { name: "axisD", array_index: 2, index: 4, signed: true },

  //"axisF[0]"
  //"axisF[1]"
  //"axisF[2]"

  {
    name: "rcCommand",
    array_index: 0,
    signed: true,
    index: 5,
    convert: (val: number) => {
      return val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 1,
    signed: true,
    index: 5,
    convert: (val: number) => {
      return val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 2,
    signed: true,
    index: 5,
    convert: (val: number) => {
      return -val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 3,
    signed: true,
    index: 5,
    convert: convertOffset(1000),
  },

  { name: "setpoint", array_index: 0, index: 6, signed: true },
  { name: "setpoint", array_index: 1, index: 6, signed: true },
  {
    name: "setpoint",
    array_index: 2,
    index: 6,
    signed: true,
    convert: convertFlip,
  },
  { name: "setpoint", array_index: 3, index: 6, signed: true },

  //"vbatLatest",
  //"amperageLatest",
  //"rssi",

  { name: "accRaw", array_index: 0, index: 7, signed: true },
  { name: "accRaw", array_index: 1, index: 7, signed: true },
  {
    name: "accRaw",
    array_index: 2,
    index: 7,
    signed: true,
    convert: convertOffset(1000),
  },

  { name: "accSmooth", array_index: 0, index: 8, signed: true },
  { name: "accSmooth", array_index: 1, index: 8, signed: true },
  {
    name: "accSmooth",
    array_index: 2,
    index: 8,
    signed: true,
    convert: convertOffset(1000),
  },

  {
    name: "gyroRaw",
    array_index: 0,
    index: 9,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroRaw",
    array_index: 1,
    index: 9,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroRaw",
    array_index: 2,
    index: 9,
    signed: true,
    convert: convertGyro(-1),
  },

  {
    name: "gyroADC",
    array_index: 0,
    index: 10,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroADC",
    array_index: 1,
    index: 10,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroADC",
    array_index: 2,
    index: 10,
    signed: true,
    convert: convertGyro(-1),
  },

  { name: "motor", array_index: 0, index: 11, signed: true },
  { name: "motor", array_index: 1, index: 11, signed: true },
  { name: "motor", array_index: 2, index: 11, signed: true },
  { name: "motor", array_index: 3, index: 11, signed: true },

  { name: "cpuload", index: 12, signed: false },

  { name: "debug[0]", index: 13, signed: true },
  { name: "debug[1]", index: 14, signed: true },
  { name: "debug[2]", index: 15, signed: true },
  { name: "debug[3]", index: 16, signed: true },
];

export class Blackbox {
  private buffer = new ArrayWriter();

  private defs = DefaultFields;

  constructor(private file) {}

  public writeHeaders() {
    this.writeHeaderRaw(
      "Product",
      "Blackbox flight data recorder by Nicholas Sherlock"
    );
    this.writeHeaderRaw("Data version", "2");

    this.writeHeaderRaw("I interval", "" + this.file.blackbox_rate);
    this.writeHeaderRaw("P interval", "1/" + this.file.blackbox_rate);

    this.writeHeaderJoin("Field I name", (d: FieldDefinition) => {
      let name = d.name;
      if (d.array_index != undefined) {
        name += "[" + d.array_index + "]";
      }
      return name;
    });

    this.writeHeaderJoin("Field I signed", (d: FieldDefinition) => {
      if (d.signed) {
        return "1";
      }
      return "0";
    });
    this.writeHeaderJoin("Field I predictor", (d: FieldDefinition) => {
      return "0";
    });
    this.writeHeaderJoin("Field I encoding", (d: FieldDefinition) => {
      if (d.signed) {
        return "0";
      }
      return "1";
    });

    this.writeHeaderJoin("Field P predictor", (d: FieldDefinition) => {
      return "0";
    });
    this.writeHeaderJoin("Field P encoding", (d: FieldDefinition) => {
      if (d.signed) {
        return "0";
      }
      return "1";
    });

    this.writeHeaderRaw("Firmware type", "Cleanflight");
    this.writeHeaderRaw("Firmware revision", "Betaflight 4.3.0");

    this.writeHeaderRaw("gyro_scale", "0x3f800000");
    this.writeHeaderRaw("acc_1G", "1000");
    this.writeHeaderRaw("motorOutput", "0,1000");

    // todo: fetch real value
    this.writeHeaderRaw("looptime", "" + this.file.looptime); // for FFT Hz scaling
    this.writeHeaderRaw("pid_process_denom", "1"); // for FFT Hz scaling

    // this.writeHeaderRaw("debug_mode", "3")

    this.writeHeaderRaw("rates", "78,78,78");
    this.writeHeaderRaw("rates_type", "3");
  }

  public writeValue(val: any[]) {
    this.buffer.writeUint8("I".charCodeAt(0));
    for (const d of this.defs) {
      let v = val[d.index];
      if (d.array_index != undefined) {
        v = v[d.array_index];
      }
      if (d.convert) {
        v = d.convert(v);
      }

      if (d.signed) {
        this.writeSigned(v);
      } else {
        this.writeUnsigned(v);
      }
    }
  }

  public toUrl() {
    const buf = this.buffer.array();
    const blob = new Blob([buf], { type: "octet/stream" });
    return window.URL.createObjectURL(blob);
  }

  private writeHeaderJoin(key: string, fn: (d: FieldDefinition) => string) {
    let val = "";

    for (let i = 0; i < this.defs.length; i++) {
      const d = this.defs[i];
      val += fn(d);
      if (i != this.defs.length - 1) {
        val += ",";
      }
    }

    return this.writeHeaderRaw(key, val);
  }

  private writeHeaderRaw(key: string, value: string) {
    const str = `H ${key}:${value}\n`;
    for (let i = 0; i < str.length; i++) {
      this.buffer.writeUint8(str.charCodeAt(i));
    }
  }

  private writeUnsigned(val: number) {
    while (val > 127) {
      this.buffer.writeUint8(((val & 0xff) | 0x80) & 0xff);
      val >>>= 7;
    }
    this.buffer.writeUint8(val);
  }

  private writeSigned(val: number) {
    const unsigned = (val << 1) ^ (val >> 31);
    return this.writeUnsigned(unsigned);
  }
}
