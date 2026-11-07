# Repository guidance

## Flight controller CLI

`script/fc.mjs` talks to a connected QUICKSILVER board over the same QUIC/CBOR protocol as the configurator, reusing `src/store/serial/{cbor,lzss,quic}.ts`. It bundles `cli/fc.ts` with esbuild on each run, so `npm install` must have been run once. Use it to inspect or change a board instead of driving the UI.

- `node script/fc.mjs --help` lists commands. JSON goes to stdout; errors and firmware log lines go to stderr with a non-zero exit.
- The port defaults to `$FC_PORT`, else the only `/dev/cu.usbmodem*` (macOS) or `/dev/ttyACM*` (Linux) device; pass `--port <dev>` when several are attached. `ports` lists candidates. `--port sim` targets the simulator websocket at `ws://localhost:3000/websocket`.
- Read: `info`, `get <value>` (`target`, `state`, `vtx_settings`, `blackbox_presets`, ...), `profile [path...]`, `state [path...] [--watch <ms>] [--count <n>]`, `blackbox list`.
- Files: `profile-export` and `target-export [--out <file|->]` write the same `.yaml` as the profile and target panels (`Profile_<name>_<date>.yaml`, `Target_<name>_<date>.yaml`). `profile-import <file|->` runs the configurator's profile migration against the board's default profile and target, then writes it. `target-import <file|->` writes a target; the board saves it and reboots. The shared code is in `src/store/util/{profile-yaml,profile-migrate,target-yaml}.ts`.
- Blackbox: `blackbox get <index> [--format json|bbl] [--out <file|->]` downloads an entry of `blackbox list`'s `files` (0-based) to `blackbox-<index>.<format>`. `json` is the configurator's export (fields, scaled entries, embedded profile); `bbl` is a Betaflight log for Blackbox Explorer. Both come from `src/store/util/blackbox-export.ts`, which the app's blackbox worker uses too. Logs are only recorded while armed.
- Write: `set <path>=<json>...` reads the profile, changes those fields and writes it back; `apply <file|->` deep-merges a JSON patch. Both refuse unknown paths and type changes. Writing the profile saves it to flash.
- Actions: `cal-imu`, `cal-sticks`, `blackbox reset`, `reboot`; `raw <cmd> [<json>...]` sends any `QuicCmd`.
- Paths use dots and indices, e.g. `pid.pid_rates[0].kp` or `rate.rates[0].rate[1]`. Quote them in zsh, which globs `[...]`. Byte strings appear as `{"$bytes": "<hex>"}` and are accepted back in that form.
- The firmware only services USB while disarmed. One command runs per invocation; the configurator cannot hold the port at the same time.
- Restore any profile values you change for testing unless asked to keep them.
- Extend the CLI whenever a task needs board access it lacks, rather than working around it with one-off scripts or `raw`. Add a command to `cli/fc.ts`, reuse the protocol and export code under `src/store/` (move it out of Pinia stores when needed, as `util/blackbox-export.ts` was), update `--help`, and document it here.
