// Command line access to a QUICKSILVER flight controller for scripts and
// agents. Prints JSON on stdout; diagnostics and firmware log lines go to
// stderr. Run through script/fc.mjs, which bundles this file with esbuild.
import { spawnSync } from "node:child_process";
import {
  closeSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { constants } from "node:fs";
import { ReadStream } from "node:tty";
import { Log, LogLevel } from "@/log";
import { decodeSemver } from "@/store/util";
import YAML from "yaml";
import { migrateProfile } from "@/store/util/profile-migrate";
import { profileFilename, profileToYaml } from "@/store/util/profile-yaml";
import { targetFilename, targetToYaml } from "@/store/util/target-yaml";
import {
  exportBlackboxBtfl,
  exportBlackboxJson,
} from "@/store/util/blackbox-export";
import { CBOR } from "@/store/serial/cbor";
import { lzssDecode } from "@/store/serial/lzss";
import {
  QuicBlackbox,
  QuicCmd,
  QuicFlag,
  QuicVal,
  QUIC_HEADER_CMD_MASK,
  QUIC_HEADER_COMPRESSED,
  QUIC_HEADER_FLAG_MASK,
  QUIC_HEADER_FLAG_SHIFT,
  QUIC_MAGIC,
} from "@/store/serial/quic";

Log.level = LogLevel.Error;

const SIMULATOR_URL = "ws://localhost:3000/websocket";
const DEFAULT_TIMEOUT = 5_000;

const USAGE = `usage: fc [--port <dev|ws-url|sim>] [--timeout <ms>] <command> [args]

port defaults to $FC_PORT, else the only USB serial device found.
"sim" is the firmware simulator at ${SIMULATOR_URL}.

commands:
  ports                      list candidate serial devices
  info                       firmware/target info
  get <value>                read a value: ${valueNames().join(", ")}
  profile [path...]          read the profile, or the given paths
  profile-export [--out <file|->]
                             save the profile as the configurator's .yaml,
                             to Profile_<name>_<date>.yaml by default
  profile-import <file|->    migrate a profile .yaml (or .json) to the board's
                             firmware and write it, like the configurator
  target-export [--out <file|->]
                             save the target as .yaml, to
                             Target_<name>_<date>.yaml by default
  target-import <file|->     write a target .yaml; the board saves and reboots
  set <path>=<json>...       change profile fields and write the profile back
  apply <file|->             deep-merge a JSON patch into the profile and write it
  state [path...]            read live state, optionally only the given paths
        [--watch <ms>] [--count <n>]  poll, one JSON line per sample
  cal-imu                    calibrate the accelerometer (board level and still)
  cal-sticks                 start stick calibration
  blackbox list              list recorded blackbox files
  blackbox get <index>       download a file (index into blackbox list's files)
        [--format json|bbl] [--out <file|->]
                             json is the configurator's export, bbl a Betaflight
                             log; writes blackbox-<index>.<format> by default
  blackbox reset             erase blackbox storage
  reboot                     soft reboot the board
  raw <cmd> [<json>...]      send a QuicCmd (name or number) with CBOR args

paths use dots and indices, e.g. pid.pid_rates[0].kp, rate.rates[0].rate[1].
byte strings are printed as {"$bytes": "<hex>"} and accepted back the same way.`;

// ---------------------------------------------------------------- transport

interface Link {
  write(data: Uint8Array): void;
  close(): void;
}

function listPorts(): string[] {
  const patterns =
    process.platform === "darwin"
      ? [/^cu\.usbmodem/]
      : [/^ttyACM\d+$/, /^ttyUSB\d+$/];
  try {
    return readdirSync("/dev")
      .filter((f) => patterns.some((p) => p.test(f)))
      .map((f) => "/dev/" + f)
      .sort();
  } catch {
    return [];
  }
}

function resolvePort(port: string | undefined): string {
  port ??= process.env.FC_PORT;
  if (port === "sim" || port === "simulator") return SIMULATOR_URL;
  if (port) return port;
  const ports = listPorts();
  if (ports.length === 1) return ports[0];
  if (!ports.length) throw new Error("no flight controller found, pass --port");
  throw new Error(`several ports found (${ports.join(", ")}), pass --port`);
}

function openSerial(path: string, onData: (d: Uint8Array) => void): Link {
  const flags = constants.O_RDWR | constants.O_NOCTTY;
  let readFd: number;
  try {
    readFd = openSync(path, flags);
  } catch (err: any) {
    // On macOS the configurator claims the device over WebUSB, which no
    // process listing shows.
    if (err?.code === "EBUSY") {
      throw new Error(
        `${path} is busy; disconnect the configurator or other serial tool`,
      );
    }
    throw err;
  }
  const writeFd = openSync(path, flags);

  // Raw mode: no echo, no line discipline and no output post-processing.
  const stty = spawnSync("stty", ["raw", "-echo"], {
    stdio: [readFd, "ignore", "pipe"],
  });
  if (stty.status !== 0) {
    closeSync(readFd);
    closeSync(writeFd);
    throw new Error("stty failed: " + stty.stderr.toString().trim());
  }

  const stream = new ReadStream(readFd);
  stream.on("data", (d: Buffer) => onData(new Uint8Array(d)));
  stream.on("error", (e) => fail(e));

  return {
    write(data) {
      let off = 0;
      while (off < data.length) off += writeSync(writeFd, data, off);
    },
    close() {
      stream.destroy();
      closeSync(writeFd);
    },
  };
}

async function openWebSocket(
  url: string,
  onData: (d: Uint8Array) => void,
): Promise<Link> {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error(`cannot connect to ${url}`));
  });
  ws.onmessage = (e) => onData(new Uint8Array(e.data as ArrayBuffer));
  ws.onclose = () => fail(new Error("websocket closed"));
  return {
    write: (data) => ws.send(data as Uint8Array<ArrayBuffer>),
    close() {
      ws.onclose = null;
      ws.close();
    },
  };
}

// --------------------------------------------------------------------- quic

class QuicError extends Error {}

interface Packet {
  cmd: number;
  flag: number;
  payload: Uint8Array;
}

class Quic {
  private link!: Link;
  private buf = new Uint8Array(0);
  private packets: Packet[] = [];
  private waiter?: () => void;

  constructor(private timeout: number) {}

  async open(port: string) {
    const onData = (d: Uint8Array) => this.receive(d);
    this.link = /^wss?:\/\//.test(port)
      ? await openWebSocket(port, onData)
      : openSerial(port, onData);
    // Discard whatever the board sent before we were listening.
    await delay(100);
    this.buf = new Uint8Array(0);
    this.packets = [];
  }

  close() {
    this.link?.close();
  }

  writeRaw(data: Uint8Array) {
    this.link.write(data);
  }

  private receive(data: Uint8Array) {
    const buf = new Uint8Array(this.buf.length + data.length);
    buf.set(this.buf);
    buf.set(data, this.buf.length);

    let off = 0;
    while (true) {
      while (off < buf.length && buf[off] !== QUIC_MAGIC) off++;
      if (buf.length - off < 4) break;
      const len = (buf[off + 2] << 8) | buf[off + 3];
      if (buf.length - off - 4 < len) break;
      const header = buf[off + 1];
      const payload = buf.slice(off + 4, off + 4 + len);
      this.packets.push({
        cmd: header & QUIC_HEADER_CMD_MASK,
        flag: (header & QUIC_HEADER_FLAG_MASK) >> QUIC_HEADER_FLAG_SHIFT,
        payload:
          header & QUIC_HEADER_COMPRESSED ? lzssDecode(payload) : payload,
      });
      off += 4 + len;
    }
    this.buf = buf.slice(off);
    this.waiter?.();
  }

  private async next(): Promise<Packet> {
    const deadline = Date.now() + this.timeout;
    while (!this.packets.length) {
      const left = deadline - Date.now();
      if (left <= 0) throw new Error("timeout waiting for the board");
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, left);
        this.waiter = () => {
          clearTimeout(t);
          resolve();
        };
      });
      this.waiter = undefined;
    }
    return this.packets.shift()!;
  }

  async command(cmd: QuicCmd, ...values: any[]): Promise<any[]> {
    return CBOR.decode(await this.exchange(cmd, ...values));
  }

  /** Sends a command and returns its undecoded reply payload. */
  async exchange(cmd: QuicCmd, ...values: any[]): Promise<Uint8Array> {
    const parts = values.map((v) => CBOR.encode(v));
    const len = parts.reduce((n, p) => n + p.length, 0);
    const req = new Uint8Array(4 + len);
    req.set([QUIC_MAGIC, cmd, (len >> 8) & 0xff, len & 0xff]);
    let off = 4;
    for (const p of parts) {
      req.set(p, off);
      off += p.length;
    }
    this.link.write(req);

    let packet = await this.next();
    while (packet.cmd === QuicCmd.Log) {
      const msg = CBOR.decode(packet.payload)[0];
      process.stderr.write(`[fc] ${msg}\n`);
      packet = await this.next();
    }
    if (packet.cmd !== cmd) {
      throw new Error(`unexpected reply cmd ${packet.cmd} to ${cmd}`);
    }

    let payload = packet.payload;
    if (packet.flag === QuicFlag.Streaming) {
      const chunks = [payload];
      while (true) {
        const p = await this.next();
        if (p.cmd !== cmd || p.flag !== QuicFlag.Streaming) {
          throw new Error("broken stream");
        }
        if (!p.payload.length) break;
        chunks.push(p.payload);
      }
      payload = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0;
      for (const c of chunks) {
        payload.set(c, o);
        o += c.length;
      }
    }

    if (packet.flag === QuicFlag.Error) {
      throw new QuicError(String(CBOR.decode(payload)[0]));
    }
    return payload;
  }

  private unwrap(id: QuicVal, reply: any[]) {
    if (reply[0] !== id) throw new Error("invalid value in reply");
    if (reply.length < 2) throw new Error("no payload");
    return reply.length === 2 ? reply[1] : reply.slice(1);
  }

  async get(id: QuicVal) {
    return this.unwrap(id, await this.command(QuicCmd.Get, id));
  }

  async set(id: QuicVal, value: any) {
    return this.unwrap(id, await this.command(QuicCmd.Set, id, value));
  }
}

// -------------------------------------------------------------------- utils

let current: Quic | undefined;

function fail(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${msg}\n`);
  current?.close();
  process.exit(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function valueNames() {
  return Object.keys(QuicVal)
    .filter(
      (k) => isNaN(Number(k)) && k !== "Invalid" && k !== "BLHeliSettings",
    )
    .map(snake);
}

function snake(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function lookupEnum(e: Record<string, any>, name: string, what: string) {
  if (/^\d+$/.test(name)) return Number(name);
  const key = Object.keys(e).find(
    (k) =>
      isNaN(Number(k)) && snake(k) === name.replace(/-/g, "_").toLowerCase(),
  );
  if (key === undefined) throw new Error(`unknown ${what} "${name}"`);
  return e[key] as number;
}

function toJson(v: any): any {
  if (v instanceof Uint8Array)
    return { $bytes: Buffer.from(v).toString("hex") };
  if (Array.isArray(v)) return v.map(toJson);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, toJson(x)]),
    );
  }
  return v;
}

function fromJson(v: any): any {
  if (Array.isArray(v)) return v.map(fromJson);
  if (v && typeof v === "object") {
    if (typeof v.$bytes === "string" && Object.keys(v).length === 1) {
      return new Uint8Array(Buffer.from(v.$bytes, "hex"));
    }
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, fromJson(x)]),
    );
  }
  return v;
}

function print(v: any, pretty = true) {
  process.stdout.write(JSON.stringify(toJson(v), null, pretty ? 2 : 0) + "\n");
}

function readInput(src: string | undefined, cmd: string): string {
  if (!src) throw new Error(`${cmd} needs a file or - for stdin`);
  return readFileSync(src === "-" ? 0 : src, "utf8");
}

/** Writes an exported file, or to stdout for "-". */
function output(data: string | Uint8Array, out: string) {
  if (out === "-") {
    process.stdout.write(data);
    return;
  }
  writeFileSync(out, data);
  print({
    file: out,
    bytes: typeof data === "string" ? Buffer.byteLength(data) : data.length,
  });
}

function parsePath(path: string): (string | number)[] {
  const keys: (string | number)[] = [];
  for (const m of path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)) {
    keys.push(m[2] !== undefined ? Number(m[2]) : m[1]);
  }
  if (!keys.length) throw new Error(`invalid path "${path}"`);
  return keys;
}

function getPath(obj: any, path: string) {
  let v = obj;
  for (const k of parsePath(path)) {
    if (v == null || typeof v !== "object" || !(k in v)) {
      throw new Error(`no such path "${path}"`);
    }
    v = v[k];
  }
  return v;
}

function setPath(obj: any, path: string, value: any) {
  const keys = parsePath(path);
  const last = keys.pop()!;
  let parent = obj;
  for (const k of keys) {
    if (parent == null || typeof parent !== "object" || !(k in parent)) {
      throw new Error(`no such path "${path}"`);
    }
    parent = parent[k];
  }
  if (parent == null || typeof parent !== "object" || !(last in parent)) {
    throw new Error(`no such path "${path}"`);
  }
  const old = parent[last];
  if (typeof old !== typeof value && !(old instanceof Uint8Array)) {
    throw new Error(
      `type mismatch at "${path}": have ${typeof old}, got ${typeof value}`,
    );
  }
  parent[last] = value;
}

function select(obj: any, paths: string[]) {
  if (!paths.length) return obj;
  if (paths.length === 1) return getPath(obj, paths[0]);
  return Object.fromEntries(paths.map((p) => [p, getPath(obj, p)]));
}

function parseValue(s: string) {
  try {
    return fromJson(JSON.parse(s));
  } catch {
    return s;
  }
}

// Merges patch into target in place, refusing keys the profile lacks.
function mergeInto(target: any, patch: any, path = "") {
  for (const [k, v] of Object.entries(patch)) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in target)) throw new Error(`no such path "${p}"`);
    const t = target[k];
    if (
      v &&
      typeof v === "object" &&
      !(v instanceof Uint8Array) &&
      t &&
      typeof t === "object" &&
      !(t instanceof Uint8Array)
    ) {
      mergeInto(t, v, p);
    } else {
      target[k] = v;
    }
  }
}

// ----------------------------------------------------------------- blackbox

async function downloadBlackbox(
  fc: Quic,
  arg: string | undefined,
  opts: Record<string, string>,
) {
  const index = Number(arg);
  const format = opts.format ?? "json";
  if (format !== "json" && format !== "bbl") {
    throw new Error(`unknown format "${format}", use json or bbl`);
  }

  const list = (await fc.command(QuicCmd.Blackbox, QuicBlackbox.List))[0];
  const file = Number.isInteger(index) ? list.files[index] : undefined;
  if (!file) {
    throw new Error(
      `no blackbox file "${arg}", the board has ${list.files.length}`,
    );
  }
  const info = await fc.get(QuicVal.Info);
  const firmware = decodeSemver(info.quic_protocol_version);
  // Older recordings lack an embedded profile; take the current one.
  const profile = format === "bbl" ? await fc.get(QuicVal.Profile) : undefined;

  const payload = await fc.exchange(QuicCmd.Blackbox, QuicBlackbox.Get, index);
  const data =
    format === "json"
      ? exportBlackboxJson(payload, file, firmware)
      : exportBlackboxBtfl(payload, file, firmware, profile);

  output(data, opts.out ?? `blackbox-${index}.${format}`);
}

// --------------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help") {
      process.stdout.write(USAGE + "\n");
      return;
    }
    const m = a.match(/^--([a-z]+)(?:=(.*))?$/);
    if (m) {
      const v = m[2] ?? args[++i];
      if (v === undefined) throw new Error(`missing value for --${m[1]}`);
      opts[m[1]] = v;
    } else {
      rest.push(a);
    }
  }

  const [cmd, ...params] = rest;
  if (!cmd) {
    process.stdout.write(USAGE + "\n");
    process.exit(2);
  }
  if (cmd === "ports") return print(listPorts());

  const fc = (current = new Quic(Number(opts.timeout ?? DEFAULT_TIMEOUT)));
  await fc.open(resolvePort(opts.port));

  switch (cmd) {
    case "info":
      print(await fc.get(QuicVal.Info));
      break;

    case "get": {
      if (!params[0]) throw new Error("get needs a value name");
      const id = lookupEnum(QuicVal, params[0], "value");
      print(select(await fc.get(id), params.slice(1)));
      break;
    }

    case "profile":
      print(select(await fc.get(QuicVal.Profile), params));
      break;

    case "profile-export": {
      const profile = await fc.get(QuicVal.Profile);
      output(profileToYaml(profile), opts.out ?? profileFilename(profile));
      break;
    }

    case "profile-import": {
      const profile = YAML.parse(readInput(params[0], "profile-import"));
      const defaults = await fc.get(QuicVal.DefaultProfile);
      defaults.meta.name = defaults.meta.name.replace(/\0/g, "");
      const target = await fc.get(QuicVal.Target);
      const written = await fc.set(
        QuicVal.Profile,
        migrateProfile(profile, defaults, target),
      );
      print({ ok: true, name: written.meta.name.replace(/\0/g, "") });
      break;
    }

    case "target-export": {
      const target = await fc.get(QuicVal.Target);
      const info = await fc.get(QuicVal.Info);
      output(
        targetToYaml(target, info.mcu),
        opts.out ?? targetFilename(target),
      );
      break;
    }

    case "target-import": {
      const target = YAML.parse(readInput(params[0], "target-import"));
      await fc.set(QuicVal.Target, target);
      print({ ok: true, rebooting: true });
      break;
    }

    case "set": {
      if (!params.length) throw new Error("set needs <path>=<value> arguments");
      const profile = await fc.get(QuicVal.Profile);
      const paths: string[] = [];
      for (const p of params) {
        const eq = p.indexOf("=");
        if (eq < 1) throw new Error(`expected <path>=<value>, got "${p}"`);
        const path = p.slice(0, eq);
        setPath(profile, path, parseValue(p.slice(eq + 1)));
        paths.push(path);
      }
      const written = await fc.set(QuicVal.Profile, profile);
      print(Object.fromEntries(paths.map((p) => [p, getPath(written, p)])));
      break;
    }

    case "apply": {
      const patch = fromJson(JSON.parse(readInput(params[0], "apply")));
      const profile = await fc.get(QuicVal.Profile);
      mergeInto(profile, patch);
      await fc.set(QuicVal.Profile, profile);
      print({ ok: true });
      break;
    }

    case "state": {
      const count = Number(opts.count ?? (opts.watch ? Infinity : 1));
      const interval = Number(opts.watch ?? 0);
      for (let i = 0; i < count; i++) {
        if (i) await delay(interval);
        print(select(await fc.get(QuicVal.State), params), count === 1);
      }
      break;
    }

    case "cal-imu":
      await fc.command(QuicCmd.CalImu);
      print({ ok: true });
      break;

    case "cal-sticks":
      await fc.command(QuicCmd.CalSticks);
      print({ ok: true });
      break;

    case "blackbox": {
      if (params[0] === "list") {
        print((await fc.command(QuicCmd.Blackbox, QuicBlackbox.List))[0]);
      } else if (params[0] === "get") {
        await downloadBlackbox(fc, params[1], opts);
      } else if (params[0] === "reset") {
        await fc.command(QuicCmd.Blackbox, QuicBlackbox.Reset);
        print({ ok: true });
      } else {
        throw new Error("blackbox needs list, get or reset");
      }
      break;
    }

    case "reboot":
      fc.writeRaw(new TextEncoder().encode("S"));
      await delay(100);
      print({ ok: true });
      break;

    case "raw": {
      if (!params[0]) throw new Error("raw needs a command");
      const id = lookupEnum(QuicCmd, params[0], "command");
      print(await fc.command(id, ...params.slice(1).map(parseValue)));
      break;
    }

    default:
      throw new Error(`unknown command "${cmd}", see --help`);
  }

  fc.close();
}

main().then(
  () => process.exit(0),
  (err) => fail(err),
);
