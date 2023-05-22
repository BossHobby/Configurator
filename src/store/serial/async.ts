import { settings } from "./settings";

export class AsyncSemaphore {
  private promises = Array<() => void>();

  constructor(private permits: number) {}

  signal() {
    this.permits += 1;
    if (this.promises.length > 0) this.promises.pop()!();
  }

  async wait() {
    this.permits -= 1;
    if (this.permits < 0 || this.promises.length > 0)
      await new Promise<void>((r) => this.promises.unshift(r));
  }
}

const QUEUE_BUFFER_SIZE = settings.serial.bufferSize;

interface AsyncResolver {
  id: number;
  fn: (Uint8Array) => void;
  size: number;
}

export class AsyncQueue {
  private _resolverId = 1;
  private _resolvers: AsyncResolver[] = [];

  private _buffer = new Uint8Array(QUEUE_BUFFER_SIZE);
  private _head = 0;
  private _tail = 0;

  private _done?: Promise<void>;
  private _abort = new AbortController();

  private get _read_len() {
    if (this._head == this._tail) {
      return 0;
    }
    if (this._head > this._tail) {
      return this._head - this._tail;
    }
    return QUEUE_BUFFER_SIZE - this._tail + this._head;
  }

  constructor(private readable: ReadableStream, errorCallback: any) {
    this._done = readable
      .pipeTo(
        new WritableStream(
          {
            write: this.write.bind(this),
          },
          new ByteLengthQueuingStrategy({ highWaterMark: 1024 })
        ),
        { signal: this._abort.signal }
      )
      .catch((err) => {
        if (err != "close") {
          errorCallback(err);
        }
      });
  }

  async close() {
    this._abort.abort("close");
    await this._done;
    this.readable.cancel();
  }

  private async write(
    array: Uint8Array,
    controller?: WritableStreamDefaultController
  ) {
    for (const v of array) {
      const next = (this._head + 1) % QUEUE_BUFFER_SIZE;
      if (next == this._tail) {
        controller?.error("queue full");
        throw new Error("queue full");
      }
      this._buffer[this._head] = v;
      this._head = next;
    }

    if (this._resolvers.length) {
      const resolver = this._resolvers[0];
      if (this._read_len >= resolver.size) {
        resolver.fn(this._read(resolver.size));
        this._resolvers.shift();
      }
    }
  }

  private _defer(size: number, timeout?: number): Promise<Uint8Array> {
    const id = this._resolverId++;
    const promises = [
      new Promise<Uint8Array>((resolve) => {
        this._resolvers.push({
          id,
          fn: resolve,
          size,
        });
      }),
    ];
    if (timeout) {
      promises.push(
        new Promise<Uint8Array>((resolve, reject) => {
          const timer = setTimeout(() => {
            this._resolvers = this._resolvers.filter((r) => r.id == id);
            clearTimeout(timer);
            reject("timeout");
          }, timeout);
        })
      );
    }
    return Promise.race(promises);
  }

  async pop(timeout: number | undefined): Promise<number> {
    const res = await this.read(1, timeout);
    return res[0];
  }

  async read(size: number, timeout: number | undefined): Promise<Uint8Array> {
    if (size == 0) {
      return new Uint8Array(size);
    }
    if (this._read_len < size) {
      return this._defer(size, timeout);
    }
    return this._read(size);
  }

  private _read(size: number) {
    const buffer = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = this._buffer[this._tail];
      this._tail = (this._tail + 1) % QUEUE_BUFFER_SIZE;
    }
    return buffer;
  }
}
