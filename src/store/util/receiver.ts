// Profile 0.3.1 selects serial receiver protocols directly in
// receiver.protocol. Before it, protocol 1 (unified serial) kept the serial
// protocol in bind.raw[0], and bind data was only persisted with bind_saved.

const RX_PROTOCOL_INVALID = 0;
const RX_PROTOCOL_SERIAL_AUTO = 1;
const RX_PROTOCOL_UNIFIED_SERIAL_V030 = 1;
const RX_PROTOCOL_BAYANG_FIRST_V030 = 7;
const RX_PROTOCOL_FRSKY_D8_V030 = 10;
const RX_PROTOCOL_MAX_V030 = 17;

// Old serial protocol (bind.raw[0]) to [protocol, invert]. Zero autodetects.
const SERIAL_PROTOCOLS_V030: [number, number][] = [
  [RX_PROTOCOL_SERIAL_AUTO, 0],
  [6, 0], // DSM
  [2, 0], // SBUS
  [4, 0], // IBUS
  [5, 0], // FPORT
  [3, 0], // CRSF
  [7, 0], // REDPINE_SERIAL
  [2, 1], // SBUS_INVERTED
  [5, 1], // FPORT_INVERTED
  [7, 1], // REDPINE_INVERTED
  [8, 0], // MAVLINK
];

export function migrateReceiverV031(receiver: any) {
  const bind = receiver.bind || {};
  const raw = new Uint8Array(bind.raw || []);
  // Firmware cleared unsaved bind data on its next save.
  if (!bind.bind_saved) raw.fill(0);

  const protocol = receiver.protocol ?? RX_PROTOCOL_INVALID;
  let invert = 0;
  let migrated = protocol;
  if (protocol == RX_PROTOCOL_UNIFIED_SERIAL_V030) {
    [migrated, invert] = SERIAL_PROTOCOLS_V030[raw[0]] ?? [
      RX_PROTOCOL_SERIAL_AUTO,
      0,
    ];
    raw.fill(0);
  } else if (protocol >= RX_PROTOCOL_MAX_V030) {
    migrated = RX_PROTOCOL_INVALID;
  } else if (protocol >= RX_PROTOCOL_FRSKY_D8_V030) {
    // SPI protocols move down past the three retired Bayang entries.
    migrated = protocol - 1;
  } else if (protocol >= RX_PROTOCOL_BAYANG_FIRST_V030) {
    migrated = RX_PROTOCOL_INVALID;
  }

  return {
    ...receiver,
    protocol: migrated,
    invert,
    bind: { raw },
  };
}
