import { ArrayWriter } from ".";
import { transformBlackboxFieldFlags } from "../blackbox";
import { BlackboxField } from "../constants";

export interface FieldDefinition {
  name: string;
  array_index?: number;
  blackbox_field: BlackboxField;
  advance: number;
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
    blackbox_field: BlackboxField.LOOP,
    advance: 1,
    signed: false,
  },
  {
    name: "time",
    blackbox_field: BlackboxField.TIME,
    advance: 1,
    signed: false,
  },

  {
    name: "axisP",
    array_index: 0,
    blackbox_field: BlackboxField.PID_P_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisP",
    array_index: 1,
    blackbox_field: BlackboxField.PID_P_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisP",
    array_index: 2,
    blackbox_field: BlackboxField.PID_P_TERM,
    advance: 1,
    signed: true,
  },

  {
    name: "axisI",
    array_index: 0,
    blackbox_field: BlackboxField.PID_I_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisI",
    array_index: 1,
    blackbox_field: BlackboxField.PID_I_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisI",
    array_index: 2,
    blackbox_field: BlackboxField.PID_I_TERM,
    advance: 1,
    signed: true,
  },

  {
    name: "axisD",
    array_index: 0,
    blackbox_field: BlackboxField.PID_D_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisD",
    array_index: 1,
    blackbox_field: BlackboxField.PID_D_TERM,
    advance: 0,
    signed: true,
  },
  {
    name: "axisD",
    array_index: 2,
    blackbox_field: BlackboxField.PID_D_TERM,
    advance: 1,
    signed: true,
  },

  //"axisF[0]"
  //"axisF[1]"
  //"axisF[2]"

  {
    name: "rcCommand",
    array_index: 0,
    signed: true,
    blackbox_field: BlackboxField.RX,
    advance: 0,
    convert: (val: number) => {
      return val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 1,
    signed: true,
    blackbox_field: BlackboxField.RX,
    advance: 0,
    convert: (val: number) => {
      return val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 2,
    signed: true,
    blackbox_field: BlackboxField.RX,
    advance: 0,
    convert: (val: number) => {
      return -val / 2;
    },
  },
  {
    name: "rcCommand",
    array_index: 3,
    signed: true,
    blackbox_field: BlackboxField.RX,
    advance: 1,
    convert: convertOffset(1000),
  },

  {
    name: "setpoint",
    array_index: 0,
    blackbox_field: BlackboxField.SETPOINT,
    advance: 0,
    signed: true,
  },
  {
    name: "setpoint",
    array_index: 1,
    blackbox_field: BlackboxField.SETPOINT,
    advance: 0,
    signed: true,
  },
  {
    name: "setpoint",
    array_index: 2,
    blackbox_field: BlackboxField.SETPOINT,
    advance: 0,
    signed: true,
    convert: convertFlip,
  },
  {
    name: "setpoint",
    array_index: 3,
    blackbox_field: BlackboxField.SETPOINT,
    advance: 1,
    signed: true,
  },

  //"vbatLatest",
  //"amperageLatest",
  //"rssi",

  {
    name: "accRaw",
    array_index: 0,
    blackbox_field: BlackboxField.ACCEL_RAW,
    advance: 0,
    signed: true,
  },
  {
    name: "accRaw",
    array_index: 1,
    blackbox_field: BlackboxField.ACCEL_RAW,
    advance: 0,
    signed: true,
  },
  {
    name: "accRaw",
    array_index: 2,
    blackbox_field: BlackboxField.ACCEL_RAW,
    advance: 1,
    signed: true,
    convert: convertOffset(1000),
  },

  {
    name: "accSmooth",
    array_index: 0,
    blackbox_field: BlackboxField.ACCEL_FILTER,
    advance: 0,
    signed: true,
  },
  {
    name: "accSmooth",
    array_index: 1,
    blackbox_field: BlackboxField.ACCEL_FILTER,
    advance: 0,
    signed: true,
  },
  {
    name: "accSmooth",
    array_index: 2,
    blackbox_field: BlackboxField.ACCEL_FILTER,
    advance: 1,
    signed: true,
    convert: convertOffset(1000),
  },

  {
    name: "gyroRaw",
    array_index: 0,
    blackbox_field: BlackboxField.GYRO_RAW,
    advance: 0,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroRaw",
    array_index: 1,
    blackbox_field: BlackboxField.GYRO_RAW,
    advance: 0,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroRaw",
    array_index: 2,
    blackbox_field: BlackboxField.GYRO_RAW,
    advance: 1,
    signed: true,
    convert: convertGyro(-1),
  },

  {
    name: "gyroADC",
    array_index: 0,
    blackbox_field: BlackboxField.GYRO_FILTER,
    advance: 0,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroADC",
    array_index: 1,
    blackbox_field: BlackboxField.GYRO_FILTER,
    advance: 0,
    signed: true,
    convert: convertGyro(1),
  },
  {
    name: "gyroADC",
    array_index: 2,
    blackbox_field: BlackboxField.GYRO_FILTER,
    advance: 1,
    signed: true,
    convert: convertGyro(-1),
  },

  {
    name: "motor",
    array_index: 0,
    blackbox_field: BlackboxField.MOTOR,
    advance: 0,
    signed: true,
  },
  {
    name: "motor",
    array_index: 1,
    blackbox_field: BlackboxField.MOTOR,
    advance: 0,
    signed: true,
  },
  {
    name: "motor",
    array_index: 2,
    blackbox_field: BlackboxField.MOTOR,
    advance: 0,
    signed: true,
  },
  {
    name: "motor",
    array_index: 3,
    blackbox_field: BlackboxField.MOTOR,
    advance: 1,
    signed: true,
  },

  {
    name: "cpuload",
    blackbox_field: BlackboxField.CPU_LOAD,
    advance: 1,
    signed: false,
  },

  {
    name: "debug[0]",
    array_index: 0,
    blackbox_field: BlackboxField.DEBUG,
    advance: 0,
    signed: true,
  },
  {
    name: "debug[1]",
    array_index: 1,
    blackbox_field: BlackboxField.DEBUG,
    advance: 0,
    signed: true,
  },
  {
    name: "debug[2]",
    array_index: 2,
    blackbox_field: BlackboxField.DEBUG,
    advance: 0,
    signed: true,
  },
  {
    name: "debug[3]",
    array_index: 3,
    blackbox_field: BlackboxField.DEBUG,
    advance: 1,
    signed: true,
  },
];

export class Blackbox {
  private buffer = new ArrayWriter();

  private defs = DefaultFields;
  private fieldflags: number;

  constructor(private file) {
    this.fieldflags = transformBlackboxFieldFlags(file.blackbox_fieldflags);
  }

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
    if (!val[0]) {
      console.warn("skipping blackbox entry");
      return;
    }

    this.buffer.writeUint8("I".charCodeAt(0));

    let bit = 1;
    let index = 0;
    for (const d of this.defs) {
      const test = bit & this.fieldflags;
      if (test & (1 << d.blackbox_field)) {
        let v = val[index];
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
        // Adjust index only if field was written and field descriptor says we should
        index += d.advance;
      }

      // Adjust bit flag only if field descriptor says to
      bit <<= d.advance;
    }
  }

  public toUrl() {
    const buf = this.buffer.array();
    const blob = new Blob([buf], { type: "octet/stream" });
    return window.URL.createObjectURL(blob);
  }

  private writeHeaderJoin(key: string, fn: (d: FieldDefinition) => string) {
    let val = "";

    let bit = 1 << 0;
    let num_emitted = 0;
    for (const d of this.defs) {
      const test = bit & this.fieldflags;
      if (test & (1 << d.blackbox_field)) {
        if (num_emitted++ != 0) {
          val += ",";
        }
        val += fn(d);
      }
      bit <<= d.advance;
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
