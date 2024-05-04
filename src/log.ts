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

export class Log {
  public static level = import.meta.env.DEV ? LogLevel.Trace : LogLevel.Info;
  public static history: string[] = [];

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

  private static logToFile(level: LogLevel, fmt: string, ...data: any[]) {
    for (const d of data) {
      fmt += " ";

      if (typeof d == "string") {
        fmt += d;
      } else {
        fmt += JSON.stringify(d);
      }
    }
    Log.history.push(fmt);
  }

  public static log(level: LogLevel, prefix?: string, ...data: any[]) {
    if (level < Log.level) {
      return;
    }

    switch (level) {
      case LogLevel.Trace: {
        const str = this.logFmtStr(level, prefix, data);
        console.debug(str, ...data);
        this.logToFile(level, str, ...data);
        break;
      }
      case LogLevel.Debug:
      case LogLevel.Info: {
        const str = this.logFmtStr(level, prefix, data);
        console.log(str, ...data);
        this.logToFile(level, str, ...data);
        break;
      }
      case LogLevel.Warning: {
        const str = this.logFmtStr(level, prefix, data);
        console.warn(str, ...data);
        this.logToFile(level, str, ...data);
        break;
      }
      case LogLevel.Error: {
        const str = this.logFmtStr(level, prefix, data);
        console.error(str, ...data);
        this.logToFile(level, str, ...data);
        break;
      }
      default:
        break;
    }
  }
}
