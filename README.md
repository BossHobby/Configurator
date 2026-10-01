<img src="https://github.com/BossHobby/QUICKSILVER/blob/master/misc/Logo_Clean.svg?raw=true" width="256"></img>

# QUICKSILVER Configurator

Configurator for the [QUICKSILVER Flight Controller Firmware](https://github.com/BossHobby/QUICKSILVER).  
A web version is available at [config.bosshobby.com](https://config.bosshobby.com).  
Standalone versions can be found in the [github releases](https://github.com/BossHobby/Configurator/releases).  
The Web version might or might not work with an Android device and an OTG cable.

## Building

```
npm install
npm run serve # run in a local browser
npm run start # run in nwjs
```

## Contributing

Contributions are welcome and encouraged.

## iOS and Android

The Capacitor apps share the Vue UI and QUIC protocol with the web and Electron
builds. Native connections support Bluetooth LE and WebSocket, either carrying
raw QUIC bytes or the existing QUIC-over-CRSF protocol. USB serial and USB DFU
remain browser/desktop features; mobile USB and firmware updates over BLE are
not implemented.

```sh
npm ci
npm run mobile:sync       # build dist-mobile and sync both native projects
npm run mobile:android   # open Android Studio
npm run mobile:ios       # open Xcode on macOS
```

Android requires JDK 21 and Android SDK 36. A debug APK can be built with
`cd android && ./gradlew assembleDebug`. iOS requires a compatible Xcode and a
signing team selected in the App target. The app identifier is
`com.bosshobby.configurator`. Native assets are bundled locally; the mobile build
does not register the PWA updater. Launcher icons and splash screens are generated
from `assets/` with `npx @capacitor/assets generate --ios --android`.

On iOS and Android, choose Bluetooth or Wi-Fi in the home screen card and press
Connect; disconnect from the menu. Both carry QUIC over CRSF. Bluetooth uses the
Nordic UART service and characteristic UUIDs and is not configurable in the app.
The web and desktop builds additionally offer raw QUIC over Bluetooth and
WebSocket, configurable Bluetooth UUIDs, and the `?ws=host` and
`?crsf=ws://host/ws` links. A Nordic UART peripheral is only compatible if it
bridges CRSF frames and supports writes with response. No device firmware is
changed by this project.

BLE writes are serialized in 20-byte chunks for compatibility with ATT MTU 23.
Notifications feed the QUIC stream parser; BLE packet boundaries do not need to
match QUIC packet boundaries. CRSF framing, acknowledgment, and retransmission
are shared between WebSocket and BLE. Polling is limited to one pending poll,
with a slower interval for BLE and radio links. A reboot reconnects to the same
BLE device within the current session. Backgrounding the app closes its
connection and requires an explicit reconnect.

Profile, diagnostic-log, and blackbox exports use the native share sheet. Profile
imports use the system file picker through the existing file input. Native Wi-Fi
bridges may use `ws://` on a local network: Android permits cleartext traffic and
mixed content, and iOS permits it in web content and declares local-network use.
Use `wss://` when the bridge supports it. These permissions do not bypass browser
mixed-content rules in the web build.

```sh
npm run test:serial
npm run test:ui
npm run build:mobile
npm run build:vue
npm run build:electron
```

Before releasing, validate on physical iOS and Android devices: permission denial,
scan/cancel, profile read/write, reboot, disconnect mid-write, background/resume,
file import/share, and large blackbox downloads. A successful build or mocked BLE
test does not establish peripheral compatibility or radio reliability.
