const isAndroid = /(android)/i.test(navigator.userAgent);

const androidSerialSettings = {
  baudRate: 921600,
  bufferSize: 4 * 1024 * 1024,
  updateInterval: 1000,
};

const desktopSerialSettings = {
  baudRate: 921600,
  bufferSize: 4 * 1024 * 1024,
  updateInterval: 250,
};

export const settings = {
  websocketUrl() {
    return new URL(document.location.toString()).searchParams.get("ws");
  },
  // CRSF WebSocket reaching the flight controller over the radio link,
  // e.g. ?crsf=ws://192.168.4.1/ws for a TBS Crossfire WiFi module.
  crsfUrl() {
    return new URL(document.location.toString()).searchParams.get("crsf");
  },
  // The radio link carries roughly 1 kB/s, so poll far less often.
  updateInterval() {
    return this.crsfUrl() ? 2000 : this.serial.updateInterval;
  },
  serial: isAndroid ? androidSerialSettings : desktopSerialSettings,
};
