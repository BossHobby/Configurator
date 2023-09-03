import { useRootStore } from "./store/root";
import util from "util";

export enum LogLevel {
  Trace,
  Debug,
  Info,
  Warning,
  Error,
}

export const LevelNames = {
  [LogLevel.Trace]: "trace",
  [LogLevel.Debug]: "debug",
  [LogLevel.Info]: "info",
  [LogLevel.Warning]: "warning",
  [LogLevel.Error]: "error",
};

function getFileWriter() {
  // TODO: electron
  return undefined;

  class FileWriter {
    public write(str: string) {}

    public getPath() {
      return undefined;
    }
  }

  return new FileWriter();
}

export class Log {
  private static file = getFileWriter();

  public static filePath() {
    return Log.file ? Log.file.getPath() : undefined;
  }

  public static trace(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Trace, prefix, ...data);
  }

  public static debug(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Debug, prefix, ...data);
  }

  public static info(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Info, prefix, ...data);
  }

  public static warn(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Warning, prefix, ...data);
  }

  public static warning(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Warning, prefix, ...data);
  }

  public static error(prefix: string, ...data: any[]) {
    Log.log(LogLevel.Error, prefix, ...data);
  }

  private static logFmtStr(
    level: LogLevel,
    prefix: string | undefined,
    data: any[]
  ): string {
    let str = "[" + LevelNames[level] + "]";
    if (prefix && prefix.length) {
      str += "[" + prefix + "]";
    }
    while (typeof data[0] == "string") {
      str += data.shift();
    }

    return str;
  }

  private static logToFile(fmt: string, ...data: any[]) {
    const root = useRootStore();

    for (const d of data) {
      fmt += " ";

      if (typeof d == "string") {
        fmt += d;
      } else {
        fmt += JSON.stringify(d);
      }
    }

    if (Log.file) {
      Log.file.write(fmt);
    }
    root.append_log(fmt);
  }

  public static log(level: LogLevel, prefix?: string, ...data: any[]) {
    switch (level) {
      case LogLevel.Trace: {
        const str = this.logFmtStr(level, prefix, data);
        console.debug(str, ...data);
        this.logToFile(str, ...data);
        break;
      }
      case LogLevel.Debug:
      case LogLevel.Info: {
        const str = this.logFmtStr(level, prefix, data);
        console.log(str, ...data);
        this.logToFile(str, ...data);
        break;
      }
      case LogLevel.Warning: {
        const str = this.logFmtStr(level, prefix, data);
        console.warn(str, ...data);
        this.logToFile(str, ...data);
        break;
      }
      case LogLevel.Error: {
        const str = this.logFmtStr(level, prefix, data);
        console.error(str, ...data);
        this.logToFile(str, ...data);
        break;
      }
      default:
        break;
    }
  }
}
