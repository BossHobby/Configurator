# Changelog

## v0.9.2

changes since 0.9.1:

- preview the Betaflight throttle curve for firmware using profile 0.2.6 and newer
- osd: add watts element for firmware using profile 0.2.7 and newer
- add LSM6DSO, LSM6DSV16X, LSM6DSK320X gyro names
- serial: increase connect timeout and flush pending data before connecting
- serial: ignore errors from stale commands
- quic: fix flag check
- osd: fix HD element position setter
- profile migration: handle missing OSD elements
- blackbox: prefix downloaded files with QUIC
- fix service worker cache expiration matching
- fix develop version check
- add tooltips for OSD profile switching and dynamic notch filtering

Includes support for QUICKSILVER v0.11.3. Older firmware keeps its original throttle preview and OSD element list.

## v0.9.1

- various smaller improvements and bug fixes
- reduce page size to improve load speed
- update dependencies
- add better aux state indicators
- add support for upcoming osd profile feature

## v0.9.0

- update all dependencies to their latest version
- use browser native stream interface for serial communication
- reduce min elrsBindPhraseInput length
- prepare for new osd elements

## v0.8.0

- flash: display commit for branches
- improve serial connection performance
- add prop direction preview
- make esc settings order match pin assignments (thanks @kikoqiu)
- add warning about unsupported browsers
- rework receiver protocol selection

## v0.7.3

- do not select release candidates for flashing by default
- stick rates: fix bf super rate calculation
- remove log tab, add icon to download log file instead
- add support for 4mb flash at32 chip variants (at32f435m)
- catch false-positive error at flash exit

## v0.7.2

- more robust hex lookup
- improve navbar for mobile use (thanks @kikoqiu)
- fix bug in serial library for mobile devices (thanks @kikoqiu)
- stickrates: add input limits
- blackbox: mark setpoint as rad/s
- **fix bug in aliased runtime target handling**

**the last point is breaking for versions 0.10.0 and later, so please make sure the configurator says 0.7.2 before you proceed.**
older firmware versions are not affected.

## v0.7.1

- lock inputs while flashing
- ensure connect timeout is reset
- motor test: integrate with firmware changes to come to a full stop
- improve tda labels
- add profile migration for upcoming firmware changes
- flash: display current target after reset (needs firmware update)
- add option to save/load stick rates independently

## v0.7.0

- make logged blackbox fields configurable (thanks @sakitume)
- ensure btfl file compatibility with PIDToolbox
- add support for flashing development hexes directly from the configurator
- add support for runtime targets
- add support for at32 device ids
- use service-worker to cache requests to github

## v0.6.5

- update to vite 3
- switch from nw.js to electron

## v0.6.4

- completely rework template system & allow of configuration of options
- allow drag & drop configuration for osd elements, thanks @damian-kolakowski
- rework osd preview render, now uses actual osd font
- allow configuration of power level labels

## v0.6.3

_this version was never released as standalone, here for reference._

## v0.6.2

- disable gyro name instead of id
- fix import of outdated templates
- update tooltips
- add msp vtx support (fw support pending)
- align motors in ESCSettings with configured pins
- switch to gh workflows instead of my self-hosted ci

## v0.5.4

- integrate with fw-side blackbox changes
- add presets for serial pass-through

## v0.5.3

- add option to save and load bind data for spi receivers (frysky, redpine)
- blackbox improvments
- adds filter option pt3
- fix pt1 and pt2 name

## v0.5.0

Add internal structure to migrate between profile versions.

## v0.4.6

- add tooltips across the applications
- improve osd interface to display the font about to be uploaded
- improve pwa update procedure
- display warnings for unsaved changes and keys that require reboot
