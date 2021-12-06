import store from './store'
import util from 'util';

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
}

function getFileWriter() {
  try {
    if (nw?.App === undefined) {
      return undefined;
    }
  } catch (e) {
    return undefined;
  }

  const fs = nw.require('fs');
  const os = nw.require('os');
  const path = nw.require('path');

  class FileWriter {
    private path = path.join(os.tmpdir(), nw.App.manifest.name + '.log');
    private file = fs.createWriteStream(this.path, { flags: 'w' });

    constructor() {
      console.log("Logging to " + this.path)
    }

    public write(str: string) {
      this.file.write(str + "\n");
    }

    public getPath() {
      return this.path;
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

  public static log(level: LogLevel, prefix?: string, ...data: any[]) {
    let str = "[" + LevelNames[level] + "]";
    if (prefix && prefix.length) {
      str += "[" + prefix + "]";
    }
    if (typeof data[0] == "string") {
      str += " " + data.shift();
    }
    str += " ";

    const line = util.format(str, ...data);
    if (Log.file) {
      Log.file.write(line);
    }

    switch (level) {
      case LogLevel.Debug:
      case LogLevel.Info:
        console.log(str, ...data);
        store.commit('append_log', line);
        break;
      case LogLevel.Warning:
        console.warn(str, ...data);
        store.commit('append_log', line);
        break;
      case LogLevel.Error:
        console.error(str, ...data);
        store.commit('append_log', line);
        break;
      default:
        break;
    }
  }
}