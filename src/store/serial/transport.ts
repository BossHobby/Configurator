/** An ordered, duplex byte stream. Framing belongs to the protocol layer. */
export interface ByteTransport {
  connect(
    onData: (data: Uint8Array) => void,
    onClose: (error: unknown) => void,
  ): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

export class WebSocketTransport implements ByteTransport {
  private socket?: WebSocket;
  private cancelOpen?: (error: Error) => void;
  constructor(private url: string) {}

  connect(
    onData: (data: Uint8Array) => void,
    onClose: (error: unknown) => void,
  ) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;
      socket.binaryType = "arraybuffer";
      const deadline = setTimeout(() => {
        reject(new Error("WebSocket connection timed out"));
        void this.close();
      }, 10_000);
      this.cancelOpen = (error) => {
        clearTimeout(deadline);
        reject(error);
      };
      socket.onopen = () => {
        clearTimeout(deadline);
        this.cancelOpen = undefined;
        resolve();
      };
      socket.onmessage = (event) => onData(new Uint8Array(event.data));
      socket.onerror = () => {
        const error = new Error("WebSocket connection failed");
        clearTimeout(deadline);
        reject(error);
        onClose(error);
      };
      socket.onclose = () => {
        const error = new Error("WebSocket disconnected");
        clearTimeout(deadline);
        reject(error);
        onClose(error);
      };
    });
  }

  async write(data: Uint8Array) {
    if (this.socket?.readyState !== WebSocket.OPEN)
      throw new Error("WebSocket is disconnected");
    this.socket.send(data.slice().buffer);
  }

  async close() {
    this.cancelOpen?.(new Error("Connection cancelled"));
    this.cancelOpen = undefined;
    if (this.socket) {
      this.socket.onopen =
        this.socket.onmessage =
        this.socket.onclose =
        this.socket.onerror =
          null;
      this.socket.close();
      this.socket = undefined;
    }
  }
}
