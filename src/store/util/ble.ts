// The TBS Crossfire Wi-Fi module's Bluetooth "Serial" mode exposes the Nordic
// UART service. A first write that does not start with '$' (MSP) selects its
// raw CRSF bridge, the same stream as the /ws WebSocket.
//
// The module, TBS Agent and Betaflight Configurator write ...0003 and
// subscribe to ...0002, the reverse of Nordic's own layout. Keep it that way:
// it is what the module serves. Bridges with Nordic's layout still work, as
// the characteristics are picked by their properties.
export const UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_NOTIFY = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_WRITE = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

interface Characteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
}

/** Picks the write and notify characteristics, preferring the module's. */
export function resolveEndpoints<T extends Characteristic>(
  characteristics: T[],
): { write: T; notify: T } {
  const pick = (preferred: string, usable: (c: T) => boolean) =>
    characteristics.find(
      (c) => c.uuid.toLowerCase() == preferred && usable(c),
    ) ?? characteristics.find(usable);
  const write = pick(
    UART_WRITE,
    (c) => c.properties.write || c.properties.writeWithoutResponse,
  );
  const notify = pick(
    UART_NOTIFY,
    (c) => c.properties.notify || c.properties.indicate,
  );
  if (!write || !notify) {
    throw new Error("Bluetooth device has no usable UART characteristics");
  }
  return { write, notify };
}
