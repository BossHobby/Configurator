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

The Capacitor apps share the Vue UI with the web and Electron builds. They
connect over Bluetooth or Wi-Fi to a CRSF bridge such as the TBS Crossfire
Wi-Fi module, which carries QUIC over CRSF to the flight controller. USB
serial and firmware flashing remain browser and desktop features.

```sh
npm ci
npm run mobile:sync      # build dist-mobile and sync both native projects
npm run mobile:android   # open Android Studio
npm run mobile:ios       # open Xcode
```

Android requires JDK 21 and Android SDK 36; iOS requires Xcode and a signing
team selected in the App target. Launcher icons and splash screens are
generated from `assets/` with `npx @capacitor/assets generate --ios --android`.
